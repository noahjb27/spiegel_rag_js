# backend/app/services/search_service.py
# ==============================================================================
# Centralized Service Layer for Search and Analysis.
#
# This class encapsulates the SpiegelRAG engine and all related logic from
# your original 'handlers'. By centralizing it here, our API routes in the
# 'api' folder become very clean and simple. They just need to call methods
# on this service. This is a robust and testable design pattern.
# ==============================================================================

import logging
import time
from typing import Dict, Any, List, Optional, Tuple
from langchain.docstore.document import Document

# Adjust imports to the new structure
from ..core.engine import SpiegelRAG
from ..core.search.strategies import StandardSearchStrategy, SearchConfig
from ..core.search.enhanced_time_window_strategy import EnhancedTimeWindowSearchStrategy
from ..core.search.agent_strategy import TimeWindowedAgentStrategy, AgentSearchConfig
from .trace_service import get_trace_service

logger = logging.getLogger(__name__)

class SearchService:
    """A service class that encapsulates all search and analysis logic."""

    def __init__(self):
        """Initializes the service and the underlying SpiegelRAG engine."""
        logger.info("Instantiating SpiegelRAG engine within SearchService...")
        self.rag_engine = SpiegelRAG()
        logger.info("SpiegelRAG engine ready.")

    def standard_search(self, search_params: Dict[str, Any]) -> Dict[str, Any]:
        """
        Performs a standard or time-interval-based search.
        This combines the logic of 'perform_retrieval' from your original handlers.
        """
        start_time = time.time()
        
        # Extract parameters
        use_time_intervals = search_params.get('use_time_intervals', False)
        
        # Create search configuration from input parameters
        config = SearchConfig(
            content_description=search_params.get('retrieval_query', ''),
            year_range=(search_params.get('year_start'), search_params.get('year_end')),
            chunk_size=search_params.get('chunk_size'),
            keywords=search_params.get('keywords'),
            search_fields=search_params.get('search_in'),
            enforce_keywords=True,
            top_k=search_params.get('top_k', 10)
        )

        # Choose the correct search strategy
        if use_time_intervals:
            logger.info("Using EnhancedTimeWindowSearchStrategy")
            strategy = EnhancedTimeWindowSearchStrategy(
                interval_size=search_params.get('time_interval_size', 5),
                chunks_per_interval=search_params.get('chunks_per_interval', 5)
            )
        else:
            logger.info("Using StandardSearchStrategy")
            strategy = StandardSearchStrategy()

        # Execute the search
        search_result = self.rag_engine.search(
            strategy=strategy,
            config=config,
            use_semantic_expansion=search_params.get('use_semantic_expansion', False)
        )
        
        retrieval_time = time.time() - start_time

        # Format results into a JSON-serializable dictionary
        chunks_for_ui = [
            {'content': doc.page_content, 'metadata': doc.metadata, 'relevance_score': score}
            for doc, score in search_result.chunks
        ]

        results = {
            'chunks': chunks_for_ui,
            'metadata': {
                'search_time': retrieval_time,
                'total_chunks_found': len(chunks_for_ui),
                **search_result.metadata
            }
        }
        return results

    def llm_assisted_search(self, search_params: Dict[str, Any]) -> Dict[str, Any]:
        """
        Performs an LLM-assisted search.
        This adapts the logic from 'perform_llm_assisted_search' in your agent handlers.
        """
        start_time = time.time()
        
        # Create search and agent configurations
        search_config = SearchConfig(
            content_description=search_params.get('retrieval_query'),
            year_range=(search_params.get('year_start'), search_params.get('year_end')),
            chunk_size=search_params.get('chunk_size'),
            keywords=search_params.get('llm_assisted_keywords'),
            search_fields=search_params.get('llm_assisted_search_in'),
            enforce_keywords=True,
            top_k=200 # A high k for initial retrieval
        )

        agent_config = AgentSearchConfig(
            use_time_windows=search_params.get('llm_assisted_use_time_intervals'),
            time_window_size=search_params.get('llm_assisted_time_interval_size'),
            chunks_per_window_initial=search_params.get('chunks_per_interval_initial'),
            chunks_per_window_final=search_params.get('chunks_per_interval_final'),
            agent_model=search_params.get('llm_assisted_model'),
            agent_system_prompt=search_params.get('llm_assisted_system_prompt_text'),
            min_retrieval_relevance_score=search_params.get('llm_assisted_min_retrieval_score'),
            evaluation_temperature=search_params.get('llm_assisted_temperature', 0.1)
        )
        
        strategy = TimeWindowedAgentStrategy(
            llm_service=self.rag_engine.llm_service, 
            agent_config=agent_config
        )

        # Execute search
        search_result = strategy.search(
            config=search_config,
            vector_store=self.rag_engine.vector_store
        )
        
        search_time = time.time() - start_time
        
        # Format results, ensuring dual scores are included
        chunks_for_ui = []
        for doc, llm_score in search_result.chunks:
            chunks_for_ui.append({
                'content': doc.page_content,
                'metadata': doc.metadata,
                'relevance_score': doc.metadata.get('vector_similarity_score', llm_score),
                'vector_similarity_score': doc.metadata.get('vector_similarity_score', 0.0),
                'llm_evaluation_score': doc.metadata.get('llm_evaluation_score', llm_score),
                'llm_evaluation_text': doc.metadata.get('evaluation_text', '')
            })

        results = {
            'chunks': chunks_for_ui,
            'metadata': {
                'search_time': search_time,
                'total_chunks_found': len(chunks_for_ui),
                **search_result.metadata
            }
        }
        return results

    def perform_analysis(self, analysis_params: Dict[str, Any]) -> Dict[str, Any]:
        """
        Performs analysis on a given set of chunks.
        Adapts 'perform_analysis' from your original handlers.
        """
        start_time = time.time()
        
        # Convert the received chunk data back into Document objects
        documents = [
            Document(page_content=chunk['content'], metadata=chunk['metadata'])
            for chunk in analysis_params.get('chunks_to_analyze', [])
        ]

        if not documents:
            raise ValueError("No chunks provided for analysis.")

        # Call the core analysis engine with GPT-5 parameters
        analysis_result = self.rag_engine.analyze(
            question=analysis_params.get('user_prompt'),
            chunks=documents,
            model=analysis_params.get('model_selection'),
            system_prompt=analysis_params.get('system_prompt_text'),
            temperature=analysis_params.get('temperature', 0.3),
            reasoning_effort=analysis_params.get('reasoning_effort'),
            verbosity=analysis_params.get('verbosity')
        )

        analysis_time = time.time() - start_time

        # Build response metadata
        response_metadata = {
            'analysis_time': analysis_time,
            'model_used': analysis_result.model,
            'chunks_analyzed_count': len(documents)
        }

        # Include GPT-5 specific parameters and reasoning content from analysis result
        if analysis_result.metadata.get('reasoning_effort'):
            response_metadata['reasoning_effort'] = analysis_result.metadata['reasoning_effort']
        if analysis_result.metadata.get('verbosity'):
            response_metadata['verbosity'] = analysis_result.metadata['verbosity']
        if analysis_result.metadata.get('has_reasoning_content'):
            response_metadata['has_reasoning_content'] = True
            response_metadata['reasoning_content'] = analysis_result.metadata['reasoning_content']

        # Save full analysis trace for download
        try:
            trace_service = get_trace_service()
            trace_filename = trace_service.save_analysis_trace(
                answer=analysis_result.answer,
                metadata=response_metadata,
                chunks=analysis_params.get('chunks_to_analyze', []),
                analysis_params=analysis_params
            )
            response_metadata['reasoning_trace_filename'] = trace_filename
            logger.info(f"Saved analysis trace: {trace_filename}")
        except Exception as e:
            logger.error(f"Failed to save analysis trace: {e}")
            # Don't fail the request if trace saving fails

        # Return a structured dictionary
        return {
            'answer': analysis_result.answer,
            'metadata': response_metadata
        }

    def expand_keywords(self, expression: str, factor: int) -> Dict[str, List[Dict[str, Any]]]:
        """
        Expands keywords using the embedding service and ensures all numeric
        types are JSON serializable.
        """
        if not self.rag_engine.embedding_service:
            raise ConnectionError("Embedding service is not available.")
        
        import re
        terms = re.findall(r'\b(?!AND|OR|NOT\b)[a-zA-ZäöüÄÖÜß]+\b', expression, re.IGNORECASE)
        if not terms:
            return {}

        expanded_words_data = {}
        for term in set(terms):
            term_clean = term.lower().strip()
            similar_words_info = self.rag_engine.embedding_service.find_similar_words(term_clean, top_n=factor)
            
            # --- THIS IS THE FIX ---
            # Create a new list with standard Python types
            sanitized_list = []
            for item in similar_words_info:
                sanitized_list.append({
                    'word': item['word'],
                    # Convert numpy.float32 to standard Python float
                    'similarity': float(item['similarity']), 
                    # Convert numpy.int64 to standard Python int
                    'frequency': int(item.get('frequency', 0)) 
                })
            
            expanded_words_data[term_clean] = sanitized_list

        return expanded_words_data

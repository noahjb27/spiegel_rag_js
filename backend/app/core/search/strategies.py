# src/core/search/strategies.py - Fixed version
"""
Search strategy implementations following the Strategy pattern.
Each strategy encapsulates a different search approach.
"""
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Tuple, Any, Callable
import logging
import time

from langchain.docstore.document import Document

logger = logging.getLogger(__name__)



@dataclass
class SearchConfig:
    """Unified configuration for all search types with consistent field names"""
    content_description: str
    year_range: Tuple[int, int] = (1948, 1979)
    chunk_size: int = 3000
    keywords: Optional[str] = None
    search_fields: List[str] = field(default_factory=lambda: ["Text"])
    enforce_keywords: bool = True
    top_k: int = 10
    min_relevance_score: float = 0.3
    
    # Add compatibility property for legacy code
    @property
    def search_in(self) -> List[str]:
        """Compatibility property for legacy code that uses 'search_in'"""
        return self.search_fields
    
    @search_in.setter
    def search_in(self, value: List[str]):
        """Compatibility setter for legacy code"""
        self.search_fields = value

@dataclass
class SearchResult:
    """Unified result structure"""
    chunks: List[Document]
    metadata: Dict[str, Any]
    
    @property
    def chunk_count(self) -> int:
        return len(self.chunks)


class SearchStrategy(ABC):
    """Base class for all search strategies"""
    
    @abstractmethod
    def search(self, 
              config: SearchConfig, 
              vector_store: Any,
              progress_callback: Optional[Callable[[str, float], None]] = None) -> SearchResult:
        """
        Execute search with this strategy.
        
        Args:
            config: Search configuration
            vector_store: Vector store interface
            progress_callback: Optional callback for progress updates
            
        Returns:
            SearchResult with chunks and metadata
        """
        pass
    
    def _build_metadata_filter(self, 
                              vector_store: Any,
                              year_range: Tuple[int, int]) -> Optional[Dict]:
        """Build metadata filter for year range"""
        return vector_store.build_metadata_filter(
            year_range=list(year_range),
            keywords=None,
            search_in=None
        )


class StandardSearchStrategy(SearchStrategy):
    """Simple similarity search - the most basic strategy"""
    
    def search(self, 
              config: SearchConfig, 
              vector_store: Any,
              progress_callback: Optional[Callable] = None) -> SearchResult:
        """Execute standard similarity search"""
        
        start_time = time.time()
        
        if progress_callback:
            progress_callback("Starting standard search...", 0.0)
        
        # Build filter
        filter_dict = self._build_metadata_filter(vector_store, config.year_range)
        
        # Execute search
        chunks = vector_store.similarity_search(
            query=config.content_description,
            chunk_size=config.chunk_size,
            k=config.top_k,
            filter_dict=filter_dict,
            min_relevance_score=config.min_relevance_score,
            keywords=config.keywords,
            search_in=config.search_fields,
            enforce_keywords=config.enforce_keywords
        )
        
        if progress_callback:
            progress_callback(f"Found {len(chunks)} chunks", 1.0)
        
        search_time = time.time() - start_time
        
        return SearchResult(
            chunks=chunks,
            metadata={
                "strategy": "standard",
                "search_time": search_time,
                "config": {
                    "year_range": config.year_range,
                    "chunk_size": config.chunk_size,
                    "keywords": config.keywords
                }
            }
        )
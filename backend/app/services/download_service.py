# backend/app/services/download_service.py
# ==============================================================================
# Service for Generating Downloadable Files
#
# This file contains the logic adapted from your original 'download_handlers.py'.
# It is responsible for creating temporary JSON and CSV files from search results.
# ==============================================================================

import json
import csv
import os
import tempfile
import logging
from datetime import datetime
from typing import Dict, Optional, Any

logger = logging.getLogger(__name__)

def create_json_file(retrieved_chunks: Optional[Dict[str, Any]]) -> Optional[str]:
    """
    Creates a temporary JSON file from retrieved chunks.

    Args:
        retrieved_chunks: The search result data.

    Returns:
        The file path to the temporary file, or None if creation fails.
    """
    try:
        if not retrieved_chunks or not retrieved_chunks.get('chunks'):
            logger.warning("No chunks available for JSON download")
            return None
        
        # Create a temporary file that will be cleaned up by the OS
        temp_file = tempfile.NamedTemporaryFile(
            mode='w', 
            suffix='.json', 
            prefix='spiegel_rag_export_',
            delete=False, # We need to keep the file until it's sent
            encoding='utf-8'
        )
        
        json.dump(retrieved_chunks, temp_file, ensure_ascii=False, indent=2)
        temp_file.close()
        
        logger.info(f"Created JSON download at {temp_file.name}")
        return temp_file.name
        
    except Exception as e:
        logger.error(f"Error creating JSON download file: {e}", exc_info=True)
        return None

def create_csv_file(retrieved_chunks: Optional[Dict[str, Any]]) -> Optional[str]:
    """
    Creates a temporary CSV file from retrieved chunks.

    Args:
        retrieved_chunks: The search result data.

    Returns:
        The file path to the temporary file, or None if creation fails.
    """
    try:
        if not retrieved_chunks or not retrieved_chunks.get('chunks'):
            logger.warning("No chunks available for CSV download")
            return None

        chunks_data = retrieved_chunks.get('chunks', [])
        has_dual_scores = 'llm_evaluation_score' in chunks_data[0] if chunks_data else False
        
        temp_file = tempfile.NamedTemporaryFile(
            mode='w', 
            suffix='.csv', 
            prefix='spiegel_rag_export_',
            delete=False,
            encoding='utf-8-sig', # BOM for Excel compatibility
            newline=''
        )
        
        writer = csv.writer(temp_file, delimiter=',', quotechar='"', quoting=csv.QUOTE_ALL)
        
        # Define headers
        if has_dual_scores:
            headers = ['chunk_id', 'relevance_score', 'vector_similarity_score', 'llm_evaluation_score', 'llm_evaluation_text', 'title', 'date', 'url', 'content']
        else:
            headers = ['chunk_id', 'relevance_score', 'title', 'date', 'url', 'content']
        writer.writerow(headers)
        
        # Write data
        for i, chunk in enumerate(chunks_data):
            metadata = chunk.get('metadata', {})
            row = [
                i + 1,
                chunk.get('relevance_score', 0.0),
            ]
            if has_dual_scores:
                 row.extend([
                    chunk.get('vector_similarity_score', 0.0),
                    chunk.get('llm_evaluation_score', 0.0),
                    chunk.get('llm_evaluation_text', '')
                 ])
            row.extend([
                metadata.get('Artikeltitel', 'N/A'),
                metadata.get('Datum', 'N/A'),
                metadata.get('URL', 'N/A'),
                chunk.get('content', '')
            ])
            writer.writerow(row)
            
        temp_file.close()
        logger.info(f"Created CSV download at {temp_file.name}")
        return temp_file.name

    except Exception as e:
        logger.error(f"Error creating CSV download file: {e}", exc_info=True)
        return None

"""
Service for managing analysis trace files for download.
Handles creation, storage, and cleanup of reasoning traces.
"""

import os
import json
import time
import logging
from typing import Dict, Any, Optional
from datetime import datetime
import uuid

logger = logging.getLogger(__name__)

# Directory to store trace files (relative to backend root)
TRACE_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "temp", "traces")

# Maximum age of trace files in seconds (1 hour)
MAX_TRACE_AGE = 3600


class TraceService:
    """Service for managing analysis trace files."""

    def __init__(self):
        """Initialize the trace service and ensure trace directory exists."""
        self._ensure_trace_directory()

    def _ensure_trace_directory(self):
        """Create the trace directory if it doesn't exist."""
        os.makedirs(TRACE_DIR, exist_ok=True)
        logger.info(f"Trace directory ready: {TRACE_DIR}")

    def save_analysis_trace(
        self,
        answer: str,
        metadata: Dict[str, Any],
        chunks: list,
        analysis_params: Dict[str, Any]
    ) -> str:
        """
        Save a complete analysis trace to a file.

        Args:
            answer: The LLM's answer text
            metadata: Analysis metadata including reasoning_content
            chunks: The chunks that were analyzed
            analysis_params: Original analysis parameters

        Returns:
            The filename of the saved trace
        """
        # Generate unique filename
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        unique_id = str(uuid.uuid4())[:8]
        filename = f"analysis_trace_{timestamp}_{unique_id}.json"
        filepath = os.path.join(TRACE_DIR, filename)

        # Build trace data
        trace_data = {
            "timestamp": datetime.now().isoformat(),
            "analysis": {
                "question": analysis_params.get('user_prompt'),
                "answer": answer,
                "model": metadata.get('model_used'),
                "temperature": analysis_params.get('temperature'),
                "system_prompt": analysis_params.get('system_prompt_text', ''),
            },
            "parameters": {
                "reasoning_effort": metadata.get('reasoning_effort'),
                "verbosity": metadata.get('verbosity'),
            },
            "reasoning": {
                "has_reasoning_content": metadata.get('has_reasoning_content', False),
                "reasoning_content": metadata.get('reasoning_content', '')
            },
            "chunks": [
                {
                    "content": chunk['content'],
                    "metadata": chunk['metadata'],
                    "relevance_score": chunk.get('relevance_score', 0)
                }
                for chunk in chunks
            ],
            "statistics": {
                "chunks_analyzed": len(chunks),
                "analysis_time": metadata.get('analysis_time', 0)
            }
        }

        # Save to file
        try:
            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(trace_data, f, ensure_ascii=False, indent=2)
            logger.info(f"Saved analysis trace: {filename}")
            return filename
        except Exception as e:
            logger.error(f"Failed to save trace file {filename}: {e}")
            raise

    def get_trace_path(self, filename: str) -> Optional[str]:
        """
        Get the full path to a trace file if it exists.

        Args:
            filename: The trace filename

        Returns:
            Full path to the file, or None if not found
        """
        filepath = os.path.join(TRACE_DIR, filename)
        if os.path.exists(filepath):
            return filepath
        return None

    def cleanup_old_traces(self, max_age_seconds: int = MAX_TRACE_AGE):
        """
        Delete trace files older than max_age_seconds.

        Args:
            max_age_seconds: Maximum age of files to keep (default: 1 hour)
        """
        try:
            current_time = time.time()
            deleted_count = 0

            for filename in os.listdir(TRACE_DIR):
                filepath = os.path.join(TRACE_DIR, filename)

                # Skip if not a file
                if not os.path.isfile(filepath):
                    continue

                # Check file age
                file_age = current_time - os.path.getmtime(filepath)
                if file_age > max_age_seconds:
                    os.remove(filepath)
                    deleted_count += 1
                    logger.debug(f"Deleted old trace file: {filename} (age: {file_age:.0f}s)")

            if deleted_count > 0:
                logger.info(f"Cleanup completed: deleted {deleted_count} old trace files")

        except Exception as e:
            logger.error(f"Error during trace cleanup: {e}")


# Singleton instance
_trace_service = None


def get_trace_service() -> TraceService:
    """Get the singleton trace service instance."""
    global _trace_service
    if _trace_service is None:
        _trace_service = TraceService()
    return _trace_service

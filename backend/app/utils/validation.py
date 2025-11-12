# backend/app/utils/validation.py
"""
Input validation utilities for API endpoints.
Provides validation for search parameters, analysis requests, etc.
"""

from typing import Dict, Any, Optional
from app.config import settings


class ValidationError(ValueError):
    """Custom exception for validation errors."""
    pass


def validate_search_params(params: Dict[str, Any]) -> None:
    """
    Validate search parameters.

    Args:
        params: Dictionary of search parameters

    Raises:
        ValidationError: If any parameter is invalid
    """
    # Required fields
    if not params.get('retrieval_query'):
        raise ValidationError("Missing required field: retrieval_query")

    # Query length validation
    query = params['retrieval_query']
    if not isinstance(query, str):
        raise ValidationError("retrieval_query must be a string")

    if len(query) > 10000:
        raise ValidationError("retrieval_query is too long (max 10,000 characters)")

    if len(query.strip()) == 0:
        raise ValidationError("retrieval_query cannot be empty")

    # Chunk size validation
    chunk_size = params.get('chunk_size')
    if chunk_size is not None:
        if not isinstance(chunk_size, int):
            raise ValidationError("chunk_size must be an integer")
        if chunk_size not in settings.AVAILABLE_CHUNK_SIZES:
            raise ValidationError(
                f"chunk_size must be one of {settings.AVAILABLE_CHUNK_SIZES}"
            )

    # Top k validation
    top_k = params.get('top_k', 10)
    if not isinstance(top_k, int):
        raise ValidationError("top_k must be an integer")
    if top_k < 1 or top_k > 100:
        raise ValidationError("top_k must be between 1 and 100")

    # Year range validation
    year_start = params.get('year_start')
    year_end = params.get('year_end')

    if year_start is not None:
        if not isinstance(year_start, int):
            raise ValidationError("year_start must be an integer")
        if year_start < settings.MIN_YEAR or year_start > settings.MAX_YEAR:
            raise ValidationError(
                f"year_start must be between {settings.MIN_YEAR} and {settings.MAX_YEAR}"
            )

    if year_end is not None:
        if not isinstance(year_end, int):
            raise ValidationError("year_end must be an integer")
        if year_end < settings.MIN_YEAR or year_end > settings.MAX_YEAR:
            raise ValidationError(
                f"year_end must be between {settings.MIN_YEAR} and {settings.MAX_YEAR}"
            )

    if year_start is not None and year_end is not None:
        if year_start > year_end:
            raise ValidationError("year_start cannot be greater than year_end")

    # Keywords validation (if provided)
    keywords = params.get('keywords')
    if keywords is not None and keywords != '':
        if not isinstance(keywords, str):
            raise ValidationError("keywords must be a string")
        if len(keywords) > 5000:
            raise ValidationError("keywords are too long (max 5,000 characters)")

    # Time interval validation
    use_time_intervals = params.get('use_time_intervals', False)
    if use_time_intervals:
        time_interval_size = params.get('time_interval_size')
        if time_interval_size is not None:
            if not isinstance(time_interval_size, int):
                raise ValidationError("time_interval_size must be an integer")
            if time_interval_size < 1 or time_interval_size > 50:
                raise ValidationError("time_interval_size must be between 1 and 50")

        chunks_per_interval = params.get('chunks_per_interval')
        if chunks_per_interval is not None:
            if not isinstance(chunks_per_interval, int):
                raise ValidationError("chunks_per_interval must be an integer")
            if chunks_per_interval < 1 or chunks_per_interval > 50:
                raise ValidationError("chunks_per_interval must be between 1 and 50")


def validate_llm_assisted_params(params: Dict[str, Any]) -> None:
    """
    Validate LLM-assisted search parameters.

    Args:
        params: Dictionary of search parameters

    Raises:
        ValidationError: If any parameter is invalid
    """
    # First validate common search params
    validate_search_params(params)

    # LLM model validation
    llm_model = params.get('llm_model')
    if llm_model is not None:
        if not isinstance(llm_model, str):
            raise ValidationError("llm_model must be a string")
        if llm_model not in settings.AVAILABLE_LLM_MODELS:
            raise ValidationError(
                f"llm_model must be one of {settings.AVAILABLE_LLM_MODELS}"
            )

    # Temperature validation
    temperature = params.get('temperature')
    if temperature is not None:
        if not isinstance(temperature, (int, float)):
            raise ValidationError("temperature must be a number")
        if temperature < 0 or temperature > 2:
            raise ValidationError("temperature must be between 0 and 2")


def validate_analysis_params(params: Dict[str, Any]) -> None:
    """
    Validate analysis parameters.

    Args:
        params: Dictionary of analysis parameters

    Raises:
        ValidationError: If any parameter is invalid
    """
    # Required fields
    if not params.get('user_prompt'):
        raise ValidationError("Missing required field: user_prompt")

    if not params.get('chunks_to_analyze'):
        raise ValidationError("Missing required field: chunks_to_analyze")

    # User prompt validation
    user_prompt = params['user_prompt']
    if not isinstance(user_prompt, str):
        raise ValidationError("user_prompt must be a string")

    if len(user_prompt) > 10000:
        raise ValidationError("user_prompt is too long (max 10,000 characters)")

    if len(user_prompt.strip()) == 0:
        raise ValidationError("user_prompt cannot be empty")

    # Chunks validation
    chunks = params['chunks_to_analyze']
    if not isinstance(chunks, list):
        raise ValidationError("chunks_to_analyze must be a list")

    if len(chunks) == 0:
        raise ValidationError("chunks_to_analyze cannot be empty")

    if len(chunks) > 500:
        raise ValidationError("Too many chunks to analyze (max 500)")

    # Validate each chunk has required fields
    for i, chunk in enumerate(chunks):
        if not isinstance(chunk, dict):
            raise ValidationError(f"Chunk {i} is not a valid object")

        if 'content' not in chunk:
            raise ValidationError(f"Chunk {i} is missing required field: content")

        if not isinstance(chunk['content'], str):
            raise ValidationError(f"Chunk {i} content must be a string")

    # LLM model validation
    llm_model = params.get('llm_model')
    if llm_model is not None:
        if not isinstance(llm_model, str):
            raise ValidationError("llm_model must be a string")
        if llm_model not in settings.AVAILABLE_LLM_MODELS:
            raise ValidationError(
                f"llm_model must be one of {settings.AVAILABLE_LLM_MODELS}"
            )

    # Temperature validation
    temperature = params.get('temperature')
    if temperature is not None:
        if not isinstance(temperature, (int, float)):
            raise ValidationError("temperature must be a number")
        if temperature < 0 or temperature > 2:
            raise ValidationError("temperature must be between 0 and 2")


def normalize_string(value: str, max_length: Optional[int] = None) -> str:
    """
    Normalize a string input by trimming whitespace and optionally truncating length.

    Note: This does NOT sanitize against XSS or injection attacks.
    Use appropriate escaping/sanitization at the presentation layer.

    Args:
        value: String to normalize
        max_length: Maximum allowed length (optional)

    Returns:
        Normalized string (trimmed and optionally truncated)
    """
    if not isinstance(value, str):
        return ""

    # Strip whitespace
    normalized = value.strip()

    # Truncate if needed
    if max_length and len(normalized) > max_length:
        normalized = normalized[:max_length]

    return normalized

# backend/app/api/search.py
# ==============================================================================
# API Blueprint for all search and analysis endpoints.
# This file defines the routes like '/api/search/standard' and handles
# the HTTP request/response logic. It calls the central SearchService
# to perform the actual work.
# ==============================================================================

import logging
from flask import Blueprint, request, jsonify, g
from app.utils import (
    ValidationError,
    validate_search_params,
    validate_llm_assisted_params,
    validate_analysis_params
)

logger = logging.getLogger(__name__)

# A Blueprint is a way to organize a group of related views and other code.
bp = Blueprint('search', __name__, url_prefix='/api/search')

@bp.route('/standard', methods=['POST'])
def standard_search():
    """
    Endpoint for standard and time-interval searches.
    Accepts a JSON body with search parameters.
    """
    if not hasattr(g, 'search_service') or g.search_service is None:
        return jsonify({"error": "Search service not available"}), 503

    try:
        search_params = request.get_json()
        if not search_params:
            return jsonify({"error": "Missing request body"}), 400

        # Validate input parameters
        validate_search_params(search_params)

        logger.info(f"Received standard search request with params: {search_params}")
        results = g.search_service.standard_search(search_params)
        return jsonify(results)

    except ValidationError as ve:
        logger.warning(f"Validation error in standard search: {ve}")
        return jsonify({"error": str(ve)}), 400
    except Exception as e:
        logger.error(f"Error during standard search: {e}", exc_info=True)
        return jsonify({"error": "An internal error occurred during search."}), 500

@bp.route('/llm-assisted', methods=['POST'])
def llm_assisted_search():
    """
    Endpoint for LLM-assisted searches.
    """
    if not hasattr(g, 'search_service') or g.search_service is None:
        return jsonify({"error": "Search service not available"}), 503

    try:
        search_params = request.get_json()
        if not search_params:
            return jsonify({"error": "Missing request body"}), 400

        # Validate input parameters
        validate_llm_assisted_params(search_params)

        logger.info(f"Received LLM-assisted search request with params: {search_params}")
        results = g.search_service.llm_assisted_search(search_params)
        return jsonify(results)

    except ValidationError as ve:
        logger.warning(f"Validation error in LLM-assisted search: {ve}")
        return jsonify({"error": str(ve)}), 400
    except Exception as e:
        logger.error(f"Error during LLM-assisted search: {e}", exc_info=True)
        return jsonify({"error": "An internal error occurred during LLM-assisted search."}), 500

@bp.route('/analyze', methods=['POST'])
def analyze():
    """
    Endpoint for performing analysis on a set of selected chunks.
    """
    if not hasattr(g, 'search_service') or g.search_service is None:
        return jsonify({"error": "Search service not available"}), 503

    try:
        analysis_params = request.get_json()
        if not analysis_params:
            return jsonify({"error": "Missing request body"}), 400

        # Validate input parameters
        validate_analysis_params(analysis_params)

        logger.info(f"Received analysis request for {len(analysis_params.get('chunks_to_analyze', []))} chunks.")
        results = g.search_service.perform_analysis(analysis_params)
        return jsonify(results)

    except ValidationError as ve:
        logger.warning(f"Validation error during analysis: {ve}")
        return jsonify({"error": str(ve)}), 400
    except ValueError as ve:
        logger.warning(f"Value error during analysis: {ve}")
        return jsonify({"error": str(ve)}), 400
    except Exception as e:
        logger.error(f"Error during analysis: {e}", exc_info=True)
        return jsonify({"error": "An internal error occurred during analysis."}), 500

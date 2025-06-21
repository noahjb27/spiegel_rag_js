# backend/app/api/keywords.py
# ==============================================================================
# API Blueprint for keyword-related functionality.
# ==============================================================================

import logging
from flask import Blueprint, request, jsonify, g

logger = logging.getLogger(__name__)

bp = Blueprint('keywords', __name__, url_prefix='/api/keywords')

@bp.route('/expand', methods=['GET'])
def expand_keywords():
    """
    Expands keywords in a boolean expression.
    Takes 'expression' and 'factor' as query parameters.
    e.g., /api/keywords/expand?expression=mauer&factor=5
    """
    if not hasattr(g, 'search_service') or g.search_service is None:
        return jsonify({"error": "Search service not available"}), 503

    try:
        expression = request.args.get('expression')
        factor = request.args.get('factor', default=5, type=int)

        if not expression:
            return jsonify({"error": "Missing 'expression' query parameter"}), 400
        
        logger.info(f"Expanding keywords for expression: '{expression}' with factor {factor}")
        expanded_data = g.search_service.expand_keywords(expression, factor)
        logger.info(f"API returning data: {expanded_data}")
        
        return jsonify(expanded_data)

    except ConnectionError as ce:
        logger.error(f"Keyword expansion failed: {ce}", exc_info=True)
        return jsonify({"error": str(ce)}), 503
    except Exception as e:
        logger.error(f"Error during keyword expansion: {e}", exc_info=True)
        return jsonify({"error": "An internal error occurred during keyword expansion."}), 500
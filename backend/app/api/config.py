# backend/app/api/config.py - New file needed
from flask import Blueprint, jsonify

from app.config import settings

bp = Blueprint('config', __name__, url_prefix='/api/config')

@bp.route('/config', methods=['GET'])
def get_config():
    """Return public configuration for frontend."""
    return jsonify({
        "available_models": settings.AVAILABLE_LLM_MODELS,
        "model_display_names": settings.LLM_DISPLAY_NAMES,
        "chunk_sizes": settings.AVAILABLE_CHUNK_SIZES,
        "year_range": [settings.MIN_YEAR, settings.MAX_YEAR],
        "system_prompt_templates": list(settings.ALL_SYSTEM_PROMPTS.keys())
    })
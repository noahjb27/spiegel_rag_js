# backend/app/__init__.py
# ==============================================================================
# Application Factory for the Flask App (CORRECTED)
#
# This version fixes the bug where the SearchService was not available
# during requests. We now use a 'before_request' hook to ensure the service
# is attached to the request context 'g' for every API call.
# ==============================================================================

import os
import logging
from flask import Flask, g
from flask_cors import CORS
from .services.search_service import SearchService

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def create_app():
    """
    Creates and an instance of the Flask application.
    """
    app = Flask(__name__)
    CORS(app, resources={r"/api/*": {"origins": "http://localhost:3000"}})

    # --- Initialize Services ONCE at startup ---
    # We create the service instance when the app is created.
    # This is efficient as models are loaded only one time.
    try:
        search_service_instance = SearchService()
        logger.info("✅ SearchService initialized successfully at app startup.")
    except Exception as e:
        logger.error(f"❌ CRITICAL: Failed to initialize SearchService: {e}", exc_info=True)
        search_service_instance = None
        
    # --- Attach Service to Each Request ---
    # This is the crucial fix. This function runs before every request.
    # It ensures that our single 'search_service_instance' is available
    # as 'g.search_service' for the duration of that request.
    @app.before_request
    def before_request():
        g.search_service = search_service_instance

    # --- Register API Blueprints ---
    from .api import search, keywords, download
    app.register_blueprint(search.bp)
    app.register_blueprint(keywords.bp)
    app.register_blueprint(download.bp)
    
    @app.route("/api/health")
    def health_check():
        """
        A simple health check endpoint to confirm the server is running.
        This will now work correctly.
        """
        if g.get('search_service'):
            return "OK: Server is running and SearchService is available."
        else:
            return "ERROR: Server is running but SearchService failed to initialize.", 503

    return app

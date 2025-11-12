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
import atexit
from flask import Flask, g
from flask_cors import CORS
from apscheduler.schedulers.background import BackgroundScheduler
from .services.search_service import SearchService
from .services.trace_service import get_trace_service

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def create_app():
    """
    Creates and an instance of the Flask application.
    """
    app = Flask(__name__)
    # CORS configuration - update origins for production
    cors_origins = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
    CORS(app, resources={r"/api/*": {"origins": [origin.strip() for origin in cors_origins]}})

    # --- Initialize Services ONCE at startup ---
    # We create the service instance when the app is created.
    # This is efficient as models are loaded only one time.
    try:
        search_service_instance = SearchService()
        logger.info("✅ SearchService initialized successfully at app startup.")
    except Exception as e:
        logger.error(f"❌ CRITICAL: Failed to initialize SearchService: {e}", exc_info=True)
        search_service_instance = None

    # --- Initialize Trace Cleanup Scheduler ---
    # Run cleanup every 30 minutes to remove old trace files
    def cleanup_old_traces():
        try:
            trace_service = get_trace_service()
            trace_service.cleanup_old_traces()
        except Exception as e:
            logger.error(f"Error during scheduled trace cleanup: {e}", exc_info=True)

    scheduler = BackgroundScheduler()
    scheduler.add_job(func=cleanup_old_traces, trigger="interval", minutes=30)
    scheduler.start()
    logger.info("✅ Trace cleanup scheduler started (runs every 30 minutes)")

    # Shut down the scheduler when exiting the app
    atexit.register(lambda: scheduler.shutdown())
        
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

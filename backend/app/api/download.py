# backend/app/api/download.py
# ==============================================================================
# API Blueprint for file download endpoints.
# This uses Flask's 'send_file' to stream generated files to the client.
# ==============================================================================

import logging
import os
from flask import Blueprint, request, jsonify, send_file, after_this_request

from ..services import download_service
from ..services.trace_service import get_trace_service

logger = logging.getLogger(__name__)

bp = Blueprint('download', __name__, url_prefix='/api/download')

@bp.route('/json', methods=['POST'])
def download_json():
    """
    Generates and returns a JSON file of search results.
    Accepts a JSON body containing the 'retrieved_chunks' data.
    """
    try:
        data = request.get_json()
        retrieved_chunks = data.get('retrieved_chunks')

        if not retrieved_chunks:
            return jsonify({"error": "Missing 'retrieved_chunks' in request body"}), 400

        # The service function creates a temp file and returns its path
        file_path = download_service.create_json_file(retrieved_chunks)

        if not file_path:
            return jsonify({"error": "Failed to generate JSON file. No data available."}), 404
        
        logger.info(f"Sending JSON file for download from path: {file_path}")

        # This function will be called after the request is completed.
        # It's the safest way to clean up the temporary file after sending it.
        @after_this_request
        def cleanup(response):
            try:
                # Add a small delay and retry mechanism for Windows
                import time
                time.sleep(0.1)  # Brief delay to allow file handle to be released
                os.remove(file_path)
                logger.info(f"Cleaned up temporary file: {file_path}")
            except OSError:
                # On Windows, file might still be in use. Try again after delay
                try:
                    time.sleep(0.5)
                    os.remove(file_path)
                    logger.info(f"Cleaned up temporary file after retry: {file_path}")
                except OSError as retry_e:
                    logger.error(f"Error cleaning up file {file_path}: {retry_e}", exc_info=True)
                    # File will be cleaned up by OS temp directory maintenance
            return response

        # send_file will handle streaming the file content to the user
        return send_file(
            file_path,
            as_attachment=True,
            download_name='spiegel_rag_results.json',
            mimetype='application/json'
        )

    except Exception as e:
        logger.error(f"Error during JSON download: {e}", exc_info=True)
        return jsonify({"error": "An internal error occurred during JSON download."}), 500


@bp.route('/csv', methods=['POST'])
def download_csv():
    """
    Generates and returns a CSV file of search results.
    Accepts a JSON body containing the 'retrieved_chunks' data.
    """
    try:
        data = request.get_json()
        retrieved_chunks = data.get('retrieved_chunks')

        if not retrieved_chunks:
            return jsonify({"error": "Missing 'retrieved_chunks' in request body"}), 400

        # The service function creates a temp file and returns its path
        file_path = download_service.create_csv_file(retrieved_chunks)

        if not file_path:
            return jsonify({"error": "Failed to generate CSV file. No data available."}), 404
            
        logger.info(f"Sending CSV file for download from path: {file_path}")
        
        @after_this_request
        def cleanup(response):
            try:
                # Add a small delay and retry mechanism for Windows
                import time
                time.sleep(0.1)  # Brief delay to allow file handle to be released
                os.remove(file_path)
                logger.info(f"Cleaned up temporary file: {file_path}")
            except OSError:
                # On Windows, file might still be in use. Try again after delay
                try:
                    time.sleep(0.5)
                    os.remove(file_path)
                    logger.info(f"Cleaned up temporary file after retry: {file_path}")
                except OSError as retry_e:
                    logger.error(f"Error cleaning up file {file_path}: {retry_e}", exc_info=True)
                    # File will be cleaned up by OS temp directory maintenance
            return response

        # send_file handles the response correctly
        return send_file(
            file_path,
            as_attachment=True,
            download_name='spiegel_rag_results.csv',
            mimetype='text/csv'
        )

    except Exception as e:
        logger.error(f"Error during CSV download: {e}", exc_info=True)
        return jsonify({"error": "An internal error occurred during CSV download."}), 500


@bp.route('/reasoning-trace/<filename>', methods=['GET'])
def download_reasoning_trace(filename):
    """
    Downloads a saved analysis reasoning trace file.
    The filename should be provided in the URL path.
    """
    try:
        # Get trace service
        trace_service = get_trace_service()

        # Get the file path
        file_path = trace_service.get_trace_path(filename)

        if not file_path:
            logger.warning(f"Reasoning trace file not found: {filename}")
            return jsonify({"error": "Reasoning trace file not found"}), 404

        logger.info(f"Sending reasoning trace file for download: {filename}")

        # Send the file (no cleanup needed - will be cleaned by scheduled task)
        return send_file(
            file_path,
            as_attachment=True,
            download_name=filename,
            mimetype='application/json'
        )

    except Exception as e:
        logger.error(f"Error during reasoning trace download: {e}", exc_info=True)
        return jsonify({"error": "An internal error occurred during reasoning trace download."}), 500

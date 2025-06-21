# backend/run.py
# ==============================================================================
# Main entry point to start the Flask development server.
#
# To Run:
# 1. Make sure you are in the 'backend' directory.
# 2. Make sure your virtual environment is active.
# 3. Run 'flask run' in your terminal.
#
# Flask will automatically find the 'create_app' factory in 'app/__init__.py'
# and start the server, typically on http://127.0.0.1:5000.
# The port is configured in the .flaskenv file to avoid conflicts with React.
# ==============================================================================

from app import create_app

app = create_app()

if __name__ == "__main__":
    # This block allows running the app directly with 'python run.py'
    # The 'flask run' command is generally preferred for development.
    app.run(host='0.0.0.0', port=5001, debug=True)

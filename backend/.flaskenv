# backend/.flaskenv
# ==============================================================================
# Environment variables for the Flask CLI.
# This file is automatically loaded when you run 'flask run'.
# ==============================================================================

# Tells Flask where to find the application instance.
# It points to the 'create_app' factory function inside the 'app' package.
FLASK_APP=app

# Sets the environment to development mode.
# This enables the interactive debugger and automatic reloader.
FLASK_ENV=development

# Specifies the port for the development server.
# We use 5001 to avoid conflicts with the React frontend, which often defaults to 3000.
FLASK_RUN_PORT=5001

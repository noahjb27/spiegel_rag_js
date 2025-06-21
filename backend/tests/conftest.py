# backend/tests/conftest.py
# ==============================================================================
# Pytest Fixtures (FINAL, CORRECTED VERSION)
#
# This version correctly mocks the SearchService *before* the app is created,
# preventing the real, heavy service from ever initializing during tests.
# This makes the test suite extremely fast and reliable.
# ==============================================================================

import pytest
from unittest.mock import MagicMock

@pytest.fixture
def app(mocker):
    """
    Create and configure a new app instance for each test.
    This fixture is the key to fast testing: it replaces the entire
    SearchService class with a mock *before* the app is created.
    """
    # Create a mock object that will be returned whenever SearchService() is called.
    mock_service_instance = MagicMock()
    mocker.patch('app.services.search_service.SearchService', return_value=mock_service_instance)
    
    # Now, when create_app() runs, it will use our mock instead of the real service.
    from app import create_app
    app = create_app()
    app.config.update({"TESTING": True})
    
    # We can attach the mock to the app object for easy access in tests if needed.
    app.mock_service = mock_service_instance
    
    yield app

@pytest.fixture
def client(app):
    """A test client for the app."""
    return app.test_client()

@pytest.fixture
def mocked_search_service(app):
    """
    Returns the already-mocked search service instance attached to the app.
    This provides a clean way to access the mock in each test function.
    """
    yield app.mock_service

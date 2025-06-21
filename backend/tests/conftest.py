# backend/tests/conftest.py
# ==============================================================================
# Pytest Fixtures (FINAL, CORRECTED VERSION)
# This version correctly mocks the SearchService *before* the app is created,
# preventing the real, heavy models from loading and fixing the test errors.
# ==============================================================================

import pytest
from unittest.mock import MagicMock

@pytest.fixture
def mocked_search_service(mocker):
    """
    This fixture is the key. It replaces the entire SearchService class
    with a MagicMock object *before* any tests run or the app is created.
    """
    mock_instance = MagicMock()
    # This is where we intercept the class instantiation
    mocker.patch('app.services.search_service.SearchService', return_value=mock_instance)
    return mock_instance

@pytest.fixture
def app(mocked_search_service):
    """
    Creates a test app. Because it depends on `mocked_search_service`,
    the service is already mocked before `create_app` is called.
    """
    from app import create_app
    app = create_app()
    app.config.update({"TESTING": True})
    return app

@pytest.fixture
def client(app):
    """A test client for the app."""
    return app.test_client()

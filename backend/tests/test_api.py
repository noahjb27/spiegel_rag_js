# backend/tests/test_api.py
# ==============================================================================
# Comprehensive API tests (FINAL, CORRECTED VERSION)
#
# This version works with the new, fast, and reliable mocking setup from conftest.py
# ==============================================================================

import json
from unittest.mock import MagicMock

# --- Test Data ---
MOCK_SEARCH_PARAMS = {
    "retrieval_query": "Berliner Mauer",
    "year_start": 1961,
    "year_end": 1965,
    "chunk_size": 2000,
    "top_k": 5
}

MOCK_SEARCH_RESULT = {
    "chunks": [{"content": "Test content", "metadata": {"Artikeltitel": "Test"}, "relevance_score": 0.9}],
    "metadata": {"total_chunks_found": 1}
}

MOCK_ANALYSIS_PARAMS = {
    "user_prompt": "What is this about?",
    "chunks_to_analyze": MOCK_SEARCH_RESULT["chunks"],
    "model_selection": "hu-llm1",
    "system_prompt_text": "You are an assistant."
}

MOCK_ANALYSIS_RESULT = {
    "answer": "This is about a test.",
    "metadata": {"model_used": "hu-llm1"}
}

# --- Tests ---

def test_health_check(client):
    """Test the health check endpoint."""
    response = client.get("/api/health")
    assert response.status_code == 200
    assert b"OK" in response.data

def test_standard_search_success(client, mocked_search_service: MagicMock):
    """Test a successful standard search request."""
    mocked_search_service.standard_search.return_value = MOCK_SEARCH_RESULT
    
    response = client.post('/api/search/standard', json=MOCK_SEARCH_PARAMS)
    
    assert response.status_code == 200
    data = response.get_json()
    assert data['metadata']['total_chunks_found'] == 1
    assert data['chunks'][0]['content'] == "Test content"
    mocked_search_service.standard_search.assert_called_once_with(MOCK_SEARCH_PARAMS)

def test_llm_assisted_search_success(client, mocked_search_service: MagicMock):
    """Test a successful LLM-assisted search request."""
    mocked_search_service.llm_assisted_search.return_value = MOCK_SEARCH_RESULT
    
    response = client.post('/api/search/llm-assisted', json=MOCK_SEARCH_PARAMS)
    
    assert response.status_code == 200
    data = response.get_json()
    assert data['metadata']['total_chunks_found'] == 1
    mocked_search_service.llm_assisted_search.assert_called_once_with(MOCK_SEARCH_PARAMS)

def test_search_bad_request(client):
    """Test a search request with missing data."""
    response = client.post('/api/search/standard', json={})
    assert response.status_code == 400
    assert b"Missing required search parameters" in response.data

def test_analysis_success(client, mocked_search_service: MagicMock):
    """Test a successful analysis request."""
    mocked_search_service.perform_analysis.return_value = MOCK_ANALYSIS_RESULT

    response = client.post('/api/search/analyze', json=MOCK_ANALYSIS_PARAMS)
    
    assert response.status_code == 200
    data = response.get_json()
    assert data['answer'] == "This is about a test."
    mocked_search_service.perform_analysis.assert_called_once_with(MOCK_ANALYSIS_PARAMS)

def test_analysis_bad_request(client):
    """Test an analysis request with missing data."""
    response = client.post('/api/search/analyze', json={"user_prompt": "test"})
    assert response.status_code == 400
    assert b"Missing user_prompt or chunks_to_analyze" in response.data

def test_expand_keywords_success(client, mocked_search_service: MagicMock):
    """Test successful keyword expansion."""
    mocked_search_service.expand_keywords.return_value = {"mauer": ["grenze", "wall"]}

    response = client.get('/api/keywords/expand?expression=mauer&factor=2')
    
    assert response.status_code == 200
    data = response.get_json()
    assert data["mauer"] == ["grenze", "wall"]
    mocked_search_service.expand_keywords.assert_called_once_with("mauer", 2)

def test_expand_keywords_missing_param(client):
    """Test keyword expansion with missing expression."""
    response = client.get('/api/keywords/expand')
    assert response.status_code == 400
    assert b"Missing 'expression' query parameter" in response.data
    
def test_download_json_success(client, mocker):
    """Test successful JSON file download."""
    # Mock the service function that creates the file
    mocker.patch('app.services.download_service.create_json_file', return_value='/tmp/test.json')
    # We also mock send_file itself to avoid filesystem issues on different OS
    mocker.patch('app.api.download.send_file', return_value="OK")
    
    response = client.post('/api/download/json', json={"retrieved_chunks": MOCK_SEARCH_RESULT})
    assert response.status_code == 200

def test_download_csv_success(client, mocker):
    """Test successful CSV file download."""
    mocker.patch('app.services.download_service.create_csv_file', return_value='/tmp/test.csv')
    mocker.patch('app.api.download.send_file', return_value="OK")

    response = client.post('/api/download/csv', json={"retrieved_chunks": MOCK_SEARCH_RESULT})
    assert response.status_code == 200

def test_download_bad_request(client):
    """Test download endpoint with missing data."""
    response = client.post('/api/download/json', json={})
    assert response.status_code == 400
    assert b"Missing 'retrieved_chunks'" in response.data

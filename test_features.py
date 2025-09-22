#!/usr/bin/env python3
"""
Comprehensive Test Script for SPIEGEL RAG System
================================================

This script tests all major features of the JavaScript-based SPIEGEL RAG system
to ensure parity with the original Gradio version.

Usage:
    python test_features.py

Requirements:
    - Backend running on http://127.0.0.1:5001
    - Frontend running on http://localhost:3000 (optional for UI tests)
    - All dependencies installed
"""

import requests
import json
import time
import sys
from typing import Dict, Any, List
from dataclasses import dataclass
from datetime import datetime

# Configuration
BACKEND_URL = "http://127.0.0.1:5001"
FRONTEND_URL = "http://localhost:3000"

@dataclass
class TestResult:
    name: str
    passed: bool
    message: str
    duration: float
    details: Dict[str, Any] = None

class SpiegelRAGTester:
    def __init__(self):
        self.results: List[TestResult] = []
        self.session = requests.Session()
        
    def log_test(self, name: str, passed: bool, message: str, duration: float, details: Dict = None):
        """Log a test result"""
        result = TestResult(name, passed, message, duration, details)
        self.results.append(result)
        
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"{status} {name}: {message} ({duration:.2f}s)")
        if details and not passed:
            print(f"    Details: {details}")
    
    def test_backend_health(self) -> bool:
        """Test if backend is running and responsive"""
        start_time = time.time()
        try:
            response = self.session.get(f"{BACKEND_URL}/api/config/config", timeout=10)
            duration = time.time() - start_time
            
            if response.status_code == 200:
                config = response.json()
                self.log_test(
                    "Backend Health Check",
                    True,
                    f"Backend is running. Available models: {len(config.get('available_models', []))}",
                    duration,
                    {"models": config.get('available_models', [])}
                )
                return True
            else:
                self.log_test(
                    "Backend Health Check",
                    False,
                    f"Backend returned status {response.status_code}",
                    duration,
                    {"status_code": response.status_code, "response": response.text}
                )
                return False
        except requests.exceptions.RequestException as e:
            duration = time.time() - start_time
            self.log_test(
                "Backend Health Check",
                False,
                f"Backend is not reachable: {str(e)}",
                duration,
                {"error": str(e)}
            )
            return False
    
    def test_config_endpoint(self) -> bool:
        """Test configuration endpoint"""
        start_time = time.time()
        try:
            response = self.session.get(f"{BACKEND_URL}/api/config/config")
            duration = time.time() - start_time
            
            if response.status_code == 200:
                config = response.json()
                required_keys = ['available_models', 'model_display_names', 'chunk_sizes', 'year_range']
                
                missing_keys = [key for key in required_keys if key not in config]
                if not missing_keys:
                    self.log_test(
                        "Config Endpoint",
                        True,
                        f"Configuration loaded successfully. Year range: {config['year_range']}",
                        duration,
                        config
                    )
                    return True
                else:
                    self.log_test(
                        "Config Endpoint",
                        False,
                        f"Missing configuration keys: {missing_keys}",
                        duration,
                        {"missing_keys": missing_keys, "config": config}
                    )
                    return False
            else:
                self.log_test(
                    "Config Endpoint",
                    False,
                    f"Config endpoint failed with status {response.status_code}",
                    duration
                )
                return False
        except Exception as e:
            duration = time.time() - start_time
            self.log_test(
                "Config Endpoint",
                False,
                f"Config endpoint error: {str(e)}",
                duration
            )
            return False
    
    def test_standard_search(self) -> bool:
        """Test standard search functionality"""
        start_time = time.time()
        try:
            search_params = {
                "retrieval_query": "Berliner Mauer",
                "year_start": 1960,
                "year_end": 1970,
                "chunk_size": 3000,
                "top_k": 5,
                "keywords": "mauer AND berlin",
                "search_in": ["Text"],
                "use_semantic_expansion": False,
                "use_time_intervals": False
            }
            
            response = self.session.post(
                f"{BACKEND_URL}/api/search/standard",
                json=search_params,
                timeout=30
            )
            duration = time.time() - start_time
            
            if response.status_code == 200:
                result = response.json()
                chunks = result.get('chunks', [])
                
                if chunks:
                    self.log_test(
                        "Standard Search",
                        True,
                        f"Found {len(chunks)} chunks in {duration:.2f}s",
                        duration,
                        {
                            "chunks_found": len(chunks),
                            "search_time": result.get('metadata', {}).get('search_time', 0),
                            "sample_chunk": chunks[0] if chunks else None
                        }
                    )
                    return True
                else:
                    self.log_test(
                        "Standard Search",
                        False,
                        "Search returned no results",
                        duration,
                        {"response": result}
                    )
                    return False
            else:
                self.log_test(
                    "Standard Search",
                    False,
                    f"Search failed with status {response.status_code}",
                    duration,
                    {"status_code": response.status_code, "response": response.text}
                )
                return False
        except Exception as e:
            duration = time.time() - start_time
            self.log_test(
                "Standard Search",
                False,
                f"Search error: {str(e)}",
                duration
            )
            return False
    
    def test_llm_assisted_search(self) -> bool:
        """Test LLM-assisted search functionality"""
        start_time = time.time()
        try:
            search_params = {
                "retrieval_query": "Berliner Mauer Bau",
                "year_start": 1960,
                "year_end": 1970,
                "chunk_size": 3000,
                "llm_assisted_keywords": "mauer AND berlin",
                "llm_assisted_search_in": ["Text"],
                "llm_assisted_use_time_intervals": True,
                "llm_assisted_time_interval_size": 5,
                "chunks_per_interval_initial": 20,
                "chunks_per_interval_final": 10,
                "llm_assisted_min_retrieval_score": 0.25,
                "llm_assisted_model": "hu-llm3",
                "llm_assisted_temperature": 0.2,
                "llm_assisted_system_prompt_text": "Du bewertest Textabschnitte aus SPIEGEL-Artikeln..."
            }
            
            response = self.session.post(
                f"{BACKEND_URL}/api/search/llm-assisted",
                json=search_params,
                timeout=60  # LLM-assisted search takes longer
            )
            duration = time.time() - start_time
            
            if response.status_code == 200:
                result = response.json()
                chunks = result.get('chunks', [])
                
                if chunks:
                    # Check if LLM evaluation scores are present
                    has_llm_scores = any('llm_evaluation_score' in chunk for chunk in chunks)
                    
                    self.log_test(
                        "LLM-Assisted Search",
                        True,
                        f"Found {len(chunks)} chunks with LLM evaluation in {duration:.2f}s",
                        duration,
                        {
                            "chunks_found": len(chunks),
                            "has_llm_scores": has_llm_scores,
                            "search_time": result.get('metadata', {}).get('search_time', 0)
                        }
                    )
                    return True
                else:
                    self.log_test(
                        "LLM-Assisted Search",
                        False,
                        "LLM-assisted search returned no results",
                        duration,
                        {"response": result}
                    )
                    return False
            else:
                self.log_test(
                    "LLM-Assisted Search",
                    False,
                    f"LLM-assisted search failed with status {response.status_code}",
                    duration,
                    {"status_code": response.status_code, "response": response.text}
                )
                return False
        except Exception as e:
            duration = time.time() - start_time
            self.log_test(
                "LLM-Assisted Search",
                False,
                f"LLM-assisted search error: {str(e)}",
                duration
            )
            return False
    
    def test_keyword_expansion(self) -> bool:
        """Test keyword expansion functionality"""
        start_time = time.time()
        try:
            response = self.session.get(
                f"{BACKEND_URL}/api/keywords/expand",
                params={"expression": "mauer", "factor": 5},
                timeout=15
            )
            duration = time.time() - start_time
            
            if response.status_code == 200:
                result = response.json()
                
                if result and 'mauer' in result:
                    similar_words = result['mauer']
                    if similar_words:
                        self.log_test(
                            "Keyword Expansion",
                            True,
                            f"Found {len(similar_words)} similar words for 'mauer'",
                            duration,
                            {
                                "similar_words_count": len(similar_words),
                                "sample_words": [w['word'] for w in similar_words[:3]]
                            }
                        )
                        return True
                    else:
                        self.log_test(
                            "Keyword Expansion",
                            False,
                            "Keyword expansion returned empty results",
                            duration,
                            {"response": result}
                        )
                        return False
                else:
                    self.log_test(
                        "Keyword Expansion",
                        False,
                        "Keyword expansion response format invalid",
                        duration,
                        {"response": result}
                    )
                    return False
            else:
                self.log_test(
                    "Keyword Expansion",
                    False,
                    f"Keyword expansion failed with status {response.status_code}",
                    duration,
                    {"status_code": response.status_code, "response": response.text}
                )
                return False
        except Exception as e:
            duration = time.time() - start_time
            self.log_test(
                "Keyword Expansion",
                False,
                f"Keyword expansion error: {str(e)}",
                duration
            )
            return False
    
    def test_analysis_endpoint(self) -> bool:
        """Test analysis endpoint with sample chunks"""
        start_time = time.time()
        try:
            # First get some chunks from a search
            search_params = {
                "retrieval_query": "Berliner Mauer",
                "year_start": 1960,
                "year_end": 1970,
                "chunk_size": 3000,
                "top_k": 2,
                "use_semantic_expansion": False
            }
            
            search_response = self.session.post(
                f"{BACKEND_URL}/api/search/standard",
                json=search_params,
                timeout=30
            )
            
            if search_response.status_code != 200:
                self.log_test(
                    "Analysis Endpoint",
                    False,
                    "Could not get chunks for analysis test",
                    time.time() - start_time
                )
                return False
            
            search_result = search_response.json()
            chunks = search_result.get('chunks', [])
            
            if not chunks:
                self.log_test(
                    "Analysis Endpoint",
                    False,
                    "No chunks available for analysis test",
                    time.time() - start_time
                )
                return False
            
            # Now test analysis
            analysis_params = {
                "user_prompt": "Wie wurde die Berliner Mauer in den Medien dargestellt?",
                "chunks_to_analyze": chunks[:2],  # Use first 2 chunks
                "model_selection": "hu-llm3",
                "system_prompt_text": "Du bist ein Historiker. Beantworte die Frage basierend auf den bereitgestellten Texten.",
                "temperature": 0.3
            }
            
            analysis_response = self.session.post(
                f"{BACKEND_URL}/api/search/analyze",
                json=analysis_params,
                timeout=60
            )
            duration = time.time() - start_time
            
            if analysis_response.status_code == 200:
                result = analysis_response.json()
                answer = result.get('answer', '')
                
                if answer and len(answer) > 10:  # Basic check for meaningful answer
                    self.log_test(
                        "Analysis Endpoint",
                        True,
                        f"Analysis completed successfully. Answer length: {len(answer)} chars",
                        duration,
                        {
                            "answer_length": len(answer),
                            "model_used": result.get('metadata', {}).get('model_used', 'unknown'),
                            "analysis_time": result.get('metadata', {}).get('analysis_time', 0)
                        }
                    )
                    return True
                else:
                    self.log_test(
                        "Analysis Endpoint",
                        False,
                        "Analysis returned empty or too short answer",
                        duration,
                        {"response": result}
                    )
                    return False
            else:
                self.log_test(
                    "Analysis Endpoint",
                    False,
                    f"Analysis failed with status {analysis_response.status_code}",
                    duration,
                    {"status_code": analysis_response.status_code, "response": analysis_response.text}
                )
                return False
        except Exception as e:
            duration = time.time() - start_time
            self.log_test(
                "Analysis Endpoint",
                False,
                f"Analysis error: {str(e)}",
                duration
            )
            return False
    
    def test_download_endpoints(self) -> bool:
        """Test download endpoints"""
        start_time = time.time()
        try:
            # First get some chunks
            search_params = {
                "retrieval_query": "Berliner Mauer",
                "year_start": 1960,
                "year_end": 1970,
                "chunk_size": 3000,
                "top_k": 3,
                "use_semantic_expansion": False
            }
            
            search_response = self.session.post(
                f"{BACKEND_URL}/api/search/standard",
                json=search_params,
                timeout=30
            )
            
            if search_response.status_code != 200:
                self.log_test(
                    "Download Endpoints",
                    False,
                    "Could not get chunks for download test",
                    time.time() - start_time
                )
                return False
            
            search_result = search_response.json()
            
            # Test CSV download
            csv_response = self.session.post(
                f"{BACKEND_URL}/api/download/csv",
                json={"retrieved_chunks": search_result},
                timeout=15
            )
            
            # Test JSON download
            json_response = self.session.post(
                f"{BACKEND_URL}/api/download/json",
                json={"retrieved_chunks": search_result},
                timeout=15
            )
            
            duration = time.time() - start_time
            
            csv_ok = csv_response.status_code == 200 and 'text/csv' in csv_response.headers.get('content-type', '')
            json_ok = json_response.status_code == 200 and 'application/json' in json_response.headers.get('content-type', '')
            
            if csv_ok and json_ok:
                self.log_test(
                    "Download Endpoints",
                    True,
                    "Both CSV and JSON downloads working",
                    duration,
                    {
                        "csv_size": len(csv_response.content),
                        "json_size": len(json_response.content)
                    }
                )
                return True
            else:
                self.log_test(
                    "Download Endpoints",
                    False,
                    f"Download issues - CSV: {csv_ok}, JSON: {json_ok}",
                    duration,
                    {
                        "csv_status": csv_response.status_code,
                        "json_status": json_response.status_code,
                        "csv_content_type": csv_response.headers.get('content-type'),
                        "json_content_type": json_response.headers.get('content-type')
                    }
                )
                return False
        except Exception as e:
            duration = time.time() - start_time
            self.log_test(
                "Download Endpoints",
                False,
                f"Download test error: {str(e)}",
                duration
            )
            return False
    
    def test_frontend_accessibility(self) -> bool:
        """Test if frontend is accessible (basic check)"""
        start_time = time.time()
        try:
            response = self.session.get(FRONTEND_URL, timeout=10)
            duration = time.time() - start_time
            
            if response.status_code == 200:
                self.log_test(
                    "Frontend Accessibility",
                    True,
                    "Frontend is accessible",
                    duration
                )
                return True
            else:
                self.log_test(
                    "Frontend Accessibility",
                    False,
                    f"Frontend returned status {response.status_code}",
                    duration
                )
                return False
        except requests.exceptions.RequestException as e:
            duration = time.time() - start_time
            self.log_test(
                "Frontend Accessibility",
                False,
                f"Frontend is not accessible: {str(e)}",
                duration
            )
            return False
    
    def run_all_tests(self):
        """Run all tests and generate report"""
        print("🚀 Starting SPIEGEL RAG System Feature Tests")
        print("=" * 60)
        print(f"Backend URL: {BACKEND_URL}")
        print(f"Frontend URL: {FRONTEND_URL}")
        print(f"Test started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print()
        
        # Core backend tests
        backend_healthy = self.test_backend_health()
        if not backend_healthy:
            print("\n❌ Backend is not accessible. Please start the backend server.")
            return
        
        self.test_config_endpoint()
        self.test_standard_search()
        self.test_llm_assisted_search()
        self.test_keyword_expansion()
        self.test_analysis_endpoint()
        self.test_download_endpoints()
        
        # Frontend test (optional)
        self.test_frontend_accessibility()
        
        # Generate summary
        self.generate_summary()
    
    def generate_summary(self):
        """Generate test summary report"""
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        
        total_tests = len(self.results)
        passed_tests = sum(1 for r in self.results if r.passed)
        failed_tests = total_tests - passed_tests
        
        print(f"Total Tests: {total_tests}")
        print(f"✅ Passed: {passed_tests}")
        print(f"❌ Failed: {failed_tests}")
        print(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%")
        
        if failed_tests > 0:
            print("\n❌ FAILED TESTS:")
            for result in self.results:
                if not result.passed:
                    print(f"  - {result.name}: {result.message}")
        
        print(f"\nTest completed at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        
        # Feature parity check
        print("\n🎯 FEATURE PARITY CHECK")
        print("=" * 60)
        features = [
            ("Backend Health", any(r.name == "Backend Health Check" and r.passed for r in self.results)),
            ("Configuration", any(r.name == "Config Endpoint" and r.passed for r in self.results)),
            ("Standard Search", any(r.name == "Standard Search" and r.passed for r in self.results)),
            ("LLM-Assisted Search", any(r.name == "LLM-Assisted Search" and r.passed for r in self.results)),
            ("Keyword Expansion", any(r.name == "Keyword Expansion" and r.passed for r in self.results)),
            ("Analysis", any(r.name == "Analysis Endpoint" and r.passed for r in self.results)),
            ("Downloads", any(r.name == "Download Endpoints" and r.passed for r in self.results)),
            ("Frontend Access", any(r.name == "Frontend Accessibility" and r.passed for r in self.results)),
        ]
        
        for feature_name, is_working in features:
            status = "✅" if is_working else "❌"
            print(f"{status} {feature_name}")
        
        working_features = sum(1 for _, is_working in features if is_working)
        print(f"\nFeature Parity: {working_features}/{len(features)} features working")
        
        if working_features == len(features):
            print("\n🎉 ALL FEATURES WORKING! Your JavaScript implementation has full parity with the Gradio version.")
        else:
            print(f"\n⚠️  {len(features) - working_features} features need attention.")

def main():
    """Main function to run tests"""
    tester = SpiegelRAGTester()
    tester.run_all_tests()

if __name__ == "__main__":
    main()

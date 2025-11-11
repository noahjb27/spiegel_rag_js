"""
Test script to verify LLM model connections and configurations.
Run this script to check if all configured LLM models are working correctly.
"""
import sys
import os

# Add the backend directory to the path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.llm_service import LLMService
from app.config import settings
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)

def test_model_initialization():
    """Test if LLM service initializes correctly."""
    print("\n" + "="*70)
    print("🔧 TESTING LLM MODEL INITIALIZATION")
    print("="*70 + "\n")
    
    try:
        llm_service = LLMService()
        print(f"✅ LLM Service initialized successfully")
        print(f"📋 Available models: {llm_service.get_available_models()}\n")
        return llm_service
    except Exception as e:
        print(f"❌ Failed to initialize LLM Service: {e}")
        return None

def test_model_info(llm_service):
    """Display detailed information about each configured model."""
    print("="*70)
    print("📊 MODEL CONFIGURATION DETAILS")
    print("="*70 + "\n")
    
    all_models = settings.AVAILABLE_LLM_MODELS
    
    for model_name in all_models:
        info = llm_service.get_model_info(model_name)
        status = "✅ Available" if info.get("available") else "❌ Not Available"
        
        print(f"Model: {model_name}")
        print(f"  Display Name: {info.get('display_name', 'N/A')}")
        print(f"  Status: {status}")
        print(f"  Type: {info.get('type', 'N/A')}")
        print(f"  Endpoint: {info.get('endpoint', 'N/A')}")
        
        if model_name in llm_service.clients:
            client_info = llm_service.clients[model_name]
            print(f"  Model ID: {client_info.get('model_id', 'N/A')}")
        print()

def test_simple_generation(llm_service):
    """Test simple text generation with each available model."""
    print("="*70)
    print("🧪 TESTING TEXT GENERATION")
    print("="*70 + "\n")
    
    test_question = "What is 2+2?"
    test_context = "This is a simple math question."
    
    available_models = llm_service.get_available_models()
    
    if not available_models:
        print("❌ No models available for testing")
        return
    
    for model in available_models:
        print(f"Testing model: {model}")
        print("-" * 50)
        
        try:
            response = llm_service.generate_response(
                question=test_question,
                context=test_context,
                model=model,
                temperature=0.1
            )
            
            if response and response.get("response"):
                answer = response["response"][:100]  # First 100 chars
                print(f"✅ Success! Response: {answer}...")
                print(f"   Model used: {response.get('model_used', 'N/A')}")
                print(f"   Tokens: {response.get('usage', {}).get('total_tokens', 'N/A')}")
            else:
                print(f"⚠️  Model responded but no text returned")
                
        except Exception as e:
            print(f"❌ Error: {str(e)[:200]}")
        
        print()

def display_configuration():
    """Display current API key configuration (masked)."""
    print("="*70)
    print("🔐 API KEY CONFIGURATION")
    print("="*70 + "\n")
    
    configs = {
        "OpenAI": {
            "API Key": settings.OPENAI_API_KEY,
            "Model": settings.OPENAI_MODEL_NAME
        },
        "Gemini": {
            "API Key": settings.GEMINI_API_KEY,
            "Model": settings.GEMINI_MODEL_NAME
        },
        "DeepSeek": {
            "API Key": settings.DEEPSEEK_API_KEY,
            "Model": settings.DEEPSEEK_MODEL_NAME
        },
        "Anthropic": {
            "API Key": settings.ANTHROPIC_API_KEY,
            "Model": settings.ANTHROPIC_MODEL_NAME
        }
    }
    
    for provider, config in configs.items():
        api_key = config["API Key"]
        if api_key and api_key not in ["", "your_openai_api_key_here", "your_gemini_api_key_here"]:
            masked_key = f"{api_key[:10]}...{api_key[-4:]}" if len(api_key) > 14 else "***"
            status = "✅ Configured"
        else:
            masked_key = "Not set"
            status = "❌ Not configured"
        
        print(f"{provider}:")
        print(f"  Status: {status}")
        print(f"  API Key: {masked_key}")
        print(f"  Model: {config['Model']}")
        print()

def main():
    """Run all tests."""
    print("\n")
    print("╔" + "═"*68 + "╗")
    print("║" + " "*68 + "║")
    print("║" + "  🚀 LLM MODEL CONNECTION TEST SUITE".center(68) + "║")
    print("║" + " "*68 + "║")
    print("╚" + "═"*68 + "╝")
    print("\n")
    
    # Display configuration
    display_configuration()
    
    # Test initialization
    llm_service = test_model_initialization()
    
    if llm_service is None:
        print("\n❌ Cannot continue tests without LLM Service")
        return
    
    # Display model info
    test_model_info(llm_service)
    
    # Test generation
    user_input = input("Would you like to test text generation with available models? (y/n): ")
    if user_input.lower() in ['y', 'yes']:
        test_simple_generation(llm_service)
    else:
        print("\n⏭️  Skipping text generation tests")
    
    print("\n" + "="*70)
    print("✅ TEST SUITE COMPLETED")
    print("="*70 + "\n")

if __name__ == "__main__":
    main()

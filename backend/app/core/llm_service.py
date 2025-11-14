"""
Enhanced LLM service supporting multiple providers: HU-LLM, OpenAI, Gemini, DeepSeek API, and Anthropic.
"""
import logging
import requests
import json
from typing import Dict, List, Optional, Any

import openai
from openai import OpenAI
import google.generativeai as genai
from app.config import settings

# Try to import anthropic
try:
    import anthropic
    ANTHROPIC_AVAILABLE = True
except ImportError:
    anthropic = None
    ANTHROPIC_AVAILABLE = False

logger = logging.getLogger(__name__)

class LLMService:
    """Enhanced service for interacting with multiple language model providers."""
    
    def __init__(self):
        """Initialize LLM clients for all providers."""
        self.clients = {}
        self.available_models = []
        
        # Initialize HU-LLM clients
        self._init_hu_llm_clients()
        
        # Initialize OpenAI client if API key is available
        self._init_openai_client()
        
        # Initialize Gemini client if API key is available
        self._init_gemini_client()
        
        # Initialize DeepSeek API client
        self._init_deepseek_client()
        
        # Initialize Anthropic client if available
        self._init_anthropic_client()
        
        logger.info(f"LLM Service initialized with {len(self.available_models)} available models")

    def _init_hu_llm_clients(self):
        """Initialize HU-LLM clients for both endpoints."""
        hu_llm_configs = [
            ("hu-llm1", settings.HU_LLM1_API_URL),
            ("hu-llm3", settings.HU_LLM3_API_URL)
        ]
        
        for model_name, api_url in hu_llm_configs:
            try:
                client = OpenAI(
                    base_url=api_url,
                    api_key="required-but-not-used"  # HU-LLM doesn't use API key
                )
                
                # Test connection by listing models
                models = client.models.list()
                if models and models.data:
                    self.clients[model_name] = {
                        "client": client,
                        "type": "hu-llm",
                        "model_id": models.data[0].id,
                        "endpoint": api_url
                    }
                    self.available_models.append(model_name)
                    logger.info(f"✅ {model_name} initialized successfully at {api_url}")
                else:
                    logger.warning(f"⚠️ {model_name} connected but no models found")
                    
            except Exception as e:
                logger.error(f"❌ Failed to initialize {model_name} at {api_url}: {e}")

    def _init_openai_client(self):
        """Initialize OpenAI client if API key is available."""
        if not settings.OPENAI_API_KEY or settings.OPENAI_API_KEY == "your_openai_api_key_here":
            logger.info("OpenAI API key not configured, skipping OpenAI initialization")
            return
            
        try:
            client = OpenAI(api_key=settings.OPENAI_API_KEY)
            
            # Test connection with a simple models list call
            client.models.list()
            
            # Initialize GPT-4.1
            self.clients["openai-gpt4o"] = {
                "client": client,
                "type": "openai",
                "model_id": settings.OPENAI_MODEL_NAME,
                "endpoint": "https://api.openai.com/v1/"
            }
            self.available_models.append("openai-gpt4o")
            logger.info(f"✅ OpenAI {settings.OPENAI_MODEL_NAME} initialized successfully")
            
            # Initialize GPT-5 (uses different API: responses.create instead of chat.completions.create)
            self.clients["openai-gpt5"] = {
                "client": client,
                "type": "openai-gpt5",
                "model_id": "gpt-5", 
                "endpoint": "https://api.openai.com/v1/"
            }
            self.available_models.append("openai-gpt5")
            logger.info("✅ OpenAI GPT-5 initialized successfully")
            
        except Exception as e:
            logger.error(f"❌ Failed to initialize OpenAI: {e}")

    def _init_gemini_client(self):
        """Initialize Gemini client if API key is available."""
        if not settings.GEMINI_API_KEY or settings.GEMINI_API_KEY == "your_gemini_api_key_here":
            logger.info("Gemini API key not configured, skipping Gemini initialization")
            return
            
        try:
            genai.configure(api_key=settings.GEMINI_API_KEY)
            
            # Test connection by listing models and finding available ones
            models = list(genai.list_models())
            available_model_names = [model.name for model in models]
            
            # Try different model names in order of preference (prioritize 2.5 Pro)
            model_options = [
                "models/gemini-2.5-pro",            # CHANGED: Added 2.5 Pro as priority
                "models/gemini-2.5-pro-latest", 
                "models/gemini-2.5-flash",
                "models/gemini-1.5-pro-latest",      # Fallbacks
                "models/gemini-1.5-pro", 
                "models/gemini-2.0-flash",
                "models/gemini-1.5-flash"
            ]
            
            selected_model = None
            for model_name in model_options:
                if model_name in available_model_names:
                    selected_model = model_name.replace("models/", "")  # Remove "models/" prefix
                    break
            
            if selected_model:
                self.clients["gemini-pro"] = {
                    "client": genai,
                    "type": "gemini",
                    "model_id": selected_model,
                    "endpoint": "https://generativelanguage.googleapis.com/"
                }
                self.available_models.append("gemini-pro")
                logger.info(f"✅ Gemini initialized successfully with model: {selected_model}")
            else:
                logger.warning(f"⚠️ No supported Gemini models found. Available: {[m.replace('models/', '') for m in available_model_names[:5]]}...")
            
        except ImportError:
            logger.warning("⚠️ google-generativeai not installed. Install with: pip install google-generativeai")
        except Exception as e:
            logger.error(f"❌ Failed to initialize Gemini: {e}")
            # Try fallback with basic model name
            try:
                logger.info("Attempting fallback initialization...")
                genai.configure(api_key=settings.GEMINI_API_KEY)
                self.clients["gemini-pro"] = {
                    "client": genai,
                    "type": "gemini",
                    "model_id": "gemini-2.5-pro",  # CHANGED: Updated fallback to 2.5 Pro
                    "endpoint": "https://generativelanguage.googleapis.com/"
                }
                self.available_models.append("gemini-pro")
                logger.info("✅ Gemini fallback initialization successful")
            except Exception as fallback_error:
                logger.error(f"❌ Gemini fallback initialization also failed: {fallback_error}")

    def _init_deepseek_client(self):
        """Initialize DeepSeek API client."""
        if not settings.DEEPSEEK_API_KEY or settings.DEEPSEEK_API_KEY == "":
            logger.info("DeepSeek API key not configured, skipping DeepSeek initialization")
            return
            
        try:
            # Create OpenAI-compatible client for DeepSeek
            client = OpenAI(
                api_key=settings.DEEPSEEK_API_KEY,
                base_url=f"{settings.DEEPSEEK_API_BASE_URL}/v1"
            )
            
            # Test connection by listing models
            models = client.models.list()
            if models and models.data:
                self.clients["deepseek-reasoner"] = {
                    "client": client,
                    "type": "deepseek",
                    "model_id": settings.DEEPSEEK_MODEL_NAME,
                    "endpoint": settings.DEEPSEEK_API_BASE_URL
                }
                self.available_models.append("deepseek-reasoner")
                logger.info(f"✅ DeepSeek API ({settings.DEEPSEEK_MODEL_NAME}) initialized successfully")
            else:
                logger.warning("⚠️ DeepSeek API connected but no models found")
                
        except Exception as e:
            logger.error(f"❌ Failed to initialize DeepSeek API: {e}")
    
    def _init_anthropic_client(self):
        """Initialize Anthropic client if available."""
        if not ANTHROPIC_AVAILABLE:
            logger.info("Anthropic library not installed, skipping Anthropic initialization")
            return
            
        if not settings.ANTHROPIC_API_KEY or settings.ANTHROPIC_API_KEY == "":
            logger.info("Anthropic API key not configured, skipping Anthropic initialization")
            return
            
        try:
            client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)
            
            # Test connection with a simple message
            test_message = client.messages.create(
                model=settings.ANTHROPIC_MODEL_NAME,
                max_tokens=1,
                messages=[{"role": "user", "content": "Hi"}]
            )
            
            if test_message:
                self.clients["anthropic-claude"] = {
                    "client": client,
                    "type": "anthropic",
                    "model_id": settings.ANTHROPIC_MODEL_NAME,
                    "endpoint": settings.ANTHROPIC_API_BASE_URL
                }
                self.available_models.append("anthropic-claude")
                logger.info(f"✅ Anthropic Claude ({settings.ANTHROPIC_MODEL_NAME}) initialized successfully")
                
        except Exception as e:
            logger.error(f"❌ Failed to initialize Anthropic: {e}")
            
    def get_available_models(self) -> List[str]:
        """Get list of available model names."""
        return self.available_models.copy()
    
    def get_model_info(self, model: str) -> Dict[str, Any]:
        """Get information about a specific model."""
        if model in self.clients:
            client_info = self.clients[model]
            return {
                "name": model,
                "display_name": settings.LLM_DISPLAY_NAMES.get(model, model),
                "type": client_info["type"],
                "endpoint": client_info["endpoint"],
                "available": True
            }
        return {
            "name": model,
            "display_name": settings.LLM_DISPLAY_NAMES.get(model, model),
            "available": False
        }
            
    def generate_response(
        self,
        question: str,
        context: str,
        model: str = "hu-llm3",
        system_prompt: Optional[str] = None,
        temperature: float = 0.3,
        preprompt: str = "",
        postprompt: str = "",
        stream: bool = False,
        response_format: Optional[Dict] = None,
        reasoning_effort: Optional[str] = None,
        verbosity: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Generate a response from the selected LLM.
        
        Args:
            question: User question
            context: Context for the question
            model: Model to use (must be in available_models)
            system_prompt: System prompt for the model
            temperature: Generation temperature
            preprompt: Text to prepend to the question
            postprompt: Text to append to the question
            stream: Whether to stream the response
            response_format: Response format specification
            reasoning_effort: GPT-5 reasoning effort level (low/medium/high)
            verbosity: GPT-5 verbosity level
            
        Returns:
            Dict containing response text, model info, and metadata
        """
        
        if system_prompt is None:
            system_prompt = settings.SYSTEM_PROMPTS["default"]
            
        # Construct the prompt
        prompt = f"""{preprompt}
        {question}

        Textauszüge:
        {context}
        {postprompt}
        """
        
        # Validate model availability
        if model not in self.clients:
            available_models = ", ".join(self.available_models)
            raise ValueError(f"Model '{model}' not available. Available models: {available_models}")
        
        client_info = self.clients[model]
        client_type = client_info["type"]
        
        try:
            if client_type == "hu-llm":
                return self._generate_hu_llm_response(
                    client_info, prompt, system_prompt, temperature, model
                )
            elif client_type == "openai":
                return self._generate_openai_response(
                    client_info, prompt, system_prompt, temperature, model, response_format,
                    reasoning_effort, verbosity
                )
            elif client_type == "openai-gpt5":
                return self._generate_openai_gpt5_response(
                    client_info, prompt, system_prompt, model, reasoning_effort, verbosity
                )
            elif client_type == "gemini":
                return self._generate_gemini_response(
                    client_info, prompt, system_prompt, temperature, model
                )
            elif client_type == "deepseek":
                return self._generate_deepseek_response(
                    client_info, prompt, system_prompt, temperature, model, response_format
                )
            elif client_type == "anthropic":
                return self._generate_anthropic_response(
                    client_info, prompt, system_prompt, temperature, model
                )
            else:
                raise ValueError(f"Unsupported client type: {client_type}")
                
        except Exception as e:
            logger.error(f"Error generating response with {model}: {e}")
            raise

    def _generate_hu_llm_response(
        self, 
        client_info: Dict, 
        prompt: str, 
        system_prompt: str, 
        temperature: float, 
        model: str
    ) -> Dict[str, Any]:
        """Generate response using HU-LLM."""
        client = client_info["client"]
        model_id = client_info["model_id"]
        
        # Build request parameters
        request_params = {
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": prompt}
            ],
            "model": model_id,
            "temperature": temperature
        }
    
        
        chat_completion = client.chat.completions.create(**request_params)
        
        return {
            "text": chat_completion.choices[0].message.content,
            "model": model,
            "model_id": model_id,
            "provider": "hu-llm",
            "endpoint": client_info["endpoint"],
            "metadata": chat_completion.model_dump()
        }

    def _generate_openai_response(
        self, 
        client_info: Dict, 
        prompt: str, 
        system_prompt: str, 
        temperature: float, 
        model: str,
        response_format: Optional[Dict] = None,
        reasoning_effort: Optional[str] = None,
        verbosity: Optional[str] = None
    ) -> Dict[str, Any]:
        """Generate response using OpenAI (GPT-4 and earlier models)."""
        client = client_info["client"]
        model_id = client_info["model_id"]
        
        # Build request parameters for standard OpenAI models
        request_params = {
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": prompt}
            ],
            "model": model_id,
            "temperature": temperature
        }
            
        # Add response_format if specified
        if response_format:
            request_params["response_format"] = response_format
        
        chat_completion = client.chat.completions.create(**request_params)
        
        return {
            "text": chat_completion.choices[0].message.content,
            "model": model,
            "model_id": model_id,
            "provider": "openai",
            "endpoint": client_info["endpoint"],
            "metadata": chat_completion.model_dump()
        }

    def _generate_openai_gpt5_response(
        self, 
        client_info: Dict, 
        prompt: str, 
        system_prompt: str, 
        model: str,
        reasoning_effort: Optional[str] = None,
        verbosity: Optional[str] = None
    ) -> Dict[str, Any]:
        """Generate response using OpenAI GPT-5 (uses responses.create API with streaming)."""
        client = client_info["client"]
        model_id = client_info["model_id"]
        
        # Combine system prompt and user prompt for GPT-5
        full_input = f"{system_prompt}\n\n{prompt}"
        
        # Build request parameters for GPT-5 responses API
        request_params = {
            "model": model_id,
            "input": full_input,
            "stream": True  # Enable streaming to capture detailed reasoning
        }
        
        # Add reasoning parameters if specified
        # Pass summary: 'detailed' to request the detailed reasoning summary
        if reasoning_effort:
            request_params["reasoning"] = {
                "effort": reasoning_effort,
                "summary": "detailed"  # Request detailed reasoning summary ('concise', 'detailed', or 'auto')
            }
        else:
            # Even if no effort specified, request reasoning with default settings
            request_params["reasoning"] = {
                "effort": "medium",
                "summary": "detailed"
            }
        
        # Add text verbosity if specified
        if verbosity:
            request_params["text"] = {"verbosity": verbosity}
        
        # Use the new responses.create() API for GPT-5 with streaming
        logger.info(f"Starting GPT-5 streaming response with reasoning_effort={reasoning_effort}, verbosity={verbosity}")
        
        response_stream = client.responses.create(**request_params)
        
        # Collect reasoning and output streams separately
        full_reasoning_log = []
        final_output_message = []
        response_metadata = {}
        
        try:
            # Loop over the streaming events as they come in
            for event in response_stream:
                event_type = getattr(event, 'type', None)
                
                # Log event type at debug level (reduced verbosity)
                logger.debug(f"Received event type: {event_type}")
                
                # Capture reasoning stream - this is the key event type!
                if event_type == "response.reasoning_summary_text.delta":
                    # This is a reasoning chunk - the main content we want!
                    text = getattr(event, 'text', None) or getattr(event, 'delta', None) or ''
                    if text:
                        full_reasoning_log.append(str(text))
                        logger.debug(f"Captured reasoning chunk: {len(str(text))} chars")
                
                # Also capture reasoning.done event which may have complete text
                elif event_type == "response.reasoning_summary_text.done":
                    text = getattr(event, 'text', None) or ''
                    if text:
                        # This might be a summary, add it if we don't have much reasoning yet
                        logger.debug(f"Captured reasoning done event: {len(str(text))} chars")
                
                # Also capture any other reasoning-related events
                elif event_type and "reasoning" in event_type.lower():
                    # Try multiple attribute names for the text content
                    text = (getattr(event, 'text', None) or 
                           getattr(event, 'delta', None) or 
                           getattr(event, 'content', None) or '')
                    if text:
                        full_reasoning_log.append(str(text))
                        logger.debug(f"Captured other reasoning event ({event_type}): {len(str(text))} chars")
                
                # Capture output stream (final answer) - use the actual event type from OpenAI
                elif event_type == "response.output_text.delta":
                    # Try multiple attribute names for the text content
                    text = (getattr(event, 'delta', None) or 
                           getattr(event, 'text', None) or 
                           getattr(event, 'content', None) or '')
                    if text:
                        final_output_message.append(str(text))
                        logger.debug(f"Captured output chunk: {len(str(text))} chars")
                
                # Also check for output_text.done which might have complete text
                elif event_type == "response.output_text.done":
                    # This might contain the full text
                    text = (getattr(event, 'text', None) or 
                           getattr(event, 'output_text', None) or '')
                    if text and not final_output_message:  # Only use if we haven't collected deltas
                        final_output_message.append(str(text))
                        logger.debug(f"Captured complete output: {len(str(text))} chars")
                
                # Capture completion metadata
                elif event_type == "response.completed":
                    # Stream is finished, capture any final metadata
                    if hasattr(event, 'usage'):
                        response_metadata['usage'] = event.usage
                    if hasattr(event, 'model'):
                        response_metadata['model_used'] = event.model
                    
                    # Response object is available but we've already captured everything from the stream
                    logger.info("GPT-5 streaming completed")
                    break
                
        except Exception as e:
            logger.error(f"Error during GPT-5 streaming: {e}", exc_info=True)
            # If streaming fails, try to salvage what we have
            if not final_output_message:
                raise
        
        # Combine the collected streams
        full_reasoning_content = "".join(full_reasoning_log)
        final_answer = "".join(final_output_message)
        
        logger.info(f"GPT-5 response complete - Reasoning: {len(full_reasoning_content)} chars, Output: {len(final_answer)} chars")
        
        result = {
            "text": final_answer,
            "model": model,
            "model_id": model_id,
            "provider": "openai-gpt5",
            "endpoint": client_info["endpoint"],
            "metadata": response_metadata
        }
        
        # Add reasoning content if captured
        if full_reasoning_content:
            result["reasoning_content"] = full_reasoning_content
            logger.info(f"Captured {len(full_reasoning_content)} characters of reasoning content")
            
        return result

    def _generate_gemini_response(
        self, 
        client_info: Dict, 
        prompt: str, 
        system_prompt: str, 
        temperature: float, 
        model: str
    ) -> Dict[str, Any]:
        """Generate response using Gemini."""
        genai = client_info["client"]
        model_id = client_info["model_id"]
        
        # Combine system prompt and user prompt for Gemini
        full_prompt = f"System: {system_prompt}\n\nUser: {prompt}"
        
        # Configure generation parameters
        generation_config = {
            "temperature": temperature,
        }
        
        # Create model instance
        model_instance = genai.GenerativeModel(model_id)
        
        # Generate response
        response = model_instance.generate_content(
            full_prompt,
            generation_config=generation_config
        )
        
        return {
            "text": response.text,
            "model": model,
            "model_id": model_id,
            "provider": "gemini",
            "endpoint": client_info["endpoint"],
            "metadata": {
                "usage": getattr(response, 'usage_metadata', {}),
                "finish_reason": getattr(response.candidates[0], 'finish_reason', None) if response.candidates else None
            }
        }

    def _generate_deepseek_response(
        self, 
        client_info: Dict, 
        prompt: str, 
        system_prompt: str, 
        temperature: float, 
        model: str,
        response_format: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """Generate response using DeepSeek API."""
        client = client_info["client"]
        model_id = client_info["model_id"]
        
        # Build request parameters
        request_params = {
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": prompt}
            ],
            "model": model_id,
            "temperature": temperature
        }
        
        # Add response_format if specified
        if response_format:
            request_params["response_format"] = response_format
        
        chat_completion = client.chat.completions.create(**request_params)
        
        return {
            "text": chat_completion.choices[0].message.content,
            "model": model,
            "model_id": model_id,
            "provider": "deepseek",
            "endpoint": client_info["endpoint"],
            "metadata": chat_completion.model_dump()
        }

    def _generate_anthropic_response(
        self, 
        client_info: Dict, 
        prompt: str, 
        system_prompt: str, 
        temperature: float, 
        model: str
    ) -> Dict[str, Any]:
        """Generate response using Anthropic Claude."""
        client = client_info["client"]
        model_id = client_info["model_id"]
        
        # Anthropic uses a different format
        message = client.messages.create(
            model=model_id,
            max_tokens=4000,  # Adjust as needed
            temperature=temperature,
            system=system_prompt,
            messages=[
                {"role": "user", "content": prompt}
            ]
        )
        
        return {
            "text": message.content[0].text,
            "model": model,
            "model_id": model_id,
            "provider": "anthropic",
            "endpoint": client_info["endpoint"],
            "metadata": {
                "usage": {
                    "input_tokens": message.usage.input_tokens,
                    "output_tokens": message.usage.output_tokens
                },
                "stop_reason": message.stop_reason
            }
        }

    def health_check(self) -> Dict[str, Any]:
        """Perform health check on all configured LLM providers."""
        health_status = {
            "overall": "healthy",
            "providers": {},
            "available_models": self.available_models
        }
        
        failed_providers = []
        
        for model_name, client_info in self.clients.items():
            try:
                if client_info["type"] == "hu-llm":
                    # Test with a simple models list call
                    client_info["client"].models.list()
                    health_status["providers"][model_name] = {
                        "status": "healthy",
                        "endpoint": client_info["endpoint"]
                    }
                elif client_info["type"] == "openai":
                    # Test with a simple models list call
                    client_info["client"].models.list()
                    health_status["providers"][model_name] = {
                        "status": "healthy",
                        "endpoint": client_info["endpoint"]
                    }
                elif client_info["type"] == "gemini":
                    # Test with list models call
                    list(client_info["client"].list_models())
                    health_status["providers"][model_name] = {
                        "status": "healthy",
                        "endpoint": client_info["endpoint"],
                        "model_id": client_info["model_id"]  # ADDED: Include model_id
                    }
                elif client_info["type"] == "deepseek":
                    # Test DeepSeek API connection
                    client_info["client"].models.list()
                    health_status["providers"][model_name] = {
                        "status": "healthy",
                        "endpoint": client_info["endpoint"]
                    }
                elif client_info["type"] == "anthropic":
                    # Test Anthropic connection with minimal request
                    test_message = client_info["client"].messages.create(
                        model=client_info["model_id"],
                        max_tokens=1,
                        messages=[{"role": "user", "content": "Hi"}]
                    )
                    health_status["providers"][model_name] = {
                        "status": "healthy",
                        "endpoint": client_info["endpoint"]
                    }
                    
            except Exception as e:
                health_status["providers"][model_name] = {
                    "status": "unhealthy",
                    "error": str(e),
                    "endpoint": client_info["endpoint"]
                }
                failed_providers.append(model_name)
        
        if failed_providers:
            health_status["overall"] = "degraded"
            if len(failed_providers) == len(self.clients):
                health_status["overall"] = "unhealthy"
        
        return health_status
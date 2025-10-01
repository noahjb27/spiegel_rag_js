# SPIEGEL RAG System

A Retrieval-Augmented Generation (RAG) system for searching and analyzing historical SPIEGEL magazine articles from 1948-1979. This system provides researchers with powerful tools for semantic search and AI-assisted analysis.

## 🏗️ System Architecture

```
spiegel_rag_js/
├── backend/              # Python Flask API server
│   ├── app/             # Core application modules
│   │   ├── api/         # REST API endpoints
│   │   ├── core/        # Search and LLM services
│   │   ├── config/      # Configuration management
│   │   └── services/    # Business logic layer
│   ├── models/          # FastText models (1.3GB - downloaded separately)
│   ├── requirements.txt # Python dependencies
│   ├── .env.example     # Environment configuration template
│   └── run.py          # Development server entry point
├── frontend/            # Next.js React application
│   └── src/            # TypeScript source code
└── README.md           # This file
```

## Deployment Guide

### For Production Server Deployment

#### 1. Prerequisites
- Python 3.8+ with pip
- Node.js 18+ with npm
- Access to HU Berlin infrastructure (ChromaDB, Ollama, LLM endpoints)
- Domain/server for hosting

#### 2. Backend Setup
```bash
# 1. Clone and navigate
git clone <repository-url>
cd spiegel_rag_js/backend

# 2. Install Python dependencies
pip install -r requirements.txt

# 3. Configure environment
cp .env.example .env
# Edit .env with your domain and API keys (see configuration section)

# 4. Download required models (CRITICAL - 1.3GB download)
python model_import.py

# 5. Start production server
python run.py
```

#### 3. Frontend Setup
```bash
# 1. Navigate to frontend
cd ../frontend

# 2. Install dependencies
npm install

# 3. Configure API endpoint
# configure .env in backend:
# NEXT_PUBLIC_API_BASE_URL=https://your-backend-domain.com

# 4. Build for production
npm run build

# 5. Start production server
npm start
```

## 🔧 Configuration

### Default Configuration
- **Vector Database**: HU Berlin ChromaDB (pre-configured)
- **Embeddings**: HU Berlin Ollama/nomic-embed-text (pre-configured)
- **Default LLMs**: HU Berlin LLM endpoints (no API keys needed)
- **Archive Coverage**: SPIEGEL articles 1948-1979

## 🔍 Features

### Two-Phase Research Workflow

#### Phase 1: Heuristik (Source Discovery)
- **Standard Search**: Semantic vector search with keyword filtering
- **LLM-Assisted Search**: AI-powered relevance evaluation and ranking
- **Time-based Filtering**: Search within specific year ranges
- **Keyword Expansion**: Semantic expansion using FastText models

#### Phase 2: Analysis (Source Processing)
- **Multi-LLM Support**: Choose from 6 different language models
- **Source-based Analysis**: Generate insights based only on selected texts
- **Configurable Parameters**: Temperature, system prompts, batch processing

### Available Language Models
- **HU Berlin LLMs**: llm1, llm3 (no API keys required)
- **External APIs**: OpenAI GPT-4o, Google Gemini 2.5 Pro, DeepSeek Reasoner, Anthropic Claude 3.5 Sonnet

## 📚 API Documentation

### Core Endpoints
- `POST /api/search/standard` - Standard semantic search
- `POST /api/search/llm-assisted` - AI-enhanced search with evaluation
- `POST /api/search/analyze` - Analyze selected chunks with LLM
- `GET /api/keywords/expand` - Expand search terms semantically
- `GET /api/health` - Service health check

### Response Formats
All endpoints return JSON with consistent error handling and logging.

## 🐛 Troubleshooting

### Common Deployment Issues

**1. Models Not Found**
```
ERROR: Failed to load FastText model
```
**Solution**: Run `python model_import.py` in backend directory

**2. CORS Errors**
```
Access blocked by CORS policy
```
**Solution**: Update `CORS_ORIGINS` in backend/.env

**3. External Service Unavailable**
```
ChromaDB connection failed
```
**Solution**: Verify HU Berlin infrastructure access

**4. Memory Issues**
```
Out of memory during model loading
```
**Solution**: Ensure server has 4GB+ RAM available

### Monitoring & Logs
- **Backend Logs**: Detailed logging with configurable levels (DEBUG/INFO/WARNING/ERROR)
- **Health Checks**: `/api/health` endpoint for service monitoring
- **Error Tracking**: Comprehensive exception handling and reporting

---

**Last Updated**: September 2025  
**Version**: 1.0.0
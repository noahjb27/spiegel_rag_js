# SpiegelRAG

A Retrieval-Augmented Generation (RAG) system for searching and analyzing historical SPIEGEL magazine articles.

## 🏗️ Project Structure

```
spiegel_rag_js/
├── backend/          # Python Flask API server
│   ├── app/         # Application modules
│   ├── models/      # FastText models (downloaded separately)
│   ├── model_import.py  # Model download script
│   └── run.py       # Server entry point
├── frontend/        # Next.js React application
│   └── src/         # Source code
└── README.md        # This file
```

## 🚀 Quick Start

### Prerequisites

- Python 3.8+
- Node.js 16+
- npm/yarn/pnpm

### 1. Clone the Repository

```bash
git clone <repository-url>
cd spiegel_rag_js
```

### 2. Backend Setup

```bash
cd backend

# Install Python dependencies
pip install -r requirements.txt

# Download required FastText models (REQUIRED!)
python model_import.py

# Start the backend server
python run.py
```

The backend will be available at `http://localhost:5001`

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

The frontend will be available at `http://localhost:3000`

## 📦 Model Setup

**⚠️ IMPORTANT**: The FastText models are required for the backend to function properly. Run the model import script before starting the server:

```bash
cd backend
python model_import.py
```

This script will:
- Download ~1.3GB of FastText models from HU Berlin Box
- Extract them to the `backend/models/` directory
- Clean up temporary files

The models include:
- `fasttext_model_spiegel_corpus_neu_50epochs_2.model` (6.3 MB)
- Supporting vector files (~1.3 GB total)

## 🔧 Configuration

### Backend Configuration

The backend connects to:
- **ChromaDB**: Remote vector database at `dighist.geschichte.hu-berlin.de:8000`
- **LLM Services**: HU Berlin compute clusters
  - `hu-llm1`: `https://llm1-compute.cms.hu-berlin.de/v1/`
  - `hu-llm3`: `https://llm3-compute.cms.hu-berlin.de/v1/`
- **Ollama**: Local models for embeddings

### Environment Variables

Optional API keys can be configured:
- `OPENAI_API_KEY`: For OpenAI models
- `GEMINI_API_KEY`: For Google Gemini models

## 🔍 Features

### Search Capabilities
- **Semantic Search**: Vector-based similarity search
- **Keyword Filtering**: Boolean keyword matching
- **Time-Based Filtering**: Search within specific year ranges
- **Multi-Strategy Search**: Standard, enhanced time window, and LLM-assisted search

### Analysis Features
- **LLM-Powered Analysis**: Analyze search results with language models
- **Keyword Expansion**: Semantic expansion of search terms
- **Configurable Parameters**: Chunk size, retrieval count, relevance thresholds

## 🏃‍♂️ Development

### Backend Development

```bash
cd backend
python run.py  # Starts Flask dev server with hot reload
```

### Frontend Development

```bash
cd frontend
npm run dev    # Starts Next.js dev server with hot reload
```

## 🧪 Testing

### Backend Tests

```bash
cd backend
python -m pytest tests/
```

### Frontend Tests

```bash
cd frontend
npm test
```

## 📝 API Documentation

### Search Endpoints

- `POST /api/search/standard` - Standard search
- `POST /api/search/analyze` - Analyze search results
- `GET /api/keywords/expand` - Expand keywords

### Configuration Endpoints

- `GET /api/config/strategies` - Available search strategies
- `GET /api/config/models` - Available LLM models

## 🐛 Troubleshooting

### Common Issues

1. **FastText Model Not Found**
   ```
   ERROR: Failed to load FastText model: [Errno 2] No such file or directory
   ```
   **Solution**: Run `python model_import.py` in the backend directory

2. **Socket Operation Errors**
   ```
   OSError: [WinError 10038] An operation was attempted on something that is not a socket
   ```
   **Solution**: Windows-specific Flask dev server issue. Consider using a production WSGI server.

3. **Model Not Found in Ollama**
   ```
   WARNING: DeepSeek R1 model 'deepseek-r1:32b' not found in Ollama
   ```
   **Solution**: Update model configuration or install the missing model.

### Log Levels

The backend provides detailed logging:
- `INFO`: Normal operations
- `WARNING`: Non-critical issues
- `ERROR`: Critical errors requiring attention

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

[Add license information here]

## 🙏 Acknowledgments

- HU Berlin for providing compute resources and models
- ChromaDB for vector storage
- The SPIEGEL archive for historical data

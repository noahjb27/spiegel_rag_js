# SPIEGEL RAG System - Feature Documentation

This document provides a detailed overview of the key features and mechanisms in the SPIEGEL RAG System, focusing on how the application processes searches, handles citations, and captures streaming responses.

## Table of Contents
- [Architecture Overview](#architecture-overview)
- [Filtering System](#filtering-system)
- [Citation Detection and Linking](#citation-detection-and-linking)
- [Streaming Response Handling](#streaming-response-handling)
- [Two-Phase Research Workflow](#two-phase-research-workflow)

---

## Architecture Overview

The SPIEGEL RAG System uses a clean, layered architecture that separates concerns between data retrieval, business logic, and presentation:

```
┌─────────────────────────────────────────────┐
│  Frontend (Next.js + TypeScript)            │
│  - SearchPanel & AnalysisPanel components   │
│  - Zustand state management                 │
│  - Citation processing & rendering          │
└───────────────┬─────────────────────────────┘
                │ HTTP/REST API
┌───────────────▼─────────────────────────────┐
│  API Layer (Flask Blueprints)               │
│  - /api/search/* endpoints                  │
│  - /api/keywords/* endpoints                │
└───────────────┬─────────────────────────────┘
                │
┌───────────────▼─────────────────────────────┐
│  Service Layer (SearchService)              │
│  - Centralized business logic               │
│  - Request validation & coordination        │
└───────────────┬─────────────────────────────┘
                │
        ┌───────┴────────┐
        │                │
┌───────▼──────┐  ┌──────▼──────────┐
│ Strategy     │  │  LLM Service    │
│ Pattern      │  │  - Multi-model  │
│ - Standard   │  │  - Streaming    │
│ - TimeWindow │  │  - Reasoning    │
│ - Agent      │  └─────────────────┘
└───────┬──────┘
        │
┌───────▼─────────────────────────────────────┐
│  Vector Store (ChromaDB)                    │
│  - Similarity search                        │
│  - Metadata filtering                       │
│  - Keyword matching                         │
└─────────────────────────────────────────────┘
```

**Request Flow**: User input flows from the frontend through the API layer to the SearchService, which coordinates between different search strategies and the vector store. Results flow back up through the layers, with the frontend handling presentation, citation linking, and user interactions.

---

## Filtering System

The filtering system provides multiple layers of control to help researchers narrow down their searches across the SPIEGEL archive. All filters work together and can be combined to create highly specific queries.

### 1. Keyword Filtering with Boolean Logic

The system supports sophisticated boolean keyword filtering that allows researchers to express complex search requirements using natural language operators.

**Supported Operators:**
- `AND` - All terms must be present
- `OR` - At least one term must be present
- `NOT` - Terms must not be present

**Example Queries:**
```
mauer AND berlin           # Both terms required
wall OR mauer              # Either term acceptable
berlin NOT mauer           # Berlin yes, mauer no
(berlin OR DDR) AND mauer  # Complex combinations
```

**Processing Flow:**

1. **Expression Parsing**: The system first parses the boolean expression into three categories:
   - MUST terms (from AND operators)
   - SHOULD terms (from OR operators)
   - MUST_NOT terms (from NOT operators)

2. **Metadata Field Search**: Keywords are searched across configurable metadata fields:
   - **Text** (`page_content`) - The full article text
   - **Artikeltitel** - Article titles
   - **Schlagworte** - Tagged keywords
   - **Zusammenfassung** - Article summaries

3. **Application Logic**: Each document is evaluated:
   - All MUST terms must be found (in the selected fields)
   - At least one SHOULD term must be found (if any SHOULD terms exist)
   - None of the MUST_NOT terms can be present

This creates a powerful pre-filter before semantic similarity search, ensuring that results contain the specified keywords regardless of their semantic similarity to the query.

### 2. Semantic Keyword Expansion

To help researchers discover related terms and broaden their searches, the system offers semantic keyword expansion using FastText word embeddings.

**How It Works:**

1. The system extracts all meaningful terms from the boolean keyword expression
2. Each term is queried against pre-trained FastText models (trained on historical German text)
3. Similar words are returned along with similarity scores and frequency data
4. Researchers can review the expansion preview before executing the search

**Example:**
```
Input: "mauer"
Expansion: Mauer (1.000), mauern (0.842), ummauen (0.821),
           Mauern (0.819), Berliner (0.756)...
```

This feature is particularly valuable for historical research, as it helps identify period-appropriate synonyms and related concepts that might not be obvious to modern researchers.

### 3. Temporal Filtering

The system provides several approaches to filtering by time period:

#### Basic Year Range Filter
Simply select a start and end year (1948-1979) to limit searches to specific time periods. This is implemented as a metadata filter on the `Jahrgang` (year) field in the vector database.

#### Time Window Strategy
For more balanced temporal distribution, the Enhanced Time Window Strategy divides the selected year range into smaller windows (e.g., 5-year intervals) and searches each window independently.

**Benefits:**
- Prevents dominance by any single time period
- Ensures representation across the entire range
- Provides per-window statistics and coverage
- Useful for tracking how topics evolve over time

**Example:**
```
Query: "Atomenergie" from 1960-1975, 5-year windows
Results: [1960-1964]: 10 chunks
         [1965-1969]: 10 chunks
         [1970-1974]: 10 chunks
         [1975-1975]: 5 chunks
```

This ensures balanced coverage rather than getting all results from one peak year.

### 4. Relevance Score Filtering

Every search result includes a cosine similarity score indicating how semantically similar it is to the query. The system uses a minimum relevance threshold (default: 0.3) to filter out results that are too dissimilar.

**Score Interpretation:**
- **0.7+**: Highly relevant
- **0.5-0.7**: Moderately relevant
- **0.3-0.5**: Loosely related
- **<0.3**: Filtered out

For LLM-assisted searches, a second evaluation score is added where the AI model rates each result's relevance on a scale, providing more nuanced ranking.

### 5. Filter Combination

All filters work together seamlessly:

```
Example Combined Query:
- Semantic query: "Wirtschaftskrise"
- Keywords: "inflation AND (arbeitslosigkeit OR Rezession)"
- Year range: 1970-1979
- Time windows: 5-year intervals
- Min relevance: 0.5

Result: Documents from 1970-1979 containing inflation AND
        (unemployment OR recession), semantically similar to
        "economic crisis", distributed across two 5-year windows,
        with similarity ≥ 0.5
```

---

## Citation Detection and Linking

One of the most sophisticated features of the system is its ability to automatically detect citations in LLM-generated analysis and create interactive links to the source documents. This happens entirely on the frontend and works with any citation format the LLM might use.

### Citation Format Detection

When an LLM generates an analysis answer, it typically includes citations to support its claims. However, different models use different citation formats. The system automatically detects and handles multiple formats:

**Supported Formats:**
- Square brackets: `[1]`, `[2]`, `[3]`
- Parentheses: `(1)`, `(2)`, `(3)`
- Superscripts: `¹`, `²`, `³`
- Mixed formats within the same text

**Smart Detection Process:**

1. **Format Analysis**: The system analyzes the entire response text to determine which citation format is dominant by counting occurrences of each pattern type

2. **Pattern Extraction**: Using the detected format, it scans the text with format-specific regular expressions to locate all citations and their positions

3. **Citation Mapping**: Each citation number is mapped to its corresponding source chunk (citation `[1]` maps to the first chunk in the context, `[2]` to the second, etc.)

### Interactive Citation Components

Once citations are detected, the system replaces the plain text citations with interactive components:

**Citation Chips:**
- Displayed as colored, clickable badges embedded in the text
- Show the citation number prominently
- Display a tooltip on hover showing source metadata (article title, date)
- Smooth animations for hover and click interactions

**Example Visual:**
```
According to contemporary reports [1], the Berlin Wall was
constructed over a single weekend ².
```
Becomes:
```
According to contemporary reports [interactive chip: 1],
the Berlin Wall was constructed over a single weekend
[interactive chip: 2].
```

### Citation Reference Modal

Clicking any citation chip opens a detailed modal showing the complete source information:

**Modal Contents:**
- **Article Title**: Full title of the SPIEGEL article
- **Publication Date**: Issue date and year
- **Article Metadata**: Subtitle, text type, section
- **Relevance Scores**: Both similarity and LLM evaluation scores
- **Full Content**: The complete chunk text that was used in the analysis
- **Source Link**: Direct link to the original article (if available)

This allows researchers to immediately verify claims, assess source quality, and dive deeper into specific citations without losing their place in the analysis.

### Markdown Integration

The citation system integrates seamlessly with markdown rendering:

**Processing Pipeline:**

1. **Parse Markdown**: The LLM response is parsed as markdown (supporting headers, lists, bold, italic, etc.)

2. **Custom Text Renderer**: A custom renderer intercepts each text paragraph to process citations:
   - Detects citations using the smart detection system
   - Splits the text at each citation position
   - Inserts interactive citation components
   - Preserves all surrounding formatting

3. **Render Output**: The final output preserves all markdown formatting while making citations interactive

**Example:**
```markdown
## Historical Context

The construction of the Berlin Wall [1] in 1961 marked a
significant escalation in the Cold War. According to
contemporary SPIEGEL reporting [2], the decision was made
hastily in response to increasing emigration.

### Economic Impact

- Trade between sectors declined [3]
- Western businesses adapted [4]
```

All numbered citations become interactive while preserving the markdown structure (headers, lists, etc.).

### Citation Validation

The system includes validation to ensure citation integrity:

- Citations must be sequential (no skipping numbers)
- Citation numbers must correspond to available chunks
- Invalid citations are rendered as plain text with a warning indicator
- The modal prevents opening if the referenced chunk doesn't exist

---

## Streaming Response Handling

For select language models (particularly OpenAI's GPT-5), the system captures streaming responses to provide detailed insight into the AI's reasoning process and enable comprehensive export of analysis traces.

### Standard vs. Streaming Responses

**Standard Mode** (GPT-4, Gemini, Claude, DeepSeek):
- The LLM processes the query and returns the complete response at once
- The system receives only the final answer text
- Reasoning process (if any) happens internally and isn't accessible

**Streaming Mode** (GPT-5):
- The LLM sends its response in real-time as it generates it
- Both the reasoning process and the final answer are captured separately
- Researchers can see exactly how the model arrived at its conclusions

### GPT-5 Streaming Architecture

For GPT-5, the system uses OpenAI's streaming API with detailed reasoning capture:

**Request Configuration:**
```
Model: gpt-5
Streaming: Enabled
Reasoning: {
  effort: "low" | "medium" | "high"  (configurable)
  summary: "detailed"                 (captures full reasoning)
}
```

**Reasoning Effort Levels:**
- **Low**: Quick analysis with minimal reasoning steps
- **Medium**: Balanced approach with moderate reasoning depth
- **High**: Thorough analysis with extensive reasoning chains

### Stream Event Processing

The streaming response arrives as a series of events, each containing different types of information. The system processes three distinct event streams:

#### 1. Reasoning Stream
These events contain the model's internal reasoning process:
- Event types: `response.reasoning_summary_text.delta`, `response.reasoning_summary_text.done`
- Contains the model's step-by-step thinking, deliberation, and analysis approach
- Accumulated separately from the final answer

**Example Reasoning Content:**
```
Let me analyze these sources chronologically...
First, I notice that source [1] from 1961 describes...
This contradicts source [3] from 1963, which suggests...
Therefore, I should emphasize the uncertainty...
```

#### 2. Output Stream
These events contain the actual answer text that will be shown to the user:
- Event types: `response.output_text.delta`, `response.output_text.done`
- Contains the final formatted answer with citations
- Rendered to the user as it arrives (if real-time streaming is enabled)

#### 3. Completion Metadata
The final event provides statistics and metadata:
- Event type: `response.completed`
- Includes token usage, model information, completion reason
- Used for logging and cost tracking

### Dual Accumulation

The system maintains two separate accumulator buffers:

**Reasoning Buffer:**
- Captures all reasoning-related events
- Builds the complete reasoning trace
- Not shown to user by default (only in exports)

**Output Buffer:**
- Captures the final answer text
- Builds the complete response shown to user
- Updates in real-time if streaming display is enabled

Both buffers are returned in the response metadata, making the complete reasoning chain available for export.

### Reasoning Trace Export

One of the most powerful features for research is the ability to export the complete analysis trace, including the model's reasoning process:

**Export Contents:**
```json
{
  "question": "Original research question",
  "answer": "Complete LLM response with citations",
  "reasoning": "Full reasoning trace (GPT-5 only)",
  "model": "gpt-5",
  "parameters": {
    "temperature": 0.7,
    "reasoning_effort": "high"
  },
  "chunks": [
    {
      "content": "Source text...",
      "metadata": {
        "title": "Article title",
        "date": "1975-03-15",
        "relevance_score": 0.85
      }
    }
  ],
  "timestamp": "2025-11-14T10:30:00Z"
}
```

**Export Workflow:**

1. **Analysis Completion**: After the LLM finishes, the complete response (including reasoning) is stored in memory

2. **Trace Service**: A background service saves the complete trace as a JSON file with a unique identifier

3. **Download Button**: The frontend displays an "Analyse Exportieren" (Export Analysis) button

4. **File Delivery**: Clicking downloads the complete JSON file for archival or further analysis

5. **Cleanup**: A background scheduler automatically removes trace files after 1 hour to manage disk space

This export feature is invaluable for:
- **Transparency**: Understanding exactly how the AI reached its conclusions
- **Reproducibility**: Documenting the complete analysis process
- **Quality Control**: Reviewing the reasoning for logical errors or biases
- **Citation Verification**: Cross-referencing the sources actually used vs. cited

### Benefits of Streaming Architecture

The streaming approach provides several advantages:

1. **Real-time Feedback**: Users can see the analysis progressing (if enabled)
2. **Early Termination**: Ability to cancel if the direction is unhelpful
3. **Reasoning Transparency**: Access to the complete thinking process
4. **Research Documentation**: Complete traces for academic papers and reports
5. **Debugging**: Ability to see where the model might have gone wrong

---

## Two-Phase Research Workflow

The system is designed around a two-phase workflow optimized for historical research:

### Phase 1: Heuristik (Discovery)

The discovery phase focuses on finding relevant sources using semantic search combined with various filters:

**Standard Search:**
1. Enter a semantic query describing your research topic
2. Apply keyword filters, year ranges, and other constraints
3. Review results sorted by relevance score
4. Select promising chunks for deeper analysis

**LLM-Assisted Search:**
1. Same as standard search, but with AI evaluation
2. Each result is rated by an LLM for relevance to your query
3. Results are re-ranked based on AI evaluation + similarity score
4. More accurate but slower (requires LLM call per result)

**Key Features:**
- Multi-select results with checkboxes
- View metadata, scores, and full text
- Keyword expansion to discover related terms
- Time window distribution for balanced coverage

### Phase 2: Analysis (Processing)

The analysis phase transforms selected sources into structured insights:

**Analysis Workflow:**
1. Transfer selected chunks from discovery phase (or upload custom texts)
2. Choose an LLM model (6 available: HU-LLM, GPT-4o, Gemini, DeepSeek, Claude)
3. Configure parameters:
   - Temperature (creativity vs. consistency)
   - System prompt (instructions to the LLM)
   - Reasoning effort (GPT-5 only)
4. Submit analysis request
5. Review answer with interactive citations
6. Export complete reasoning trace (GPT-5 only)

**Key Features:**
- Markdown-formatted responses with full formatting support
- Automatic citation detection and linking
- Source verification via citation modals
- Complete reasoning transparency (GPT-5)
- Export for documentation and reproducibility

### Integration Points

The two phases work together seamlessly:

```
Discovery → Select Sources → Transfer → Analysis → Export

User conducts broad search to find relevant articles
    ↓
Reviews results and selects most promising chunks
    ↓
Transfers selections to analysis workspace
    ↓
LLM generates insights based only on selected sources
    ↓
User reviews answer with interactive citation links
    ↓
Exports complete trace for documentation
```

This workflow supports the complete research lifecycle from initial exploration through final documentation, with full transparency and source verification at every step.

---

## Summary

The SPIEGEL RAG System combines sophisticated filtering, intelligent citation management, and transparent AI reasoning to create a powerful tool for historical research:

- **Multi-layered filtering** allows precise control over search scope while maintaining semantic relevance
- **Automatic citation detection** creates interactive links regardless of LLM citation format
- **Streaming response capture** provides complete transparency into AI reasoning (GPT-5)
- **Two-phase workflow** supports both discovery and analysis with seamless integration

These features work together to provide researchers with both powerful search capabilities and rigorous source verification, essential for academic work with historical documents.

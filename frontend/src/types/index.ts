// frontend/src/types/index.ts
// ==============================================================================
// Centralized TypeScript definitions for the entire application.
// Defining our data shapes here ensures consistency and prevents bugs.
// ==============================================================================

export interface ChunkMetadata {
    Artikeltitel?: string;
    Untertitel?: string; // Subtitle
    Textsorte?: string; // Text type (e.g., "Leserbrief")
    Datum?: string;
    Jahrgang?: number;
    URL?: string;
    [key: string]: unknown; // Allows for other dynamic metadata keys
}

export interface Chunk {
    id: number; // A client-side ID for UI state management
    content: string;
    metadata: ChunkMetadata;
    relevance_score: number;
    llm_evaluation_score?: number; // Optional, for LLM-assisted search
    llm_evaluation_text?: string; // Optional, LLM evaluation reasoning
    vector_similarity_score?: number; // Optional, cosine similarity score
}

export interface SearchResults {
    chunks: Chunk[];
    metadata: {
        search_time: number;
        total_chunks_found: number;
        [key: string]: unknown;
    };
}

export interface AnalysisResult {
    answer: string;
    metadata: {
        analysis_time: number;
        model_used: string;
        reasoning_trace_filename?: string;
        reasoning_effort?: string;
        verbosity?: string;
        [key: string]: unknown;
    };
}

// Search form state for persistence across tab switches
export interface SearchFormState {
    retrieval_query: string;
    year_start: number;
    year_end: number;
    chunk_size: number;
    top_k: number;
    chunks_per_interval: number;
    use_time_intervals: boolean;
    time_interval_size: number;
    keywords: string;
    search_in: string[];
    use_semantic_expansion: boolean;
    semantic_expansion_factor: number;
    llm_assisted_use_time_intervals: boolean;
    llm_assisted_time_interval_size: number;
    chunks_per_interval_initial: number;
    chunks_per_interval_final: number;
    llm_assisted_min_retrieval_score: number;
    llm_assisted_keywords: string;
    llm_assisted_search_in: string[];
    llm_assisted_model: string;
    llm_assisted_temperature: number;
    llm_assisted_system_prompt_text: string;
}

// Defines the shape of our global state management store
export interface AppState {
    activeTab: number;
    isSearching: boolean;
    searchError: string | null;
    searchResults: SearchResults | null;
    selectedChunkIds: number[];
    isAnalyzing: boolean;
    analysisError: string | null;
    transferredChunks: Chunk[];
    analysisResult: AnalysisResult | null;
    searchFormState: SearchFormState;

    // Actions (functions)
    setActiveTab: (tabIndex: number) => void;
    updateSearchFormState: (updates: Partial<SearchFormState>) => void;
    performSearch: (searchType: 'standard' | 'llm-assisted', params: unknown) => Promise<void>;
    toggleChunkSelection: (chunkId: number) => void;
    selectAllChunks: () => void;
    deselectAllChunks: () => void;
    transferChunksForAnalysis: () => void;
    performAnalysis: (analysisParams: unknown) => Promise<void>;
    downloadResults: (format: 'csv' | 'json') => Promise<void>;
}

// Types for keyword expansion preview
export interface SimilarWord {
    word: string;
    similarity: number;
    frequency: number;
}

export interface KeywordExpansion {
    [term: string]: SimilarWord[];
}

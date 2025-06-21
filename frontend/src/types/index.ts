// frontend/src/types/index.ts
// ==============================================================================
// Centralized TypeScript definitions for the entire application.
// Defining our data shapes here ensures consistency and prevents bugs.
// ==============================================================================

export interface ChunkMetadata {
    Artikeltitel?: string;
    Datum?: string;
    Jahrgang?: number;
    URL?: string;
    [key: string]: any; // Allows for other dynamic metadata keys
}

export interface Chunk {
    id: number; // A client-side ID for UI state management
    content: string;
    metadata: ChunkMetadata;
    relevance_score: number;
    llm_evaluation_score?: number; // Optional, for LLM-assisted search
}

export interface SearchResults {
    chunks: Chunk[];
    metadata: {
        search_time: number;
        total_chunks_found: number;
        [key: string]: any;
    };
}

export interface AnalysisResult {
    answer: string;
    metadata: {
        analysis_time: number;
        model_used: string;
        [key: string]: any;
    };
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

    // Actions (functions)
    setActiveTab: (tabIndex: number) => void;
    performSearch: (searchType: 'standard' | 'llm-assisted', params: any) => Promise<void>;
    toggleChunkSelection: (chunkId: number) => void;
    selectAllChunks: () => void;
    deselectAllChunks: () => void;
    transferChunksForAnalysis: () => void;
    performAnalysis: (analysisParams: any) => Promise<void>;
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

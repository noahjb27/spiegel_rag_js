// frontend/src/store/useAppStore.ts
// ==============================================================================
// Zustand store for global state management, now fully typed with TypeScript.
// ==============================================================================

import { create } from 'zustand';
import { AppState, SearchResults, Chunk } from '@/types';
import apiService from '@/lib/api';
import { saveAs } from 'file-saver';

export const useAppStore = create<AppState>((set, get) => ({
    // --- STATE ---
    activeTab: 0,
    isSearching: false,
    searchError: null,
    searchResults: null,
    selectedChunkIds: [],
    isAnalyzing: false,
    analysisError: null,
    transferredChunks: [],
    analysisResult: null,

    // Search form state persistence
    searchFormState: {
        retrieval_query: '',
        year_start: 1960,
        year_end: 1970,
        chunk_size: 3000,
        top_k: 10,
        chunks_per_interval: 5,
        use_time_intervals: false,
        time_interval_size: 5,
        keywords: '',
        search_in: ['Text'],
        use_semantic_expansion: true,
        semantic_expansion_factor: 3,
        llm_assisted_use_time_intervals: true,
        llm_assisted_time_interval_size: 5,
        chunks_per_interval_initial: 50,
        chunks_per_interval_final: 20,
        llm_assisted_min_retrieval_score: 0.25,
        llm_assisted_keywords: '',
        llm_assisted_search_in: ['Text'],
        llm_assisted_model: 'hu-llm3',
        llm_assisted_temperature: 0.2,
        llm_assisted_system_prompt_text: ''
    },

    // --- ACTIONS ---
    setActiveTab: (tabIndex) => set({ activeTab: tabIndex }),

    updateSearchFormState: (updates) => set((state) => ({
        searchFormState: { ...state.searchFormState, ...updates }
    })),

    performSearch: async (searchType, params) => {
        set({ isSearching: true, searchError: null, searchResults: null, analysisResult: null, transferredChunks: [] });
        try {
            const endpoint = searchType === 'standard' ? '/api/search/standard' : '/api/search/llm-assisted';
            const response = await apiService.post<SearchResults>(endpoint, params);
            
            // Add a unique client-side ID to each chunk for UI management
            const chunksWithIds = response.data.chunks.map((chunk, index) => ({
                ...chunk,
                id: index + 1,
            }));

            const resultsWithIds = { ...response.data, chunks: chunksWithIds };
            set({
                searchResults: resultsWithIds,
                isSearching: false,
                selectedChunkIds: chunksWithIds.map(c => c.id), // Select all by default
            });
        } catch (err: unknown) {
            console.error("Search failed:", err);
            // Extract meaningful error message from API response
            let errorMessage = 'An unexpected error occurred.';
            if (err && typeof err === 'object' && 'response' in err) {
                const response = (err as { response?: { data?: { error?: string } } }).response;
                errorMessage = response?.data?.error || errorMessage;
            } else if (err instanceof Error) {
                errorMessage = err.message;
            }
            set({ searchError: errorMessage, isSearching: false });
        }
    },

    toggleChunkSelection: (chunkId) => set((state) => {
        const selectedChunkIds = state.selectedChunkIds.includes(chunkId)
            ? state.selectedChunkIds.filter(id => id !== chunkId)
            : [...state.selectedChunkIds, chunkId];
        return { selectedChunkIds };
    }),

    selectAllChunks: () => set((state) => {
        if (!state.searchResults) return {};
        const allIds = state.searchResults.chunks.map(c => c.id);
        return { selectedChunkIds: allIds };
    }),

    deselectAllChunks: () => set({ selectedChunkIds: [] }),

    transferChunksForAnalysis: () => set((state) => {
        if (!state.searchResults || state.selectedChunkIds.length === 0) return {};
        const chunksToTransfer = state.searchResults.chunks.filter(chunk => 
            state.selectedChunkIds.includes(chunk.id)
        );
        return {
            transferredChunks: chunksToTransfer,
            analysisResult: null,
            activeTab: 1, // Switch to the Analyse tab
        };
    }),

    performAnalysis: async (analysisParams) => {
        const chunksToAnalyze = get().transferredChunks;
        if (chunksToAnalyze.length === 0) {
            set({ analysisError: "Keine Texte zur Analyse übertragen." });
            return;
        }
        
        set({ isAnalyzing: true, analysisError: null, analysisResult: null });
        try {
            // Remove client-side `id` before sending to backend
            const payload: Record<string, unknown> = {
                ...(typeof analysisParams === 'object' && analysisParams !== null
                    ? (analysisParams as Record<string, unknown>)
                    : {}),
                chunks_to_analyze: chunksToAnalyze.map(({ id: _id, ...rest }: Chunk) => rest),
            };
            const response = await apiService.post('/api/search/analyze', payload);
            set({ analysisResult: response.data, isAnalyzing: false });
        } catch (err: unknown) {
            console.error("Analysis failed:", err);
            // Extract meaningful error message from API response
            let errorMessage = 'An unexpected error occurred.';
            if (err && typeof err === 'object' && 'response' in err) {
                const response = (err as { response?: { data?: { error?: string } } }).response;
                errorMessage = response?.data?.error || errorMessage;
            } else if (err instanceof Error) {
                errorMessage = err.message;
            }
            set({ analysisError: errorMessage, isAnalyzing: false });
        }
    },
    
    downloadResults: async (format) => {
        const { searchResults } = get();
        if (!searchResults) return;

        try {
            const response = await apiService.post(`/api/download/${format}`, {
                retrieved_chunks: searchResults
            }, {
                responseType: 'blob',
            });
            saveAs(response.data, `spiegel-rag-results-${new Date().toISOString()}.${format}`);
        } catch (err) {
            console.error(`Download failed:`, err);
        }
    },
}));

// frontend/src/lib/api.ts
// ==============================================================================
// Centralized API service using Axios for communicating with the Flask backend.
// ==============================================================================

import axios from 'axios';

const apiService = axios.create({
    // Allow overriding via env var NEXT_PUBLIC_API_BASE_URL, fallback to local default
    baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:5001',
    headers: {
        'Content-Type': 'application/json',
    },
});

export default apiService;

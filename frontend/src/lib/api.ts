// frontend/src/lib/api.ts
// ==============================================================================
// Centralized API service using Axios for communicating with the Flask backend.
// ==============================================================================

import axios from 'axios';

const apiService = axios.create({
    // The URL of our running Flask backend.
    // We can use environment variables for this in a real deployment.
    baseURL: 'http://127.0.0.1:5001',
    headers: {
        'Content-Type': 'application/json',
    },
});

export default apiService;

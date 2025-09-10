/**
 * A global configuration flag to switch between the mock API and a real backend.
 * Set this to `false` when you have a backend API ready to be connected.
 * When `true`, the app uses `localStorage` to simulate a backend.
 * When `false`, the app will make real HTTP requests to your backend endpoints.
 */
export const USE_MOCK_API = true;

/**
 * The base URL for your backend API.
 * This is only used when `USE_MOCK_API` is set to `false`.
 */
export const API_BASE_URL = '/api';

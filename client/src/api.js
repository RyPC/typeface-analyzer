/** Base URL for the Express API (from `REACT_APP_API_URL`, e.g. http://localhost:3001). */
export const API_BASE = process.env.REACT_APP_API_URL || "";

/**
 * Absolute URL for an API path. Path must start with `/` (e.g. `/api/stats/count`).
 */
export function apiUrl(path) {
    if (!path.startsWith("/")) {
        throw new Error(`apiUrl: path must start with /, got "${path}"`);
    }
    return `${API_BASE}${path}`;
}

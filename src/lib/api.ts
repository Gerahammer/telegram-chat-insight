// Centralized API configuration.
// All API calls in the app should go through this base URL.
export const API_BASE_URL = "https://seahorse-app-47666.ondigitalocean.app";

/**
 * Build a full API URL from a path.
 * Example: apiUrl("/auth/login") -> "https://.../auth/login"
 */
export function apiUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${normalized}`;
}

/**
 * Thin fetch wrapper that prefixes the API base URL.
 */
export function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  return fetch(apiUrl(path), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
}

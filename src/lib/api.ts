// Centralized API configuration.
// All API calls in the app should go through this base URL.
export const API_BASE_URL = "https://seahorse-app-47666.ondigitalocean.app";

const TOKEN_STORAGE_KEY = "jwtToken";

/**
 * Build a full API URL from a path.
 * Example: apiUrl("/auth/login") -> "https://.../auth/login"
 */
export function apiUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${normalized}`;
}

/** Read the stored JWT (or null). */
export function getAuthToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

/** Persist the JWT for subsequent requests. */
export function setAuthToken(token: string | null): void {
  try {
    if (token) localStorage.setItem(TOKEN_STORAGE_KEY, token);
    else localStorage.removeItem(TOKEN_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export function clearAuthToken(): void {
  setAuthToken(null);
}

/**
 * Thin fetch wrapper that prefixes the API base URL and attaches the
 * stored JWT (if any) as a Bearer token.
 */
export function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...((init?.headers as Record<string, string> | undefined) ?? {}),
  };
  return fetch(apiUrl(path), { ...init, headers });
}

let activeRefreshPromise: Promise<string | null> | null = null;
let inMemoryAccessToken: string | null = null;

export function setInMemoryAccessToken(token: string | null): void {
  inMemoryAccessToken = token;
}

export function getInMemoryAccessToken(): string | null {
  return inMemoryAccessToken;
}

async function executeTokenRefresh(): Promise<string | null> {
  try {
    const refreshResponse = await window.fetch("/api/auth/refresh", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      }
    });

    if (refreshResponse.ok) {
      const refreshData = await refreshResponse.json();
      if (refreshData && refreshData.accessToken) {
        inMemoryAccessToken = refreshData.accessToken;
        return refreshData.accessToken as string;
      }
    }
  } catch (err) {
    console.error("Auto token refresh failed:", err);
  }
  return null;
}

/**
 * Enterprise API Fetch Utility with secure HttpOnly Cookie credentials
 * Pure cookie-based authentication flow. Tokens are NEVER stored in localStorage.
 */
export async function apiFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const url = typeof input === "string" ? input : (input instanceof URL ? input.toString() : input.url);
  const options: RequestInit = { ...init };

  // 1. Ensure credentials: 'include' for secure HttpOnly cookie authentication across all requests
  options.credentials = "include";

  // 2. Inject in-memory Bearer token only if present and not already set
  if (url.startsWith("/api/") || url.includes(window.location.origin + "/api/")) {
    if (inMemoryAccessToken) {
      const headers = new Headers(options.headers || {});
      if (!headers.has("Authorization")) {
        headers.set("Authorization", `Bearer ${inMemoryAccessToken}`);
      }
      options.headers = headers;
    }
  }

  // 3. Execute the fetch request
  const response = await window.fetch(input, options);

  // 4. Transparent token refresh interception on 401 Unauthorized (Single-flight mutex)
  if (
    response.status === 401 &&
    (url.startsWith("/api/") || url.includes(window.location.origin + "/api/")) &&
    !url.includes("/api/auth/login") &&
    !url.includes("/api/login") &&
    !url.includes("/api/auth/register") &&
    !url.includes("/api/register") &&
    !url.includes("/api/auth/refresh") &&
    !url.includes("/api/refresh-token")
  ) {
    if (!activeRefreshPromise) {
      activeRefreshPromise = executeTokenRefresh().finally(() => {
        activeRefreshPromise = null;
      });
    }

    const newAccessToken = await activeRefreshPromise;
    if (newAccessToken) {
      // Re-execute request with refreshed cookie credentials & in-memory token
      const retryInit = { ...options };
      const retryHeaders = new Headers(retryInit.headers || {});
      retryHeaders.set("Authorization", `Bearer ${newAccessToken}`);
      retryInit.headers = retryHeaders;

      return window.fetch(input, retryInit);
    }
  }

  // 5. Post-fetch processing: capture in-memory access token on login/register/refresh
  if (
    url.includes("/login") || 
    url.includes("/register") || 
    url.includes("/refresh")
  ) {
    try {
      const clone = response.clone();
      const data = await clone.json();
      if (data && data.accessToken) {
        inMemoryAccessToken = data.accessToken;
      }
    } catch {
      // Non-JSON response
    }
  }

  // Handle logout: clear in-memory token
  if (url.includes("/logout")) {
    inMemoryAccessToken = null;
  }

  // Clear in-memory token if 401 Unauthorized persisted
  if (
    response.status === 401 && 
    (url.startsWith("/api/") || url.includes(window.location.origin + "/api/")) && 
    !url.includes("/login")
  ) {
    inMemoryAccessToken = null;
  }

  return response;
}


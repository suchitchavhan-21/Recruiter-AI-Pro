let activeRefreshPromise: Promise<boolean> | null = null;

export function setInMemoryAccessToken(_token: string | null): void {
  // Pure HttpOnly cookie flow: tokens are never stored in JavaScript memory
}

export function getInMemoryAccessToken(): string | null {
  return null;
}

async function executeTokenRefresh(): Promise<boolean> {
  try {
    const refreshResponse = await window.fetch("/api/auth/refresh", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      }
    });

    return refreshResponse.ok;
  } catch (err) {
    console.error("Auto token refresh failed:", err);
    return false;
  }
}

/**
 * Enterprise API Fetch Utility with secure HttpOnly Cookie credentials
 * Pure cookie-based authentication flow. Tokens are NEVER exposed to client-side JavaScript.
 */
export async function apiFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const url = typeof input === "string" ? input : (input instanceof URL ? input.toString() : input.url);
  const options: RequestInit = { ...init };

  // 1. Ensure credentials: 'include' for secure HttpOnly cookie authentication across all requests
  options.credentials = "include";

  // 2. Execute the fetch request
  const response = await window.fetch(input, options);

  // 3. Transparent token refresh interception on 401 Unauthorized (Single-flight mutex)
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

    const refreshSucceeded = await activeRefreshPromise;
    if (refreshSucceeded) {
      // Re-execute request with refreshed HttpOnly cookie credentials
      return window.fetch(input, options);
    }
  }

  return response;
}


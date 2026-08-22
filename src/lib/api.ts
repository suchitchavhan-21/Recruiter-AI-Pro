// Enterprise API Fetch Utility with HttpOnly Cookie credentials and Bearer Token redundancy
export async function apiFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const url = typeof input === "string" ? input : (input instanceof URL ? input.toString() : input.url);
  const options: RequestInit = { ...init };

  // 1. Ensure credentials: 'include' for secure cookie transfer across frames
  if (!options.credentials) {
    options.credentials = "include";
  }

  // 2. Inject Bearer token if it exists in local storage and the request is to a relative API endpoint
  if (url.startsWith("/api/") || url.includes(window.location.origin + "/api/")) {
    const token = localStorage.getItem("access_token");
    if (token) {
      const headers = new Headers(options.headers || {});
      if (!headers.has("Authorization")) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      options.headers = headers;
    }
  }

  // 3. Execute the actual fetch request
  const response = await window.fetch(input, options);

  // 4. Transparent token refresh interception on 401 Unauthorized
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
    const refreshToken = localStorage.getItem("refresh_token");
    if (refreshToken) {
      try {
        const refreshResponse = await window.fetch("/api/auth/refresh", {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            "X-Refresh-Token": refreshToken,
          },
          body: JSON.stringify({ refreshToken }),
        });

        if (refreshResponse.ok) {
          const refreshData = await refreshResponse.json();
          if (refreshData && refreshData.accessToken) {
            localStorage.setItem("access_token", refreshData.accessToken);
            if (refreshData.refreshToken) {
              localStorage.setItem("refresh_token", refreshData.refreshToken);
            }

            // Re-sign request and retry
            const retryInit = { ...options };
            const retryHeaders = new Headers(retryInit.headers || {});
            retryHeaders.set("Authorization", `Bearer ${refreshData.accessToken}`);
            retryInit.headers = retryHeaders;

            return window.fetch(input, retryInit);
          }
        }
      } catch (err) {
        console.error("Auto token refresh failed:", err);
      }
    }
  }

  // 5. Post-fetch processing: capture tokens or clear on logout
  if (
    url.includes("/login") || 
    url.includes("/register") || 
    url.includes("/refresh") || 
    url.includes("/verify-email")
  ) {
    try {
      const clone = response.clone();
      const data = await clone.json();
      if (data && data.accessToken) {
        localStorage.setItem("access_token", data.accessToken);
      }
      if (data && data.refreshToken) {
        localStorage.setItem("refresh_token", data.refreshToken);
      }
    } catch {
      // Ignore JSON parsing errors
    }
  }

  // Handle logout
  if (url.includes("/logout")) {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
  }

  // Clear token if server responds with 401 Unauthorized (and refresh failed/was not possible)
  if (
    response.status === 401 && 
    (url.startsWith("/api/") || url.includes(window.location.origin + "/api/")) && 
    !url.includes("/login")
  ) {
    localStorage.removeItem("access_token");
  }

  return response;
}

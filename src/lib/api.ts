// Custom API Fetch Utility to bypass iframe third-party cookie restrictions
export async function apiFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  let url = typeof input === "string" ? input : (input instanceof URL ? input.toString() : input.url);

  // 1. Inject Bearer token if it exists in local storage and the request is to a relative API endpoint
  if (url.startsWith("/api/") || url.includes(window.location.origin + "/api/")) {
    const token = localStorage.getItem("access_token");
    if (token) {
      init = init || {};
      const headers = new Headers(init.headers || {});
      if (!headers.has("Authorization")) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      init.headers = headers;
    }
  }

  // 2. Execute the actual fetch request
  const response = await window.fetch(input, init);

  // 3. Transparent token refresh interception on 401 Unauthorized
  if (
    response.status === 401 &&
    (url.startsWith("/api/") || url.includes(window.location.origin + "/api/")) &&
    !url.includes("/api/login") &&
    !url.includes("/api/register") &&
    !url.includes("/api/refresh-token")
  ) {
    const refreshToken = localStorage.getItem("refresh_token");
    if (refreshToken) {
      try {
        const refreshResponse = await window.fetch("/api/refresh-token", {
          method: "POST",
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

            // Re-sign request and retry
            const retryInit = { ...init };
            const headers = new Headers(retryInit.headers || {});
            headers.set("Authorization", `Bearer ${refreshData.accessToken}`);
            retryInit.headers = headers;

            return window.fetch(input, retryInit);
          }
        }
      } catch (err) {
        console.error("Auto token refresh failed:", err);
      }
    }
  }

  // 4. Post-fetch processing: capture tokens or clear on unauthorized
  if (url.includes("/api/login") || url.includes("/api/register") || url.includes("/api/refresh-token") || url.includes("/api/verify-email")) {
    try {
      const clone = response.clone();
      const data = await clone.json();
      if (data && data.accessToken) {
        localStorage.setItem("access_token", data.accessToken);
      }
      if (data && data.refreshToken) {
        localStorage.setItem("refresh_token", data.refreshToken);
      }
    } catch (e) {
      // Ignore JSON parsing errors
    }
  }

  // Handle logout
  if (url.includes("/api/logout")) {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
  }

  // Clear token if the server responds with 401 Unauthorized (and refresh failed/was not possible)
  if (response.status === 401 && (url.startsWith("/api/") || url.includes(window.location.origin + "/api/")) && !url.includes("/api/login")) {
    localStorage.removeItem("access_token");
  }

  return response;
}

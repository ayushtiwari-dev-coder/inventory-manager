const BASE_URL = window.location.origin;

async function apiClient(endpoint, { method = 'GET', data = null, requireAuth = true } = {}) {
  const headers = { 'Content-Type': 'application/json' };

  if (requireAuth) {
    const token = localStorage.getItem('org_token') || localStorage.getItem('global_token');
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  const options = { method, headers };
  if (data) options.body = JSON.stringify(data);

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    
    // 1. Read response safely as raw text first instead of jumping to JSON
    const responseText = await response.text();
    
    // 2. Try to safely parse it as JSON if there's content, otherwise leave it as null
    let result = null;
    if (responseText) {
      try {
        result = JSON.parse(responseText);
      } catch (e) {
        // Content exists but isn't valid JSON (likely raw text or HTML from server crash)
        result = null; 
      }
    }

    // 3. Now we can safely handle HTTP errors (400, 422, 500, etc.)
    if (!response.ok) {
      let errMsg = `Server Error (${response.status}): Core API Exception occurred.`;

      if (result?.detail) {
        errMsg = typeof result.detail === 'string' ? result.detail : (result.detail.message || "Unknown error");
      } else if (result?.message) {
        errMsg = result.message;
      } else if (responseText && responseText.length < 150) {
        // Fallback: Use the raw text error message from the server if it's not a massive HTML string
        errMsg = responseText;
      } else {
        errMsg = `Request failed with status code ${response.status}`;
      }

      throw new Error(errMsg);
    }

    // 4. Success case: If response is ok but JSON was empty/invalid, return empty object
    return result || {};

  } catch (error) {
    // Bubble up the actual error down to your components / UI toast handlers
    throw error;
  }
}

export default apiClient;
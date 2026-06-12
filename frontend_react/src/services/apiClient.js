const BASE_URL = import.meta.env.DEV ? 'http://localhost:8000' : window.location.origin;

async function apiClient(endpoint, { method = 'GET', data = null, requireAuth = true } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  const options = { method, headers, credentials: 'include' };
  
  if (data) options.body = JSON.stringify(data);

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const responseText = await response.text();

    let result = null;
    if (responseText) {
      try {
        result = JSON.parse(responseText);
      } catch (e) {
        result = null;
      }
    }

    if (!response.ok) {
      let errMsg = `Server Error (${response.status}): Core API Exception occurred.`;
      if (result?.detail) {
        errMsg = typeof result.detail === 'string' ? result.detail : (result.detail.message || "Unknown error");
      } else if (result?.message) {
        errMsg = result.message;
      } else if (responseText && responseText.length < 150) {
        errMsg = responseText;
      } else {
        errMsg = `Request failed with status code ${response.status}`;
      }
      throw new Error(errMsg);
    }

    return result || {};
  } catch (error) {
    throw error;
  }
}

export default apiClient;
const BASE_URL = 'http://localhost:8000';

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
    
    let result = null;
    try {
      result = await response.json();
    } catch {
      throw new Error("Invalid response format payload from server pipeline.");
    }

    if (!response.ok) {
      let errMsg = "Core API Exception occurred.";
      if (result?.detail) {
        errMsg = typeof result.detail === 'string' ? result.detail : (result.detail.message || "Unknown error");
      } else if (result?.message) {
        errMsg = result.message;
      }
      throw new Error(errMsg);
    }

    return result;
  } catch (error) {
    throw error;
  }
}

export default apiClient;
import { useState, useCallback, useRef } from 'react';

export function useApi(apiFunc) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Keep a mutable reference to the latest API function
  const apiFuncRef = useRef(apiFunc);
  apiFuncRef.current = apiFunc;

  const execute = useCallback(async (...args) => {
    setLoading(true);
    setError(null);
    try {
      // Always call the freshest function reference without changing execute's identity
      const result = await apiFuncRef.current(...args);
      setData(result);
      return result;
    } catch (err) {
      const msg = err.message || 'An unexpected error occurred';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []); // Empty dependency array means this function reference NEVER changes

  return { data, loading, error, execute, setData, setError };
}
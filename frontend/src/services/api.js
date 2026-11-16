import axios from 'axios';

// Relative base URL: works with the Vite dev proxy locally and with Nginx in production.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1',
  withCredentials: true, // send the HttpOnly auth cookie
  timeout: 15000,
  // Required by the backend CSRF guard on every state-changing request.
  headers: { 'X-Requested-With': 'XMLHttpRequest' },
});

// If the session expires while the app is open, tell the AuthContext to sign out.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url || '';
    if (error.response?.status === 401 && !url.startsWith('/auth/')) {
      window.dispatchEvent(new Event('auth:unauthorized'));
    }
    return Promise.reject(error);
  }
);

export function getErrorMessage(error) {
  if (error.response?.data?.message) return error.response.data.message;
  if (error.request) return 'Cannot reach the server. Check your connection and try again.';
  return 'Something went wrong. Please try again.';
}

/** Converts the API's [{ field, message }] validation errors into { field: message }. */
export function getFieldErrors(error) {
  const list = error.response?.data?.errors;
  if (!Array.isArray(list)) return {};
  return Object.fromEntries(list.map((item) => [item.field, item.message]));
}

export default api;

import axios from 'axios';

// Single source of truth for the backend base URL.
// Set VITE_BACKEND_URL in your env files (.env for local dev, .env.production
// for the deployed build / Vercel dashboard). The API base is derived from it.
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
const API_BASE_URL = `${BACKEND_URL}/api`;

// One-time log of the resolved base URL. In the deployed build this should
// print the Render URL; if it prints localhost or "undefined/api", the Vercel
// env var (VITE_BACKEND_URL) is missing or misnamed and the app must be rebuilt.
console.log('[API] base URL =', API_BASE_URL, '(VITE_BACKEND_URL =', BACKEND_URL, ')');

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  // Render's free tier spins the backend down when idle; the first request
  // after a cold start can take 30-60s. A generous timeout lets that request
  // succeed instead of failing early and surfacing "Unable to send OTP".
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Fire-and-forget ping to wake the backend (Render cold start) as early as
// possible, so it is likely awake by the time the user submits a form.
export const wakeBackend = () => {
  axios.get(`${BACKEND_URL}/`, { timeout: 60000 }).catch(() => {});
};

// Request interceptor: log the exact URL being hit before every call. Makes it
// easy to confirm from the browser console that OTP/auth requests go to the
// production backend (not localhost).
apiClient.interceptors.request.use((config) => {
  const fullUrl = `${config.baseURL || ''}${config.url || ''}`;
  console.log(`[API] ${(config.method || 'get').toUpperCase()} ${fullUrl}`);
  return config;
});

// Response interceptor for token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Don't attempt refresh for login or register endpoints
    if (originalRequest.url?.includes('/auth/login') || originalRequest.url?.includes('/auth/register')) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Try to refresh token
        const response = await axios.post(
          `${API_BASE_URL}/auth/refresh-token`,
          {},
          { withCredentials: true }
        );

        if (response.data.success) {
          // Retry original request
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, user needs to login again
        localStorage.removeItem('user');
        window.location.href = '/auth';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;

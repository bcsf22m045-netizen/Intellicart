import axios from 'axios';

/**
 * Auth Service - API calls for authentication
 * Handles all authentication-related HTTP requests
 */

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';

// Create axios instance with default config
const api = axios.create({
  baseURL: `${API_URL}/api/auth`,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If token expired and we haven't tried to refresh yet
    if (
      error.response?.status === 401 &&
      error.response?.data?.tokenExpired &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const response = await axios.post(`${API_URL}/api/auth/refresh-token`, {
            refreshToken,
          });

          const { accessToken, refreshToken: newRefreshToken } = response.data;
          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('refreshToken', newRefreshToken);

          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh token failed - redirect to login
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

/**
 * Register a new user
 * @param {Object} userData - { name, email, password }
 */
const register = async (userData) => {
  const response = await api.post('/register', userData);
  return response.data;
};

/**
 * Login user with email and password
 * @param {Object} credentials - { email, password }
 */
const login = async (credentials) => {
  const response = await api.post('/login', credentials);
  return response.data;
};

/**
 * Login/Register with Google OAuth
 * @param {string} credential - Google OAuth credential token
 */
const googleAuth = async (credential) => {
  const response = await api.post('/google', { credential });
  return response.data;
};

/**
 * Verify email with token
 * @param {string} token - Email verification token
 */
const verifyEmail = async (token) => {
  const response = await api.post('/verify-email', { token });
  return response.data;
};

/**
 * Resend verification email
 * @param {string} email - User's email address
 */
const resendVerification = async (email) => {
  const response = await api.post('/resend-verification', { email });
  return response.data;
};

/**
 * Refresh access token
 * @param {string} refreshToken - Refresh token
 */
const refreshToken = async (refreshToken) => {
  const response = await api.post('/refresh-token', { refreshToken });
  return response.data;
};

/**
 * Get current authenticated user
 */
const getCurrentUser = async () => {
  const response = await api.get('/me');
  return response.data;
};

/**
 * Logout user
 */
const logout = async () => {
  const response = await api.post('/logout');
  return response.data;
};

export default {
  register,
  login,
  googleAuth,
  verifyEmail,
  resendVerification,
  refreshToken,
  getCurrentUser,
  logout,
  api, // Export api instance for other services
};

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import authService from '../../services/authService';

/**
 * Auth Slice - Redux state management for authentication
 * Handles user registration, login, logout, email verification, and token refresh
 */

// Initial state
const initialState = {
  user: null,
  accessToken: localStorage.getItem('accessToken') || null,
  refreshToken: localStorage.getItem('refreshToken') || null,
  isAuthenticated: false,
  isLoading: false,
  isVerifying: false,
  error: null,
  message: null,
  needsVerification: false,
  verificationEmail: null,
};

/**
 * Register a new user
 */
export const registerUser = createAsyncThunk(
  'auth/register',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await authService.register(userData);
      return response;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Registration failed'
      );
    }
  }
);

/**
 * Login user with email and password
 */
export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await authService.login(credentials);
      return response;
    } catch (error) {
      const errorData = error.response?.data || {};
      return rejectWithValue({
        message: errorData.message || 'Login failed',
        needsVerification: errorData.needsVerification || false,
        email: errorData.email || null,
      });
    }
  }
);

/**
 * Login with Google OAuth
 */
export const googleLogin = createAsyncThunk(
  'auth/googleLogin',
  async (credential, { rejectWithValue }) => {
    try {
      const response = await authService.googleAuth(credential);
      return response;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Google login failed'
      );
    }
  }
);

/**
 * Verify email with token
 */
export const verifyEmail = createAsyncThunk(
  'auth/verifyEmail',
  async (token, { rejectWithValue }) => {
    try {
      const response = await authService.verifyEmail(token);
      return response;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Email verification failed'
      );
    }
  }
);

/**
 * Resend verification email
 */
export const resendVerification = createAsyncThunk(
  'auth/resendVerification',
  async (email, { rejectWithValue }) => {
    try {
      const response = await authService.resendVerification(email);
      return response;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to resend verification email'
      );
    }
  }
);

/**
 * Refresh access token
 */
export const refreshAccessToken = createAsyncThunk(
  'auth/refreshToken',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      const response = await authService.refreshToken(auth.refreshToken);
      return response;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Session expired. Please login again.'
      );
    }
  }
);

/**
 * Get current user
 */
export const getCurrentUser = createAsyncThunk(
  'auth/getCurrentUser',
  async (_, { rejectWithValue }) => {
    try {
      const response = await authService.getCurrentUser();
      return response;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to get user information'
      );
    }
  }
);

/**
 * Logout user
 */
export const logoutUser = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await authService.logout();
      return null;
    } catch (error) {
      // Still logout locally even if server request fails
      return null;
    }
  }
);

// Auth slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Clear error state
    clearError: (state) => {
      state.error = null;
    },
    // Clear message state
    clearMessage: (state) => {
      state.message = null;
    },
    // Clear verification state
    clearVerificationState: (state) => {
      state.needsVerification = false;
      state.verificationEmail = null;
    },
    // Set user manually (for initial load)
    setUser: (state, action) => {
      state.user = action.payload;
      state.isAuthenticated = !!action.payload;
    },
    // Reset auth state
    resetAuthState: (state) => {
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      state.isLoading = false;
      state.error = null;
      state.message = null;
      state.needsVerification = false;
      state.verificationEmail = null;
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    },
  },
  extraReducers: (builder) => {
    builder
      // Register
      .addCase(registerUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.message = action.payload.message;
        state.needsVerification = true;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Login
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.needsVerification = false;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken;
        state.message = action.payload.message;
        localStorage.setItem('accessToken', action.payload.accessToken);
        localStorage.setItem('refreshToken', action.payload.refreshToken);
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message || action.payload;
        state.needsVerification = action.payload?.needsVerification || false;
        state.verificationEmail = action.payload?.email || null;
      })

      // Google Login
      .addCase(googleLogin.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(googleLogin.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken;
        state.message = action.payload.message;
        localStorage.setItem('accessToken', action.payload.accessToken);
        localStorage.setItem('refreshToken', action.payload.refreshToken);
      })
      .addCase(googleLogin.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Verify Email
      .addCase(verifyEmail.pending, (state) => {
        state.isVerifying = true;
        state.error = null;
      })
      .addCase(verifyEmail.fulfilled, (state, action) => {
        state.isVerifying = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken;
        state.message = action.payload.message;
        state.needsVerification = false;
        localStorage.setItem('accessToken', action.payload.accessToken);
        localStorage.setItem('refreshToken', action.payload.refreshToken);
      })
      .addCase(verifyEmail.rejected, (state, action) => {
        state.isVerifying = false;
        state.error = action.payload;
      })

      // Resend Verification
      .addCase(resendVerification.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(resendVerification.fulfilled, (state, action) => {
        state.isLoading = false;
        state.message = action.payload.message;
      })
      .addCase(resendVerification.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Refresh Token
      .addCase(refreshAccessToken.fulfilled, (state, action) => {
        state.accessToken = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken;
        localStorage.setItem('accessToken', action.payload.accessToken);
        localStorage.setItem('refreshToken', action.payload.refreshToken);
      })
      .addCase(refreshAccessToken.rejected, (state) => {
        // Token refresh failed - logout user
        state.user = null;
        state.accessToken = null;
        state.refreshToken = null;
        state.isAuthenticated = false;
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
      })

      // Get Current User
      .addCase(getCurrentUser.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getCurrentUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
      })
      .addCase(getCurrentUser.rejected, (state) => {
        state.isLoading = false;
        state.user = null;
        state.isAuthenticated = false;
        state.accessToken = null;
        state.refreshToken = null;
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
      })

      // Logout
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.accessToken = null;
        state.refreshToken = null;
        state.isAuthenticated = false;
        state.error = null;
        state.message = null;
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
      });
  },
});

// Export actions
export const {
  clearError,
  clearMessage,
  clearVerificationState,
  setUser,
  resetAuthState,
} = authSlice.actions;

// Export selectors
export const selectAuth = (state) => state.auth;
export const selectUser = (state) => state.auth.user;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectIsLoading = (state) => state.auth.isLoading;
export const selectError = (state) => state.auth.error;
export const selectMessage = (state) => state.auth.message;

export default authSlice.reducer;

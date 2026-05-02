import { useDispatch, useSelector } from 'react-redux';
import { useCallback } from 'react';
import {
  loginUser,
  registerUser,
  googleLogin,
  logoutUser,
  verifyEmail,
  resendVerification,
  clearError,
  clearMessage,
  selectAuth,
  selectUser,
  selectIsAuthenticated,
  selectIsLoading,
  selectError,
  selectMessage,
} from '../store/slices/authSlice';

/**
 * Custom hook for authentication operations
 * Provides convenient methods for login, logout, register, etc.
 */
export const useAuth = () => {
  const dispatch = useDispatch();
  
  // Select auth state
  const auth = useSelector(selectAuth);
  const user = useSelector(selectUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const isLoading = useSelector(selectIsLoading);
  const error = useSelector(selectError);
  const message = useSelector(selectMessage);

  // Login with email and password
  const login = useCallback(
    (credentials) => dispatch(loginUser(credentials)),
    [dispatch]
  );

  // Register new user
  const register = useCallback(
    (userData) => dispatch(registerUser(userData)),
    [dispatch]
  );

  // Login with Google
  const loginWithGoogle = useCallback(
    (credential) => dispatch(googleLogin(credential)),
    [dispatch]
  );

  // Logout
  const logout = useCallback(
    () => dispatch(logoutUser()),
    [dispatch]
  );

  // Verify email
  const verify = useCallback(
    (token) => dispatch(verifyEmail(token)),
    [dispatch]
  );

  // Resend verification email
  const resendVerificationEmail = useCallback(
    (email) => dispatch(resendVerification(email)),
    [dispatch]
  );

  // Clear error
  const clearAuthError = useCallback(
    () => dispatch(clearError()),
    [dispatch]
  );

  // Clear message
  const clearAuthMessage = useCallback(
    () => dispatch(clearMessage()),
    [dispatch]
  );

  return {
    // State
    auth,
    user,
    isAuthenticated,
    isLoading,
    error,
    message,
    needsVerification: auth.needsVerification,
    verificationEmail: auth.verificationEmail,
    
    // Actions
    login,
    register,
    loginWithGoogle,
    logout,
    verify,
    resendVerificationEmail,
    clearAuthError,
    clearAuthMessage,
  };
};

export default useAuth;

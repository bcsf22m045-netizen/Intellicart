import express from 'express';
import {
  register,
  verifyEmail,
  resendVerification,
  login,
  googleAuth,
  refreshToken,
  logout,
  getCurrentUser,
} from '../controllers/authController.js';
import { verifyToken } from '../middleware/jwtAuth.js';
import {
  validateRegister,
  validateLogin,
  validateVerifyEmail,
  validateResendVerification,
  validateGoogleAuth,
  validateRefreshToken,
} from '../middleware/validation.js';

const authRouter = express.Router();

/**
 * Authentication Routes
 * Base path: /api/auth
 */

// Public routes (no authentication required)

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
authRouter.post('/register', validateRegister, register);

/**
 * @route   POST /api/auth/login
 * @desc    Login user with email and password
 * @access  Public
 */
authRouter.post('/login', validateLogin, login);

/**
 * @route   POST /api/auth/verify-email
 * @desc    Verify user email with token
 * @access  Public
 */
authRouter.post('/verify-email', validateVerifyEmail, verifyEmail);

/**
 * @route   POST /api/auth/resend-verification
 * @desc    Resend verification email
 * @access  Public
 */
authRouter.post('/resend-verification', validateResendVerification, resendVerification);

/**
 * @route   POST /api/auth/google
 * @desc    Login/Register with Google OAuth
 * @access  Public
 */
authRouter.post('/google', validateGoogleAuth, googleAuth);

/**
 * @route   POST /api/auth/refresh-token
 * @desc    Refresh access token using refresh token
 * @access  Public
 */
authRouter.post('/refresh-token', validateRefreshToken, refreshToken);

// Protected routes (authentication required)

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user and invalidate refresh token
 * @access  Private
 */
authRouter.post('/logout', verifyToken, logout);

/**
 * @route   GET /api/auth/me
 * @desc    Get current authenticated user
 * @access  Private
 */
authRouter.get('/me', verifyToken, getCurrentUser);

export default authRouter;

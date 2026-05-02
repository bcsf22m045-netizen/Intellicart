import { body, validationResult } from 'express-validator';

/**
 * Validation middleware for authentication routes
 * Uses express-validator for input validation
 */

/**
 * Handle validation errors
 */
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(err => err.msg);
    return res.status(400).json({
      success: false,
      message: errorMessages[0], // Return first error message
      errors: errorMessages,
    });
  }
  
  next();
};

/**
 * Validation rules for user registration
 */
export const validateRegister = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Name can only contain letters and spaces'),
  
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please enter a valid email address')
    .normalizeEmail(),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  
  handleValidationErrors,
];

/**
 * Validation rules for user login
 */
export const validateLogin = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please enter a valid email address')
    .normalizeEmail(),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  
  handleValidationErrors,
];

/**
 * Validation rules for email verification
 */
export const validateVerifyEmail = [
  body('token')
    .trim()
    .notEmpty()
    .withMessage('Verification token is required')
    .isLength({ min: 64, max: 64 })
    .withMessage('Invalid verification token'),
  
  handleValidationErrors,
];

/**
 * Validation rules for resend verification
 */
export const validateResendVerification = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please enter a valid email address')
    .normalizeEmail(),
  
  handleValidationErrors,
];

/**
 * Validation rules for Google OAuth
 */
export const validateGoogleAuth = [
  body('credential')
    .notEmpty()
    .withMessage('Google credential is required'),
  
  handleValidationErrors,
];

/**
 * Validation rules for refresh token
 */
export const validateRefreshToken = [
  body('refreshToken')
    .notEmpty()
    .withMessage('Refresh token is required'),
  
  handleValidationErrors,
];

export default {
  handleValidationErrors,
  validateRegister,
  validateLogin,
  validateVerifyEmail,
  validateResendVerification,
  validateGoogleAuth,
  validateRefreshToken,
};

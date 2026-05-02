import jwt from 'jsonwebtoken';
import userModel from '../models/userModel.js';

/**
 * JWT Authentication Middleware
 * Verifies the access token and attaches user to request
 */
export const verifyToken = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    let token = null;

    // Check for Bearer token in Authorization header
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }
    
    // Also check for token in custom 'token' header (backward compatibility)
    if (!token && req.headers.token) {
      token = req.headers.token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.',
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find user
    const user = await userModel.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found. Please login again.',
      });
    }

    // Check if user is verified
    if (!user.isVerified) {
      return res.status(403).json({
        success: false,
        message: 'Please verify your email to access this resource.',
        needsVerification: true,
      });
    }

    // Attach user to request
    req.user = {
      id: user._id,
      email: user.email,
      name: user.name,
      isVerified: user.isVerified,
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired. Please refresh your token.',
        tokenExpired: true,
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token. Please login again.',
      });
    }

    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authentication error. Please try again.',
    });
  }
};

/**
 * Optional authentication middleware
 * Attaches user if token is valid, but doesn't block if no token
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    let token = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }

    if (!token && req.headers.token) {
      token = req.headers.token;
    }

    if (!token) {
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await userModel.findById(decoded.id).select('-password');

    if (user) {
      req.user = {
        id: user._id,
        email: user.email,
        name: user.name,
        isVerified: user.isVerified,
      };
    }

    next();
  } catch (error) {
    // Token invalid or expired, but we don't block - just continue without user
    next();
  }
};

export default { verifyToken, optionalAuth };

import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { toast } from 'react-toastify';
import {
  loginUser,
  googleLogin,
  clearError,
  clearMessage,
  resendVerification,
  selectAuth,
} from '../../store/slices/authSlice';

/**
 * Login Component
 * Handles email/password login and Google OAuth login
 */
const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const {
    isAuthenticated,
    isLoading,
    error,
    message,
    needsVerification,
    verificationEmail,
  } = useSelector(selectAuth);

  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [resendingEmail, setResendingEmail] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  // Show error/success messages
  useEffect(() => {
    if (error && !needsVerification) {
      toast.error(error);
      dispatch(clearError());
    }
    if (message) {
      toast.success(message);
      dispatch(clearMessage());
    }
  }, [error, message, needsVerification, dispatch]);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    dispatch(loginUser({ email, password }));
  };

  // Handle Google login success
  const handleGoogleSuccess = (credentialResponse) => {
    dispatch(googleLogin(credentialResponse.credential));
  };

  // Handle Google login error
  const handleGoogleError = () => {
    toast.error('Google login is not configured. Please use email/password login or contact support.');
    console.error('Google OAuth Error: Make sure localhost:5173 is added to authorized origins in Google Cloud Console');
  };

  // Handle resend verification email
  const handleResendVerification = async () => {
    if (!verificationEmail) return;
    
    setResendingEmail(true);
    try {
      await dispatch(resendVerification(verificationEmail)).unwrap();
      toast.success('Verification email sent. Please check your inbox.');
    } catch (err) {
      toast.error(err || 'Failed to resend verification email');
    }
    setResendingEmail(false);
  };

  return (
    <div className="flex flex-col items-center w-[90%] sm:max-w-md m-auto mt-14 gap-4 text-gray-800">
      {/* Header */}
      <div className="inline-flex items-center gap-2 mb-2 mt-10">
        <p className="prata-regular text-3xl">Login</p>
        <hr className="border-none h-[1.5px] w-8 bg-gray-800" />
      </div>

      {/* Verification Required Notice */}
      {needsVerification && (
        <div className="w-full p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-yellow-800 text-sm font-medium mb-2">
            Email Verification Required
          </p>
          <p className="text-yellow-700 text-sm">
            Please verify your email address before logging in. Check your inbox for the verification link.
          </p>
          {verificationEmail && (
            <button
              onClick={handleResendVerification}
              disabled={resendingEmail}
              className="mt-2 text-sm text-yellow-800 underline hover:no-underline disabled:opacity-50"
            >
              {resendingEmail ? 'Sending...' : 'Resend verification email'}
            </button>
          )}
        </div>
      )}

      {/* Login Form */}
      <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
        {/* Email Input */}
        <div>
          <input
            type="email"
            className="w-full px-3 py-2 border border-gray-800 focus:outline-none focus:border-gray-600"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isLoading}
          />
        </div>

        {/* Password Input */}
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            className="w-full px-3 py-2 border border-gray-800 focus:outline-none focus:border-gray-600 pr-10"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isLoading}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
          >
            {showPassword ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )}
          </button>
        </div>

        {/* Forgot Password & Sign Up Links */}
        <div className="w-full flex justify-between text-sm mt-[-8px]">
          <Link to="/forgot-password" className="cursor-pointer hover:underline">
            Forgot your password?
          </Link>
          <Link to="/signup" className="cursor-pointer hover:underline">
            Create account
          </Link>
        </div>

        {/* Login Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="bg-black text-white font-light px-8 py-2 mt-4 hover:bg-gray-800 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Signing In...
            </>
          ) : (
            'Sign In'
          )}
        </button>
      </form>

      {/* Divider */}
      <div className="w-full flex items-center gap-4 my-4">
        <hr className="flex-1 border-gray-300" />
        <span className="text-gray-500 text-sm">or continue with</span>
        <hr className="flex-1 border-gray-300" />
      </div>

      {/* Google Login Button */}
      <div className="w-full flex justify-center">
        <GoogleLogin
          onSuccess={handleGoogleSuccess}
          onError={handleGoogleError}
          size="large"
          width="100%"
          text="signin_with"
          shape="rectangular"
          theme="outline"
        />
      </div>

      {/* Terms Notice */}
      <p className="text-xs text-gray-500 text-center mt-4">
        By continuing, you agree to our{' '}
        <Link to="/terms" className="underline hover:no-underline">
          Terms of Service
        </Link>{' '}
        and{' '}
        <Link to="/privacy" className="underline hover:no-underline">
          Privacy Policy
        </Link>
      </p>
    </div>
  );
};

export default Login;

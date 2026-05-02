import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { toast } from 'react-toastify';
import {
  registerUser,
  googleLogin,
  clearError,
  clearMessage,
  selectAuth,
} from '../../store/slices/authSlice';

/**
 * Signup Component
 * Handles email/password registration with email verification
 */
const Signup = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const {
    isAuthenticated,
    isLoading,
    error,
    message,
    needsVerification,
  } = useSelector(selectAuth);

  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);

  // Password validation state
  const [passwordValidation, setPasswordValidation] = useState({
    minLength: false,
    hasUppercase: false,
    hasLowercase: false,
    hasNumber: false,
  });

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  // Show success message for registration
  useEffect(() => {
    if (needsVerification && message) {
      setRegistrationSuccess(true);
    }
  }, [needsVerification, message]);

  // Show error messages
  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  // Validate password in real-time
  useEffect(() => {
    setPasswordValidation({
      minLength: password.length >= 8,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
    });
  }, [password]);

  // Check if password is valid
  const isPasswordValid = Object.values(passwordValidation).every(Boolean);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!name || !email || !password || !confirmPassword) {
      toast.error('Please fill in all fields');
      return;
    }

    if (!isPasswordValid) {
      toast.error('Please enter a valid password');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    dispatch(registerUser({ name, email, password }));
  };

  // Handle Google login success
  const handleGoogleSuccess = (credentialResponse) => {
    dispatch(googleLogin(credentialResponse.credential));
  };

  // Handle Google login error
  const handleGoogleError = () => {
    toast.error('Google sign up failed. Please try again.');
  };

  // Show success page after registration
  if (registrationSuccess) {
    return (
      <div className="flex flex-col items-center w-[90%] sm:max-w-md m-auto mt-14 gap-4 text-gray-800">
        <div className="text-center">
          {/* Success Icon */}
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <h2 className="prata-regular text-2xl mb-4">Check Your Email</h2>
          
          <p className="text-gray-600 mb-4">
            We've sent a verification link to <strong>{email}</strong>
          </p>
          
          <p className="text-gray-500 text-sm mb-6">
            Please click the link in your email to verify your account. The link will expire in 24 hours.
          </p>

          <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-600 mb-6">
            <p className="font-medium mb-2">Didn't receive the email?</p>
            <ul className="list-disc list-inside text-left">
              <li>Check your spam or junk folder</li>
              <li>Make sure you entered the correct email</li>
              <li>Wait a few minutes and try again</li>
            </ul>
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={() => {
                setRegistrationSuccess(false);
                dispatch(clearMessage());
              }}
              className="text-gray-600 hover:text-gray-800 underline text-sm"
            >
              Use a different email
            </button>
            
            <Link
              to="/login"
              className="bg-black text-white font-light px-8 py-2 hover:bg-gray-800 transition-colors"
            >
              Go to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center w-[90%] sm:max-w-md m-auto mt-14 gap-4 text-gray-800">
      {/* Header */}
      <div className="inline-flex items-center gap-2 mb-2 mt-10">
        <p className="prata-regular text-3xl">Create Account</p>
        <hr className="border-none h-[1.5px] w-8 bg-gray-800" />
      </div>

      {/* Signup Form */}
      <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
        {/* Name Input */}
        <div>
          <input
            type="text"
            className="w-full px-3 py-2 border border-gray-800 focus:outline-none focus:border-gray-600"
            placeholder="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            disabled={isLoading}
          />
        </div>

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

        {/* Password Requirements */}
        {password && (
          <div className="text-xs space-y-1">
            <p className={`flex items-center gap-1 ${passwordValidation.minLength ? 'text-green-600' : 'text-gray-500'}`}>
              {passwordValidation.minLength ? '✓' : '○'} At least 8 characters
            </p>
            <p className={`flex items-center gap-1 ${passwordValidation.hasUppercase ? 'text-green-600' : 'text-gray-500'}`}>
              {passwordValidation.hasUppercase ? '✓' : '○'} One uppercase letter
            </p>
            <p className={`flex items-center gap-1 ${passwordValidation.hasLowercase ? 'text-green-600' : 'text-gray-500'}`}>
              {passwordValidation.hasLowercase ? '✓' : '○'} One lowercase letter
            </p>
            <p className={`flex items-center gap-1 ${passwordValidation.hasNumber ? 'text-green-600' : 'text-gray-500'}`}>
              {passwordValidation.hasNumber ? '✓' : '○'} One number
            </p>
          </div>
        )}

        {/* Confirm Password Input */}
        <div className="relative">
          <input
            type={showConfirmPassword ? 'text' : 'password'}
            className={`w-full px-3 py-2 border focus:outline-none pr-10 ${
              confirmPassword && password !== confirmPassword
                ? 'border-red-500'
                : 'border-gray-800 focus:border-gray-600'
            }`}
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            disabled={isLoading}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
          >
            {showConfirmPassword ? (
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

        {/* Password Mismatch Error */}
        {confirmPassword && password !== confirmPassword && (
          <p className="text-red-500 text-xs">Passwords do not match</p>
        )}

        {/* Already have account link */}
        <div className="w-full flex justify-end text-sm mt-[-8px]">
          <Link to="/login" className="cursor-pointer hover:underline">
            Already have an account? Login
          </Link>
        </div>

        {/* Sign Up Button */}
        <button
          type="submit"
          disabled={isLoading || !isPasswordValid || password !== confirmPassword}
          className="bg-black text-white font-light px-8 py-2 mt-4 hover:bg-gray-800 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Creating Account...
            </>
          ) : (
            'Create Account'
          )}
        </button>
      </form>

      {/* Divider */}
      <div className="w-full flex items-center gap-4 my-4">
        <hr className="flex-1 border-gray-300" />
        <span className="text-gray-500 text-sm">or continue with</span>
        <hr className="flex-1 border-gray-300" />
      </div>

      {/* Google Sign Up Button */}
      <div className="w-full flex justify-center">
        <GoogleLogin
          onSuccess={handleGoogleSuccess}
          onError={handleGoogleError}
          size="large"
          width="100%"
          text="signup_with"
          shape="rectangular"
          theme="outline"
        />
      </div>

      {/* Terms Notice */}
      <p className="text-xs text-gray-500 text-center mt-4">
        By creating an account, you agree to our{' '}
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

export default Signup;

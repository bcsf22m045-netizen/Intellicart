import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  verifyEmail,
  clearError,
  clearMessage,
  selectAuth,
} from '../../store/slices/authSlice';

/**
 * VerifyEmail Component
 * Handles email verification when user clicks the verification link
 */
const VerifyEmail = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const {
    isAuthenticated,
    isVerifying,
    error,
    message,
  } = useSelector(selectAuth);

  const [verificationStatus, setVerificationStatus] = useState('verifying'); // verifying, success, error

  // Get token from URL
  const token = searchParams.get('token');

  // Verify email on mount
  useEffect(() => {
    if (token) {
      dispatch(verifyEmail(token))
        .unwrap()
        .then(() => {
          setVerificationStatus('success');
        })
        .catch(() => {
          setVerificationStatus('error');
        });
    } else {
      setVerificationStatus('error');
    }
  }, [token, dispatch]);

  // Redirect after successful verification
  useEffect(() => {
    if (verificationStatus === 'success' && isAuthenticated) {
      const timer = setTimeout(() => {
        navigate('/');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [verificationStatus, isAuthenticated, navigate]);

  // Clear messages on unmount
  useEffect(() => {
    return () => {
      dispatch(clearError());
      dispatch(clearMessage());
    };
  }, [dispatch]);

  // No token provided
  if (!token) {
    return (
      <div className="flex flex-col items-center w-[90%] sm:max-w-md m-auto mt-14 gap-4 text-gray-800">
        <div className="text-center">
          {/* Error Icon */}
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>

          <h2 className="prata-regular text-2xl mb-4">Invalid Verification Link</h2>
          
          <p className="text-gray-600 mb-6">
            The verification link is invalid or missing. Please check your email for the correct link.
          </p>

          <Link
            to="/login"
            className="bg-black text-white font-light px-8 py-2 hover:bg-gray-800 transition-colors inline-block"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  // Verifying state
  if (verificationStatus === 'verifying' || isVerifying) {
    return (
      <div className="flex flex-col items-center w-[90%] sm:max-w-md m-auto mt-14 gap-4 text-gray-800">
        <div className="text-center">
          {/* Loading Spinner */}
          <div className="w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <svg className="animate-spin h-12 w-12 text-gray-800" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>

          <h2 className="prata-regular text-2xl mb-4">Verifying Your Email</h2>
          
          <p className="text-gray-600">
            Please wait while we verify your email address...
          </p>
        </div>
      </div>
    );
  }

  // Success state
  if (verificationStatus === 'success') {
    return (
      <div className="flex flex-col items-center w-[90%] sm:max-w-md m-auto mt-14 gap-4 text-gray-800">
        <div className="text-center">
          {/* Success Icon */}
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <h2 className="prata-regular text-2xl mb-4">Email Verified!</h2>
          
          <p className="text-gray-600 mb-4">
            Your email has been verified successfully. You can now enjoy all the features of NOVA Store.
          </p>

          <p className="text-gray-500 text-sm mb-6">
            Redirecting you to the homepage in a few seconds...
          </p>

          <Link
            to="/"
            className="bg-black text-white font-light px-8 py-2 hover:bg-gray-800 transition-colors inline-block"
          >
            Start Shopping
          </Link>
        </div>
      </div>
    );
  }

  // Error state
  return (
    <div className="flex flex-col items-center w-[90%] sm:max-w-md m-auto mt-14 gap-4 text-gray-800">
      <div className="text-center">
        {/* Error Icon */}
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>

        <h2 className="prata-regular text-2xl mb-4">Verification Failed</h2>
        
        <p className="text-gray-600 mb-4">
          {error || 'The verification link is invalid or has expired.'}
        </p>

        <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-600 mb-6">
          <p className="font-medium mb-2">What can you do?</p>
          <ul className="list-disc list-inside text-left">
            <li>Request a new verification email from the login page</li>
            <li>Check if you have a newer verification email</li>
            <li>Contact support if the problem persists</li>
          </ul>
        </div>

        <div className="flex flex-col gap-3">
          <Link
            to="/login"
            className="bg-black text-white font-light px-8 py-2 hover:bg-gray-800 transition-colors inline-block"
          >
            Go to Login
          </Link>
          
          <Link
            to="/signup"
            className="text-gray-600 hover:text-gray-800 underline text-sm"
          >
            Create a new account
          </Link>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;

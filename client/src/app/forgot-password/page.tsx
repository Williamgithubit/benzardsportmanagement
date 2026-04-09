'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { FaEnvelope, FaArrowLeft, FaSpinner, FaCheckCircle } from 'react-icons/fa';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/services/firebase';

interface ForgotPasswordFormData {
  email: string;
}

const ForgotPassword = () => {
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [resetEmail, setResetEmail] = useState<string>('');
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch
  } = useForm<ForgotPasswordFormData>({
    mode: 'onChange'
  });

  const watchedEmail = watch('email');

  const handlePasswordReset = async (data: ForgotPasswordFormData) => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    toast.dismiss();

    try {
      await sendPasswordResetEmail(auth, data.email.trim(), {
        url: `${window.location.origin}/login`,
        handleCodeInApp: false,
      });

      setResetEmail(data.email.trim());
      setIsSuccess(true);
      toast.success('Password reset email sent successfully!');
      
      // Redirect to login after 5 seconds
      setTimeout(() => {
        router.push('/login');
      }, 5000);

    } catch (error: unknown) {
      console.error('Password reset error:', error);
      
      let errorMessage = 'Failed to send password reset email. Please try again.';
      
      if (error instanceof Error) {
        const authError = error as { code?: string };
        switch (authError.code) {
          case 'auth/user-not-found':
            errorMessage = 'No account found with this email address.';
            break;
          case 'auth/invalid-email':
          errorMessage = 'Please enter a valid email address.';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Too many requests. Please wait a moment before trying again.';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Network error. Please check your connection and try again.';
          break;
        default:
          errorMessage = error.message || errorMessage;
        }
      }
      
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f0f4ff] to-[#e6e9ff] p-4">
        <motion.div 
          className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          {/* Success Header */}
          <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 text-center">
            <FaCheckCircle className="text-4xl text-white mx-auto mb-2" />
            <h2 className="text-2xl font-bold text-white">Email Sent!</h2>
            <p className="text-green-100 mt-1">Check your inbox for reset instructions</p>
          </div>
          
          {/* Success Content */}
          <div className="p-6 sm:p-8 text-center">
            <div className="mb-6">
              <p className="text-gray-600 mb-4">
                We&apos;ve sent a password reset link to:
              </p>
              <p className="font-semibold text-[#000054] bg-gray-50 p-3 rounded-lg border">
                {resetEmail}
              </p>
            </div>
            
            <div className="mb-6 text-sm text-gray-500 space-y-2">
              <p>• Check your spam folder if you don&apos;t see the email</p>
              <p>• The reset link will expire in 1 hour</p>
              <p>• You&apos;ll be redirected to login in 5 seconds</p>
            </div>
            
            <div className="space-y-3">
              <Link
                href="/login"
                className="w-full flex items-center justify-center px-6 py-3 border border-transparent rounded-lg text-sm font-medium text-white bg-gradient-to-r from-[#000054] to-[#1a1a6e] hover:from-[#1a1a6e] hover:to-[#000054] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#000054] transition-all duration-200"
              >
                <FaArrowLeft className="mr-2" />
                Back to Login
              </Link>
              
              <button
                onClick={() => {
                  setIsSuccess(false);
                  setResetEmail('');
                }}
                className="w-full px-6 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#000054] transition-all duration-200"
              >
                Send Another Email
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f0f4ff] to-[#e6e9ff] p-4">
      <motion.div 
        className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#000054] to-[#1a1a6e] p-6 text-center">
          <h2 className="text-2xl font-bold text-white">Reset Password</h2>
          <p className="text-blue-100 mt-1">Enter your email to receive reset instructions</p>
        </div>
        
        {/* Form */}
        <form onSubmit={handleSubmit(handlePasswordReset)} className="p-6 sm:p-8">
          {/* Email Field */}
          <div className="mb-6">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaEnvelope className="text-gray-400" />
              </div>
              <input
                type="email"
                id="email"
                {...register('email', {
                  required: 'Email address is required',
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: 'Please enter a valid email address'
                  }
                })}
                className={`pl-10 block w-full rounded-lg border-gray-300 shadow-sm focus:border-[#000054] focus:ring focus:ring-[#000054]/20 p-2.5 text-sm ${
                  errors.email ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' : ''
                }`}
                placeholder="Enter your registered email"
                autoComplete="email"
                disabled={isSubmitting}
                aria-describedby={errors.email ? 'email-error' : undefined}
              />
            </div>
            {errors.email && (
              <p id="email-error" className="mt-2 text-sm text-red-600" role="alert">
                {errors.email.message}
              </p>
            )}
          </div>
          
          {/* Info Box */}
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex">
              <div className="flex-shrink-0">
                <FaEnvelope className="h-5 w-5 text-blue-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">
                  What happens next?
                </h3>
                <div className="mt-2 text-sm text-blue-700">
                  <ul className="list-disc list-inside space-y-1">
                    <li>We&apos;ll send a secure reset link to your email</li>
                    <li>Click the link to create a new password</li>
                    <li>The link expires in 1 hour for security</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          
          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting || !!errors.email || !watchedEmail?.trim()}
            className={`w-full flex items-center justify-center px-6 py-3 border border-transparent rounded-lg text-sm font-medium text-white bg-gradient-to-r from-[#000054] to-[#1a1a6e] hover:from-[#1a1a6e] hover:to-[#000054] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#000054] transition-all duration-200 ${
              isSubmitting || !!errors.email || !watchedEmail?.trim() 
                ? 'opacity-70 cursor-not-allowed' 
                : 'hover:shadow-lg'
            }`}
          >
            {isSubmitting ? (
              <>
                <FaSpinner className="animate-spin mr-2" />
                Sending Reset Link...
              </>
            ) : (
              <>
                <FaEnvelope className="mr-2" />
                Send Reset Link
              </>
            )}
          </button>
          
          {/* Back to Login */}
          <div className="mt-6 text-center">
            <Link
              href="/login"
              className="inline-flex items-center text-sm text-[#000054] hover:text-[#E32845] transition-colors duration-200"
            >
              <FaArrowLeft className="mr-2" />
              Back to Login
            </Link>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default ForgotPassword;

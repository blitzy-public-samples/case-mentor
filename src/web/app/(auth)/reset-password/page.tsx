// Third-party imports
import React from 'react'; // ^18.0.0
import { Metadata } from 'next'; // ^13.0.0

// Internal imports
import ResetPasswordForm from '../../../components/auth/ResetPasswordForm';
import Loading from '../../../components/shared/Loading';

/**
 * Human Tasks:
 * 1. Verify email template configuration in Supabase dashboard
 * 2. Test password reset flow in all supported browsers
 * 3. Validate WCAG 2.1 AA compliance with screen readers
 * 4. Monitor password reset API response times
 */

/**
 * Generates static metadata for the reset password page
 * Requirement: User Interface Design - SEO optimization
 */
export const generateMetadata = (): Metadata => {
  return {
    title: 'Reset Password | Case Interview Practice Platform',
    description: 'Reset your password securely to regain access to your Case Interview Practice Platform account.'
  };
};

/**
 * Reset password page component implementing WCAG 2.1 AA accessibility standards
 * Requirement: Authentication & Authorization - Secure password reset functionality with email verification
 * Requirement: User Interface Design - WCAG 2.1 AA compliant interface
 */
const ResetPasswordPage: React.FC = () => {
  return (
    <main 
      role="main"
      className="min-h-screen flex flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-8"
      aria-labelledby="reset-password-heading"
    >
      <div className="w-full max-w-md space-y-8">
        {/* Requirement: User Interface Design - Semantic heading hierarchy */}
        <div className="text-center">
          <h1 
            id="reset-password-heading"
            className="text-3xl font-bold tracking-tight text-gray-900"
          >
            Reset Password
          </h1>
          {/* Requirement: User Interface Design - Descriptive text for screen readers */}
          <p className="mt-2 text-sm text-gray-600">
            Enter your email address and we'll send you instructions to reset your password.
          </p>
        </div>

        {/* 
          Requirement: Authentication & Authorization - Secure password reset form
          Requirement: Security Controls - Implementation of secure password reset flow
        */}
        <div className="mt-8">
          <ResetPasswordForm />
        </div>

        {/* 
          Requirement: User Interface Design - Loading state with accessibility
          Loading component is rendered by ResetPasswordForm when needed
        */}
        <div 
          aria-live="polite"
          className="mt-4 flex justify-center"
        >
          {/* Loading state is managed by ResetPasswordForm */}
        </div>
      </div>
    </main>
  );
};

export default ResetPasswordPage;
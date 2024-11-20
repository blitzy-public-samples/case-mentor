// Third-party imports
import React, { useState } from 'react'; // ^18.0.0

// Internal imports
import { resetPassword } from '../../lib/auth';
import Input from '../shared/Input';
import Button from '../shared/Button';
import { useToast, ToastType } from '../../hooks/useToast';

/**
 * Human Tasks:
 * 1. Verify email template configuration in Supabase dashboard
 * 2. Test password reset flow in all supported browsers
 * 3. Validate WCAG 2.1 AA compliance with screen readers
 * 4. Monitor password reset API response times
 */

// Email validation regex pattern
const EMAIL_REGEX = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;

/**
 * Password reset form component with accessibility support
 * Requirement: Authentication & Authorization - Secure password reset functionality with email verification
 * Requirement: User Interface Design - WCAG 2.1 AA compliant form with keyboard navigation and screen reader support
 */
const ResetPasswordForm: React.FC = () => {
  // Form state management
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Toast notifications
  const toast = useToast();

  /**
   * Handles form submission with validation
   * Requirement: Authentication & Authorization - Secure password reset flow
   */
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validate email format
      if (!EMAIL_REGEX.test(email)) {
        setError('Please enter a valid email address');
        setLoading(false);
        return;
      }

      // Request password reset
      const response = await resetPassword({ email });

      if (response.success) {
        // Show success message
        toast.show({
          type: ToastType.SUCCESS,
          message: 'Password reset instructions have been sent to your email',
          duration: 5000
        });
        
        // Clear form
        setEmail('');
      } else {
        // Show error message
        toast.show({
          type: ToastType.ERROR,
          message: response.error?.message || 'Failed to send reset instructions',
          duration: 5000
        });
        setError(response.error?.message || 'Failed to send reset instructions');
      }
    } catch (err) {
      // Handle unexpected errors
      toast.show({
        type: ToastType.ERROR,
        message: 'An unexpected error occurred',
        duration: 5000
      });
      setError('An unexpected error occurred. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form 
      onSubmit={handleSubmit}
      className="w-full max-w-md space-y-6"
      noValidate
      aria-label="Password reset form"
    >
      {/* Requirement: User Interface Design - Accessible form inputs */}
      <div className="space-y-2">
        <Input
          id="email"
          type="email"
          label="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={error}
          placeholder="Enter your email address"
          disabled={loading}
          required
          aria-required="true"
          aria-invalid={!!error}
          aria-describedby={error ? 'email-error' : undefined}
          hint="We'll send password reset instructions to this email"
          className="w-full"
        />
      </div>

      {/* Requirement: User Interface Design - Accessible button with loading state */}
      <Button
        type="submit"
        variant="primary"
        isLoading={loading}
        disabled={loading || !email}
        className="w-full"
        aria-label={loading ? 'Sending reset instructions' : 'Reset password'}
      >
        {loading ? 'Sending Instructions...' : 'Reset Password'}
      </Button>
    </form>
  );
};

export default ResetPasswordForm;
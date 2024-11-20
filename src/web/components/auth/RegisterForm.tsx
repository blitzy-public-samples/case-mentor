// Third-party imports
import React, { useState } from 'react'; // ^18.0.0
import { useForm } from 'react-hook-form'; // ^7.0.0
import { useRouter } from 'next/navigation'; // ^13.0.0

// Internal imports
import { useAuth } from '../../hooks/useAuth';
import { AuthCredentials } from '../../types/auth';
import { Input } from '../shared/Input';
import { Button } from '../shared/Button';
import { ERROR_MESSAGES } from '../../config/constants';

/**
 * Human Tasks:
 * 1. Verify password strength requirements with security team
 * 2. Test form submission with screen readers
 * 3. Validate ARIA attributes with accessibility tools
 * 4. Ensure error messages are properly announced
 * 5. Test keyboard navigation flow
 */

// Requirement: Authentication & Authorization - Form validation rules
const EMAIL_REGEX = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
const PASSWORD_MIN_LENGTH = 8;

export const RegisterForm: React.FC = () => {
  // Requirement: Authentication & Authorization - Form state management
  const {
    register,
    handleSubmit,
    formState: { errors },
    setError
  } = useForm<AuthCredentials>();

  const [isLoading, setIsLoading] = useState(false);
  const { register: registerUser } = useAuth();
  const router = useRouter();

  // Requirement: Authentication & Authorization - Form submission handler
  const onSubmit = async (data: AuthCredentials) => {
    setIsLoading(true);

    try {
      const response = await registerUser(data);

      if (!response.success) {
        // Handle API errors
        if (response.error?.code === 'VALIDATION_ERROR') {
          setError('email', { message: response.error.message });
        } else {
          setError('root', { message: response.error?.message || ERROR_MESSAGES.API.SERVER });
        }
        return;
      }

      // Redirect to dashboard on successful registration
      router.push('/dashboard');
    } catch (error) {
      setError('root', { 
        message: ERROR_MESSAGES.API.SERVER 
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    // Requirement: User Interface Design - WCAG 2.1 AA compliant form layout
    <form 
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-4 w-full max-w-md mx-auto"
      noValidate
      aria-label="Registration form"
    >
      {/* Display root level errors */}
      {errors.root && (
        <div 
          role="alert"
          className="text-sm text-red-500 mt-1"
        >
          {errors.root.message}
        </div>
      )}

      {/* Email input field */}
      <Input
        label="Email"
        type="email"
        autoComplete="email"
        error={errors.email?.message}
        {...register('email', {
          required: ERROR_MESSAGES.VALIDATION.REQUIRED_FIELD,
          pattern: {
            value: EMAIL_REGEX,
            message: ERROR_MESSAGES.VALIDATION.INVALID_EMAIL
          }
        })}
        aria-required="true"
      />

      {/* Password input field */}
      <Input
        label="Password"
        type="password"
        autoComplete="new-password"
        error={errors.password?.message}
        hint="Password must be at least 8 characters long"
        {...register('password', {
          required: ERROR_MESSAGES.VALIDATION.REQUIRED_FIELD,
          minLength: {
            value: PASSWORD_MIN_LENGTH,
            message: ERROR_MESSAGES.VALIDATION.INVALID_PASSWORD
          }
        })}
        aria-required="true"
      />

      {/* Submit button */}
      <Button
        type="submit"
        variant="primary"
        size="lg"
        className="w-full"
        isLoading={isLoading}
        disabled={isLoading}
        ariaLabel="Create account"
      >
        Create Account
      </Button>
    </form>
  );
};
// Third-party imports
'use client'
import React from 'react'; // ^18.0.0
import { useForm } from 'react-hook-form'; // ^7.0.0
import { z } from 'zod'; // ^3.0.0
import { zodResolver } from '@hookform/resolvers/zod'; // ^3.0.0

// Internal imports
import { Input } from '../shared/Input';
import { Button } from '../shared/Button';
import { useAuth } from '../../hooks/useAuth';
import { useToast, ToastType } from '../../hooks/useToast';

/**
 * Human Tasks:
 * 1. Verify CORS settings for authentication endpoints
 * 2. Test form validation with screen readers
 * 3. Validate color contrast ratios for error states
 * 4. Test keyboard navigation flow
 * 5. Verify error message clarity with UX team
 */

// Requirement: Authentication Flow - Form validation schema using Zod
const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email format'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(8, 'Password must be at least 8 characters')
});

// Type inference from schema
type FormData = z.infer<typeof loginSchema>;

/**
 * LoginForm component that handles user authentication with form validation
 * and accessibility support.
 * 
 * Requirement: Authentication Flow - JWT-based login through Supabase
 * Requirement: User Interface Design - WCAG 2.1 AA compliant form
 */
export const LoginForm: React.FC = () => {
  // Initialize hooks
  const { login } = useAuth();
  const { show } = useToast();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<FormData>({
    resolver: zodResolver(loginSchema)
  });

  /**
   * Handles form submission and authentication attempt
   * Requirement: Authentication Flow - Secure login with proper validation
   */
  const onSubmit = async (data: FormData) => {
    try {
      const response = await login({
        email: data.email,
        password: data.password
      });

      if (response.success) {
        show({
          type: ToastType.SUCCESS,
          message: 'Successfully logged in',
          duration: 3000
        });
      } else {
        show({
          type: ToastType.ERROR,
          message: response.error?.message || 'Login failed',
          duration: 5000
        });
      }
    } catch (error) {
      show({
        type: ToastType.ERROR,
        message: 'An unexpected error occurred',
        duration: 5000
      });
    }
  };

  return (
    // Requirement: User Interface Design - WCAG 2.1 AA compliant form structure
    <form 
      onSubmit={handleSubmit(onSubmit)}
      className="w-full max-w-md space-y-6"
      noValidate
    >
      {/* Email input field */}
      <div>
        <Input
          {...register('email')}
          type="email"
          label="Email"
          error={errors.email?.message}
          autoComplete="email"
          aria-required="true"
          aria-invalid={!!errors.email}
          data-testid="login-email-input"
        />
      </div>

      {/* Password input field */}
      <div>
        <Input
          {...register('password')}
          type="password"
          label="Password"
          error={errors.password?.message}
          autoComplete="current-password"
          aria-required="true"
          aria-invalid={!!errors.password}
          data-testid="login-password-input"
        />
      </div>

      {/* Submit button */}
      <Button
        type="submit"
        variant="primary"
        className="w-full"
        isLoading={isSubmitting}
        disabled={isSubmitting}
        aria-label={isSubmitting ? 'Logging in...' : 'Log in'}
        data-testid="login-submit-button"
      >
        {isSubmitting ? 'Logging in...' : 'Log in'}
      </Button>
    </form>
  );
};
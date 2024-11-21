// Third-party imports
import { Metadata } from 'next'; // ^13.0.0
import Link from 'next/link'; // ^13.0.0

// Internal imports
import { RegisterForm } from '@/components/auth/RegisterForm';
import { Card } from '@/components/shared/Card';

/**
 * Human Tasks:
 * 1. Verify SEO metadata configuration with marketing team
 * 2. Test page layout responsiveness across different devices
 * 3. Validate ARIA landmarks with accessibility tools
 * 4. Ensure proper keyboard navigation flow
 * 5. Test color contrast ratios in dark mode
 */

// Requirement: Authentication & Authorization - SEO metadata configuration
export const metadata: Metadata = {
  title: 'Register | McKinsey Prep',
  description: 'Create your account to access McKinsey case interview preparation tools, practice drills, and simulations.',
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: 'Register | McKinsey Prep',
    description: 'Create your account to access McKinsey case interview preparation tools.',
    type: 'website',
  },
  alternates: {
    canonical: '/register',
  },
};

// Requirement: User Interface Design - Registration page component with WCAG 2.1 AA compliance
export default function RegisterPage() {
  return (
    // Requirement: User Interface Design - Responsive layout with proper spacing
    <main 
      className={pageStyles}
      role="main"
      aria-labelledby="register-heading"
    >
      {/* Requirement: User Interface Design - Centered card container with consistent styling */}
      <div className={containerStyles}>
        <Card 
          shadow="md" 
          padding="lg"
          className="w-full"
        >
          {/* Requirement: Accessibility Requirements - Proper heading hierarchy */}
          <h1 
            id="register-heading"
            className={headingStyles}
          >
            Create an Account
          </h1>

          {/* Requirement: Authentication & Authorization - Registration form with validation */}
          <RegisterForm />

          {/* Requirement: Accessibility Requirements - Accessible navigation link */}
          <Link 
            href="/login"
            className={linkStyles}
            aria-label="Already have an account? Sign in"
          >
            Already have an account? Sign in
          </Link>
        </Card>
      </div>
    </main>
  );
}

// Requirement: User Interface Design - Consistent styling using design system tokens
const pageStyles = 'min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-900';
const containerStyles = 'w-full max-w-md space-y-6';
const headingStyles = 'text-2xl font-bold text-center text-gray-900 dark:text-gray-100';
const linkStyles = 'text-sm text-center text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 block mt-4 focus:outline-none focus:ring-2 focus:ring-blue-500';
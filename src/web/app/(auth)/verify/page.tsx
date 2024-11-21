'use client'

// Third-party imports
import { useEffect, useState } from 'react' // ^18.0.0
import { useSearchParams, useRouter } from 'next/navigation' // ^13.0.0

// Internal imports
import { updatePassword } from '../../../lib/auth'
import Alert from '../../../components/shared/Alert'

// Requirement: Authentication Flow - Interface for verification state management
interface VerificationState {
  isLoading: boolean
  error: string | null
  isVerified: boolean
}

/**
 * Email verification page component that handles verification flow
 * Requirement: Authentication Flow - Implements secure email verification process
 */
const VerifyPage = () => {
  // Initialize verification state
  const [state, setState] = useState<VerificationState>({
    isLoading: true,
    error: null,
    isVerified: false
  })

  const searchParams = useSearchParams()
  const router = useRouter()

  /**
   * Handles the email verification process
   * Requirement: Authentication Flow - JWT-based verification with proper validation
   */
  const handleVerification = async (token: string) => {
    try {
      setState(prev => ({ ...prev, isLoading: true }))

      // Validate token format
      if (!token || typeof token !== 'string') {
        throw new Error('Invalid verification token')
      }

      // Call verification function from auth lib
      const response = await updatePassword({ token, newPassword: '' })

      if (!response.success) {
        throw new Error(response.error?.message || 'Verification failed')
      }

      // Update state on successful verification
      setState({
        isLoading: false,
        error: null,
        isVerified: true
      })

      // Redirect to login after short delay
      setTimeout(() => {
        router.push('/login')
      }, 3000)

    } catch (error) {
      setState({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Verification failed',
        isVerified: false
      })
    }
  }

  // Trigger verification on component mount
  // Requirement: Authentication Flow - Automatic verification on page load
  useEffect(() => {
    const token = searchParams.get('token')
    
    if (!token) {
      setState({
        isLoading: false,
        error: 'Missing verification token',
        isVerified: false
      })
      return
    }

    handleVerification(token)
  }, [searchParams])

  // Requirement: User Interface Design - Loading state with accessibility
  if (state.isLoading) {
    return (
      <div 
        className="flex min-h-screen items-center justify-center p-4"
        role="status"
        aria-label="Verifying email"
      >
        <Alert
          variant="info"
          title="Verifying Your Email"
        >
          Please wait while we verify your email address...
        </Alert>
      </div>
    )
  }

  // Requirement: User Interface Design - Success state with accessibility
  if (state.isVerified) {
    return (
      <div 
        className="flex min-h-screen items-center justify-center p-4"
        role="status"
        aria-live="polite"
      >
        <Alert
          variant="success"
          title="Email Verified Successfully"
        >
          Your email has been verified. You will be redirected to login shortly...
        </Alert>
      </div>
    )
  }

  // Requirement: User Interface Design - Error state with accessibility
  return (
    <div 
      className="flex min-h-screen items-center justify-center p-4"
      role="alert"
    >
      <Alert
        variant="error"
        title="Verification Failed"
      >
        {state.error || 'An error occurred during verification. Please try again or contact support.'}
      </Alert>
    </div>
  )
}

export default VerifyPage
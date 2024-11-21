// Third-party imports
import { useState, useEffect, useCallback } from 'react'; // ^18.0.0
import { Session } from '@supabase/supabase-js'; // ^2.38.0

// Internal imports
import { 
  AuthState, 
  AuthCredentials, 
  AuthSession, 
  AuthResponse,
  PasswordResetRequest
} from '../types/auth';
import { UserSubscriptionTier, UserSubscriptionStatus, UserPreparationLevel } from '../types/user';
import supabase from '../lib/supabase';
import { api } from '../lib/api';
import { ErrorCode } from '../types/api';

/**
 * Human Tasks:
 * 1. Verify JWT token expiration settings in Supabase dashboard
 * 2. Configure proper CORS settings for OAuth providers
 * 3. Set up secure session storage mechanism in production
 * 4. Monitor authentication API response times
 * 5. Test password reset flow in staging environment
 */

// Initial auth state
const initialState: AuthState = {
  initialized: false,
  loading: true,
  authenticated: false,
  session: null,
  user: null
};

// Default empty auth session for error responses
const emptyAuthSession: AuthSession = {
  user: {
    id: '',
    email: '',
    profile: {
      firstName: '',
      lastName: '',
      targetFirm: '',
      interviewDate: null,
      preparationLevel: UserPreparationLevel.BEGINNER,
      avatarUrl: null
    },
    subscriptionTier: UserSubscriptionTier.FREE,
    subscriptionStatus: UserSubscriptionStatus.ACTIVE,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastLoginAt: new Date()
  },
  session: {} as Session,
  profile: {
    firstName: '',
    lastName: '',
    targetFirm: '',
    interviewDate: null,
    preparationLevel: UserPreparationLevel.BEGINNER,
    avatarUrl: null
  },
  expiresAt: 0
};

/**
 * Custom React hook for managing authentication state and operations
 * Requirement: Authentication & Authorization - JWT-based authentication with secure session management
 */
export function useAuth() {
  // Initialize auth state
  const [state, setState] = useState<AuthState>(initialState);

  /**
   * Handles authentication state changes
   * Requirement: Authentication & Authorization - Session management with JWT tokens
   */
  const handleAuthStateChange = useCallback(async (event: string, session: Session | null) => {
    setState(prev => ({ ...prev, loading: true }));

    try {
      if (event === 'SIGNED_IN' && session) {
        // Get user profile after sign in
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        const authSession: AuthSession = {
          user: {
            id: session.user.id,
            email: session.user.email || '',
            profile,
            subscriptionTier: profile?.subscriptionTier || UserSubscriptionTier.FREE,
            subscriptionStatus: profile?.subscriptionStatus || UserSubscriptionStatus.ACTIVE,
            createdAt: new Date(session.user.created_at),
            updatedAt: new Date(),
            lastLoginAt: new Date()
          },
          session,
          profile,
          expiresAt: session.expires_at ? new Date(session.expires_at).getTime() : 0
        };

        setState({
          initialized: true,
          loading: false,
          authenticated: true,
          session: authSession,
          user: authSession.user
        });
      } else if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
        // Reset state on sign out or user deletion
        setState({
          initialized: true,
          loading: false,
          authenticated: false,
          session: null,
          user: null
        });
      } else if (event === 'TOKEN_REFRESHED' && session) {
        // Update session on token refresh
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        const authSession: AuthSession = {
          user: {
            id: session.user.id,
            email: session.user.email || '',
            profile,
            subscriptionTier: profile?.subscriptionTier || UserSubscriptionTier.FREE,
            subscriptionStatus: profile?.subscriptionStatus || UserSubscriptionStatus.ACTIVE,
            createdAt: new Date(session.user.created_at),
            updatedAt: new Date(),
            lastLoginAt: new Date()
          },
          session,
          profile,
          expiresAt: session.expires_at ? new Date(session.expires_at).getTime() : 0
        };

        setState(prev => ({
          ...prev,
          loading: false,
          session: authSession,
          user: authSession.user
        }));
      }
    } catch (error) {
      console.error('Auth state change error:', error);
      setState({
        initialized: true,
        loading: false,
        authenticated: false,
        session: null,
        user: null
      });
    }
  }, []);

  /**
   * Sets up auth state listener on mount
   * Requirement: Security Controls - Authentication implementation using JWT with RSA-256
   */
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        handleAuthStateChange('SIGNED_IN', session);
      } else {
        setState(prev => ({ ...prev, initialized: true, loading: false }));
      }
    });

    // Subscribe to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthStateChange);

    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, [handleAuthStateChange]);

  /**
   * Authenticates user with email and password
   * Requirement: Authentication & Authorization - JWT-based authentication
   */
  const login = useCallback(async (credentials: AuthCredentials): Promise<AuthResponse> => {
    setState(prev => ({ ...prev, loading: true }));

    try {
      const { data: { user, session }, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password
      });

      if (error) throw error;
      if (!user || !session) throw new Error('Invalid response from authentication service');

      // Get user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      const authSession: AuthSession = {
        user: {
          id: user.id,
          email: user.email || '',
          profile,
          subscriptionTier: profile?.subscriptionTier || UserSubscriptionTier.FREE,
          subscriptionStatus: profile?.subscriptionStatus || UserSubscriptionStatus.ACTIVE,
          createdAt: new Date(user.created_at),
          updatedAt: new Date(),
          lastLoginAt: new Date()
        },
        session,
        profile,
        expiresAt: session.expires_at ? new Date(session.expires_at).getTime() : 0
      };

      return {
        success: true,
        data: authSession,
        error: null,
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID()
      };
    } catch (error) {
      setState(prev => ({ ...prev, loading: false }));
      return {
        success: false,
        data: emptyAuthSession,
        error: {
          code: ErrorCode.AUTHENTICATION_ERROR,
          message: error instanceof Error ? error.message : 'Login failed',
          details: { error }
        },
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID()
      };
    }
  }, []);

  /**
   * Registers new user with email and password
   * Requirement: Authentication & Authorization - Secure user registration
   */
  const register = useCallback(async (credentials: AuthCredentials): Promise<AuthResponse> => {
    setState(prev => ({ ...prev, loading: true }));

    try {
      const { data: { user, session }, error } = await supabase.auth.signUp({
        email: credentials.email,
        password: credentials.password
      });

      if (error) throw error;
      if (!user) throw new Error('Invalid response from registration service');

      // Create initial profile
      await api.post('/api/profiles', {
        userId: user.id,
        email: user.email
      });

      // Get created profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      const authSession: AuthSession = {
        user: {
          id: user.id,
          email: user.email || '',
          profile,
          subscriptionTier: UserSubscriptionTier.FREE,
          subscriptionStatus: UserSubscriptionStatus.ACTIVE,
          createdAt: new Date(user.created_at),
          updatedAt: new Date(),
          lastLoginAt: new Date()
        },
        session: session!,
        profile,
        expiresAt: session?.expires_at ? new Date(session.expires_at).getTime() : 0
      };

      return {
        success: true,
        data: authSession,
        error: null,
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID()
      };
    } catch (error) {
      setState(prev => ({ ...prev, loading: false }));
      return {
        success: false,
        data: emptyAuthSession,
        error: {
          code: ErrorCode.AUTHENTICATION_ERROR,
          message: error instanceof Error ? error.message : 'Registration failed',
          details: { error }
        },
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID()
      };
    }
  }, []);

  /**
   * Signs out current user and clears session
   * Requirement: Authentication & Authorization - Secure session termination
   */
  const logout = useCallback(async (): Promise<void> => {
    setState(prev => ({ ...prev, loading: true }));

    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setState({
        initialized: true,
        loading: false,
        authenticated: false,
        session: null,
        user: null
      });
    }
  }, []);

  /**
   * Initiates password reset process
   * Requirement: Security Controls - Secure password reset flow
   */
  const resetPassword = useCallback(async (request: PasswordResetRequest): Promise<AuthResponse> => {
    setState(prev => ({ ...prev, loading: true }));

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(request.email);

      if (error) throw error;

      setState(prev => ({ ...prev, loading: false }));
      return {
        success: true,
        data: emptyAuthSession,
        error: null,
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID()
      };
    } catch (error) {
      setState(prev => ({ ...prev, loading: false }));
      return {
        success: false,
        data: emptyAuthSession,
        error: {
          code: ErrorCode.AUTHENTICATION_ERROR,
          message: error instanceof Error ? error.message : 'Password reset failed',
          details: { error }
        },
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID()
      };
    }
  }, []);

  /**
   * Verifies user's email address
   * Requirement: Security Controls - Email verification flow
   */
  const verifyEmail = useCallback(async (token: string): Promise<AuthResponse> => {
    setState(prev => ({ ...prev, loading: true }));

    try {
      const { error } = await supabase.auth.verifyOtp({
        token_hash: token,
        type: 'email'
      });

      if (error) throw error;

      setState(prev => ({ ...prev, loading: false }));
      return {
        success: true,
        data: emptyAuthSession,
        error: null,
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID()
      };
    } catch (error) {
      setState(prev => ({ ...prev, loading: false }));
      return {
        success: false,
        data: emptyAuthSession,
        error: {
          code: ErrorCode.AUTHENTICATION_ERROR,
          message: error instanceof Error ? error.message : 'Email verification failed',
          details: { error }
        },
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID()
      };
    }
  }, []);

  return {
    state,
    login,
    logout,
    register,
    resetPassword,
    verifyEmail
  };
}
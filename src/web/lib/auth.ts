/**
 * Human Tasks:
 * 1. Verify JWT token expiration settings in Supabase dashboard
 * 2. Configure proper CORS settings for OAuth providers
 * 3. Set up secure session storage mechanism in production
 * 4. Monitor authentication API response times
 * 5. Test password reset flow in staging environment
 */

// Third-party imports
import { Session } from '@supabase/supabase-js'; // ^2.38.0

// Internal imports
import supabase from './supabase';
import { 
  AuthCredentials, 
  AuthSession, 
  AuthState, 
  AuthResponse,
  AuthProvider
} from '../types/auth';
import { 
  User,
  UserSubscriptionTier,
  UserSubscriptionStatus,
  UserProfile 
} from '../types/user';
import { ERROR_MESSAGES, AUTH_CONFIG } from '../config/constants';
import { ErrorCode } from '../types/api';

/**
 * Authenticates user with email and password
 * Requirement: Authentication & Authorization - JWT-based authentication with secure session management
 */
export async function signIn(credentials: AuthCredentials): Promise<AuthResponse> {
  try {
    // Validate email format
    if (!credentials.email || !credentials.email.includes('@')) {
      return {
        success: false,
        data: null,
        error: {
          code: ErrorCode.VALIDATION_ERROR,
          message: ERROR_MESSAGES.VALIDATION.INVALID_EMAIL,
          details: {}
        },
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID()
      };
    }

    // Validate password requirements
    if (!credentials.password || credentials.password.length < 8) {
      return {
        success: false,
        data: null,
        error: {
          code: ErrorCode.VALIDATION_ERROR,
          message: ERROR_MESSAGES.VALIDATION.INVALID_PASSWORD,
          details: {}
        },
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID()
      };
    }

    // Attempt authentication with Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password
    });

    if (error) {
      return {
        success: false,
        data: null,
        error: {
          code: ErrorCode.AUTHENTICATION_ERROR,
          message: ERROR_MESSAGES.AUTH.INVALID_CREDENTIALS,
          details: error
        },
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID()
      };
    }

    if (!data.user || !data.session) {
      throw new Error('Invalid response from authentication service');
    }

    // Get user profile data
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    // Create auth session
    const session: AuthSession = {
      user: {
        id: data.user.id,
        email: data.user.email || '',
        profile: profile,
        subscriptionTier: (profile?.subscriptionTier as UserSubscriptionTier) || UserSubscriptionTier.FREE,
        subscriptionStatus: (profile?.subscriptionStatus as UserSubscriptionStatus) || UserSubscriptionStatus.ACTIVE,
        createdAt: new Date(data.user.created_at),
        updatedAt: new Date(),
        lastLoginAt: new Date()
      },
      session: data.session,
      profile: profile,
      expiresAt: data.session.expires_at ? new Date(data.session.expires_at).getTime() : 0
    };

    return {
      success: true,
      data: session,
      error: null,
      timestamp: new Date().toISOString(),
      requestId: crypto.randomUUID()
    };
  } catch (error) {
    return {
      success: false,
      data: null,
      error: {
        code: ErrorCode.INTERNAL_ERROR,
        message: ERROR_MESSAGES.API.SERVER,
        details: error instanceof Error ? { message: error.message } : {}
      },
      timestamp: new Date().toISOString(),
      requestId: crypto.randomUUID()
    };
  }
}

/**
 * Registers new user with email and password
 * Requirement: Authentication & Authorization - Secure user registration with profile creation
 */
export async function signUp(credentials: AuthCredentials): Promise<AuthResponse> {
  try {
    // Validate email format
    if (!credentials.email || !credentials.email.includes('@')) {
      return {
        success: false,
        data: null,
        error: {
          code: ErrorCode.VALIDATION_ERROR,
          message: ERROR_MESSAGES.VALIDATION.INVALID_EMAIL,
          details: {}
        },
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID()
      };
    }

    // Validate password strength
    if (!credentials.password || credentials.password.length < 8) {
      return {
        success: false,
        data: null,
        error: {
          code: ErrorCode.VALIDATION_ERROR,
          message: ERROR_MESSAGES.VALIDATION.INVALID_PASSWORD,
          details: {}
        },
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID()
      };
    }

    // Register user with Supabase
    const { data, error } = await supabase.auth.signUp({
      email: credentials.email,
      password: credentials.password
    });

    if (error) {
      return {
        success: false,
        data: null,
        error: {
          code: ErrorCode.AUTHENTICATION_ERROR,
          message: error.message,
          details: error
        },
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID()
      };
    }

    if (!data.user) {
      throw new Error('Invalid response from registration service');
    }

    // Create initial profile record
    const { error: profileError } = await supabase
      .from('profiles')
      .insert([
        {
          id: data.user.id,
          email: data.user.email,
          created_at: new Date().toISOString()
        }
      ]);

    if (profileError) {
      return {
        success: false,
        data: null,
        error: {
          code: ErrorCode.INTERNAL_ERROR,
          message: ERROR_MESSAGES.API.SERVER,
          details: profileError
        },
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID()
      };
    }

    // Get created profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    // Create auth session
    const session: AuthSession = {
      user: {
        id: data.user.id,
        email: data.user.email || '',
        profile: profile,
        subscriptionTier: UserSubscriptionTier.FREE,
        subscriptionStatus: UserSubscriptionStatus.ACTIVE,
        createdAt: new Date(data.user.created_at),
        updatedAt: new Date(),
        lastLoginAt: new Date()
      },
      session: data.session!,
      profile: profile,
      expiresAt: data.session?.expires_at ? new Date(data.session.expires_at).getTime() : 0
    };

    return {
      success: true,
      data: session,
      error: null,
      timestamp: new Date().toISOString(),
      requestId: crypto.randomUUID()
    };
  } catch (error) {
    return {
      success: false,
      data: null,
      error: {
        code: ErrorCode.INTERNAL_ERROR,
        message: ERROR_MESSAGES.API.SERVER,
        details: error instanceof Error ? { message: error.message } : {}
      },
      timestamp: new Date().toISOString(),
      requestId: crypto.randomUUID()
    };
  }
}

/**
 * Signs out current user and clears session
 * Requirement: Authentication & Authorization - Secure session termination
 */
export async function signOut(): Promise<void> {
  try {
    await supabase.auth.signOut();
  } catch (error) {
    console.error('Sign out error:', error);
  }
}

/**
 * Initiates password reset process via email
 * Requirement: Security Controls - Secure password reset flow
 */
export async function resetPassword(request: PasswordResetRequest): Promise<AuthResponse> {
  try {
    // Validate email format
    if (!request.email || !request.email.includes('@')) {
      return {
        success: false,
        data: null,
        error: {
          code: ErrorCode.VALIDATION_ERROR,
          message: ERROR_MESSAGES.VALIDATION.INVALID_EMAIL,
          details: {}
        },
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID()
      };
    }

    const { error } = await supabase.auth.resetPasswordForEmail(request.email);

    if (error) {
      return {
        success: false,
        data: null,
        error: {
          code: ErrorCode.AUTHENTICATION_ERROR,
          message: error.message,
          details: error
        },
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID()
      };
    }

    return {
      success: true,
      data: null,
      error: null,
      timestamp: new Date().toISOString(),
      requestId: crypto.randomUUID()
    };
  } catch (error) {
    return {
      success: false,
      data: null,
      error: {
        code: ErrorCode.INTERNAL_ERROR,
        message: ERROR_MESSAGES.API.SERVER,
        details: error instanceof Error ? { message: error.message } : {}
      },
      timestamp: new Date().toISOString(),
      requestId: crypto.randomUUID()
    };
  }
}

/**
 * Updates user password with reset token
 * Requirement: Security Controls - Secure password update mechanism
 */
export async function updatePassword(request: PasswordUpdateRequest): Promise<AuthResponse> {
  try {
    // Validate password strength
    if (!request.newPassword || request.newPassword.length < 8) {
      return {
        success: false,
        data: null,
        error: {
          code: ErrorCode.VALIDATION_ERROR,
          message: ERROR_MESSAGES.VALIDATION.INVALID_PASSWORD,
          details: {}
        },
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID()
      };
    }

    const { data, error } = await supabase.auth.updateUser({
      password: request.newPassword
    });

    if (error) {
      return {
        success: false,
        data: null,
        error: {
          code: ErrorCode.AUTHENTICATION_ERROR,
          message: error.message,
          details: error
        },
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID()
      };
    }

    return {
      success: true,
      data: null,
      error: null,
      timestamp: new Date().toISOString(),
      requestId: crypto.randomUUID()
    };
  } catch (error) {
    return {
      success: false,
      data: null,
      error: {
        code: ErrorCode.INTERNAL_ERROR,
        message: ERROR_MESSAGES.API.SERVER,
        details: error instanceof Error ? { message: error.message } : {}
      },
      timestamp: new Date().toISOString(),
      requestId: crypto.randomUUID()
    };
  }
}

/**
 * Retrieves current session if exists
 * Requirement: Authentication & Authorization - Session management
 */
export async function getSession(): Promise<AuthSession | null> {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error || !session) {
      return null;
    }

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();

    return {
      user: {
        id: session.user.id,
        email: session.user.email || '',
        profile: profile,
        subscriptionTier: (profile?.subscriptionTier as UserSubscriptionTier) || UserSubscriptionTier.FREE,
        subscriptionStatus: (profile?.subscriptionStatus as UserSubscriptionStatus) || UserSubscriptionStatus.ACTIVE,
        createdAt: new Date(session.user.created_at),
        updatedAt: new Date(),
        lastLoginAt: new Date()
      },
      session,
      profile,
      expiresAt: session.expires_at ? new Date(session.expires_at).getTime() : 0
    };
  } catch (error) {
    console.error('Get session error:', error);
    return null;
  }
}

/**
 * Retrieves current authenticated user
 * Requirement: Authentication & Authorization - User management
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    const session = await getSession();
    return session?.user || null;
  } catch (error) {
    console.error('Get current user error:', error);
    return null;
  }
}

/**
 * Refreshes the current session token
 * Requirement: Authentication & Authorization - Token refresh mechanism
 */
export async function refreshSession(): Promise<AuthSession | null> {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error || !session) {
      return null;
    }

    // Check if token needs refresh
    const expiresAt = session.expires_at ? new Date(session.expires_at).getTime() : 0;
    const now = Date.now();
    
    if (expiresAt - now < AUTH_CONFIG.REFRESH_THRESHOLD * 1000) {
      const { data: { session: refreshedSession }, error: refreshError } = 
        await supabase.auth.refreshSession();

      if (refreshError || !refreshedSession) {
        return null;
      }

      // Get user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', refreshedSession.user.id)
        .single();

      return {
        user: {
          id: refreshedSession.user.id,
          email: refreshedSession.user.email || '',
          profile: profile,
          subscriptionTier: (profile?.subscriptionTier as UserSubscriptionTier) || UserSubscriptionTier.FREE,
          subscriptionStatus: (profile?.subscriptionStatus as UserSubscriptionStatus) || UserSubscriptionStatus.ACTIVE,
          createdAt: new Date(refreshedSession.user.created_at),
          updatedAt: new Date(),
          lastLoginAt: new Date()
        },
        session: refreshedSession,
        profile,
        expiresAt: refreshedSession.expires_at ? new Date(refreshedSession.expires_at).getTime() : 0
      };
    }

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();

    return {
      user: {
        id: session.user.id,
        email: session.user.email || '',
        profile: profile,
        subscriptionTier: (profile?.subscriptionTier as UserSubscriptionTier) || UserSubscriptionTier.FREE,
        subscriptionStatus: (profile?.subscriptionStatus as UserSubscriptionStatus) || UserSubscriptionStatus.ACTIVE,
        createdAt: new Date(session.user.created_at),
        updatedAt: new Date(),
        lastLoginAt: new Date()
      },
      session,
      profile,
      expiresAt
    };
  } catch (error) {
    console.error('Refresh session error:', error);
    return null;
  }
}
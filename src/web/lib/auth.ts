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
  AuthProvider,
  PasswordResetRequest,
  PasswordUpdateRequest
} from '../types/auth';
import { ERROR_MESSAGES, AUTH_CONFIG } from '../config/constants';

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
          code: 'VALIDATION_ERROR',
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
          code: 'VALIDATION_ERROR',
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
          code: 'AUTHENTICATION_ERROR',
          message: ERROR_MESSAGES.AUTH.INVALID_CREDENTIALS,
          details: error
        },
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID()
      };
    }

    if (!data.session || !data.user) {
      return {
        success: false,
        data: null,
        error: {
          code: 'AUTHENTICATION_ERROR',
          message: ERROR_MESSAGES.AUTH.INVALID_CREDENTIALS,
          details: {}
        },
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID()
      };
    }

    // Get user profile data
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    // Create auth session
    const session: AuthSession = {
      user: data.user,
      session: data.session,
      profile: profile || null,
      expiresAt: new Date(data.session.expires_at || 0).getTime()
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
        code: 'INTERNAL_ERROR',
        message: ERROR_MESSAGES.API.SERVER,
        details: error
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
          code: 'VALIDATION_ERROR',
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
          code: 'VALIDATION_ERROR',
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

    if (error || !data.session || !data.user) {
      return {
        success: false,
        data: null,
        error: {
          code: 'AUTHENTICATION_ERROR',
          message: error?.message || ERROR_MESSAGES.AUTH.INVALID_CREDENTIALS,
          details: error || {}
        },
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID()
      };
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
          code: 'INTERNAL_ERROR',
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
      user: data.user,
      session: data.session,
      profile: profile || null,
      expiresAt: new Date(data.session.expires_at || 0).getTime()
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
        code: 'INTERNAL_ERROR',
        message: ERROR_MESSAGES.API.SERVER,
        details: error
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
          code: 'VALIDATION_ERROR',
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
          code: 'AUTHENTICATION_ERROR',
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
        code: 'INTERNAL_ERROR',
        message: ERROR_MESSAGES.API.SERVER,
        details: error
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
          code: 'VALIDATION_ERROR',
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
          code: 'AUTHENTICATION_ERROR',
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
        code: 'INTERNAL_ERROR',
        message: ERROR_MESSAGES.API.SERVER,
        details: error
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
      user: session.user,
      session,
      profile: profile || null,
      expiresAt: new Date(session.expires_at || 0).getTime()
    };
  } catch (error) {
    console.error('Get session error:', error);
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
    const expiresAt = new Date(session.expires_at || 0).getTime();
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
        user: refreshedSession.user,
        session: refreshedSession,
        profile: profile || null,
        expiresAt: new Date(refreshedSession.expires_at || 0).getTime()
      };
    }

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();

    return {
      user: session.user,
      session,
      profile: profile || null,
      expiresAt
    };
  } catch (error) {
    console.error('Refresh session error:', error);
    return null;
  }
}
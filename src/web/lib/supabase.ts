/**
 * Human Tasks:
 * 1. Verify that NEXT_PUBLIC_SUPABASE_URL is properly set in environment variables
 * 2. Verify that NEXT_PUBLIC_SUPABASE_ANON_KEY is properly set in environment variables
 * 3. Test timeout and retry settings under different network conditions
 * 4. Monitor API response times to ensure <200ms performance target
 * 5. Configure proper CORS settings in Supabase dashboard
 */

// Third-party imports
import { createClient } from '@supabase/supabase-js'; // ^2.38.0

// Internal imports
import { API_CONFIG } from '../config/constants';

// Requirement: Database Layer - Validate required environment variables
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('Missing environment variable: NEXT_PUBLIC_SUPABASE_URL');
}

if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error('Missing environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

/**
 * Creates and configures a Supabase client instance with optimized settings
 * Requirement: System Performance - Ensure <200ms API response time for 95% of requests
 */
const createSupabaseClient = () => {
  const client = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      auth: {
        // Requirement: Authentication - JWT-based authentication configuration
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      },
      // Requirement: System Performance - Configure client timeout
      global: {
        headers: {
          'x-client-info': 'mckinsey-prep-web',
        },
        timeout: API_CONFIG.TIMEOUT
      },
      // Requirement: System Performance - Configure retry mechanism
      db: {
        schema: 'public',
        retryAttempts: API_CONFIG.RETRY_ATTEMPTS,
        retryInterval: 1000 // Start with 1 second, increases exponentially
      },
      // Requirement: Database Layer - Configure real-time subscriptions
      realtime: {
        params: {
          eventsPerSecond: 10,
          heartbeat: 30000, // 30 seconds
          timeout: API_CONFIG.TIMEOUT
        }
      }
    }
  );

  return client;
};

// Requirement: Database Layer - Export configured Supabase client instance
export const supabase = createSupabaseClient();

// Default export for module
export default supabase;
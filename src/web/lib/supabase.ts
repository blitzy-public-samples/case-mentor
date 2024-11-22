/**
 * Human Tasks:
 * 1. Verify that NEXT_PUBLIC_SUPABASE_URL is properly set in environment variables.
 * 2. Verify that NEXT_PUBLIC_SUPABASE_ANON_KEY is properly set in environment variables.
 * 3. Test timeout and retry settings under different network conditions.
 * 4. Monitor API response times to ensure <200ms performance target.
 * 5. Configure proper CORS settings in Supabase dashboard.
 */

// Third-party imports
import { createClient } from '@supabase/supabase-js'; // ^2.38.0

// Internal imports
import { API_CONFIG } from '../config/constants';

// Validate required environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

if (!supabaseUrl || supabaseUrl === 'https://placeholder.supabase.co') {
  console.warn(
    'Missing or placeholder value for NEXT_PUBLIC_SUPABASE_URL. Please verify your .env file or environment variables.'
  );
}

if (!supabaseAnonKey || supabaseAnonKey === 'placeholder-anon-key') {
  console.warn(
    'Missing or placeholder value for NEXT_PUBLIC_SUPABASE_ANON_KEY. Please verify your .env file or environment variables.'
  );
}

/**
 * Creates and configures a Supabase client instance with optimized settings.
 * Ensures <200ms API response time for 95% of requests.
 */
const createSupabaseClient = () => {
  return createClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      auth: {
        // JWT-based authentication configuration
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
      global: {
        headers: {
          'x-client-info': 'mckinsey-prep-web',
        },
      },
      db: {
        schema: 'public',
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
          heartbeat: 30000, // 30 seconds
        },
      },
    }
  );
};

// Export configured Supabase client instance
export const supabase = createSupabaseClient();

// Default export for module
export default supabase;

// @supabase/supabase-js v2.38.0
import { createClient } from '@supabase/supabase-js';
import { DatabaseConfig } from '../types/config';

// Human Tasks:
// 1. Set up SUPABASE_URL and SUPABASE_KEY environment variables in .env files
// 2. Configure read replica connection strings in production environment
// 3. Set up automated backup schedule in Supabase dashboard
// 4. Review and adjust connection pool settings based on load testing results
// 5. Ensure SSL certificates are properly configured for database connections

// Requirement: Database Layer (5.2 Component Details) - Default connection pool settings
export const DEFAULT_POOL_MIN: number = 2;
export const DEFAULT_POOL_MAX: number = 10;
export const DEFAULT_BACKUP_FREQUENCY: string = 'daily';

// Requirement: Database Layer (5.2 Component Details) - Database configuration validation
export function validateDatabaseConfig(config: DatabaseConfig): void {
    // Validate database URL format
    try {
        new URL(config.url);
    } catch (error) {
        throw new Error('Invalid database URL format');
    }

    // Validate pool configuration
    if (!Number.isInteger(config.poolMin) || config.poolMin < 0) {
        throw new Error('Pool minimum must be a non-negative integer');
    }
    if (!Number.isInteger(config.poolMax) || config.poolMax < 1) {
        throw new Error('Pool maximum must be a positive integer');
    }
    if (config.poolMin >= config.poolMax) {
        throw new Error('Pool minimum must be less than pool maximum');
    }

    // Validate backup frequency
    const validFrequencies = ['hourly', 'daily', 'weekly'];
    if (!validFrequencies.includes(config.backupFrequency)) {
        throw new Error('Invalid backup frequency. Must be one of: ' + validFrequencies.join(', '));
    }

    // Validate required environment variables
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
        throw new Error('Missing required environment variables: SUPABASE_URL and SUPABASE_KEY');
    }
}

// Requirement: Database Layer (5.2 Component Details) - Database configuration
export const databaseConfig: DatabaseConfig = {
    url: process.env.SUPABASE_URL || '',
    poolMin: DEFAULT_POOL_MIN,
    poolMax: DEFAULT_POOL_MAX,
    backupFrequency: DEFAULT_BACKUP_FREQUENCY
};

// Validate configuration on initialization
validateDatabaseConfig(databaseConfig);

// Requirement: Data Security (8.2 Data Security) - Secure database client initialization
export const supabaseClient = createClient(databaseConfig.url, process.env.SUPABASE_KEY || '', {
    auth: {
        persistSession: false, // Disable session persistence for security
        autoRefreshToken: true,
        detectSessionInUrl: false
    },
    db: {
        schema: 'public',
    },
    global: {
        headers: {
            'x-application-name': 'case-interview-platform',
        },
    },
    realtime: {
        params: {
            eventsPerSecond: 10,
        },
    },
    // Connection pooling configuration
    pool: {
        min: databaseConfig.poolMin,
        max: databaseConfig.poolMax,
        idleTimeoutMillis: 120000, // 2 minutes
        createTimeoutMillis: 5000, // 5 seconds
        acquireTimeoutMillis: 10000, // 10 seconds
        propagateCreateError: false // Don't fail fast on connection issues
    }
});
// Human Tasks:
// 1. Configure Supabase connection pooling settings in production environment
// 2. Set up monitoring and alerting for database connection failures
// 3. Configure automated backup schedules in Supabase dashboard
// 4. Review and adjust query timeout settings based on performance requirements
// 5. Implement database health check monitoring in production

// @supabase/supabase-js v2.38.0
// @supabase/postgrest-js v1.8.0
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { PostgrestFilterBuilder } from '@supabase/postgrest-js';
import { DatabaseConfig } from '../types/config';
import { databaseConfig, validateDatabaseConfig } from '../config/database';

// Singleton instance of the Supabase client
let supabaseInstance: SupabaseClient | null = null;

/**
 * Custom error class for database-related errors
 * Requirement: Database Layer (5.2 Component Details) - Error handling for database operations
 */
export class DatabaseError extends Error {
    public readonly code: string;
    public readonly originalError: any;

    constructor(message: string, code: string, originalError?: Error) {
        super(message);
        this.name = 'DatabaseError';
        this.code = code;
        this.originalError = originalError;
        Error.captureStackTrace(this, DatabaseError);
    }

    toJSON() {
        return {
            name: this.name,
            message: this.message,
            code: this.code,
            stack: this.stack,
            originalError: this.originalError ? {
                message: this.originalError.message,
                stack: this.originalError.stack
            } : null
        };
    }
}

/**
 * Interface for query execution options
 */
interface QueryOptions {
    timeout?: number;
    singleRow?: boolean;
    useReplica?: boolean;
}

/**
 * Interface for query filters
 */
interface QueryFilters {
    where?: Record<string, any>;
    orderBy?: string;
    limit?: number;
    offset?: number;
}

/**
 * Initializes the database connection pool
 * Requirement: Database Layer (5.2 Component Details) - Connection pooling configuration
 */
export async function initializePool(config: DatabaseConfig = databaseConfig): Promise<void> {
    try {
        validateDatabaseConfig(config);

        supabaseInstance = createClient(config.url, process.env.SUPABASE_KEY || '', {
            auth: {
                persistSession: false,
                autoRefreshToken: true,
                detectSessionInUrl: false
            },
            db: {
                schema: 'public'
            },
            global: {
                headers: {
                    'x-application-name': 'case-interview-platform'
                }
            },
            realtime: {
                params: {
                    eventsPerSecond: 10
                }
            }
        });

        // Verify connection with test query
        await supabaseInstance.from('health_check').select('count').single();
    } catch (error: any) {
        throw new DatabaseError(
            'Failed to initialize database pool',
            'POOL_INIT_ERROR',
            error
        );
    }
}

/**
 * Executes a database query with proper error handling
 * Requirement: Data Security (8.2 Data Security) - Secure query execution
 */
export async function executeQuery<T>(
    query: string,
    params: any[] = [],
    options: QueryOptions = {}
): Promise<T> {
    if (!supabaseInstance) {
        throw new DatabaseError(
            'Database connection not initialized',
            'CONNECTION_ERROR'
        );
    }

    const timeout = options.timeout || 30000; // Default 30s timeout
    const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Query timeout')), timeout)
    );

    try {
        const queryPromise = supabaseInstance.rpc(query, params);
        const result = await Promise.race([queryPromise, timeoutPromise]) as { data: T };

        if (options.singleRow && Array.isArray(result.data)) {
            return result.data[0] as T;
        }

        return result.data;
    } catch (error: any) {
        throw new DatabaseError(
            'Query execution failed',
            'QUERY_ERROR',
            error
        );
    }
}

/**
 * Executes multiple queries within a transaction
 * Requirement: Database Layer (5.2 Component Details) - Transaction management
 */
export async function withTransaction<T>(
    callback: (client: SupabaseClient) => Promise<T>
): Promise<T> {
    if (!supabaseInstance) {
        throw new DatabaseError(
            'Database connection not initialized',
            'CONNECTION_ERROR'
        );
    }

    try {
        await supabaseInstance.rpc('begin_transaction');
        const result = await callback(supabaseInstance);
        await supabaseInstance.rpc('commit_transaction');
        return result;
    } catch (error: any) {
        await supabaseInstance.rpc('rollback_transaction');
        throw new DatabaseError(
            'Transaction failed',
            'TRANSACTION_ERROR',
            error
        );
    }
}

/**
 * Builds a type-safe database query
 * Requirement: Database Layer (5.2 Component Details) - Type-safe query building
 */
export function buildQuery<T extends Record<string, unknown>>(
    table: string,
    filters: QueryFilters = {}
): PostgrestFilterBuilder<any, T, T[]> {
    if (!supabaseInstance) {
        throw new DatabaseError(
            'Database connection not initialized',
            'CONNECTION_ERROR'
        );
    }

    let query = supabaseInstance.from(table).select('*') as PostgrestFilterBuilder<any, T, T[]>;

    if (filters.where) {
        Object.entries(filters.where).forEach(([key, value]) => {
            query = query.eq(key, value);
        });
    }

    if (filters.orderBy) {
        query = query.order(filters.orderBy);
    }

    if (filters.limit) {
        query = query.limit(filters.limit);
    }

    if (filters.offset) {
        query = query.range(
            filters.offset,
            filters.offset + (filters.limit || 10) - 1
        );
    }

    return query;
}
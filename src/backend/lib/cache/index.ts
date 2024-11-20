/**
 * Human Tasks:
 * 1. Ensure Redis connection URL is properly configured in environment variables
 * 2. Set up Redis monitoring and alerting for production environment
 * 3. Configure Redis memory limits and eviction policies based on usage patterns
 * 4. Implement proper error handling and logging strategy for cache failures
 * 5. Set up Redis cluster configuration for high availability in production
 */

// @package ioredis ^5.3.0

import { RedisCache } from './redis';
import { CacheConfig } from '../../types/config';

// Requirement: Cache Layer (5. SYSTEM ARCHITECTURE/5.2 Component Details)
// Global singleton cache instance
let cacheInstance: RedisCache | null = null;

/**
 * Initializes and connects to the Redis cache instance with the provided configuration.
 * Implements singleton pattern to ensure only one cache instance exists.
 * 
 * Requirement: Cache Layer (5. SYSTEM ARCHITECTURE/5.2 Component Details)
 * Redis cache for API responses, session data, and drill data with multi-level caching strategy
 */
export async function initializeCache(config: CacheConfig): Promise<RedisCache> {
  try {
    // Return existing instance if already initialized
    if (cacheInstance) {
      return cacheInstance;
    }

    // Create new cache instance
    const cache = new RedisCache(config);

    // Connect to Redis with retry logic
    await cache.connect();

    // Store instance globally
    cacheInstance = cache;

    return cache;
  } catch (error) {
    console.error('Failed to initialize cache:', error);
    throw new Error('Cache initialization failed');
  }
}

/**
 * Returns the initialized cache instance or throws if not initialized.
 * Ensures cache is ready before operations.
 * 
 * Requirement: Caching Strategy (5.3 Technical Decisions/Caching Strategy)
 * Multi-level caching with Redis for API responses and session data with specific TTLs
 */
export function getCacheInstance(): RedisCache {
  if (!cacheInstance) {
    throw new Error('Cache not initialized. Call initializeCache first.');
  }
  return cacheInstance;
}

// Re-export Redis cache implementation for external use
export { RedisCache } from './redis';
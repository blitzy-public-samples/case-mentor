// @package ioredis ^5.3.0

import { Redis } from 'ioredis';
import { CacheConfig } from '../../types/config';
import { CACHE_TTL } from '../../config/constants';

/**
 * Human Tasks:
 * 1. Configure Redis memory allocation and persistence settings in production
 * 2. Set up Redis Sentinel for high availability in production
 * 3. Configure Redis backup strategy and retention policy
 * 4. Monitor Redis memory usage and implement eviction policies
 * 5. Set up Redis metrics collection and alerting
 */

// Requirement: Cache Layer (5. SYSTEM ARCHITECTURE/5.2 Component Details)
// Global Redis client instance
let redisClient: Redis | null = null;

// Requirement: Cache Layer (5. SYSTEM ARCHITECTURE/5.2 Component Details)
export class RedisCache {
  private client: Redis;
  private config: CacheConfig;

  constructor(config: CacheConfig) {
    // Validate configuration
    if (!config.url) {
      throw new Error('Redis URL is required');
    }
    if (!config.ttl || Object.keys(config.ttl).length === 0) {
      throw new Error('Cache TTL configuration is required');
    }
    if (!config.maxSize || config.maxSize <= 0) {
      throw new Error('Invalid cache max size configuration');
    }

    this.config = config;

    // Initialize Redis client with retry strategy
    this.client = new Redis(config.url, {
      retryStrategy: (times: number) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      maxLoadingRetryTime: 10000,
      // Requirement: Caching Strategy (5.3 Technical Decisions/Caching Strategy)
      // Configure connection pool for optimal performance
      connectionName: 'case-interview-platform',
      db: 0,
      enableOfflineQueue: true,
      keepAlive: 30000,
      connectTimeout: 10000,
      disconnectTimeout: 2000,
    });

    // Set up error handling
    this.client.on('error', (error: Error) => {
      console.error('Redis connection error:', error);
    });

    this.client.on('ready', () => {
      console.log('Redis connection established');
    });

    // Store global instance
    redisClient = this.client;
  }

  /**
   * Establishes connection to Redis server with retry logic
   */
  async connect(): Promise<void> {
    try {
      // Test connection
      await this.client.ping();
    } catch (error) {
      console.error('Failed to connect to Redis:', error);
      throw new Error('Redis connection failed');
    }
  }

  /**
   * Sets a value in cache with type-specific TTL
   */
  async set<T>(key: string, value: T, type: string): Promise<void> {
    try {
      // Validate inputs
      if (!key || typeof key !== 'string') {
        throw new Error('Invalid cache key');
      }
      if (value === undefined || value === null) {
        throw new Error('Invalid cache value');
      }
      if (!type || !CACHE_TTL[type]) {
        throw new Error('Invalid cache type or TTL not configured');
      }

      // Serialize value
      const serializedValue = JSON.stringify(value);

      // Get TTL for cache type
      const ttl = CACHE_TTL[type];

      // Set value with expiration
      await this.client.set(key, serializedValue, 'EX', ttl);
    } catch (error) {
      console.error('Redis set error:', error);
      throw new Error('Failed to set cache value');
    }
  }

  /**
   * Retrieves and deserializes a value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      // Validate key
      if (!key || typeof key !== 'string') {
        throw new Error('Invalid cache key');
      }

      // Get value from Redis
      const value = await this.client.get(key);

      // Return null if not found
      if (!value) {
        return null;
      }

      // Parse JSON value
      try {
        return JSON.parse(value) as T;
      } catch (error) {
        console.error('Failed to parse cached value:', error);
        return null;
      }
    } catch (error) {
      console.error('Redis get error:', error);
      throw new Error('Failed to get cache value');
    }
  }

  /**
   * Removes a value from cache
   */
  async delete(key: string): Promise<void> {
    try {
      // Validate key
      if (!key || typeof key !== 'string') {
        throw new Error('Invalid cache key');
      }

      // Delete key
      await this.client.del(key);
    } catch (error) {
      console.error('Redis delete error:', error);
      throw new Error('Failed to delete cache value');
    }
  }

  /**
   * Clears all cached values
   */
  async clear(): Promise<void> {
    try {
      // Flush all keys
      await this.client.flushdb();
    } catch (error) {
      console.error('Redis clear error:', error);
      throw new Error('Failed to clear cache');
    }
  }
}

// Export the Redis client instance getter
export const getRedisClient = (): Redis | null => redisClient;
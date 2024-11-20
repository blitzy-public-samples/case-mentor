// @package @jest/globals ^29.7.0
// @package ioredis-mock ^8.9.0

import { jest, describe, beforeEach, afterEach, it, expect } from '@jest/globals';
import Redis from 'ioredis-mock';
import { RedisCache, initializeCache, getCacheInstance } from '../../lib/cache';
import type { CacheConfig } from '../../types/config';

// Mock Redis implementation
jest.mock('ioredis', () => require('ioredis-mock'));

// Test configuration
const mockConfig: CacheConfig = {
  url: 'redis://localhost:6379',
  ttl: {
    drill: 300,
    user: 600,
    simulation: 900
  },
  maxSize: 1000
};

// Setup and cleanup functions
beforeEach(async () => {
  // Clear any existing cache instance
  const cache = getCacheInstance();
  await cache.clear();
  
  // Reset all mocks
  jest.clearAllMocks();
  
  // Reset Redis mock state
  const redis = new Redis();
  await redis.flushall();
});

afterEach(async () => {
  // Clean up cache instance
  const cache = getCacheInstance();
  await cache.clear();
  
  // Reset Redis connection
  const redis = new Redis();
  await redis.flushall();
  
  // Clear mock implementations
  jest.resetAllMocks();
});

// Requirement: Cache Layer (5. SYSTEM ARCHITECTURE/5.2 Component Details)
describe('Cache Initialization', () => {
  it('should initialize cache with correct configuration', async () => {
    const cache = await initializeCache(mockConfig);
    expect(cache).toBeInstanceOf(RedisCache);
    expect(cache).toBe(getCacheInstance());
  });

  it('should throw error when initializing with invalid URL', async () => {
    const invalidConfig = { ...mockConfig, url: '' };
    await expect(initializeCache(invalidConfig)).rejects.toThrow('Redis URL is required');
  });

  it('should reuse existing cache instance when already initialized', async () => {
    const firstInstance = await initializeCache(mockConfig);
    const secondInstance = await initializeCache(mockConfig);
    expect(firstInstance).toBe(secondInstance);
  });
});

// Requirement: Caching Strategy (5.3 Technical Decisions/Caching Strategy)
describe('Cache Operations', () => {
  it('should set and get values correctly', async () => {
    const cache = getCacheInstance();
    const testData = { id: 1, name: 'test' };
    
    await cache.set('test-key', testData, 'drill');
    const result = await cache.get('test-key');
    
    expect(result).toEqual(testData);
  });

  it('should handle TTL expiration', async () => {
    const cache = getCacheInstance();
    const testData = { id: 1, name: 'test' };
    
    await cache.set('test-key', testData, 'drill');
    
    // Mock time advancement
    const redis = new Redis();
    await redis.set('test-key', '', 'PX', 1); // Expire in 1ms
    await new Promise(resolve => setTimeout(resolve, 2));
    
    const result = await cache.get('test-key');
    expect(result).toBeNull();
  });

  it('should delete values correctly', async () => {
    const cache = getCacheInstance();
    const testData = { id: 1, name: 'test' };
    
    await cache.set('test-key', testData, 'drill');
    await cache.delete('test-key');
    
    const result = await cache.get('test-key');
    expect(result).toBeNull();
  });

  it('should clear all values', async () => {
    const cache = getCacheInstance();
    const testData = { id: 1, name: 'test' };
    
    await cache.set('key1', testData, 'drill');
    await cache.set('key2', testData, 'user');
    await cache.clear();
    
    const result1 = await cache.get('key1');
    const result2 = await cache.get('key2');
    expect(result1).toBeNull();
    expect(result2).toBeNull();
  });

  it('should handle JSON serialization errors', async () => {
    const cache = getCacheInstance();
    const circularRef: any = {};
    circularRef.self = circularRef;
    
    await expect(cache.set('test-key', circularRef, 'drill'))
      .rejects.toThrow('Failed to set cache value');
  });
});

describe('Error Handling', () => {
  it('should handle connection failures', async () => {
    const invalidConfig = { ...mockConfig, url: 'redis://invalid:6379' };
    await expect(initializeCache(invalidConfig)).rejects.toThrow('Cache initialization failed');
  });

  it('should handle Redis operation errors', async () => {
    const cache = getCacheInstance();
    const redis = new Redis();
    
    // Mock Redis error
    jest.spyOn(redis, 'get').mockRejectedValue(new Error('Redis error'));
    
    await expect(cache.get('test-key')).rejects.toThrow('Failed to get cache value');
  });

  it('should handle invalid cache types', async () => {
    const cache = getCacheInstance();
    const testData = { id: 1, name: 'test' };
    
    await expect(cache.set('test-key', testData, 'invalid-type'))
      .rejects.toThrow('Invalid cache type or TTL not configured');
  });

  it('should handle concurrent operations', async () => {
    const cache = getCacheInstance();
    const testData = { id: 1, name: 'test' };
    
    // Perform multiple operations concurrently
    const operations = Array(10).fill(null).map((_, i) => 
      cache.set(`key-${i}`, testData, 'drill')
    );
    
    await expect(Promise.all(operations)).resolves.not.toThrow();
  });
});

describe('Cache Instance Management', () => {
  it('should get initialized instance correctly', async () => {
    await initializeCache(mockConfig);
    const instance = getCacheInstance();
    expect(instance).toBeInstanceOf(RedisCache);
  });

  it('should throw when getting uninitialized instance', () => {
    // Reset cache instance
    jest.resetModules();
    expect(() => getCacheInstance()).toThrow('Cache not initialized');
  });

  it('should handle reconnection attempts', async () => {
    const cache = getCacheInstance();
    const redis = new Redis();
    
    // Simulate disconnect and reconnect
    redis.disconnect();
    await cache.connect();
    
    // Should still be able to perform operations
    const testData = { id: 1, name: 'test' };
    await expect(cache.set('test-key', testData, 'drill')).resolves.not.toThrow();
  });
});
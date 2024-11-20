// Third-party imports
import { describe, it, expect } from '@jest/globals'; // ^29.7.0
import { format } from 'date-fns'; // ^2.30.0

// Internal imports
import { 
  formatDate, 
  formatDuration, 
  formatScore, 
  isValidDrillType, 
  isValidDifficulty, 
  handleAPIError 
} from '../../lib/utils';
import { DrillType, DrillDifficulty } from '../../types/drills';
import { APIError } from '../../types/api';

/**
 * Human Tasks:
 * 1. Verify test coverage meets minimum 90% threshold
 * 2. Ensure test data matches production scenarios
 * 3. Update test cases if utility function requirements change
 * 4. Configure CI pipeline to run tests automatically
 */

// Requirement: User Interface Design - Tests for utility functions that ensure consistent UI formatting
describe('formatDate', () => {
  it('should format Date object correctly with default format', () => {
    const date = new Date('2024-01-15T10:30:00Z');
    expect(formatDate(date, 'MM/dd/yyyy')).toBe('01/15/2024');
  });

  it('should format timestamp correctly', () => {
    const timestamp = 1705315800000; // 2024-01-15T10:30:00Z
    expect(formatDate(timestamp, 'yyyy-MM-dd')).toBe('2024-01-15');
  });

  it('should format ISO date string correctly', () => {
    const isoString = '2024-01-15T10:30:00Z';
    expect(formatDate(isoString, 'HH:mm')).toBe('10:30');
  });

  it('should handle invalid dates by throwing error', () => {
    expect(() => formatDate('invalid-date', 'MM/dd/yyyy')).toThrow('Failed to format date');
  });

  it('should support different date-fns format strings', () => {
    const date = new Date('2024-01-15T10:30:00Z');
    expect(formatDate(date, 'MMMM do, yyyy')).toBe('January 15th, 2024');
  });
});

// Requirement: System Performance - Tests for helper functions that monitor and format API response times
describe('formatDuration', () => {
  it("should format zero duration as '0s'", () => {
    expect(formatDuration(0)).toBe('0s');
  });

  it("should format seconds only (e.g., '45s')", () => {
    expect(formatDuration(45000)).toBe('45s');
  });

  it("should format minutes and seconds (e.g., '2m 30s')", () => {
    expect(formatDuration(150000)).toBe('2m 30s');
  });

  it("should format hours, minutes and seconds (e.g., '1h 15m 30s')", () => {
    expect(formatDuration(4530000)).toBe('75m 30s');
  });

  it('should handle negative durations by throwing error', () => {
    expect(() => formatDuration(-1000)).toThrow('Duration must be a positive number');
  });
});

// Requirement: User Interface Design - Tests for consistent score formatting
describe('formatScore', () => {
  it("should format perfect score (1.0) as '100%'", () => {
    expect(formatScore(1.0)).toBe('100.0%');
  });

  it("should format zero score (0.0) as '0%'", () => {
    expect(formatScore(0.0)).toBe('0.0%');
  });

  it('should format decimal scores with specified precision', () => {
    expect(formatScore(0.756, 2)).toBe('75.60%');
  });

  it('should round scores correctly', () => {
    expect(formatScore(0.7777, 1)).toBe('77.8%');
  });

  it('should handle invalid scores by throwing error', () => {
    expect(() => formatScore(1.5)).toThrow('Score must be a number between 0 and 1');
    expect(() => formatScore(-0.5)).toThrow('Score must be a number between 0 and 1');
  });
});

// Requirement: User Interface Design - Tests for drill type validation
describe('isValidDrillType', () => {
  it('should validate all DrillType enum values', () => {
    expect(isValidDrillType(DrillType.CASE_PROMPT)).toBe(true);
    expect(isValidDrillType(DrillType.CALCULATION)).toBe(true);
    expect(isValidDrillType(DrillType.CASE_MATH)).toBe(true);
    expect(isValidDrillType(DrillType.BRAINSTORMING)).toBe(true);
    expect(isValidDrillType(DrillType.MARKET_SIZING)).toBe(true);
    expect(isValidDrillType(DrillType.SYNTHESIZING)).toBe(true);
  });

  it('should reject invalid drill type strings', () => {
    expect(isValidDrillType('INVALID_TYPE')).toBe(false);
  });

  it('should handle null and undefined as invalid', () => {
    expect(isValidDrillType(null)).toBe(false);
    expect(isValidDrillType(undefined)).toBe(false);
  });

  it('should be case sensitive in validation', () => {
    expect(isValidDrillType('case_prompt')).toBe(false);
    expect(isValidDrillType('Case_Prompt')).toBe(false);
  });

  it('should reject non-string inputs', () => {
    expect(isValidDrillType(123)).toBe(false);
    expect(isValidDrillType({})).toBe(false);
    expect(isValidDrillType([])).toBe(false);
  });
});

// Requirement: User Interface Design - Tests for difficulty validation
describe('isValidDifficulty', () => {
  it('should validate all DrillDifficulty enum values', () => {
    expect(isValidDifficulty(DrillDifficulty.BEGINNER)).toBe(true);
    expect(isValidDifficulty(DrillDifficulty.INTERMEDIATE)).toBe(true);
    expect(isValidDifficulty(DrillDifficulty.ADVANCED)).toBe(true);
  });

  it('should reject invalid difficulty strings', () => {
    expect(isValidDifficulty('EXPERT')).toBe(false);
  });

  it('should handle null and undefined as invalid', () => {
    expect(isValidDifficulty(null)).toBe(false);
    expect(isValidDifficulty(undefined)).toBe(false);
  });

  it('should be case sensitive in validation', () => {
    expect(isValidDifficulty('beginner')).toBe(false);
    expect(isValidDifficulty('Beginner')).toBe(false);
  });

  it('should reject non-string inputs', () => {
    expect(isValidDifficulty(123)).toBe(false);
    expect(isValidDifficulty({})).toBe(false);
    expect(isValidDifficulty([])).toBe(false);
  });
});

// Requirement: User Interface Design - Tests for consistent error message presentation
describe('handleAPIError', () => {
  it('should handle validation errors with detailed messages', () => {
    const error: APIError = {
      code: 'VALIDATION_ERROR',
      message: 'Validation failed',
      details: { field: 'email', error: 'Invalid format' }
    };
    expect(handleAPIError(error)).toBe('Please check your input and try again (field: email, error: Invalid format)');
  });

  it('should handle authentication errors with proper message', () => {
    const error: APIError = {
      code: 'AUTHENTICATION_ERROR',
      message: 'Not authenticated',
      details: {}
    };
    expect(handleAPIError(error)).toBe('Please sign in to continue');
  });

  it('should handle rate limit errors with retry info', () => {
    const error: APIError = {
      code: 'RATE_LIMIT_ERROR',
      message: 'Too many requests',
      details: { retryAfter: '60 seconds' }
    };
    expect(handleAPIError(error)).toBe('Too many requests. Please try again later (retryAfter: 60 seconds)');
  });

  it('should handle internal errors with generic message', () => {
    const error: APIError = {
      code: 'INTERNAL_ERROR',
      message: 'Server error',
      details: {}
    };
    expect(handleAPIError(error)).toBe('An internal error occurred. Our team has been notified');
  });

  it('should handle unknown error codes gracefully', () => {
    const error: APIError = {
      code: 'UNKNOWN_ERROR' as any,
      message: 'Unknown error',
      details: {}
    };
    expect(handleAPIError(error)).toBe('An unexpected error occurred');
  });
});
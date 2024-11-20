/**
 * Human Tasks:
 * 1. Review and monitor performance metrics for utility functions to ensure <200ms response time
 * 2. Set up error tracking for encryption operations in production environment
 * 3. Configure proper logging for utility function usage patterns
 * 4. Ensure all imported utility functions are properly unit tested
 * 5. Monitor memory usage patterns of utility functions in production
 */

// Import encryption utilities
import {
  encrypt,
  decrypt,
  hashPassword,
  verifyPassword,
  generateKey
} from './encryption';

// Import formatting utilities
import {
  formatAPIResponse,
  formatDrillResponse,
  formatTimestamp,
  formatScore,
  formatDuration
} from './formatting';

// Import validation utilities
import {
  validateDrillAttempt,
  validateSimulationParameters,
  validateUserProfile,
  validateSubscriptionChange
} from './validation';

// Import database utilities
import {
  initializePool,
  executeQuery,
  withTransaction,
  buildQuery,
  DatabaseError
} from './database';

// Requirement: System Performance - Centralized access to performance-critical utility functions
export {
  // Encryption utilities
  encrypt,
  decrypt,
  hashPassword,
  verifyPassword,
  generateKey,

  // Formatting utilities
  formatAPIResponse,
  formatDrillResponse,
  formatTimestamp,
  formatScore,
  formatDuration,

  // Validation utilities
  validateDrillAttempt,
  validateSimulationParameters,
  validateUserProfile,
  validateSubscriptionChange,

  // Database utilities
  initializePool,
  executeQuery,
  withTransaction,
  buildQuery,
  DatabaseError
};

// Requirement: Security Architecture - Unified access to security and encryption utilities
// This index file provides a centralized point of access to all utility functions,
// ensuring consistent usage of security-critical operations across the application.
// All encryption and security-related functions are properly encapsulated and
// exposed through this single entry point for better maintainability and security auditing.
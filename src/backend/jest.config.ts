// Jest configuration version ^29.0.0
// ts-jest version ^29.0.0
// @types/jest version ^29.0.0

/**
 * Human Tasks:
 * 1. Ensure Node.js version is compatible with ES2022 target (Node.js 16+)
 * 2. Create the tests/setup.ts file if not already present
 * 3. Verify test coverage thresholds meet project requirements
 */

import type { Config } from 'jest';
import { compilerOptions } from './tsconfig.json';

/**
 * Jest configuration for the Case Interview Practice Platform backend services
 * Addresses requirements:
 * - REQ-4.5: Testing Infrastructure - Jest configuration for unit tests, integration tests, and coverage reports
 * - REQ-4.1: Backend Technology Stack - TypeScript 5.0+ testing configuration
 */
const config: Config = {
  // Use ts-jest as the default preset for TypeScript handling
  preset: 'ts-jest',

  // Set Node.js as the test environment since this is a backend service
  testEnvironment: 'node',

  // Define the root directory for test discovery
  roots: ['<rootDir>/src/backend'],

  // Pattern matching for test files
  testMatch: [
    '**/__tests__/**/*.ts',  // Tests in __tests__ directories
    '**/*.test.ts'           // Files with .test.ts extension
  ],

  // Module path aliasing to match TypeScript configuration
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/backend/$1'
  },

  // Enable code coverage collection
  collectCoverage: true,

  // Output directory for coverage reports
  coverageDirectory: 'coverage',

  // Configure multiple coverage report formats
  coverageReporters: [
    'text',     // Console output
    'lcov',     // Standard coverage format
    'html'      // HTML report for viewing in browser
  ],

  // Paths to exclude from coverage reporting
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/coverage/',
    '.d.ts$'
  ],

  // Setup files to run before tests
  setupFilesAfterEnv: [
    '<rootDir>/src/backend/tests/setup.ts'
  ],

  // Transform configuration for TypeScript files
  transform: {
    '^.+\\.tsx?$': 'ts-jest'
  },

  // File extensions to consider for module resolution
  moduleFileExtensions: [
    'ts',
    'tsx',
    'js',
    'jsx',
    'json',
    'node'
  ],

  // Global configuration for ts-jest
  globals: {
    'ts-jest': {
      tsconfig: '<rootDir>/src/backend/tsconfig.json'
    }
  },

  // Additional verbose naming for better test output
  verbose: true,

  // Automatically clear mock calls and instances between every test
  clearMocks: true,

  // Maximum number of concurrent workers
  maxWorkers: '50%',

  // Force coverage collection from files that aren't tested
  collectCoverageFrom: [
    'src/backend/**/*.{ts,tsx}',
    '!src/backend/**/*.d.ts',
    '!src/backend/**/*.test.ts',
    '!src/backend/**/__tests__/**'
  ]
};

export default config;
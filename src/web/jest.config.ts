// @jest/types v29.7.0
import type { Config } from '@jest/types';

// @swc/jest v0.2.29
import swcJest from '@swc/jest';

/*
Human Tasks:
1. Verify Node.js version compatibility (18.0+)
2. Ensure all test dependencies are installed in package.json
3. Configure IDE test explorer for Jest integration
4. Set up source maps in tsconfig.json for accurate test coverage reporting
5. Create test directories matching the testMatch patterns
*/

// Addresses requirement: Development Environment - Jest configuration for unit tests, integration tests, and coverage reports
const createJestConfig = (): Config.InitialOptions => ({
  // Use jsdom environment for browser-like testing
  testEnvironment: 'jest-environment-jsdom',

  // Addresses requirement: Testing Framework - Jest testing framework configuration with React Testing Library integration
  setupFilesAfterEnv: [
    '<rootDir>/tests/setup.ts'
  ],

  // Configure module resolution for absolute imports
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@/components/(.*)$': '<rootDir>/components/$1',
    '^@/lib/(.*)$': '<rootDir>/lib/$1',
    '^@/hooks/(.*)$': '<rootDir>/hooks/$1',
    '^@/types/(.*)$': '<rootDir>/types/$1',
    '^@/styles/(.*)$': '<rootDir>/styles/$1',
    '^@/config/(.*)$': '<rootDir>/config/$1'
  },

  // Define test file patterns for TypeScript and React components
  testMatch: [
    '<rootDir>/tests/**/*.test.ts',
    '<rootDir>/tests/**/*.test.tsx'
  ],

  // Configure SWC for fast TypeScript/JavaScript transformation
  transform: {
    '^.+\\.(t|j)sx?$': ['@swc/jest']
  },

  // Specify which files to include in coverage reports
  collectCoverageFrom: [
    'components/**/*.{ts,tsx}',
    'lib/**/*.{ts,tsx}',
    'hooks/**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**'
  ],

  // Set minimum coverage thresholds
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },

  // Additional configuration for stable testing environment
  testTimeout: 10000,
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  verbose: true,
  
  // Ignore build output and dependency directories
  modulePathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/node_modules/'
  ],

  // Enable collecting coverage from untested files
  collectCoverage: true,
  coverageReporters: ['json', 'lcov', 'text', 'clover'],
  
  // Prevent tests from failing on console warnings
  errorOnDeprecated: true
});

// Export the configuration
const config = createJestConfig();
export default config;
/**
 * Human Tasks:
 * 1. Set up OPENAI_API_KEY in environment variables with valid API key
 * 2. Review and adjust DEFAULT_MAX_TOKENS based on actual usage patterns
 * 3. Configure OPENAI_MODEL environment variable if different model is needed
 * 4. Monitor and adjust temperature settings based on response quality needs
 */

// openai v4.0.0 - OpenAI API client library
import OpenAI from 'openai';
import { OpenAIConfig } from '../types/config';

// Requirement: AI Evaluation - Core service configuration constants
const DEFAULT_MODEL = 'gpt-4';
const DEFAULT_MAX_TOKENS = 2048;
const DEFAULT_TEMPERATURE = 0.7;

/**
 * Validates OpenAI API key format and presence
 * 
 * @param apiKey - The API key to validate
 * @returns boolean indicating whether the API key is valid
 */
const validateApiKey = (apiKey: string): boolean => {
  if (!apiKey || typeof apiKey !== 'string') {
    return false;
  }

  // Validate key format: starts with 'sk-' and has minimum length
  return apiKey.startsWith('sk-') && apiKey.length >= 32;
};

/**
 * Creates and validates OpenAI configuration from environment variables
 * Requirement: System Performance - Ensures proper configuration for <200ms API response time
 * 
 * @throws Error if API key is invalid or missing
 * @returns OpenAIConfig Validated configuration object
 */
const createOpenAIConfig = (): OpenAIConfig => {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!validateApiKey(apiKey)) {
    throw new Error('Invalid or missing OpenAI API key. Must start with "sk-" and be at least 32 characters long.');
  }

  // Get configuration from environment variables with fallbacks to defaults
  const model = process.env.OPENAI_MODEL || DEFAULT_MODEL;
  const maxTokens = parseInt(process.env.OPENAI_MAX_TOKENS || DEFAULT_MAX_TOKENS.toString(), 10);
  const temperature = parseFloat(process.env.OPENAI_TEMPERATURE || DEFAULT_TEMPERATURE.toString());

  return {
    apiKey,
    model,
    maxTokens,
  };
};

// Requirement: AI Evaluation - Create validated configuration
export const openaiConfig = createOpenAIConfig();

// Requirement: Rate Limiting - Initialize OpenAI client with configuration
// The OpenAI client includes built-in rate limiting and retry mechanisms
export const openaiClient = new OpenAI({
  apiKey: openaiConfig.apiKey,
  maxRetries: 3, // Retry failed requests up to 3 times
  timeout: 30000, // 30 second timeout for requests
  defaultQuery: {
    model: openaiConfig.model,
    max_tokens: openaiConfig.maxTokens,
    temperature: DEFAULT_TEMPERATURE,
  },
});
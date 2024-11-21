// Third-party imports
import axios, { AxiosInstance, AxiosError } from 'axios'; // ^1.6.0
import axiosRetry from 'axios-retry'; // ^3.8.0

// Internal imports
import { 
  APIResponse, 
  APIError, 
  ErrorCode, 
  RateLimitInfo, 
  PaginatedResponse 
} from '../types/api';
import { getSession } from './auth';
import { 
  API_CONFIG, 
  ERROR_MESSAGES 
} from '../config/constants';

/**
 * Human Tasks:
 * 1. Configure proper CORS settings in production environment
 * 2. Set up monitoring for API response times to meet 200ms target
 * 3. Verify rate limit thresholds with backend team
 * 4. Test retry mechanism under various network conditions
 * 5. Set up proper error tracking and monitoring
 */

// Track rate limit state
let rateLimitInfo: RateLimitInfo = {
  limit: Infinity,
  remaining: Infinity,
  reset: 0
};

/**
 * Creates and configures an Axios instance with default settings and interceptors
 * Requirement: API Architecture - Implements standardized API client
 */
const createAPIClient = (): AxiosInstance => {
  // Create base axios instance
  const client = axios.create({
    baseURL: API_CONFIG.BASE_URL,
    timeout: API_CONFIG.TIMEOUT,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  });

  // Configure retry logic with exponential backoff
  // Requirement: System Performance - Ensures API response time under 200ms with retry
  axiosRetry(client, {
    retries: API_CONFIG.RETRY_ATTEMPTS,
    retryDelay: axiosRetry.exponentialDelay,
    retryCondition: (error: AxiosError) => {
      // Retry on network errors and 5xx responses
      return axiosRetry.isNetworkOrIdempotentRequestError(error) || 
             (error.response?.status ? error.response.status >= 500 : false);
    }
  });

  // Add request interceptor for authentication
  client.interceptors.request.use(async (config) => {
    const session = await getSession();
    if (session?.session) {
      config.headers.Authorization = `Bearer ${session.session.access_token}`;
    }
    return config;
  });

  // Add response interceptor for error handling and rate limit tracking
  // Requirement: Rate Limiting - Handles tier-based rate limiting
  client.interceptors.response.use(
    (response) => {
      // Update rate limit info from headers
      const limit = response.headers['x-ratelimit-limit'];
      const remaining = response.headers['x-ratelimit-remaining'];
      const reset = response.headers['x-ratelimit-reset'];

      if (limit && remaining && reset) {
        rateLimitInfo = {
          limit: parseInt(limit),
          remaining: parseInt(remaining),
          reset: parseInt(reset)
        };
      }

      return response;
    },
    (error: AxiosError) => {
      return Promise.reject(handleAPIError(error));
    }
  );

  return client;
};

/**
 * Processes API errors and converts them to standardized APIError responses
 * Requirement: API Architecture - Standardized error handling
 */
const handleAPIError = (error: Error | AxiosError): APIError => {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const data = error.response?.data;

    // Handle rate limiting errors
    if (status === 429) {
      return {
        code: ErrorCode.RATE_LIMIT_ERROR,
        message: ERROR_MESSAGES.API.RATE_LIMIT,
        details: {
          retryAfter: error.response?.headers['retry-after'],
          ...rateLimitInfo
        }
      };
    }

    // Handle authentication errors
    if (status === 401 || status === 403) {
      return {
        code: ErrorCode.AUTHENTICATION_ERROR,
        message: ERROR_MESSAGES.AUTH.UNAUTHORIZED,
        details: data
      };
    }

    // Handle validation errors
    if (status === 400 || status === 422) {
      return {
        code: ErrorCode.VALIDATION_ERROR,
        message: ERROR_MESSAGES.VALIDATION.INVALID_INPUT,
        details: data
      };
    }

    // Handle server errors
    if (status && status >= 500) {
      return {
        code: ErrorCode.INTERNAL_ERROR,
        message: ERROR_MESSAGES.API.SERVER,
        details: data
      };
    }
  }

  // Handle network errors
  return {
    code: ErrorCode.INTERNAL_ERROR,
    message: ERROR_MESSAGES.API.NETWORK,
    details: { originalError: error.message }
  };
};

// Create API client instance
const client = createAPIClient();

/**
 * Makes typed GET request with automatic retry and error handling
 * Requirement: API Architecture - Type-safe API client
 */
async function get<T>(endpoint: string, params?: Record<string, any>): Promise<APIResponse<T>> {
  try {
    const response = await client.get<T>(endpoint, { params });
    return {
      success: true,
      data: response.data,
      error: null,
      timestamp: new Date().toISOString(),
      requestId: crypto.randomUUID()
    };
  } catch (error) {
    return {
      success: false,
      data: null as unknown as T,
      error: error instanceof Error ? handleAPIError(error) : null,
      timestamp: new Date().toISOString(),
      requestId: crypto.randomUUID()
    };
  }
}

/**
 * Makes typed POST request with automatic retry and error handling
 * Requirement: API Architecture - Type-safe API client
 */
async function post<T>(endpoint: string, data: Record<string, any>): Promise<APIResponse<T>> {
  try {
    const response = await client.post<T>(endpoint, data);
    return {
      success: true,
      data: response.data,
      error: null,
      timestamp: new Date().toISOString(),
      requestId: crypto.randomUUID()
    };
  } catch (error) {
    return {
      success: false,
      data: null as unknown as T,
      error: error instanceof Error ? handleAPIError(error) : null,
      timestamp: new Date().toISOString(),
      requestId: crypto.randomUUID()
    };
  }
}

/**
 * Makes typed PUT request with automatic retry and error handling
 * Requirement: API Architecture - Type-safe API client
 */
async function put<T>(endpoint: string, data: Record<string, any>): Promise<APIResponse<T>> {
  try {
    const response = await client.put<T>(endpoint, data);
    return {
      success: true,
      data: response.data,
      error: null,
      timestamp: new Date().toISOString(),
      requestId: crypto.randomUUID()
    };
  } catch (error) {
    return {
      success: false,
      data: null as unknown as T,
      error: error instanceof Error ? handleAPIError(error) : null,
      timestamp: new Date().toISOString(),
      requestId: crypto.randomUUID()
    };
  }
}

/**
 * Makes typed DELETE request with automatic retry and error handling
 * Requirement: API Architecture - Type-safe API client
 */
async function del<T>(endpoint: string): Promise<APIResponse<T>> {
  try {
    const response = await client.delete<T>(endpoint);
    return {
      success: true,
      data: response.data,
      error: null,
      timestamp: new Date().toISOString(),
      requestId: crypto.randomUUID()
    };
  } catch (error) {
    return {
      success: false,
      data: null as unknown as T,
      error: error instanceof Error ? handleAPIError(error) : null,
      timestamp: new Date().toISOString(),
      requestId: crypto.randomUUID()
    };
  }
}

// Export configured API client methods
export const api = {
  get,
  post,
  put,
  delete: del
};
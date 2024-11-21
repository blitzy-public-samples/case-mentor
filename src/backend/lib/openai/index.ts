/**
 * Human Tasks:
 * 1. Set up OpenAI API key in environment variables
 * 2. Monitor token usage and adjust maxTokens if needed
 * 3. Configure retry mechanism based on error patterns
 * 4. Set up error monitoring for API failures
 */

// @package openai ^4.0.0
import OpenAI from 'openai';
import { openaiConfig } from '../../config/openai';
import { DrillType } from '../../types/drills';
import { DRILL_PROMPTS } from './prompts';

// Requirement: System Performance - Timeout and retry configuration
const TIMEOUT_MS = 10000;
const RETRY_OPTIONS = {
  maxRetries: 3,
  retryDelay: 1000
};

/**
 * Core OpenAI service class for managing API interactions
 * Requirement: AI Evaluation - Core service implementation
 */
export class OpenAIService {
  private client: OpenAI;
  private config: typeof openaiConfig;

  constructor() {
    this.client = new OpenAI({ apiKey: openaiConfig.apiKey });
    this.config = openaiConfig;
  }

  /**
   * Implements retry logic for API calls
   */
  private async withRetry<T>(operation: () => Promise<T>): Promise<T> {
    let lastError: Error | undefined;
    
    for (let attempt = 0; attempt <= RETRY_OPTIONS.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error: any) {
        lastError = error;
        
        if (attempt < RETRY_OPTIONS.maxRetries) {
          await new Promise(resolve => setTimeout(resolve, RETRY_OPTIONS.retryDelay));
        }
      }
    }
    
    throw lastError;
  }

  /**
   * Sends a request to OpenAI API with error handling and timeout
   * Requirement: System Performance - <200ms API response time
   */
  public async sendRequest(prompt: string, options: any = {}): Promise<any> {
    return this.withRetry(async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

      try {
        const response = await this.client.chat.completions.create({
          model: this.config.model,
          messages: [{ role: 'system', content: prompt }],
          max_tokens: this.config.maxTokens,
          ...options,
          signal: controller.signal as any
        });

        return this.validateResponse(response);
      } finally {
        clearTimeout(timeoutId);
      }
    });
  }

  /**
   * Validates OpenAI API response format and content
   */
  private validateResponse(response: any): boolean {
    if (!response || !response.choices || !response.choices[0]) {
      throw new Error('Invalid API response format');
    }

    const content = response.choices[0].message?.content;
    if (!content || typeof content !== 'string') {
      throw new Error('Invalid response content');
    }

    return response;
  }
}

/**
 * Evaluates a drill attempt using OpenAI's GPT model
 * Requirement: AI Evaluation - Consistent, objective feedback
 */
export async function evaluateDrillResponse(
  drillType: DrillType,
  response: string,
  criteria: any
): Promise<any> {
  const service = new OpenAIService();
  
  if (!DRILL_PROMPTS[drillType]) {
    throw new Error(`Invalid drill type: ${drillType}`);
  }

  const prompt = DRILL_PROMPTS[drillType];
  const evaluation = await service.sendRequest(prompt, {
    messages: [
      { role: 'system', content: prompt },
      { role: 'user', content: response }
    ],
    presence_penalty: 0.3,
    frequency_penalty: 0.3
  });

  return {
    score: evaluation.choices[0].message.content.score,
    feedback: evaluation.choices[0].message.content.feedback,
    strengths: evaluation.choices[0].message.content.strengths,
    improvements: evaluation.choices[0].message.content.improvements,
    evaluatedAt: new Date()
  };
}

/**
 * Generates detailed feedback for a drill evaluation
 * Requirement: AI Evaluation - Detailed improvement suggestions
 */
export async function generateFeedback(evaluation: any): Promise<string> {
  const service = new OpenAIService();
  
  const feedbackPrompt = `
    Based on the following evaluation:
    Score: ${evaluation.score}
    Strengths: ${evaluation.strengths.join(', ')}
    Improvements: ${evaluation.improvements.join(', ')}
    
    Generate detailed, actionable feedback with specific examples and improvement suggestions.
  `;

  const response = await service.sendRequest(feedbackPrompt, {
    presence_penalty: 0.2,
    frequency_penalty: 0.2
  });

  return response.choices[0].message.content;
}
// @package zod ^3.22.0

/**
 * Human Tasks:
 * 1. Configure Redis or similar caching solution with appropriate TTL settings
 * 2. Set up monitoring for feedback generation latency and success rates
 * 3. Configure alerts for high error rates in feedback generation
 * 4. Review and adjust retry mechanisms based on production error patterns
 * 5. Set up proper logging for feedback validation failures
 */

import { z } from 'zod';
import { Feedback } from '../models/Feedback';
import { OpenAIService, evaluateDrillResponse, generateFeedback } from '../lib/openai';
import { APIError, APIErrorCode } from '../types/api';
import { DrillType } from '../types/drills';

// Requirement: AI Evaluation - Feedback request validation schema
const FeedbackRequestSchema = z.object({
    attemptId: z.string().uuid(),
    type: z.enum(['DRILL', 'SIMULATION']),
    response: z.object({
        content: z.string(),
        metrics: z.array(z.object({
            name: z.string(),
            value: z.number()
        }))
    })
});

// Global configuration constants
const FEEDBACK_CACHE_TTL = 300; // 5 minutes in seconds
const MAX_RETRIES = 3;

/**
 * Service class for managing AI-powered feedback operations
 * Requirement: AI Evaluation - Core service implementation
 */
export class FeedbackService {
    private openAIService: OpenAIService;
    private feedbackCache: Map<string, { data: any, timestamp: number }>;

    constructor(openAIService: OpenAIService) {
        this.openAIService = openAIService;
        this.feedbackCache = new Map();
    }

    /**
     * Validates feedback request data
     * @param requestData Request data to validate
     * @returns boolean indicating if request is valid
     */
    private validateFeedbackRequest(requestData: any): boolean {
        try {
            FeedbackRequestSchema.parse(requestData);
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * Generates AI feedback for a drill or simulation attempt
     * Requirement: AI Evaluation - Consistent, objective feedback
     */
    public async generateFeedback(
        attemptId: string,
        type: 'DRILL' | 'SIMULATION',
        response: any
    ): Promise<any> {
        try {
            // Validate request data
            if (!this.validateFeedbackRequest({ attemptId, type, response })) {
                throw new Error('Invalid feedback request data');
            }

            // Generate AI evaluation
            const evaluation = await evaluateDrillResponse(
                type as DrillType,
                response.content,
                response.metrics
            );

            // Generate detailed feedback
            const detailedFeedback = await generateFeedback(evaluation);

            // Create feedback record
            const feedback = new Feedback({
                attemptId,
                type,
                content: {
                    summary: detailedFeedback,
                    strengths: evaluation.strengths,
                    improvements: evaluation.improvements,
                    recommendations: evaluation.recommendations
                },
                score: evaluation.score,
                metrics: evaluation.metrics
            });

            // Save feedback to database
            await feedback.save();

            // Cache feedback data
            this.feedbackCache.set(feedback.id, {
                data: feedback,
                timestamp: Date.now()
            });

            return feedback;
        } catch (error: any) {
            const apiError: APIError = {
                code: APIErrorCode.INTERNAL_ERROR,
                message: 'Failed to generate feedback',
                details: error.message,
                timestamp: new Date().toISOString(),
                requestId: crypto.randomUUID()
            };
            throw apiError;
        }
    }

    /**
     * Retrieves feedback by ID with caching
     * Requirement: Progress Tracking - Performance analytics
     */
    public async getFeedback(feedbackId: string): Promise<any | null> {
        try {
            // Check cache first
            const cached = this.feedbackCache.get(feedbackId);
            if (cached && (Date.now() - cached.timestamp) < FEEDBACK_CACHE_TTL * 1000) {
                return cached.data;
            }

            // Fetch from database if not in cache
            const feedback = await Feedback.findById(feedbackId);
            if (!feedback) {
                return null;
            }

            // Update cache
            this.feedbackCache.set(feedbackId, {
                data: feedback,
                timestamp: Date.now()
            });

            return feedback;
        } catch (error: any) {
            const apiError: APIError = {
                code: APIErrorCode.INTERNAL_ERROR,
                message: 'Failed to retrieve feedback',
                details: error.message,
                timestamp: new Date().toISOString(),
                requestId: crypto.randomUUID()
            };
            throw apiError;
        }
    }

    /**
     * Retrieves all feedback for a specific attempt
     * Requirement: Progress Tracking - Comprehensive feedback history
     */
    public async getAttemptFeedback(attemptId: string): Promise<any[]> {
        try {
            // Validate attempt ID format
            if (!z.string().uuid().safeParse(attemptId).success) {
                throw new Error('Invalid attempt ID format');
            }

            // Fetch feedback array
            const feedbackArray = await Feedback.findByAttempt(attemptId);

            // Sort by creation date descending
            return feedbackArray.sort((a, b) => 
                b.createdAt.getTime() - a.createdAt.getTime()
            );
        } catch (error: any) {
            const apiError: APIError = {
                code: APIErrorCode.INTERNAL_ERROR,
                message: 'Failed to retrieve attempt feedback',
                details: error.message,
                timestamp: new Date().toISOString(),
                requestId: crypto.randomUUID()
            };
            throw apiError;
        }
    }

    /**
     * Updates existing feedback with new data
     * Requirement: Progress Tracking - Feedback maintenance
     */
    public async updateFeedback(
        feedbackId: string,
        updateData: any
    ): Promise<void> {
        try {
            // Validate update data
            const feedback = await Feedback.findById(feedbackId);
            if (!feedback) {
                throw new Error('Feedback not found');
            }

            // Update feedback
            await feedback.update(updateData);

            // Invalidate cache
            this.feedbackCache.delete(feedbackId);
        } catch (error: any) {
            const apiError: APIError = {
                code: APIErrorCode.INTERNAL_ERROR,
                message: 'Failed to update feedback',
                details: error.message,
                timestamp: new Date().toISOString(),
                requestId: crypto.randomUUID()
            };
            throw apiError;
        }
    }
}
// @package next ^13.0.0
// @package zod ^3.22.0

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { FeedbackService } from '../../../services/FeedbackService';
import { withAuth } from '../../../lib/auth/middleware';
import { APIError, APIErrorCode } from '../../../types/api';
import { OpenAIService } from '../../../lib/openai';

// Human Tasks:
// 1. Configure proper monitoring for feedback API response times
// 2. Set up alerts for high error rates in feedback operations
// 3. Review and adjust caching settings based on usage patterns
// 4. Ensure proper logging is configured for feedback validation failures

// Validation schema for feedback updates
const UpdateFeedbackSchema = z.object({
    content: z.object({
        summary: z.string().optional(),
        strengths: z.array(z.string()).optional(),
        improvements: z.array(z.string()).optional(),
        recommendations: z.array(z.string()).optional()
    }).optional(),
    score: z.number().min(0).max(100).optional(),
    metrics: z.array(z.object({
        name: z.string(),
        score: z.number().min(0).max(100),
        comments: z.string()
    })).optional()
});

// Initialize services
const openAIService = new OpenAIService();
const feedbackService = new FeedbackService(openAIService);

/**
 * GET handler for retrieving individual feedback
 * Requirement: AI Evaluation - Core service implementation
 */
export const GET = withAuth(async (
    request: NextRequest,
    { user, params }: { user: any, params: { id: string } }
): Promise<NextResponse> => {
    try {
        const feedback = await feedbackService.getFeedback(params.id);

        if (!feedback) {
            return NextResponse.json({
                success: false,
                error: {
                    code: APIErrorCode.NOT_FOUND,
                    message: 'Feedback not found',
                    details: { feedbackId: params.id }
                }
            }, { status: 404 });
        }

        // Return feedback data with standardized response format
        return NextResponse.json({
            success: true,
            data: feedback,
            error: null,
            metadata: {
                timestamp: new Date().toISOString()
            }
        });

    } catch (error: any) {
        return NextResponse.json({
            success: false,
            error: {
                code: APIErrorCode.INTERNAL_ERROR,
                message: 'Failed to retrieve feedback',
                details: error.message
            }
        }, { status: 500 });
    }
});

/**
 * PATCH handler for updating feedback
 * Requirement: Progress Tracking - Performance analytics
 */
export const PATCH = withAuth(async (
    request: NextRequest,
    { user, params }: { user: any, params: { id: string } }
): Promise<NextResponse> => {
    try {
        const body = await request.json();
        
        // Validate update data
        const validatedData = UpdateFeedbackSchema.parse(body);

        // Update feedback
        await feedbackService.updateFeedback(params.id, validatedData);

        return NextResponse.json({
            success: true,
            data: null,
            error: null,
            metadata: {
                timestamp: new Date().toISOString()
            }
        });

    } catch (error: any) {
        // Handle validation errors
        if (error instanceof z.ZodError) {
            return NextResponse.json({
                success: false,
                error: {
                    code: APIErrorCode.VALIDATION_ERROR,
                    message: 'Invalid feedback update data',
                    details: error.errors
                }
            }, { status: 400 });
        }

        // Handle other errors
        return NextResponse.json({
            success: false,
            error: {
                code: APIErrorCode.INTERNAL_ERROR,
                message: 'Failed to update feedback',
                details: error.message
            }
        }, { status: 500 });
    }
});

/**
 * DELETE handler for removing feedback
 * Requirement: Progress Tracking - User performance
 */
export const DELETE = withAuth(async (
    request: NextRequest,
    { user, params }: { user: any, params: { id: string } }
): Promise<NextResponse> => {
    try {
        // Verify feedback exists
        const feedback = await feedbackService.getFeedback(params.id);
        
        if (!feedback) {
            return NextResponse.json({
                success: false,
                error: {
                    code: APIErrorCode.NOT_FOUND,
                    message: 'Feedback not found',
                    details: { feedbackId: params.id }
                }
            }, { status: 404 });
        }

        // Delete feedback
        await feedback.delete();

        return NextResponse.json({
            success: true,
            data: null,
            error: null,
            metadata: {
                timestamp: new Date().toISOString()
            }
        });

    } catch (error: any) {
        return NextResponse.json({
            success: false,
            error: {
                code: APIErrorCode.INTERNAL_ERROR,
                message: 'Failed to delete feedback',
                details: error.message
            }
        }, { status: 500 });
    }
});
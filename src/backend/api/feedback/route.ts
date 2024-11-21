// @package next ^13.0.0

/**
 * Human Tasks:
 * 1. Configure rate limiting for feedback API endpoints
 * 2. Set up monitoring for feedback generation latency
 * 3. Configure error tracking for feedback validation failures
 * 4. Review and adjust feedback caching TTL based on usage patterns
 */

import { NextRequest, NextResponse } from 'next/server';
import { FeedbackService } from '../../services/FeedbackService';
import { withAuth } from '../../lib/auth/middleware';
import { APIError, APIErrorCode } from '../../types/api';
import { z } from 'zod';
import { OpenAIService } from '../../lib/openai';

// Validation schemas for request payloads
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

const FeedbackUpdateSchema = z.object({
  content: z.object({
    summary: z.string(),
    strengths: z.array(z.string()),
    improvements: z.array(z.string()),
    recommendations: z.array(z.string())
  }).optional(),
  score: z.number().min(0).max(100).optional(),
  metrics: z.array(z.object({
    name: z.string(),
    score: z.number(),
    comments: z.string()
  })).optional()
});

// Initialize services
const openAIService = new OpenAIService();
const feedbackService = new FeedbackService(openAIService);

/**
 * GET handler for retrieving feedback
 * Requirement: AI Evaluation - Feedback retrieval with caching
 */
export const GET = withAuth(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const feedbackId = searchParams.get('feedbackId');
    const attemptId = searchParams.get('attemptId');

    if (!feedbackId && !attemptId) {
      throw new APIError(
        APIErrorCode.VALIDATION_ERROR,
        'Either feedbackId or attemptId is required',
        { params: { feedbackId, attemptId } }
      );
    }

    if (feedbackId) {
      const feedback = await feedbackService.getFeedback(feedbackId);
      if (!feedback) {
        throw new APIError(
          APIErrorCode.NOT_FOUND,
          'Feedback not found',
          { feedbackId }
        );
      }
      return NextResponse.json({ data: feedback });
    }

    // Get all feedback for an attempt
    const feedbackList = await feedbackService.getAttemptFeedback(attemptId!);
    return NextResponse.json({ data: feedbackList });

  } catch (error) {
    if (error instanceof APIError) {
      return NextResponse.json(error.toJSON(), { status: 400 });
    }
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      new APIError(
        APIErrorCode.INTERNAL_ERROR,
        'Failed to retrieve feedback',
        { error: message }
      ).toJSON(),
      { status: 500 }
    );
  }
});

/**
 * POST handler for generating new feedback
 * Requirement: AI Evaluation - Consistent, objective feedback generation
 */
export const POST = withAuth(async (request: NextRequest) => {
  try {
    const body = await request.json();
    
    // Validate request payload
    const validatedData = FeedbackRequestSchema.parse(body);

    // Generate feedback
    const feedback = await feedbackService.generateFeedback(
      validatedData.attemptId,
      validatedData.type,
      validatedData.response
    );

    return NextResponse.json({ data: feedback });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        new APIError(
          APIErrorCode.VALIDATION_ERROR,
          'Invalid request payload',
          { details: error.errors }
        ).toJSON(),
        { status: 400 }
      );
    }
    if (error instanceof APIError) {
      return NextResponse.json(error.toJSON(), { status: 400 });
    }
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      new APIError(
        APIErrorCode.INTERNAL_ERROR,
        'Failed to generate feedback',
        { error: message }
      ).toJSON(),
      { status: 500 }
    );
  }
});

/**
 * PATCH handler for updating existing feedback
 * Requirement: Progress Tracking - Feedback maintenance
 */
export const PATCH = withAuth(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const feedbackId = searchParams.get('feedbackId');
    
    if (!feedbackId) {
      throw new APIError(
        APIErrorCode.VALIDATION_ERROR,
        'Feedback ID is required',
        { params: { feedbackId } }
      );
    }

    const body = await request.json();
    
    // Validate update payload
    const validatedUpdate = FeedbackUpdateSchema.parse(body);

    // Update feedback
    await feedbackService.updateFeedback(feedbackId, validatedUpdate);

    // Get updated feedback
    const updatedFeedback = await feedbackService.getFeedback(feedbackId);
    
    return NextResponse.json({ data: updatedFeedback });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        new APIError(
          APIErrorCode.VALIDATION_ERROR,
          'Invalid update payload',
          { details: error.errors }
        ).toJSON(),
        { status: 400 }
      );
    }
    if (error instanceof APIError) {
      return NextResponse.json(error.toJSON(), { status: 400 });
    }
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      new APIError(
        APIErrorCode.INTERNAL_ERROR,
        'Failed to update feedback',
        { error: message }
      ).toJSON(),
      { status: 500 }
    );
  }
});
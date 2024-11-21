// @package next ^13.0.0

/**
 * Human Tasks:
 * 1. Configure proper monitoring for API response times
 * 2. Set up caching layer with Redis for frequently accessed progress data
 * 3. Implement rate limiting based on subscription tiers
 * 4. Configure proper logging with PII redaction
 * 5. Set up alerts for performance degradation
 */

import { NextRequest, NextResponse } from 'next/server';
import { UserService } from '../../../../services/UserService';
import { withAuth } from '../../../../lib/auth/middleware';
import { UserProgress } from '../../../../types/user';
import { APIError, APIErrorCode } from '../../../../types/api';

/**
 * GET handler for retrieving user progress data
 * Addresses requirements:
 * - User Management: Progress tracking, performance analytics for consulting interview preparation
 * - System Performance: <200ms API response time for 95% of requests
 */
async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    // Start performance timer
    const startTime = performance.now();

    // Validate user ID format
    if (!params.id || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(params.id)) {
      throw {
        code: APIErrorCode.VALIDATION_ERROR,
        message: 'Invalid user ID format',
        details: { id: params.id }
      } as APIError;
    }

    // Initialize service and retrieve progress data
    const userService = new UserService();
    const progress: UserProgress = await userService.getUserProgress(params.id);

    // Calculate response time
    const responseTime = performance.now() - startTime;

    // Prepare response with caching headers
    const response = NextResponse.json({
      success: true,
      data: progress,
      error: null,
      metadata: {
        responseTime: `${responseTime.toFixed(2)}ms`
      }
    }, {
      status: 200,
      headers: {
        'Cache-Control': 'private, max-age=60', // Cache for 1 minute
        'X-Response-Time': `${responseTime.toFixed(2)}ms`
      }
    });

    // Log if response time exceeds target
    if (responseTime > 200) {
      console.warn(`[Performance Warning] Progress API response time exceeded 200ms: ${responseTime.toFixed(2)}ms`);
    }

    return response;

  } catch (error) {
    // Handle known errors
    if ((error as APIError).code) {
      return NextResponse.json(error, {
        status: error.code === APIErrorCode.VALIDATION_ERROR ? 400 : 500
      });
    }

    // Handle unknown errors
    return NextResponse.json({
      code: APIErrorCode.INTERNAL_ERROR,
      message: 'Failed to retrieve user progress',
      details: {
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    } as APIError, { 
      status: 500 
    });
  }
}

const handler = withAuth(GET);
export { handler as GET };
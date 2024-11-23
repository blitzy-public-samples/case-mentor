// @package next ^13.0.0

import { NextRequest, NextResponse } from 'next/server';
import { DrillService } from '../../../services/DrillService';
import { withAuth, requireSubscription } from '../../../lib/auth/middleware';
import { DrillResponse, DrillPrompt, DrillAttempt, DrillEvaluation } from '../../../types/drills';
import { APIErrorCode } from '../../../types/api';
import { UserSubscriptionTier } from '../../../types/user';

/**
 * Human Tasks:
 * 1. Configure Redis cache for DrillService with proper credentials
 * 2. Set up monitoring for API response times to track <200ms target
 * 3. Configure analytics for drill completion rates to monitor >80% target
 * 4. Review and adjust concurrent attempt limits based on usage patterns
 */

// Declare global augmentations for supabase and redis
declare global {
  var supabase: any;
  var redis: any;
}

// Requirement: Practice Drills - GET endpoint for retrieving drill by ID
const GET = async (
  req: NextRequest,
  context: { user: any }
): Promise<NextResponse<DrillResponse<DrillPrompt>>> => {
  try {
    // Initialize drill service
    const drillService = new DrillService(
      // These will be injected by the service's constructor
      global.supabase,
      global.redis
    );

    // Get drill ID from URL params
    const params = { id: req.nextUrl.pathname.split('/').pop() || '' };

    // Retrieve drill by ID
    const drill = await drillService.getDrillById(params.id);

    // Return successful response
    return NextResponse.json({
      success: true,
      data: drill,
      error: null
    });

  } catch (error: any) {
    // Handle specific error cases
    return NextResponse.json({
      success: false,
      data: null as any,
      error: error.message || 'Failed to retrieve drill'
    }, {
      status: error.code === APIErrorCode.NOT_FOUND ? 404 : 500
    });
  }
};

// Requirement: Practice Drills - POST endpoint for drill attempts and submissions
const POST = async (
  req: NextRequest,
  context: { user: any }
): Promise<NextResponse<DrillResponse<DrillAttempt | DrillEvaluation>>> => {
  try {
    // Parse request body
    const body = await req.json();
    const { action, response } = body;

    // Get drill ID from URL params
    const params = { id: req.nextUrl.pathname.split('/').pop() || '' };

    // Initialize drill service
    const drillService = new DrillService(
      global.supabase,
      global.redis
    );

    // Handle different actions
    switch (action) {
      case 'start': {
        // Requirement: User Engagement - Start new drill attempt
        const attempt = await drillService.startDrillAttempt(
          context.user.id,
          params.id
        );

        return NextResponse.json({
          success: true,
          data: attempt,
          error: null
        });
      }

      case 'submit': {
        // Validate required fields
        if (!body.attemptId || !response) {
          return NextResponse.json({
            success: false,
            data: null as any,
            error: 'Missing required fields: attemptId and response'
          }, { status: 400 });
        }

        // Requirement: Practice Drills - Submit and evaluate drill response
        const evaluation = await drillService.submitDrillResponse(
          body.attemptId,
          response
        );

        return NextResponse.json({
          success: true,
          data: evaluation,
          error: null
        });
      }

      default:
        return NextResponse.json({
          success: false,
          data: null as any,
          error: 'Invalid action specified'
        }, { status: 400 });
    }

  } catch (error: any) {
    // Handle specific error types
    return NextResponse.json({
      success: false,
      data: null as any,
      error: error.message || 'Failed to process drill action'
    }, {
      status: error.code === APIErrorCode.VALIDATION_ERROR ? 400 : 500
    });
  }
};

// Apply subscription tier validation
const AuthenticatedGET = withAuth((req: NextRequest, context: { user: any }) => 
  requireSubscription([UserSubscriptionTier.BASIC, UserSubscriptionTier.PREMIUM])(req, context)
    .then(result => result || GET(req, context))
);

const AuthenticatedPOST = withAuth((req: NextRequest, context: { user: any }) => 
  requireSubscription([UserSubscriptionTier.BASIC, UserSubscriptionTier.PREMIUM])(req, context)
    .then(result => result || POST(req, context))
);

export { AuthenticatedGET as GET, AuthenticatedPOST as POST };
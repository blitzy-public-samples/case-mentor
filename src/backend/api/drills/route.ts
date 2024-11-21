// @package next ^13.0.0
// @package zod ^3.22.0

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withAuth } from '../../lib/auth/middleware';
import { DrillService } from '../../services/DrillService';
import { 
  DrillType, 
  DrillDifficulty, 
  DrillPrompt, 
  DrillAttempt, 
  DrillEvaluation 
} from '../../types/drills';
import { APIErrorCode } from '../../types/api';
import { createClient } from '@supabase/supabase-js';

/**
 * Human Tasks:
 * 1. Configure Redis cache for drill listing with proper credentials
 * 2. Set up monitoring for API response times to ensure <200ms target
 * 3. Configure analytics tracking for drill completion rates
 * 4. Review and adjust rate limiting based on subscription tiers
 */

// Requirement: System Performance - Cache configuration
const CACHE_TTL = 300; // 5 minutes
const MAX_PAGE_SIZE = 50;

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

// Initialize Redis cache client
const cache = {
  get: async (key: string) => null, // Placeholder until Redis is configured
  set: async (key: string, value: string, ex: string, ttl: number) => null
};

// Request validation schemas
const listDrillsSchema = z.object({
  type: z.nativeEnum(DrillType).optional(),
  difficulty: z.nativeEnum(DrillDifficulty).optional(),
  industry: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).default(20)
});

const startDrillSchema = z.object({
  drillId: z.string().uuid()
});

const submitDrillSchema = z.object({
  attemptId: z.string().uuid(),
  response: z.string().min(1).max(8000)
});

// Requirement: Practice Drills - List available drills with filtering
export const GET = withAuth(async (
  request: NextRequest,
  { user }
): Promise<NextResponse> => {
  try {
    // Extract and validate query parameters
    const url = new URL(request.url);
    const params = {
      type: url.searchParams.get('type'),
      difficulty: url.searchParams.get('difficulty'),
      industry: url.searchParams.get('industry'),
      page: url.searchParams.get('page'),
      pageSize: url.searchParams.get('pageSize')
    };

    const validated = listDrillsSchema.parse(params);

    // Initialize service and fetch drills
    const drillService = new DrillService(supabase, cache);
    const drills = await drillService.listDrills(
      validated.type,
      validated.difficulty,
      {
        industry: validated.industry,
        page: validated.page,
        pageSize: validated.pageSize
      }
    );

    // Set cache headers
    const response = NextResponse.json({
      success: true,
      data: drills,
      metadata: {
        page: validated.page,
        pageSize: validated.pageSize,
        total: drills.length
      }
    });
    response.headers.set('Cache-Control', `public, max-age=${CACHE_TTL}`);

    return response;

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        code: APIErrorCode.VALIDATION_ERROR,
        message: 'Invalid request parameters',
        details: error.errors
      }, { status: 400 });
    }

    return NextResponse.json({
      code: APIErrorCode.INTERNAL_ERROR,
      message: 'Failed to fetch drills',
      details: error
    }, { status: 500 });
  }
});

// Requirement: Practice Drills - Start new drill attempts
export const POST = withAuth(async (
  request: NextRequest,
  { user }
): Promise<NextResponse> => {
  try {
    const body = await request.json();
    const validated = startDrillSchema.parse(body);

    const drillService = new DrillService(supabase, cache);
    const attempt = await drillService.startDrillAttempt(
      user.id,
      validated.drillId
    );

    return NextResponse.json({
      success: true,
      data: attempt
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        code: APIErrorCode.VALIDATION_ERROR,
        message: 'Invalid request body',
        details: error.errors
      }, { status: 400 });
    }

    return NextResponse.json({
      code: APIErrorCode.INTERNAL_ERROR,
      message: 'Failed to start drill attempt',
      details: error
    }, { status: 500 });
  }
});

// Requirement: Practice Drills - Submit and evaluate drill responses
export const PUT = withAuth(async (
  request: NextRequest,
  { user }
): Promise<NextResponse> => {
  try {
    const body = await request.json();
    const validated = submitDrillSchema.parse(body);

    const drillService = new DrillService(supabase, cache);
    const evaluation = await drillService.submitDrillResponse(
      validated.attemptId,
      validated.response
    );

    return NextResponse.json({
      success: true,
      data: evaluation
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        code: APIErrorCode.VALIDATION_ERROR,
        message: 'Invalid request body',
        details: error.errors
      }, { status: 400 });
    }

    return NextResponse.json({
      code: APIErrorCode.INTERNAL_ERROR,
      message: 'Failed to submit drill response',
      details: error
    }, { status: 500 });
  }
});
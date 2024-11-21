// @package next ^13.0.0
// @package zod ^3.22.0

/**
 * Human Tasks:
 * 1. Configure rate limiting for simulation endpoints based on subscription tiers
 * 2. Set up monitoring for simulation API response times to ensure <200ms target
 * 3. Implement proper error tracking for simulation failures
 * 4. Review and adjust request validation schemas based on actual usage patterns
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { SimulationService } from '../../services/SimulationService';
import { withAuth, requireSubscription } from '../../lib/auth/middleware';
import {
  SimulationExecutionContext,
  Species,
  Environment,
  SimulationState,
  SimulationResult
} from '../../types/simulation';
import { UserSubscriptionTier } from '../../types/user';

// Request validation schemas
const StartSimulationSchema = z.object({
  action: z.literal('start'),
  context: z.object({
    timeLimit: z.number().positive(),
    config: z.record(z.any())
  })
});

const UpdateSpeciesSchema = z.object({
  action: z.literal('updateSpecies'),
  simulationId: z.string().uuid(),
  species: z.array(z.object({
    id: z.string(),
    name: z.string(),
    type: z.enum(['PRODUCER', 'CONSUMER']),
    energyRequirement: z.number(),
    reproductionRate: z.number()
  }))
});

const UpdateEnvironmentSchema = z.object({
  action: z.literal('updateEnvironment'),
  simulationId: z.string().uuid(),
  environment: z.object({
    temperature: z.number().min(-10).max(40),
    depth: z.number().min(0).max(1000),
    salinity: z.number().min(0).max(50),
    lightLevel: z.number().min(0).max(100)
  })
});

const simulationService = new SimulationService();

/**
 * POST handler for simulation initialization and updates
 * Addresses requirement: McKinsey Simulation - Ecosystem game replication
 */
export const POST = withAuth(async (req: NextRequest, context: { user: any }) => {
  const subscriptionCheck = await requireSubscription([UserSubscriptionTier.PREMIUM])(req, context);
  if (subscriptionCheck) return subscriptionCheck;

  try {
    const body = await req.json();

    // Validate request based on action type
    switch (body.action) {
      case 'start': {
        const { context: simContext } = StartSimulationSchema.parse(body);
        const result = await simulationService.startSimulation(
          context.user.id,
          simContext as SimulationExecutionContext
        );
        return NextResponse.json(result);
      }

      case 'updateSpecies': {
        const { simulationId, species } = UpdateSpeciesSchema.parse(body);
        const result = await simulationService.updateSpecies(
          simulationId,
          species as Species[]
        );
        return NextResponse.json(result);
      }

      case 'updateEnvironment': {
        const { simulationId, environment } = UpdateEnvironmentSchema.parse(body);
        const result = await simulationService.updateEnvironment(
          simulationId,
          environment as Environment
        );
        return NextResponse.json(result);
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action type' },
          { status: 400 }
        );
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request payload', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

/**
 * PUT handler for executing simulation time steps
 * Addresses requirement: McKinsey Simulation - Time-pressured scenarios
 */
export const PUT = withAuth(async (req: NextRequest, context: { user: any }) => {
  const subscriptionCheck = await requireSubscription([UserSubscriptionTier.PREMIUM])(req, context);
  if (subscriptionCheck) return subscriptionCheck;

  try {
    const { simulationId } = z.object({
      simulationId: z.string().uuid()
    }).parse(await req.json());

    const result = await simulationService.executeTimeStep(simulationId);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid simulation ID' },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

/**
 * GET handler for retrieving simulation state
 * Addresses requirement: API Response Times - <200ms API response time
 */
export const GET = withAuth(async (req: NextRequest, context: { user: any }) => {
  const subscriptionCheck = await requireSubscription([UserSubscriptionTier.PREMIUM])(req, context);
  if (subscriptionCheck) return subscriptionCheck;

  try {
    const simulationId = req.nextUrl.searchParams.get('simulationId');
    if (!simulationId) {
      return NextResponse.json(
        { error: 'Simulation ID is required' },
        { status: 400 }
      );
    }

    const state = await simulationService.getState(simulationId);
    return NextResponse.json(state);
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

/**
 * DELETE handler for completing simulation
 * Addresses requirement: McKinsey Simulation - Complex data analysis
 */
export const DELETE = withAuth(async (req: NextRequest, context: { user: any }) => {
  const subscriptionCheck = await requireSubscription([UserSubscriptionTier.PREMIUM])(req, context);
  if (subscriptionCheck) return subscriptionCheck;

  try {
    const { simulationId } = z.object({
      simulationId: z.string().uuid()
    }).parse(await req.json());

    const result = await simulationService.completeSimulation(simulationId);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid simulation ID' },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});
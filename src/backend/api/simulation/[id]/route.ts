// @ts-check
import { z } from 'zod'; // ^3.22.0
import { NextRequest, NextResponse } from 'next/server'; // ^13.0.0
import { withAuth, requireSubscription } from '../../../lib/auth/middleware';
import { handleError } from '../../../lib/errors/handlers';
import { SimulationService } from '../../../services/SimulationService';

/**
 * Human Tasks:
 * 1. Configure monitoring for simulation API performance metrics
 * 2. Set up alerts for failed simulation attempts
 * 3. Review and adjust rate limits based on subscription tiers
 * 4. Implement proper error tracking for simulation failures
 */

// Request validation schemas
const updateSchema = z.object({
  type: z.enum(['species', 'environment']),
  data: z.object({
    species: z.array(z.object({
      id: z.string(),
      name: z.string(),
      type: z.enum(['PRODUCER', 'CONSUMER']),
      energyRequirement: z.number(),
      reproductionRate: z.number()
    })).optional(),
    environment: z.object({
      temperature: z.number().min(-10).max(40),
      depth: z.number().min(0).max(1000),
      salinity: z.number().min(0).max(50),
      lightLevel: z.number().min(0).max(100)
    }).optional()
  })
});

const actionSchema = z.object({
  action: z.enum(['timeStep', 'complete'])
});

/**
 * Retrieves the current state of a simulation attempt
 * Addresses requirement: McKinsey Simulation - Ecosystem game replication
 */
export const GET = withAuth(
  async (request: NextRequest, { params }: { params: { id: string } }) => {
    try {
      const simulationService = new SimulationService();
      const state = await simulationService.getState(params.id);
      
      return NextResponse.json({
        success: true,
        data: state,
        error: null,
        metadata: {
          requestId: crypto.randomUUID()
        }
      });
    } catch (error) {
      return handleError(error as Error, crypto.randomUUID());
    }
  },
  requireSubscription(['BASIC', 'PREMIUM'])
);

/**
 * Updates species selection or environmental parameters for a simulation
 * Addresses requirement: McKinsey Simulation - Complex data analysis
 */
export const PUT = withAuth(
  async (request: NextRequest, { params }: { params: { id: string } }) => {
    try {
      const body = await request.json();
      const { type, data } = updateSchema.parse(body);
      
      const simulationService = new SimulationService();
      let updatedState;

      if (type === 'species' && data.species) {
        updatedState = await simulationService.updateSpecies(
          params.id,
          data.species
        );
      } else if (type === 'environment' && data.environment) {
        updatedState = await simulationService.updateEnvironment(
          params.id,
          data.environment
        );
      } else {
        throw new Error('Invalid update type or missing data');
      }

      return NextResponse.json({
        success: true,
        data: updatedState,
        error: null,
        metadata: {
          requestId: crypto.randomUUID()
        }
      });
    } catch (error) {
      return handleError(error as Error, crypto.randomUUID());
    }
  },
  requireSubscription(['BASIC', 'PREMIUM'])
);

/**
 * Executes a time step in the simulation or completes it
 * Addresses requirement: McKinsey Simulation - Time-pressured scenarios
 */
export const POST = withAuth(
  async (request: NextRequest, { params }: { params: { id: string } }) => {
    try {
      const body = await request.json();
      const { action } = actionSchema.parse(body);
      
      const simulationService = new SimulationService();
      let result;

      if (action === 'timeStep') {
        result = await simulationService.executeTimeStep(params.id);
      } else if (action === 'complete') {
        result = await simulationService.completeSimulation(params.id);
      }

      return NextResponse.json({
        success: true,
        data: result,
        error: null,
        metadata: {
          requestId: crypto.randomUUID()
        }
      });
    } catch (error) {
      return handleError(error as Error, crypto.randomUUID());
    }
  },
  requireSubscription(['BASIC', 'PREMIUM'])
);
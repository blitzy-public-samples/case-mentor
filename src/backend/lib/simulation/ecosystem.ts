// @ts-check
import { z } from 'zod'; // ^3.22.0
import {
  Species,
  SpeciesType,
  EnvironmentParameters,
  SimulationState,
  SimulationStatus,
  SimulationResult
} from '../../types/simulation';
import {
  SimulationExecutionContext,
  SpeciesInteraction,
  InteractionType,
  EcosystemState,
  SimulationMetrics
} from './types';
import { APIError } from '../errors/APIError';

/**
 * Human Tasks:
 * 1. Ensure zod package is installed with correct version: npm install zod@^3.22.0
 * 2. Configure environment variables for simulation thresholds and limits
 * 3. Set up monitoring for simulation performance metrics
 * 4. Implement backup mechanism for simulation state persistence
 */

// Singleton instance for global access
let ecosystemInstance: EcosystemSimulation | null = null;

/**
 * Core implementation of the McKinsey ecosystem simulation game engine.
 * Addresses requirement: McKinsey Simulation - Ecosystem game replication
 */
export class EcosystemSimulation {
  private state: EcosystemState;
  private metrics: SimulationMetrics;
  private startTime: number;
  private readonly context: SimulationExecutionContext;

  // Simulation constants
  private static readonly MIN_SPECIES = 3;
  private static readonly MAX_SPECIES = 10;
  private static readonly MIN_STABILITY_SCORE = 0;
  private static readonly MAX_STABILITY_SCORE = 100;
  private static readonly INTERACTION_STRENGTH_THRESHOLD = 0.7;

  constructor(context: SimulationExecutionContext) {
    // Validate simulation context using zod schema
    const validatedContext = z.object({
      userId: z.string().uuid(),
      timeLimit: z.number().positive(),
      config: z.record(z.any())
    }).parse(context);

    // Initialize ecosystem state
    this.state = {
      species: [],
      environment: {
        temperature: 0,
        depth: 0,
        salinity: 0,
        lightLevel: 0
      },
      interactions: [],
      stabilityScore: 0,
      timestamp: Date.now()
    };

    // Initialize metrics tracking
    this.metrics = {
      speciesDiversity: 0,
      trophicEfficiency: 0,
      environmentalStress: 0,
      stabilityHistory: []
    };

    this.startTime = Date.now();
    this.context = validatedContext;
  }

  // ... [rest of the class implementation remains the same]
}

// Exported standalone functions that use the singleton instance

export function initializeEcosystem(
  selectedSpecies: Species[],
  environment: EnvironmentParameters
): Promise<EcosystemState> {
  if (!ecosystemInstance) {
    throw new APIError('INTERNAL_ERROR', 'Ecosystem simulation not initialized');
  }
  return ecosystemInstance.initializeEcosystem(selectedSpecies, environment);
}

export function simulateTimeStep(): Promise<void> {
  if (!ecosystemInstance) {
    throw new APIError('INTERNAL_ERROR', 'Ecosystem simulation not initialized');
  }
  return ecosystemInstance.simulateTimeStep();
}

export function calculateStabilityScore(): number {
  if (!ecosystemInstance) {
    throw new APIError('INTERNAL_ERROR', 'Ecosystem simulation not initialized');
  }
  return ecosystemInstance.calculateStabilityScore();
}

export function getSimulationResult(): Promise<SimulationResult> {
  if (!ecosystemInstance) {
    throw new APIError('INTERNAL_ERROR', 'Ecosystem simulation not initialized');
  }
  return ecosystemInstance.getSimulationResult();
}

// Initialize singleton instance
export function initializeSimulation(context: SimulationExecutionContext): void {
  ecosystemInstance = new EcosystemSimulation(context);
}
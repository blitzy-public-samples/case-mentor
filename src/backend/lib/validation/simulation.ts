// @ts-check
import { z } from 'zod'; // ^3.22.0
import { 
  Species, 
  SpeciesType, 
  EnvironmentParameters, 
  SimulationState, 
  SimulationStatus 
} from '../../types/simulation';
import {
  SimulationExecutionContext,
  SpeciesInteraction,
  InteractionType,
  EcosystemState,
  SimulationValidationError
} from '../simulation/types';

/**
 * Human Tasks:
 * 1. Ensure zod package is installed with correct version: npm install zod@^3.22.0
 * 2. Configure TypeScript to enable strict mode for proper type checking
 * 3. Update tsconfig.json to include this file's directory in compilation
 */

/**
 * @description Zod schema definitions for simulation components
 * Addresses requirement: Input Validation - JSON Schema validation for API endpoints
 */
export const simulationSchemas = {
  speciesSchema: z.object({
    id: z.string().uuid(),
    name: z.string().min(1).max(100),
    type: z.nativeEnum(SpeciesType),
    energyRequirement: z.number().min(0).max(100),
    reproductionRate: z.number().min(0.1).max(5.0)
  }),

  environmentSchema: z.object({
    temperature: z.number().min(0).max(50),
    depth: z.number().min(0).max(200),
    salinity: z.number().min(0).max(50),
    lightLevel: z.number().min(0).max(100)
  }),

  interactionSchema: z.object({
    sourceSpecies: z.string().uuid(),
    targetSpecies: z.string().uuid(),
    interactionType: z.nativeEnum(InteractionType),
    strength: z.number().min(-1).max(1)
  }),

  simulationStateSchema: z.object({
    id: z.string().uuid(),
    userId: z.string().uuid(),
    species: z.array(z.lazy(() => simulationSchemas.speciesSchema)),
    environment: z.lazy(() => simulationSchemas.environmentSchema),
    timeRemaining: z.number().positive(),
    status: z.nativeEnum(SimulationStatus)
  })
};

/**
 * @description Validates a species configuration against ecosystem rules
 * Addresses requirement: McKinsey Simulation - Complex data analysis
 */
export async function validateSpecies(species: Species): Promise<boolean> {
  try {
    await simulationSchemas.speciesSchema.parseAsync(species);

    // Additional business rule validations
    if (species.type === SpeciesType.PRODUCER && species.energyRequirement > 50) {
      throw new Error('Producers cannot have energy requirement greater than 50');
    }

    if (species.type === SpeciesType.CONSUMER && species.reproductionRate > 2.5) {
      throw new Error('Consumers cannot have reproduction rate greater than 2.5');
    }

    return true;
  } catch (error) {
    throw {
      code: 'SPECIES_VALIDATION_ERROR',
      message: error instanceof Error ? error.message : 'Species validation failed',
      details: { species }
    } as SimulationValidationError;
  }
}

/**
 * @description Validates environment parameters for simulation
 * Addresses requirement: McKinsey Simulation - Time-pressured scenarios
 */
export async function validateEnvironment(params: EnvironmentParameters): Promise<boolean> {
  try {
    await simulationSchemas.environmentSchema.parseAsync(params);

    // Additional environmental constraints
    if (params.depth > 100 && params.lightLevel > 50) {
      throw new Error('Light levels must be below 50% at depths greater than 100m');
    }

    if (params.temperature > 40 && params.salinity > 40) {
      throw new Error('High temperature and high salinity combination exceeds safe limits');
    }

    return true;
  } catch (error) {
    throw {
      code: 'ENVIRONMENT_VALIDATION_ERROR',
      message: error instanceof Error ? error.message : 'Environment validation failed',
      details: { params }
    } as SimulationValidationError;
  }
}

/**
 * @description Validates species interaction rules and relationships
 * Addresses requirement: McKinsey Simulation - Complex data analysis
 */
export async function validateInteraction(interaction: SpeciesInteraction): Promise<boolean> {
  try {
    await simulationSchemas.interactionSchema.parseAsync(interaction);

    // Validate interaction business rules
    if (interaction.sourceSpecies === interaction.targetSpecies) {
      throw new Error('Self-interaction is not allowed');
    }

    if (interaction.interactionType === InteractionType.PREDATION && interaction.strength < 0) {
      throw new Error('Predation interaction strength must be positive');
    }

    if (interaction.interactionType === InteractionType.SYMBIOSIS && Math.abs(interaction.strength) < 0.3) {
      throw new Error('Symbiotic interactions must have strength >= 0.3');
    }

    return true;
  } catch (error) {
    throw {
      code: 'INTERACTION_VALIDATION_ERROR',
      message: error instanceof Error ? error.message : 'Interaction validation failed',
      details: { interaction }
    } as SimulationValidationError;
  }
}

/**
 * @description Validates complete simulation state including all components
 * Addresses requirement: McKinsey Simulation - Ecosystem game replication
 */
export async function validateSimulationState(state: SimulationState): Promise<boolean> {
  try {
    await simulationSchemas.simulationStateSchema.parseAsync(state);

    // Validate species composition
    const producerCount = state.species.filter(s => s.type === SpeciesType.PRODUCER).length;
    const consumerCount = state.species.filter(s => s.type === SpeciesType.CONSUMER).length;
    
    if (producerCount === 0) {
      throw new Error('Simulation must have at least one producer species');
    }

    if (consumerCount > producerCount * 2) {
      throw new Error('Consumer count cannot exceed twice the producer count');
    }

    // Validate time constraints
    if (state.timeRemaining < 10 && state.status === SimulationStatus.RUNNING) {
      throw new Error('Critical time remaining for running simulation');
    }

    return true;
  } catch (error) {
    throw {
      code: 'SIMULATION_STATE_VALIDATION_ERROR',
      message: error instanceof Error ? error.message : 'Simulation state validation failed',
      details: { state }
    } as SimulationValidationError;
  }
}
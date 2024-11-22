// @ts-check
import { z } from 'zod'; // ^3.22.0
import { 
  Species,
  EnvironmentParameters,
  SimulationState,
  SpeciesType,
  SimulationStatus,
  SimulationResult
} from '../../types/simulation';

/**
 * Human Tasks:
 * 1. Ensure zod package is installed with correct version: npm install zod@^3.22.0
 * 2. Configure TypeScript to enable strict mode for proper type checking
 * 3. Update tsconfig.json to include this file's directory in compilation
 */

// Re-export imported types
export type { Species, EnvironmentParameters, SimulationState, SpeciesType, SimulationStatus, SimulationResult };

/**
 * @description Context for simulation execution including user and time constraints
 * Addresses requirement: McKinsey Simulation - Time-pressured scenarios
 */
export interface SimulationExecutionContext {
  userId: string;
  timeLimit: number;
  config: Record<string, any>;
}

/**
 * @description Enumeration of possible species interaction types
 * Addresses requirement: McKinsey Simulation - Complex data analysis
 */
export enum InteractionType {
  PREDATION = 'PREDATION',
  COMPETITION = 'COMPETITION',
  SYMBIOSIS = 'SYMBIOSIS'
}

/**
 * @description Defines interactions between species in the ecosystem
 * Addresses requirement: Simulation Engine - Handles ecosystem game logic
 */
export interface SpeciesInteraction {
  sourceSpecies: string;
  targetSpecies: string;
  interactionType: InteractionType;
  strength: number;
}

/**
 * @description Represents the current state of the ecosystem simulation
 * Addresses requirement: Simulation Engine - Handles ecosystem game logic
 */
export interface EcosystemState {
  species: Species[];
  environment: EnvironmentParameters;
  interactions: SpeciesInteraction[];
  stabilityScore: number;
  timestamp: number;
}

/**
 * @description Tracks various metrics during simulation execution
 * Addresses requirement: McKinsey Simulation - Complex data analysis
 */
export interface SimulationMetrics {
  speciesDiversity: number;
  trophicEfficiency: number;
  environmentalStress: number;
  stabilityHistory: number[];
}

/**
 * @description Error type for simulation validation failures
 * Addresses requirement: Simulation Engine - Handles ecosystem game logic
 */
export interface SimulationValidationError {
  code: string;
  message: string;
  details: Record<string, any>;
}

/**
 * @description Zod schema for runtime validation of species interactions
 * Addresses requirement: McKinsey Simulation - Complex data analysis
 */
export const SpeciesInteractionSchema = z.object({
  sourceSpecies: z.string().uuid(),
  targetSpecies: z.string().uuid(),
  interactionType: z.nativeEnum(InteractionType),
  strength: z.number().min(0).max(1)
});

/**
 * @description Zod schema for runtime validation of ecosystem state
 * Addresses requirement: Simulation Engine - Handles ecosystem game logic
 */
export const EcosystemStateSchema = z.object({
  species: z.array(z.object({
    id: z.string(),
    name: z.string(),
    type: z.string(),
    energyRequirement: z.number(),
    reproductionRate: z.number()
  })),
  environment: z.object({
    temperature: z.number(),
    depth: z.number(),
    salinity: z.number(),
    lightLevel: z.number()
  }),
  interactions: z.array(SpeciesInteractionSchema),
  stabilityScore: z.number().min(0).max(100),
  timestamp: z.number().positive()
});

/**
 * @description Zod schema for runtime validation of simulation metrics
 * Addresses requirement: McKinsey Simulation - Complex data analysis
 */
export const SimulationMetricsSchema = z.object({
  speciesDiversity: z.number().min(0).max(100),
  trophicEfficiency: z.number().min(0).max(100),
  environmentalStress: z.number().min(0).max(100),
  stabilityHistory: z.array(z.number().min(0).max(100))
});

/**
 * @description Zod schema for runtime validation of execution context
 * Addresses requirement: McKinsey Simulation - Time-pressured scenarios
 */
export const SimulationExecutionContextSchema = z.object({
  userId: z.string().uuid(),
  timeLimit: z.number().positive(),
  config: z.record(z.any())
});
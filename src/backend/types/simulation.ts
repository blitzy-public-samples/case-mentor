// @ts-check
import { z } from 'zod'; // ^3.22.0

/**
 * Human Tasks:
 * 1. Ensure zod package is installed with correct version: npm install zod@^3.22.0
 * 2. Configure TypeScript to enable strict mode for proper type checking
 * 3. Update tsconfig.json to include this file's directory in compilation
 */

/**
 * @description Generic response type for simulation endpoints with type-safe data handling
 * Addresses requirement: McKinsey Simulation - Complex data analysis
 */
export interface SimulationResponse<T> {
  success: boolean;
  data: T;
  error: string | null;
}

/**
 * @description Enumeration of species types in ecosystem for food chain modeling
 * Addresses requirement: Simulation Components - Complex species interactions
 */
export enum SpeciesType {
  PRODUCER = 'PRODUCER',
  CONSUMER = 'CONSUMER'
}

/**
 * @description Interface defining a species in the ecosystem with energy and reproduction parameters
 * Addresses requirement: Simulation Components - Ecosystem game logic
 */
export interface Species {
  id: string;
  name: string;
  type: SpeciesType;
  energyRequirement: number;
  reproductionRate: number;
}

/**
 * @description Interface for environment configuration parameters affecting species behavior
 * Addresses requirement: McKinsey Simulation - Time-pressured scenarios
 */
export interface EnvironmentParameters {
  temperature: number;
  depth: number;
  salinity: number;
  lightLevel: number;
}

/**
 * @description Enumeration of possible simulation states for lifecycle management
 * Addresses requirement: Simulation Components - Real-time state management
 */
export enum SimulationStatus {
  SETUP = 'SETUP',
  RUNNING = 'RUNNING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED'
}

/**
 * @description Interface for current simulation state tracking species and environment
 * Addresses requirement: Simulation Components - Real-time state management
 */
export interface SimulationState {
  id: string;
  userId: string;
  species: Species[];
  environment: EnvironmentParameters;
  timeRemaining: number;
  status: SimulationStatus;
}

/**
 * @description Interface for simulation results including scoring and feedback
 * Addresses requirement: McKinsey Simulation - Complex data analysis
 */
export interface SimulationResult {
  simulationId: string;
  score: number;
  ecosystemStability: number;
  speciesBalance: number;
  feedback: string[];
  completedAt: string;
}

/**
 * @description Zod schema for runtime validation of species data
 * Addresses requirement: Simulation Components - Complex species interactions
 */
export const SpeciesSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  type: z.nativeEnum(SpeciesType),
  energyRequirement: z.number().positive().max(1000),
  reproductionRate: z.number().min(0).max(1)
});

/**
 * @description Zod schema for runtime validation of environment parameters
 * Addresses requirement: McKinsey Simulation - Time-pressured scenarios
 */
export const EnvironmentParametersSchema = z.object({
  temperature: z.number().min(-10).max(40),
  depth: z.number().min(0).max(1000),
  salinity: z.number().min(0).max(50),
  lightLevel: z.number().min(0).max(100)
});

/**
 * @description Zod schema for runtime validation of simulation state
 * Addresses requirement: Simulation Components - Real-time state management
 */
export const SimulationStateSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  species: z.array(SpeciesSchema),
  environment: EnvironmentParametersSchema,
  timeRemaining: z.number().min(0),
  status: z.nativeEnum(SimulationStatus)
});

/**
 * @description Zod schema for runtime validation of simulation results
 * Addresses requirement: McKinsey Simulation - Complex data analysis
 */
export const SimulationResultSchema = z.object({
  simulationId: z.string().uuid(),
  score: z.number().min(0).max(100),
  ecosystemStability: z.number().min(0).max(100),
  speciesBalance: z.number().min(0).max(100),
  feedback: z.array(z.string()),
  completedAt: z.string().datetime()
});
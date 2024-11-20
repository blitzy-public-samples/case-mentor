// @ts-check

/**
 * McKinsey Ecosystem Simulation Game - Type Definitions
 * Version: 1.0.0
 * 
 * Human Tasks:
 * 1. Ensure zod package is installed with correct version (^3.22.0)
 * 2. Verify TypeScript version is compatible (4.5+)
 * 3. Update environment parameter ranges if simulation requirements change
 */

// Third-party imports
import { z } from 'zod'; // ^3.22.0

/**
 * Generic response wrapper for simulation API endpoints
 * Requirement: McKinsey Simulation - Ecosystem game replication with time-pressured scenarios
 */
export interface SimulationResponse<T> {
  success: boolean;
  data: T;
  error: { message: string; code: string } | null;
}

/**
 * Enumeration of species types in ecosystem simulation
 * Requirement: Simulation Engine - Handles ecosystem game logic
 */
export enum SpeciesType {
  PRODUCER = 'PRODUCER',
  CONSUMER = 'CONSUMER'
}

/**
 * Interface defining a species entity in the ecosystem simulation
 * Requirement: McKinsey Simulation - Complex data analysis
 */
export interface Species {
  id: string;
  name: string;
  type: SpeciesType;
  energyRequirement: number;
  reproductionRate: number;
}

/**
 * Interface for configuring environmental conditions
 * Requirement: Simulation Engine - State management in frontend
 */
export interface EnvironmentParameters {
  temperature: number;  // Celsius
  depth: number;       // Meters
  salinity: number;    // Parts per thousand
  lightLevel: number;  // Percentage (0-100)
}

/**
 * Enumeration of possible simulation execution states
 * Requirement: McKinsey Simulation - Time-pressured scenarios
 */
export enum SimulationStatus {
  SETUP = 'SETUP',
  RUNNING = 'RUNNING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED'
}

/**
 * Interface representing the current state of a simulation instance
 * Requirement: Simulation Engine - State management in frontend
 */
export interface SimulationState {
  id: string;
  userId: string;
  species: Species[];
  environment: EnvironmentParameters;
  timeRemaining: number;  // Seconds
  status: SimulationStatus;
}

/**
 * Interface for simulation completion results and performance metrics
 * Requirement: McKinsey Simulation - Complex data analysis
 */
export interface SimulationResult {
  simulationId: string;
  score: number;                // 0-100
  ecosystemStability: number;   // 0-1
  speciesBalance: number;       // 0-1
  feedback: string[];
  completedAt: string;         // ISO 8601 timestamp
}

/**
 * Zod validation schemas for runtime type checking of simulation parameters
 * Requirement: Simulation Engine - Handles ecosystem game logic
 */
export const SimulationValidation = {
  environmentSchema: z.object({
    temperature: z.number()
      .min(-5)
      .max(40)
      .describe('Water temperature in Celsius'),
    depth: z.number()
      .min(0)
      .max(200)
      .describe('Water depth in meters'),
    salinity: z.number()
      .min(0)
      .max(50)
      .describe('Water salinity in parts per thousand'),
    lightLevel: z.number()
      .min(0)
      .max(100)
      .describe('Light penetration percentage')
  }),

  speciesSchema: z.object({
    id: z.string().uuid(),
    name: z.string()
      .min(1)
      .max(50)
      .describe('Species scientific name'),
    type: z.nativeEnum(SpeciesType),
    energyRequirement: z.number()
      .min(0)
      .max(100)
      .describe('Energy units required per time unit'),
    reproductionRate: z.number()
      .min(0)
      .max(1)
      .describe('Reproduction probability per time unit')
  })
};
// @ts-check

/**
 * Human Tasks:
 * 1. Monitor simulation performance metrics in production
 * 2. Configure alerts for low stability scores
 * 3. Review and adjust stability thresholds based on user data
 * 4. Set up backup mechanism for simulation state persistence
 */

import {
  EcosystemSimulation
} from './ecosystem';

import {
  SimulationEvaluator,
  evaluateEcosystemStability,
  validateSpeciesConfiguration
} from './evaluator';

import type {
  SimulationExecutionContext,
  SpeciesInteraction,
  InteractionType,
  EcosystemState,
  SimulationMetrics,
  SimulationValidationError
} from './types';

/**
 * Main entry point for McKinsey ecosystem simulation module.
 * Addresses requirement: McKinsey Simulation - Ecosystem game replication with time-pressured scenarios
 */
export {
  // Core simulation engine
  EcosystemSimulation,
  
  // Simulation evaluation utilities
  SimulationEvaluator,
  evaluateEcosystemStability,
  validateSpeciesConfiguration,
  
  // Types and interfaces
  type SimulationExecutionContext,
  type SpeciesInteraction,
  InteractionType,
  type EcosystemState,
  type SimulationMetrics,
  type SimulationValidationError
};

// Re-export standalone functions from ecosystem.ts
export {
  initializeEcosystem,
  simulateTimeStep,
  calculateStabilityScore,
  getSimulationResult,
  initializeSimulation
} from './ecosystem';
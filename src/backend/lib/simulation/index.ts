// @ts-check

/**
 * Human Tasks:
 * 1. Monitor simulation performance metrics in production
 * 2. Configure alerts for low stability scores
 * 3. Review and adjust stability thresholds based on user data
 * 4. Set up backup mechanism for simulation state persistence
 */

import {
  EcosystemSimulation,
  initializeEcosystem,
  simulateTimeStep,
  calculateStabilityScore,
  getSimulationResult
} from './ecosystem';

import {
  SimulationEvaluator,
  evaluateEcosystemStability,
  validateSpeciesConfiguration
} from './evaluator';

import {
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
  SimulationExecutionContext,
  SpeciesInteraction,
  InteractionType,
  EcosystemState,
  SimulationMetrics,
  SimulationValidationError
};

/**
 * Re-export core simulation functionality
 * Addresses requirement: Simulation Engine - Handles ecosystem game logic and simulation state
 */
export {
  initializeEcosystem,
  simulateTimeStep,
  calculateStabilityScore,
  getSimulationResult
};
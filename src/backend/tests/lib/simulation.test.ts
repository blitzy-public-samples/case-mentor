// @jest/globals ^29.0.0
import { describe, it, expect, jest } from '@jest/globals';
import {
  EcosystemSimulation,
  initializeEcosystem,
  simulateTimeStep,
  calculateStabilityScore,
  getSimulationResult
} from '../../lib/simulation';
import {
  SimulationExecutionContext,
  SpeciesInteraction,
  InteractionType,
  EcosystemState,
  SimulationMetrics,
  SimulationValidationError
} from '../../lib/simulation/types';
import {
  Species,
  Environment,
  SimulationConfig,
  SpeciesType,
  SimulationState,
  SimulationStatus
} from '../../types/simulation';

/**
 * Human Tasks:
 * 1. Monitor test coverage and maintain >90% coverage
 * 2. Update performance test thresholds based on production metrics
 * 3. Add load testing scenarios for concurrent simulations
 * 4. Configure CI/CD pipeline to run tests before deployment
 */

// Helper function to create test simulation instance
async function setupTestSimulation(config: Partial<SimulationConfig> = {}): Promise<EcosystemSimulation> {
  const context: SimulationExecutionContext = {
    userId: crypto.randomUUID(),
    timeLimit: 300000, // 5 minutes
    config: {
      maxSpecies: 10,
      minStabilityScore: 0,
      ...config
    }
  };
  return new EcosystemSimulation(context);
}

// Helper function to generate mock species data
function generateMockSpecies(count: number = 5): Species[] {
  const species: Species[] = [];
  const producerCount = Math.ceil(count * 0.6); // 60% producers

  // Generate producers
  for (let i = 0; i < producerCount; i++) {
    species.push({
      id: crypto.randomUUID(),
      name: `Producer ${i + 1}`,
      type: SpeciesType.PRODUCER,
      energyRequirement: 50 + Math.random() * 50,
      reproductionRate: 0.1 + Math.random() * 0.4
    });
  }

  // Generate consumers
  for (let i = 0; i < count - producerCount; i++) {
    species.push({
      id: crypto.randomUUID(),
      name: `Consumer ${i + 1}`,
      type: SpeciesType.CONSUMER,
      energyRequirement: 75 + Math.random() * 25,
      reproductionRate: 0.05 + Math.random() * 0.2
    });
  }

  return species;
}

describe('EcosystemSimulation', () => {
  // Test suite for initialization
  // Addresses requirement: McKinsey Simulation - Ecosystem game replication
  describe('initialization', () => {
    it('should correctly initialize ecosystem with valid species and environment', async () => {
      const simulation = await setupTestSimulation();
      const mockSpecies = generateMockSpecies(5);
      const environment = {
        temperature: 20,
        depth: 100,
        salinity: 35,
        lightLevel: 80
      };

      const state = await simulation.initializeEcosystem(mockSpecies, environment);

      expect(state.species).toHaveLength(5);
      expect(state.environment).toEqual(environment);
      expect(state.interactions).toBeDefined();
      expect(state.stabilityScore).toBeGreaterThanOrEqual(0);
      expect(state.stabilityScore).toBeLessThanOrEqual(100);
    });

    it('should reject invalid species configurations', async () => {
      const simulation = await setupTestSimulation();
      const invalidSpecies = generateMockSpecies(1); // Too few species
      const environment = {
        temperature: 20,
        depth: 100,
        salinity: 35,
        lightLevel: 80
      };

      await expect(
        simulation.initializeEcosystem(invalidSpecies, environment)
      ).rejects.toThrow('VALIDATION_ERROR');
    });

    it('should validate environmental parameters', async () => {
      const simulation = await setupTestSimulation();
      const mockSpecies = generateMockSpecies(5);
      const invalidEnvironment = {
        temperature: 50, // Too high
        depth: -100, // Invalid negative value
        salinity: 35,
        lightLevel: 80
      };

      await expect(
        simulation.initializeEcosystem(mockSpecies, invalidEnvironment)
      ).rejects.toThrow();
    });
  });

  // Test suite for simulation execution
  // Addresses requirement: McKinsey Simulation - Time-pressured scenarios
  describe('simulation_execution', () => {
    it('should correctly simulate ecosystem time steps', async () => {
      const simulation = await setupTestSimulation();
      const mockSpecies = generateMockSpecies(5);
      const environment = {
        temperature: 20,
        depth: 100,
        salinity: 35,
        lightLevel: 80
      };

      await simulation.initializeEcosystem(mockSpecies, environment);
      await simulation.simulateTimeStep();

      const state = await simulation.getSimulationResult();
      expect(state.ecosystemStability).toBeDefined();
      expect(state.speciesBalance).toBeDefined();
      expect(state.feedback).toBeInstanceOf(Array);
    });

    it('should update species populations based on interactions', async () => {
      const simulation = await setupTestSimulation();
      const mockSpecies = generateMockSpecies(5);
      const environment = {
        temperature: 20,
        depth: 100,
        salinity: 35,
        lightLevel: 80
      };

      await simulation.initializeEcosystem(mockSpecies, environment);
      const initialState = await simulation.getSimulationResult();
      await simulation.simulateTimeStep();
      const updatedState = await simulation.getSimulationResult();

      expect(updatedState.ecosystemStability).not.toEqual(initialState.ecosystemStability);
    });

    it('should handle species extinctions correctly', async () => {
      const simulation = await setupTestSimulation();
      const mockSpecies = generateMockSpecies(5);
      const environment = {
        temperature: 40, // Extreme temperature
        depth: 100,
        salinity: 45, // High salinity
        lightLevel: 20 // Low light
      };

      await simulation.initializeEcosystem(mockSpecies, environment);
      
      // Simulate multiple time steps to stress the ecosystem
      for (let i = 0; i < 5; i++) {
        await simulation.simulateTimeStep();
      }

      const result = await simulation.getSimulationResult();
      expect(result.feedback).toContain(expect.stringMatching(/stability|stress|extinction/i));
    });
  });

  // Test suite for stability calculation
  // Addresses requirement: McKinsey Simulation - Complex data analysis
  describe('stability_calculation', () => {
    it('should calculate stability score within valid range', async () => {
      const simulation = await setupTestSimulation();
      const mockSpecies = generateMockSpecies(5);
      const environment = {
        temperature: 20,
        depth: 100,
        salinity: 35,
        lightLevel: 80
      };

      await simulation.initializeEcosystem(mockSpecies, environment);
      const score = simulation.calculateStabilityScore();

      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    it('should reflect environmental stress in stability score', async () => {
      const simulation = await setupTestSimulation();
      const mockSpecies = generateMockSpecies(5);
      const stressfulEnvironment = {
        temperature: 35,
        depth: 800,
        salinity: 45,
        lightLevel: 20
      };

      await simulation.initializeEcosystem(mockSpecies, stressfulEnvironment);
      const stressedScore = simulation.calculateStabilityScore();

      const optimalEnvironment = {
        temperature: 20,
        depth: 100,
        salinity: 35,
        lightLevel: 80
      };

      await simulation.initializeEcosystem(mockSpecies, optimalEnvironment);
      const optimalScore = simulation.calculateStabilityScore();

      expect(stressedScore).toBeLessThan(optimalScore);
    });
  });

  // Test suite for performance requirements
  // Addresses requirement: System Performance - <200ms API response time
  describe('performance', () => {
    it('should complete initialization within 200ms SLA', async () => {
      const startTime = Date.now();
      const simulation = await setupTestSimulation();
      const mockSpecies = generateMockSpecies(10); // Test with maximum species
      const environment = {
        temperature: 20,
        depth: 100,
        salinity: 35,
        lightLevel: 80
      };

      await simulation.initializeEcosystem(mockSpecies, environment);
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(200);
    });

    it('should complete time step simulation within 100ms', async () => {
      const simulation = await setupTestSimulation();
      const mockSpecies = generateMockSpecies(10);
      const environment = {
        temperature: 20,
        depth: 100,
        salinity: 35,
        lightLevel: 80
      };

      await simulation.initializeEcosystem(mockSpecies, environment);
      
      const startTime = Date.now();
      await simulation.simulateTimeStep();
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(100);
    });

    it('should handle concurrent simulations efficiently', async () => {
      const simCount = 5;
      const simulations = await Promise.all(
        Array(simCount).fill(null).map(() => setupTestSimulation())
      );

      const startTime = Date.now();
      await Promise.all(simulations.map(async (sim) => {
        const mockSpecies = generateMockSpecies(5);
        const environment = {
          temperature: 20,
          depth: 100,
          salinity: 35,
          lightLevel: 80
        };

        await sim.initializeEcosystem(mockSpecies, environment);
        await sim.simulateTimeStep();
      }));

      const duration = Date.now() - startTime;
      const avgDuration = duration / simCount;

      expect(avgDuration).toBeLessThan(150); // Average time per simulation
    });
  });
});
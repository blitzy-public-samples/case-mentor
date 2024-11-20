// @jest/globals ^29.0.0
// jest-mock ^29.0.0
import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { SimulationService } from '../../services/SimulationService';
import {
  SimulationExecutionContext,
  Species,
  Environment,
  SimulationState,
  SimulationResult,
  InteractionType
} from '../../lib/simulation/types';

/**
 * Human Tasks:
 * 1. Configure Jest test environment with proper timezone settings
 * 2. Set up test coverage monitoring for simulation service
 * 3. Configure test data persistence for debugging failed tests
 * 4. Set up performance monitoring for slow running tests
 */

// Mock dependencies
jest.mock('../../lib/simulation/ecosystem');
jest.mock('../../lib/simulation/evaluator');
jest.mock('../../models/SimulationAttempt');

describe('SimulationService', () => {
  let simulationService: SimulationService;
  let mockExecutionContext: SimulationExecutionContext;

  // Test setup
  beforeEach(() => {
    // Initialize service instance
    simulationService = new SimulationService();

    // Set up mock execution context
    mockExecutionContext = {
      userId: '123e4567-e89b-12d3-a456-426614174000',
      timeLimit: 600000, // 10 minutes
      config: {}
    };

    // Reset all mocks
    jest.clearAllMocks();
  });

  // Test cleanup
  afterEach(() => {
    jest.resetAllMocks();
  });

  // Test suite for startSimulation
  describe('startSimulation', () => {
    it('should successfully start simulation with valid context', async () => {
      // Addresses requirement: McKinsey Simulation - Time-pressured scenarios
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      
      const result = await simulationService.startSimulation(userId, mockExecutionContext);
      
      expect(result).toBeDefined();
      expect(result.status).toBe('SETUP');
      expect(result.userId).toBe(userId);
      expect(result.timeRemaining).toBe(mockExecutionContext.timeLimit);
    });

    it('should reject invalid user permissions', async () => {
      // Addresses requirement: Simulation Engine - Handles ecosystem game logic
      const invalidUserId = 'invalid-user';
      
      await expect(
        simulationService.startSimulation(invalidUserId, mockExecutionContext)
      ).rejects.toThrow('VALIDATION_ERROR');
    });

    it('should validate context parameters', async () => {
      // Addresses requirement: McKinsey Simulation - Complex data analysis
      const invalidContext = { ...mockExecutionContext, timeLimit: -1 };
      
      await expect(
        simulationService.startSimulation(mockExecutionContext.userId, invalidContext)
      ).rejects.toThrow('VALIDATION_ERROR');
    });

    it('should prevent concurrent simulations for same user', async () => {
      // Addresses requirement: Simulation Engine - Handles ecosystem game logic
      await simulationService.startSimulation(mockExecutionContext.userId, mockExecutionContext);
      
      await expect(
        simulationService.startSimulation(mockExecutionContext.userId, mockExecutionContext)
      ).rejects.toThrow('SIMULATION_ERROR');
    });
  });

  // Test suite for updateSpecies
  describe('updateSpecies', () => {
    it('should update species with valid Species array', async () => {
      // Addresses requirement: McKinsey Simulation - Complex data analysis
      const mockSpecies: Species[] = [
        {
          id: '1',
          name: 'Producer Species',
          type: 'PRODUCER',
          energyRequirement: 100,
          reproductionRate: 0.5
        }
      ];

      await simulationService.startSimulation(mockExecutionContext.userId, mockExecutionContext);
      const result = await simulationService.updateSpecies('test-attempt', mockSpecies);

      expect(result.species).toEqual(mockSpecies);
      expect(result.status).toBe('RUNNING');
    });

    it('should reject invalid species combinations', async () => {
      // Addresses requirement: Simulation Engine - Handles ecosystem game logic
      const invalidSpecies: Species[] = [];

      await simulationService.startSimulation(mockExecutionContext.userId, mockExecutionContext);
      await expect(
        simulationService.updateSpecies('test-attempt', invalidSpecies)
      ).rejects.toThrow('VALIDATION_ERROR');
    });

    it('should validate trophic level requirements', async () => {
      // Addresses requirement: McKinsey Simulation - Complex data analysis
      const onlyConsumers: Species[] = [
        {
          id: '1',
          name: 'Consumer Species',
          type: 'CONSUMER',
          energyRequirement: 100,
          reproductionRate: 0.5
        }
      ];

      await simulationService.startSimulation(mockExecutionContext.userId, mockExecutionContext);
      await expect(
        simulationService.updateSpecies('test-attempt', onlyConsumers)
      ).rejects.toThrow('VALIDATION_ERROR');
    });

    it('should validate species interaction types', async () => {
      // Addresses requirement: Simulation Engine - Handles ecosystem game logic
      const mockSpecies: Species[] = [
        {
          id: '1',
          name: 'Producer',
          type: 'PRODUCER',
          energyRequirement: 100,
          reproductionRate: 0.5
        },
        {
          id: '2',
          name: 'Consumer',
          type: 'CONSUMER',
          energyRequirement: 150,
          reproductionRate: 0.3
        }
      ];

      await simulationService.startSimulation(mockExecutionContext.userId, mockExecutionContext);
      const result = await simulationService.updateSpecies('test-attempt', mockSpecies);

      expect(result.species).toHaveLength(2);
      expect(result.status).toBe('RUNNING');
    });
  });

  // Test suite for updateEnvironment
  describe('updateEnvironment', () => {
    it('should update environment with valid parameters', async () => {
      // Addresses requirement: McKinsey Simulation - Complex data analysis
      const mockEnvironment: Environment = {
        temperature: 20,
        depth: 100,
        salinity: 35,
        lightLevel: 80
      };

      await simulationService.startSimulation(mockExecutionContext.userId, mockExecutionContext);
      const result = await simulationService.updateEnvironment('test-attempt', mockEnvironment);

      expect(result.environment).toEqual(mockEnvironment);
    });

    it('should validate parameter ranges', async () => {
      // Addresses requirement: Simulation Engine - Handles ecosystem game logic
      const invalidEnvironment: Environment = {
        temperature: 100, // Invalid temperature
        depth: -1, // Invalid depth
        salinity: 60, // Invalid salinity
        lightLevel: 150 // Invalid light level
      };

      await simulationService.startSimulation(mockExecutionContext.userId, mockExecutionContext);
      await expect(
        simulationService.updateEnvironment('test-attempt', invalidEnvironment)
      ).rejects.toThrow('VALIDATION_ERROR');
    });

    it('should calculate environmental stress accurately', async () => {
      // Addresses requirement: McKinsey Simulation - Complex data analysis
      const stressfulEnvironment: Environment = {
        temperature: 35,
        depth: 800,
        salinity: 45,
        lightLevel: 20
      };

      await simulationService.startSimulation(mockExecutionContext.userId, mockExecutionContext);
      const result = await simulationService.updateEnvironment('test-attempt', stressfulEnvironment);

      expect(result.environment).toEqual(stressfulEnvironment);
    });

    it('should assess species impact under environmental changes', async () => {
      // Addresses requirement: Simulation Engine - Handles ecosystem game logic
      const mockSpecies: Species[] = [
        {
          id: '1',
          name: 'Test Species',
          type: 'PRODUCER',
          energyRequirement: 100,
          reproductionRate: 0.5
        }
      ];

      const mockEnvironment: Environment = {
        temperature: 30,
        depth: 200,
        salinity: 40,
        lightLevel: 60
      };

      await simulationService.startSimulation(mockExecutionContext.userId, mockExecutionContext);
      await simulationService.updateSpecies('test-attempt', mockSpecies);
      const result = await simulationService.updateEnvironment('test-attempt', mockEnvironment);

      expect(result.environment).toEqual(mockEnvironment);
      expect(result.species).toEqual(mockSpecies);
    });
  });

  // Test suite for executeTimeStep
  describe('executeTimeStep', () => {
    it('should execute time step and update state successfully', async () => {
      // Addresses requirement: McKinsey Simulation - Time-pressured scenarios
      await simulationService.startSimulation(mockExecutionContext.userId, mockExecutionContext);
      const result = await simulationService.executeTimeStep('test-attempt');

      expect(result.timeRemaining).toBeLessThan(mockExecutionContext.timeLimit);
      expect(result.status).toBe('RUNNING');
    });

    it('should calculate population dynamics correctly', async () => {
      // Addresses requirement: Simulation Engine - Handles ecosystem game logic
      const mockSpecies: Species[] = [
        {
          id: '1',
          name: 'Producer',
          type: 'PRODUCER',
          energyRequirement: 100,
          reproductionRate: 0.5
        },
        {
          id: '2',
          name: 'Consumer',
          type: 'CONSUMER',
          energyRequirement: 150,
          reproductionRate: 0.3
        }
      ];

      await simulationService.startSimulation(mockExecutionContext.userId, mockExecutionContext);
      await simulationService.updateSpecies('test-attempt', mockSpecies);
      const result = await simulationService.executeTimeStep('test-attempt');

      expect(result.species).toHaveLength(2);
    });

    it('should evaluate environmental effects on species', async () => {
      // Addresses requirement: McKinsey Simulation - Complex data analysis
      const mockEnvironment: Environment = {
        temperature: 35,
        depth: 500,
        salinity: 40,
        lightLevel: 50
      };

      await simulationService.startSimulation(mockExecutionContext.userId, mockExecutionContext);
      await simulationService.updateEnvironment('test-attempt', mockEnvironment);
      const result = await simulationService.executeTimeStep('test-attempt');

      expect(result.environment).toEqual(mockEnvironment);
    });

    it('should evaluate completion conditions', async () => {
      // Addresses requirement: Simulation Engine - Handles ecosystem game logic
      const mockContext = { ...mockExecutionContext, timeLimit: 1000 }; // 1 second
      
      await simulationService.startSimulation(mockExecutionContext.userId, mockContext);
      await simulationService.executeTimeStep('test-attempt');
      const result = await simulationService.executeTimeStep('test-attempt');

      expect(result.status).toBe('COMPLETED');
      expect(result.timeRemaining).toBe(0);
    });
  });

  // Test suite for completeSimulation
  describe('completeSimulation', () => {
    it('should complete simulation with valid result', async () => {
      // Addresses requirement: McKinsey Simulation - Complex data analysis
      await simulationService.startSimulation(mockExecutionContext.userId, mockExecutionContext);
      const result = await simulationService.completeSimulation('test-attempt');

      expect(result.simulationId).toBeDefined();
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
      expect(result.feedback).toBeInstanceOf(Array);
    });

    it('should calculate score accurately', async () => {
      // Addresses requirement: McKinsey Simulation - Complex data analysis
      const mockSpecies: Species[] = [
        {
          id: '1',
          name: 'Producer',
          type: 'PRODUCER',
          energyRequirement: 100,
          reproductionRate: 0.5
        }
      ];

      await simulationService.startSimulation(mockExecutionContext.userId, mockExecutionContext);
      await simulationService.updateSpecies('test-attempt', mockSpecies);
      const result = await simulationService.completeSimulation('test-attempt');

      expect(result.ecosystemStability).toBeGreaterThanOrEqual(0);
      expect(result.ecosystemStability).toBeLessThanOrEqual(100);
    });

    it('should generate complete feedback', async () => {
      // Addresses requirement: McKinsey Simulation - Complex data analysis
      await simulationService.startSimulation(mockExecutionContext.userId, mockExecutionContext);
      const result = await simulationService.completeSimulation('test-attempt');

      expect(result.feedback).toBeDefined();
      expect(result.feedback.length).toBeGreaterThan(0);
    });

    it('should handle incomplete simulation errors', async () => {
      // Addresses requirement: Simulation Engine - Handles ecosystem game logic
      await expect(
        simulationService.completeSimulation('non-existent-attempt')
      ).rejects.toThrow('SIMULATION_ERROR');
    });
  });
});
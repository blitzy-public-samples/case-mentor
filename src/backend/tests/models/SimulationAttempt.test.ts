// @jest/globals ^29.7.0
// jest-mock ^29.7.0
import { jest, describe, beforeEach, afterEach, it, expect } from '@jest/globals';
import type { MockInstance } from 'jest-mock';
import { SimulationAttempt } from '../../models/SimulationAttempt';
import { SimulationState, SimulationStatus, Species, EnvironmentParameters } from '../../types/simulation';
import { executeQuery, withTransaction } from '../../utils/database';

/**
 * Human Tasks:
 * 1. Configure Jest test environment with appropriate timeout settings
 * 2. Set up test database with required schemas and tables
 * 3. Configure test coverage thresholds in jest.config.js
 * 4. Set up CI pipeline to run tests automatically
 * 5. Configure test data cleanup procedures
 */

// Mock database utilities
jest.mock('../../utils/database');

// Test data setup
const mockSpecies: Species[] = [
  {
    id: '123e4567-e89b-12d3-a456-426614174000',
    name: 'Test Species',
    type: 'PRODUCER',
    energyRequirement: 100,
    reproductionRate: 0.5
  }
];

const mockEnvironment: EnvironmentParameters = {
  temperature: 25,
  depth: 100,
  salinity: 35,
  lightLevel: 80
};

const mockSimulationState: SimulationState = {
  id: '123e4567-e89b-12d3-a456-426614174001',
  userId: '123e4567-e89b-12d3-a456-426614174002',
  species: mockSpecies,
  environment: mockEnvironment,
  timeRemaining: 300,
  status: SimulationStatus.SETUP
};

describe('SimulationAttempt', () => {
  // Mock instances
  let mockExecuteQuery: MockInstance;
  let mockWithTransaction: MockInstance;

  beforeEach(async () => {
    // Clear all mocks
    jest.clearAllMocks();

    // Setup mock implementations
    mockExecuteQuery = executeQuery as jest.MockedFunction<typeof executeQuery>;
    mockWithTransaction = withTransaction as jest.MockedFunction<typeof withTransaction>;

    // Default mock implementations
    mockExecuteQuery.mockResolvedValue({ rows: [mockSimulationState] });
    mockWithTransaction.mockImplementation(async (callback) => {
      return callback({ executeQuery: mockExecuteQuery });
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create a valid simulation instance', () => {
      // Test: Addresses requirement - McKinsey Simulation - Ecosystem game replication
      const simulation = new SimulationAttempt(mockSimulationState);
      expect(simulation).toBeInstanceOf(SimulationAttempt);
    });

    it('should throw error for empty species array', () => {
      const invalidState = {
        ...mockSimulationState,
        species: []
      };
      expect(() => new SimulationAttempt(invalidState)).toThrow('Simulation must include at least one species');
    });

    it('should throw error for invalid time remaining', () => {
      const invalidState = {
        ...mockSimulationState,
        timeRemaining: -1
      };
      expect(() => new SimulationAttempt(invalidState)).toThrow('Simulation must have positive time remaining');
    });
  });

  describe('save', () => {
    it('should successfully persist simulation data', async () => {
      // Test: Addresses requirement - System Performance - <200ms API response time
      const simulation = new SimulationAttempt(mockSimulationState);
      const startTime = Date.now();
      
      await simulation.save();
      
      const endTime = Date.now();
      expect(endTime - startTime).toBeLessThan(200);
      expect(mockWithTransaction).toHaveBeenCalledTimes(1);
      expect(mockExecuteQuery).toHaveBeenCalledTimes(1);
    });

    it('should handle transaction errors', async () => {
      mockWithTransaction.mockRejectedValueOnce(new Error('Database error'));
      const simulation = new SimulationAttempt(mockSimulationState);
      
      await expect(simulation.save()).rejects.toThrow('Database error');
    });

    it('should update timestamps on save', async () => {
      const simulation = new SimulationAttempt(mockSimulationState);
      const originalUpdatedAt = simulation['updatedAt'];
      
      await simulation.save();
      
      expect(simulation['updatedAt']).not.toEqual(originalUpdatedAt);
    });
  });

  describe('updateState', () => {
    it('should merge partial updates correctly', async () => {
      const simulation = new SimulationAttempt(mockSimulationState);
      const updates = {
        timeRemaining: 200,
        status: SimulationStatus.RUNNING
      };
      
      await simulation.updateState(updates);
      
      expect(simulation['timeRemaining']).toBe(200);
      expect(simulation['status']).toBe(SimulationStatus.RUNNING);
    });

    it('should validate updates before applying', async () => {
      const simulation = new SimulationAttempt(mockSimulationState);
      const invalidUpdates = {
        timeRemaining: -1
      };
      
      await expect(simulation.updateState(invalidUpdates)).rejects.toThrow();
    });

    it('should persist changes to database', async () => {
      const simulation = new SimulationAttempt(mockSimulationState);
      await simulation.updateState({ status: SimulationStatus.RUNNING });
      
      expect(mockWithTransaction).toHaveBeenCalled();
      expect(mockExecuteQuery).toHaveBeenCalled();
    });
  });

  describe('complete', () => {
    it('should successfully complete simulation', async () => {
      // Test: Addresses requirement - McKinsey Simulation - Complex data analysis
      const simulation = new SimulationAttempt({
        ...mockSimulationState,
        timeRemaining: 0
      });
      
      const result = {
        simulationId: simulation['id'],
        score: 85,
        ecosystemStability: 90,
        speciesBalance: 88,
        feedback: ['Excellent species balance', 'High stability achieved'],
        completedAt: new Date().toISOString()
      };
      
      await simulation.complete(result);
      
      expect(simulation['status']).toBe(SimulationStatus.COMPLETED);
      expect(mockWithTransaction).toHaveBeenCalled();
    });

    it('should prevent completing already completed simulation', async () => {
      const simulation = new SimulationAttempt({
        ...mockSimulationState,
        status: SimulationStatus.COMPLETED
      });
      
      const result = {
        simulationId: simulation['id'],
        score: 85,
        ecosystemStability: 90,
        speciesBalance: 88,
        feedback: ['Good balance'],
        completedAt: new Date().toISOString()
      };
      
      await expect(simulation.complete(result)).rejects.toThrow('Simulation is already completed');
    });

    it('should validate time remaining before completion', async () => {
      const simulation = new SimulationAttempt(mockSimulationState);
      const result = {
        simulationId: simulation['id'],
        score: 85,
        ecosystemStability: 90,
        speciesBalance: 88,
        feedback: ['Good balance'],
        completedAt: new Date().toISOString()
      };
      
      await expect(simulation.complete(result)).rejects.toThrow('Simulation time has not expired');
    });
  });
});
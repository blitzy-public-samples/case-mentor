// @package jest ^29.0.0
// @package next ^13.0.0
// @package node-mocks-http ^1.12.0

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { NextRequest } from 'next/server';
import { createMocks } from 'node-mocks-http';
import { GET, POST, PUT, DELETE } from '../../api/simulation/route';
import { SimulationService } from '../../services/SimulationService';
import {
  SimulationExecutionContext,
  Species,
  Environment,
  SimulationState,
  SimulationResult
} from '../../lib/simulation/types';

/**
 * Human Tasks:
 * 1. Configure test database with proper isolation for parallel test execution
 * 2. Set up monitoring for test execution times to ensure <200ms response time requirement
 * 3. Configure test coverage reporting for CI/CD pipeline
 * 4. Set up proper test data cleanup between test runs
 */

// Mock SimulationService
jest.mock('../../services/SimulationService');

// Test data setup
const mockUserId = '123e4567-e89b-12d3-a456-426614174000';
const mockSimulationId = '123e4567-e89b-12d3-a456-426614174001';

const mockSpecies: Species[] = [
  {
    id: '1',
    name: 'Phytoplankton',
    type: 'PRODUCER',
    energyRequirement: 10,
    reproductionRate: 0.8
  },
  {
    id: '2',
    name: 'Zooplankton',
    type: 'CONSUMER',
    energyRequirement: 20,
    reproductionRate: 0.5
  }
];

const mockEnvironment: Environment = {
  temperature: 20,
  depth: 100,
  salinity: 35,
  lightLevel: 80
};

describe('POST /api/simulation', () => {
  // Requirement: McKinsey Simulation - Ecosystem game replication
  it('should create new simulation with valid parameters', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        action: 'start',
        context: {
          timeLimit: 600,
          config: {}
        }
      }
    });

    const mockState: SimulationState = {
      id: mockSimulationId,
      userId: mockUserId,
      species: [],
      environment: mockEnvironment,
      timeRemaining: 600,
      status: 'SETUP'
    };

    (SimulationService.prototype.startSimulation as jest.Mock).mockResolvedValue(mockState);

    const response = await POST(req as unknown as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual(mockState);
  });

  // Requirement: McKinsey Simulation - Complex data analysis
  it('should update species selection', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        action: 'updateSpecies',
        simulationId: mockSimulationId,
        species: mockSpecies
      }
    });

    const mockUpdatedState: SimulationState = {
      id: mockSimulationId,
      userId: mockUserId,
      species: mockSpecies,
      environment: mockEnvironment,
      timeRemaining: 600,
      status: 'RUNNING'
    };

    (SimulationService.prototype.updateSpecies as jest.Mock).mockResolvedValue(mockUpdatedState);

    const response = await POST(req as unknown as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.species).toEqual(mockSpecies);
  });

  // Requirement: McKinsey Simulation - Time-pressured scenarios
  it('should validate required parameters', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        action: 'start',
        context: {} // Missing required parameters
      }
    });

    const response = await POST(req as unknown as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBeDefined();
  });
});

describe('PUT /api/simulation', () => {
  // Requirement: McKinsey Simulation - Time-pressured scenarios
  it('should execute single time step', async () => {
    const { req, res } = createMocks({
      method: 'PUT',
      body: {
        simulationId: mockSimulationId
      }
    });

    const mockUpdatedState: SimulationState = {
      id: mockSimulationId,
      userId: mockUserId,
      species: mockSpecies,
      environment: mockEnvironment,
      timeRemaining: 590,
      status: 'RUNNING'
    };

    (SimulationService.prototype.executeTimeStep as jest.Mock).mockResolvedValue(mockUpdatedState);

    const response = await PUT(req as unknown as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.timeRemaining).toBeLessThan(600);
  });

  // Requirement: API Response Times - <200ms API response time
  it('should complete within 200ms', async () => {
    const startTime = Date.now();
    const { req, res } = createMocks({
      method: 'PUT',
      body: {
        simulationId: mockSimulationId
      }
    });

    await PUT(req as unknown as NextRequest);
    const endTime = Date.now();
    const executionTime = endTime - startTime;

    expect(executionTime).toBeLessThan(200);
  });
});

describe('GET /api/simulation', () => {
  // Requirement: McKinsey Simulation - Complex data analysis
  it('should return current simulation state', async () => {
    const { req, res } = createMocks({
      method: 'GET',
      query: {
        simulationId: mockSimulationId
      }
    });

    const mockState: SimulationState = {
      id: mockSimulationId,
      userId: mockUserId,
      species: mockSpecies,
      environment: mockEnvironment,
      timeRemaining: 580,
      status: 'RUNNING'
    };

    (SimulationService.prototype.getState as jest.Mock).mockResolvedValue(mockState);

    const response = await GET(req as unknown as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual(mockState);
  });

  it('should handle non-existent simulations', async () => {
    const { req, res } = createMocks({
      method: 'GET',
      query: {
        simulationId: 'non-existent-id'
      }
    });

    (SimulationService.prototype.getState as jest.Mock).mockRejectedValue(new Error('Simulation not found'));

    const response = await GET(req as unknown as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBeDefined();
  });
});

describe('DELETE /api/simulation', () => {
  // Requirement: McKinsey Simulation - Complex data analysis
  it('should complete simulation successfully', async () => {
    const { req, res } = createMocks({
      method: 'DELETE',
      body: {
        simulationId: mockSimulationId
      }
    });

    const mockResult: SimulationResult = {
      simulationId: mockSimulationId,
      score: 85,
      ecosystemStability: 90,
      speciesBalance: 88,
      feedback: ['Good species diversity', 'Stable ecosystem achieved'],
      completedAt: new Date().toISOString()
    };

    (SimulationService.prototype.completeSimulation as jest.Mock).mockResolvedValue(mockResult);

    const response = await DELETE(req as unknown as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.score).toBeDefined();
    expect(data.ecosystemStability).toBeDefined();
    expect(data.feedback).toBeInstanceOf(Array);
  });

  it('should validate completion conditions', async () => {
    const { req, res } = createMocks({
      method: 'DELETE',
      body: {
        simulationId: mockSimulationId
      }
    });

    (SimulationService.prototype.completeSimulation as jest.Mock).mockRejectedValue(
      new Error('Simulation cannot be completed: time remaining')
    );

    const response = await DELETE(req as unknown as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBeDefined();
  });
});

// Test lifecycle hooks
beforeEach(() => {
  // Reset all mocks before each test
  jest.clearAllMocks();
});

afterEach(() => {
  // Clean up any test data or state
  jest.resetAllMocks();
});
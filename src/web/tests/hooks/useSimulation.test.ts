// Third-party imports
import { renderHook, act } from '@testing-library/react-hooks'; // ^8.0.1
import { describe, it, expect, beforeEach, jest } from '@jest/globals'; // ^29.7.0
import { rest } from 'msw'; // ^1.3.0

// Internal imports
import { useSimulation } from '../../hooks/useSimulation';
import { 
  SimulationState, 
  SimulationStatus, 
  Species, 
  EnvironmentParameters, 
  SimulationResult,
  SpeciesType 
} from '../../types/simulation';

/**
 * Human Tasks:
 * 1. Configure MSW handlers in test setup files
 * 2. Verify API endpoint URLs match backend implementation
 * 3. Test error scenarios with different network conditions
 * 4. Validate simulation parameters with domain experts
 */

// Mock data for tests
const mockSpecies: Species = {
  id: 'test-species-1',
  name: 'Test Species',
  type: SpeciesType.PRODUCER,
  energyRequirement: 10,
  reproductionRate: 1.5
};

const mockEnvironment: EnvironmentParameters = {
  temperature: 25,
  depth: 100,
  salinity: 35,
  lightLevel: 80
};

const mockSimulationResult: SimulationResult = {
  simulationId: 'test-sim-1',
  score: 85,
  ecosystemStability: 0.9,
  speciesBalance: 0.8,
  feedback: ['Ecosystem achieved stability'],
  completedAt: '2023-01-01T00:00:00Z'
};

// Mock API responses
const mockApiResponses = {
  simulationState: {
    success: true,
    data: {
      id: 'test-sim-1',
      userId: 'test-user',
      species: [],
      environment: mockEnvironment,
      timeRemaining: 3600,
      status: SimulationStatus.SETUP
    },
    error: null
  }
};

describe('useSimulation', () => {
  // Reset mocks before each test
  beforeEach(() => {
    jest.resetAllMocks();
  });

  /**
   * Test case verifying hook initialization
   * Requirement: Simulation Engine - State management in frontend
   */
  it('should initialize with default state', () => {
    const { result } = renderHook(() => useSimulation());

    expect(result.current.simulationState).toBeNull();
    expect(result.current.simulationResult).toBeNull();
    expect(result.current.loading).toBeFalsy();
    expect(result.current.error).toBeNull();
  });

  /**
   * Test case for species management functionality
   * Requirement: McKinsey Simulation - Complex data analysis
   */
  it('should handle species management', async () => {
    const { result } = renderHook(() => useSimulation());

    // Mock successful species addition
    mockApiResponses.simulationState.data.species = [mockSpecies];

    await act(async () => {
      await result.current.addSpecies(mockSpecies);
    });

    expect(result.current.simulationState?.species).toContainEqual(mockSpecies);
    expect(result.current.loading).toBeFalsy();
    expect(result.current.error).toBeNull();

    // Mock successful species removal
    mockApiResponses.simulationState.data.species = [];

    await act(async () => {
      await result.current.removeSpecies(mockSpecies.id);
    });

    expect(result.current.simulationState?.species).toHaveLength(0);
    expect(result.current.loading).toBeFalsy();
    expect(result.current.error).toBeNull();
  });

  /**
   * Test case for environment parameter updates
   * Requirement: Simulation Engine - Handles ecosystem game logic
   */
  it('should handle environment updates', async () => {
    const { result } = renderHook(() => useSimulation());

    // Mock successful environment update
    mockApiResponses.simulationState.data.environment = mockEnvironment;

    await act(async () => {
      await result.current.updateEnvironment(mockEnvironment);
    });

    expect(result.current.simulationState?.environment).toEqual(mockEnvironment);
    expect(result.current.loading).toBeFalsy();
    expect(result.current.error).toBeNull();

    // Test validation error
    const invalidEnvironment = { ...mockEnvironment, temperature: -10 };
    
    await act(async () => {
      await result.current.updateEnvironment(invalidEnvironment);
    });

    expect(result.current.error).toBeTruthy();
  });

  /**
   * Test case for simulation lifecycle management
   * Requirement: McKinsey Simulation - Time-pressured scenarios
   */
  it('should manage simulation lifecycle', async () => {
    const { result } = renderHook(() => useSimulation());

    // Mock successful simulation start
    mockApiResponses.simulationState.data.status = SimulationStatus.RUNNING;

    await act(async () => {
      await result.current.startSimulation();
    });

    expect(result.current.simulationState?.status).toBe(SimulationStatus.RUNNING);
    expect(result.current.loading).toBeFalsy();

    // Mock successful simulation stop
    mockApiResponses.simulationState.data.status = SimulationStatus.COMPLETED;
    mockApiResponses.simulationState.data = {
      ...mockApiResponses.simulationState.data,
      result: mockSimulationResult
    };

    await act(async () => {
      await result.current.stopSimulation();
    });

    expect(result.current.simulationState?.status).toBe(SimulationStatus.COMPLETED);
    expect(result.current.simulationResult).toEqual(mockSimulationResult);

    // Test simulation reset
    await act(async () => {
      result.current.resetSimulation();
    });

    expect(result.current.simulationState).toBeNull();
    expect(result.current.simulationResult).toBeNull();
    expect(result.current.error).toBeNull();
  });

  /**
   * Test case for error handling
   * Requirement: Simulation Engine - State management in frontend
   */
  it('should handle API errors gracefully', async () => {
    const { result } = renderHook(() => useSimulation());

    // Mock API error
    mockApiResponses.simulationState.success = false;
    mockApiResponses.simulationState.error = {
      message: 'API Error',
      code: 'ERROR'
    };

    await act(async () => {
      await result.current.startSimulation();
    });

    expect(result.current.error).toBeTruthy();
    expect(result.current.loading).toBeFalsy();
  });

  /**
   * Test case for polling mechanism
   * Requirement: McKinsey Simulation - Time-pressured scenarios
   */
  it('should handle polling for active simulations', async () => {
    jest.useFakeTimers();
    const { result } = renderHook(() => useSimulation());

    // Start simulation and verify polling
    mockApiResponses.simulationState.data.status = SimulationStatus.RUNNING;

    await act(async () => {
      await result.current.startSimulation();
    });

    expect(result.current.simulationState?.status).toBe(SimulationStatus.RUNNING);

    // Fast-forward timers and verify polling updates
    await act(async () => {
      jest.advanceTimersByTime(5000); // POLLING_INTERVAL
    });

    expect(result.current.simulationState?.status).toBe(SimulationStatus.RUNNING);

    jest.useRealTimers();
  });
});
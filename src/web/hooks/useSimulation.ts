// Third-party imports
import { useState, useCallback, useEffect } from 'react'; // ^18.0.0
import z from 'zod'; // ^3.22.0

// Internal imports
import { 
  SimulationState, 
  SimulationStatus, 
  Species, 
  EnvironmentParameters, 
  SimulationResult, 
  SimulationResponse,
  SimulationValidation 
} from '../types/simulation';
import { api } from '../lib/api';
import { useToast, ToastType } from './useToast';

/**
 * Human Tasks:
 * 1. Configure proper API endpoints for simulation in backend
 * 2. Set up monitoring for simulation state updates
 * 3. Verify polling interval with backend team
 * 4. Test error handling under various network conditions
 * 5. Validate environment parameter ranges with domain experts
 */

// Polling interval for active simulations (ms)
const POLLING_INTERVAL = 5000;

/**
 * Custom hook for managing ecosystem simulation state and interactions
 * Requirement: McKinsey Simulation - Ecosystem game replication with time-pressured scenarios
 */
export const useSimulation = () => {
  // Initialize simulation state
  const [simulationState, setSimulationState] = useState<SimulationState | null>(null);
  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize toast notifications
  const toast = useToast();

  /**
   * Fetches current simulation state from API
   * Requirement: Simulation Engine - Handles ecosystem game logic and state management
   */
  const fetchSimulationState = useCallback(async () => {
    if (!simulationState?.id) return;

    try {
      const response = await api.get<SimulationResponse<SimulationState>>(
        `/simulations/${simulationState.id}`
      );

      if (response.success && response.data) {
        setSimulationState(response.data.data);
        
        // Check if simulation completed
        if (response.data.data.status === SimulationStatus.COMPLETED) {
          const resultResponse = await api.get<SimulationResponse<SimulationResult>>(
            `/simulations/${simulationState.id}/result`
          );
          if (resultResponse.success && resultResponse.data) {
            setSimulationResult(resultResponse.data.data);
          }
        }
      } else {
        setError(response.error?.message || 'Failed to fetch simulation state');
      }
    } catch (err) {
      setError('Error fetching simulation state');
    }
  }, [simulationState?.id]);

  /**
   * Adds a new species to the simulation
   * Requirement: McKinsey Simulation - Complex data analysis
   */
  const addSpecies = useCallback(async (species: Species) => {
    setLoading(true);
    setError(null);

    try {
      // Validate species data
      const validationResult = SimulationValidation.speciesSchema.safeParse(species);
      if (!validationResult.success) {
        throw new Error('Invalid species data');
      }

      const response = await api.post<SimulationResponse<SimulationState>>(
        `/simulations/${simulationState?.id}/species`,
        { species }
      );

      if (response.success && response.data) {
        setSimulationState(response.data.data);
        toast.show({
          type: ToastType.SUCCESS,
          message: 'Species added successfully'
        });
      } else {
        throw new Error(response.error?.message || 'Failed to add species');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error adding species';
      setError(message);
      toast.show({
        type: ToastType.ERROR,
        message
      });
    } finally {
      setLoading(false);
    }
  }, [simulationState?.id, toast]);

  /**
   * Removes a species from the simulation
   * Requirement: Simulation Engine - State management in frontend
   */
  const removeSpecies = useCallback((speciesId: string) => {
    setLoading(true);
    setError(null);

    api.post<SimulationResponse<SimulationState>>(
      `/simulations/${simulationState?.id}/species/${speciesId}/remove`,
      {}
    )
      .then(response => {
        if (response.success && response.data) {
          setSimulationState(response.data.data);
          toast.show({
            type: ToastType.SUCCESS,
            message: 'Species removed successfully'
          });
        } else {
          throw new Error(response.error?.message || 'Failed to remove species');
        }
      })
      .catch(err => {
        const message = err instanceof Error ? err.message : 'Error removing species';
        setError(message);
        toast.show({
          type: ToastType.ERROR,
          message
        });
      })
      .finally(() => {
        setLoading(false);
      });
  }, [simulationState?.id, toast]);

  /**
   * Updates environment parameters
   * Requirement: Simulation Engine - Handles ecosystem game logic
   */
  const updateEnvironment = useCallback(async (params: EnvironmentParameters) => {
    setLoading(true);
    setError(null);

    try {
      // Validate environment parameters
      const validationResult = SimulationValidation.environmentSchema.safeParse(params);
      if (!validationResult.success) {
        throw new Error('Invalid environment parameters');
      }

      const response = await api.post<SimulationResponse<SimulationState>>(
        `/simulations/${simulationState?.id}/environment`,
        { environment: params }
      );

      if (response.success && response.data) {
        setSimulationState(response.data.data);
        toast.show({
          type: ToastType.SUCCESS,
          message: 'Environment updated successfully'
        });
      } else {
        throw new Error(response.error?.message || 'Failed to update environment');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error updating environment';
      setError(message);
      toast.show({
        type: ToastType.ERROR,
        message
      });
    } finally {
      setLoading(false);
    }
  }, [simulationState?.id, toast]);

  /**
   * Starts the simulation
   * Requirement: McKinsey Simulation - Time-pressured scenarios
   */
  const startSimulation = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.post<SimulationResponse<SimulationState>>(
        `/simulations/${simulationState?.id}/start`,
        {}
      );

      if (response.success && response.data) {
        setSimulationState(response.data.data);
        toast.show({
          type: ToastType.SUCCESS,
          message: 'Simulation started successfully'
        });
      } else {
        throw new Error(response.error?.message || 'Failed to start simulation');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error starting simulation';
      setError(message);
      toast.show({
        type: ToastType.ERROR,
        message
      });
    } finally {
      setLoading(false);
    }
  }, [simulationState?.id, toast]);

  /**
   * Stops the simulation
   * Requirement: Simulation Engine - State management in frontend
   */
  const stopSimulation = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.post<SimulationResponse<SimulationState>>(
        `/simulations/${simulationState?.id}/stop`,
        {}
      );

      if (response.success && response.data) {
        setSimulationState(response.data.data);
        toast.show({
          type: ToastType.SUCCESS,
          message: 'Simulation stopped successfully'
        });
      } else {
        throw new Error(response.error?.message || 'Failed to stop simulation');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error stopping simulation';
      setError(message);
      toast.show({
        type: ToastType.ERROR,
        message
      });
    } finally {
      setLoading(false);
    }
  }, [simulationState?.id, toast]);

  /**
   * Resets the simulation state
   * Requirement: Simulation Engine - Handles ecosystem game logic
   */
  const resetSimulation = useCallback(() => {
    setSimulationState(null);
    setSimulationResult(null);
    setError(null);
    toast.show({
      type: ToastType.INFO,
      message: 'Simulation reset'
    });
  }, [toast]);

  // Set up polling for active simulations
  useEffect(() => {
    let pollInterval: NodeJS.Timeout | null = null;

    if (
      simulationState?.status === SimulationStatus.RUNNING &&
      simulationState?.id
    ) {
      pollInterval = setInterval(fetchSimulationState, POLLING_INTERVAL);
    }

    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [simulationState?.status, simulationState?.id, fetchSimulationState]);

  return {
    simulationState,
    simulationResult,
    loading,
    error,
    addSpecies,
    removeSpecies,
    updateEnvironment,
    startSimulation,
    stopSimulation,
    resetSimulation
  };
};
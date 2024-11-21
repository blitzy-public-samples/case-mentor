/**
 * Human Tasks:
 * 1. Verify API endpoints are properly configured for simulation engine
 * 2. Test WebSocket connection settings for real-time updates
 * 3. Configure proper error tracking for simulation failures
 * 4. Validate environment parameter ranges with domain experts
 * 5. Set up monitoring for simulation performance metrics
 */

// Third-party imports
import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react'; // ^18.0.0
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
import { useToast, ToastType } from '../hooks/useToast';

// Requirement: Simulation Engine - Handles ecosystem game logic and state management
interface SimulationContextValue {
  simulationState: SimulationState | null;
  simulationResult: SimulationResult | null;
  addSpecies: (species: Species) => Promise<void>;
  removeSpecies: (speciesId: string) => void;
  updateEnvironment: (params: EnvironmentParameters) => Promise<void>;
  startSimulation: () => Promise<void>;
  stopSimulation: () => void;
  resetSimulation: () => void;
}

// Create context with undefined default value
const SimulationContext = createContext<SimulationContextValue | undefined>(undefined);

// Props interface for the provider component
interface SimulationProviderProps {
  children: ReactNode;
}

/**
 * SimulationProvider component that manages global state and business logic for the McKinsey ecosystem simulation game.
 * Requirement: McKinsey Simulation - Ecosystem game replication with time-pressured scenarios
 */
export function SimulationProvider({ children }: SimulationProviderProps) {
  // Initialize state
  const [simulationState, setSimulationState] = useState<SimulationState | null>(null);
  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null);
  
  // Initialize toast notifications
  const toast = useToast();

  /**
   * Validates and adds a new species to the simulation
   * Requirement: McKinsey Simulation - Complex data analysis
   */
  const addSpecies = useCallback(async (species: Species) => {
    try {
      // Validate species data using Zod schema
      await SimulationValidation.speciesSchema.parseAsync(species);

      // Check if maximum species limit is reached
      if (simulationState?.species.length === 10) {
        throw new Error('Maximum species limit reached');
      }

      const response = await api.post<SimulationResponse<SimulationState>>('/api/simulation/species', {
        species,
        simulationId: simulationState?.id
      });

      if (!response.success || !response.data) {
        throw new Error(response.error?.message || 'Failed to add species');
      }

      setSimulationState(response.data.data);
      toast.show({
        type: ToastType.SUCCESS,
        message: `Added species: ${species.name}`
      });
    } catch (error) {
      toast.show({
        type: ToastType.ERROR,
        message: error instanceof Error ? error.message : 'Failed to add species'
      });
      throw error;
    }
  }, [simulationState, toast]);

  /**
   * Removes a species from the simulation
   * Requirement: Simulation Engine - State management in frontend
   */
  const removeSpecies = useCallback((speciesId: string) => {
    if (!simulationState) return;

    setSimulationState(prev => {
      if (!prev) return null;
      return {
        ...prev,
        species: prev.species.filter(s => s.id !== speciesId)
      };
    });

    toast.show({
      type: ToastType.INFO,
      message: 'Species removed from simulation'
    });
  }, [simulationState, toast]);

  /**
   * Updates environment parameters for the simulation
   * Requirement: Simulation Engine - Handles ecosystem game logic
   */
  const updateEnvironment = useCallback(async (params: EnvironmentParameters) => {
    try {
      // Validate environment parameters
      await SimulationValidation.environmentSchema.parseAsync(params);

      const response = await api.post<SimulationResponse<SimulationState>>('/api/simulation/environment', {
        params,
        simulationId: simulationState?.id
      });

      if (!response.success || !response.data) {
        throw new Error(response.error?.message || 'Failed to update environment');
      }

      setSimulationState(response.data.data);
      toast.show({
        type: ToastType.SUCCESS,
        message: 'Environment parameters updated'
      });
    } catch (error) {
      toast.show({
        type: ToastType.ERROR,
        message: error instanceof Error ? error.message : 'Failed to update environment'
      });
      throw error;
    }
  }, [simulationState, toast]);

  /**
   * Starts the simulation with current parameters
   * Requirement: McKinsey Simulation - Time-pressured scenarios
   */
  const startSimulation = useCallback(async () => {
    try {
      // Validate minimum requirements
      if (!simulationState || simulationState.species.length < 3) {
        throw new Error('Minimum 3 species required to start simulation');
      }

      const response = await api.post<SimulationResponse<SimulationState>>('/api/simulation/start', {
        simulationId: simulationState.id
      });

      if (!response.success || !response.data) {
        throw new Error(response.error?.message || 'Failed to start simulation');
      }

      setSimulationState(response.data.data);
      toast.show({
        type: ToastType.SUCCESS,
        message: 'Simulation started'
      });
    } catch (error) {
      toast.show({
        type: ToastType.ERROR,
        message: error instanceof Error ? error.message : 'Failed to start simulation'
      });
      throw error;
    }
  }, [simulationState, toast]);

  /**
   * Stops the current simulation
   * Requirement: Simulation Engine - State management in frontend
   */
  const stopSimulation = useCallback(() => {
    if (!simulationState) return;

    setSimulationState(prev => {
      if (!prev) return null;
      return {
        ...prev,
        status: SimulationStatus.COMPLETED
      };
    });

    toast.show({
      type: ToastType.INFO,
      message: 'Simulation stopped'
    });
  }, [simulationState, toast]);

  /**
   * Resets the simulation state
   * Requirement: Simulation Engine - State management in frontend
   */
  const resetSimulation = useCallback(() => {
    setSimulationState(null);
    setSimulationResult(null);
    toast.show({
      type: ToastType.INFO,
      message: 'Simulation reset'
    });
  }, [toast]);

  // Context value
  const value: SimulationContextValue = {
    simulationState,
    simulationResult,
    addSpecies,
    removeSpecies,
    updateEnvironment,
    startSimulation,
    stopSimulation,
    resetSimulation
  };

  return (
    <SimulationContext.Provider value={value}>
      {children}
    </SimulationContext.Provider>
  );
}

/**
 * Custom hook to access simulation context with type safety
 * Requirement: Simulation Engine - Handles ecosystem game logic
 */
export function useSimulationContext() {
  const context = useContext(SimulationContext);
  if (context === undefined) {
    throw new Error('useSimulationContext must be used within a SimulationProvider');
  }
  return context;
}
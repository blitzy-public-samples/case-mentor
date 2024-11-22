// @ts-check
import { z } from 'zod'; // ^3.22.0
import { 
  EcosystemSimulation
} from '../lib/simulation/ecosystem';
import { SimulationEvaluator } from '../lib/simulation/evaluator';
import { SimulationAttempt } from '../models/SimulationAttempt';
import {
  SimulationExecutionContext,
  Species,
  EnvironmentParameters,
  SimulationState,
  SimulationResult
} from '../lib/simulation/types';
import { APIError } from '../lib/errors/APIError';
import { APIErrorCode } from '../types/api';
import { SimulationStatus, SpeciesType } from '../types/simulation';

/**
 * Human Tasks:
 * 1. Configure monitoring for simulation performance metrics
 * 2. Set up alerts for failed simulation attempts
 * 3. Review and adjust simulation time limits based on user feedback
 * 4. Implement backup mechanism for simulation state persistence
 */

/**
 * Service class implementing McKinsey ecosystem simulation game business logic
 * Addresses requirement: McKinsey Simulation - Ecosystem game replication
 */
export class SimulationService {
  private simulation: EcosystemSimulation | null;
  private evaluator: SimulationEvaluator;
  private currentAttempt: SimulationAttempt | null;

  constructor() {
    this.simulation = null;
    this.evaluator = new SimulationEvaluator({
      userId: '',
      timeLimit: 600000, // 10 minutes default
      config: {}
    });
    this.currentAttempt = null;
  }

  /**
   * Retrieves the current state of a simulation by its ID
   * Addresses requirement: Simulation Components - Real-time state management
   */
  public async getState(simulationId: string): Promise<SimulationState> {
    if (!this.simulation || !this.currentAttempt) {
      throw new APIError(
        APIErrorCode.NOT_FOUND,
        'Simulation not found'
      );
    }

    const currentState = {
      id: this.currentAttempt.getId(),
      userId: this.currentAttempt.getUserId(),
      species: this.currentAttempt.getSpecies(),
      environment: this.currentAttempt.getEnvironment(),
      timeRemaining: this.currentAttempt.getTimeRemaining(),
      status: this.currentAttempt.getStatus()
    };

    if (currentState.id !== simulationId) {
      throw new APIError(
        APIErrorCode.NOT_FOUND,
        'Simulation ID mismatch'
      );
    }

    return currentState;
  }

  /**
   * Starts a new simulation attempt for a user
   * Addresses requirement: McKinsey Simulation - Time-pressured scenarios
   */
  public async startSimulation(
    userId: string,
    context: SimulationExecutionContext
  ): Promise<SimulationAttempt> {
    // Validate user ID and context
    const validatedContext = z.object({
      userId: z.string().uuid(),
      timeLimit: z.number().positive(),
      config: z.record(z.any())
    }).parse({ ...context, userId });

    // Initialize simulation instance
    this.simulation = new EcosystemSimulation(validatedContext);

    // Create initial simulation state
    const initialState: SimulationState = {
      id: crypto.randomUUID(),
      userId: validatedContext.userId,
      species: [],
      environment: {
        temperature: 20,
        depth: 0,
        salinity: 35,
        lightLevel: 100
      },
      timeRemaining: validatedContext.timeLimit,
      status: SimulationStatus.SETUP
    };

    // Create and save new attempt
    this.currentAttempt = new SimulationAttempt(initialState);
    await this.currentAttempt.save();

    return this.currentAttempt;
  }

  /**
   * Updates species selection for current simulation
   * Addresses requirement: Simulation Engine - Handles ecosystem game logic
   */
  public async updateSpecies(
    attemptId: string,
    species: Species[]
  ): Promise<SimulationState> {
    if (!this.simulation || !this.currentAttempt) {
      throw new APIError(
        APIErrorCode.INTERNAL_ERROR,
        'No active simulation found'
      );
    }

    // Validate species configuration
    const validatedSpecies = z.array(z.object({
      id: z.string(),
      name: z.string(),
      type: z.nativeEnum(SpeciesType),
      energyRequirement: z.number(),
      reproductionRate: z.number()
    })).parse(species);

    // Initialize ecosystem with species
    const ecosystemState = await this.simulation.initializeEcosystem(
      validatedSpecies,
      this.currentAttempt.getEnvironment()
    );

    // Update attempt state
    await this.currentAttempt.updateState({
      species: validatedSpecies,
      status: SimulationStatus.RUNNING
    });

    return {
      id: this.currentAttempt.getId(),
      userId: this.currentAttempt.getUserId(),
      species: this.currentAttempt.getSpecies(),
      environment: this.currentAttempt.getEnvironment(),
      timeRemaining: this.currentAttempt.getTimeRemaining(),
      status: this.currentAttempt.getStatus()
    };
  }

  /**
   * Updates environmental parameters for current simulation
   * Addresses requirement: McKinsey Simulation - Complex data analysis
   */
  public async updateEnvironment(
    attemptId: string,
    environment: EnvironmentParameters
  ): Promise<SimulationState> {
    if (!this.simulation || !this.currentAttempt) {
      throw new APIError(
        APIErrorCode.INTERNAL_ERROR,
        'No active simulation found'
      );
    }

    // Validate environment parameters
    const validatedEnvironment = z.object({
      temperature: z.number().min(-10).max(40),
      depth: z.number().min(0).max(1000),
      salinity: z.number().min(0).max(50),
      lightLevel: z.number().min(0).max(100)
    }).parse(environment);

    // Initialize ecosystem with new environment
    const ecosystemState = await this.simulation.initializeEcosystem(
      this.currentAttempt.getSpecies(),
      validatedEnvironment
    );

    // Update attempt state
    await this.currentAttempt.updateState({
      environment: validatedEnvironment
    });

    return {
      id: this.currentAttempt.getId(),
      userId: this.currentAttempt.getUserId(),
      species: this.currentAttempt.getSpecies(),
      environment: this.currentAttempt.getEnvironment(),
      timeRemaining: this.currentAttempt.getTimeRemaining(),
      status: this.currentAttempt.getStatus()
    };
  }

  /**
   * Executes a single time step in the simulation
   * Addresses requirement: McKinsey Simulation - Time-pressured scenarios
   */
  public async executeTimeStep(attemptId: string): Promise<SimulationState> {
    if (!this.simulation || !this.currentAttempt) {
      throw new APIError(
        APIErrorCode.INTERNAL_ERROR,
        'No active simulation found'
      );
    }

    const currentState = {
      id: this.currentAttempt.getId(),
      userId: this.currentAttempt.getUserId(),
      species: this.currentAttempt.getSpecies(),
      environment: this.currentAttempt.getEnvironment(),
      timeRemaining: this.currentAttempt.getTimeRemaining(),
      status: this.currentAttempt.getStatus()
    };

    // Validate simulation is active
    if (currentState.status !== SimulationStatus.RUNNING) {
      throw new APIError(
        APIErrorCode.INTERNAL_ERROR,
        'Simulation is not in running state'
      );
    }

    // Execute simulation step
    await this.simulation.simulateTimeStep();

    // Update time remaining
    const timeRemaining = Math.max(0, currentState.timeRemaining - 1000);

    // Update attempt state
    await this.currentAttempt.updateState({
      timeRemaining,
      status: timeRemaining > 0 ? SimulationStatus.RUNNING : SimulationStatus.COMPLETED
    });

    return {
      id: this.currentAttempt.getId(),
      userId: this.currentAttempt.getUserId(),
      species: this.currentAttempt.getSpecies(),
      environment: this.currentAttempt.getEnvironment(),
      timeRemaining: this.currentAttempt.getTimeRemaining(),
      status: this.currentAttempt.getStatus()
    };
  }

  /**
   * Completes the simulation and generates final results
   * Addresses requirement: McKinsey Simulation - Complex data analysis
   */
  public async completeSimulation(attemptId: string): Promise<SimulationResult> {
    if (!this.simulation || !this.currentAttempt) {
      throw new APIError(
        APIErrorCode.INTERNAL_ERROR,
        'No active simulation found'
      );
    }

    const currentState = {
      id: this.currentAttempt.getId(),
      userId: this.currentAttempt.getUserId(),
      species: this.currentAttempt.getSpecies(),
      environment: this.currentAttempt.getEnvironment(),
      timeRemaining: this.currentAttempt.getTimeRemaining(),
      status: this.currentAttempt.getStatus()
    };

    // Validate simulation can be completed
    if (currentState.status === SimulationStatus.COMPLETED) {
      throw new APIError(
        APIErrorCode.INTERNAL_ERROR,
        'Simulation is already completed'
      );
    }

    // Generate final simulation results
    const simulationResult = await this.simulation.getSimulationResult();

    // Evaluate simulation performance
    const evaluationResult = await this.evaluator.evaluateAttempt(
      this.currentAttempt,
      {
        speciesDiversity: simulationResult.speciesBalance,
        trophicEfficiency: simulationResult.ecosystemStability,
        environmentalStress: 100 - simulationResult.score,
        stabilityHistory: []
      }
    );

    // Complete the attempt with results
    await this.currentAttempt.complete(evaluationResult);

    // Reset service state
    this.simulation = null;
    this.currentAttempt = null;

    return evaluationResult;
  }
}
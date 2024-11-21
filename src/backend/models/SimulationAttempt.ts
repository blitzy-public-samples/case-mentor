// @ts-check

import { z } from 'zod'; // ^3.22.0
import { createClient } from '@supabase/supabase-js'; // ^2.38.0
import { 
  SimulationState, 
  SimulationStatus, 
  SimulationResult,
  SimulationStateSchema,
  SimulationResultSchema,
  Species,
  EnvironmentParameters
} from '../types/simulation';
import { executeQuery, withTransaction } from '../utils/database';

/**
 * Human Tasks:
 * 1. Ensure database tables and indexes are created for simulation_attempts and simulation_results
 * 2. Configure appropriate database triggers for timestamp updates
 * 3. Set up monitoring for long-running simulations
 * 4. Review and adjust transaction isolation levels if needed
 * 5. Configure backup strategy for simulation data
 */

/**
 * Model class representing a McKinsey ecosystem simulation attempt
 * Addresses requirement: McKinsey Simulation - Ecosystem game replication with time-pressured scenarios
 */
export class SimulationAttempt {
  private id: string;
  private userId: string;
  private species: Species[];
  private environment: EnvironmentParameters;
  private timeRemaining: number;
  private status: SimulationStatus;
  private createdAt: Date;
  private updatedAt: Date;

  /**
   * Creates a new simulation attempt instance with validated state
   * Addresses requirement: Simulation Components - Real-time state management
   */
  constructor(state: SimulationState) {
    // Validate input state using zod schema
    const validatedState = SimulationStateSchema.parse(state);

    // Initialize instance properties
    this.id = validatedState.id;
    this.userId = validatedState.userId;
    this.species = validatedState.species;
    this.environment = validatedState.environment;
    this.timeRemaining = validatedState.timeRemaining;
    this.status = SimulationStatus.SETUP;
    this.createdAt = new Date();
    this.updatedAt = new Date();

    // Additional validation for species array and environment
    if (this.species.length === 0) {
      throw new Error('Simulation must include at least one species');
    }
    if (this.timeRemaining <= 0) {
      throw new Error('Simulation must have positive time remaining');
    }
  }

  /**
   * Persists the simulation attempt to the database using transaction
   * Addresses requirement: Simulation Components - State management with database integration
   */
  async save(): Promise<SimulationAttempt> {
    // Validate current simulation state before saving
    const currentState: SimulationState = {
      id: this.id,
      userId: this.userId,
      species: this.species,
      environment: this.environment,
      timeRemaining: this.timeRemaining,
      status: this.status
    };
    SimulationStateSchema.parse(currentState);

    // Execute database transaction
    await withTransaction(async () => {
      const query = `
        INSERT INTO simulation_attempts (
          id, user_id, species, environment, time_remaining, status, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (id) DO UPDATE SET
          species = EXCLUDED.species,
          environment = EXCLUDED.environment,
          time_remaining = EXCLUDED.time_remaining,
          status = EXCLUDED.status,
          updated_at = EXCLUDED.updated_at
        RETURNING *
      `;

      const params = [
        this.id,
        this.userId,
        JSON.stringify(this.species),
        JSON.stringify(this.environment),
        this.timeRemaining,
        this.status,
        this.createdAt.toISOString(),
        new Date().toISOString()
      ];

      await executeQuery(query, params);
    });

    // Update instance timestamp
    this.updatedAt = new Date();
    return this;
  }

  /**
   * Updates the simulation state with new values while maintaining consistency
   * Addresses requirement: McKinsey Simulation - Complex data analysis
   */
  async updateState(updates: Partial<SimulationState>): Promise<SimulationAttempt> {
    // Validate update payload
    const validatedUpdates = z.object({
      species: SimulationStateSchema.shape.species.optional(),
      environment: SimulationStateSchema.shape.environment.optional(),
      timeRemaining: SimulationStateSchema.shape.timeRemaining.optional(),
      status: SimulationStateSchema.shape.status.optional()
    }).parse(updates);

    // Merge updates with current state
    if (validatedUpdates.species) this.species = validatedUpdates.species;
    if (validatedUpdates.environment) this.environment = validatedUpdates.environment;
    if (validatedUpdates.timeRemaining !== undefined) this.timeRemaining = validatedUpdates.timeRemaining;
    if (validatedUpdates.status) this.status = validatedUpdates.status;

    // Update timestamp and save changes
    this.updatedAt = new Date();
    await this.save();

    return this;
  }

  /**
   * Marks the simulation as completed and stores final results
   * Addresses requirement: McKinsey Simulation - Time-pressured scenarios and complex data analysis
   */
  async complete(result: SimulationResult): Promise<SimulationResult> {
    // Validate simulation can be completed
    if (this.status === SimulationStatus.COMPLETED) {
      throw new Error('Simulation is already completed');
    }
    if (this.timeRemaining > 0) {
      throw new Error('Simulation time has not expired');
    }

    // Validate simulation results
    const validatedResult = SimulationResultSchema.parse({
      ...result,
      simulationId: this.id,
      completedAt: new Date().toISOString()
    });

    // Store results in database using transaction
    await withTransaction(async () => {
      // Update simulation status
      await this.updateState({ status: SimulationStatus.COMPLETED });

      // Store simulation results
      const query = `
        INSERT INTO simulation_results (
          simulation_id, score, ecosystem_stability, species_balance, feedback, completed_at
        ) VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `;

      const params = [
        validatedResult.simulationId,
        validatedResult.score,
        validatedResult.ecosystemStability,
        validatedResult.speciesBalance,
        JSON.stringify(validatedResult.feedback),
        validatedResult.completedAt
      ];

      await executeQuery(query, params);
    });

    return validatedResult;
  }
}
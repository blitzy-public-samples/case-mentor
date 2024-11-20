// @ts-check
import { z } from 'zod'; // ^3.22.0
import {
  Species,
  SpeciesType,
  EnvironmentParameters,
  SimulationState,
  SimulationStatus,
  SimulationResult
} from '../../types/simulation';
import {
  SimulationExecutionContext,
  SpeciesInteraction,
  InteractionType,
  EcosystemState,
  SimulationMetrics
} from './types';
import { APIError } from '../errors/APIError';

/**
 * Human Tasks:
 * 1. Ensure zod package is installed with correct version: npm install zod@^3.22.0
 * 2. Configure environment variables for simulation thresholds and limits
 * 3. Set up monitoring for simulation performance metrics
 * 4. Implement backup mechanism for simulation state persistence
 */

/**
 * Core implementation of the McKinsey ecosystem simulation game engine.
 * Addresses requirement: McKinsey Simulation - Ecosystem game replication
 */
export class EcosystemSimulation {
  private state: EcosystemState;
  private metrics: SimulationMetrics;
  private startTime: number;
  private readonly context: SimulationExecutionContext;

  // Simulation constants
  private static readonly MIN_SPECIES = 3;
  private static readonly MAX_SPECIES = 10;
  private static readonly MIN_STABILITY_SCORE = 0;
  private static readonly MAX_STABILITY_SCORE = 100;
  private static readonly INTERACTION_STRENGTH_THRESHOLD = 0.7;

  constructor(context: SimulationExecutionContext) {
    // Validate simulation context using zod schema
    const validatedContext = z.object({
      userId: z.string().uuid(),
      timeLimit: z.number().positive(),
      config: z.record(z.any())
    }).parse(context);

    // Initialize ecosystem state
    this.state = {
      species: [],
      environment: {
        temperature: 0,
        depth: 0,
        salinity: 0,
        lightLevel: 0
      },
      interactions: [],
      stabilityScore: 0,
      timestamp: Date.now()
    };

    // Initialize metrics tracking
    this.metrics = {
      speciesDiversity: 0,
      trophicEfficiency: 0,
      environmentalStress: 0,
      stabilityHistory: []
    };

    this.startTime = Date.now();
    this.context = validatedContext;
  }

  /**
   * Initializes the ecosystem with selected species and environmental parameters.
   * Addresses requirement: Simulation Engine - Handles ecosystem game logic
   */
  public async initializeEcosystem(
    selectedSpecies: Species[],
    environment: EnvironmentParameters
  ): Promise<EcosystemState> {
    // Validate species selection
    if (selectedSpecies.length < EcosystemSimulation.MIN_SPECIES ||
        selectedSpecies.length > EcosystemSimulation.MAX_SPECIES) {
      throw new APIError(
        'VALIDATION_ERROR',
        `Species count must be between ${EcosystemSimulation.MIN_SPECIES} and ${EcosystemSimulation.MAX_SPECIES}`
      );
    }

    // Validate environment parameters
    const validatedEnvironment = z.object({
      temperature: z.number().min(-10).max(40),
      depth: z.number().min(0).max(1000),
      salinity: z.number().min(0).max(50),
      lightLevel: z.number().min(0).max(100)
    }).parse(environment);

    // Calculate initial species interactions
    const interactions: SpeciesInteraction[] = [];
    for (const source of selectedSpecies) {
      for (const target of selectedSpecies) {
        if (source.id !== target.id) {
          const interaction = this.calculateSpeciesInteraction(source, target);
          interactions.push(interaction);
        }
      }
    }

    // Initialize ecosystem state
    this.state = {
      species: selectedSpecies,
      environment: validatedEnvironment,
      interactions,
      stabilityScore: this.calculateInitialStabilityScore(selectedSpecies, interactions),
      timestamp: Date.now()
    };

    // Initialize simulation metrics
    this.metrics = {
      speciesDiversity: this.calculateSpeciesDiversity(selectedSpecies),
      trophicEfficiency: this.calculateTrophicEfficiency(interactions),
      environmentalStress: this.calculateEnvironmentalStress(validatedEnvironment),
      stabilityHistory: [this.state.stabilityScore]
    };

    return this.state;
  }

  /**
   * Advances simulation by one time step.
   * Addresses requirement: McKinsey Simulation - Time-pressured scenarios
   */
  public async simulateTimeStep(): Promise<void> {
    // Check time limit
    if (Date.now() - this.startTime > this.context.timeLimit) {
      throw new APIError(
        'SIMULATION_ERROR',
        'Simulation time limit exceeded'
      );
    }

    // Update species populations based on interactions
    for (const species of this.state.species) {
      const speciesInteractions = this.state.interactions.filter(
        i => i.sourceSpecies === species.id || i.targetSpecies === species.id
      );
      
      const populationChange = this.calculatePopulationChange(
        species,
        speciesInteractions,
        this.state.environment
      );
      
      // Apply population changes with environmental effects
      species.energyRequirement = Math.max(
        0,
        species.energyRequirement + populationChange
      );
    }

    // Update stability metrics
    const newStabilityScore = this.calculateStabilityScore();
    this.metrics.stabilityHistory.push(newStabilityScore);
    this.state.stabilityScore = newStabilityScore;

    // Update simulation metrics
    this.metrics.speciesDiversity = this.calculateSpeciesDiversity(this.state.species);
    this.metrics.trophicEfficiency = this.calculateTrophicEfficiency(this.state.interactions);
    this.metrics.environmentalStress = this.calculateEnvironmentalStress(this.state.environment);

    // Update timestamp
    this.state.timestamp = Date.now();
  }

  /**
   * Calculates current ecosystem stability score.
   * Addresses requirement: McKinsey Simulation - Complex data analysis
   */
  public calculateStabilityScore(): number {
    const weights = {
      speciesDiversity: 0.3,
      trophicEfficiency: 0.3,
      environmentalStress: 0.2,
      interactionBalance: 0.2
    };

    const score = (
      weights.speciesDiversity * this.metrics.speciesDiversity +
      weights.trophicEfficiency * this.metrics.trophicEfficiency +
      (100 - weights.environmentalStress * this.metrics.environmentalStress) +
      weights.interactionBalance * this.calculateInteractionBalance()
    );

    return Math.min(
      EcosystemSimulation.MAX_STABILITY_SCORE,
      Math.max(EcosystemSimulation.MIN_STABILITY_SCORE, score)
    );
  }

  /**
   * Generates final simulation results and feedback.
   * Addresses requirement: McKinsey Simulation - Complex data analysis
   */
  public async getSimulationResult(): Promise<SimulationResult> {
    const stabilityScore = this.calculateStabilityScore();
    const feedback: string[] = [];

    // Generate feedback based on metrics
    if (this.metrics.speciesDiversity < 50) {
      feedback.push('Consider increasing species diversity for better ecosystem stability');
    }
    if (this.metrics.trophicEfficiency < 60) {
      feedback.push('Energy transfer between species could be more efficient');
    }
    if (this.metrics.environmentalStress > 70) {
      feedback.push('High environmental stress is affecting ecosystem stability');
    }

    return {
      simulationId: crypto.randomUUID(),
      score: stabilityScore,
      ecosystemStability: this.state.stabilityScore,
      speciesBalance: this.calculateSpeciesBalance(),
      feedback,
      completedAt: new Date().toISOString()
    };
  }

  // Private helper methods

  private calculateSpeciesInteraction(
    source: Species,
    target: Species
  ): SpeciesInteraction {
    let interactionType: InteractionType;
    let strength: number;

    if (source.type === SpeciesType.PRODUCER && target.type === SpeciesType.CONSUMER) {
      interactionType = InteractionType.PREDATION;
      strength = 0.8;
    } else if (source.type === target.type) {
      interactionType = InteractionType.COMPETITION;
      strength = 0.5;
    } else {
      interactionType = InteractionType.SYMBIOSIS;
      strength = 0.3;
    }

    return {
      sourceSpecies: source.id,
      targetSpecies: target.id,
      interactionType,
      strength
    };
  }

  private calculateSpeciesDiversity(species: Species[]): number {
    const producerCount = species.filter(s => s.type === SpeciesType.PRODUCER).length;
    const consumerCount = species.filter(s => s.type === SpeciesType.CONSUMER).length;
    return (producerCount * consumerCount / (species.length * species.length)) * 100;
  }

  private calculateTrophicEfficiency(interactions: SpeciesInteraction[]): number {
    const predationInteractions = interactions.filter(
      i => i.interactionType === InteractionType.PREDATION
    );
    return predationInteractions.reduce(
      (sum, i) => sum + i.strength,
      0
    ) / (predationInteractions.length || 1) * 100;
  }

  private calculateEnvironmentalStress(environment: EnvironmentParameters): number {
    const stressFactors = [
      Math.abs(environment.temperature - 20) / 30, // Optimal temperature is 20°C
      environment.depth / 1000,
      environment.salinity / 50,
      (100 - environment.lightLevel) / 100
    ];
    return (stressFactors.reduce((sum, factor) => sum + factor, 0) / stressFactors.length) * 100;
  }

  private calculateInteractionBalance(): number {
    const interactionStrengths = this.state.interactions.map(i => i.strength);
    const avgStrength = interactionStrengths.reduce((sum, s) => sum + s, 0) / interactionStrengths.length;
    const variance = interactionStrengths.reduce(
      (sum, s) => sum + Math.pow(s - avgStrength, 2),
      0
    ) / interactionStrengths.length;
    return (1 - Math.sqrt(variance)) * 100;
  }

  private calculatePopulationChange(
    species: Species,
    interactions: SpeciesInteraction[],
    environment: EnvironmentParameters
  ): number {
    const baseChange = species.reproductionRate * 0.1;
    const interactionEffect = interactions.reduce((sum, interaction) => {
      const isSource = interaction.sourceSpecies === species.id;
      const effect = isSource ? -interaction.strength : interaction.strength;
      return sum + effect * 0.05;
    }, 0);
    
    const environmentalEffect = this.calculateEnvironmentalEffect(species, environment);
    return baseChange + interactionEffect + environmentalEffect;
  }

  private calculateEnvironmentalEffect(
    species: Species,
    environment: EnvironmentParameters
  ): number {
    const temperatureEffect = -Math.abs(environment.temperature - 20) * 0.01;
    const depthEffect = species.type === SpeciesType.PRODUCER
      ? -environment.depth * 0.001
      : 0;
    const salinityEffect = -Math.abs(environment.salinity - 35) * 0.01;
    const lightEffect = species.type === SpeciesType.PRODUCER
      ? (environment.lightLevel - 50) * 0.01
      : 0;
    
    return temperatureEffect + depthEffect + salinityEffect + lightEffect;
  }

  private calculateSpeciesBalance(): number {
    const producerEnergy = this.state.species
      .filter(s => s.type === SpeciesType.PRODUCER)
      .reduce((sum, s) => sum + s.energyRequirement, 0);
    
    const consumerEnergy = this.state.species
      .filter(s => s.type === SpeciesType.CONSUMER)
      .reduce((sum, s) => sum + s.energyRequirement, 0);
    
    const totalEnergy = producerEnergy + consumerEnergy;
    const balance = Math.abs(producerEnergy - consumerEnergy) / (totalEnergy || 1);
    return (1 - balance) * 100;
  }
}
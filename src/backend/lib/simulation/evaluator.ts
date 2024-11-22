// @ts-check

import { z } from 'zod'; // ^3.22.0
import {
  SimulationExecutionContext,
  EcosystemState,
  SimulationMetrics,
  SimulationValidationError,
  SpeciesInteraction,
  InteractionType
} from './types';
import { OpenAIService } from '../openai';
import { SimulationAttempt } from '../../models/SimulationAttempt';
import { Species, EnvironmentParameters as Environment, SimulationResult } from '../../types/simulation';

/**
 * Human Tasks:
 * 1. Configure monitoring for stability evaluation performance
 * 2. Set up alerts for low stability scores across simulations
 * 3. Review and adjust stability thresholds based on user performance data
 * 4. Ensure OpenAI API rate limits are properly configured
 */

// Global constants from specification
const STABILITY_THRESHOLD = 0.75;
const MIN_SPECIES_DIVERSITY = 3;
const MAX_ENVIRONMENTAL_STRESS = 0.8;

/**
 * Evaluates the stability of the ecosystem based on species interactions and environmental factors
 * Addresses requirement: McKinsey Simulation - Complex data analysis
 */
export function evaluateEcosystemStability(state: EcosystemState): number {
  // Calculate species diversity score
  const diversityScore = state.species.length / MIN_SPECIES_DIVERSITY;
  
  // Evaluate trophic relationships
  const trophicScore = evaluateTrophicRelationships(state.interactions);
  
  // Assess environmental stress factors
  const environmentalScore = calculateEnvironmentalScore(state.environment);
  
  // Compute overall stability score
  const rawScore = (
    diversityScore * 0.3 +
    trophicScore * 0.4 +
    environmentalScore * 0.3
  );
  
  // Return normalized stability value between 0 and 1
  return Math.min(Math.max(rawScore, 0), 1);
}

/**
 * Validates the selected species configuration for ecological viability
 * Addresses requirement: McKinsey Simulation - Ecosystem game replication
 */
export async function validateSpeciesConfiguration(
  species: Species[],
  environment: Environment
): Promise<SimulationValidationError | null> {
  // Check minimum species diversity
  if (species.length < MIN_SPECIES_DIVERSITY) {
    return {
      code: 'INSUFFICIENT_DIVERSITY',
      message: `Minimum of ${MIN_SPECIES_DIVERSITY} species required`,
      details: { current: species.length, required: MIN_SPECIES_DIVERSITY }
    };
  }

  // Validate producer-consumer ratios
  const { producers, consumers } = species.reduce(
    (acc, species) => {
      species.type === 'PRODUCER' ? acc.producers++ : acc.consumers++;
      return acc;
    },
    { producers: 0, consumers: 0 }
  );

  if (producers === 0) {
    return {
      code: 'NO_PRODUCERS',
      message: 'Ecosystem must contain at least one producer species',
      details: { producers, consumers }
    };
  }

  // Verify environmental compatibility
  const stressLevel = calculateEnvironmentalStress(species, environment);
  if (stressLevel > MAX_ENVIRONMENTAL_STRESS) {
    return {
      code: 'HIGH_ENVIRONMENTAL_STRESS',
      message: 'Species configuration not compatible with environment',
      details: { stressLevel, maxAllowed: MAX_ENVIRONMENTAL_STRESS }
    };
  }

  return null;
}

/**
 * Generates detailed AI-powered feedback on simulation performance
 * Addresses requirement: AI Evaluation - Core Services
 */
export async function generateSimulationFeedback(
  metrics: SimulationMetrics,
  finalState: EcosystemState
): Promise<string> {
  const openAIService = new OpenAIService();

  // Analyze stability trends
  const stabilityTrend = analyzeStabilityTrend(metrics.stabilityHistory);
  
  // Identify critical interactions
  const criticalInteractions = identifyCriticalInteractions(finalState.interactions);
  
  // Generate feedback prompt
  const prompt = `
    Analyze the following ecosystem simulation results:
    - Species Diversity: ${metrics.speciesDiversity}
    - Trophic Efficiency: ${metrics.trophicEfficiency}
    - Environmental Stress: ${metrics.environmentalStress}
    - Stability Trend: ${stabilityTrend}
    - Critical Interactions: ${JSON.stringify(criticalInteractions)}
    
    Provide detailed feedback on:
    1. Ecosystem balance and stability
    2. Species interaction effectiveness
    3. Environmental adaptation
    4. Specific improvement suggestions
  `;

  // Get AI-generated feedback
  const response = await openAIService.sendRequest(prompt);
  
  return formatFeedback(response);
}

/**
 * Core evaluator class for assessing ecosystem simulation performance
 * Addresses requirement: McKinsey Simulation - Complex data analysis
 */
export class SimulationEvaluator {
  private readonly openAIService: OpenAIService;
  private readonly context: SimulationExecutionContext;

  constructor(context: SimulationExecutionContext) {
    this.openAIService = new OpenAIService();
    this.context = context;
  }

  /**
   * Evaluates a complete simulation attempt and generates comprehensive feedback
   */
  async evaluateAttempt(
    attempt: SimulationAttempt,
    metrics: SimulationMetrics
  ): Promise<SimulationResult> {
    // Get final ecosystem state
    const species = attempt.getSpecies();
    const environment = attempt.getEnvironment();
    const finalState: EcosystemState = {
      species,
      environment,
      interactions: [],
      stabilityScore: 0,
      timestamp: Date.now()
    };

    // Validate final ecosystem state
    const validationError = await validateSpeciesConfiguration(
      finalState.species,
      finalState.environment
    );

    if (validationError) {
      throw new Error(`Invalid final state: ${validationError.message}`);
    }

    // Calculate performance metrics
    const stabilityScore = evaluateEcosystemStability(finalState);
    const score = this.calculateScore(metrics, finalState);

    // Generate AI feedback
    const feedback = await generateSimulationFeedback(metrics, finalState);

    // Compile evaluation results
    const result: SimulationResult = {
      simulationId: this.context.userId,
      score,
      ecosystemStability: stabilityScore * 100,
      speciesBalance: calculateSpeciesBalance(finalState),
      feedback: [feedback],
      completedAt: new Date().toISOString()
    };

    // Update attempt record
    await attempt.complete(result);

    return result;
  }

  /**
   * Calculates the final score for a simulation attempt
   */
  calculateScore(metrics: SimulationMetrics, finalState: EcosystemState): number {
    // Weight stability metrics
    const stabilityWeight = 0.4;
    const stabilityScore = evaluateEcosystemStability(finalState);

    // Factor in species diversity
    const diversityWeight = 0.2;
    const diversityScore = metrics.speciesDiversity / 100;

    // Consider time efficiency
    const efficiencyWeight = 0.2;
    const efficiencyScore = metrics.trophicEfficiency / 100;

    // Apply complexity multiplier
    const complexityWeight = 0.2;
    const complexityScore = 1 - (metrics.environmentalStress / 100);

    // Calculate weighted score
    const weightedScore = (
      stabilityScore * stabilityWeight +
      diversityScore * diversityWeight +
      efficiencyScore * efficiencyWeight +
      complexityScore * complexityWeight
    );

    // Return normalized score between 0 and 100
    return Math.round(weightedScore * 100);
  }
}

// Helper functions

function evaluateTrophicRelationships(interactions: SpeciesInteraction[]): number {
  const interactionStrengths = interactions.map(i => i.strength);
  return interactionStrengths.reduce((sum, strength) => sum + strength, 0) / interactions.length;
}

function calculateEnvironmentalScore(environment: Environment): number {
  const { temperature, depth, salinity, lightLevel } = environment;
  const normalizedTemp = Math.abs(temperature - 20) / 40; // Optimal temp around 20°C
  const normalizedDepth = depth / 1000;
  const normalizedSalinity = salinity / 50;
  const normalizedLight = lightLevel / 100;
  
  return 1 - ((normalizedTemp + normalizedDepth + normalizedSalinity + (1 - normalizedLight)) / 4);
}

function calculateEnvironmentalStress(species: Species[], environment: Environment): number {
  return species.reduce((stress, species) => {
    const tempStress = Math.abs(environment.temperature - species.energyRequirement) / 40;
    const depthStress = Math.abs(environment.depth - species.reproductionRate) / 1000;
    return stress + (tempStress + depthStress) / 2;
  }, 0) / species.length;
}

function analyzeStabilityTrend(history: number[]): string {
  const trend = history.slice(-2);
  const delta = trend[1] - trend[0];
  if (delta > 0.1) return 'IMPROVING';
  if (delta < -0.1) return 'DECLINING';
  return 'STABLE';
}

function identifyCriticalInteractions(interactions: SpeciesInteraction[]): SpeciesInteraction[] {
  return interactions.filter(i => i.strength > 0.7 || i.strength < 0.3);
}

function calculateSpeciesBalance(state: EcosystemState): number {
  const { species, interactions } = state;
  const interactionBalance = interactions.reduce((sum, i) => sum + i.strength, 0) / interactions.length;
  const diversityFactor = species.length / MIN_SPECIES_DIVERSITY;
  return Math.min(interactionBalance * diversityFactor * 100, 100);
}

function formatFeedback(response: any): string {
  return response.choices[0].message.content.trim();
}
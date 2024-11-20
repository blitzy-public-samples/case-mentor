// @package jest ^29.0.0
// @package zod ^3.22.0
import { z } from 'zod';
import { 
  drillValidation, 
  simulationValidation, 
  userValidation 
} from '../../lib/validation';
import { DrillType, DrillDifficulty, DrillStatus } from '../../types/drills';
import { SpeciesType, SimulationStatus } from '../../types/simulation';
import { UserSubscriptionTier, UserSubscriptionStatus } from '../../types/user';

/**
 * Human Tasks:
 * 1. Configure Jest test environment with proper timezone settings
 * 2. Set up test database with sample validation data
 * 3. Configure test coverage thresholds in jest.config.js
 * 4. Implement proper cleanup of test data between test runs
 */

// Requirement: Input Validation (7.3.6 Security Controls)
describe('Drill Validation', () => {
  describe('validateDrillPrompt', () => {
    it('should validate valid drill prompt data', async () => {
      const validPrompt = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        type: DrillType.CASE_PROMPT,
        difficulty: DrillDifficulty.INTERMEDIATE,
        content: 'A technology company is experiencing rapid growth but facing scalability issues...',
        timeLimit: 1800,
        industry: 'Technology'
      };

      await expect(drillValidation.validateDrillPrompt(validPrompt)).resolves.toBe(true);
    });

    it('should reject invalid drill type', async () => {
      const invalidPrompt = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        type: 'INVALID_TYPE',
        difficulty: DrillDifficulty.INTERMEDIATE,
        content: 'Test content',
        timeLimit: 1800,
        industry: 'Technology'
      };

      await expect(drillValidation.validateDrillPrompt(invalidPrompt)).rejects.toThrow();
    });

    it('should reject invalid time limit', async () => {
      const invalidPrompt = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        type: DrillType.CASE_PROMPT,
        difficulty: DrillDifficulty.INTERMEDIATE,
        content: 'Test content',
        timeLimit: 0,
        industry: 'Technology'
      };

      await expect(drillValidation.validateDrillPrompt(invalidPrompt)).rejects.toThrow();
    });

    it('should reject empty content', async () => {
      const invalidPrompt = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        type: DrillType.CASE_PROMPT,
        difficulty: DrillDifficulty.INTERMEDIATE,
        content: '',
        timeLimit: 1800,
        industry: 'Technology'
      };

      await expect(drillValidation.validateDrillPrompt(invalidPrompt)).rejects.toThrow();
    });
  });

  describe('validateDrillResponse', () => {
    it('should validate valid drill response', async () => {
      const validResponse = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        userId: '123e4567-e89b-12d3-a456-426614174001',
        drillId: '123e4567-e89b-12d3-a456-426614174002',
        status: DrillStatus.COMPLETED,
        response: 'Detailed analysis of the case...',
        startedAt: new Date(),
        completedAt: new Date(),
        timeSpent: 1500
      };

      await expect(drillValidation.validateDrillResponse(validResponse, DrillType.CASE_PROMPT)).resolves.toBe(true);
    });

    it('should validate drill evaluation', async () => {
      const validEvaluation = {
        attemptId: '123e4567-e89b-12d3-a456-426614174000',
        score: 85,
        feedback: 'Strong analysis with clear recommendations',
        strengths: ['Clear problem structuring', 'Quantitative analysis'],
        improvements: ['Time management'],
        evaluatedAt: new Date()
      };

      await expect(drillValidation.validateDrillEvaluation(validEvaluation)).resolves.toBe(true);
    });
  });
});

// Requirement: Security Controls (8.3.3 Input Validation)
describe('Simulation Validation', () => {
  describe('validateSpecies', () => {
    it('should validate valid species configuration', async () => {
      const validSpecies = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Test Species',
        type: SpeciesType.PRODUCER,
        energyRequirement: 45,
        reproductionRate: 1.5
      };

      await expect(simulationValidation.validateSpecies(validSpecies)).resolves.toBe(true);
    });

    it('should reject invalid energy requirements', async () => {
      const invalidSpecies = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Test Species',
        type: SpeciesType.PRODUCER,
        energyRequirement: 150,
        reproductionRate: 1.5
      };

      await expect(simulationValidation.validateSpecies(invalidSpecies)).rejects.toThrow();
    });

    it('should validate environment parameters', async () => {
      const validEnvironment = {
        temperature: 25,
        depth: 100,
        salinity: 35,
        lightLevel: 80
      };

      await expect(simulationValidation.validateEnvironment(validEnvironment)).resolves.toBe(true);
    });

    it('should validate simulation state', async () => {
      const validState = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        userId: '123e4567-e89b-12d3-a456-426614174001',
        species: [],
        environment: {
          temperature: 25,
          depth: 100,
          salinity: 35,
          lightLevel: 80
        },
        timeRemaining: 300,
        status: SimulationStatus.RUNNING
      };

      await expect(simulationValidation.validateSimulationState(validState)).resolves.toBe(true);
    });
  });
});

// Requirement: Security Controls (8.3.3 Input Validation)
describe('User Validation', () => {
  describe('validateUserRegistration', () => {
    it('should validate valid registration data', async () => {
      const validRegistration = {
        email: 'test@example.com',
        password: 'Test123!@#',
        profile: {
          firstName: 'John',
          lastName: 'Doe',
          targetFirm: 'McKinsey',
          interviewDate: new Date(),
          preparationLevel: 'INTERMEDIATE'
        }
      };

      await expect(userValidation.validateUserRegistration(validRegistration)).resolves.toBe(true);
    });

    it('should reject invalid email format', async () => {
      const invalidRegistration = {
        email: 'invalid-email',
        password: 'Test123!@#',
        profile: {
          firstName: 'John',
          lastName: 'Doe',
          targetFirm: 'McKinsey',
          interviewDate: new Date(),
          preparationLevel: 'INTERMEDIATE'
        }
      };

      await expect(userValidation.validateUserRegistration(invalidRegistration)).rejects.toThrow();
    });

    it('should validate profile update', async () => {
      const validUpdate = {
        firstName: 'John',
        lastName: 'Doe',
        targetFirm: 'McKinsey',
        preparationLevel: 'ADVANCED'
      };

      await expect(userValidation.validateProfileUpdate(validUpdate)).resolves.toBe(true);
    });

    it('should validate subscription update', async () => {
      const validSubscription = {
        tier: UserSubscriptionTier.PREMIUM,
        status: UserSubscriptionStatus.ACTIVE,
        paymentInfo: {
          provider: 'stripe',
          token: 'tok_valid',
          last4: '4242',
          expiryMonth: 12,
          expiryYear: new Date().getFullYear() + 1
        }
      };

      await expect(userValidation.validateSubscriptionUpdate(validSubscription)).resolves.toBe(true);
    });
  });
});
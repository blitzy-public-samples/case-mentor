// @package zod ^3.22.0
// @package @supabase/supabase-js ^2.38.0

import { z } from 'zod';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  DrillType,
  DrillStatus,
  DrillPrompt,
  DrillAttempt,
  DrillEvaluation,
  DrillDifficulty,
  DrillResponse
} from '../types/drills';
import { DrillAttemptModel } from '../models/DrillAttempt';
import { evaluateDrillAttempt } from '../lib/drills/evaluator';

/**
 * Human Tasks:
 * 1. Configure Redis cache connection with proper credentials
 * 2. Set up monitoring for drill completion rates to track >80% target
 * 3. Configure alerts for API response times exceeding 200ms
 * 4. Review and adjust concurrent attempt limits based on usage patterns
 */

// Requirement: System Performance - Cache configuration
const DRILL_CACHE_TTL = 300; // 5 minutes

// Requirement: User Engagement - Concurrent attempt limits
const MAX_CONCURRENT_ATTEMPTS = 3;

/**
 * Core service class for managing drill operations
 * Requirement: Practice Drills - Service implementation
 */
export class DrillService {
  private db: SupabaseClient;
  private cache: any; // Redis client type

  constructor(db: SupabaseClient, cache: any) {
    this.db = db;
    this.cache = cache;
  }

  /**
   * Retrieves a drill by ID with caching
   * Requirement: System Performance - <200ms API response time
   */
  async getDrillById(drillId: string): Promise<DrillPrompt> {
    // Check cache first
    const cachedDrill = await this.cache.get(`drill:${drillId}`);
    if (cachedDrill) {
      return JSON.parse(cachedDrill);
    }

    // Fetch from database if not in cache
    const { data: drill, error } = await this.db
      .from('drills')
      .select('*')
      .eq('id', drillId)
      .single();

    if (error || !drill) {
      throw new Error(`Failed to fetch drill: ${error?.message || 'Not found'}`);
    }

    // Cache the result
    await this.cache.set(
      `drill:${drillId}`,
      JSON.stringify(drill),
      'EX',
      DRILL_CACHE_TTL
    );

    return drill;
  }

  /**
   * Lists available drills with filtering
   * Requirement: Practice Drills - Drill type and difficulty filtering
   */
  async listDrills(
    type?: DrillType,
    difficulty?: DrillDifficulty,
    filters: Record<string, any> = {}
  ): Promise<DrillPrompt[]> {
    let query = this.db.from('drills').select('*');

    // Apply filters
    if (type) {
      query = query.eq('type', type);
    }
    if (difficulty) {
      query = query.eq('difficulty', difficulty);
    }
    if (filters.industry) {
      query = query.eq('industry', filters.industry);
    }

    const { data: drills, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch drills: ${error.message}`);
    }

    return drills || [];
  }

  /**
   * Initiates a new drill attempt
   * Requirement: User Engagement - >80% completion rate tracking
   */
  async startDrillAttempt(userId: string, drillId: string): Promise<DrillAttempt> {
    // Check concurrent attempt limits
    const { count } = await this.db
      .from('drill_attempts')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .eq('status', DrillStatus.IN_PROGRESS);

    if ((count ?? 0) >= MAX_CONCURRENT_ATTEMPTS) {
      throw new Error(`Maximum concurrent attempts (${MAX_CONCURRENT_ATTEMPTS}) exceeded`);
    }

    // Validate drill exists
    const drill = await this.getDrillById(drillId);
    if (!drill) {
      throw new Error('Invalid drill ID');
    }

    // Create new attempt
    const attempt = new DrillAttemptModel({
      id: crypto.randomUUID(),
      userId,
      drillId,
      status: DrillStatus.NOT_STARTED,
      response: '',
      startedAt: new Date(),
      completedAt: null,
      timeSpent: 0
    });

    await attempt.save();
    return attempt;
  }

  /**
   * Submits and evaluates a drill response
   * Requirement: Practice Drills - AI-powered evaluation
   */
  async submitDrillResponse(
    attemptId: string,
    response: string
  ): Promise<DrillEvaluation> {
    // Retrieve attempt
    const { data: attempt, error } = await this.db
      .from('drill_attempts')
      .select('*')
      .eq('id', attemptId)
      .single();

    if (error || !attempt) {
      throw new Error(`Failed to fetch attempt: ${error?.message || 'Not found'}`);
    }

    // Validate attempt status
    if (attempt.status !== DrillStatus.IN_PROGRESS) {
      throw new Error('Invalid attempt status for submission');
    }

    // Create attempt model and complete
    const attemptModel = new DrillAttemptModel(attempt);
    await attemptModel.complete(response);

    // Evaluate response
    const drill = await this.getDrillById(attempt.drillId);
    const evaluationResult = await evaluateDrillAttempt(
      drill.type,
      response,
      drill.type,
      {
        drillType: drill.type,
        rubric: {
          criteria: ['Structure', 'Content', 'Analysis'],
          scoringGuide: {
            Structure: 'Clear and logical flow',
            Content: 'Comprehensive coverage',
            Analysis: 'Deep insights'
          },
          maxScore: 100
        },
        weights: {
          Structure: 0.3,
          Content: 0.4,
          Analysis: 0.3
        }
      }
    );

    // Extract the evaluation from the result
    const evaluation: DrillEvaluation = {
      attemptId,
      score: evaluationResult.evaluation.score,
      feedback: evaluationResult.evaluation.feedback,
      strengths: evaluationResult.evaluation.strengths,
      improvements: evaluationResult.evaluation.improvements,
      evaluatedAt: new Date()
    };

    // Process evaluation results
    await this.processDrillEvaluation(attemptId, evaluation);

    return evaluation;
  }

  /**
   * Retrieves drill attempt history for a user
   * Requirement: User Engagement - Progress tracking
   */
  async getUserDrillHistory(
    userId: string,
    filters: Record<string, any> = {}
  ): Promise<DrillAttempt[]> {
    let query = this.db
      .from('drill_attempts')
      .select('*, drills(*)')
      .eq('user_id', userId);

    // Apply filters
    if (filters.startDate) {
      query = query.gte('created_at', filters.startDate);
    }
    if (filters.endDate) {
      query = query.lte('created_at', filters.endDate);
    }
    if (filters.type) {
      query = query.eq('drills.type', filters.type);
    }

    const { data: attempts, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch drill history: ${error.message}`);
    }

    return attempts || [];
  }

  /**
   * Validates user access to drill content
   * Requirement: Practice Drills - Access control
   */
  private async validateDrillAccess(
    userId: string,
    drillId: string
  ): Promise<boolean> {
    // Check subscription status
    const { data: subscription } = await this.db
      .from('subscriptions')
      .select('status')
      .eq('user_id', userId)
      .single();

    if (!subscription || subscription.status !== 'active') {
      return false;
    }

    // Verify attempt limits
    const { count } = await this.db
      .from('drill_attempts')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .eq('drill_id', drillId);

    return (count ?? 0) < MAX_CONCURRENT_ATTEMPTS;
  }

  /**
   * Processes and stores drill evaluation results
   * Requirement: Practice Drills - Evaluation processing
   */
  private async processDrillEvaluation(
    attemptId: string,
    evaluation: DrillEvaluation
  ): Promise<void> {
    // Validate evaluation data
    const validationResult = z.object({
      score: z.number().min(0).max(100),
      feedback: z.string(),
      strengths: z.array(z.string()),
      improvements: z.array(z.string()),
      evaluatedAt: z.date()
    }).safeParse(evaluation);

    if (!validationResult.success) {
      throw new Error('Invalid evaluation data format');
    }

    // Store evaluation results
    const { error } = await this.db
      .from('drill_evaluations')
      .insert({
        attempt_id: attemptId,
        ...evaluation,
        created_at: new Date()
      });

    if (error) {
      throw new Error(`Failed to store evaluation: ${error.message}`);
    }

    // Update user progress metrics
    await this.db.rpc('update_user_progress_metrics', {
      p_user_id: attemptId,
      p_evaluation: evaluation
    });
  }
}
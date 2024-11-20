// @package zod ^3.22.0
// @package @supabase/supabase-js ^2.38.0

import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';

import { 
  DrillType, 
  DrillStatus, 
  DrillAttempt, 
  DrillEvaluation,
  DrillAttemptSchema 
} from '../../types/drills';

import {
  DrillResult,
  DrillMetrics
} from '../../lib/drills/types';

import { evaluateDrillAttempt } from '../../lib/drills/evaluator';

/**
 * Human Tasks:
 * 1. Configure Supabase connection with proper credentials in environment variables
 * 2. Set up appropriate database indexes on drill_attempts table for userId and drillId
 * 3. Configure monitoring for drill completion rates to track >80% target
 * 4. Review and adjust MAX_RESPONSE_LENGTH based on actual usage patterns
 */

// Requirement: Practice Drills - Response length validation
const MAX_RESPONSE_LENGTH = 8000;

// Requirement: Practice Drills - Database table name
const DRILL_ATTEMPT_TABLE = 'drill_attempts';

/**
 * Requirement: Practice Drills - Model class for managing drill attempts
 */
export class DrillAttemptModel implements DrillAttempt {
  id: string;
  userId: string;
  drillId: string;
  status: DrillStatus;
  response: string;
  startedAt: Date;
  completedAt: Date | null;
  timeSpent: number;
  evaluation: DrillEvaluation | null;

  constructor(data: DrillAttempt) {
    // Validate input data using Zod schema
    const validatedData = DrillAttemptSchema.parse(data);

    // Initialize instance properties
    this.id = validatedData.id;
    this.userId = validatedData.userId;
    this.drillId = validatedData.drillId;
    this.status = validatedData.status || DrillStatus.NOT_STARTED;
    this.response = validatedData.response;
    this.startedAt = validatedData.startedAt || new Date();
    this.completedAt = validatedData.completedAt;
    this.timeSpent = validatedData.timeSpent;
    this.evaluation = null;
  }

  /**
   * Requirement: Practice Drills - Validates drill attempt response
   */
  private validateResponse(response: string): boolean {
    if (!response || response.trim().length === 0) {
      return false;
    }

    if (response.length > MAX_RESPONSE_LENGTH) {
      return false;
    }

    // Basic content validation
    const hasStructure = response.includes('\n');
    const hasContent = response.split(' ').length >= 5;
    
    return hasStructure && hasContent;
  }

  /**
   * Requirement: Practice Drills - Saves drill attempt to database
   */
  async save(): Promise<DrillAttempt> {
    // Validate required fields
    if (!this.id || !this.userId || !this.drillId) {
      throw new Error('Missing required fields for drill attempt');
    }

    // Format data for database
    const drillData = {
      id: this.id,
      user_id: this.userId,
      drill_id: this.drillId,
      status: this.status,
      response: this.response,
      started_at: this.startedAt,
      completed_at: this.completedAt,
      time_spent: this.timeSpent,
      evaluation: this.evaluation
    };

    // Initialize Supabase client
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    );

    // Perform upsert operation
    const { data, error } = await supabase
      .from(DRILL_ATTEMPT_TABLE)
      .upsert(drillData)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to save drill attempt: ${error.message}`);
    }

    // Update instance with database fields
    this.startedAt = new Date(data.started_at);
    if (data.completed_at) {
      this.completedAt = new Date(data.completed_at);
    }
    this.evaluation = data.evaluation;

    return this;
  }

  /**
   * Requirement: Practice Drills - Completes drill attempt and triggers evaluation
   */
  async complete(response: string): Promise<DrillResult> {
    // Validate response
    if (!this.validateResponse(response)) {
      throw new Error(`Invalid response: Must be between 1 and ${MAX_RESPONSE_LENGTH} characters`);
    }

    // Update attempt status
    this.status = DrillStatus.COMPLETED;
    this.response = response;
    this.completedAt = new Date();
    this.timeSpent = Math.round(
      (this.completedAt.getTime() - this.startedAt.getTime()) / 1000
    );

    // Trigger AI evaluation
    const evaluationResult = await evaluateDrillAttempt(
      DrillType.CASE_PROMPT, // TODO: Get actual drill type from drill record
      this.response,
      this.response,
      {
        drillType: DrillType.CASE_PROMPT,
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

    // Update evaluation and save
    this.evaluation = evaluationResult.evaluation;
    await this.save();

    return evaluationResult;
  }

  /**
   * Requirement: Practice Drills - Calculates performance metrics
   */
  calculateMetrics(): DrillMetrics {
    // Calculate time-based metrics
    const timeSpentSeconds = this.timeSpent || 0;
    const expectedTime = 300; // 5 minutes default
    const speedScore = Math.min(100, Math.max(0, 
      100 - ((timeSpentSeconds / expectedTime - 1) * 50)
    ));

    // Calculate completeness
    const completeness = Math.min(100, 
      (this.response?.length || 0) / MAX_RESPONSE_LENGTH * 100
    );

    // Calculate accuracy from evaluation if available
    const accuracy = this.evaluation?.score || 0;

    return {
      timeSpent: timeSpentSeconds,
      completeness: Math.round(completeness),
      accuracy: Math.round(accuracy),
      speed: Math.round(speedScore)
    };
  }
}
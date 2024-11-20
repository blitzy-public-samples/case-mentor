// @ts-check

/**
 * Human Tasks:
 * 1. Verify feedback scoring algorithms with product team
 * 2. Ensure feedback categories align with assessment rubrics
 * 3. Configure proper date serialization format for feedback timestamps
 * 4. Set up monitoring for AI feedback generation response times
 * 5. Validate severity levels with UX team for proper visual indicators
 */

// Internal imports
import { APIResponse } from './api';
import { DrillType, DrillFeedback } from './drills';

// Requirement: AI Evaluation - Feedback type classification
export enum FeedbackType {
  AI_EVALUATION = 'AI_EVALUATION',
  SYSTEM_GENERATED = 'SYSTEM_GENERATED',
  PERFORMANCE_SUMMARY = 'PERFORMANCE_SUMMARY'
}

// Requirement: AI Evaluation - Skill-based feedback categorization
export enum FeedbackCategory {
  STRUCTURE = 'STRUCTURE',
  ANALYSIS = 'ANALYSIS',
  CALCULATION = 'CALCULATION',
  COMMUNICATION = 'COMMUNICATION',
  SYNTHESIS = 'SYNTHESIS'
}

// Requirement: AI Evaluation - Prioritization of feedback points
export enum FeedbackSeverity {
  CRITICAL = 'CRITICAL',
  IMPORTANT = 'IMPORTANT',
  SUGGESTION = 'SUGGESTION'
}

// Requirement: AI Evaluation - Structured feedback point with actionable suggestions
export interface FeedbackPoint {
  // Unique identifier for the feedback point
  id: string;
  // Skill category being evaluated
  category: FeedbackCategory;
  // Priority level of the feedback
  severity: FeedbackSeverity;
  // Detailed feedback message
  message: string;
  // Actionable improvement suggestion
  suggestion: string;
}

// Requirement: AI Evaluation - Comprehensive AI-generated feedback structure
export interface AIFeedback {
  // Unique identifier for the feedback session
  id: string;
  // Type of practice drill being evaluated
  drillType: DrillType;
  // Reference to the specific drill attempt
  attemptId: string;
  // Normalized score (0-100)
  overallScore: number;
  // Detailed feedback points with categorization
  feedbackPoints: FeedbackPoint[];
  // Identified positive aspects of performance
  strengths: string[];
  // Areas identified for improvement
  improvements: string[];
  // Timestamp of feedback generation
  createdAt: Date;
}

// Requirement: Progress Tracking - Historical performance aggregation
export interface FeedbackHistory {
  // User identifier for tracking
  userId: string;
  // Specific drill type being tracked
  drillType: DrillType;
  // Chronological list of feedback sessions
  feedbackList: AIFeedback[];
  // Calculated mean score across attempts
  averageScore: number;
  // Consistently identified strengths
  commonStrengths: string[];
  // Recurring improvement areas
  commonImprovements: string[];
}

// Requirement: AI Evaluation - API response wrapper for feedback endpoints
export type FeedbackResponse = APIResponse<AIFeedback>;
// @ts-check

// Internal imports
import { UserSubscriptionTier } from './user'; // Import from relative path

/**
 * Human Tasks:
 * 1. Ensure drill types align with backend API implementation
 * 2. Validate time limit ranges with product team
 * 3. Configure proper date serialization in API responses
 * 4. Set up TypeScript validation in CI pipeline for drill type safety
 * 5. Verify industry categories with business requirements
 */

// Requirement: Practice Drills - Type definitions for different drill categories
export enum DrillType {
  CASE_PROMPT = 'CASE_PROMPT',
  CALCULATION = 'CALCULATION',
  CASE_MATH = 'CASE_MATH',
  BRAINSTORMING = 'BRAINSTORMING',
  MARKET_SIZING = 'MARKET_SIZING',
  SYNTHESIZING = 'SYNTHESIZING'
}

// Requirement: Practice Drills - Progressive difficulty levels for skill development
export enum DrillDifficulty {
  BEGINNER = 'BEGINNER',
  INTERMEDIATE = 'INTERMEDIATE',
  ADVANCED = 'ADVANCED'
}

// Requirement: Practice Drills - Structured feedback for drill evaluation
export interface DrillFeedback {
  score: number;
  comments: string[];
  strengths: string[];
  improvements: string[];
}

// Requirement: Practice Drills - Comprehensive drill prompt structure with subscription-based access
export interface DrillPrompt {
  id: string;
  type: DrillType;
  difficulty: DrillDifficulty;
  title: string;
  description: string;
  timeLimit: number; // in minutes
  industry: string;
  requiredTier: UserSubscriptionTier;
}

// Requirement: User Management - Tracking and evaluating user's drill attempts
export interface DrillAttempt {
  id: string;
  promptId: string;
  userId: string;
  response: string;
  timeSpent: number; // in seconds
  score: number;
  feedback: DrillFeedback;
  createdAt: Date;
}

// Requirement: User Management - Progress tracking for specific drill types
export interface DrillProgress {
  drillType: DrillType;
  attemptsCount: number;
  averageScore: number;
  bestScore: number;
  lastAttemptDate: Date;
}

// Requirement: Practice Drills - API response wrapper for drill-related endpoints
export interface DrillResponse {
  success: boolean;
  data: DrillPrompt | DrillAttempt | DrillProgress | null;
  error: string | null;
}
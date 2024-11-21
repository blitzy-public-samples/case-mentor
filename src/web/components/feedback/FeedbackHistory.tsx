// react v18.0.0
import React from 'react';
// class-variance-authority v0.7.0
import { clsx } from 'clsx';
// lucide-react v0.284.0
import { TrendingUp, TrendingDown } from 'lucide-react';

// Internal imports
import FeedbackCard from './FeedbackCard';
import { FeedbackType, FeedbackCategory, FeedbackSeverity, AIFeedback, type FeedbackHistory } from '../../types/feedback';
import { useFeedback } from '../../hooks/useFeedback';
import { Card } from '../shared/Card';
import Loading from '../shared/Loading';

/**
 * Human Tasks:
 * 1. Verify color contrast ratios meet WCAG 2.1 AA standards
 * 2. Test timeline visualization responsiveness across screen sizes
 * 3. Validate screen reader compatibility for trend indicators
 * 4. Review performance metrics calculation with product team
 */

interface FeedbackHistoryProps {
  userId: string;
  drillType: string;
  className?: string;
}

// Requirement: Progress Tracking - Calculate performance trend from feedback history
const calculatePerformanceTrend = (history: FeedbackHistory): { trend: number; isPositive: boolean } => {
  if (!history.feedbackList.length || history.feedbackList.length < 2) {
    return { trend: 0, isPositive: true };
  }

  const recentScores = history.feedbackList
    .slice(-5) // Look at last 5 attempts
    .map(feedback => feedback.overallScore);

  const averageRecent = recentScores.reduce((a, b) => a + b, 0) / recentScores.length;
  const previousAverage = history.averageScore;

  const trend = ((averageRecent - previousAverage) / previousAverage) * 100;
  return {
    trend: Math.abs(Math.round(trend)),
    isPositive: trend >= 0
  };
};

// Requirement: Progress Tracking - Render performance trend visualization
const renderPerformanceTrend = (history: FeedbackHistory): JSX.Element => {
  const { trend, isPositive } = calculatePerformanceTrend(history);
  
  return (
    <Card className="p-4">
      <div 
        className="flex items-center space-x-4"
        role="region" 
        aria-label="Performance Trend"
      >
        <div className={clsx(
          "flex items-center space-x-2 text-lg font-semibold",
          isPositive ? "text-green-600" : "text-red-600"
        )}>
          {isPositive ? (
            <TrendingUp className="w-6 h-6" aria-hidden="true" />
          ) : (
            <TrendingDown className="w-6 h-6" aria-hidden="true" />
          )}
          <span>{trend}%</span>
        </div>
        <p className="text-gray-600">
          {isPositive ? "Improvement" : "Decline"} in recent performance
        </p>
      </div>
      <div className="mt-2">
        <p className="text-sm text-gray-500">
          Average Score: {Math.round(history.averageScore)}
        </p>
      </div>
    </Card>
  );
};

// Requirement: Progress Tracking - Render common patterns section
const renderCommonPatterns = (history: FeedbackHistory): JSX.Element => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
      {/* Strengths Section */}
      <Card className="p-4">
        <h3 className="text-lg font-semibold text-green-600 mb-3">
          Common Strengths
        </h3>
        <ul 
          className="space-y-2 list-disc list-inside"
          role="list"
          aria-label="Common strengths"
        >
          {history.commonStrengths.map((strength, index) => (
            <li key={index} className="text-gray-700">{strength}</li>
          ))}
        </ul>
      </Card>

      {/* Improvements Section */}
      <Card className="p-4">
        <h3 className="text-lg font-semibold text-yellow-600 mb-3">
          Areas for Improvement
        </h3>
        <ul 
          className="space-y-2 list-disc list-inside"
          role="list"
          aria-label="Areas for improvement"
        >
          {history.commonImprovements.map((improvement, index) => (
            <li key={index} className="text-gray-700">{improvement}</li>
          ))}
        </ul>
      </Card>
    </div>
  );
};

// Requirement: User Management - Main feedback history component
const FeedbackHistory: React.FC<FeedbackHistoryProps> = ({
  userId,
  drillType,
  className
}) => {
  const { history, isLoading } = useFeedback(drillType);

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <Loading size="lg" label="Loading feedback history..." />
      </div>
    );
  }

  if (!history) {
    return (
      <Card className={clsx("p-6 text-center text-gray-500", className)}>
        No feedback history available
      </Card>
    );
  }

  return (
    <div className={clsx("space-y-6", className)}>
      {/* Requirement: Progress Tracking - Performance trend section */}
      {renderPerformanceTrend(history)}

      {/* Requirement: Progress Tracking - Common patterns analysis */}
      {renderCommonPatterns(history)}

      {/* Requirement: Design System - Feedback timeline */}
      <div className="space-y-4 mt-6">
        <h3 className="text-lg font-semibold text-gray-800">
          Recent Feedback History
        </h3>
        <div 
          className="space-y-4"
          role="feed"
          aria-label="Feedback timeline"
        >
          {history.feedbackList.map((feedback) => (
            <FeedbackCard
              key={feedback.id}
              drillId={feedback.id}
              className="transition-all hover:shadow-md"
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default FeedbackHistory;
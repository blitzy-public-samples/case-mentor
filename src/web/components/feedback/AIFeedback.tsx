// react v18.0.0
import React, { useState, useCallback } from 'react';
// class-variance-authority v0.7.0
import { clsx } from 'class-variance-authority';

// Internal imports
import { 
  FeedbackCategory, 
  FeedbackSeverity, 
  AIFeedback as AIFeedbackType,
  FeedbackPoint 
} from '../../../types/feedback';
import Card from '../../shared/Card';
import { useFeedback } from '../../../hooks/useFeedback';

// Requirement: AI Evaluation - Component props interface
interface AIFeedbackProps {
  drillId: string;
  className?: string;
}

// Requirement: AI Evaluation - Display AI-powered feedback with categorized insights
const AIFeedback: React.FC<AIFeedbackProps> = ({ drillId, className }) => {
  const { feedback, isLoading, error } = useFeedback(drillId);
  const [expandedSections, setExpandedSections] = useState<Set<FeedbackCategory>>(new Set());

  // Toggle section expansion state
  const toggleSection = useCallback((category: FeedbackCategory) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  }, []);

  // Requirement: AI Evaluation - Render feedback point with severity indicator
  const renderFeedbackPoint = (point: FeedbackPoint) => {
    const severityStyles = {
      [FeedbackSeverity.CRITICAL]: 'bg-red-100 border-red-500 text-red-800',
      [FeedbackSeverity.IMPORTANT]: 'bg-amber-100 border-amber-500 text-amber-800',
      [FeedbackSeverity.SUGGESTION]: 'bg-blue-100 border-blue-500 text-blue-800'
    };

    return (
      <div
        key={point.id}
        className={clsx(
          'p-4 mb-3 rounded-lg border-l-4',
          severityStyles[point.severity]
        )}
        role="listitem"
        aria-label={`${point.severity.toLowerCase()} feedback point`}
      >
        <div className="flex items-start gap-2">
          {/* Severity icon */}
          <span 
            className="mt-1 shrink-0" 
            aria-hidden="true"
          >
            {point.severity === FeedbackSeverity.CRITICAL && '⚠️'}
            {point.severity === FeedbackSeverity.IMPORTANT && '❗'}
            {point.severity === FeedbackSeverity.SUGGESTION && '💡'}
          </span>
          
          <div className="flex-1">
            {/* Feedback message */}
            <p className="font-medium mb-2">
              {point.message}
            </p>
            
            {/* Improvement suggestion */}
            {point.suggestion && (
              <p className="text-sm opacity-90">
                Suggestion: {point.suggestion}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Requirement: Progress Tracking - Render score section with visual indicator
  const renderScoreSection = (score: number) => {
    const scoreColor = score >= 80 ? 'text-green-600' :
                      score >= 60 ? 'text-amber-600' :
                      'text-red-600';

    return (
      <div className="flex items-center justify-between p-6 border-b">
        <div>
          <h2 
            className="text-xl font-semibold mb-1"
            id="score-heading"
          >
            Overall Score
          </h2>
          <p className="text-gray-600">
            Based on your performance across all evaluation criteria
          </p>
        </div>
        
        <div 
          className={clsx(
            'flex items-center justify-center w-20 h-20',
            'rounded-full border-4',
            scoreColor,
            'font-bold text-2xl'
          )}
          role="meter"
          aria-labelledby="score-heading"
          aria-valuenow={score}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          {score}
        </div>
      </div>
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <Card className={clsx('animate-pulse', className)}>
        <div className="h-32 bg-gray-200 rounded" />
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card className={clsx('p-6 text-red-600', className)}>
        <p role="alert">Failed to load feedback: {error.message}</p>
      </Card>
    );
  }

  // No feedback available
  if (!feedback) {
    return (
      <Card className={clsx('p-6 text-gray-600', className)}>
        <p>No feedback available yet.</p>
      </Card>
    );
  }

  // Group feedback points by category
  const feedbackByCategory = feedback.feedbackPoints.reduce<Record<FeedbackCategory, FeedbackPoint[]>>((acc, point) => {
    if (!acc[point.category]) {
      acc[point.category] = [];
    }
    acc[point.category].push(point);
    return acc;
  }, {} as Record<FeedbackCategory, FeedbackPoint[]>);

  return (
    <div 
      className={clsx('space-y-6', className)}
      role="region"
      aria-label="AI Feedback"
    >
      {/* Score section */}
      <Card>
        {renderScoreSection(feedback.overallScore)}
      </Card>

      {/* Feedback points by category */}
      {Object.entries(feedbackByCategory).map(([category, points]) => (
        <Card key={category}>
          <button
            className="w-full p-6 text-left flex items-center justify-between"
            onClick={() => toggleSection(category as FeedbackCategory)}
            aria-expanded={expandedSections.has(category as FeedbackCategory)}
            aria-controls={`feedback-${category}`}
          >
            <h2 className="text-xl font-semibold">
              {category}
            </h2>
            <span className="text-2xl">
              {expandedSections.has(category as FeedbackCategory) ? '−' : '+'}
            </span>
          </button>

          {expandedSections.has(category as FeedbackCategory) && (
            <div 
              id={`feedback-${category}`}
              className="px-6 pb-6"
              role="list"
            >
              {points.map(renderFeedbackPoint)}
            </div>
          )}
        </Card>
      ))}

      {/* Strengths section */}
      <Card>
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">Key Strengths</h2>
          <ul className="list-disc pl-5 space-y-2">
            {feedback.strengths.map((strength: string, index: number) => (
              <li key={index} className="text-green-700">{strength}</li>
            ))}
          </ul>
        </div>
      </Card>

      {/* Areas for improvement section */}
      <Card>
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">Areas for Improvement</h2>
          <ul className="list-disc pl-5 space-y-2">
            {feedback.improvements.map((improvement: string, index: number) => (
              <li key={index} className="text-amber-700">{improvement}</li>
            ))}
          </ul>
        </div>
      </Card>
    </div>
  );
};

export default AIFeedback;
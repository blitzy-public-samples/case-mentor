// react v18.0.0
import React from 'react';
// class-variance-authority v0.7.0
import { clsx } from 'class-variance-authority';
// lucide-react v0.284.0
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';

// Internal imports
import { Card } from '../shared/Card';
import { FeedbackType, FeedbackCategory, FeedbackSeverity, AIFeedback } from '../../types/feedback';
import { useFeedback } from '../../hooks/useFeedback';

/**
 * Human Tasks:
 * 1. Verify color contrast ratios for severity indicators meet WCAG 2.1 AA standards
 * 2. Test feedback card layout responsiveness across different screen sizes
 * 3. Validate loading state animation performance on low-end devices
 * 4. Ensure proper ARIA labels are configured for screen readers
 */

interface FeedbackCardProps {
  drillId: string;
  className?: string;
}

// Requirement: AI Evaluation - Maps feedback severity to appropriate icon
const getSeverityIcon = (severity: FeedbackSeverity): React.ReactNode => {
  switch (severity) {
    case FeedbackSeverity.SUGGESTION:
      return <CheckCircle className="w-5 h-5" />;
    case FeedbackSeverity.IMPORTANT:
      return <AlertCircle className="w-5 h-5" />;
    case FeedbackSeverity.CRITICAL:
      return <XCircle className="w-5 h-5" />;
  }
};

// Requirement: Design System - Maps severity to color classes
const getSeverityColor = (severity: FeedbackSeverity): string => {
  switch (severity) {
    case FeedbackSeverity.SUGGESTION:
      return 'text-green-500';
    case FeedbackSeverity.IMPORTANT:
      return 'text-yellow-500';
    case FeedbackSeverity.CRITICAL:
      return 'text-red-500';
  }
};

// Requirement: AI Evaluation - Component for displaying AI-generated feedback
const FeedbackCard: React.FC<FeedbackCardProps> = ({ drillId, className }) => {
  const { feedback, isLoading } = useFeedback(drillId);

  if (isLoading) {
    return (
      <Card className={clsx('animate-pulse', className)}>
        <div className="space-y-4">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </Card>
    );
  }

  if (!feedback) {
    return null;
  }

  return (
    <Card className={clsx('space-y-6', className)}>
      {/* Requirement: User Management - Overall score section */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Overall Performance</h3>
        <div className="flex items-center space-x-2">
          <span className="text-2xl font-bold">{feedback.overallScore}</span>
          <span className="text-gray-500">/100</span>
        </div>
      </div>

      {/* Requirement: AI Evaluation - Categorized feedback points */}
      <div className="space-y-4">
        {Object.values(FeedbackCategory).map((category) => {
          const categoryFeedback = feedback.feedbackPoints.filter(
            (point: { category: FeedbackCategory }) => point.category === category
          );

          if (categoryFeedback.length === 0) return null;

          return (
            <div key={category} className="space-y-2">
              <h4 className="font-medium text-gray-700">{category}</h4>
              <div className="space-y-3">
                {categoryFeedback.map((point: {
                  id: string;
                  severity: FeedbackSeverity;
                  message: string;
                  suggestion: string;
                }) => (
                  <div key={point.id} className="flex items-start space-x-3">
                    <div className={clsx('flex-shrink-0 mt-1', getSeverityColor(point.severity))}>
                      {getSeverityIcon(point.severity)}
                    </div>
                    <div className="space-y-1">
                      <p className="text-gray-800">{point.message}</p>
                      <p className="text-sm text-gray-600">
                        Suggestion: {point.suggestion}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Requirement: User Management - Strengths and improvements sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <h4 className="font-medium text-green-600">Strengths</h4>
          <ul className="list-disc list-inside space-y-1 text-gray-700">
            {feedback.strengths.map((strength: string, index: number) => (
              <li key={index}>{strength}</li>
            ))}
          </ul>
        </div>
        <div className="space-y-2">
          <h4 className="font-medium text-yellow-600">Areas for Improvement</h4>
          <ul className="list-disc list-inside space-y-1 text-gray-700">
            {feedback.improvements.map((improvement: string, index: number) => (
              <li key={index}>{improvement}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* Requirement: Design System - Timestamp display */}
      <div className="text-sm text-gray-500">
        Generated on: {new Date(feedback.createdAt).toLocaleString()}
      </div>
    </Card>
  );
};

export default FeedbackCard;
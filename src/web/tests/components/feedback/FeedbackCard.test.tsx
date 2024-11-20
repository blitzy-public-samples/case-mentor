// @testing-library/react v14.0.0
import { render, screen, waitFor } from '@testing-library/react';
// @testing-library/user-event v14.0.0
import { userEvent } from '@testing-library/user-event';
// vitest v0.34.0
import { vi } from 'vitest';
import React from 'react';

// Internal imports
import FeedbackCard from '../../components/feedback/FeedbackCard';
import { FeedbackType, FeedbackCategory, FeedbackSeverity, AIFeedback } from '../../types/feedback';
import { useFeedback } from '../../hooks/useFeedback';

// Mock the useFeedback hook
vi.mock('../../hooks/useFeedback', () => ({
  useFeedback: vi.fn()
}));

// Mock feedback data factory function
const mockFeedbackData = (): AIFeedback => ({
  id: '123',
  drillType: 'CASE_PROMPT',
  attemptId: '456',
  overallScore: 85,
  feedbackPoints: [
    {
      id: '1',
      category: FeedbackCategory.STRUCTURE,
      severity: FeedbackSeverity.SUGGESTION,
      message: 'Good framework structure',
      suggestion: 'Consider adding more quantitative elements'
    },
    {
      id: '2',
      category: FeedbackCategory.ANALYSIS,
      severity: FeedbackSeverity.IMPORTANT,
      message: 'Analysis needs more depth',
      suggestion: 'Include market size calculations'
    },
    {
      id: '3',
      category: FeedbackCategory.CALCULATION,
      severity: FeedbackSeverity.CRITICAL,
      message: 'Critical calculation error',
      suggestion: 'Review profit margin formula'
    }
  ],
  strengths: [
    'Clear communication style',
    'Logical approach to problem solving'
  ],
  improvements: [
    'Deepen quantitative analysis',
    'Strengthen hypothesis validation'
  ],
  createdAt: new Date('2023-01-01T12:00:00Z')
});

describe('FeedbackCard', () => {
  // Reset all mocks before each test
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Requirement: AI Evaluation - Test loading state display
  test('renders loading state correctly', () => {
    // Mock loading state
    vi.mocked(useFeedback).mockReturnValue({
      feedback: null,
      isLoading: true,
      error: null,
      requestFeedback: vi.fn(),
      refreshHistory: vi.fn()
    });

    render(<FeedbackCard drillId="123" />);

    // Verify loading skeleton is displayed
    const loadingElement = screen.getByTestId('feedback-loading');
    expect(loadingElement).toHaveClass('animate-pulse');
  });

  // Requirement: AI Evaluation - Test feedback content display
  test('displays feedback content when data is loaded', async () => {
    const mockData = mockFeedbackData();
    
    // Mock successful feedback load
    vi.mocked(useFeedback).mockReturnValue({
      feedback: mockData,
      isLoading: false,
      error: null,
      requestFeedback: vi.fn(),
      refreshHistory: vi.fn()
    });

    render(<FeedbackCard drillId="123" />);

    // Verify overall score display
    expect(screen.getByText('85')).toBeInTheDocument();
    expect(screen.getByText('/100')).toBeInTheDocument();

    // Verify feedback points are displayed
    mockData.feedbackPoints.forEach(point => {
      expect(screen.getByText(point.message)).toBeInTheDocument();
      expect(screen.getByText(`Suggestion: ${point.suggestion}`)).toBeInTheDocument();
    });

    // Verify strengths and improvements
    mockData.strengths.forEach(strength => {
      expect(screen.getByText(strength)).toBeInTheDocument();
    });

    mockData.improvements.forEach(improvement => {
      expect(screen.getByText(improvement)).toBeInTheDocument();
    });

    // Verify timestamp
    expect(screen.getByText(/Generated on:/)).toBeInTheDocument();
  });

  // Requirement: User Management - Test empty state handling
  test('handles empty feedback data gracefully', () => {
    // Mock null feedback state
    vi.mocked(useFeedback).mockReturnValue({
      feedback: null,
      isLoading: false,
      error: null,
      requestFeedback: vi.fn(),
      refreshHistory: vi.fn()
    });

    const { container } = render(<FeedbackCard drillId="123" />);
    
    // Verify component renders nothing when no feedback
    expect(container.firstChild).toBeNull();
  });

  // Requirement: AI Evaluation - Test severity indicators
  test('displays correct severity icons', () => {
    const mockData = mockFeedbackData();
    
    vi.mocked(useFeedback).mockReturnValue({
      feedback: mockData,
      isLoading: false,
      error: null,
      requestFeedback: vi.fn(),
      refreshHistory: vi.fn()
    });

    render(<FeedbackCard drillId="123" />);

    // Verify severity icons and colors
    const suggestionIcon = screen.getByTestId('severity-icon-SUGGESTION');
    expect(suggestionIcon).toHaveClass('text-green-500');
    expect(suggestionIcon.querySelector('svg')).toHaveClass('w-5 h-5');

    const importantIcon = screen.getByTestId('severity-icon-IMPORTANT');
    expect(importantIcon).toHaveClass('text-yellow-500');
    expect(importantIcon.querySelector('svg')).toHaveClass('w-5 h-5');

    const criticalIcon = screen.getByTestId('severity-icon-CRITICAL');
    expect(criticalIcon).toHaveClass('text-red-500');
    expect(criticalIcon.querySelector('svg')).toHaveClass('w-5 h-5');
  });

  // Requirement: User Management - Test category sections
  test('renders feedback categories correctly', () => {
    const mockData = mockFeedbackData();
    
    vi.mocked(useFeedback).mockReturnValue({
      feedback: mockData,
      isLoading: false,
      error: null,
      requestFeedback: vi.fn(),
      refreshHistory: vi.fn()
    });

    render(<FeedbackCard drillId="123" />);

    // Verify category sections
    Object.values(FeedbackCategory).forEach(category => {
      const categoryFeedback = mockData.feedbackPoints.filter(
        point => point.category === category
      );
      
      if (categoryFeedback.length > 0) {
        expect(screen.getByText(category)).toBeInTheDocument();
      }
    });
  });

  // Requirement: AI Evaluation - Test custom class application
  test('applies custom className correctly', () => {
    const mockData = mockFeedbackData();
    const customClass = 'custom-test-class';
    
    vi.mocked(useFeedback).mockReturnValue({
      feedback: mockData,
      isLoading: false,
      error: null,
      requestFeedback: vi.fn(),
      refreshHistory: vi.fn()
    });

    const { container } = render(<FeedbackCard drillId="123" className={customClass} />);
    
    expect(container.firstChild).toHaveClass(customClass);
  });
});
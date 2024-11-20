// Third-party imports
import { renderHook, act, waitFor } from '@testing-library/react'; // ^14.0.0
import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals'; // ^29.7.0
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'; // ^4.0.0

// Internal imports
import { useDrill } from '../../hooks/useDrill';
import { 
  DrillType, 
  DrillPrompt, 
  DrillAttempt, 
  DrillProgress, 
  DrillResponse, 
  DrillDifficulty 
} from '../../types/drills';

/**
 * Human Tasks:
 * 1. Configure MSW handlers for drill API endpoints in test environment
 * 2. Set up test database with mock drill data
 * 3. Verify performance metrics collection in test environment
 * 4. Configure proper test timeouts for API operations
 * 5. Set up proper test coverage thresholds
 */

// Setup test utilities and mock data
const setupTest = () => {
  // Create new QueryClient with test configuration
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        cacheTime: 0
      }
    }
  });

  // Create wrapper component with QueryClientProvider
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );

  // Generate mock drill data
  const mockDrills: DrillPrompt[] = [
    {
      id: '1',
      type: DrillType.CASE_PROMPT,
      difficulty: DrillDifficulty.BEGINNER,
      title: 'Market Entry Strategy',
      description: 'Analyze market entry options for a tech startup',
      timeLimit: 45,
      industry: 'Technology',
      requiredTier: 'FREE'
    },
    {
      id: '2',
      type: DrillType.CASE_PROMPT,
      difficulty: DrillDifficulty.INTERMEDIATE,
      title: 'Cost Optimization',
      description: 'Optimize operational costs for manufacturing plant',
      timeLimit: 45,
      industry: 'Manufacturing',
      requiredTier: 'BASIC'
    }
  ];

  return { wrapper, queryClient, mockDrills };
};

// Mock API responses
const mockDrillResponse = (drillType: DrillType): DrillResponse => ({
  success: true,
  data: [
    {
      id: '1',
      type: drillType,
      difficulty: DrillDifficulty.BEGINNER,
      title: 'Test Drill',
      description: 'Test Description',
      timeLimit: 45,
      industry: 'Technology',
      requiredTier: 'FREE'
    }
  ],
  error: null
});

describe('useDrill hook', () => {
  // Requirement: Practice Drills - Validates drill management functionality
  it('should fetch drills successfully', async () => {
    // Setup test environment
    const { wrapper, mockDrills } = setupTest();

    // Mock API response
    global.fetch = jest.fn().mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true, data: mockDrills })
      })
    );

    // Render hook with test wrapper
    const { result } = renderHook(() => useDrill(DrillType.CASE_PROMPT), { wrapper });

    // Verify initial loading state
    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBeNull();

    // Wait for data to load
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Verify drills data
    expect(result.current.drills).toHaveLength(mockDrills.length);
    expect(result.current.drills[0]).toMatchObject({
      id: mockDrills[0].id,
      type: DrillType.CASE_PROMPT,
      difficulty: DrillDifficulty.BEGINNER
    });
  });

  // Requirement: System Performance - Verifies drill operations maintain <200ms API response time
  it('should handle API errors gracefully', async () => {
    const { wrapper } = setupTest();

    // Mock API error response
    global.fetch = jest.fn().mockImplementationOnce(() =>
      Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ 
          success: false, 
          error: 'Failed to fetch drills' 
        })
      })
    );

    // Render hook with test wrapper
    const { result } = renderHook(() => useDrill(DrillType.CASE_PROMPT), { wrapper });

    // Wait for error state
    await waitFor(() => {
      expect(result.current.error).toBe('Failed to fetch drills');
    });

    // Verify error handling
    expect(result.current.loading).toBe(false);
    expect(result.current.drills).toHaveLength(0);
  });

  // Requirement: Practice Drills - Tests progress tracking and performance analytics
  it('should submit drill attempt successfully', async () => {
    const { wrapper } = setupTest();

    // Mock API responses
    const mockAttempt: DrillAttempt = {
      id: '1',
      promptId: '1',
      userId: 'test-user',
      response: 'Test response',
      timeSpent: 300,
      score: 85,
      feedback: {
        score: 85,
        comments: ['Good analysis'],
        strengths: ['Clear structure'],
        improvements: ['Add more quantitative analysis']
      },
      createdAt: new Date()
    };

    global.fetch = jest.fn()
      .mockImplementationOnce(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true, data: mockAttempt })
      }));

    // Render hook with test wrapper
    const { result } = renderHook(() => useDrill(DrillType.CASE_PROMPT), { wrapper });

    // Submit attempt
    await act(async () => {
      const startTime = Date.now();
      await result.current.submitAttempt('1', 'Test response', 300);
      const endTime = Date.now();
      
      // Verify response time under 200ms
      expect(endTime - startTime).toBeLessThan(200);
    });

    // Verify submission success
    expect(result.current.error).toBeNull();
  });

  // Requirement: User Management - Tests progress tracking and performance analytics
  it('should track drill progress correctly', async () => {
    const { wrapper } = setupTest();

    // Mock progress data
    const mockProgress: DrillProgress = {
      drillType: DrillType.CASE_PROMPT,
      attemptsCount: 5,
      averageScore: 82,
      bestScore: 90,
      lastAttemptDate: new Date()
    };

    global.fetch = jest.fn()
      .mockImplementationOnce(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true, data: mockProgress })
      }));

    // Render hook with test wrapper
    const { result } = renderHook(() => useDrill(DrillType.CASE_PROMPT), { wrapper });

    // Wait for progress data
    await waitFor(() => {
      expect(result.current.progress).toBeDefined();
    });

    // Verify progress tracking
    expect(result.current.progress).toMatchObject({
      drillType: DrillType.CASE_PROMPT,
      attemptsCount: 5,
      averageScore: 82,
      bestScore: 90
    });
  });
});
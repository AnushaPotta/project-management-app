import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import { render, createMockQuery } from '@/utils/test-utils';
import TaskSummary from '@/components/dashboard/TaskSummary';
import { GET_TASK_STATS } from '@/graphql/dashboard';
import { MockedProvider } from '@apollo/client/testing';

// Mock the GraphQL response for TaskStats
const mockTaskStatsData = {
  taskStats: {
    total: 12,
    completed: 5,
    inProgress: 4,
    todo: 3
  }
};

const mocks = [
  createMockQuery(GET_TASK_STATS, { taskStats: mockTaskStatsData.taskStats })
];

describe('TaskSummary Component', () => {
  // Mock console.log to avoid cluttering test output
  beforeEach(() => {
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('shows loading skeleton initially', () => {
    // Mock Apollo's useQuery hook behavior for loading state
    const refetchMock = jest.fn().mockResolvedValue({
      data: { taskStats: mockTaskStatsData.taskStats }
    });
    
    jest.spyOn(require('@apollo/client'), 'useQuery').mockReturnValue({
      loading: true,
      data: undefined,
      refetch: refetchMock
    });

    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <TaskSummary />
      </MockedProvider>
    );
    
    // TaskSummary uses Skeleton component when loading
    // Chakra's Skeleton component uses a specific CSS class we can check for
    const skeletonElement = document.querySelector('.chakra-skeleton');
    expect(skeletonElement).toBeInTheDocument();
  });

  it('displays task statistics when data is loaded', async () => {
    const refetchMock = jest.fn().mockResolvedValue({
      data: { taskStats: mockTaskStatsData.taskStats }
    });

    // Mock Apollo's useQuery hook behavior
    jest.spyOn(require('@apollo/client'), 'useQuery').mockReturnValue({
      loading: false,
      data: mockTaskStatsData,
      refetch: refetchMock
    });

    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <TaskSummary />
      </MockedProvider>
    );
    
    // Wait for component to render with data
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    
    // Check for task stats in the document
    expect(screen.getByText('Total Tasks')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument(); // Total tasks
    expect(screen.getByText('5')).toBeInTheDocument(); // Completed tasks 
    expect(screen.getByText('4')).toBeInTheDocument(); // In Progress tasks
    expect(screen.getByText('3')).toBeInTheDocument(); // Todo tasks

    // Verify refetch was called (the component calls refetch on mount)
    expect(refetchMock).toHaveBeenCalled();
  });

  it('shows empty stats when query fails', async () => {
    const errorMock = [
      {
        request: {
          query: GET_TASK_STATS,
        },
        error: new Error('An error occurred'),
      },
    ];

    // Mock console.error to avoid error logs in test output
    jest.spyOn(console, 'error').mockImplementation(() => {});

    // Mock Apollo's useQuery hook behavior for error case
    jest.spyOn(require('@apollo/client'), 'useQuery').mockReturnValue({
      loading: false,
      error: new Error('An error occurred'),
      data: null,
      refetch: jest.fn().mockResolvedValue({ data: null, error: new Error('Failed to refetch') })
    });

    render(
      <MockedProvider mocks={errorMock} addTypename={false}>
        <TaskSummary />
      </MockedProvider>
    );

    // Wait for component to render fallback values
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    
    // Component should show zeros for all stats when there's an error
    expect(screen.getByText('Total Tasks')).toBeInTheDocument();
    expect(screen.getAllByText('0')[0]).toBeInTheDocument(); // Should display 0 for all stats
  });
  
  it('refetches data at intervals', async () => {
    // Mock the setInterval and clearInterval functions
    jest.useFakeTimers();
    
    // Clear any previous mock calls first
    jest.clearAllMocks();
    
    const refetchMock = jest.fn().mockResolvedValue({
      data: { taskStats: mockTaskStatsData.taskStats }
    });

    // Mock Apollo's useQuery hook behavior
    jest.spyOn(require('@apollo/client'), 'useQuery').mockReturnValue({
      loading: false,
      data: mockTaskStatsData,
      refetch: refetchMock
    });

    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <TaskSummary />
      </MockedProvider>
    );

    // Wait for the component to render and the useEffect to execute
    await waitFor(() => {
      expect(refetchMock).toHaveBeenCalled();
    });
    
    // Reset the mock to get accurate counts
    refetchMock.mockClear();
    
    // Fast forward 10 seconds to trigger the interval
    jest.advanceTimersByTime(10000);
    
    // Verify refetch was called after the interval
    expect(refetchMock).toHaveBeenCalledTimes(1);
    
    // Clean up
    jest.useRealTimers();
  });
});

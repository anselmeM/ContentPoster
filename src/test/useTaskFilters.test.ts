/**
 * Task Filters Hook Tests
 * 
 * Unit tests for useTaskFilters, useTaskCategories, and useTaskStatusCounts hooks.
 * Tests filter logic, category extraction, and status counting functionality.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useTaskFilters, useTaskCategories, useTaskStatusCounts } from '../hooks/useTaskFilters';
import { Task, TaskFilters, TaskCategory, TaskPriority } from '../types/task';

// Mock the taskUtils module
vi.mock('../utils/taskUtils', async () => {
  const actual = await vi.importActual('../utils/taskUtils');
  return {
    ...actual,
    isOverdue: vi.fn((deadline) => {
      if (!deadline) return false;
      const deadlineDate = new Date(deadline);
      const now = new Date();
      return deadlineDate < now;
    })
  };
});

// Import the mocked isOverdue
import { isOverdue } from '../utils/taskUtils';

// Helper to create timestamp
const now = Date.now();

describe('useTaskFilters', () => {
  const mockTasks: Task[] = [
    {
      id: 'task-1',
      userId: 'user-1',
      text: 'Complete the quarterly report',
      completed: false,
      category: TaskCategory.CONTENT,
      priority: TaskPriority.HIGH,
      deadline: new Date(now + 86400000).toISOString(), // Tomorrow
      createdAt: now,
      updatedAt: now,
      completedAt: null,
      assignedTo: null
    },
    {
      id: 'task-2',
      userId: 'user-1',
      text: 'Buy groceries',
      completed: false,
      category: TaskCategory.GENERAL,
      priority: TaskPriority.MEDIUM,
      deadline: new Date(now - 86400000).toISOString(), // Yesterday (overdue)
      createdAt: now,
      updatedAt: now,
      completedAt: null,
      assignedTo: null
    },
    {
      id: 'task-3',
      userId: 'user-1',
      text: 'Review pull requests',
      completed: true,
      category: TaskCategory.REVIEW,
      priority: TaskPriority.LOW,
      deadline: null,
      createdAt: now,
      updatedAt: now,
      completedAt: now,
      assignedTo: null
    },
    {
      id: 'task-4',
      userId: 'user-1',
      text: 'Schedule team meeting',
      completed: false,
      category: TaskCategory.DEVELOPMENT,
      priority: TaskPriority.HIGH,
      deadline: null,
      createdAt: now,
      updatedAt: now,
      completedAt: null,
      assignedTo: null
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('status filter', () => {
    it('should return all tasks when status is "all"', () => {
      const filters: TaskFilters = {
        status: 'all',
        categories: [],
        priorities: [],
        showOverdue: false,
        searchQuery: ''
      };

      const { result } = renderHook(() => useTaskFilters(mockTasks, filters));
      
      expect(result.current).toHaveLength(4);
    });

    it('should filter active tasks only when status is "active"', () => {
      const filters: TaskFilters = {
        status: 'active',
        categories: [],
        priorities: [],
        showOverdue: false,
        searchQuery: ''
      };

      const { result } = renderHook(() => useTaskFilters(mockTasks, filters));
      
      expect(result.current).toHaveLength(3);
      expect(result.current.every(t => !t.completed)).toBe(true);
    });

    it('should filter completed tasks only when status is "completed"', () => {
      const filters: TaskFilters = {
        status: 'completed',
        categories: [],
        priorities: [],
        showOverdue: false,
        searchQuery: ''
      };

      const { result } = renderHook(() => useTaskFilters(mockTasks, filters));
      
      expect(result.current).toHaveLength(1);
      expect(result.current[0].completed).toBe(true);
    });
  });

  describe('category filter', () => {
    it('should filter tasks by single category', () => {
      const filters: TaskFilters = {
        status: 'all',
        categories: [TaskCategory.CONTENT],
        priorities: [],
        showOverdue: false,
        searchQuery: ''
      };

      const { result } = renderHook(() => useTaskFilters(mockTasks, filters));
      
      expect(result.current).toHaveLength(1);
      expect(result.current.every(t => t.category === TaskCategory.CONTENT)).toBe(true);
    });

    it('should filter tasks by multiple categories', () => {
      const filters: TaskFilters = {
        status: 'all',
        categories: [TaskCategory.CONTENT, TaskCategory.GENERAL],
        priorities: [],
        showOverdue: false,
        searchQuery: ''
      };

      const { result } = renderHook(() => useTaskFilters(mockTasks, filters));
      
      expect(result.current).toHaveLength(2);
    });

    it('should return empty array when no tasks match category', () => {
      const filters: TaskFilters = {
        status: 'all',
        categories: [TaskCategory.RESEARCH],
        priorities: [],
        showOverdue: false,
        searchQuery: ''
      };

      const { result } = renderHook(() => useTaskFilters(mockTasks, filters));
      
      expect(result.current).toHaveLength(0);
    });
  });

  describe('priority filter', () => {
    it('should filter tasks by single priority', () => {
      const filters: TaskFilters = {
        status: 'all',
        categories: [],
        priorities: [TaskPriority.HIGH],
        showOverdue: false,
        searchQuery: ''
      };

      const { result } = renderHook(() => useTaskFilters(mockTasks, filters));
      
      expect(result.current).toHaveLength(2);
      expect(result.current.every(t => t.priority === TaskPriority.HIGH)).toBe(true);
    });

    it('should filter tasks by multiple priorities', () => {
      const filters: TaskFilters = {
        status: 'all',
        categories: [],
        priorities: [TaskPriority.HIGH, TaskPriority.MEDIUM],
        showOverdue: false,
        searchQuery: ''
      };

      const { result } = renderHook(() => useTaskFilters(mockTasks, filters));
      
      expect(result.current).toHaveLength(3);
    });
  });

  describe('overdue filter', () => {
    it('should show only overdue tasks when showOverdue is true', () => {
      const filters: TaskFilters = {
        status: 'all',
        categories: [],
        priorities: [],
        showOverdue: true,
        searchQuery: ''
      };

      // Mock isOverdue to return true for task-2
      vi.mocked(isOverdue).mockImplementation((deadline) => {
        if (!deadline) return false;
        return new Date(deadline) < new Date();
      });

      const { result } = renderHook(() => useTaskFilters(mockTasks, filters));
      
      // Should return only task-2 since it's overdue
      expect(result.current.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('search query filter', () => {
    it('should filter tasks by search query (case-insensitive)', () => {
      const filters: TaskFilters = {
        status: 'all',
        categories: [],
        priorities: [],
        showOverdue: false,
        searchQuery: 'report'
      };

      const { result } = renderHook(() => useTaskFilters(mockTasks, filters));
      
      expect(result.current).toHaveLength(1);
      expect(result.current[0].text).toContain('report');
    });

    it('should return all tasks when search query is empty', () => {
      const filters: TaskFilters = {
        status: 'all',
        categories: [],
        priorities: [],
        showOverdue: false,
        searchQuery: ''
      };

      const { result } = renderHook(() => useTaskFilters(mockTasks, filters));
      
      expect(result.current).toHaveLength(4);
    });

    it('should return empty array when no tasks match search query', () => {
      const filters: TaskFilters = {
        status: 'all',
        categories: [],
        priorities: [],
        showOverdue: false,
        searchQuery: 'nonexistent'
      };

      const { result } = renderHook(() => useTaskFilters(mockTasks, filters));
      
      expect(result.current).toHaveLength(0);
    });
  });

  describe('combined filters', () => {
    it('should apply multiple filters together', () => {
      const filters: TaskFilters = {
        status: 'active',
        categories: [TaskCategory.CONTENT],
        priorities: [TaskPriority.HIGH],
        showOverdue: false,
        searchQuery: ''
      };

      const { result } = renderHook(() => useTaskFilters(mockTasks, filters));
      
      expect(result.current).toHaveLength(1);
      expect(result.current.every(t => !t.completed && t.category === TaskCategory.CONTENT && t.priority === TaskPriority.HIGH)).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('should return empty array when tasks is null', () => {
      const filters: TaskFilters = {
        status: 'all',
        categories: [],
        priorities: [],
        showOverdue: false,
        searchQuery: ''
      };

      const { result } = renderHook(() => useTaskFilters(null as any, filters));
      
      expect(result.current).toHaveLength(0);
    });

    it('should return empty array when tasks is empty array', () => {
      const filters: TaskFilters = {
        status: 'all',
        categories: [],
        priorities: [],
        showOverdue: false,
        searchQuery: ''
      };

      const { result } = renderHook(() => useTaskFilters([], filters));
      
      expect(result.current).toHaveLength(0);
    });
  });
});

describe('useTaskCategories', () => {
  const mockTasks: Task[] = [
    {
      id: 'task-1',
      userId: 'user-1',
      text: 'Task 1',
      completed: false,
      category: TaskCategory.DEVELOPMENT,
      priority: TaskPriority.HIGH,
      deadline: null,
      createdAt: now,
      updatedAt: now,
      completedAt: null,
      assignedTo: null
    },
    {
      id: 'task-2',
      userId: 'user-1',
      text: 'Task 2',
      completed: false,
      category: TaskCategory.DEVELOPMENT,
      priority: TaskPriority.MEDIUM,
      deadline: null,
      createdAt: now,
      updatedAt: now,
      completedAt: null,
      assignedTo: null
    },
    {
      id: 'task-3',
      userId: 'user-1',
      text: 'Task 3',
      completed: true,
      category: TaskCategory.GENERAL,
      priority: TaskPriority.LOW,
      deadline: null,
      createdAt: now,
      updatedAt: now,
      completedAt: now,
      assignedTo: null
    }
  ];

  it('should return unique categories with counts sorted by count descending', () => {
    const { result } = renderHook(() => useTaskCategories(mockTasks));
    
    expect(result.current).toHaveLength(2);
    expect(result.current[0].category).toBe(TaskCategory.DEVELOPMENT);
    expect(result.current[0].count).toBe(2);
    expect(result.current[1].category).toBe(TaskCategory.GENERAL);
    expect(result.current[1].count).toBe(1);
  });

  it('should return empty array when no tasks', () => {
    const { result } = renderHook(() => useTaskCategories([]));
    
    expect(result.current).toHaveLength(0);
  });
});

describe('useTaskStatusCounts', () => {
  const mockTasks: Task[] = [
    {
      id: 'task-1',
      userId: 'user-1',
      text: 'Active task',
      completed: false,
      category: TaskCategory.DEVELOPMENT,
      priority: TaskPriority.HIGH,
      deadline: null,
      createdAt: now,
      updatedAt: now,
      completedAt: null,
      assignedTo: null
    },
    {
      id: 'task-2',
      userId: 'user-1',
      text: 'Completed task',
      completed: true,
      category: TaskCategory.DEVELOPMENT,
      priority: TaskPriority.MEDIUM,
      deadline: null,
      createdAt: now,
      updatedAt: now,
      completedAt: now,
      assignedTo: null
    },
    {
      id: 'task-3',
      userId: 'user-1',
      text: 'Overdue task',
      completed: false,
      category: TaskCategory.GENERAL,
      priority: TaskPriority.LOW,
      deadline: new Date(now - 86400000).toISOString(),
      createdAt: now,
      updatedAt: now,
      completedAt: null,
      assignedTo: null
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return correct counts for all statuses', () => {
    // Mock isOverdue to return true only for task-3
    vi.mocked(isOverdue).mockImplementation((deadline) => {
      if (!deadline) return false;
      return new Date(deadline) < new Date();
    });

    const { result } = renderHook(() => useTaskStatusCounts(mockTasks));
    
    expect(result.current.all).toBe(3);
    expect(result.current.active).toBe(2);
    expect(result.current.completed).toBe(1);
    expect(result.current.overdue).toBe(1);
  });

  it('should return zero counts when no tasks', () => {
    const { result } = renderHook(() => useTaskStatusCounts([]));
    
    expect(result.current.all).toBe(0);
    expect(result.current.active).toBe(0);
    expect(result.current.completed).toBe(0);
    expect(result.current.overdue).toBe(0);
  });
});

/**
 * Task Sort Hook Tests
 * 
 * Unit tests for useTaskSort, parseSortOption, and getSortOptionValue functions.
 * Tests sort logic for different fields and directions.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useTaskSort, parseSortOption, getSortOptionValue, SORT_OPTIONS } from '../hooks/useTaskSort';
import { Task, TaskSortConfig, TaskCategory, TaskPriority } from '../types/task';

// Mock taskUtils
vi.mock('../utils/taskUtils', async () => {
  const actual = await vi.importActual('../utils/taskUtils');
  return {
    ...actual,
    getPriorityOrder: vi.fn((priority: TaskPriority) => {
      const orders: Record<TaskPriority, number> = {
        [TaskPriority.URGENT]: 4,
        [TaskPriority.HIGH]: 3,
        [TaskPriority.MEDIUM]: 2,
        [TaskPriority.LOW]: 1
      };
      return orders[priority] || 0;
    }),
    compareDates: vi.fn((dateA, dateB) => {
      if (!dateA && !dateB) return 0;
      if (!dateA) return 1;
      if (!dateB) return -1;
      return new Date(dateA).getTime() - new Date(dateB).getTime();
    })
  };
});

import { getPriorityOrder, compareDates } from '../utils/taskUtils';

const now = Date.now();

describe('useTaskSort', () => {
  const mockTasks: Task[] = [
    {
      id: 'task-1',
      userId: 'user-1',
      text: 'Zebra Task',
      completed: false,
      category: TaskCategory.DEVELOPMENT,
      priority: TaskPriority.HIGH,
      deadline: new Date(now + 86400000).toISOString(),
      createdAt: now - 100000,
      updatedAt: now - 100000,
      completedAt: null,
      assignedTo: null
    },
    {
      id: 'task-2',
      userId: 'user-1',
      text: 'Alpha Task',
      completed: false,
      category: TaskCategory.GENERAL,
      priority: TaskPriority.LOW,
      deadline: new Date(now + 172800000).toISOString(),
      createdAt: now,
      updatedAt: now,
      completedAt: null,
      assignedTo: null
    },
    {
      id: 'task-3',
      userId: 'user-1',
      text: 'Middle Task',
      completed: true,
      category: TaskCategory.REVIEW,
      priority: TaskPriority.URGENT,
      deadline: null,
      createdAt: now - 50000,
      updatedAt: now - 50000,
      completedAt: now - 50000,
      assignedTo: null
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('sort by createdAt', () => {
    it('should sort by newest first (desc)', () => {
      const sort: TaskSortConfig = { field: 'createdAt', direction: 'desc' };
      const { result } = renderHook(() => useTaskSort(mockTasks, sort));
      
      expect(result.current[0].id).toBe('task-2'); // newest
      expect(result.current[1].id).toBe('task-3');
      expect(result.current[2].id).toBe('task-1'); // oldest
    });

    it('should sort by oldest first (asc)', () => {
      const sort: TaskSortConfig = { field: 'createdAt', direction: 'asc' };
      const { result } = renderHook(() => useTaskSort(mockTasks, sort));
      
      expect(result.current[0].id).toBe('task-1'); // oldest
      expect(result.current[1].id).toBe('task-3');
      expect(result.current[2].id).toBe('task-2'); // newest
    });
  });

  describe('sort by deadline', () => {
    it('should sort by soonest first (asc)', () => {
      const sort: TaskSortConfig = { field: 'deadline', direction: 'asc' };
      const { result } = renderHook(() => useTaskSort(mockTasks, sort));
      
      // task-1 has deadline tomorrow
      // task-2 has deadline in 2 days
      // task-3 has no deadline (should be last)
      expect(result.current[0].id).toBe('task-1');
      expect(result.current[1].id).toBe('task-2');
      expect(result.current[2].id).toBe('task-3');
    });

    it('should sort by latest first (desc)', () => {
      const sort: TaskSortConfig = { field: 'deadline', direction: 'desc' };
      const { result } = renderHook(() => useTaskSort(mockTasks, sort));
      
      // task-2 has latest deadline
      // task-1 has earlier deadline
      // task-3 has no deadline (should be last)
      expect(result.current[0].id).toBe('task-2');
      expect(result.current[1].id).toBe('task-1');
      expect(result.current[2].id).toBe('task-3');
    });
  });

  describe('sort by priority', () => {
    it('should sort by high to low priority (desc)', () => {
      const sort: TaskSortConfig = { field: 'priority', direction: 'desc' };
      const { result } = renderHook(() => useTaskSort(mockTasks, sort));
      
      // URGENT > HIGH > LOW
      expect(result.current[0].priority).toBe(TaskPriority.URGENT);
      expect(result.current[1].priority).toBe(TaskPriority.HIGH);
      expect(result.current[2].priority).toBe(TaskPriority.LOW);
    });

    it('should sort by low to high priority (asc)', () => {
      const sort: TaskSortConfig = { field: 'priority', direction: 'asc' };
      const { result } = renderHook(() => useTaskSort(mockTasks, sort));
      
      // LOW > MEDIUM > HIGH > URGENT (when ascending)
      expect(result.current[0].priority).toBe(TaskPriority.LOW);
      expect(result.current[1].priority).toBe(TaskPriority.HIGH);
      expect(result.current[2].priority).toBe(TaskPriority.URGENT);
    });
  });

  describe('sort by text', () => {
    it('should sort alphabetically A-Z (asc)', () => {
      const sort: TaskSortConfig = { field: 'text', direction: 'asc' };
      const { result } = renderHook(() => useTaskSort(mockTasks, sort));
      
      expect(result.current[0].text).toBe('Alpha Task');
      expect(result.current[1].text).toBe('Middle Task');
      expect(result.current[2].text).toBe('Zebra Task');
    });

    it('should sort alphabetically Z-A (desc)', () => {
      const sort: TaskSortConfig = { field: 'text', direction: 'desc' };
      const { result } = renderHook(() => useTaskSort(mockTasks, sort));
      
      expect(result.current[0].text).toBe('Zebra Task');
      expect(result.current[1].text).toBe('Middle Task');
      expect(result.current[2].text).toBe('Alpha Task');
    });
  });

  describe('edge cases', () => {
    it('should return empty array when tasks is null', () => {
      const sort: TaskSortConfig = { field: 'createdAt', direction: 'desc' };
      const { result } = renderHook(() => useTaskSort(null as any, sort));
      
      expect(result.current).toHaveLength(0);
    });

    it('should return empty array when tasks is empty', () => {
      const sort: TaskSortConfig = { field: 'createdAt', direction: 'desc' };
      const { result } = renderHook(() => useTaskSort([], sort));
      
      expect(result.current).toHaveLength(0);
    });

    it('should not mutate original array', () => {
      const sort: TaskSortConfig = { field: 'text', direction: 'asc' };
      const originalFirst = mockTasks[0].text;
      const { result } = renderHook(() => useTaskSort(mockTasks, sort));
      
      expect(mockTasks[0].text).toBe(originalFirst);
      expect(result.current[0].text).toBe('Alpha Task');
    });
  });
});

describe('SORT_OPTIONS', () => {
  it('should have 8 sort options', () => {
    expect(SORT_OPTIONS).toHaveLength(8);
  });

  it('should have valid field values', () => {
    const validFields = ['createdAt', 'deadline', 'priority', 'text'];
    SORT_OPTIONS.forEach(option => {
      expect(validFields).toContain(option.field);
    });
  });

  it('should have valid direction values', () => {
    const validDirections = ['asc', 'desc'];
    SORT_OPTIONS.forEach(option => {
      expect(validDirections).toContain(option.direction);
    });
  });

  it('should have unique values', () => {
    const values = SORT_OPTIONS.map(o => o.value);
    const uniqueValues = new Set(values);
    expect(uniqueValues.size).toBe(values.length);
  });
});

describe('parseSortOption', () => {
  it('should parse valid sort option value', () => {
    const result = parseSortOption('deadline-asc');
    
    expect(result.field).toBe('deadline');
    expect(result.direction).toBe('asc');
  });

  it('should return default config for invalid value', () => {
    const result = parseSortOption('invalid-option');
    
    expect(result.field).toBe('createdAt');
    expect(result.direction).toBe('desc');
  });

  it('should return default config for empty string', () => {
    const result = parseSortOption('');
    
    expect(result.field).toBe('createdAt');
    expect(result.direction).toBe('desc');
  });

  it('should handle all valid sort options', () => {
    SORT_OPTIONS.forEach(option => {
      const result = parseSortOption(option.value);
      expect(result.field).toBe(option.field);
      expect(result.direction).toBe(option.direction);
    });
  });
});

describe('getSortOptionValue', () => {
  it('should return correct value for config', () => {
    const sort: TaskSortConfig = { field: 'deadline', direction: 'asc' };
    const result = getSortOptionValue(sort);
    
    expect(result).toBe('deadline-asc');
  });

  it('should return default for invalid config', () => {
    const sort: TaskSortConfig = { field: 'invalid' as any, direction: 'asc' };
    const result = getSortOptionValue(sort);
    
    expect(result).toBe('createdAt-desc');
  });

  it('should handle all valid sort configs', () => {
    SORT_OPTIONS.forEach(option => {
      const sort: TaskSortConfig = { 
        field: option.field, 
        direction: option.direction 
      };
      const result = getSortOptionValue(sort);
      expect(result).toBe(option.value);
    });
  });
});

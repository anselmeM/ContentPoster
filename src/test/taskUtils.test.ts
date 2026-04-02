/**
 * Task Utils - Unit Tests
 * 
 * Tests for utility functions in src/utils/taskUtils.ts
 */

import { describe, it, expect } from 'vitest';
import {
  isOverdue,
  isDueToday,
  isDueTomorrow,
  formatDeadline,
  formatDateTime,
  getPriorityColor,
  getPriorityBgColor,
  getPriorityIcon,
  getPriorityOrder,
  getCategoryColor,
  getCategoryBgColor,
  calculateStats,
  validateTask,
  compareDates,
  filterTasks,
  sortTasks,
  generateTaskId,
  getCategoryLabel,
  getPriorityLabel,
  groupTasksByCategory,
  groupTasksByPriority
} from '../utils/taskUtils';
import { 
  Task, 
  TaskCategory, 
  TaskPriority,
  TaskStats 
} from '../types/task';

// ============================================================================
// Test Data
// ============================================================================

const createTask = (overrides: Partial<Task> = {}): Task => ({
  id: 'test-id-1',
  text: 'Test task',
  completed: false,
  category: TaskCategory.GENERAL,
  priority: TaskPriority.MEDIUM,
  deadline: null,
  assignedTo: null,
  createdAt: Date.now(),
  updatedAt: Date.now(),
  completedAt: null,
  userId: 'user-1',
  ...overrides
});

// ============================================================================
// isOverdue Tests
// ============================================================================

describe('isOverdue', () => {
  it('should return false when deadline is null', () => {
    expect(isOverdue(null)).toBe(false);
  });

  it('should return false when task is completed', () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 1);
    expect(isOverdue(pastDate.toISOString(), true)).toBe(false);
  });

  it('should return true when deadline is in the past and task is not completed', () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 1);
    expect(isOverdue(pastDate.toISOString(), false)).toBe(true);
  });

  it('should return false when deadline is in the future', () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 1);
    expect(isOverdue(futureDate.toISOString(), false)).toBe(false);
  });
});

// ============================================================================
// isDueToday Tests
// ============================================================================

describe('isDueToday', () => {
  it('should return false when deadline is null', () => {
    expect(isDueToday(null)).toBe(false);
  });

  it('should return true when deadline is today', () => {
    const today = new Date().toISOString().split('T')[0];
    expect(isDueToday(today + 'T12:00:00.000Z')).toBe(true);
  });

  it('should return false when deadline is tomorrow', () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    expect(isDueToday(tomorrow.toISOString())).toBe(false);
  });
});

// ============================================================================
// isDueTomorrow Tests
// ============================================================================

describe('isDueTomorrow', () => {
  it('should return false when deadline is null', () => {
    expect(isDueTomorrow(null)).toBe(false);
  });

  it('should return true when deadline is tomorrow', () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    expect(isDueTomorrow(tomorrow.toISOString())).toBe(true);
  });

  it('should return false when deadline is today', () => {
    const today = new Date().toISOString().split('T')[0];
    expect(isDueTomorrow(today + 'T12:00:00.000Z')).toBe(false);
  });
});

// ============================================================================
// formatDeadline Tests
// ============================================================================

describe('formatDeadline', () => {
  it('should return empty string when deadline is null', () => {
    expect(formatDeadline(null)).toBe('');
  });

  it('should return "Today" for today\'s deadline', () => {
    const today = new Date().toISOString().split('T')[0];
    expect(formatDeadline(today + 'T12:00:00.000Z')).toBe('Today');
  });

  it('should return "Tomorrow" for tomorrow\'s deadline', () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    expect(formatDeadline(tomorrow.toISOString())).toBe('Tomorrow');
  });

  it('should return "Yesterday" for past deadline', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    expect(formatDeadline(yesterday.toISOString())).toBe('Yesterday');
  });
});

// ============================================================================
// getPriorityOrder Tests
// ============================================================================

describe('getPriorityOrder', () => {
  it('should return 4 for URGENT', () => {
    expect(getPriorityOrder(TaskPriority.URGENT)).toBe(4);
  });

  it('should return 3 for HIGH', () => {
    expect(getPriorityOrder(TaskPriority.HIGH)).toBe(3);
  });

  it('should return 2 for MEDIUM', () => {
    expect(getPriorityOrder(TaskPriority.MEDIUM)).toBe(2);
  });

  it('should return 1 for LOW', () => {
    expect(getPriorityOrder(TaskPriority.LOW)).toBe(1);
  });
});

// ============================================================================
// calculateStats Tests
// ============================================================================

describe('calculateStats', () => {
  it('should return zeros for empty array', () => {
    const stats = calculateStats([]);
    expect(stats.total).toBe(0);
    expect(stats.active).toBe(0);
    expect(stats.completed).toBe(0);
    expect(stats.overdue).toBe(0);
    expect(stats.completionRate).toBe(0);
  });

  it('should calculate correct stats for mixed tasks', () => {
    const tasks: Task[] = [
      createTask({ id: '1', completed: true }),
      createTask({ id: '2', completed: false }),
      createTask({ id: '3', completed: false }),
      createTask({ id: '4', completed: true }),
    ];
    
    const stats = calculateStats(tasks);
    expect(stats.total).toBe(4);
    expect(stats.active).toBe(2);
    expect(stats.completed).toBe(2);
    expect(stats.completionRate).toBe(50);
  });

  it('should calculate overdue count', () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 2);
    
    const tasks: Task[] = [
      createTask({ id: '1', completed: false, deadline: pastDate.toISOString() }),
      createTask({ id: '2', completed: false, deadline: null }),
      createTask({ id: '3', completed: true, deadline: pastDate.toISOString() }),
    ];
    
    const stats = calculateStats(tasks);
    expect(stats.overdue).toBe(1); // Only non-completed with past deadline
  });
});

// ============================================================================
// validateTask Tests
// ============================================================================

describe('validateTask', () => {
  it('should return invalid when text is empty', () => {
    const result = validateTask({ text: '' });
    expect(result.isValid).toBe(false);
    expect(result.errors.text).toBe('Task text is required');
  });

  it('should return invalid when text exceeds 500 characters', () => {
    const result = validateTask({ text: 'a'.repeat(501) });
    expect(result.isValid).toBe(false);
    expect(result.errors.text).toBe('Task text must be 500 characters or less');
  });

  it('should return valid for correct task', () => {
    const result = validateTask({ text: 'Valid task text' });
    expect(result.isValid).toBe(true);
    expect(Object.keys(result.errors).length).toBe(0);
  });

  it('should return invalid for invalid category', () => {
    const result = validateTask({ 
      text: 'Valid text', 
      category: 'invalid' as TaskCategory 
    });
    expect(result.isValid).toBe(false);
    expect(result.errors.category).toBe('Invalid category');
  });

  it('should return invalid for invalid priority', () => {
    const result = validateTask({ 
      text: 'Valid text', 
      priority: 'invalid' as TaskPriority 
    });
    expect(result.isValid).toBe(false);
    expect(result.errors.priority).toBe('Invalid priority');
  });
});

// ============================================================================
// compareDates Tests
// ============================================================================

describe('compareDates', () => {
  it('should return 0 for both null', () => {
    expect(compareDates(null, null)).toBe(0);
  });

  it('should return 1 when first is null', () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 1);
    expect(compareDates(null, futureDate.toISOString())).toBe(1);
  });

  it('should return -1 when second is null', () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 1);
    expect(compareDates(futureDate.toISOString(), null)).toBe(-1);
  });

  it('should return positive when first date is later', () => {
    const later = new Date();
    later.setDate(later.getDate() + 1);
    const earlier = new Date();
    expect(compareDates(later.toISOString(), earlier.toISOString())).toBeGreaterThan(0);
  });

  it('should return negative when second date is later', () => {
    const earlier = new Date();
    const later = new Date();
    later.setDate(later.getDate() + 1);
    expect(compareDates(earlier.toISOString(), later.toISOString())).toBeLessThan(0);
  });
});

// ============================================================================
// filterTasks Tests
// ============================================================================

describe('filterTasks', () => {
  const tasks: Task[] = [
    createTask({ id: '1', completed: false, category: TaskCategory.GENERAL, priority: TaskPriority.HIGH }),
    createTask({ id: '2', completed: true, category: TaskCategory.DESIGN, priority: TaskPriority.MEDIUM }),
    createTask({ id: '3', completed: false, category: TaskCategory.DEVELOPMENT, priority: TaskPriority.LOW }),
  ];

  it('should return all tasks when status is all', () => {
    const filtered = filterTasks(tasks, { status: 'all', categories: [], priorities: [], searchQuery: '', showOverdue: false });
    expect(filtered.length).toBe(3);
  });

  it('should filter active tasks', () => {
    const filtered = filterTasks(tasks, { status: 'active', categories: [], priorities: [], searchQuery: '', showOverdue: false });
    expect(filtered.length).toBe(2);
    expect(filtered.every(t => !t.completed)).toBe(true);
  });

  it('should filter completed tasks', () => {
    const filtered = filterTasks(tasks, { status: 'completed', categories: [], priorities: [], searchQuery: '', showOverdue: false });
    expect(filtered.length).toBe(1);
    expect(filtered.every(t => t.completed)).toBe(true);
  });

  it('should filter by category', () => {
    const filtered = filterTasks(tasks, { status: 'all', categories: [TaskCategory.GENERAL], priorities: [], searchQuery: '', showOverdue: false });
    expect(filtered.length).toBe(1);
    expect(filtered[0].category).toBe(TaskCategory.GENERAL);
  });

  it('should filter by priority', () => {
    const filtered = filterTasks(tasks, { status: 'all', categories: [], priorities: [TaskPriority.HIGH], searchQuery: '', showOverdue: false });
    expect(filtered.length).toBe(1);
    expect(filtered[0].priority).toBe(TaskPriority.HIGH);
  });

  it('should filter by search query', () => {
    const filtered = filterTasks(tasks, { status: 'all', categories: [], priorities: [], searchQuery: 'DESIGN', showOverdue: false });
    expect(filtered.length).toBe(1);
    expect(filtered[0].category).toBe(TaskCategory.DESIGN);
  });
});

// ============================================================================
// sortTasks Tests
// ============================================================================

describe('sortTasks', () => {
  const tasks: Task[] = [
    createTask({ id: '1', text: 'Zebra', priority: TaskPriority.LOW, createdAt: 1000 }),
    createTask({ id: '2', text: 'Apple', priority: TaskPriority.HIGH, createdAt: 2000 }),
    createTask({ id: '3', text: 'Banana', priority: TaskPriority.MEDIUM, createdAt: 3000 }),
  ];

  it('should sort by createdAt descending by default', () => {
    const sorted = sortTasks(tasks, { field: 'createdAt', direction: 'desc' });
    expect(sorted[0].id).toBe('3');
    expect(sorted[1].id).toBe('2');
    expect(sorted[2].id).toBe('1');
  });

  it('should sort by text alphabetically', () => {
    const sorted = sortTasks(tasks, { field: 'text', direction: 'asc' });
    expect(sorted[0].text).toBe('Apple');
    expect(sorted[1].text).toBe('Banana');
    expect(sorted[2].text).toBe('Zebra');
  });

  it('should sort by priority (urgent first)', () => {
    const sorted = sortTasks(tasks, { field: 'priority', direction: 'desc' });
    expect(sorted[0].priority).toBe(TaskPriority.HIGH);
    expect(sorted[1].priority).toBe(TaskPriority.MEDIUM);
    expect(sorted[2].priority).toBe(TaskPriority.LOW);
  });
});

// ============================================================================
// generateTaskId Tests
// ============================================================================

describe('generateTaskId', () => {
  it('should generate unique IDs', () => {
    const id1 = generateTaskId();
    const id2 = generateTaskId();
    expect(id1).not.toBe(id2);
  });

  it('should contain timestamp', () => {
    const before = Date.now();
    const id = generateTaskId();
    const after = Date.now();
    const timestamp = parseInt(id.split('-')[0]);
    expect(timestamp).toBeGreaterThanOrEqual(before);
    expect(timestamp).toBeLessThanOrEqual(after);
  });
});

// ============================================================================
// groupTasksByCategory Tests
// ============================================================================

describe('groupTasksByCategory', () => {
  it('should group tasks by category', () => {
    const tasks: Task[] = [
      createTask({ category: TaskCategory.GENERAL }),
      createTask({ category: TaskCategory.DESIGN }),
      createTask({ category: TaskCategory.GENERAL }),
    ];
    
    const grouped = groupTasksByCategory(tasks);
    expect(grouped[TaskCategory.GENERAL].length).toBe(2);
    expect(grouped[TaskCategory.DESIGN].length).toBe(1);
  });
});

// ============================================================================
// groupTasksByPriority Tests
// ============================================================================

describe('groupTasksByPriority', () => {
  it('should group tasks by priority', () => {
    const tasks: Task[] = [
      createTask({ priority: TaskPriority.HIGH }),
      createTask({ priority: TaskPriority.LOW }),
      createTask({ priority: TaskPriority.HIGH }),
    ];
    
    const grouped = groupTasksByPriority(tasks);
    expect(grouped[TaskPriority.HIGH].length).toBe(2);
    expect(grouped[TaskPriority.LOW].length).toBe(1);
  });
});
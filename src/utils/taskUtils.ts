/**
 * Task Management System - Utility Functions
 * 
 * Helper functions for task management operations.
 * Following the design specification from TASK_SYSTEM_DESIGN.md
 */

import {
  Task,
  TaskCategory,
  TaskPriority,
  TaskStats,
  TaskFilters,
  TaskSortConfig,
  ValidationResult,
  PRIORITY_CONFIG,
  CATEGORY_CONFIG
} from '../types/task';

/**
 * Check if a deadline has passed (is overdue)
 * @param deadline - ISO date string or null
 * @returns true if deadline is past and task is not completed
 */
export function isOverdue(deadline: string | null, completed: boolean = false): boolean {
  if (!deadline || completed) return false;
  
  const now = new Date();
  const deadlineDate = new Date(deadline);
  
  // Set deadline time to end of day for comparison
  deadlineDate.setHours(23, 59, 59, 999);
  
  return now > deadlineDate;
}

/**
 * Check if a deadline is due today
 * @param deadline - ISO date string or null
 * @returns true if deadline is today
 */
export function isDueToday(deadline: string | null): boolean {
  if (!deadline) return false;
  
  const now = new Date();
  const deadlineDate = new Date(deadline);
  
  return (
    deadlineDate.getFullYear() === now.getFullYear() &&
    deadlineDate.getMonth() === now.getMonth() &&
    deadlineDate.getDate() === now.getDate()
  );
}

/**
 * Check if a deadline is due tomorrow
 * @param deadline - ISO date string or null
 * @returns true if deadline is tomorrow
 */
export function isDueTomorrow(deadline: string | null): boolean {
  if (!deadline) return false;
  
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const deadlineDate = new Date(deadline);
  
  return (
    deadlineDate.getFullYear() === tomorrow.getFullYear() &&
    deadlineDate.getMonth() === tomorrow.getMonth() &&
    deadlineDate.getDate() === tomorrow.getDate()
  );
}

/**
 * Format a deadline date for display
 * @param deadline - ISO date string
 * @returns formatted date string (e.g., "Mar 30", "Tomorrow", "Today")
 */
export function formatDeadline(deadline: string | null): string {
  if (!deadline) return '';
  
  const deadlineDate = new Date(deadline);
  const now = new Date();
  
  // Check if it's today
  if (isDueToday(deadline)) {
    return 'Today';
  }
  
  // Check if it's tomorrow
  if (isDueTomorrow(deadline)) {
    return 'Tomorrow';
  }
  
  // Check if it's overdue
  if (isOverdue(deadline)) {
    const daysOverdue = Math.floor((now.getTime() - deadlineDate.getTime()) / (1000 * 60 * 60 * 24));
    if (daysOverdue === 1) return 'Yesterday';
    if (daysOverdue < 7) return `${daysOverdue} days overdue`;
    return deadlineDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
  
  // Future date
  const daysUntil = Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysUntil <= 7) {
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return dayNames[deadlineDate.getDay()];
  }
  
  return deadlineDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * Format full date with time
 * @param timestamp - Unix timestamp
 * @returns formatted date and time string
 */
export function formatDateTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
}

/**
 * Get priority display color class
 * @param priority - Task priority level
 * @returns Tailwind color class
 */
export function getPriorityColor(priority: TaskPriority): string {
  return PRIORITY_CONFIG[priority]?.color || 'text-gray-600';
}

/**
 * Get priority background color class
 * @param priority - Task priority level
 * @returns Tailwind background color class
 */
export function getPriorityBgColor(priority: TaskPriority): string {
  return PRIORITY_CONFIG[priority]?.bgColor || 'bg-gray-100';
}

/**
 * Get priority icon class
 * @param priority - Task priority level
 * @returns FontAwesome icon class
 */
export function getPriorityIcon(priority: TaskPriority): string {
  return PRIORITY_CONFIG[priority]?.icon || 'fa-minus';
}

/**
 * Get priority order for sorting
 * @param priority - Task priority level
 * @returns numeric order (higher = more urgent)
 */
export function getPriorityOrder(priority: TaskPriority): number {
  return PRIORITY_CONFIG[priority]?.order || 0;
}

/**
 * Get category display color class
 * @param category - Task category
 * @returns Tailwind color class
 */
export function getCategoryColor(category: TaskCategory): string {
  return CATEGORY_CONFIG[category]?.color || 'text-gray-600';
}

/**
 * Get category background color class
 * @param category - Task category
 * @returns Tailwind background color class
 */
export function getCategoryBgColor(category: TaskCategory): string {
  return CATEGORY_CONFIG[category]?.bgColor || 'bg-gray-100';
}

/**
 * Calculate task statistics from task array
 * @param tasks - Array of tasks
 * @returns Statistics object
 */
export function calculateStats(tasks: Task[]): TaskStats {
  const total = tasks.length;
  const completed = tasks.filter(t => t.completed).length;
  const active = total - completed;
  const overdue = tasks.filter(t => !t.completed && isOverdue(t.deadline)).length;
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
  
  return {
    total,
    active,
    completed,
    overdue,
    completionRate
  };
}

/**
 * Validate task data
 * @param task - Partial task object
 * @returns Validation result
 */
export function validateTask(task: Partial<Task>): ValidationResult {
  const errors: Record<string, string> = {};
  
  // Text validation
  if (!task.text || task.text.trim() === '') {
    errors.text = 'Task text is required';
  } else if (task.text.length > 500) {
    errors.text = 'Task text must be 500 characters or less';
  }
  
  // Category validation
  if (task.category !== undefined) {
    const validCategories = Object.values(TaskCategory);
    if (!validCategories.includes(task.category)) {
      errors.category = 'Invalid category';
    }
  }
  
  // Priority validation
  if (task.priority !== undefined) {
    const validPriorities = Object.values(TaskPriority);
    if (!validPriorities.includes(task.priority)) {
      errors.priority = 'Invalid priority';
    }
  }
  
  // Deadline validation
  if (task.deadline !== null && task.deadline !== undefined) {
    const deadlineDate = new Date(task.deadline);
    if (isNaN(deadlineDate.getTime())) {
      errors.deadline = 'Invalid date format';
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * Compare two dates for sorting (nulls last)
 * @param a - First date or null
 * @param b - Second date or null
 * @returns comparison result (-1, 0, 1)
 */
export function compareDates(a: string | null, b: string | null): number {
  if (!a && !b) return 0;
  if (!a) return 1;  // nulls go to end
  if (!b) return -1;
  
  return new Date(a).getTime() - new Date(b).getTime();
}

/**
 * Filter tasks based on filter criteria
 * @param tasks - Array of tasks
 * @param filters - Filter configuration
 * @returns Filtered tasks
 */
export function filterTasks(tasks: Task[], filters: TaskFilters): Task[] {
  return tasks.filter(task => {
    // Status filter
    if (filters.status === 'active' && task.completed) return false;
    if (filters.status === 'completed' && !task.completed) return false;
    
    // Category filter
    if (filters.categories.length > 0 && !filters.categories.includes(task.category)) {
      return false;
    }
    
    // Priority filter
    if (filters.priorities.length > 0 && !filters.priorities.includes(task.priority)) {
      return false;
    }
    
    // Overdue filter
    if (filters.showOverdue && (!task.deadline || !isOverdue(task.deadline))) {
      return false;
    }
    
    // Search query filter
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      if (!task.text.toLowerCase().includes(query)) {
        return false;
      }
    }
    
    return true;
  });
}

/**
 * Sort tasks based on sort configuration
 * @param tasks - Array of tasks
 * @param sort - Sort configuration
 * @returns Sorted tasks (new array, non-mutating)
 */
export function sortTasks(tasks: Task[], sort: TaskSortConfig): Task[] {
  return [...tasks].sort((a, b) => {
    let comparison = 0;
    
    switch (sort.field) {
      case 'deadline':
        comparison = compareDates(a.deadline, b.deadline);
        break;
      case 'priority':
        comparison = getPriorityOrder(b.priority) - getPriorityOrder(a.priority);
        break;
      case 'createdAt':
        comparison = b.createdAt - a.createdAt;
        break;
      case 'text':
        comparison = a.text.localeCompare(b.text);
        break;
      default:
        comparison = 0;
    }
    
    return sort.direction === 'asc' ? comparison : -comparison;
  });
}

/**
 * Generate a unique ID for tasks
 * @returns UUID string
 */
export function generateTaskId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get category label
 * @param category - Task category
 * @returns Display label
 */
export function getCategoryLabel(category: TaskCategory): string {
  return CATEGORY_CONFIG[category]?.label || category;
}

/**
 * Get priority label
 * @param priority - Task priority
 * @returns Display label
 */
export function getPriorityLabel(priority: TaskPriority): string {
  return PRIORITY_CONFIG[priority]?.label || priority;
}

/**
 * Group tasks by category
 * @param tasks - Array of tasks
 * @returns Map of category to tasks
 */
export function groupTasksByCategory(tasks: Task[]): Record<TaskCategory, Task[]> {
  const grouped: Record<TaskCategory, Task[]> = {
    [TaskCategory.GENERAL]: [],
    [TaskCategory.DESIGN]: [],
    [TaskCategory.DEVELOPMENT]: [],
    [TaskCategory.CONTENT]: [],
    [TaskCategory.REVIEW]: [],
    [TaskCategory.RESEARCH]: [],
    [TaskCategory.DEPLOYMENT]: []
  };
  
  tasks.forEach(task => {
    grouped[task.category].push(task);
  });
  
  return grouped;
}

/**
 * Group tasks by priority
 * @param tasks - Array of tasks
 * @returns Map of priority to tasks
 */
export function groupTasksByPriority(tasks: Task[]): Record<TaskPriority, Task[]> {
  const grouped: Record<TaskPriority, Task[]> = {
    [TaskPriority.URGENT]: [],
    [TaskPriority.HIGH]: [],
    [TaskPriority.MEDIUM]: [],
    [TaskPriority.LOW]: []
  };
  
  tasks.forEach(task => {
    grouped[task.priority].push(task);
  });
  
  return grouped;
}
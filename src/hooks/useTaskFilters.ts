/**
 * Task Filters Hook
 * 
 * Custom hook for filtering tasks based on filter criteria.
 * Implements the filter logic from TASK_SYSTEM_DESIGN.md Section 4.2
 */

import { useMemo } from 'react';
import { Task, TaskFilters } from '../types/task';
import { isOverdue } from '../utils/taskUtils';

/**
 * Apply filters to task array
 * @param tasks - Array of tasks
 * @param filters - Filter configuration
 * @returns Filtered tasks array
 */
export function useTaskFilters(tasks: Task[], filters: TaskFilters): Task[] {
  return useMemo(() => {
    if (!tasks || tasks.length === 0) return [];
    
    // Bolt Optimization: Convert filter arrays to Sets outside the loop
    // to replace O(K) array lookups with O(1) hash map lookups.
    const hasCategories = filters.categories.length > 0;
    const categorySet = hasCategories ? new Set(filters.categories) : null;

    const hasPriorities = filters.priorities.length > 0;
    const prioritySet = hasPriorities ? new Set(filters.priorities) : null;

    const query = filters.searchQuery ? filters.searchQuery.trim().toLowerCase() : '';

    return tasks.filter(task => {
      // Status filter (all/active/completed)
      if (filters.status === 'active' && task.completed) {
        return false;
      }
      if (filters.status === 'completed' && !task.completed) {
        return false;
      }
      
      // Category filter (O(1) Set lookup)
      if (hasCategories && !categorySet!.has(task.category)) {
        return false;
      }
      
      // Priority filter (O(1) Set lookup)
      if (hasPriorities && !prioritySet!.has(task.priority)) {
        return false;
      }
      
      // Overdue filter
      if (filters.showOverdue) {
        if (!task.deadline || !isOverdue(task.deadline)) {
          return false;
        }
      }
      
      // Search query filter
      if (query !== '') {
        const textMatch = task.text.toLowerCase().includes(query);
        const categoryMatch = task.category.toLowerCase().includes(query);
        if (!textMatch && !categoryMatch) {
          return false;
        }
      }
      
      return true;
    });
  }, [tasks, filters]);
}

/**
 * Get unique categories from tasks
 * @param tasks - Array of tasks
 * @returns Array of unique categories with counts
 */
export function useTaskCategories(tasks: Task[]): { category: string; count: number }[] {
  return useMemo(() => {
    const counts: Record<string, number> = {};
    
    tasks.forEach(task => {
      const cat = task.category;
      counts[cat] = (counts[cat] || 0) + 1;
    });
    
    return Object.entries(counts)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count);
  }, [tasks]);
}

/**
 * Get task counts by status
 * @param tasks - Array of tasks
 * @returns Status counts object
 */
export function useTaskStatusCounts(tasks: Task[]): { all: number; active: number; completed: number; overdue: number } {
  return useMemo(() => {
    // Bolt Optimization: Replaced O(3N) chained filters with a single O(N) pass
    // to prevent intermediate array garbage collection and redundant Date instantiations.
    const counts = { all: tasks.length, active: 0, completed: 0, overdue: 0 };

    // Cache current date string to prevent redundant instantiations within loop
    const today = new Date().toISOString().split('T')[0];

    for (const task of tasks) {
      if (task.completed) {
        counts.completed++;
      } else {
        counts.active++;
        if (task.deadline && task.deadline < today) {
          counts.overdue++;
        }
      }
    }

    return counts;
  }, [tasks]);
}

export default useTaskFilters;
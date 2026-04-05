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
    
    return tasks.filter(task => {
      // Status filter (all/active/completed)
      if (filters.status === 'active' && task.completed) {
        return false;
      }
      if (filters.status === 'completed' && !task.completed) {
        return false;
      }
      
      // Category filter (multiple selection)
      if (filters.categories.length > 0 && !filters.categories.includes(task.category)) {
        return false;
      }
      
      // Priority filter (multiple selection)
      if (filters.priorities.length > 0 && !filters.priorities.includes(task.priority)) {
        return false;
      }
      
      // Overdue filter
      if (filters.showOverdue) {
        if (!task.deadline || !isOverdue(task.deadline)) {
          return false;
        }
      }
      
      // Search query filter
      if (filters.searchQuery && filters.searchQuery.trim() !== '') {
        const query = filters.searchQuery.toLowerCase();
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
    return {
      all: tasks.length,
      active: tasks.filter(t => !t.completed).length,
      completed: tasks.filter(t => t.completed).length,
      overdue: tasks.filter(t => !t.completed && isOverdue(t.deadline)).length
    };
  }, [tasks]);
}

export default useTaskFilters;
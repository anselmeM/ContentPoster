/**
 * Task Sort Hook
 * 
 * Custom hook for sorting tasks based on sort configuration.
 * Implements the sort logic from TASK_SYSTEM_DESIGN.md Section 4.3
 */

import { useMemo } from 'react';
import { Task, TaskSortConfig } from '../types/task';
import { getPriorityOrder, compareDates } from '../utils/taskUtils';

/**
 * Sort tasks based on configuration
 * @param tasks - Array of tasks
 * @param sort - Sort configuration
 * @returns Sorted tasks (new array, non-mutating)
 */
export function useTaskSort(tasks: Task[], sort: TaskSortConfig): Task[] {
  return useMemo(() => {
    if (!tasks || tasks.length === 0) return [];
    
    return [...tasks].sort((a, b) => {
      let comparison = 0;
      
      switch (sort.field) {
        case 'deadline':
          comparison = compareDates(a.deadline, b.deadline);
          if (sort.direction === 'desc') {
            if (!a.deadline && !b.deadline) return 0;
            if (!a.deadline) return 1;
            if (!b.deadline) return -1;
            comparison = -comparison;
          }
          break;
          
        case 'priority':
          comparison = getPriorityOrder(a.priority) - getPriorityOrder(b.priority);
          break;
          
        case 'createdAt':
          comparison = a.createdAt - b.createdAt;
          break;
          
        case 'text':
          comparison = a.text.localeCompare(b.text);
          break;
          
        default:
          comparison = 0;
      }
      
      if (sort.field === 'deadline' && sort.direction === 'desc') {
        return comparison;
      }

      return sort.direction === 'asc' ? comparison : -comparison;
    });
  }, [tasks, sort]);
}

/**
 * Get available sort options
 */
export const SORT_OPTIONS = [
  { value: 'createdAt-desc', label: 'Newest First', field: 'createdAt' as const, direction: 'desc' as const },
  { value: 'createdAt-asc', label: 'Oldest First', field: 'createdAt' as const, direction: 'asc' as const },
  { value: 'deadline-asc', label: 'Due Date (Soonest)', field: 'deadline' as const, direction: 'asc' as const },
  { value: 'deadline-desc', label: 'Due Date (Latest)', field: 'deadline' as const, direction: 'desc' as const },
  { value: 'priority-desc', label: 'Priority (High to Low)', field: 'priority' as const, direction: 'desc' as const },
  { value: 'priority-asc', label: 'Priority (Low to High)', field: 'priority' as const, direction: 'asc' as const },
  { value: 'text-asc', label: 'Name (A-Z)', field: 'text' as const, direction: 'asc' as const },
  { value: 'text-desc', label: 'Name (Z-A)', field: 'text' as const, direction: 'desc' as const }
] as const;

/**
 * Parse sort option value to config
 * @param value - Sort option value
 * @returns TaskSortConfig
 */
export function parseSortOption(value: string): TaskSortConfig {
  const option = SORT_OPTIONS.find(o => o.value === value);
  if (option) {
    return { field: option.field, direction: option.direction };
  }
  return { field: 'createdAt', direction: 'desc' };
}

/**
 * Get current sort option value
 * @param sort - Sort configuration
 * @returns Sort option value string
 */
export function getSortOptionValue(sort: TaskSortConfig): string {
  const option = SORT_OPTIONS.find(
    o => o.field === sort.field && o.direction === sort.direction
  );
  return option?.value || 'createdAt-desc';
}

export default useTaskSort;
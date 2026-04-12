/**
 * Task Context - State Management for Task System
 * 
 * React Context for managing task state, filters, and operations.
 * Implements the context architecture from TASK_SYSTEM_DESIGN.md Section 4.1
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Task,
  TaskFilters,
  TaskSortConfig,
  TaskStats,
  TaskCategory,
  TaskPriority,
  DEFAULT_FILTERS,
  DEFAULT_SORT,
  TaskCreateInput,
  TaskUpdateInput
} from '../types/task';
import { taskService } from '../services/taskService';
import { calculateStats } from '../utils/taskUtils';
import { toast } from '../services/notifications';

// ============================================================================
// Types
// ============================================================================

interface TaskContextValue {
  // Data
  tasks: Task[];
  filteredTasks: Task[];
  
  // Loading states
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  
  // Filters & Sort
  filters: TaskFilters;
  sort: TaskSortConfig;
  setFilters: (filters: TaskFilters) => void;
  setSort: (sort: TaskSortConfig) => void;
  resetFilters: () => void;
  
  // Stats
  stats: TaskStats;
  
  // Actions
  createTask: (input: TaskCreateInput) => Promise<Task | null>;
  updateTask: (taskId: string, updates: TaskUpdateInput) => Promise<boolean>;
  deleteTask: (taskId: string) => Promise<boolean>;
  toggleTask: (taskId: string) => Promise<boolean>;
  bulkDelete: (taskIds: string[]) => Promise<boolean>;
  bulkComplete: (taskIds: string[]) => Promise<boolean>;
  
  // Selection
  selectedIds: Set<string>;
  isSelecting: boolean;
  toggleSelect: (taskId: string) => void;
  selectAll: () => void;
  clearSelection: () => void;
  
  // UI State
  editingTaskId: string | null;
  setEditingTaskId: (id: string | null) => void;
}

// ============================================================================
// Context
// ============================================================================

const TaskContext = createContext<TaskContextValue | null>(null);

// ============================================================================
// Provider Component
// ============================================================================

interface TaskProviderProps {
  userId: string | null;
  children: React.ReactNode;
}

export function TaskProvider({ userId, children }: TaskProviderProps) {
  // State
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Filters & Sort
  const [filters, setFilters] = useState<TaskFilters>(DEFAULT_FILTERS);
  const [sort, setSort] = useState<TaskSortConfig>(DEFAULT_SORT);
  
  // Selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  // UI State
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  
  // Ref for unsubscribe
  const unsubscribeRef = useRef<(() => void) | null>(null);
  
  // Track completed tasks count for milestone detection
  const completedTasksRef = useRef<Set<string>>(new Set());
  
  // Subscribe to tasks
  useEffect(() => {
    if (!userId) {
      setTasks([]);
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    // Subscribe to real-time updates
    unsubscribeRef.current = taskService.subscribe(userId, (loadedTasks) => {
      setTasks(loadedTasks);
      setIsLoading(false);
      
      // Update completed tasks tracking for milestones
      loadedTasks.forEach(task => {
        if (task.completed) {
          completedTasksRef.current.add(task.id);
        } else {
          completedTasksRef.current.delete(task.id);
        }
      });
    });
    
    // Cleanup
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [userId]);
  
  // Filter tasks
  const filteredTasks = useMemo(() => {
    // Bolt Optimization: Replaced O(K*N) chained filters with a single O(N) pass
    // and converted condition arrays to Sets to prevent O(N*M) lookup complexity.
    const hasCategories = filters.categories.length > 0;
    const categorySet = hasCategories ? new Set(filters.categories) : null;
    
    const hasPriorities = filters.priorities.length > 0;
    const prioritySet = hasPriorities ? new Set(filters.priorities) : null;
    
    const query = filters.searchQuery ? filters.searchQuery.toLowerCase() : null;

    let result = tasks.filter(t => {
      // Status filter
      if (filters.status === 'active' && t.completed) return false;
      if (filters.status === 'completed' && !t.completed) return false;

      // Category filter
      if (hasCategories && categorySet && !categorySet.has(t.category)) return false;

      // Priority filter
      if (hasPriorities && prioritySet && !prioritySet.has(t.priority)) return false;

      // Search query
      if (query && !t.text.toLowerCase().includes(query)) return false;

      return true;
    });
    
    // Sort
    result.sort((a, b) => {
      let comparison = 0;
      
      switch (sort.field) {
        case 'deadline':
          if (!a.deadline && !b.deadline) comparison = 0;
          else if (!a.deadline) comparison = 1;
          else if (!b.deadline) comparison = -1;
          else comparison = new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
          break;
        case 'priority':
          const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
          comparison = (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
          break;
        case 'createdAt':
          comparison = b.createdAt - a.createdAt;
          break;
        case 'text':
          comparison = a.text.localeCompare(b.text);
          break;
      }
      
      return sort.direction === 'asc' ? comparison : -comparison;
    });
    
    return result;
  }, [tasks, filters, sort]);
  
  // Calculate stats
  const stats = useMemo(() => calculateStats(tasks), [tasks]);
  
  // Filter actions
  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, []);
  
  // CRUD actions with toast notifications
  const createTask = useCallback(async (input: TaskCreateInput): Promise<Task | null> => {
    if (!userId) return null;
    
    setIsSaving(true);
    setError(null);
    
    try {
      const task = await taskService.create(userId, input);
      toast.success('Task Created', `"${input.text.substring(0, 30)}${input.text.length > 30 ? '...' : ''}" has been added.`);
      return task;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create task');
      toast.error('Failed to Create Task', 'Please try again.');
      return null;
    } finally {
      setIsSaving(false);
    }
  }, [userId]);
  
  const updateTask = useCallback(async (taskId: string, updates: TaskUpdateInput): Promise<boolean> => {
    if (!userId) return false;
    
    setIsSaving(true);
    setError(null);
    
    try {
      await taskService.update(userId, taskId, updates);
      toast.success('Task Updated', 'Your changes have been saved.');
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update task');
      toast.error('Failed to Update Task', 'Please try again.');
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [userId]);
  
  const deleteTask = useCallback(async (taskId: string): Promise<boolean> => {
    if (!userId) return false;
    
    setIsSaving(true);
    setError(null);
    
    try {
      await taskService.delete(userId, taskId);
      // Clear selection if this was selected
      setSelectedIds(prev => {
        const next = new Set(prev);
        next.delete(taskId);
        return next;
      });
      toast.info('Task Deleted', 'The task has been removed.');
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete task');
      toast.error('Failed to Delete Task', 'Please try again.');
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [userId]);
  
  const toggleTask = useCallback(async (taskId: string): Promise<boolean> => {
    if (!userId) return false;
    
    // Find the task to determine if completing or uncompleting
    const task = tasks.find(t => t.id === taskId);
    const isCompleting = task && !task.completed;
    
    try {
      await taskService.toggleComplete(userId, taskId);
      
      if (isCompleting) {
        // Check for milestone celebration
        const newCompletedCount = completedTasksRef.current.size + 1;
        if (newCompletedCount === 10 || newCompletedCount === 25 || newCompletedCount === 50 || newCompletedCount === 100) {
          toast.success(
            '🎉 Milestone Reached!',
            `You've completed ${newCompletedCount} tasks! Keep up the great work!`
          );
        } else {
          toast.success('Task Completed', 'Great job! Keep going!');
        }
        completedTasksRef.current.add(taskId);
      } else {
        toast.info('Task Uncompleted', 'The task has been moved back to active.');
        completedTasksRef.current.delete(taskId);
      }
      
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to toggle task');
      toast.error('Failed to Update Task', 'Please try again.');
      return false;
    }
  }, [userId, tasks]);
  
  const bulkDelete = useCallback(async (taskIds: string[]): Promise<boolean> => {
    if (!userId || taskIds.length === 0) return false;
    
    setIsSaving(true);
    setError(null);
    
    try {
      await taskService.bulkDelete(userId, taskIds);
      setSelectedIds(new Set());
      const count = taskIds.length;
      toast.success(
        'Tasks Deleted',
        `${count} task${count > 1 ? 's' : ''} ${count > 1 ? 'have' : 'has'} been removed.`
      );
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete tasks');
      toast.error('Failed to Delete Tasks', 'Please try again.');
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [userId]);
  
  const bulkComplete = useCallback(async (taskIds: string[]): Promise<boolean> => {
    if (!userId || taskIds.length === 0) return false;
    
    try {
      await taskService.bulkUpdate(userId, taskIds, { completed: true, completedAt: Date.now() });
      setSelectedIds(new Set());
      const count = taskIds.length;
      
      // Check for milestone
      const newTotal = completedTasksRef.current.size + count;
      if (newTotal >= 10 && (newTotal - count) < 10) {
        toast.success(
          '🎉 Milestone Reached!',
          `You've completed ${newTotal} tasks! Amazing work!`
        );
      } else {
        toast.success(
          'Tasks Completed',
          `${count} task${count > 1 ? 's' : ''} marked as complete!`
        );
      }
      
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete tasks');
      toast.error('Failed to Complete Tasks', 'Please try again.');
      return false;
    }
  }, [userId]);
  
  // Selection actions
  const toggleSelect = useCallback((taskId: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  }, []);
  
  const selectAll = useCallback(() => {
    setSelectedIds(new Set(filteredTasks.map(t => t.id)));
  }, [filteredTasks]);
  
  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);
  
  // Context value
  const value = useMemo<TaskContextValue>(() => ({
    // Data
    tasks,
    filteredTasks,
    
    // Loading
    isLoading,
    isSaving,
    error,
    
    // Filters & Sort
    filters,
    sort,
    setFilters,
    setSort,
    resetFilters,
    
    // Stats
    stats,
    
    // Actions
    createTask,
    updateTask,
    deleteTask,
    toggleTask,
    bulkDelete,
    bulkComplete,
    
    // Selection
    selectedIds,
    isSelecting: selectedIds.size > 0,
    toggleSelect,
    selectAll,
    clearSelection,
    
    // UI State
    editingTaskId,
    setEditingTaskId
  }), [
    tasks, filteredTasks, isLoading, isSaving, error,
    filters, sort, resetFilters, stats,
    createTask, updateTask, deleteTask, toggleTask, bulkDelete, bulkComplete,
    selectedIds, toggleSelect, selectAll, clearSelection,
    editingTaskId
  ]);
  
  return (
    <TaskContext.Provider value={value}>
      {children}
    </TaskContext.Provider>
  );
}

// ============================================================================
// Hook
// ============================================================================

export function useTasks(): TaskContextValue {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error('useTasks must be used within a TaskProvider');
  }
  return context;
}

// ============================================================================
// Consumer Component (for class components)
// ============================================================================

export class TaskConsumer extends React.Component<{ children: (value: TaskContextValue) => React.ReactNode }> {
  render() {
    return (
      <TaskContext.Consumer>
        {this.props.children}
      </TaskContext.Consumer>
    );
  }
}

export default TaskProvider;

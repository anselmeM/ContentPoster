/**
 * Task Management System - Type Definitions
 * 
 * This module defines all TypeScript interfaces and enums for the task system.
 * Following the design specification from TASK_SYSTEM_DESIGN.md
 */

import { Timestamp } from 'firebase/firestore';

/**
 * Task priority levels
 */
export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

/**
 * Task category enumeration
 */
export enum TaskCategory {
  GENERAL = 'general',
  DESIGN = 'design',
  DEVELOPMENT = 'development',
  CONTENT = 'content',
  REVIEW = 'review',
  RESEARCH = 'research',
  DEPLOYMENT = 'deployment'
}

/**
 * Priority display configuration
 */
export const PRIORITY_CONFIG: Record<TaskPriority, {
  label: string;
  color: string;
  bgColor: string;
  icon: string;
  order: number;
}> = {
  [TaskPriority.URGENT]: {
    label: 'Urgent',
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    icon: 'fa-exclamation-circle',
    order: 4
  },
  [TaskPriority.HIGH]: {
    label: 'High',
    color: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-100 dark:bg-orange-900/30',
    icon: 'fa-arrow-up',
    order: 3
  },
  [TaskPriority.MEDIUM]: {
    label: 'Medium',
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    icon: 'fa-minus',
    order: 2
  },
  [TaskPriority.LOW]: {
    label: 'Low',
    color: 'text-gray-600 dark:text-gray-400',
    bgColor: 'bg-gray-100 dark:bg-gray-800',
    icon: 'fa-arrow-down',
    order: 1
  }
};

/**
 * Category display configuration
 */
export const CATEGORY_CONFIG: Record<TaskCategory, {
  label: string;
  color: string;
  bgColor: string;
  icon: string;
}> = {
  [TaskCategory.GENERAL]: {
    label: 'General',
    color: 'text-indigo-600 dark:text-indigo-400',
    bgColor: 'bg-indigo-100 dark:bg-indigo-900/30',
    icon: 'fa-folder'
  },
  [TaskCategory.DESIGN]: {
    label: 'Design',
    color: 'text-pink-600 dark:text-pink-400',
    bgColor: 'bg-pink-100 dark:bg-pink-900/30',
    icon: 'fa-palette'
  },
  [TaskCategory.DEVELOPMENT]: {
    label: 'Development',
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    icon: 'fa-code'
  },
  [TaskCategory.CONTENT]: {
    label: 'Content',
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-100 dark:bg-amber-900/30',
    icon: 'fa-edit'
  },
  [TaskCategory.REVIEW]: {
    label: 'Review',
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-100 dark:bg-purple-900/30',
    icon: 'fa-search'
  },
  [TaskCategory.RESEARCH]: {
    label: 'Research',
    color: 'text-cyan-600 dark:text-cyan-400',
    bgColor: 'bg-cyan-100 dark:bg-cyan-900/30',
    icon: 'fa-flask'
  },
  [TaskCategory.DEPLOYMENT]: {
    label: 'Deployment',
    color: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-100 dark:bg-orange-900/30',
    icon: 'fa-rocket'
  }
};

/**
 * Task entity representing a single task item
 */
export interface Task {
  id: string;
  text: string;
  completed: boolean;
  category: TaskCategory;
  priority: TaskPriority;
  deadline: string | null;       // ISO 8601 date string
  assignedTo: string | null;     // User ID
  createdAt: number;              // Unix timestamp
  updatedAt: number;              // Unix timestamp
  completedAt: number | null;     // Unix timestamp
  userId: string;                // Owner user ID
}

/**
 * Filter state for task list
 */
export interface TaskFilters {
  status: 'all' | 'active' | 'completed';
  categories: TaskCategory[];
  priorities: TaskPriority[];
  searchQuery: string;
  showOverdue: boolean;
}

/**
 * Default filter state
 */
export const DEFAULT_FILTERS: TaskFilters = {
  status: 'all',
  categories: [],
  priorities: [],
  searchQuery: '',
  showOverdue: false
};

/**
 * Sort configuration
 */
export interface TaskSortConfig {
  field: 'deadline' | 'priority' | 'createdAt' | 'text';
  direction: 'asc' | 'desc';
}

/**
 * Default sort configuration
 */
export const DEFAULT_SORT: TaskSortConfig = {
  field: 'createdAt',
  direction: 'desc'
};

/**
 * Statistics summary
 */
export interface TaskStats {
  total: number;
  active: number;
  completed: number;
  overdue: number;
  completionRate: number;
}

/**
 * Validation result
 */
export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

/**
 * Partial task for creation/update
 */
export type PartialTask = Partial<Omit<Task, 'id' | 'createdAt' | 'updatedAt'>>;

/**
 * Task creation input
 */
export interface TaskCreateInput {
  text: string;
  category?: TaskCategory;
  priority?: TaskPriority;
  deadline?: string | null;
  assignedTo?: string | null;
}

/**
 * Task update input
 */
export type TaskUpdateInput = Partial<Omit<Task, 'id' | 'userId' | 'createdAt'>>;

/**
 * Convert Firestore document to Task
 */
export function fromFirestoreDoc(doc: { id: string; data(): Record<string, unknown> }): Task {
  const data = doc.data();
  return {
    id: doc.id,
    text: data.text as string,
    completed: data.completed as boolean,
    category: data.category as TaskCategory,
    priority: data.priority as TaskPriority,
    deadline: data.deadline as string | null,
    assignedTo: data.assignedTo as string | null,
    createdAt: data.createdAt as number,
    updatedAt: data.updatedAt as number,
    completedAt: data.completedAt as number | null,
    userId: data.userId as string
  };
}

/**
 * Convert Task to Firestore document
 */
export function toFirestoreDoc(task: Partial<Task>): Record<string, unknown> {
  const doc: Record<string, unknown> = {};
  
  if (task.text !== undefined) doc.text = task.text;
  if (task.completed !== undefined) doc.completed = task.completed;
  if (task.category !== undefined) doc.category = task.category;
  if (task.priority !== undefined) doc.priority = task.priority;
  if (task.deadline !== undefined) doc.deadline = task.deadline;
  if (task.assignedTo !== undefined) doc.assignedTo = task.assignedTo;
  if (task.createdAt !== undefined) doc.createdAt = task.createdAt;
  if (task.updatedAt !== undefined) doc.updatedAt = task.updatedAt;
  if (task.completedAt !== undefined) doc.completedAt = task.completedAt;
  if (task.userId !== undefined) doc.userId = task.userId;
  
  return doc;
}
/**
 * Task Management System - Firebase Service
 * 
 * Dedicated service for task CRUD operations following the design specification.
 * Extends the basic tasksService from firebase.js with full feature support.
 */

import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  writeBatch,
  query,
  orderBy,
  limit,
  getDoc
} from 'firebase/firestore';
import { db } from './firebase';
import {
  Task,
  TaskCategory,
  TaskPriority,
  TaskCreateInput,
  TaskUpdateInput
} from '../types/task';

// Get app ID from environment or use default
const appId = import.meta.env.VITE_APP_ID || 'default-app-id';

/**
 * Get Firestore reference to user's tasks collection
 */
const getTasksRef = (userId: string) => 
  collection(db, 'artifacts', appId, 'users', userId, 'tasks');

/**
 * Task Service Interface
 */
export interface TaskService {
  /**
   * Subscribe to user's tasks in real-time
   * @param userId - User ID
   * @param callback - Callback with tasks array
   * @returns Unsubscribe function
   */
  subscribe: (userId: string, callback: (tasks: Task[]) => void) => () => void;
  
  /**
   * Create a new task
   * @param userId - User ID
   * @param taskData - Task creation data
   * @returns Created task with ID
   */
  create: (userId: string, taskData: TaskCreateInput) => Promise<Task>;
  
  /**
   * Update an existing task
   * @param userId - User ID
   * @param taskId - Task ID
   * @param updates - Partial task updates
   */
  update: (userId: string, taskId: string, updates: TaskUpdateInput) => Promise<void>;
  
  /**
   * Delete a task
   * @param userId - User ID
   * @param taskId - Task ID
   */
  delete: (userId: string, taskId: string) => Promise<void>;
  
  /**
   * Toggle task completion status
   * @param userId - User ID
   * @param taskId - Task ID
   */
  toggleComplete: (userId: string, taskId: string) => Promise<void>;
  
  /**
   * Bulk delete tasks
   * @param userId - User ID
   * @param taskIds - Array of task IDs
   */
  bulkDelete: (userId: string, taskIds: string[]) => Promise<void>;
  
  /**
   * Bulk update tasks (e.g., mark as complete)
   * @param userId - User ID
   * @param taskIds - Array of task IDs
   * @param updates - Updates to apply
   */
  bulkUpdate: (userId: string, taskIds: string[], updates: TaskUpdateInput) => Promise<void>;
}

/**
 * Task Service Implementation
 */
export const taskService: TaskService = {
  subscribe(userId, callback) {
    const tasksRef = getTasksRef(userId);
    const q = query(tasksRef, orderBy('createdAt', 'desc'));
    
    return onSnapshot(q, (snapshot) => {
      const tasks: Task[] = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          text: data.text as string || '',
          completed: data.completed as boolean || false,
          category: (data.category as TaskCategory) || TaskCategory.GENERAL,
          priority: (data.priority as TaskPriority) || TaskPriority.MEDIUM,
          deadline: data.deadline as string | null || null,
          assignedTo: data.assignedTo as string | null || null,
          createdAt: data.createdAt as number || Date.now(),
          updatedAt: data.updatedAt as number || Date.now(),
          completedAt: data.completedAt as number | null || null,
          userId: data.userId as string || userId
        } as Task;
      });
      callback(tasks);
    }, (error) => {
      console.error('Task subscription error:', error);
      callback([]);
    });
  },
  
  async create(userId, taskData) {
    const now = Date.now();
    const task = {
      text: taskData.text,
      completed: false,
      category: taskData.category || TaskCategory.GENERAL,
      priority: taskData.priority || TaskPriority.MEDIUM,
      deadline: taskData.deadline || null,
      assignedTo: taskData.assignedTo || null,
      userId,
      createdAt: now,
      updatedAt: now,
      completedAt: null
    };
    
    const tasksRef = getTasksRef(userId);
    const docRef = await addDoc(tasksRef, task);
    
    return {
      id: docRef.id,
      ...task
    } as Task;
  },
  
  async update(userId, taskId, updates) {
    const taskRef = doc(db, 'artifacts', appId, 'users', userId, 'tasks', taskId);
    await updateDoc(taskRef, {
      ...updates,
      updatedAt: Date.now()
    });
  },
  
  async delete(userId, taskId) {
    const taskRef = doc(db, 'artifacts', appId, 'users', userId, 'tasks', taskId);
    await deleteDoc(taskRef);
  },
  
  async toggleComplete(userId, taskId) {
    const taskRef = doc(db, 'artifacts', appId, 'users', userId, 'tasks', taskId);
    const snap = await getDoc(taskRef);
    
    if (!snap.exists()) {
      throw new Error('Task not found');
    }
    
    const currentData = snap.data();
    const completed = !currentData.completed;
    
    await updateDoc(taskRef, {
      completed,
      completedAt: completed ? Date.now() : null,
      updatedAt: Date.now()
    });
  },
  
  async bulkDelete(userId, taskIds) {
    if (taskIds.length === 0) return;
    
    const batch = writeBatch(db);
    
    taskIds.forEach(taskId => {
      const taskRef = doc(db, 'artifacts', appId, 'users', userId, 'tasks', taskId);
      batch.delete(taskRef);
    });
    
    await batch.commit();
  },
  
  async bulkUpdate(userId, taskIds, updates) {
    if (taskIds.length === 0) return;
    
    const batch = writeBatch(db);
    const now = Date.now();
    
    taskIds.forEach(taskId => {
      const taskRef = doc(db, 'artifacts', appId, 'users', userId, 'tasks', taskId);
      batch.update(taskRef, {
        ...updates,
        updatedAt: now
      });
    });
    
    await batch.commit();
  }
};

/**
 * Legacy support - re-export from firebase.js for backward compatibility
 * @deprecated Use taskService from this file instead
 */
export { tasksService as legacyTasksService } from './firebase';

export default taskService;
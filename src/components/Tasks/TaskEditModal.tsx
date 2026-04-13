/**
 * Task Edit Modal Component
 * 
 * Full-screen modal for editing task details.
 * Provides complete form functionality with delete option.
 * Following the design specification from TASK_SYSTEM_DESIGN.md Section 3.6
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Task, TaskCategory, TaskPriority, TaskCreateInput, PRIORITY_CONFIG, CATEGORY_CONFIG } from '../../types/task';
import { PrioritySelector } from '../UI/PriorityBadge';
import { CategorySelector } from '../UI/CategoryChip';
import { DatePicker } from '../UI/DatePicker';
import clsx from 'clsx';

interface TaskEditModalProps {
  task: Task;
  onSave: (taskId: string, updates: Partial<Task>) => void;
  onDelete: (taskId: string) => void;
  onClose: () => void;
}

/**
 * Task Edit Modal Component
 * 
 * @example
 * <TaskEditModal 
 *   task={taskToEdit}
 *   onSave={handleSave}
 *   onDelete={handleDelete}
 *   onClose={() => setEditingTask(null)}
 * />
 */
export function TaskEditModal({ task, onSave, onDelete, onClose }: TaskEditModalProps) {
  const [text, setText] = useState(task.text);
  const [category, setCategory] = useState<TaskCategory>(task.category);
  const [priority, setPriority] = useState<TaskPriority>(task.priority);
  const [deadline, setDeadline] = useState<string | null>(task.deadline);
  const [completed, setCompleted] = useState(task.completed);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  const modalRef = useRef<HTMLDivElement>(null);
  const textInputRef = useRef<HTMLInputElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  // Store the previously focused element and focus the modal
  useEffect(() => {
    previousActiveElement.current = document.activeElement as HTMLElement;
    textInputRef.current?.focus();
    textInputRef.current?.select();
    
    // Handle escape key
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !showDeleteConfirm) {
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleEscape);
    
    // Prevent body scroll
    document.body.style.overflow = 'hidden';
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
      // Restore focus
      previousActiveElement.current?.focus();
    };
  }, [onClose, showDeleteConfirm]);

  // Focus trap
  useEffect(() => {
    const modal = modalRef.current;
    if (!modal) return;

    const focusableElements = modal.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    modal.addEventListener('keydown', handleTabKey);
    
    return () => {
      modal.removeEventListener('keydown', handleTabKey);
    };
  }, [showDeleteConfirm]);

  // Handle save
  const handleSave = useCallback(() => {
    // Validate
    const newErrors: Record<string, string> = {};
    if (!text.trim()) {
      newErrors.text = 'Task text is required';
    } else if (text.length > 500) {
      newErrors.text = 'Task text must be 500 characters or less';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Build updates object
    const updates: Partial<Task> = {
      text: text.trim()
    };

    // Only include fields that changed
    if (category !== task.category) updates.category = category;
    if (priority !== task.priority) updates.priority = priority;
    if (deadline !== task.deadline) updates.deadline = deadline;
    if (completed !== task.completed) {
      updates.completed = completed;
      updates.completedAt = completed ? Date.now() : null;
    }

    onSave(task.id, updates);
  }, [text, category, priority, deadline, completed, task, onSave]);

  // Handle delete
  const handleDelete = useCallback(() => {
    if (showDeleteConfirm) {
      onDelete(task.id);
    } else {
      setShowDeleteConfirm(true);
    }
  }, [showDeleteConfirm, onDelete, task.id]);

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const charCount = text.length;
  const maxChars = 500;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="task-edit-title"
    >
      <div 
        ref={modalRef}
        className="w-full max-w-lg bg-white dark:bg-gray-800 rounded-xl shadow-2xl animate-scale-in overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 id="task-edit-title" className="text-lg font-semibold text-gray-900 dark:text-white">
            Edit Task
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            aria-label="Close modal"
          >
            <i className="fas fa-times" />
          </button>
        </div>

        {/* Form */}
        <div className="p-6 space-y-5">
          {/* Task Text */}
          <div className="space-y-1">
            <div className="relative">
              <textarea
                ref={textInputRef as React.RefObject<HTMLTextAreaElement>}
                value={text}
                onChange={(e) => {
                  setText(e.target.value);
                  if (errors.text) setErrors({ ...errors, text: '' });
                }}
                placeholder="What needs to be done?"
                rows={3}
                className={clsx(
                  'w-full px-4 py-3 rounded-lg resize-none',
                  'bg-gray-50 dark:bg-gray-700',
                  'border transition-colors',
                  errors.text
                    ? 'border-red-500 dark:border-red-500 focus:ring-red-500'
                    : 'border-gray-200 dark:border-gray-600 focus:ring-indigo-500',
                  'focus:outline-none focus:ring-2',
                  'text-gray-900 dark:text-white',
                  'placeholder-gray-400 dark:placeholder-gray-500'
                )}
                aria-invalid={errors.text ? 'true' : 'false'}
                aria-describedby={errors.text ? 'text-error' : undefined}
                maxLength={maxChars}
              />
              
              {/* Character count */}
              <div className="absolute right-3 bottom-3 flex items-center gap-1">
                <span className={clsx(
                  'text-xs tabular-nums',
                  charCount > maxChars - 50 
                    ? charCount > maxChars - 20 
                      ? 'text-red-500' 
                      : 'text-orange-500'
                    : 'text-gray-400'
                )}>
                  {charCount}/{maxChars}
                </span>
              </div>
            </div>
            
            {errors.text && (
              <p id="text-error" className="text-sm text-red-600 dark:text-red-400">
                {errors.text}
              </p>
            )}
          </div>

          {/* Category and Priority Row */}
          <div className="flex flex-wrap gap-4">
            {/* Category Selector */}
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Category
              </label>
              <CategorySelector 
                value={category} 
                onChange={setCategory}
              />
            </div>
            
            {/* Priority Selector */}
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Priority
              </label>
              <PrioritySelector 
                value={priority} 
                onChange={setPriority}
              />
            </div>
          </div>

          {/* Deadline Row */}
          <div className="max-w-xs">
            <DatePicker
              label="Deadline (optional)"
              value={deadline}
              onChange={setDeadline}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>

          {/* Completed Toggle */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setCompleted(!completed)}
              className={clsx(
                'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                completed ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-gray-600'
              )}
              role="switch"
              aria-checked={completed}
            >
              <span
                className={clsx(
                  'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                  completed ? 'translate-x-6' : 'translate-x-1'
                )}
              />
            </button>
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Mark as completed
            </span>
          </div>

          {/* Delete Confirmation */}
          {showDeleteConfirm && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
              <p className="text-sm text-red-800 dark:text-red-200 mb-3">
                Are you sure you want to delete this task? This action cannot be undone.
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleDelete}
                  className="px-3 py-1.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                >
                  Confirm Delete
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          {/* Delete Button */}
          <button
            type="button"
            onClick={handleDelete}
            className={clsx(
              'px-4 py-2 rounded-lg font-medium transition-colors',
              showDeleteConfirm
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20'
            )}
          >
            <i className={clsx('fas mr-2', showDeleteConfirm ? 'fa-exclamation-triangle' : 'fa-trash')} />
            {showDeleteConfirm ? 'Confirm Delete' : 'Delete Task'}
          </button>

          {/* Save/Cancel Buttons */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className={clsx(
                'px-6 py-2 rounded-lg font-medium',
                'bg-indigo-600 text-white',
                'hover:bg-indigo-700',
                'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500',
                'transition-colors duration-200'
              )}
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TaskEditModal;

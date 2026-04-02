/**
 * Task Form Component
 * 
 * Form for creating and editing tasks.
 * Following the design specification from TASK_SYSTEM_DESIGN.md Section 3.3
 */

import React, { useState, useEffect, useRef } from 'react';
import { TaskCategory, TaskPriority, TaskCreateInput, PRIORITY_CONFIG, CATEGORY_CONFIG } from '../../types/task';
import { PrioritySelector } from '../UI/PriorityBadge';
import { CategorySelector } from '../UI/CategoryChip';
import { DatePicker } from '../UI/DatePicker';
import clsx from 'clsx';

interface TaskFormProps {
  onSubmit: (input: TaskCreateInput) => void;
  onCancel: () => void;
  initialValues?: Partial<{
    text: string;
    category: TaskCategory;
    priority: TaskPriority;
    deadline: string | null;
  }>;
  isEditing?: boolean;
  className?: string;
}

/**
 * Task Form Component
 * 
 * @example
 * // Create mode
 * <TaskForm onSubmit={handleCreate} onCancel={() => setShowForm(false)} />
 * 
 * // Edit mode
 * <TaskForm 
 *   onSubmit={handleUpdate} 
 *   onCancel={() => setEditingTask(null)}
 *   initialValues={editingTask}
 *   isEditing
 * />
 */
export function TaskForm({ 
  onSubmit, 
  onCancel, 
  initialValues,
  isEditing = false,
  className 
}: TaskFormProps) {
  const [text, setText] = useState(initialValues?.text || '');
  const [category, setCategory] = useState<TaskCategory>(initialValues?.category || TaskCategory.GENERAL);
  const [priority, setPriority] = useState<TaskPriority>(initialValues?.priority || TaskPriority.MEDIUM);
  const [deadline, setDeadline] = useState<string | null>(initialValues?.deadline || null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isExpanded, setIsExpanded] = useState(isEditing);
  
  const textInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  
  // Focus on text input when form opens
  useEffect(() => {
    if (isExpanded || isEditing) {
      textInputRef.current?.focus();
    }
  }, [isExpanded, isEditing]);
  
  // Handle submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
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
    
    // Submit
    onSubmit({
      text: text.trim(),
      category,
      priority,
      deadline
    });
    
    // Reset form if not editing
    if (!isEditing) {
      setText('');
      setCategory(TaskCategory.GENERAL);
      setPriority(TaskPriority.MEDIUM);
      setDeadline(null);
      setErrors({});
      setIsExpanded(false);
    }
  };
  
  // Handle keydown
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onCancel();
    }
  };
  
  // Character count
  const charCount = text.length;
  const maxChars = 500;
  
  return (
    <div className={clsx('bg-white dark:bg-gray-800 rounded-lg shadow-sm', className)}>
      {/* Compact add button (when not expanded) */}
      {!isExpanded && !isEditing && (
        <button
          type="button"
          onClick={() => setIsExpanded(true)}
          className={clsx(
            'w-full flex items-center gap-3 px-4 py-3',
            'text-gray-500 dark:text-gray-400',
            'hover:bg-gray-50 dark:hover:bg-gray-700/50',
            'transition-colors duration-200',
            'border border-dashed border-gray-300 dark:border-gray-600 rounded-lg'
          )}
        >
          <i className="fas fa-plus text-indigo-500" aria-hidden="true" />
          <span>Add a new task...</span>
          <span className="ml-auto text-xs text-gray-400">Press Enter ↵</span>
        </button>
      )}
      
      {/* Expanded form */}
      {(isExpanded || isEditing) && (
        <form 
          ref={formRef}
          onSubmit={handleSubmit}
          onKeyDown={handleKeyDown}
          className="p-4 space-y-4"
        >
          {/* Task Text Input */}
          <div className="space-y-1">
            <div className="relative">
              <input
                ref={textInputRef}
                type="text"
                value={text}
                onChange={(e) => {
                  setText(e.target.value);
                  if (errors.text) setErrors({ ...errors, text: '' });
                }}
                placeholder="What needs to be done?"
                className={clsx(
                  'w-full px-4 py-3 rounded-lg',
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
                aria-describedby={errors.text ? 'text-error' : 'text-hint'}
                maxLength={maxChars}
              />
              
              {/* Character count */}
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
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
            
            <p id="text-hint" className="text-xs text-gray-500 dark:text-gray-400">
              Press Enter ↵ to add, Escape to cancel
            </p>
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
          
          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            {!isEditing && (
              <button
                type="button"
                onClick={() => {
                  setIsExpanded(false);
                  setText('');
                  setErrors({});
                }}
                className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              >
                Cancel
              </button>
            )}
            
            <button
              type="submit"
              className={clsx(
                'px-6 py-2 rounded-lg font-medium',
                'bg-indigo-600 text-white',
                'hover:bg-indigo-700',
                'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500',
                'transition-colors duration-200'
              )}
            >
              {isEditing ? 'Update Task' : 'Add Task'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

/**
 * Inline task form (compact single-line version)
 */
interface InlineTaskFormProps {
  onSubmit: (text: string) => void;
  onCancel: () => void;
  placeholder?: string;
  className?: string;
}

export function InlineTaskForm({ 
  onSubmit, 
  onCancel,
  placeholder = 'Add a task...',
  className 
}: InlineTaskFormProps) {
  const [text, setText] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    inputRef.current?.focus();
  }, []);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim()) {
      onSubmit(text.trim());
      setText('');
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onCancel();
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className={className}>
      <input
        ref={inputRef}
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={clsx(
          'w-full px-4 py-3 rounded-lg',
          'bg-gray-50 dark:bg-gray-700',
          'border border-indigo-300 dark:border-indigo-600',
          'focus:outline-none focus:ring-2 focus:ring-indigo-500',
          'text-gray-900 dark:text-white',
          'placeholder-gray-400 dark:placeholder-gray-500'
        )}
      />
    </form>
  );
}

export default TaskForm;
/**
 * Task Item Component
 * 
 * Displays an individual task with all properties, actions, and states.
 * Following the design specification from TASK_SYSTEM_DESIGN.md Section 3.4
 */

import React, { useState, useRef, useEffect } from 'react';
import { Task, TaskCategory, TaskPriority, PRIORITY_CONFIG, CATEGORY_CONFIG } from '../../types/task';
import { PriorityBadge } from '../UI/PriorityBadge';
import { CategoryChip } from '../UI/CategoryChip';
import { DateDisplay } from '../UI/DatePicker';
import { isOverdue } from '../../utils/taskUtils';
import clsx from 'clsx';

interface TaskItemProps {
  task: Task;
  isSelected?: boolean;
  isEditing?: boolean;
  onToggle: (id: string, completed: boolean) => void;
  onEdit: (id: string) => void;
  onSave: (id: string, text: string) => void;
  onDelete: (id: string) => void;
  onSelect?: (id: string) => void;
  className?: string;
}

/**
 * Task Item Component
 * 
 * @example
 * <TaskItem 
 *   task={task}
 *   isSelected={selectedIds.has(task.id)}
 *   onToggle={toggleTask}
 *   onEdit={setEditingTaskId}
 *   onSave={updateTask}
 *   onDelete={deleteTask}
 *   onSelect={toggleSelect}
 * />
 */
export const TaskItem = React.memo(function TaskItem({
  task, 
  isSelected = false,
  isEditing = false,
  onToggle, 
  onEdit, 
  onSave, 
  onDelete,
  onSelect,
  className 
}: TaskItemProps) {
  const [editText, setEditText] = useState(task.text);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const editInputRef = useRef<HTMLInputElement>(null);
  const taskRef = useRef<HTMLDivElement>(null);
  
  // Focus input when entering edit mode
  useEffect(() => {
    if (isEditing && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [isEditing]);
  
  // Sync edit text with task text
  useEffect(() => {
    if (!isEditing) {
      setEditText(task.text);
    }
  }, [task.text, isEditing]);
  
  // Handle edit save
  const handleSaveEdit = () => {
    if (editText.trim() && editText !== task.text) {
      onSave(task.id, editText.trim());
    }
    onEdit(task.id); // Exit edit mode
  };
  
  // Handle edit cancel
  const handleCancelEdit = () => {
    setEditText(task.text);
    onEdit(task.id); // Exit edit mode
  };
  
  // Handle keydown in edit mode
  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancelEdit();
    }
  };
  
  // Handle delete confirmation
  const handleDeleteClick = () => {
    if (showDeleteConfirm) {
      onDelete(task.id);
      setShowDeleteConfirm(false);
    } else {
      setShowDeleteConfirm(true);
      // Auto-hide after 3 seconds
      setTimeout(() => setShowDeleteConfirm(false), 3000);
    }
  };
  
  // Check if overdue
  const taskIsOverdue = isOverdue(task.deadline, task.completed);
  
  // Priority and category configs
  const priorityConfig = PRIORITY_CONFIG[task.priority];
  const categoryConfig = CATEGORY_CONFIG[task.category];

  return (
    <div
      ref={taskRef}
      className={clsx(
        'group relative flex items-start gap-4 p-4 rounded-lg',
        'bg-white dark:bg-gray-800',
        'border transition-all duration-200',
        isSelected
          ? 'border-indigo-300 dark:border-indigo-700 ring-2 ring-indigo-200 dark:ring-indigo-800'
          : 'border-gray-100 dark:border-gray-700',
        'hover:border-gray-200 dark:hover:border-gray-600 hover:shadow-md',
        task.completed && 'opacity-75',
        className
      )}
      role="listitem"
      aria-label={`Task: ${task.text}, ${task.completed ? 'completed' : 'not completed'}`}
    >
      {/* Selection Checkbox */}
      {onSelect && (
        <div className="flex-shrink-0 pt-1">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onSelect?.(task.id)}
            className="w-5 h-5 rounded border-gray-300 dark:border-gray-600 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
            aria-label={`Select task: ${task.text}`}
          />
        </div>
      )}
      
      {/* Completion Toggle */}
      <button
        type="button"
        onClick={() => onToggle(task.id, task.completed)}
        className={clsx(
          'flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center',
          'transition-all duration-200 hover:scale-110',
          task.completed
            ? 'bg-green-500 border-green-500 text-white'
            : clsx(
                'border-gray-300 dark:border-gray-600',
                'hover:border-green-400 dark:hover:border-green-400',
                taskIsOverdue && 'border-red-400 dark:border-red-400'
              )
        )}
        aria-label={task.completed ? 'Mark as incomplete' : 'Mark as complete'}
      >
        {task.completed && (
          <i className="fas fa-check text-xs" aria-hidden="true" />
        )}
      </button>
      
      {/* Task Content */}
      <div className="flex-1 min-w-0">
        {/* Text Row */}
        <div className="flex items-start gap-3">
          {/* Edit Mode */}
          {isEditing ? (
            <input
              ref={editInputRef}
              type="text"
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              onKeyDown={handleEditKeyDown}
              onBlur={handleSaveEdit}
              className={clsx(
                'flex-1 px-3 py-1.5 rounded-lg',
                'bg-gray-50 dark:bg-gray-700',
                'border border-indigo-300 dark:border-indigo-600',
                'focus:outline-none focus:ring-2 focus:ring-indigo-500',
                'text-gray-900 dark:text-white'
              )}
              aria-label="Edit task text"
            />
          ) : (
            /* Display Mode */
            <button
              type="button"
              onClick={() => onEdit(task.id)}
              className={clsx(
                'flex-1 text-left text-base font-medium',
                'text-gray-900 dark:text-white',
                task.completed && 'line-through text-gray-500 dark:text-gray-400',
                'hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors'
              )}
              disabled={task.completed}
            >
              {task.text}
            </button>
          )}
        </div>
        
        {/* Metadata Row */}
        <div className="flex flex-wrap items-center gap-2 mt-2">
          {/* Category */}
          <CategoryChip category={task.category} size="sm" />
          
          {/* Priority */}
          <PriorityBadge priority={task.priority} size="sm" />
          
          {/* Deadline */}
          {task.deadline && (
            <DateDisplay date={task.deadline} className="text-xs" />
          )}
        </div>
      </div>
      
      {/* Actions (visible on hover or on mobile) */}
      <div className={clsx(
        'flex items-center gap-1 flex-shrink-0',
        'opacity-0 md:opacity-0 group-hover:opacity-100',
        'transition-opacity duration-200'
      )}>
        {/* Edit Button */}
        <button
          type="button"
          onClick={() => onEdit(task.id)}
          className={clsx(
            'p-2 rounded-lg',
            'text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400',
            'hover:bg-gray-100 dark:hover:bg-gray-700',
            'transition-colors'
          )}
          title="Edit task"
          aria-label="Edit task"
        >
          <i className="fas fa-pen text-sm" aria-hidden="true" />
        </button>
        
        {/* Delete Button */}
        <button
          type="button"
          onClick={handleDeleteClick}
          className={clsx(
            'p-2 rounded-lg transition-colors',
            showDeleteConfirm
              ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
              : 'text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700'
          )}
          title={showDeleteConfirm ? 'Click again to confirm delete' : 'Delete task'}
          aria-label={showDeleteConfirm ? 'Confirm delete' : 'Delete task'}
        >
          <i className={clsx('fas', showDeleteConfirm ? 'fa-trash' : 'fa-trash-alt', 'text-sm')} aria-hidden="true" />
        </button>
      </div>
      
      {/* Overdue indicator */}
      {taskIsOverdue && (
        <div className="absolute top-2 right-2">
          <span className="px-1.5 py-0.5 rounded-full bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 text-xs font-medium">
            Overdue
          </span>
        </div>
      )}
    </div>
  );
});

/**
 * Task Item Skeleton (loading state)
 */
export function TaskItemSkeleton({ className }: { className?: string }) {
  return (
    <div className={clsx('flex items-start gap-4 p-4 rounded-lg bg-white dark:bg-gray-800', className)}>
      <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
      <div className="flex-1 space-y-2">
        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-3/4" />
        <div className="flex gap-2">
          <div className="h-5 w-16 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
          <div className="h-5 w-16 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
        </div>
      </div>
    </div>
  );
}

export default TaskItem;
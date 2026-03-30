/**
 * Task List Component
 * 
 * Displays a list of task items with bulk selection and actions.
 * Following the design specification from TASK_SYSTEM_DESIGN.md Section 3.5
 */

import React from 'react';
import { Task } from '../../types/task';
import { TaskItem, TaskItemSkeleton } from './TaskItem';
import clsx from 'clsx';

interface TaskListProps {
  tasks: Task[];
  selectedIds: Set<string>;
  isLoading?: boolean;
  onToggleSelect: (id: string) => void;
  onSelectAll: () => void;
  onBulkDelete: () => void;
  onToggleTask: (id: string) => void;
  onEditTask: (id: string) => void;
  onSaveTask: (id: string, text: string) => void;
  onDeleteTask: (id: string) => void;
  editingTaskId?: string | null;
  emptyMessage?: string;
  className?: string;
}

/**
 * Task List Component
 * 
 * @example
 * <TaskList
 *   tasks={filteredTasks}
 *   selectedIds={selectedIds}
 *   onToggleSelect={toggleSelect}
 *   onSelectAll={selectAll}
 *   onBulkDelete={bulkDelete}
 *   onToggleTask={toggleTask}
 *   onEditTask={setEditingTaskId}
 *   onSaveTask={updateTask}
 *   onDeleteTask={deleteTask}
 * />
 */
export function TaskList({ 
  tasks, 
  selectedIds, 
  isLoading = false,
  onToggleSelect, 
  onSelectAll, 
  onBulkDelete,
  onToggleTask,
  onEditTask,
  onSaveTask,
  onDeleteTask,
  editingTaskId = null,
  emptyMessage = 'No tasks found',
  className 
}: TaskListProps) {
  const selectedCount = selectedIds.size;
  const allSelected = tasks.length > 0 && tasks.every(t => selectedIds.has(t.id));
  const someSelected = selectedCount > 0 && !allSelected;
  
  // Loading state
  if (isLoading) {
    return (
      <div className={clsx('space-y-3', className)} role="list" aria-label="Loading tasks">
        {[1, 2, 3].map(i => (
          <TaskItemSkeleton key={i} />
        ))}
      </div>
    );
  }
  
  // Empty state
  if (tasks.length === 0) {
    return (
      <div className={className}>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-20 h-20 mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-300 dark:text-gray-600">
            <i className="fas fa-clipboard-list text-3xl" />
          </div>
          <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-white">
            No tasks yet
          </h3>
          <p className="text-sm max-w-md text-gray-500 dark:text-gray-400">
            {emptyMessage}
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div className={className}>
      {/* Bulk Actions Bar */}
      {selectedCount > 0 && (
        <div 
          className={clsx(
            'mb-4 p-3 rounded-lg',
            'bg-indigo-50 dark:bg-indigo-900/30',
            'border border-indigo-200 dark:border-indigo-800',
            'flex items-center justify-between'
          )}
          role="alert"
          aria-live="polite"
        >
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-indigo-700 dark:text-indigo-300">
              {selectedCount} task{selectedCount !== 1 ? 's' : ''} selected
            </span>
            <button
              type="button"
              onClick={onSelectAll}
              className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              {allSelected ? 'Deselect all' : 'Select all'}
            </button>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onBulkDelete}
              className={clsx(
                'px-3 py-1.5 rounded-lg text-sm font-medium',
                'bg-red-600 text-white',
                'hover:bg-red-700',
                'transition-colors'
              )}
            >
              <i className="fas fa-trash-alt mr-1.5" aria-hidden="true" />
              Delete Selected
            </button>
            
            <button
              type="button"
              onClick={() => {
                // Clear selection
                selectedIds.forEach(id => onToggleSelect(id));
              }}
              className={clsx(
                'px-3 py-1.5 rounded-lg text-sm font-medium',
                'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400',
                'border border-gray-300 dark:border-gray-600',
                'hover:bg-gray-50 dark:hover:bg-gray-700',
                'transition-colors'
              )}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      
      {/* Task List */}
      <div 
        className="space-y-3"
        role="list"
        aria-label="Task list"
      >
        {tasks.map((task, index) => (
          <div 
            key={task.id}
            style={{ 
              animationDelay: `${index * 50}ms`,
              animation: 'fadeSlideIn 0.3s ease-out forwards'
            }}
          >
            <TaskItem
              task={task}
              isSelected={selectedIds.has(task.id)}
              isEditing={editingTaskId === task.id}
              onToggle={() => onToggleTask(task.id)}
              onEdit={() => onEditTask(task.id)}
              onSave={(text) => onSaveTask(task.id, text)}
              onDelete={() => onDeleteTask(task.id)}
              onSelect={() => onToggleSelect(task.id)}
            />
          </div>
        ))}
      </div>
      
      {/* List Summary */}
      <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
          Showing {tasks.length} task{tasks.length !== 1 ? 's' : ''}
          {selectedCount > 0 && ` • ${selectedCount} selected`}
        </p>
      </div>
    </div>
  );
}

/**
 * Compact Task List (for sidebar/inline usage)
 */
interface CompactTaskListProps {
  tasks: Task[];
  maxItems?: number;
  onToggleTask: (id: string) => void;
  className?: string;
}

export function CompactTaskList({ 
  tasks, 
  maxItems = 5,
  onToggleTask,
  className 
}: CompactTaskListProps) {
  const displayTasks = tasks.slice(0, maxItems);
  const hasMore = tasks.length > maxItems;
  
  return (
    <div className={clsx('space-y-2', className)}>
      {displayTasks.map(task => (
        <div 
          key={task.id}
          className={clsx(
            'flex items-center gap-2 p-2 rounded-lg',
            'hover:bg-gray-50 dark:hover:bg-gray-700',
            'transition-colors cursor-pointer'
          )}
          onClick={() => onToggleTask(task.id)}
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleTask(task.id);
            }}
            className={clsx(
              'flex-shrink-0 w-4 h-4 rounded border flex items-center justify-center',
              task.completed
                ? 'bg-green-500 border-green-500 text-white'
                : 'border-gray-300 dark:border-gray-600'
            )}
          >
            {task.completed && <i className="fas fa-check text-xs" />}
          </button>
          
          <span className={clsx(
            'flex-1 text-sm truncate',
            task.completed 
              ? 'text-gray-400 line-through' 
              : 'text-gray-700 dark:text-gray-300'
          )}>
            {task.text}
          </span>
        </div>
      ))}
      
      {hasMore && (
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center py-2">
          +{tasks.length - maxItems} more tasks
        </p>
      )}
    </div>
  );
}

export default TaskList;
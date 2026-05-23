/**
 * Priority Badge Component
 * 
 * Displays a colored badge with icon for task priority levels.
 * Following the design specification from TASK_SYSTEM_DESIGN.md Section 6.1
 */

import React from 'react';
import { TaskPriority, PRIORITY_CONFIG } from '../../types/task';
import clsx from 'clsx';

interface PriorityBadgeProps {
  priority: TaskPriority;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

/**
 * Priority Badge Component
 * 
 * @example
 * <PriorityBadge priority={TaskPriority.HIGH} />
 * <PriorityBadge priority={TaskPriority.URGENT} showLabel size="sm" />
 */
export function PriorityBadge({ 
  priority, 
  size = 'md',
  showLabel = false,
  className 
}: PriorityBadgeProps) {
  const config = PRIORITY_CONFIG[priority];
  
  const sizeClasses = {
    sm: 'px-1.5 py-0.5 text-xs',
    md: 'px-2 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base'
  };
  
  const iconSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };
  
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 rounded-full font-medium',
        config.bgColor,
        config.color,
        sizeClasses[size],
        className
      )}
      role="status"
      aria-label={`Priority: ${config.label}`}
    >
      <i className={clsx('fas', config.icon, iconSizes[size])} aria-hidden="true" />
      {showLabel && <span>{config.label}</span>}
    </span>
  );
}

/**
 * Compact priority indicator (dot only)
 */
export function PriorityDot({ priority, className }: { priority: TaskPriority; className?: string }) {
  const colors: Record<TaskPriority, string> = {
    [TaskPriority.URGENT]: 'bg-red-500',
    [TaskPriority.HIGH]: 'bg-orange-500',
    [TaskPriority.MEDIUM]: 'bg-blue-500',
    [TaskPriority.LOW]: 'bg-gray-400'
  };
  
  return (
    <span 
      className={clsx('w-2 h-2 rounded-full', colors[priority], className)}
      aria-hidden="true"
    />
  );
}

/**
 * Priority selector for forms (visual button group)
 */
interface PrioritySelectorProps {
  value: TaskPriority;
  onChange: (priority: TaskPriority) => void;
  className?: string;
}

export function PrioritySelector({ value, onChange, className }: PrioritySelectorProps) {
  return (
    <div className={clsx('flex gap-2', className)} role="radiogroup" aria-label="Select priority">
      {Object.values(TaskPriority).map((priority) => {
        const config = PRIORITY_CONFIG[priority];
        const isSelected = value === priority;
        
        return (
          <button
            key={priority}
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={() => onChange(priority)}
            className={clsx(
              'flex items-center gap-1.5 px-3 py-2 rounded-lg border-2 transition-all',
              'hover:scale-105 active:scale-95',
              isSelected
                ? clsx('border-current', config.bgColor)
                : 'border-transparent bg-gray-100 dark:bg-gray-700 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-600'
            )}
            style={isSelected ? { color: config.color.split('-')[1] ? undefined : undefined } : undefined}
          >
            <i className={clsx('fas', config.icon)} aria-hidden="true" />
            <span className="text-sm font-medium">{config.label}</span>
          </button>
        );
      })}
    </div>
  );
}

/**
 * Priority dropdown for forms
 */
interface PriorityDropdownProps {
  value: TaskPriority;
  onChange: (priority: TaskPriority) => void;
  className?: string;
  'data-testid'?: string;
}

export function PriorityDropdown({ value, onChange, className, 'data-testid': testId }: PriorityDropdownProps) {
  const config = PRIORITY_CONFIG[value];
  
  return (
    <div className={clsx('relative', className)}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as TaskPriority)}
        className={clsx(
          'w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600',
          'focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500',
          'dark:bg-gray-700 dark:text-white appearance-none cursor-pointer',
          config.color
        )}
        aria-label="Select priority"
        data-testid={testId}
      >
        {Object.values(TaskPriority).map((priority) => (
          <option key={priority} value={priority}>
            {PRIORITY_CONFIG[priority].label}
          </option>
        ))}
      </select>
      <div className={clsx(
        'absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none',
        config.color
      )}>
        <i className={clsx('fas', config.icon)} aria-hidden="true" />
      </div>
      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
        <i className="fas fa-chevron-down text-gray-400" aria-hidden="true" />
      </div>
    </div>
  );
}

export default PriorityBadge;
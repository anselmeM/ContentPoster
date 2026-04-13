/**
 * Task Stats Component
 * 
 * Displays summary statistics for the task list.
 * Following the design specification from TASK_SYSTEM_DESIGN.md Section 3.6
 */

import React from 'react';
import { TaskStats as TaskStatsType } from '../../types/task';
import clsx from 'clsx';

interface TaskStatsProps {
  stats: TaskStatsType;
  className?: string;
}

/**
 * Task Stats Component
 * 
 * @example
 * <TaskStats stats={stats} />
 */
export function TaskStats({ stats, className }: TaskStatsProps) {
  const { total, active, completed, overdue, completionRate } = stats;
  
  return (
    <div className={clsx('bg-white dark:bg-gray-800 rounded-lg p-4', className)}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Stats Pills */}
        <div className="flex flex-wrap items-center gap-3">
          <StatPill 
            label="Remaining" 
            value={active} 
            color="blue"
            icon="fa-tasks"
          />
          <StatPill 
            label="Completed" 
            value={completed} 
            color="green"
            icon="fa-check-circle"
          />
          {overdue > 0 && (
            <StatPill 
              label="Overdue" 
              value={overdue} 
              color="red"
              icon="fa-exclamation-circle"
              pulse
            />
          )}
        </div>
        
        {/* Progress Bar */}
        <div className="flex items-center gap-3 min-w-[200px]">
          <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div 
              className={clsx(
                'h-full transition-all duration-500 ease-out rounded-full',
                completionRate === 100 ? 'bg-green-500' : 'bg-indigo-500'
              )}
              style={{ width: `${completionRate}%` }}
              role="progressbar"
              aria-valuenow={completionRate}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`${completionRate}% complete`}
            />
          </div>
          <span className={clsx(
            'text-sm font-semibold tabular-nums',
            completionRate === 100 
              ? 'text-green-600 dark:text-green-400' 
              : 'text-gray-600 dark:text-gray-400'
          )}>
            {completionRate}%
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * Individual stat pill component
 */
interface StatPillProps {
  label: string;
  value: number;
  color?: 'blue' | 'green' | 'red' | 'gray';
  icon?: string;
  pulse?: boolean;
}

function StatPill({ label, value, color = 'gray', icon, pulse = false }: StatPillProps) {
  const colors: Record<string, { bg: string; text: string; dot: string }> = {
    blue: { bg: 'bg-blue-50 dark:bg-blue-900/30', text: 'text-blue-600 dark:text-blue-400', dot: 'bg-blue-500' },
    green: { bg: 'bg-green-50 dark:bg-green-900/30', text: 'text-green-600 dark:text-green-400', dot: 'bg-green-500' },
    red: { bg: 'bg-red-50 dark:bg-red-900/30', text: 'text-red-600 dark:text-red-400', dot: 'bg-red-500' },
    gray: { bg: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-600 dark:text-gray-400', dot: 'bg-gray-500' }
  };
  
  const { bg, text, dot } = colors[color];
  
  return (
    <div 
      className={clsx(
        'flex items-center gap-2 px-3 py-1.5 rounded-full',
        bg
      )}
    >
      {icon && (
        <i className={clsx('fas', icon, 'text-xs', text)} aria-hidden="true" />
      )}
      <span className={clsx('text-sm font-medium', text)}>
        {value}
      </span>
      <span className={clsx('text-sm', text.replace('600', '500').replace('400', '300'))}>
        {label}
      </span>
      {pulse && (
        <span className={clsx('w-2 h-2 rounded-full animate-pulse', dot)} />
      )}
    </div>
  );
}

/**
 * Compact stats for header/mobile
 */
interface CompactStatsProps {
  stats: TaskStatsType;
  className?: string;
}

export function CompactStats({ stats, className }: CompactStatsProps) {
  const { active, completed, overdue } = stats;
  
  return (
    <div className={clsx('flex items-center gap-4 text-sm', className)}>
      <span className="text-gray-600 dark:text-gray-400">
        <span className="font-semibold text-gray-900 dark:text-white">{active}</span> remaining
      </span>
      <span className="text-green-600 dark:text-green-400">
        <span className="font-semibold">{completed}</span> done
      </span>
      {overdue > 0 && (
        <span className="text-red-600 dark:text-red-400">
          <span className="font-semibold">{overdue}</span> overdue
        </span>
      )}
    </div>
  );
}

/**
 * Progress ring for visual representation
 */
interface ProgressRingProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
}

export function ProgressRing({ 
  percentage, 
  size = 60, 
  strokeWidth = 6,
  className 
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;
  
  return (
    <div className={clsx('relative inline-flex items-center justify-center', className)}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-gray-200 dark:text-gray-700"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={clsx(
            'transition-all duration-500',
            percentage === 100 
              ? 'text-green-500' 
              : 'text-indigo-500'
          )}
        />
      </svg>
      <span className="absolute text-xs font-semibold text-gray-600 dark:text-gray-400">
        {percentage}%
      </span>
    </div>
  );
}

export default TaskStats;
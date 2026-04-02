/**
 * Task Filters Component
 * 
 * Displays filter controls for task list (status tabs, category chips, priority dropdown).
 * Following the design specification from TASK_SYSTEM_DESIGN.md Section 3.5
 */

import React, { useState } from 'react';
import { 
  TaskFilters as TaskFiltersType, 
  TaskCategory, 
  TaskPriority, 
  CATEGORY_CONFIG, 
  PRIORITY_CONFIG,
  TaskStats as TaskStatsType
} from '../../types/task';
import { CategoryFilterChip } from '../UI/CategoryChip';
import clsx from 'clsx';

interface TaskFiltersProps {
  filters: TaskFiltersType;
  onChange: (filters: TaskFiltersType) => void;
  stats: TaskStatsType;
  className?: string;
}

/**
 * Task Filters Component
 * 
 * @example
 * <TaskFilters filters={filters} onChange={setFilters} stats={stats} />
 */
function TaskFilters({ filters, onChange, stats, className }: TaskFiltersProps) {
  const [showPriorityDropdown, setShowPriorityDropdown] = useState(false);
  
  // Handle status tab change
  const handleStatusChange = (status: 'all' | 'active' | 'completed') => {
    onChange({ ...filters, status });
  };
  
  // Handle category toggle
  const handleCategoryToggle = (category: TaskCategory) => {
    const newCategories = filters.categories.includes(category)
      ? filters.categories.filter(c => c !== category)
      : [...filters.categories, category];
    onChange({ ...filters, categories: newCategories });
  };
  
  // Handle priority toggle
  const handlePriorityToggle = (priority: TaskPriority) => {
    const newPriorities = filters.priorities.includes(priority)
      ? filters.priorities.filter(p => p !== priority)
      : [...filters.priorities, priority];
    onChange({ ...filters, priorities: newPriorities });
  };
  
  // Handle overdue toggle
  const handleOverdueToggle = () => {
    onChange({ ...filters, showOverdue: !filters.showOverdue });
  };
  
  // Handle search change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...filters, searchQuery: e.target.value });
  };
  
  // Clear all filters
  const handleClearFilters = () => {
    onChange({
      status: 'all',
      categories: [],
      priorities: [],
      searchQuery: '',
      showOverdue: false
    });
  };
  
  // Count active filters
  const activeFilterCount = 
    (filters.status !== 'all' ? 1 : 0) +
    filters.categories.length +
    filters.priorities.length +
    (filters.showOverdue ? 1 : 0);
  
  return (
    <div className={clsx('space-y-4', className)}>
      {/* Status Tabs + Search Row */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Status Tabs */}
        <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          {[
            { key: 'all', label: 'All', count: stats.total },
            { key: 'active', label: 'Active', count: stats.active },
            { key: 'completed', label: 'Completed', count: stats.completed }
          ].map(tab => (
            <button
              key={tab.key}
              type="button"
              onClick={() => handleStatusChange(tab.key as 'all' | 'active' | 'completed')}
              className={clsx(
                'px-4 py-2 rounded-md text-sm font-medium transition-all',
                filters.status === tab.key
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              )}
              aria-current={filters.status === tab.key ? 'true' : undefined}
            >
              {tab.label}
              <span className={clsx(
                'ml-1.5 px-1.5 py-0.5 rounded-full text-xs',
                filters.status === tab.key
                  ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400'
                  : 'bg-gray-200 dark:bg-gray-600'
              )}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>
        
        {/* Search Input */}
        <div className="relative flex-1 max-w-xs">
          <input
            type="search"
            value={filters.searchQuery}
            onChange={handleSearchChange}
            placeholder="Search tasks..."
            className={clsx(
              'w-full pl-10 pr-4 py-2 rounded-lg',
              'bg-white dark:bg-gray-800',
              'border border-gray-200 dark:border-gray-700',
              'text-gray-900 dark:text-white',
              'placeholder-gray-400 dark:placeholder-gray-500',
              'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500'
            )}
            aria-label="Search tasks"
          />
          <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden="true" />
        </div>
      </div>
      
      {/* Category Chips + Priority + Overdue Row */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Category Chips */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Category:</span>
          {Object.values(TaskCategory).map(category => (
            <CategoryFilterChip
              key={category}
              category={category}
              selected={filters.categories.includes(category)}
              onToggle={() => handleCategoryToggle(category)}
            />
          ))}
        </div>
        
        {/* Divider */}
        <div className="hidden md:block w-px h-6 bg-gray-200 dark:bg-gray-700" />
        
        {/* Priority Filter Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowPriorityDropdown(!showPriorityDropdown)}
            className={clsx(
              'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium',
              'border transition-all',
              filters.priorities.length > 0
                ? 'border-indigo-300 dark:border-indigo-700 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'
            )}
            aria-expanded={showPriorityDropdown}
          >
            <i className="fas fa-flag" aria-hidden="true" />
            <span>Priority</span>
            {filters.priorities.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-indigo-500 text-white text-xs">
                {filters.priorities.length}
              </span>
            )}
            <i className="fas fa-chevron-down text-xs" aria-hidden="true" />
          </button>
          
          {showPriorityDropdown && (
            <div className="absolute top-full left-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-20">
              {Object.values(TaskPriority).map(priority => {
                const config = PRIORITY_CONFIG[priority];
                const isSelected = filters.priorities.includes(priority);
                
                return (
                  <button
                    key={priority}
                    type="button"
                    onClick={() => handlePriorityToggle(priority)}
                    className={clsx(
                      'w-full flex items-center gap-3 px-4 py-2 text-sm text-left',
                      'hover:bg-gray-50 dark:hover:bg-gray-700',
                      isSelected && 'bg-indigo-50 dark:bg-indigo-900/30'
                    )}
                  >
                    <i className={clsx('fas', config.icon, config.color)} aria-hidden="true" />
                    <span className={clsx('flex-1', config.color)}>{config.label}</span>
                    {isSelected && (
                      <i className="fas fa-check text-indigo-500" aria-hidden="true" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
        
        {/* Overdue Toggle */}
        <button
          type="button"
          onClick={handleOverdueToggle}
          className={clsx(
            'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium',
            'border transition-all',
            filters.showOverdue
              ? 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400'
              : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'
          )}
        >
          <i className="fas fa-exclamation-circle" aria-hidden="true" />
          <span>Overdue</span>
          {stats.overdue > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-red-500 text-white text-xs">
              {stats.overdue}
            </span>
          )}
        </button>
        
        {/* Clear Filters */}
        {activeFilterCount > 0 && (
          <button
            type="button"
            onClick={handleClearFilters}
            className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
          >
            <i className="fas fa-times" aria-hidden="true" />
            <span>Clear ({activeFilterCount})</span>
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Sort Dropdown Component
 */
interface SortDropdownProps {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  className?: string;
}

export function SortDropdown({ value, onChange, options, className }: SortDropdownProps) {
  return (
    <div className={clsx('relative', className)}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={clsx(
          'pl-10 pr-8 py-2 rounded-lg appearance-none',
          'bg-white dark:bg-gray-800',
          'border border-gray-200 dark:border-gray-700',
          'text-gray-700 dark:text-gray-300',
          'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500',
          'cursor-pointer'
        )}
        aria-label="Sort tasks"
      >
        {options.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <i className="fas fa-sort absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden="true" />
      <i className="fas fa-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" aria-hidden="true" />
    </div>
  );
}

export default TaskFilters;

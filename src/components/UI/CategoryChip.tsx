/**
 * Category Chip Component
 * 
 * Displays a pill-shaped chip for task categories.
 * Following the design specification from TASK_SYSTEM_DESIGN.md Section 6.1
 */

import React from 'react';
import { TaskCategory, CATEGORY_CONFIG } from '../../types/task';
import clsx from 'clsx';

interface CategoryChipProps {
  category: TaskCategory;
  size?: 'sm' | 'md';
  onClick?: () => void;
  onRemove?: () => void;
  selected?: boolean;
  className?: string;
}

/**
 * Category Chip Component
 * 
 * @example
 * <CategoryChip category={TaskCategory.DESIGN} />
 * <CategoryChip category={TaskCategory.DEVELOPMENT} onRemove={() => {}} />
 * <CategoryChip category={TaskCategory.CONTENT} selected onClick={() => {}} />
 */
export function CategoryChip({ 
  category, 
  size = 'md',
  onClick,
  onRemove,
  selected = false,
  className 
}: CategoryChipProps) {
  const config = CATEGORY_CONFIG[category];
  
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm'
  };
  
  const Component = onClick ? 'button' : 'span';
  
  return (
    <Component
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={clsx(
        'inline-flex items-center gap-1 rounded-full font-medium transition-all',
        config.bgColor,
        config.color,
        sizeClasses[size],
        onClick && 'hover:opacity-80 cursor-pointer',
        selected && 'ring-2 ring-offset-1 ring-current',
        className
      )}
      aria-pressed={onClick ? selected : undefined}
      aria-label={`Category: ${config.label}`}
    >
      <i className={clsx('fas', config.icon, size === 'sm' ? 'text-xs' : 'text-xs')} aria-hidden="true" />
      <span>{config.label}</span>
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="ml-1 -mr-0.5 p-0.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10"
          aria-label={`Remove ${config.label} filter`}
        >
          <i className="fas fa-times text-xs" />
        </button>
      )}
    </Component>
  );
}

/**
 * Category filter chip (toggleable)
 */
interface CategoryFilterChipProps {
  category: TaskCategory;
  count?: number;
  selected: boolean;
  onToggle: () => void;
  className?: string;
}

export function CategoryFilterChip({ 
  category, 
  count,
  selected,
  onToggle,
  className 
}: CategoryFilterChipProps) {
  const config = CATEGORY_CONFIG[category];
  
  return (
    <button
      type="button"
      onClick={onToggle}
      className={clsx(
        'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-medium transition-all',
        'border-2',
        selected
          ? clsx('border-current', config.bgColor)
          : 'border-gray-200 dark:border-gray-700 bg-transparent hover:bg-gray-50 dark:hover:bg-gray-800',
        config.color,
        className
      )}
      aria-pressed={selected}
    >
      <i className={clsx('fas', config.icon)} aria-hidden="true" />
      <span>{config.label}</span>
      {count !== undefined && (
        <span className={clsx(
          'ml-1 px-1.5 py-0.5 rounded-full text-xs',
          selected ? 'bg-white/30' : 'bg-gray-100 dark:bg-gray-700'
        )}>
          {count}
        </span>
      )}
    </button>
  );
}

/**
 * Category selector for forms (visual button group)
 */
interface CategorySelectorProps {
  value: TaskCategory;
  onChange: (category: TaskCategory) => void;
  className?: string;
}

export function CategorySelector({ value, onChange, className }: CategorySelectorProps) {
  return (
    <div className={clsx('flex flex-wrap gap-2', className)} role="radiogroup" aria-label="Select category">
      {Object.values(TaskCategory).map((category) => {
        const config = CATEGORY_CONFIG[category];
        const isSelected = value === category;
        
        return (
          <button
            key={category}
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={() => onChange(category)}
            className={clsx(
              'flex items-center gap-1.5 px-3 py-2 rounded-lg border-2 transition-all',
              'hover:scale-105 active:scale-95',
              isSelected
                ? clsx('border-current', config.bgColor)
                : 'border-transparent bg-gray-100 dark:bg-gray-700 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-600',
              config.color
            )}
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
 * Category dropdown for forms
 */
interface CategoryDropdownProps {
  value: TaskCategory;
  onChange: (category: TaskCategory) => void;
  className?: string;
}

export function CategoryDropdown({ value, onChange, className }: CategoryDropdownProps) {
  const config = CATEGORY_CONFIG[value];
  
  return (
    <div className={clsx('relative', className)}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as TaskCategory)}
        className={clsx(
          'w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600',
          'focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500',
          'dark:bg-gray-700 dark:text-white appearance-none cursor-pointer',
          config.color
        )}
        aria-label="Select category"
      >
        {Object.values(TaskCategory).map((category) => (
          <option key={category} value={category}>
            {CATEGORY_CONFIG[category].label}
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

export default CategoryChip;
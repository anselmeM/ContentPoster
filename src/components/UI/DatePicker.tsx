/**
 * Date Picker Component
 * 
 * A styled date input with optional clear functionality.
 * Following the design specification from TASK_SYSTEM_DESIGN.md Section 6.1
 */

import React, { useState } from 'react';
import clsx from 'clsx';

interface DatePickerProps {
  value: string | null;
  onChange: (date: string | null) => void;
  min?: string;
  max?: string;
  placeholder?: string;
  label?: string;
  error?: string;
  className?: string;
}

/**
 * Date Picker Component
 * 
 * @example
 * <DatePicker 
 *   value={deadline} 
 *   onChange={(date) => setDeadline(date)}
 *   min="2024-01-01"
 * />
 */
export function DatePicker({ 
  value, 
  onChange, 
  min,
  max,
  placeholder = 'Select date',
  label,
  error,
  className 
}: DatePickerProps) {
  const [isFocused, setIsFocused] = useState(false);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value || null;
    onChange(newValue);
  };
  
  const handleClear = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onChange(null);
  };
  
  // Format display value
  const displayValue = value 
    ? new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : '';
  
  return (
    <div className={clsx('relative', className)}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {label}
        </label>
      )}
      
      <div className="relative">
        <input
          type="date"
          value={value || ''}
          onChange={handleChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          min={min}
          max={max}
          className={clsx(
            'w-full px-3 py-2 rounded-lg border',
            'bg-white dark:bg-gray-700',
            'text-gray-900 dark:text-white',
            'placeholder-gray-400 dark:placeholder-gray-500',
            'transition-colors duration-200',
            'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500',
            error
              ? 'border-red-500 dark:border-red-500'
              : 'border-gray-300 dark:border-gray-600',
            value && 'pr-10'
          )}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? 'date-error' : undefined}
        />
        
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
          <i className="fas fa-calendar" aria-hidden="true" />
        </div>
        
        {value && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-10 top-1/2 -translate-y-1/2 p-1 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600"
            aria-label="Clear date"
          >
            <i className="fas fa-times text-sm" />
          </button>
        )}
      </div>
      
      {error && (
        <p id="date-error" className="mt-1 text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}

/**
 * Inline date display with formatted output
 */
interface DateDisplayProps {
  date: string | null;
  format?: 'short' | 'medium' | 'long';
  className?: string;
}

export function DateDisplay({ date, format = 'medium', className }: DateDisplayProps) {
  if (!date) return null;
  
  const dateObj = new Date(date);
  const now = new Date();
  const isToday = dateObj.toDateString() === now.toDateString();
  
  // Check if tomorrow
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const isTomorrow = dateObj.toDateString() === tomorrow.toDateString();
  
  // Check if overdue
  const isOverdue = dateObj < now && !isToday;
  
  const formats: Record<string, Intl.DateTimeFormatOptions> = {
    short: { month: 'short', day: 'numeric' },
    medium: { month: 'short', day: 'numeric', year: 'numeric' },
    long: { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' }
  };
  
  // Special display for today/tomorrow
  let displayText = dateObj.toLocaleDateString('en-US', formats[format]);
  if (isToday) displayText = 'Today';
  if (isTomorrow) displayText = 'Tomorrow';
  
  return (
    <span 
      className={clsx(
        'inline-flex items-center gap-1 text-sm',
        isOverdue 
          ? 'text-red-600 dark:text-red-400 font-medium' 
          : 'text-gray-500 dark:text-gray-400',
        className
      )}
    >
      <i className={clsx('fas', isOverdue ? 'fa-exclamation-circle' : 'fa-calendar')} aria-hidden="true" />
      <span>{displayText}</span>
    </span>
  );
}

/**
 * Date range picker
 */
interface DateRangePickerProps {
  startDate: string | null;
  endDate: string | null;
  onStartDateChange: (date: string | null) => void;
  onEndDateChange: (date: string | null) => void;
  className?: string;
}

export function DateRangePicker({ 
  startDate, 
  endDate, 
  onStartDateChange, 
  onEndDateChange,
  className 
}: DateRangePickerProps) {
  return (
    <div className={clsx('flex items-center gap-2', className)}>
      <div className="flex-1">
        <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">From</label>
        <DatePicker 
          value={startDate}
          onChange={onStartDateChange}
          max={endDate || undefined}
        />
      </div>
      <div className="flex items-center justify-center pt-5">
        <i className="fas fa-arrow-right text-gray-400" aria-hidden="true" />
      </div>
      <div className="flex-1">
        <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">To</label>
        <DatePicker 
          value={endDate}
          onChange={onEndDateChange}
          min={startDate || undefined}
        />
      </div>
    </div>
  );
}

export default DatePicker;
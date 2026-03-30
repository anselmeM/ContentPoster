/**
 * TaskStats Component Tests
 * 
 * Integration tests for TaskStats component including rendering, stat calculations, and visual states.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TaskStats } from '../components/Tasks/TaskStats';
import { TaskStats as TaskStatsType } from '../types/task';

describe('TaskStats', () => {
  const defaultStats: TaskStatsType = {
    total: 10,
    active: 6,
    completed: 4,
    overdue: 0,
    completionRate: 40
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render all stat pills', () => {
      render(<TaskStats stats={defaultStats} />);
      
      expect(screen.getByText('Remaining')).toBeInTheDocument();
      expect(screen.getByText('Completed')).toBeInTheDocument();
    });

    it('should render progress bar', () => {
      render(<TaskStats stats={defaultStats} />);
      
      const progressBar = screen.getByTestId('progress-bar');
      expect(progressBar).toBeInTheDocument();
    });

    it('should render completion percentage', () => {
      render(<TaskStats stats={defaultStats} />);
      
      expect(screen.getByText('40%')).toBeInTheDocument();
    });

    it('should not render overdue pill when overdue is 0', () => {
      render(<TaskStats stats={defaultStats} />);
      
      expect(screen.queryByText('Overdue')).not.toBeInTheDocument();
    });

    it('should render overdue pill when overdue > 0', () => {
      const statsWithOverdue = { ...defaultStats, overdue: 2 };
      render(<TaskStats stats={statsWithOverdue} />);
      
      expect(screen.getByText('Overdue')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
    });
  });

  describe('stat values', () => {
    it('should display correct active count', () => {
      render(<TaskStats stats={defaultStats} />);
      
      // Find the element containing "6" for remaining
      expect(screen.getByText('6')).toBeInTheDocument();
    });

    it('should display correct completed count', () => {
      render(<TaskStats stats={defaultStats} />);
      
      // There should be a "4" for completed
      const completedElements = screen.getAllByText('4');
      expect(completedElements.length).toBeGreaterThan(0);
    });

    it('should display 100% when all tasks completed', () => {
      const allCompletedStats: TaskStatsType = {
        total: 5,
        active: 0,
        completed: 5,
        overdue: 0,
        completionRate: 100
      };
      
      render(<TaskStats stats={allCompletedStats} />);
      
      expect(screen.getByText('100%')).toBeInTheDocument();
    });

    it('should display 0% when no tasks completed', () => {
      const noCompletedStats: TaskStatsType = {
        total: 5,
        active: 5,
        completed: 0,
        overdue: 0,
        completionRate: 0
      };
      
      render(<TaskStats stats={noCompletedStats} />);
      
      expect(screen.getByText('0%')).toBeInTheDocument();
    });
  });

  describe('progress bar', () => {
    it('should have correct width based on completion rate', () => {
      render(<TaskStats stats={defaultStats} />);
      
      const progressFill = screen.getByTestId('progress-fill');
      expect(progressFill).toHaveStyle({ width: '40%' });
    });

    it('should have green color at 100% completion', () => {
      const allCompletedStats: TaskStatsType = {
        total: 5,
        active: 0,
        completed: 5,
        overdue: 0,
        completionRate: 100
      };
      
      render(<TaskStats stats={allCompletedStats} />);
      
      const progressFill = screen.getByTestId('progress-fill');
      expect(progressFill).toHaveClass(/bg-green/);
    });

    it('should have indigo color when not at 100%', () => {
      render(<TaskStats stats={defaultStats} />);
      
      const progressFill = screen.getByTestId('progress-fill');
      expect(progressFill).toHaveClass(/bg-indigo/);
    });
  });

  describe('visual states', () => {
    it('should have pulse animation on overdue pill', () => {
      const statsWithOverdue = { ...defaultStats, overdue: 2 };
      render(<TaskStats stats={statsWithOverdue} />);
      
      const overduePill = screen.getByText('Overdue').closest('div');
      expect(overduePill).toHaveClass(/animate-pulse/);
    });

    it('should apply custom className', () => {
      render(<TaskStats stats={defaultStats} className="custom-class" />);
      
      const container = screen.getByTestId('task-stats-container');
      expect(container).toHaveClass('custom-class');
    });
  });

  describe('edge cases', () => {
    it('should handle zero total tasks', () => {
      const emptyStats: TaskStatsType = {
        total: 0,
        active: 0,
        completed: 0,
        overdue: 0,
        completionRate: 0
      };
      
      render(<TaskStats stats={emptyStats} />);
      
      expect(screen.getByText('0%')).toBeInTheDocument();
    });

    it('should handle decimal completion rate', () => {
      const decimalStats: TaskStatsType = {
        total: 3,
        active: 2,
        completed: 1,
        overdue: 0,
        completionRate: 33.33
      };
      
      render(<TaskStats stats={decimalStats} />);
      
      expect(screen.getByText('33.33%')).toBeInTheDocument();
    });

    it('should handle large numbers', () => {
      const largeStats: TaskStatsType = {
        total: 1000,
        active: 500,
        completed: 500,
        overdue: 10,
        completionRate: 50
      };
      
      render(<TaskStats stats={largeStats} />);
      
      expect(screen.getByText('500')).toBeInTheDocument(); // active
      expect(screen.getByText('10')).toBeInTheDocument(); // overdue
    });
  });

  describe('accessibility', () => {
    it('should have proper role attributes', () => {
      render(<TaskStats stats={defaultStats} />);
      
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toBeInTheDocument();
    });

    it('should have aria-valuenow on progress bar', () => {
      render(<TaskStats stats={defaultStats} />);
      
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '40');
    });

    it('should have aria-valuemin and aria-valuemax', () => {
      render(<TaskStats stats={defaultStats} />);
      
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuemin', '0');
      expect(progressBar).toHaveAttribute('aria-valuemax', '100');
    });

    it('should have proper labels for screen readers', () => {
      render(<TaskStats stats={defaultStats} />);
      
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-label');
    });
  });
});

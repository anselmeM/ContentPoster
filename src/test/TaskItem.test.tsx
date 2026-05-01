/**
 * TaskItem Component Tests
 * 
 * Integration tests for TaskItem component including rendering, interactions, and states.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TaskItem } from '../components/Tasks/TaskItem';
import { Task, TaskCategory, TaskPriority } from '../types/task';

// Mock sub-components
vi.mock('../components/UI/PriorityBadge', () => ({
  PriorityBadge: ({ priority, ...props }: any) => (
    <span data-testid="priority-badge" data-priority={priority} {...props}>
      {priority}
    </span>
  )
}));

vi.mock('../components/UI/CategoryChip', () => ({
  CategoryChip: ({ category, ...props }: any) => (
    <span data-testid="category-chip" data-category={category} {...props}>
      {category}
    </span>
  )
}));

vi.mock('../components/UI/DatePicker', () => ({
  DateDisplay: ({ date }: any) => (
    <span data-testid="date-display">{date || 'No deadline'}</span>
  )
}));

vi.mock('../utils/taskUtils', () => ({
  isOverdue: vi.fn((deadline) => {
    if (!deadline) return false;
    return new Date(deadline) < new Date();
  })
}));

const now = Date.now();

const createMockTask = (overrides: Partial<Task> = {}): Task => ({
  id: 'task-1',
  userId: 'user-1',
  text: 'Test task text',
  completed: false,
  category: TaskCategory.GENERAL,
  priority: TaskPriority.MEDIUM,
  deadline: null,
  createdAt: now,
  updatedAt: now,
  completedAt: null,
  assignedTo: null,
  ...overrides
});

describe('TaskItem', () => {
  const defaultProps = {
    task: createMockTask(),
    onToggle: vi.fn(),
    onEdit: vi.fn(),
    onSave: vi.fn(),
    onDelete: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render task text', () => {
      render(<TaskItem {...defaultProps} />);
      
      expect(screen.getByText('Test task text')).toBeInTheDocument();
    });

    it('should render priority badge', () => {
      render(<TaskItem {...defaultProps} task={createMockTask({ priority: TaskPriority.HIGH })} />);
      
      expect(screen.getByTestId('priority-badge')).toBeInTheDocument();
    });

    it('should render category chip', () => {
      render(<TaskItem {...defaultProps} />);
      
      expect(screen.getByTestId('category-chip')).toBeInTheDocument();
    });

    it('should render date display', () => {
      render(<TaskItem {...defaultProps} />);
      
      expect(screen.getByTestId('date-display')).toBeInTheDocument();
    });

    it('should render in uncompleted state by default', () => {
      render(<TaskItem {...defaultProps} task={createMockTask({ completed: false })} />);
      
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).not.toBeChecked();
    });

    it('should render in completed state when task is completed', () => {
      render(<TaskItem {...defaultProps} task={createMockTask({ completed: true })} />);
      
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toBeChecked();
    });

    it('should render in selected state when isSelected is true', () => {
      render(<TaskItem {...defaultProps} isSelected={true} />);
      
      const container = screen.getByTestId('task-item-container');
      expect(container).toHaveClass(/selected/);
    });
  });

  describe('checkbox interaction', () => {
    it('should call onToggle when checkbox is clicked', async () => {
      const user = userEvent.setup();
      render(<TaskItem {...defaultProps} />);
      
      const checkbox = screen.getByRole('checkbox');
      await user.click(checkbox);
      
      expect(defaultProps.onToggle).toHaveBeenCalledTimes(1);
    });

    it('should not be able to check when task is completed', async () => {
      const user = userEvent.setup();
      render(<TaskItem {...defaultProps} task={createMockTask({ completed: true })} />);
      
      const checkbox = screen.getByRole('checkbox');
      await user.click(checkbox);
      
      expect(defaultProps.onToggle).not.toHaveBeenCalled();
    });
  });

  describe('edit mode', () => {
    it('should enter edit mode when edit button is clicked', async () => {
      const user = userEvent.setup();
      render(<TaskItem {...defaultProps} />);
      
      const editButton = screen.getByTestId('edit-button');
      await user.click(editButton);
      
      expect(defaultProps.onEdit).toHaveBeenCalledTimes(1);
    });

    it('should show input field when isEditing is true', () => {
      render(<TaskItem {...defaultProps} isEditing={true} />);
      
      const input = screen.getByRole('textbox');
      expect(input).toBeInTheDocument();
      expect(input).toHaveValue('Test task text');
    });

    it('should call onSave when save button is clicked in edit mode', async () => {
      const user = userEvent.setup();
      const onEdit = vi.fn();
      render(<TaskItem 
        {...defaultProps} 
        isEditing={true} 
        onEdit={onEdit}
      />);
      
      const input = screen.getByRole('textbox');
      await user.clear(input);
      await user.type(input, 'Updated task text');
      
      const saveButton = screen.getByTestId('save-button');
      await user.click(saveButton);
      
      expect(defaultProps.onSave).toHaveBeenCalledWith(defaultProps.task.id, 'Updated task text');
    });

    it('should not save empty text', async () => {
      const user = userEvent.setup();
      render(<TaskItem {...defaultProps} isEditing={true} />);
      
      const input = screen.getByRole('textbox');
      await user.clear(input);
      
      const saveButton = screen.getByTestId('save-button');
      await user.click(saveButton);
      
      expect(defaultProps.onSave).not.toHaveBeenCalled();
    });
  });

  describe('delete interaction', () => {
    it('should show delete confirmation on delete button click', async () => {
      const user = userEvent.setup();
      render(<TaskItem {...defaultProps} />);
      
      const deleteButton = screen.getByTestId('delete-button');
      await user.click(deleteButton);
      
      const confirmButton = screen.getByTestId('confirm-delete-button');
      expect(confirmButton).toBeInTheDocument();
    });

    it('should call onDelete when delete is confirmed', async () => {
      const user = userEvent.setup();
      render(<TaskItem {...defaultProps} />);
      
      // First click delete button to show confirmation
      const deleteButton = screen.getByTestId('delete-button');
      await user.click(deleteButton);
      
      // Then click confirm delete
      const confirmButton = screen.getByTestId('confirm-delete-button');
      await user.click(confirmButton);
      
      expect(defaultProps.onDelete).toHaveBeenCalledTimes(1);
    });

    it('should cancel delete on cancel button click', async () => {
      const user = userEvent.setup();
      render(<TaskItem {...defaultProps} />);
      
      const deleteButton = screen.getByTestId('delete-button');
      await user.click(deleteButton);
      
      const cancelButton = screen.getByTestId('cancel-delete-button');
      await user.click(cancelButton);
      
      expect(defaultProps.onDelete).not.toHaveBeenCalled();
    });
  });

  describe('selection', () => {
    it('should call onSelect when clicked in selection mode', async () => {
      const user = userEvent.setup();
      const onSelect = vi.fn();
      render(<TaskItem {...defaultProps} onSelect={onSelect} />);
      
      const container = screen.getByTestId('task-item-container');
      await user.click(container);
      
      expect(onSelect).toHaveBeenCalledTimes(1);
    });

    it('should not call onSelect when clicking on interactive elements', async () => {
      const user = userEvent.setup();
      const onSelect = vi.fn();
      render(<TaskItem {...defaultProps} onSelect={onSelect} />);
      
      const checkbox = screen.getByRole('checkbox');
      await user.click(checkbox);
      
      expect(onSelect).not.toHaveBeenCalled();
    });
  });

  describe('keyboard interactions', () => {
    it('should handle Enter key to toggle completion', async () => {
      const user = userEvent.setup();
      render(<TaskItem {...defaultProps} />);
      
      const checkbox = screen.getByRole('checkbox');
      checkbox.focus();
      await user.keyboard('{Enter}');
      
      expect(defaultProps.onToggle).toHaveBeenCalledTimes(1);
    });

    it('should handle Escape key to exit edit mode', async () => {
      const user = userEvent.setup();
      const onEdit = vi.fn();
      render(<TaskItem {...defaultProps} isEditing={true} onEdit={onEdit} />);
      
      const input = screen.getByRole('textbox');
      await user.keyboard('{Escape}');
      
      expect(onEdit).toHaveBeenCalledWith(defaultProps.task.id);
    });
  });

  describe('visual states', () => {
    it('should apply completed class when task is completed', () => {
      render(<TaskItem {...defaultProps} task={createMockTask({ completed: true })} />);
      
      const textElement = screen.getByText('Test task text');
      expect(textElement).toHaveClass(/line-through/);
    });

    it('should show overdue styling when task is overdue', () => {
      const yesterday = new Date(Date.now() - 86400000).toISOString();
      render(<TaskItem {...defaultProps} task={createMockTask({ deadline: yesterday })} />);
      
      const dateDisplay = screen.getByTestId('date-display');
      expect(dateDisplay).toHaveClass(/text-red/);
    });
  });

  describe('accessibility', () => {
    it('should have proper role attributes', () => {
      render(<TaskItem {...defaultProps} />);
      
      expect(screen.getByRole('checkbox')).toBeInTheDocument();
    });

    it('should have aria-label on interactive elements', () => {
      render(<TaskItem {...defaultProps} />);
      
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toHaveAttribute('aria-label');
    });

    it('should have proper tabIndex for keyboard navigation', () => {
      render(<TaskItem {...defaultProps} />);
      
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toHaveAttribute('tabIndex');
    });
  });
});

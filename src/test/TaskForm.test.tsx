/**
 * TaskForm Component Tests
 * 
 * Integration tests for TaskForm component including form validation, submission, and interactions.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TaskForm } from '../components/Tasks/TaskForm';
import { TaskCategory, TaskPriority, TaskCreateInput } from '../types/task';

// Helper to wrap user-event actions in React's act() to suppress console warnings in React 18
const setupUser = () => {
  const user = userEvent.setup();
  return {
    click: async (element: HTMLElement) => {
      await act(async () => {
        await user.click(element);
      });
    },
    type: async (element: HTMLElement, text: string) => {
      await act(async () => {
        await user.type(element, text);
      });
    },
    selectOptions: async (element: HTMLElement, values: string | string[]) => {
      await act(async () => {
        await user.selectOptions(element, values);
      });
    },
    keyboard: async (text: string) => {
      await act(async () => {
        await user.keyboard(text);
      });
    }
  };
};

// Mock UI components
vi.mock('../components/UI/PriorityBadge', () => ({
  PrioritySelector: ({ value, onChange, ...props }: any) => (
    <div data-testid="priority-selector-visual" {...props} />
  ),
  PriorityDropdown: ({ value, onChange, ...props }: any) => (
    <select 
      data-testid="priority-selector" 
      value={value}
      onChange={(e: any) => onChange(e.target.value)}
      {...props}
    >
      <option value={TaskPriority.LOW}>Low</option>
      <option value={TaskPriority.MEDIUM}>Medium</option>
      <option value={TaskPriority.HIGH}>High</option>
      <option value={TaskPriority.URGENT}>Urgent</option>
    </select>
  )
}));

vi.mock('../components/UI/CategoryChip', () => ({
  CategorySelector: ({ value, onChange, ...props }: any) => (
    <div data-testid="category-selector-visual" {...props} />
  ),
  CategoryDropdown: ({ value, onChange, ...props }: any) => (
    <select 
      data-testid="category-selector" 
      value={value}
      onChange={(e: any) => onChange(e.target.value)}
      {...props}
    >
      <option value={TaskCategory.GENERAL}>General</option>
      <option value={TaskCategory.DESIGN}>Design</option>
      <option value={TaskCategory.DEVELOPMENT}>Development</option>
      <option value={TaskCategory.CONTENT}>Content</option>
      <option value={TaskCategory.REVIEW}>Review</option>
      <option value={TaskCategory.RESEARCH}>Research</option>
      <option value={TaskCategory.DEPLOYMENT}>Deployment</option>
    </select>
  )
}));

vi.mock('../components/UI/DatePicker', () => ({
  DatePicker: ({ value, onChange, ...props }: any) => (
    <input 
      type="date"
      data-testid="date-picker" 
      value={value || ''}
      onChange={(e: any) => onChange(e.target.value)}
      {...props}
    />
  )
}));

describe('TaskForm', () => {
  const defaultProps = {
    onSubmit: vi.fn(),
    onCancel: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render compact add button initially', () => {
      render(<TaskForm {...defaultProps} />);
      
      expect(screen.getByText(/add a new task/i)).toBeInTheDocument();
    });

    it('should render text input when expanded', async () => {
      const user = setupUser();
      render(<TaskForm {...defaultProps} />);
      
      await user.click(screen.getByText(/add a new task/i));
      expect(screen.getByTestId('task-text-input')).toBeInTheDocument();
    });

    it('should render priority selector when expanded', async () => {
      const user = setupUser();
      render(<TaskForm {...defaultProps} />);
      
      await user.click(screen.getByText(/add a new task/i));
      expect(screen.getByTestId('priority-selector')).toBeInTheDocument();
    });

    it('should render category selector when expanded', async () => {
      const user = setupUser();
      render(<TaskForm {...defaultProps} />);
      
      await user.click(screen.getByText(/add a new task/i));
      expect(screen.getByTestId('category-selector')).toBeInTheDocument();
    });

    it('should render date picker when expanded', async () => {
      const user = setupUser();
      render(<TaskForm {...defaultProps} />);
      
      await user.click(screen.getByText(/add a new task/i));
      expect(screen.getByTestId('date-picker')).toBeInTheDocument();
    });

    it('should render submit button when expanded', async () => {
      const user = setupUser();
      render(<TaskForm {...defaultProps} />);
      
      await user.click(screen.getByText(/add a new task/i));
      expect(screen.getByTestId('submit-button')).toBeInTheDocument();
    });

    it('should render cancel button when expanded', async () => {
      const user = setupUser();
      render(<TaskForm {...defaultProps} />);
      
      await user.click(screen.getByText(/add a new task/i));
      expect(screen.getByTestId('cancel-button')).toBeInTheDocument();
    });

    it('should render in create mode by default when expanded', async () => {
      const user = setupUser();
      render(<TaskForm {...defaultProps} />);
      
      await user.click(screen.getByText(/add a new task/i));
      expect(screen.getByTestId('submit-button')).toHaveTextContent(/add task/i);
    });

    it('should render in edit mode when isEditing is true', () => {
      render(<TaskForm {...defaultProps} isEditing={true} />);
      
      expect(screen.getByTestId('submit-button')).toHaveTextContent(/update task/i);
    });
  });

  describe('initial values', () => {
    it('should use initial values when provided', () => {
      const initialValues = {
        text: 'Initial task text',
        category: TaskCategory.DEVELOPMENT,
        priority: TaskPriority.HIGH,
        deadline: '2024-12-31'
      };
      
      render(<TaskForm {...defaultProps} initialValues={initialValues} isEditing={true} />);
      
      const textInput = screen.getByTestId('task-text-input');
      expect(textInput).toHaveValue('Initial task text');
      
      const prioritySelector = screen.getByTestId('priority-selector');
      expect(prioritySelector).toHaveValue(TaskPriority.HIGH);
      
      const categorySelector = screen.getByTestId('category-selector');
      expect(categorySelector).toHaveValue(TaskCategory.DEVELOPMENT);
      
      const datePicker = screen.getByTestId('date-picker');
      expect(datePicker).toHaveValue('2024-12-31');
    });

    it('should use defaults when no initial values provided', async () => {
      const user = setupUser();
      render(<TaskForm {...defaultProps} />);
      
      await user.click(screen.getByText(/add a new task/i));
      
      const textInput = screen.getByTestId('task-text-input');
      expect(textInput).toHaveValue('');
      
      const prioritySelector = screen.getByTestId('priority-selector');
      expect(prioritySelector).toHaveValue(TaskPriority.MEDIUM);
      
      const categorySelector = screen.getByTestId('category-selector');
      expect(categorySelector).toHaveValue(TaskCategory.GENERAL);
    });
  });

  describe('form interactions', () => {
    it('should update text when typing', async () => {
      const user = setupUser();
      render(<TaskForm {...defaultProps} />);
      
      await user.click(screen.getByText(/add a new task/i));
      
      const textInput = screen.getByTestId('task-text-input');
      await user.type(textInput, 'New task');
      
      expect(textInput).toHaveValue('New task');
    });

    it('should update priority when changed', async () => {
      const user = setupUser();
      render(<TaskForm {...defaultProps} />);
      
      await user.click(screen.getByText(/add a new task/i));
      
      const prioritySelector = screen.getByTestId('priority-selector');
      await user.selectOptions(prioritySelector, TaskPriority.HIGH);
      
      expect(prioritySelector).toHaveValue(TaskPriority.HIGH);
    });

    it('should update category when changed', async () => {
      const user = setupUser();
      render(<TaskForm {...defaultProps} />);
      
      await user.click(screen.getByText(/add a new task/i));
      
      const categorySelector = screen.getByTestId('category-selector');
      await user.selectOptions(categorySelector, TaskCategory.DEVELOPMENT);
      
      expect(categorySelector).toHaveValue(TaskCategory.DEVELOPMENT);
    });

    it('should update deadline when changed', async () => {
      const user = setupUser();
      render(<TaskForm {...defaultProps} />);
      
      await user.click(screen.getByText(/add a new task/i));
      
      const datePicker = screen.getByTestId('date-picker');
      await user.type(datePicker, '2024-12-25');
      
      expect(datePicker).toHaveValue('2024-12-25');
    });
  });

  describe('form submission', () => {
    it('should call onSubmit with correct data when form is submitted', async () => {
      const user = setupUser();
      const onSubmit = vi.fn();
      render(<TaskForm {...defaultProps} onSubmit={onSubmit} />);
      
      await user.click(screen.getByText(/add a new task/i));
      
      const textInput = screen.getByTestId('task-text-input');
      await user.type(textInput, 'Test task');
      
      const submitButton = screen.getByTestId('submit-button');
      await user.click(submitButton);
      
      expect(onSubmit).toHaveBeenCalledTimes(1);
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          text: 'Test task',
          category: TaskCategory.GENERAL,
          priority: TaskPriority.MEDIUM,
          deadline: null
        })
      );
    });

    it('should show validation error when submitting empty text', async () => {
      const user = setupUser();
      const onSubmit = vi.fn();
      render(<TaskForm {...defaultProps} onSubmit={onSubmit} />);
      
      await user.click(screen.getByText(/add a new task/i));
      
      const textInput = screen.getByTestId('task-text-input');
      // Leave empty and submit
      const submitButton = screen.getByTestId('submit-button');
      await user.click(submitButton);
      
      expect(onSubmit).not.toHaveBeenCalled();
      expect(screen.getByTestId('error-message')).toBeInTheDocument();
    });

    it('should clear form after successful submission in create mode', async () => {
      const user = setupUser();
      const onSubmit = vi.fn();
      render(<TaskForm {...defaultProps} onSubmit={onSubmit} />);
      
      await user.click(screen.getByText(/add a new task/i));
      
      const textInput = screen.getByTestId('task-text-input');
      await user.type(textInput, 'Test task');
      
      const submitButton = screen.getByTestId('submit-button');
      await user.click(submitButton);
      
      await waitFor(() => {
        // Form should be collapsed again
        expect(screen.getByText(/add a new task/i)).toBeInTheDocument();
      });
    });

    it('should not clear form after submission in edit mode', async () => {
      const user = setupUser();
      const onSubmit = vi.fn();
      const initialValues = {
        text: 'Existing task'
      };
      render(<TaskForm {...defaultProps} onSubmit={onSubmit} initialValues={initialValues} isEditing={true} />);
      
      const textInput = screen.getByTestId('task-text-input');
      const submitButton = screen.getByTestId('submit-button');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(textInput).toHaveValue('Existing task');
      });
    });
  });

  describe('cancel interaction', () => {
    it('should call onCancel when cancel button is clicked', async () => {
      const user = setupUser();
      const onCancel = vi.fn();
      render(<TaskForm {...defaultProps} onCancel={onCancel} />);
      
      await user.click(screen.getByText(/add a new task/i));
      
      const cancelButton = screen.getByTestId('cancel-button');
      await user.click(cancelButton);
      
      expect(onCancel).toHaveBeenCalledTimes(1);
    });
  });

  describe('validation', () => {
    it('should show error for empty text', async () => {
      const user = setupUser();
      render(<TaskForm {...defaultProps} />);
      
      await user.click(screen.getByText(/add a new task/i));
      
      // Don't enter any text and submit
      const submitButton = screen.getByTestId('submit-button');
      await user.click(submitButton);
      
      expect(screen.getByTestId('error-message')).toHaveTextContent(/required/i);
    });

    it('should show error for whitespace-only text', async () => {
      const user = setupUser();
      render(<TaskForm {...defaultProps} />);
      
      await user.click(screen.getByText(/add a new task/i));
      
      const textInput = screen.getByTestId('task-text-input');
      await user.type(textInput, '   ');
      
      const submitButton = screen.getByTestId('submit-button');
      await user.click(submitButton);
      
      expect(screen.getByTestId('error-message')).toBeInTheDocument();
    });

    it('should clear error when user starts typing', async () => {
      const user = setupUser();
      render(<TaskForm {...defaultProps} />);
      
      await user.click(screen.getByText(/add a new task/i));
      
      // Submit empty to trigger error
      const submitButton = screen.getByTestId('submit-button');
      await user.click(submitButton);
      
      expect(screen.getByTestId('error-message')).toBeInTheDocument();
      
      // Start typing
      const textInput = screen.getByTestId('task-text-input');
      await user.type(textInput, 'a');
      
      expect(screen.queryByTestId('error-message')).not.toBeInTheDocument();
    });
  });

  describe('keyboard interactions', () => {
    it('should submit form on Cmd/Ctrl+Enter', async () => {
      const user = setupUser();
      const onSubmit = vi.fn();
      render(<TaskForm {...defaultProps} onSubmit={onSubmit} />);
      
      await user.click(screen.getByText(/add a new task/i));
      
      const textInput = screen.getByTestId('task-text-input');
      await user.type(textInput, 'Test task{Meta}{Enter}');
      
      expect(onSubmit).toHaveBeenCalled();
    });

    it('should cancel form on Escape', async () => {
      const user = setupUser();
      const onCancel = vi.fn();
      render(<TaskForm {...defaultProps} onCancel={onCancel} />);
      
      await user.click(screen.getByText(/add a new task/i));
      
      const textInput = screen.getByTestId('task-text-input');
      await user.type(textInput, '{Escape}');
      
      expect(onCancel).toHaveBeenCalledTimes(1);
    });
  });

  describe('expanded state', () => {
    it('should show all fields when expanded', async () => {
      const user = setupUser();
      render(<TaskForm {...defaultProps} />);
      
      // Initially in collapsed state - form not visible
      expect(screen.queryByTestId('date-picker')).not.toBeInTheDocument();
      
      // Click expand button
      const addPlaceholder = screen.getByText(/add a new task/i);
      await user.click(addPlaceholder);
      
      // After clicking, the form should be expanded
      expect(screen.getByTestId('date-picker')).toBeInTheDocument();
    });
  });
});

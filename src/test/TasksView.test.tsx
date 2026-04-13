/**
 * TasksView Integration Tests
 * 
 * Integration tests for the TasksView component and full task management flow.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TasksView from '../components/Views/TasksView';
import { TaskProvider } from '../context/TaskContext';
import { Task, TaskCategory, TaskPriority } from '../types/task';

// Mock Firebase service
vi.mock('../services/firebase', () => ({
  tasksService: {
    subscribe: vi.fn((userId, callback) => {
      // Immediately call with empty array
      callback([]);
      // Return unsubscribe function
      return vi.fn();
    }),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    bulkDelete: vi.fn()
  }
}));

// Mock toast notifications
vi.mock('../services/notifications', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    show: vi.fn(),
    remove: vi.fn(),
    subscribe: vi.fn(() => vi.fn()),
  }
}));

// Mock AuthContext
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: { uid: 'test-user-id' }
  })
}));

// Helper to create mock task
const createMockTask = (overrides: Partial<Task> = {}): Task => ({
  id: 'task-1',
  userId: 'user-1',
  text: 'Test task',
  completed: false,
  category: TaskCategory.GENERAL,
  priority: TaskPriority.MEDIUM,
  deadline: null,
  createdAt: Date.now(),
  updatedAt: Date.now(),
  completedAt: null,
  assignedTo: null,
  ...overrides
});

const renderWithProvider = (ui: React.ReactElement) => {
  return render(
    <TaskProvider userId="test-user-id">
      {ui}
    </TaskProvider>
  );
};

describe('TasksView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render the tasks header', () => {
      renderWithProvider(<TasksView />);
      
      expect(screen.getByText('Tasks')).toBeInTheDocument();
    });

    it('should render the task form', () => {
      renderWithProvider(<TasksView />);
      
      expect(screen.getByPlaceholderText(/add a new task/i)).toBeInTheDocument();
    });

    it('should render stats section', () => {
      renderWithProvider(<TasksView />);
      
      expect(screen.getByText(/total/i)).toBeInTheDocument();
    });

    it('should render filter tabs', () => {
      renderWithProvider(<TasksView />);
      
      expect(screen.getByRole('tab', { name: /all/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /active/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /completed/i })).toBeInTheDocument();
    });
  });

  describe('task creation flow', () => {
    it('should expand form when clicking add task button', async () => {
      const user = userEvent.setup();
      renderWithProvider(<TasksView />);
      
      const addButton = screen.getByPlaceholderText(/add a new task/i);
      await user.click(addButton);
      
      // Form should now be visible
      expect(screen.getByLabelText(/category/i)).toBeInTheDocument();
    });

    it('should show validation error for empty task', async () => {
      const user = userEvent.setup();
      renderWithProvider(<TasksView />);
      
      // Click to expand form
      const addButton = screen.getByPlaceholderText(/add a new task/i);
      await user.click(addButton);
      
      // Submit without entering text
      const submitButton = screen.getByRole('button', { name: /add task/i });
      await user.click(submitButton);
      
      expect(screen.getByText(/task text is required/i)).toBeInTheDocument();
    });
  });

  describe('filter interactions', () => {
    it('should switch to active filter when clicked', async () => {
      const user = userEvent.setup();
      renderWithProvider(<TasksView />);
      
      const activeTab = screen.getByRole('tab', { name: /active/i });
      await user.click(activeTab);
      
      expect(activeTab).toHaveAttribute('aria-selected', 'true');
    });

    it('should switch to completed filter when clicked', async () => {
      const user = userEvent.setup();
      renderWithProvider(<TasksView />);
      
      const completedTab = screen.getByRole('tab', { name: /completed/i });
      await user.click(completedTab);
      
      expect(completedTab).toHaveAttribute('aria-selected', 'true');
    });
  });

  describe('empty states', () => {
    it('should show empty message when no tasks', () => {
      renderWithProvider(<TasksView />);
      
      expect(screen.getByText(/no tasks yet/i)).toBeInTheDocument();
    });

    it('should show no results message when filters return empty', async () => {
      const user = userEvent.setup();
      renderWithProvider(<TasksView />);
      
      // Click active filter
      const activeTab = screen.getByRole('tab', { name: /active/i });
      await user.click(activeTab);
      
      // Since there are no tasks, should still show the message
      expect(screen.getByText(/no tasks/i)).toBeInTheDocument();
    });
  });

  describe('keyboard shortcuts', () => {
    it('should handle Ctrl+N for new task', async () => {
      const user = userEvent.setup();
      renderWithProvider(<TasksView />);
      
      await user.keyboard('{Control>n}');
      
      // Form should be expanded
      expect(screen.getByLabelText(/category/i)).toBeInTheDocument();
    });
  });

  describe('search query prop', () => {
    it('should apply external search query', () => {
      renderWithProvider(<TasksView searchQuery="test query" />);
      
      // The filter should include the search query
      const searchInput = screen.getByPlaceholderText(/search tasks/i);
      expect(searchInput).toHaveValue('test query');
    });
  });
});

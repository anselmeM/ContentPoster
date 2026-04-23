import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import taskService from '../../services/taskService';
import { TaskForm } from '../Tasks/TaskForm';
import { TaskItem } from '../Tasks/TaskItem';
import { TaskStats } from '../Tasks/TaskStats';
import TaskFilters from '../Tasks/TaskFilters';
import { TaskCategory, TaskPriority, TaskCreateInput, DEFAULT_FILTERS, DEFAULT_SORT, Task, TaskFilters as TaskFiltersType, TaskSortConfig, TaskStats as TaskStatsType } from '../../types/task';
import { useTaskFilters, useTaskStatusCounts } from '../../hooks/useTaskFilters';
import { useTaskSort, parseSortOption } from '../../hooks/useTaskSort';
import { calculateStats } from '../../utils/taskUtils';
import LoadingSpinner from '../UI/LoadingSpinner';
import type { User } from 'firebase/auth';

interface TasksViewProps {
  searchQuery?: string;
}

const TasksView = ({ searchQuery = '' }: TasksViewProps) => {
  const { user } = useAuth() as { user: User | null };
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());
  const [showStats, setShowStats] = useState(true);
  
  // Filter and sort state
  const [filterState, setFilterState] = useState<TaskFiltersType>(DEFAULT_FILTERS);
  const [sortConfig, setSortConfig] = useState<TaskSortConfig>(DEFAULT_SORT);

  // Apply filters using the custom hook
  const filteredTasks = useTaskFilters(tasks, {
    ...filterState,
    searchQuery: filterState.searchQuery || searchQuery
  });
  
  // Apply sorting using the custom hook
  const sortedTasks = useTaskSort(filteredTasks, sortConfig);
  
  // Get status counts
  const statusCounts = useTaskStatusCounts(tasks);

  useEffect(() => {
    if (!user?.uid) return;

    const unsubscribe = taskService.subscribe(user.uid, (tasksData: Task[]) => {
      setTasks(tasksData);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // Handle creating a new task with full properties
  const handleCreateTask = async (input: TaskCreateInput) => {
    if (!user || !input.text.trim()) return;

    await taskService.create(user.uid, {
      text: input.text.trim(),
      completed: false,
      category: input.category || TaskCategory.GENERAL,
      priority: input.priority || TaskPriority.MEDIUM,
      deadline: input.deadline || null
    });
  };

  // Handle updating task text (inline editing)
  const handleUpdateTaskText = async (taskId: string, text: string) => {
    if (!user || !text.trim()) return;
    
    await taskService.update(user.uid, taskId, { text: text.trim() });
    setEditingTaskId(null);
  };

  // Handle toggling task completion
  const handleToggleTask = async (taskId: string, currentCompletedStatus: boolean) => {
    if (!user) return;
    await taskService.update(user.uid, taskId, {
      completed: !currentCompletedStatus,
      completedAt: !currentCompletedStatus ? Date.now() : null
    });
  };

  // Handle deleting a task
  const handleDeleteTask = async (taskId: string) => {
    if (!user) return;
    await taskService.delete(user.uid, taskId);
    // Also remove from selection if selected
    setSelectedTaskIds(prev => {
      const next = new Set(prev);
      next.delete(taskId);
      return next;
    });
  };

  // Handle bulk delete
  const handleBulkDelete = async () => {
    if (!user || selectedTaskIds.size === 0) return;
    
    // Bolt Optimization: Replace sequential await loop with a single atomic bulkDelete operation
    // to improve performance from O(N) network requests to O(1).
    await taskService.bulkDelete(user.uid, Array.from(selectedTaskIds));
    setSelectedTaskIds(new Set());
  };

  // Handle task selection for bulk actions
  const handleToggleSelectTask = (taskId: string) => {
    setSelectedTaskIds(prev => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  };

  // Handle filter changes
  const handleFilterChange = (newFilters: TaskFiltersType) => {
    setFilterState(newFilters);
  };

  // Handle sort changes
  const handleSortChange = (value: string) => {
    setSortConfig(parseSortOption(value));
  };

  // Calculate stats
  const stats = useMemo(() => {
    const total = tasks.length;

    // Bolt Optimization: Replaced O(3N) chained filters with a single O(N) pass
    // to prevent intermediate array garbage collection and redundant Date instantiations.
    let completed = 0;
    let overdue = 0;

    const today = new Date().toISOString().split('T')[0];

    for (const task of tasks) {
      if (task.completed) {
        completed++;
      } else if (task.deadline && task.deadline < today) {
        overdue++;
      }
    }

    const active = total - completed;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    return { total, active, completed, overdue, completionRate };
  }, [tasks]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header with Stats Toggle */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Tasks
        </h1>
        <button
          onClick={() => setShowStats(!showStats)}
          className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          {showStats ? 'Hide Stats' : 'Show Stats'}
        </button>
      </div>

      {/* Stats Section */}
      {showStats && (
        <TaskStats stats={stats} />
      )}

      {/* Filters */}
      <TaskFilters 
        filters={filterState}
        onChange={handleFilterChange}
        stats={stats}
      />

      {/* Bulk Actions */}
      {selectedTaskIds.size > 0 && (
        <div className="flex items-center gap-4 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
          <span className="text-sm text-indigo-700 dark:text-indigo-300">
            {selectedTaskIds.size} task{selectedTaskIds.size > 1 ? 's' : ''} selected
          </span>
          <button
            onClick={handleBulkDelete}
            className="px-3 py-1 text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
          >
            Delete Selected
          </button>
          <button
            onClick={() => setSelectedTaskIds(new Set())}
            className="px-3 py-1 text-sm text-gray-600 hover:text-gray-700 dark:text-gray-400"
          >
            Clear Selection
          </button>
        </div>
      )}

      {/* Task Form */}
      <TaskForm
        onSubmit={handleCreateTask}
        onCancel={() => {}}
      />

      {/* Task List */}
      {sortedTasks.length === 0 ? (
        <p className="text-center text-gray-500 dark:text-gray-400 py-8">
          {searchQuery || filterState.status !== 'all' || filterState.categories.length > 0 || filterState.priorities.length > 0
            ? 'No tasks match your filters.'
            : 'No tasks yet. Add one above!'}
        </p>
      ) : (
        <div className="space-y-3" role="list" aria-label="Task list">
          {sortedTasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              isSelected={selectedTaskIds.has(task.id)}
              isEditing={editingTaskId === task.id}
              onToggle={() => handleToggleTask(task.id, task.completed)}
              onEdit={() => setEditingTaskId(task.id === editingTaskId ? null : task.id)}
              onSave={(text) => handleUpdateTaskText(task.id, text)}
              onDelete={() => handleDeleteTask(task.id)}
              onSelect={() => handleToggleSelectTask(task.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default TasksView;

# Task Management System API Reference

This document provides comprehensive API reference for the Task Management System implemented in the ContentPoster application.

## Table of Contents

- [Types](#types)
- [Utilities](#utilities)
- [Services](#services)
- [Hooks](#hooks)
- [Components](#components)
- [Context](#context)

---

## Types

### Enumerations

#### `TaskPriority`
```typescript
enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}
```

#### `TaskCategory`
```typescript
enum TaskCategory {
  GENERAL = 'general',
  DESIGN = 'design',
  DEVELOPMENT = 'development',
  CONTENT = 'content',
  REVIEW = 'review',
  RESEARCH = 'research',
  DEPLOYMENT = 'deployment'
}
```

### Interfaces

#### `Task`
```typescript
interface Task {
  id: string;
  text: string;
  completed: boolean;
  category: TaskCategory;
  priority: TaskPriority;
  deadline: string | null;       // ISO 8601 date string
  assignedTo: string | null;     // User ID
  createdAt: number;              // Unix timestamp
  updatedAt: number;              // Unix timestamp
  completedAt: number | null;     // Unix timestamp
  userId: string;                // Owner user ID
}
```

#### `TaskFilters`
```typescript
interface TaskFilters {
  status: 'all' | 'active' | 'completed';
  categories: TaskCategory[];
  priorities: TaskPriority[];
  searchQuery: string;
  showOverdue: boolean;
}
```

#### `TaskSortConfig`
```typescript
interface TaskSortConfig {
  field: 'deadline' | 'priority' | 'createdAt' | 'text';
  direction: 'asc' | 'desc';
}
```

#### `TaskStats`
```typescript
interface TaskStats {
  total: number;
  active: number;
  completed: number;
  overdue: number;
  completionRate: number;
}
```

#### `TaskCreateInput`
```typescript
interface TaskCreateInput {
  text: string;
  category: TaskCategory;
  priority: TaskPriority;
  deadline: string | null;
  assignedTo?: string | null;
}
```

#### `ValidationResult`
```typescript
interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}
```

### Configuration Objects

#### `PRIORITY_CONFIG`
```typescript
const PRIORITY_CONFIG: Record<TaskPriority, {
  label: string;
  color: string;
  bgColor: string;
  icon: string;
  order: number;
}>
```

#### `CATEGORY_CONFIG`
```typescript
const CATEGORY_CONFIG: Record<TaskCategory, {
  label: string;
  color: string;
  bgColor: string;
  icon: string;
}>
```

---

## Utilities

### Date Functions

#### `isOverdue(deadline: string | null): boolean`
Returns `true` if the deadline has passed and the task is not completed.

#### `isDueToday(deadline: string | null): boolean`
Returns `true` if the deadline is set to today.

#### `isDueTomorrow(deadline: string | null): boolean`
Returns `true` if the deadline is set to tomorrow.

#### `formatDeadline(deadline: string | null, options?: FormatOptions): string`
Formats the deadline for display. Returns localized date string or relative time (e.g., "Today", "Tomorrow", "Overdue").

#### `formatDateTime(date: string | number, options?: FormatOptions): string`
Formats a date/time value for display.

#### `compareDates(dateA: string | null, dateB: string | null): number`
Compares two dates. Returns -1 if A < B, 1 if A > B, 0 if equal.

### Priority Functions

#### `getPriorityOrder(priority: TaskPriority): number`
Returns numeric order value (1-4) for priority comparison.

#### `getPriorityColor(priority: TaskPriority): string`
Returns Tailwind CSS color class for priority.

#### `getPriorityBgColor(priority: TaskPriority): string`
Returns Tailwind CSS background color class for priority.

#### `getPriorityIcon(priority: TaskPriority): string`
Returns Font Awesome icon class for priority.

#### `getPriorityLabel(priority: TaskPriority): string`
Returns human-readable label for priority.

### Category Functions

#### `getCategoryColor(category: TaskCategory): string`
Returns Tailwind CSS color class for category.

#### `getCategoryBgColor(category: TaskCategory): string`
Returns Tailwind CSS background color class for category.

#### `getCategoryLabel(category: TaskCategory): string`
Returns human-readable label for category.

### Task Functions

#### `calculateStats(tasks: Task[]): TaskStats`
Calculates statistics for an array of tasks.

#### `validateTask(input: Partial<Task>): ValidationResult`
Validates task input and returns validation result.

#### `filterTasks(tasks: Task[], filters: TaskFilters): Task[]
Filters tasks based on filter criteria.

#### `sortTasks(tasks: Task[], sort: TaskSortConfig): Task[]
Sorts tasks based on sort configuration.

#### `generateTaskId(): string`
Generates a unique task ID.

#### `groupTasksByCategory(tasks: Task[]): Record<TaskCategory, Task[]>`
Groups tasks by category.

#### `groupTasksByPriority(tasks: Task[]): Record<TaskPriority, Task[]>`
Groups tasks by priority.

---

## Services

### `taskService`

Firebase Firestore CRUD operations for tasks.

#### `subscribe(userId: string, callback: (tasks: Task[]) => void): () => void`
Subscribes to real-time task updates for a user. Returns unsubscribe function.

#### `create(userId: string, input: TaskCreateInput): Promise<string>`
Creates a new task. Returns the created task ID.

#### `update(userId: string, taskId: string, data: Partial<Task>): Promise<void>`
Updates an existing task.

#### `delete(userId: string, taskId: string): Promise<void>`
Deletes a task.

#### `toggleComplete(userId: string, taskId: string): Promise<void>`
Toggles task completion status.

#### `bulkDelete(userId: string, taskIds: string[]): Promise<void>`
Deletes multiple tasks.

#### `bulkUpdate(userId: string, taskIds: string[], data: Partial<Task>): Promise<void>`
Updates multiple tasks.

---

## Hooks

### `useTaskFilters(tasks: Task[], filters: TaskFilters): Task[]`
Filters tasks based on the provided filter configuration.

### `useTaskCategories(tasks: Task[]): { category: string; count: number }[]`
Returns unique categories with task counts.

### `useTaskStatusCounts(tasks: Task[]): { all: number; active: number; completed: number; overdue: number }`
Returns task counts by status.

### `useTaskSort(tasks: Task[], sort: TaskSortConfig): Task[]`
Sorts tasks based on the provided sort configuration.

### `SORT_OPTIONS`
```typescript
const SORT_OPTIONS = [
  { value: 'createdAt-desc', label: 'Newest First', field: 'createdAt', direction: 'desc' },
  { value: 'createdAt-asc', label: 'Oldest First', field: 'createdAt', direction: 'asc' },
  { value: 'deadline-asc', label: 'Due Date (Soonest)', field: 'deadline', direction: 'asc' },
  { value: 'deadline-desc', label: 'Due Date (Latest)', field: 'deadline', direction: 'desc' },
  { value: 'priority-desc', label: 'Priority (High to Low)', field: 'priority', direction: 'desc' },
  { value: 'priority-asc', label: 'Priority (Low to High)', field: 'priority', direction: 'asc' },
  { value: 'text-asc', label: 'Name (A-Z)', field: 'text', direction: 'asc' },
  { value: 'text-desc', label: 'Name (Z-A)', field: 'text', direction: 'desc' }
];
```

### `parseSortOption(value: string): TaskSortConfig`
Parses a sort option value string into a TaskSortConfig object.

### `getSortOptionValue(sort: TaskSortConfig): string`
Gets the sort option value string from a TaskSortConfig object.

---

## Components

### `PriorityBadge`
Displays a colored badge with icon for task priority levels.

```tsx
<PriorityBadge priority={TaskPriority.HIGH} />
<PriorityBadge priority={TaskPriority.URGENT} showLabel size="sm" />
```

**Props:**
- `priority: TaskPriority` - The priority level
- `size?: 'sm' | 'md' | 'lg'` - Badge size (default: 'md')
- `showLabel?: boolean` - Show text label (default: false)
- `className?: string` - Additional CSS classes

### `CategoryChip`
Displays a styled chip for task categories.

```tsx
<CategoryChip category={TaskCategory.DEVELOPMENT} />
<CategoryChip category={TaskCategory.DESIGN} onClick={() => {}} />
```

**Props:**
- `category: TaskCategory` - The category
- `onClick?: () => void` - Click handler
- `className?: string` - Additional CSS classes

### `DatePicker`
Input component for selecting dates.

```tsx
<DatePicker value={deadline} onChange={(date) => setDeadline(date)} />
```

**Props:**
- `value: string | null` - Current date value
- `onChange: (value: string) => void` - Change handler
- `className?: string` - Additional CSS classes

### `TaskStats`
Displays summary statistics for the task list.

```tsx
<TaskStats stats={stats} />
```

**Props:**
- `stats: TaskStats` - Statistics object
- `className?: string` - Additional CSS classes

### `TaskFilters`
Filter controls for task list.

```tsx
<TaskFilters filters={filters} onChange={setFilters} />
```

**Props:**
- `filters: TaskFilters` - Current filter state
- `onChange: (filters: TaskFilters) => void` - Change handler
- `className?: string` - Additional CSS classes

### `TaskForm`
Form for creating and editing tasks.

```tsx
<TaskForm onSubmit={handleCreate} onCancel={() => setShowForm(false)} />
<TaskForm onSubmit={handleUpdate} initialValues={task} isEditing />
```

**Props:**
- `onSubmit: (input: TaskCreateInput) => void` - Submit handler
- `onCancel: () => void` - Cancel handler
- `initialValues?: Partial<TaskCreateInput>` - Initial values
- `isEditing?: boolean` - Edit mode flag
- `className?: string` - Additional CSS classes

### `TaskItem`
Displays an individual task with all properties, actions, and states.

```tsx
<TaskItem 
  task={task}
  isSelected={selectedIds.has(task.id)}
  onToggle={() => toggleTask(task.id)}
  onEdit={() => setEditingTaskId(task.id)}
  onSave={(text) => updateTask(task.id, { text })}
  onDelete={() => deleteTask(task.id)}
/>
```

**Props:**
- `task: Task` - The task object
- `isSelected?: boolean` - Selection state
- `isEditing?: boolean` - Edit mode state
- `onToggle: () => void` - Toggle completion handler
- `onEdit: () => void` - Enter edit mode handler
- `onSave: (text: string) => void` - Save handler
- `onDelete: () => void` - Delete handler
- `onSelect?: () => void` - Selection handler
- `className?: string` - Additional CSS classes

### `TaskList`
Displays a list of tasks with bulk selection support.

```tsx
<TaskList
  tasks={filteredTasks}
  selectedIds={selectedIds}
  onToggle={toggleTask}
  onEdit={setEditingTaskId}
  onSave={updateTask}
  onDelete={deleteTask}
  onSelect={toggleSelect}
/>
```

**Props:**
- `tasks: Task[]` - Array of tasks
- `selectedIds: Set<string>` - Selected task IDs
- `onToggle: (id: string) => void` - Toggle handler
- `onEdit: (id: string) => void` - Edit handler
- `onSave: (id: string, text: string) => void` - Save handler
- `onDelete: (id: string) => void` - Delete handler
- `onSelect: (id: string) => void` - Selection handler
- `className?: string` - Additional CSS classes

### `TasksView`
Main orchestrating component for the task management interface.

```tsx
<TasksView searchQuery={searchQuery} />
```

**Props:**
- `searchQuery?: string` - External search query

---

## Context

### `TaskContext`

Provides task state and actions throughout the application.

```tsx
import { TaskContext } from '../context/TaskContext';

const { 
  tasks, 
  filteredTasks, 
  filters, 
  setFilters,
  sort, 
  setSort,
  selectedIds,
  toggleSelect,
  selectAll,
  clearSelection,
  createTask,
  updateTask,
  deleteTask,
  toggleComplete,
  bulkDelete,
  stats
} = useContext(TaskContext);
```

### Context Values

- `tasks: Task[]` - All tasks from Firestore
- `filteredTasks: Task[]` - Tasks after applying filters and sort
- `filters: TaskFilters` - Current filter state
- `setFilters: (filters: TaskFilters) => void` - Update filters
- `sort: TaskSortConfig` - Current sort configuration
- `setSort: (sort: TaskSortConfig) => void` - Update sort
- `selectedIds: Set<string>` - Selected task IDs
- `toggleSelect: (id: string) => void` - Toggle task selection
- `selectAll: () => void` - Select all visible tasks
- `clearSelection: () => void` - Clear selection
- `createTask: (input: TaskCreateInput) => Promise<string>` - Create task
- `updateTask: (id: string, data: Partial<Task>) => Promise<void>` - Update task
- `deleteTask: (id: string) => Promise<void>` - Delete task
- `toggleComplete: (id: string) => Promise<void>` - Toggle completion
- `bulkDelete: () => Promise<void>` - Delete selected tasks
- `stats: TaskStats` - Computed statistics

---

## CSS Animation Classes

### Keyframe Animations

- `animate-slide-in` - Slide in from right
- `animate-fade-in` - Fade in
- `animate-task-slide-up` - Slide up with stagger effect
- `animate-task-slide-down` - Slide down effect
- `animate-scale-in` - Scale in effect
- `animate-shimmer` - Loading shimmer effect
- `animate-checkbox-bounce` - Checkbox bounce on click
- `animate-priority-pulse` - Pulsing animation for urgent items
- `animate-progress-fill` - Progress bar fill animation
- `animate-badge-pop` - Badge pop-in animation

### Transition Classes

- `.task-item-enter` - Enter animation start state
- `.task-item-enter-active` - Enter animation active state
- `.task-item-exit` - Exit animation start state
- `.task-item-exit-active` - Exit animation active state

---

## Error Handling

All service functions throw errors that should be handled by the calling code. Common error scenarios:

- **Permission denied**: User not authenticated
- **Not found**: Task doesn't exist
- **Invalid data**: Validation failed
- **Network error**: Firestore connection failed

---

## Best Practices

1. **Always use the context** instead of direct service calls for consistent state management
2. **Validate inputs** before calling service functions using `validateTask()`
3. **Use memoized selectors** for filtering and sorting to avoid unnecessary recalculations
4. **Handle loading states** when subscribing to real-time updates
5. **Use proper error boundaries** around task components
6. **Implement proper cleanup** by unsubscribing from real-time updates

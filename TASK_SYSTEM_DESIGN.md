# Task Management System - Technical Design

**Project:** ContentPoster  
**Date:** 2026-03-30  
**Version:** 1.0  
**Status:** Draft

---

## 1. Architecture Overview

### 1.1 System Context

```
┌─────────────────────────────────────────────────────────────────┐
│                        ContentPoster App                        │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────────┐ │
│  │   AuthCtx   │───▶│   TeamCtx   │───▶│   TaskManagement    │ │
│  │  (Firebase) │    │   (Teams)   │    │      System         │ │
│  └─────────────┘    └─────────────┘    └─────────────────────┘ │
│                                              │                   │
│                                              ▼                   │
│                                   ┌─────────────────────┐        │
│                                   │   Firebase         │        │
│                                   │   Firestore        │        │
│                                   │   (tasks collection)│        │
│                                   └─────────────────────┘        │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 Component Architecture

```
src/
├── components/
│   ├── Views/
│   │   └── TasksView.tsx           # Main view container
│   ├── Tasks/
│   │   ├── TaskList.tsx             # Filtered task list
│   │   ├── TaskItem.tsx             # Individual task row
│   │   ├── TaskForm.tsx             # Add/edit task form
│   │   ├── TaskFilters.tsx          # Filter controls
│   │   ├── TaskStats.tsx            # Statistics summary
│   │   └── TaskEditModal.tsx        # Full task editor
│   ├── UI/
│   │   ├── PriorityBadge.tsx        # Priority indicator
│   │   ├── CategoryChip.tsx        # Category filter chip
│   │   └── DatePicker.tsx           # Date selection
│   └── Dashboard/
│       └── Sidebar.tsx              # Navigation (existing)
├── context/
│   └── TaskContext.tsx             # Task state management
├── services/
│   └── taskService.ts              # Firebase operations
├── hooks/
│   ├── useTaskFilters.ts          # Filter logic hook
│   └── useTaskSort.ts             # Sort logic hook
├── types/
│   └── task.ts                    # TypeScript interfaces
└── utils/
    └── taskUtils.ts               # Helper functions
```

---

## 2. Data Model

### 2.1 TypeScript Interfaces

```typescript
// src/types/task.ts

/**
 * Task entity representing a single task item
 */
export interface Task {
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
}

/**
 * Task category enumeration
 */
export enum TaskCategory {
  GENERAL = 'general',
  DESIGN = 'design',
  DEVELOPMENT = 'development',
  CONTENT = 'content',
  REVIEW = 'review',
  RESEARCH = 'research',
  DEPLOYMENT = 'deployment'
}

/**
 * Task priority levels
 */
export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

/**
 * Filter state for task list
 */
export interface TaskFilters {
  status: 'all' | 'active' | 'completed';
  categories: TaskCategory[];
  priorities: TaskPriority[];
  searchQuery: string;
  showOverdue: boolean;
}

/**
 * Sort configuration
 */
export interface TaskSortConfig {
  field: 'deadline' | 'priority' | 'createdAt' | 'text';
  direction: 'asc' | 'desc';
}

/**
 * Statistics summary
 */
export interface TaskStats {
  total: number;
  active: number;
  completed: number;
  overdue: number;
  completionRate: number;
}
```

### 2.2 Firebase Firestore Schema

**Collection:** `tasks`

**Document Structure:**
```
tasks/{taskId}
  ├── id: string (UUID)
  ├── text: string
  ├── completed: boolean
  ├── category: string (enum value)
  ├── priority: string (enum value)
  ├── deadline: string | null
  ├── assignedTo: string | null
  ├── createdAt: timestamp
  ├── updatedAt: timestamp
  ├── completedAt: timestamp | null
  └── userId: string (owner, denormalized for security rules)
```

**Security Rules (Firestore):**
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /tasks/{taskId} {
      allow read, write: if request.auth != null 
                          && resource.data.userId == request.auth.uid;
    }
  }
}
```

---

## 3. Component Specifications

### 3.1 TasksView (Main Container)

**File:** [`src/components/Views/TasksView.tsx`](src/components/Views/TasksView.tsx)

**Responsibilities:**
- Orchestrate task management UI
- Manage filter and sort state
- Connect to TaskContext
- Handle keyboard shortcuts

**Props:**
```typescript
interface TasksViewProps {
  searchQuery?: string;  // Inherited from Header search
}
```

**State:**
- `filters: TaskFilters` - Current filter configuration
- `sort: TaskSortConfig` - Current sort configuration
- `editingTaskId: string | null` - Task being edited

**Key UI Sections:**
1. Header with statistics summary
2. Filter bar with status tabs and category chips
3. Task creation form (collapsible)
4. Task list with pagination
5. Empty state when no tasks

### 3.2 TaskList

**File:** [`src/components/Tasks/TaskList.tsx`](src/components/Tasks/TaskList.tsx)

**Responsibilities:**
- Render filtered and sorted task list
- Handle bulk selection
- Virtualized rendering for performance

**Props:**
```typescript
interface TaskListProps {
  tasks: Task[];
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onSelectAll: () => void;
  onBulkDelete: () => void;
}
```

**Features:**
- Checkbox column for bulk operations
- Keyboard navigation (arrow keys)
- Swipe actions on mobile (delete)
- Empty state component

### 3.3 TaskItem

**File:** [`src/components/Tasks/TaskItem.tsx`](src/components/Tasks/TaskItem.tsx)

**Responsibilities:**
- Display individual task with all properties
- Handle inline editing
- Show completion animation

**Props:**
```typescript
interface TaskItemProps {
  task: Task;
  isEditing: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onSave: (text: string) => void;
  onDelete: () => void;
}
```

**Visual Hierarchy:**
```
┌────────────────────────────────────────────────────────────┐
│ [x] Task text here...                    📅 Mar 30  [!] 🗑️ │
│     [Design] [Medium]                       2:00 PM         │
└────────────────────────────────────────────────────────────┘
```

**States:**
- Default: Normal display
- Hover: Elevated shadow, action buttons visible
- Editing: Inline text input replaces text
- Completed: Strikethrough, reduced opacity
- Overdue: Red deadline indicator

### 3.4 TaskForm

**File:** [`src/components/Tasks/TaskForm.tsx`](src/components/Tasks/TaskForm.tsx)

**Responsibilities:**
- Create new task with all fields
- Validate input before submission

**Props:**
```typescript
interface TaskFormProps {
  onSubmit: (task: Partial<Task>) => void;
  onCancel: () => void;
  initialValues?: Partial<Task>;
  isEditing?: boolean;
}
```

**Form Fields:**
1. Text input (required, max 500 chars)
2. Category dropdown
3. Priority selector (visual buttons)
4. Deadline date picker
5. Assignee (future: team members)

### 3.5 TaskFilters

**File:** [`src/components/Tasks/TaskFilters.tsx`](src/components/Tasks/TaskFilters.tsx)

**Responsibilities:**
- Display status filter tabs
- Show category filter chips
- Priority filter dropdown

**Props:**
```typescript
interface TaskFiltersProps {
  filters: TaskFilters;
  onChange: (filters: TaskFilters) => void;
  stats: TaskStats;
}
```

**Filter UI:**
```
[All (12)] [Active (8)] [Completed (4)]    🔍 Search...   [Sort ▼]
[Design] [Development] [Content] [Review]  [🗑️ 3 selected]
```

### 3.6 TaskStats

**File:** [`src/components/Tasks/TaskStats.tsx`](src/components/Tasks/TaskStats.tsx)

**Responsibilities:**
- Display summary statistics
- Show progress visualization

**Props:**
```typescript
interface TaskStatsProps {
  stats: TaskStats;
}
```

**Display:**
```
┌────────────────────────────────────────────────────────┐
│  8 remaining    ✓ 4 completed    ⚠ 1 overdue          │
│  [████████████████████░░░░] 80%                       │
└────────────────────────────────────────────────────────┘
```

---

## 4. State Management

### 4.1 TaskContext Architecture

```typescript
// src/context/TaskContext.tsx

interface TaskContextValue {
  // Data
  tasks: Task[];
  filteredTasks: Task[];
  
  // Loading
  isLoading: boolean;
  isSaving: boolean;
  
  // Filters & Sort
  filters: TaskFilters;
  sort: TaskSortConfig;
  setFilters: (filters: TaskFilters) => void;
  setSort: (sort: TaskSortConfig) => void;
  
  // Stats
  stats: TaskStats;
  
  // Actions
  createTask: (task: Partial<Task>) => Promise<void>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  toggleTask: (id: string) => Promise<void>;
  bulkDelete: (ids: string[]) => Promise<void>;
  
  // Selection
  selectedIds: Set<string>;
  toggleSelect: (id: string) => void;
  clearSelection: () => void;
  selectAll: () => void;
}
```

### 4.2 Filter Logic (useTaskFilters)

```typescript
// src/hooks/useTaskFilters.ts

export function useTaskFilters(tasks: Task[], filters: TaskFilters): Task[] {
  return useMemo(() => {
    return tasks.filter(task => {
      // Status filter
      if (filters.status === 'active' && task.completed) return false;
      if (filters.status === 'completed' && !task.completed) return false;
      
      // Category filter
      if (filters.categories.length > 0 && !filters.categories.includes(task.category)) {
        return false;
      }
      
      // Priority filter
      if (filters.priorities.length > 0 && !filters.priorities.includes(task.priority)) {
        return false;
      }
      
      // Overdue filter
      if (filters.showOverdue && (!task.deadline || !isOverdue(task.deadline))) {
        return false;
      }
      
      // Search query
      if (filters.searchQuery && !task.text.toLowerCase().includes(filters.searchQuery.toLowerCase())) {
        return false;
      }
      
      return true;
    });
  }, [tasks, filters]);
}
```

### 4.3 Sort Logic (useTaskSort)

```typescript
// src/hooks/useTaskSort.ts

export function useTaskSort(tasks: Task[], sort: TaskSortConfig): Task[] {
  return useMemo(() => {
    return [...tasks].sort((a, b) => {
      let comparison = 0;
      
      switch (sort.field) {
        case 'deadline':
          comparison = compareDates(a.deadline, b.deadline);
          break;
        case 'priority':
          comparison = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
          break;
        case 'createdAt':
          comparison = a.createdAt - b.createdAt;
          break;
        case 'text':
          comparison = a.text.localeCompare(b.text);
          break;
      }
      
      return sort.direction === 'asc' ? comparison : -comparison;
    });
  }, [tasks, sort]);
}
```

---

## 5. API Design (Firebase Service)

### 5.1 TaskService Interface

```typescript
// src/services/taskService.ts

export interface TaskService {
  /**
   * Subscribe to user's tasks in real-time
   */
  subscribe(userId: string, callback: (tasks: Task[]) => void): () => void;
  
  /**
   * Create a new task
   */
  create(userId: string, task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<Task>;
  
  /**
   * Update an existing task
   */
  update(userId: string, taskId: string, updates: Partial<Task>): Promise<void>;
  
  /**
   * Delete a task
   */
  delete(userId: string, taskId: string): Promise<void>;
  
  /**
   * Toggle task completion status
   */
  toggleComplete(userId: string, taskId: string): Promise<void>;
  
  /**
   * Bulk delete tasks
   */
  bulkDelete(userId: string, taskIds: string[]): Promise<void>;
}
```

### 5.2 Implementation

```typescript
// src/services/taskService.ts

import { db } from '../config/firebase';
import { 
  collection, doc, addDoc, updateDoc, deleteDoc, 
  onSnapshot, writeBatch, query, orderBy 
} from 'firebase/firestore';

const PRIORITY_MAP = { urgent: 4, high: 3, medium: 2, low: 1 };

export const taskService: TaskService = {
  subscribe(userId, callback) {
    const q = query(
      collection(db, 'tasks'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    return onSnapshot(q, (snapshot) => {
      const tasks = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Task[];
      callback(tasks);
    });
  },
  
  async create(userId, taskData) {
    const now = Date.now();
    const task = {
      ...taskData,
      userId,
      createdAt: now,
      updatedAt: now,
      completed: false,
      completedAt: null
    };
    
    const docRef = await addDoc(collection(db, 'tasks'), task);
    return { id: docRef.id, ...task };
  },
  
  async update(userId, taskId, updates) {
    await updateDoc(doc(db, 'tasks', taskId), {
      ...updates,
      updatedAt: Date.now()
    });
  },
  
  async delete(userId, taskId) {
    await deleteDoc(doc(db, 'tasks', taskId));
  },
  
  async toggleComplete(userId, taskId) {
    const taskRef = doc(db, 'tasks', taskId);
    // Get current state then update
    const { getDoc } = await import('firebase/firestore');
    const snap = await getDoc(taskRef);
    const completed = !snap.data()?.completed;
    
    await updateDoc(taskRef, {
      completed,
      completedAt: completed ? Date.now() : null,
      updatedAt: Date.now()
    });
  },
  
  async bulkDelete(userId, taskIds) {
    const batch = writeBatch(db);
    taskIds.forEach(id => {
      batch.delete(doc(db, 'tasks', id));
    });
    await batch.commit();
  }
};
```

---

## 6. UI/UX Design Specifications

### 6.1 Color Palette

**Primary Colors:**
```css
--color-primary: #4f46e5;      /* Indigo 600 */
--color-primary-hover: #4338ca;
--color-primary-light: #eef2ff;
```

**Priority Colors:**
```css
--color-urgent: #dc2626;      /* Red 600 */
--color-urgent-bg: #fef2f2;
--color-high: #ea580c;        /* Orange 600 */
--color-high-bg: #fff7ed;
--color-medium: #2563eb;      /* Blue 600 */
--color-medium-bg: #eff6ff;
--color-low: #6b7280;         /* Gray 500 */
--color-low-bg: #f9fafb;
```

**Category Colors:**
```css
--color-category-general: #6366f1;
--color-category-design: #ec4899;
--color-category-development: #10b981;
--color-category-content: #f59e0b;
--color-category-review: #8b5cf6;
--color-category-research: #06b6d4;
--color-category-deployment: #f97316;
```

### 6.2 Typography

```css
/* Task text */
.task-text {
  font-size: 0.9375rem;  /* 15px */
  line-height: 1.5;
  color: var(--color-text-primary);
}

/* Completed task */
.task-text.completed {
  text-decoration: line-through;
  color: var(--color-text-secondary);
}

/* Task metadata */
.task-meta {
  font-size: 0.75rem;   /* 12px */
  color: var(--color-text-secondary);
}
```

### 6.3 Spacing Scale

```css
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;       /* 16px */
--space-6: 1.5rem;     /* 24px */
--space-8: 2rem;       /* 32px */
```

### 6.4 Animation Specifications

```css
/* Completion checkbox animation */
.checkbox-complete {
  animation: check-pop 0.2s ease-out;
}

@keyframes check-pop {
  0% { transform: scale(1); }
  50% { transform: scale(1.3); }
  100% { transform: scale(1); }
}

/* Task text strikethrough */
.task-text.strike {
  animation: strikethrough 0.3s ease-out forwards;
}

@keyframes strikethrough {
  from { text-decoration: none; }
  to { text-decoration: line-through; }
}

/* Task item hover */
.task-item {
  transition: box-shadow 0.2s ease, transform 0.2s ease;
}

.task-item:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-1px);
}
```

### 6.5 Responsive Breakpoints

```css
/* Mobile: < 768px */
.task-item {
  flex-direction: column;
  align-items: flex-start;
}

/* Tablet: 768px - 1024px */
.task-item {
  flex-direction: row;
  align-items: center;
}

/* Desktop: > 1024px */
.task-item {
  padding: var(--space-4);
}
```

---

## 7. Accessibility Specifications

### 7.1 ARIA Roles and Labels

```jsx
// Task list container
<div role="list" aria-label="Task list">
  
  // Individual task item
  <div role="listitem" aria-label={`Task: ${task.text}`}>
    
    // Checkbox
    <input 
      type="checkbox"
      role="checkbox"
      aria-checked={task.completed}
      aria-label={`${task.completed ? 'Mark as incomplete' : 'Mark as complete'}: ${task.text}`}
    />
    
    // Priority badge
    <span role="status" aria-label={`Priority: ${task.priority}`}>
      {task.priority}
    </span>
  </div>
</div>
```

### 7.2 Keyboard Navigation

| Key | Action |
|-----|--------|
| Tab | Move between interactive elements |
| Enter | Toggle checkbox / activate edit mode |
| Escape | Cancel edit mode / close modal |
| Arrow Up/Down | Navigate between tasks (in list mode) |
| Space | Toggle checkbox when focused on task |
| Delete | Delete focused task (with confirmation) |

### 7.3 Focus Management

```typescript
// On task creation, focus moves to text input
useEffect(() => {
  if (isCreating) {
    textInputRef.current?.focus();
  }
}, [isCreating]);

// On task deletion, focus moves to next task
const handleDelete = (taskId: string) => {
  const index = filteredTasks.findIndex(t => t.id === taskId);
  deleteTask(taskId);
  
  // Focus next task or create button
  if (filteredTasks[index + 1]) {
    document.getElementById(`task-${filteredTasks[index + 1].id}`)?.focus();
  } else {
    document.getElementById('add-task-btn')?.focus();
  }
};
```

### 7.4 Screen Reader Announcements

```jsx
// Announce task completion
const announceCompletion = (taskText: string) => {
  const announcement = document.createElement('div');
  announcement.setAttribute('role', 'status');
  announcement.setAttribute('aria-live', 'polite');
  announcement.textContent = `Task completed: ${taskText}`;
  document.body.appendChild(announcement);
  setTimeout(() => announcement.remove(), 1000);
};

// Announce bulk actions
const announceBulkAction = (count: number, action: string) => {
  const announcement = document.createElement('div');
  announcement.setAttribute('role', 'status');
  announcement.setAttribute('aria-live', 'assertive');
  announcement.textContent = `${count} tasks ${action}`;
  document.body.appendChild(announcement);
  setTimeout(() => announcement.remove(), 1000);
};
```

---

## 8. Error Handling

### 8.1 Error States

| Error | User Message | Recovery Action |
|-------|--------------|----------------|
| Network failure | "Unable to save task. Check your connection." | Retry button |
| Task limit exceeded | "You've reached the limit of 100 tasks. Delete some to add more." | Show delete option |
| Rate limit | "Please wait before adding more tasks." | Disable button temporarily |
| Invalid data | "Invalid task data. Please check your input." | Highlight invalid fields |

### 8.2 Toast Notifications

```typescript
// Success: Task created
{ type: 'success', message: 'Task created', duration: 3000 }

// Success: Task completed
{ type: 'success', message: 'Task marked as complete', duration: 2000 }

// Error: Save failed
{ type: 'error', message: 'Failed to save task. Please try again.', duration: 5000 }

// Warning: Overdue task
{ type: 'warning', message: 'You have overdue tasks', duration: 4000 }
```

---

## 9. Performance Considerations

### 9.1 Virtualization

For lists with 50+ tasks, use virtualized rendering:
- Use `react-window` or `@tanstack/react-virtual`
- Render only visible items + buffer
- Maintain scroll position on filter changes

### 9.2 Memoization

```typescript
// Memoize filtered and sorted tasks
const visibleTasks = useMemo(
  () => useTaskSort(useTaskFilters(tasks, filters), sort),
  [tasks, filters, sort]
);

// Memoize task stats
const stats = useMemo(
  () => calculateStats(tasks),
  [tasks]
);
```

### 9.3 Debouncing

```typescript
// Debounce search input
const debouncedSearch = useDebounce(searchQuery, 300);

// Debounce bulk operations
const debouncedBulkDelete = useDebounce(bulkDelete, 500);
```

---

## 10. Testing Strategy

### 10.1 Unit Tests

- Task filters logic
- Task sort logic
- Stats calculation
- Date utilities

### 10.2 Component Tests

- TaskForm validation
- TaskItem interactions
- Filter UI behavior

### 10.3 Integration Tests

- Full task CRUD flow
- Filter and sort combinations
- Firebase service integration

---

*Design Lead: Systems Architect*  
*Next Phase: Proceed to tasks.md for implementation checklist*
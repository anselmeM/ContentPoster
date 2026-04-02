# Task Management System - Implementation Tasks

**Project:** ContentPoster  
**Date:** 2026-03-30  
**Version:** 1.0  
**Status:** Ready for Implementation

---

## Overview

This checklist breaks down the Task Management System implementation into sequential, granular tasks. Each task builds upon the previous, ensuring dependencies are respected.

**Reference Documents:**
- [`TASK_SYSTEM_REQUIREMENTS.md`](TASK_SYSTEM_REQUIREMENTS.md) - Business logic and user stories
- [`TASK_SYSTEM_DESIGN.md`](TASK_SYSTEM_DESIGN.md) - Technical architecture

---

## Phase 1: Foundation (Types, Services, Context)

### 1.1 Type Definitions

- [ ] **1.1.1** Create [`src/types/task.ts`](src/types/task.ts) with TypeScript interfaces:
  - [ ] `Task` interface with all properties (id, text, completed, category, priority, deadline, assignedTo, createdAt, updatedAt, completedAt)
  - [ ] `TaskCategory` enum with all categories
  - [ ] `TaskPriority` enum with all priorities
  - [ ] `TaskFilters` interface
  - [ ] `TaskSortConfig` interface
  - [ ] `TaskStats` interface
  - [ ] Export all types

### 1.2 Utility Functions

- [ ] **1.2.1** Create [`src/utils/taskUtils.ts`](src/utils/taskUtils.ts):
  - [ ] `isOverdue(deadline: string | null): boolean` - Check if deadline has passed
  - [ ] `formatDeadline(deadline: string): string` - Format date for display
  - [ ] `getPriorityColor(priority: TaskPriority): string` - Return Tailwind color class
  - [ ] `getCategoryColor(category: TaskCategory): string` - Return Tailwind color class
  - [ ] `calculateStats(tasks: Task[]): TaskStats` - Compute statistics from task array
  - [ ] `validateTask(task: Partial<Task>): ValidationResult` - Validate task data

### 1.3 Firebase Service

- [ ] **1.3.1** Create [`src/services/taskService.ts`](src/services/taskService.ts):
  - [ ] Define `TaskService` interface matching design spec
  - [ ] Implement `subscribe()` method with real-time updates
  - [ ] Implement `create()` method
  - [ ] Implement `update()` method
  - [ ] Implement `delete()` method
  - [ ] Implement `toggleComplete()` method
  - [ ] Implement `bulkDelete()` method
  - [ ] Add error handling with typed errors

### 1.4 Custom Hooks

- [ ] **1.4.1** Create [`src/hooks/useTaskFilters.ts`](src/hooks/useTaskFilters.ts):
  - [ ] Accept tasks array and filters object
  - [ ] Apply status filter (all/active/completed)
  - [ ] Apply category filter (multiple selection)
  - [ ] Apply priority filter (multiple selection)
  - [ ] Apply overdue filter
  - [ ] Apply search query filter
  - [ ] Return filtered tasks array
  - [ ] Memoize for performance

- [ ] **1.4.2** Create [`src/hooks/useTaskSort.ts`](src/hooks/useTaskSort.ts):
  - [ ] Accept tasks array and sort config
  - [ ] Sort by deadline (nulls last)
  - [ ] Sort by priority (urgent first)
  - [ ] Sort by createdAt
  - [ ] Sort alphabetically
  - [ ] Support asc/desc direction
  - [ ] Return sorted tasks array
  - [ ] Memoize for performance

### 1.5 Task Context

- [ ] **1.5.1** Create [`src/context/TaskContext.tsx`](src/context/TaskContext.tsx):
  - [ ] Define `TaskContextValue` interface
  - [ ] Create `TaskProvider` component
  - [ ] Implement state management (tasks, filters, sort, selection)
  - [ ] Implement CRUD actions (create, update, delete, toggle, bulkDelete)
  - [ ] Implement filter and sort state management
  - [ ] Implement selection management (toggle, clear, selectAll)
  - [ ] Compute and expose stats
  - [ ] Connect to Firebase service
  - [ ] Cleanup subscription on unmount

---

## Phase 2: UI Components (Base)

### 2.1 Priority Badge

- [ ] **2.1.1** Create [`src/components/UI/PriorityBadge.tsx`](src/components/UI/PriorityBadge.tsx):
  - [ ] Accept `priority: TaskPriority` prop
  - [ ] Display colored badge with icon
  - [ ] Urgent: Red background, warning icon
  - [ ] High: Orange background, arrow-up icon
  - [ ] Medium: Blue background, minus icon
  - [ ] Low: Gray background, arrow-down icon
  - [ ] Include ARIA label for accessibility

### 2.2 Category Chip

- [ ] **2.2.1** Create [`src/components/UI/CategoryChip.tsx`](src/components/UI/CategoryChip.tsx):
  - [ ] Accept `category: TaskCategory` and `onClick` props
  - [ ] Display pill-shaped chip with category color
  - [ ] Include close button for filter removal
  - [ ] Add hover state
  - [ ] Include ARIA label

### 2.3 Date Picker

- [ ] **2.3.1** Create [`src/components/UI/DatePicker.tsx`](src/components/UI/DatePicker.tsx):
  - [ ] Accept `value`, `onChange`, `min` props
  - [ ] Use native date input with custom styling
  - [ ] Display formatted date when selected
  - [ ] Clear button for null deadline
  - [ ] Include clear button for optional dates

---

## Phase 3: Task Components

### 3.1 TaskStats Component

- [ ] **3.1.1** Create [`src/components/Tasks/TaskStats.tsx`](src/components/Tasks/TaskStats.tsx):
  - [ ] Accept `stats: TaskStats` prop
  - [ ] Display task counts (total, active, completed, overdue)
  - [ ] Display progress bar with percentage
  - [ ] Use appropriate color coding (green for completed, red for overdue)
  - [ ] Responsive layout (stacked on mobile)

### 3.2 TaskFilters Component

- [ ] **3.2.1** Create [`src/components/Tasks/TaskFilters.tsx`](src/components/Tasks/TaskFilters.tsx):
  - [ ] Accept `filters`, `onChange`, `stats` props
  - [ ] Display status filter tabs (All, Active, Completed) with counts
  - [ ] Display category filter chips with toggle
  - [ ] Display priority filter dropdown
  - [ ] Include "Show Overdue" checkbox
  - [ ] Include sort dropdown
  - [ ] Handle filter changes and propagate to parent

### 3.3 TaskForm Component

- [ ] **3.3.1** Create [`src/components/Tasks/TaskForm.tsx`](src/components/Tasks/TaskForm.tsx):
  - [ ] Accept `onSubmit`, `onCancel`, `initialValues`, `isEditing` props
  - [ ] Text input with character counter (max 500)
  - [ ] Category dropdown (select element)
  - [ ] Visual priority selector (button group instead of dropdown)
  - [ ] Date picker for deadline (optional)
  - [ ] Form validation and error display
  - [ ] Submit and cancel buttons
  - [ ] Focus management (auto-focus text input)
  - [ ] Keyboard shortcuts (Enter to submit, Escape to cancel)

### 3.4 TaskItem Component

- [ ] **3.4.1** Create [`src/components/Tasks/TaskItem.tsx`](src/components/Tasks/TaskItem.tsx):
  - [ ] Accept `task`, `isEditing`, `onToggle`, `onEdit`, `onSave`, `onDelete` props
  - [ ] Checkbox for completion toggle
  - [ ] Task text with strikethrough when completed
  - [ ] Category chip
  - [ ] Priority badge
  - [ ] Deadline display (formatted date)
  - [ ] Overdue visual indicator (red styling for past deadlines)
  - [ ] Inline edit mode (text input replaces display)
  - [ ] Delete button (icon)
  - [ ] Hover actions (visible on desktop, persistent on mobile)
  - [ ] Completion animation (scale pop on checkbox)
  - [ ] Keyboard navigation support (Arrow keys)
  - [ ] ARIA labels and roles

### 3.5 TaskList Component

- [ ] **3.5.1** Create [`src/components/Tasks/TaskList.tsx`](src/components/Tasks/TaskList.tsx):
  - [ ] Accept `tasks`, `selectedIds`, `onToggleSelect`, `onSelectAll`, `onBulkDelete` props
  - [ ] Header row with select-all checkbox
  - [ ] Checkbox column for individual selection
  - [ ] Render TaskItem for each task
  - [ ] Bulk action bar (appears when items selected)
  - [ ] Handle keyboard navigation between tasks
  - [ ] Show selection count in bulk bar

### 3.6 TaskEditModal Component

- [ ] **3.6.1** Create [`src/components/Tasks/TaskEditModal.tsx`](src/components/Tasks/TaskEditModal.tsx):
  - [ ] Accept `task`, `onSave`, `onClose` props
  - [ ] Modal overlay with backdrop
  - [ ] Full task edit form (same as TaskForm)
  - [ ] Save and cancel buttons
  - [ ] Delete button (destructive)
  - [ ] Escape key to close
  - [ ] Focus trap within modal
  - [ ] ARIA attributes (role="dialog", aria-modal)

---

## Phase 4: Main View (TasksView)

### 4.1 TasksView Component

- [ ] **4.1.1** Create [`src/components/Views/TasksView.tsx`](src/components/Views/TasksView.tsx):
  - [ ] Accept `searchQuery` prop from Header
  - [ ] Wrap with TaskProvider context
  - [ ] State management for filters, sort, editing
  - [ ] Layout structure:
    - Header with title and primary action button
    - TaskStats summary section
    - TaskFilters bar
    - TaskForm (collapsible)
    - TaskList with filtered/sorted tasks
    - Empty state when no tasks
    - Loading state during initial load
  - [ ] Handle external search query (from Header)
  - [ ] Keyboard shortcuts (Ctrl+N for new task)
  - [ ] Sync filter state with URL (optional)

---

## Phase 5: Integration

### 5.1 Dashboard Integration

- [ ] **5.1.1** Update [`src/components/Dashboard/Dashboard.tsx`](src/components/Dashboard/Dashboard.tsx):
  - [ ] Verify TasksView lazy import works
  - [ ] Ensure searchQuery prop passes correctly
  - [ ] Test navigation between views

### 5.2 UI Component Alignment

- [ ] **5.2.1** Update [`src/components/UI/EmptyState.tsx`](src/components/UI/EmptyState.tsx):
  - [ ] Ensure consistent with design spec
  - [ ] Add action button support for task creation

- [ ] **5.2.2** Review and update existing EmptyState component
  - [ ] Add `icon`, `title`, `description`, `action` props

### 5.3 Toast Notifications

- [ ] **5.3.1** Integrate with existing ToastContainer:
  - [ ] Task created: success toast, 3s
  - [ ] Task completed: success toast, 2s
  - [ ] Task deleted: info toast, 3s
  - [ ] Bulk action: success toast with count, 3s
  - [ ] Error: error toast, 5s

---

## Phase 6: Testing

### 6.1 Unit Tests

- [ ] **6.1.1** Create [`src/test/taskUtils.test.ts`](src/test/taskUtils.test.ts):
  - [ ] Test isOverdue function (past, future, null cases)
  - [ ] Test formatDeadline function
  - [ ] Test calculateStats function
  - [ ] Test validateTask function

- [ ] **6.1.2** Create [`src/test/useTaskFilters.test.ts`](src/test/useTaskFilters.test.ts):
  - [ ] Test status filter
  - [ ] Test category filter
  - [ ] Test priority filter
  - [ ] Test overdue filter
  - [ ] Test search query filter
  - [ ] Test combined filters

- [ ] **6.1.3** Create [`src/test/useTaskSort.test.ts`](src/test/useTaskSort.test.ts):
  - [ ] Test deadline sort (nulls last)
  - [ ] Test priority sort (urgent first)
  - [ ] Test createdAt sort
  - [ ] Test text sort
  - [ ] Test direction toggle

### 6.2 Component Tests

- [ ] **6.2.1** Create [`src/test/TaskItem.test.tsx`](src/test/TaskItem.test.tsx):
  - [ ] Test checkbox toggle
  - [ ] Test inline edit activation
  - [ ] Test delete button
  - [ ] Test visual states (default, completed, overdue)

- [ ] **6.2.2** Create [`src/test/TaskForm.test.tsx`](src/test/TaskForm.test.tsx):
  - [ ] Test form validation
  - [ ] Test required field validation
  - [ ] Test character limit
  - [ ] Test submit and cancel

### 6.3 Integration Tests

- [ ] **6.3.1** Create [`src/test/TasksView.test.tsx`](src/test/TasksView.test.tsx):
  - [ ] Test task creation flow
  - [ ] Test task editing flow
  - [ ] Test task deletion flow
  - [ ] Test filter interactions
  - [ ] Test sort interactions
  - [ ] Test empty state display

---

## Phase 7: Polish & Accessibility

### 7.1 Animation Refinements

- [ ] **7.1.1** Add completion animation CSS:
  - [ ] Checkbox pop animation (0.2s)
  - [ ] Strikethrough animation (0.3s)
  - [ ] Task item hover elevation

- [ ] **7.1.2** Add milestone celebration:
  - [ ] Trigger confetti at 10 completed tasks (cumulative)
  - [ ] Use existing animation library or simple CSS

### 7.2 Accessibility Verification

- [ ] **7.2.1** Verify ARIA implementation:
  - [ ] List and listitem roles
  - [ ] Checkbox roles and states
  - [ ] Modal accessibility (focus trap, escape key)
  - [ ] Screen reader announcements for actions

- [ ] **7.2.2** Keyboard navigation audit:
  - [ ] Tab order through all interactive elements
  - [ ] Arrow key navigation in task list
  - [ ] Enter to toggle/edit
  - [ ] Escape to cancel/close

- [ ] **7.2.3** Color contrast check:
  - [ ] Verify all text meets WCAG AA (4.5:1)
  - [ ] Update dark mode colors if needed (gray-400 → gray-300)

### 7.3 Responsive Testing

- [ ] **7.3.1** Test mobile layout:
  - [ ] Single column task list
  - [ ] Sticky add task button
  - [ ] Persistent action buttons (no hover dependency)
  - [ ] Touch-friendly target sizes (44px minimum)

- [ ] **7.3.2** Test tablet layout:
  - [ ] Two-column grid for task stats
  - [ ] Comfortable spacing

- [ ] **7.3.3** Test desktop layout:
  - [ ] Full layout as designed
  - [ ] Proper hover states

---

## Phase 8: Documentation

### 8.1 Component Documentation

- [ ] **8.1.1** Add JSDoc comments to all components:
  - [ ] Description of purpose
  - [ ] Props interface documentation
  - [ ] Usage examples

- [ ] **8.1.2** Update README or create docs:
  - [ ] Task Management feature overview
  - [ ] Keyboard shortcuts reference
  - [ ] Filter/sort options reference

---

## Implementation Order Summary

```
Phase 1: Foundation
├── 1.1 Types
├── 1.2 Utilities
├── 1.3 Firebase Service
├── 1.4 Custom Hooks
└── 1.5 Task Context

Phase 2: UI Components (Base)
├── 2.1 Priority Badge
├── 2.2 Category Chip
└── 2.3 Date Picker

Phase 3: Task Components
├── 3.1 TaskStats
├── 3.2 TaskFilters
├── 3.3 TaskForm
├── 3.4 TaskItem
├── 3.5 TaskList
└── 3.6 TaskEditModal

Phase 4: Main View
└── 4.1 TasksView

Phase 5: Integration
├── 5.1 Dashboard Integration
├── 5.2 UI Component Alignment
└── 5.3 Toast Notifications

Phase 6: Testing
├── 6.1 Unit Tests
├── 6.2 Component Tests
└── 6.3 Integration Tests

Phase 7: Polish
├── 7.1 Animation Refinements
├── 7.2 Accessibility Verification
└── 7.3 Responsive Testing

Phase 8: Documentation
└── 8.1 Component Documentation
```

---

## Files to Create/Modify

### New Files

| File | Phase | Priority |
|------|-------|----------|
| `src/types/task.ts` | 1 | P0 |
| `src/utils/taskUtils.ts` | 1 | P0 |
| `src/services/taskService.ts` | 1 | P0 |
| `src/hooks/useTaskFilters.ts` | 1 | P0 |
| `src/hooks/useTaskSort.ts` | 1 | P0 |
| `src/context/TaskContext.tsx` | 1 | P0 |
| `src/components/UI/PriorityBadge.tsx` | 2 | P0 |
| `src/components/UI/CategoryChip.tsx` | 2 | P1 |
| `src/components/UI/DatePicker.tsx` | 2 | P1 |
| `src/components/Tasks/TaskStats.tsx` | 3 | P0 |
| `src/components/Tasks/TaskFilters.tsx` | 3 | P0 |
| `src/components/Tasks/TaskForm.tsx` | 3 | P0 |
| `src/components/Tasks/TaskItem.tsx` | 3 | P0 |
| `src/components/Tasks/TaskList.tsx` | 3 | P0 |
| `src/components/Tasks/TaskEditModal.tsx` | 3 | P1 |
| `src/components/Views/TasksView.tsx` | 4 | P0 |
| `src/test/taskUtils.test.ts` | 6 | P2 |
| `src/test/useTaskFilters.test.ts` | 6 | P2 |
| `src/test/useTaskSort.test.ts` | 6 | P2 |
| `src/test/TaskItem.test.tsx` | 6 | P2 |
| `src/test/TaskForm.test.tsx` | 6 | P2 |
| `src/test/TasksView.test.tsx` | 6 | P2 |

### Modified Files

| File | Changes | Phase |
|------|---------|-------|
| `src/components/UI/EmptyState.tsx` | Enhance for action support | 5 |
| `src/components/Dashboard/Dashboard.tsx` | Verify lazy loading | 5 |
| `src/index.css` | Add animations | 7 |
| `tailwind.config.js` | Add custom animations | 7 |

---

## Dependencies

- React 18+ (existing)
- Firebase/Firestore (existing)
- Tailwind CSS v4 (existing)
- clsx (existing)
- Vitest (existing testing)

---

*Implementation Checklist prepared by: Lead Systems Architect*  
*Ready for handoff to Code Mode*
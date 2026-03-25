import { memo } from 'react';
import clsx from 'clsx';

/**
 * Reusable Empty State component
 * Displays when no content exists with helpful message and action
 */
const EmptyState = memo(({
  icon = 'fa-inbox', // Font Awesome icon class
  title = 'No items yet',
  description = 'Get started by creating your first item',
  actionLabel,
  onAction,
  className,
  iconClassName = 'text-gray-300 dark:text-gray-600',
  titleClassName = 'text-gray-800 dark:text-white',
  descriptionClassName = 'text-gray-500 dark:text-gray-400'
}) => {
  if (!actionLabel && !onAction) {
    return (
      <div className={clsx('flex flex-col items-center justify-center py-12 text-center', className)}>
        <div className={clsx('w-20 h-20 mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center', iconClassName)}>
          <i className={clsx('fas', icon, 'text-3xl')} />
        </div>
        <h3 className={clsx('text-lg font-semibold mb-2', titleClassName)}>
          {title}
        </h3>
        <p className={clsx('text-sm max-w-md', descriptionClassName)}>
          {description}
        </p>
      </div>
    );
  }

  return (
    <div className={clsx('flex flex-col items-center justify-center py-12 text-center', className)}>
      <div className={clsx('w-20 h-20 mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center', iconClassName)}>
        <i className={clsx('fas', icon, 'text-3xl')} />
      </div>
      <h3 className={clsx('text-lg font-semibold mb-2', titleClassName)}>
        {title}
      </h3>
      <p className={clsx('text-sm max-w-md mb-6', descriptionClassName)}>
        {description}
      </p>
      <button
        onClick={onAction}
        className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-200 font-medium"
      >
        {actionLabel}
      </button>
    </div>
  );
});

EmptyState.displayName = 'EmptyState';

// Preset empty state configurations

/**
 * Empty posts state for scheduler
 */
export const EmptyPostsState = ({ onCreatePost, className }) => (
  <EmptyState
    icon="fa-calendar-plus"
    title="No posts scheduled"
    description="Start by scheduling your first post. You can create posts with text, images, and schedule them for optimal posting times."
    actionLabel="Create First Post"
    onAction={onCreatePost}
    className={className}
    iconClassName="text-indigo-200 dark:text-indigo-800"
  />
);

/**
 * Empty tasks state
 */
export const EmptyTasksState = ({ onCreateTask, className }) => (
  <EmptyState
    icon="fa-check-square"
    title="No tasks yet"
    description="Keep track of your content creation tasks. Add tasks to stay organized and never miss a deadline."
    actionLabel="Add Task"
    onAction={onCreateTask}
    className={className}
    iconClassName="text-green-200 dark:text-green-800"
  />
);

/**
 * Empty templates state
 */
export const EmptyTemplatesState = ({ onCreateTemplate, className }) => (
  <EmptyState
    icon="fa-copy"
    title="No templates yet"
    description="Create reusable templates for your posts. Templates save time by pre-defining content structure."
    actionLabel="Create Template"
    onAction={onCreateTemplate}
    className={className}
    iconClassName="text-blue-200 dark:text-blue-800"
  />
);

/**
 * Empty media state
 */
export const EmptyMediaState = ({ onUpload, className }) => (
  <EmptyState
    icon="fa-images"
    title="No media files"
    description="Upload images and videos to use in your posts. Supported formats: JPG, PNG, GIF, MP4."
    actionLabel="Upload Media"
    onAction={onUpload}
    className={className}
    iconClassName="text-purple-200 dark:text-purple-800"
  />
);

/**
 * Empty search results state
 */
export const EmptySearchState = ({ searchQuery, onClear, className }) => (
  <EmptyState
    icon="fa-search"
    title="No results found"
    description={`We couldn't find any items matching "${searchQuery}". Try adjusting your filters or search terms.`}
    actionLabel="Clear Search"
    onAction={onClear}
    className={className}
    iconClassName="text-gray-300 dark:text-gray-600"
  />
);

/**
 * Empty workspace state
 */
export const EmptyWorkspaceState = ({ onCreateWorkspace, className }) => (
  <EmptyState
    icon="fa-users"
    title="No workspaces yet"
    description="Create a workspace to collaborate with your team. Workspaces allow multiple team members to manage content together."
    actionLabel="Create Workspace"
    onAction={onCreateWorkspace}
    className={className}
    iconClassName="text-orange-200 dark:text-orange-800"
  />
);

export default EmptyState;

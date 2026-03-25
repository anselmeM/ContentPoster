import { memo } from 'react';
import clsx from 'clsx';

/**
 * Reusable Skeleton component for loading states
 * Matches common UI patterns (cards, text, avatars, etc.)
 */
const Skeleton = memo(({
  variant = 'text', // 'text' | 'circular' | 'rectangular' | 'rounded'
  width,
  height,
  className,
  animation = 'pulse', // 'pulse' | 'wave' | 'none'
  baseColor = 'bg-gray-200 dark:bg-gray-700',
  highlightColor = 'bg-gray-300 dark:bg-gray-600'
}) => {
  const variantClasses = {
    circular: 'rounded-full',
    rectangular: 'rounded-none',
    rounded: 'rounded-lg',
    text: 'rounded'
  };

  const animationClasses = {
    pulse: 'animate-pulse',
    wave: 'animate-wave',
    none: ''
  };

  return (
    <div
      className={clsx(
        baseColor,
        variantClasses[variant],
        animationClasses[animation],
        className
      )}
      style={{
        width: width,
        height: height || (variant === 'text' ? '1rem' : undefined)
      }}
      aria-hidden="true"
    />
  );
});

Skeleton.displayName = 'Skeleton';

// Skeleton variants for common patterns

/**
 * PostCard skeleton - matches PostCard dimensions
 */
export const PostCardSkeleton = ({ className }) => (
  <div className={clsx('bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm', className)}>
    {/* Platform icon and title */}
    <div className="flex items-center space-x-2 mb-3">
      <Skeleton variant="circular" width={24} height={24} />
      <Skeleton width="60%" height={16} />
    </div>
    {/* Image placeholder */}
    <Skeleton variant="rounded" width="100%" height={80} className="mb-3" />
    {/* Date/time */}
    <Skeleton width="40%" height={12} />
  </div>
);

/**
 * Task item skeleton - matches task list item dimensions
 */
export const TaskItemSkeleton = ({ className }) => (
  <div className={clsx('flex items-center space-x-3 p-3 bg-white dark:bg-gray-800 rounded-lg', className)}>
    <Skeleton variant="circular" width={20} height={20} />
    <Skeleton width="70%" height={16} />
  </div>
);

/**
 * Table row skeleton
 */
export const TableRowSkeleton = ({ columns = 4, className }) => (
  <div className={clsx('flex items-center space-x-4 p-4', className)}>
    {Array.from({ length: columns }).map((_, i) => (
      <Skeleton key={i} width={`${100 / columns}%`} height={16} />
    ))}
  </div>
);

/**
 * Media item skeleton - for media library
 */
export const MediaItemSkeleton = ({ className }) => (
  <div className={clsx('relative overflow-hidden rounded-lg', className)}>
    <Skeleton variant="rounded" width="100%" height={120} />
    <div className="absolute bottom-0 left-0 right-0 p-2">
      <Skeleton width="80%" height={12} />
    </div>
  </div>
);

/**
 * Profile skeleton - for user avatars
 */
export const ProfileSkeleton = ({ className }) => (
  <div className={clsx('flex items-center space-x-3', className)}>
    <Skeleton variant="circular" width={40} height={40} />
    <div className="space-y-2">
      <Skeleton width={120} height={14} />
      <Skeleton width={80} height={12} />
    </div>
  </div>
);

/**
 * Chart skeleton - for analytics
 */
export const ChartSkeleton = ({ className }) => (
  <div className={clsx('p-4 bg-white dark:bg-gray-800 rounded-lg', className)}>
    <div className="flex justify-between items-center mb-4">
      <Skeleton width={120} height={20} />
      <Skeleton width={80} height={16} />
    </div>
    <div className="flex items-end space-x-2 h-32">
      {Array.from({ length: 7 }).map((_, i) => (
        <Skeleton
          key={i}
          variant="rounded"
          width={40}
          height={`${30 + Math.random() * 70}%`}
          className="flex-shrink-0"
        />
      ))}
    </div>
  </div>
);

/**
 * Empty state placeholder with optional action button
 */
export const EmptyStateSkeleton = ({ className }) => (
  <div className={clsx('flex flex-col items-center justify-center py-12', className)}>
    <Skeleton variant="circular" width={64} height={64} className="mb-4" />
    <Skeleton width={200} height={20} className="mb-2" />
    <Skeleton width={150} height={16} />
  </div>
);

// Animation keyframes for wave effect (add to index.css if needed)
// @keyframes wave {
//   0%, 100% { opacity: 1; }
//   50% { opacity: 0.5; }
// }

export default Skeleton;

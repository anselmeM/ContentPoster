import { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import {
  DndContext,
  rectIntersection,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  useDroppable
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { useAuth } from '../../context/AuthContext';
import { postsService } from '../../services/firebase';
import SortablePostCard from './SortablePostCard';
import clsx from 'clsx';

// Platform-specific colors for drag preview with smooth animations
const platformColors = {
  instagram: 'from-yellow-400 via-red-500 to-purple-500',
  twitter: 'bg-black',
  facebook: 'bg-blue-600',
  linkedin: 'bg-blue-700',
  tiktok: 'bg-black',
  dribbble: 'bg-pink-500'
};

// Spring animation configuration for drag operations
const springConfig = {
  damping: 20,
  stiffness: 300,
  mass: 0.5
};

// Custom drag preview component
const DragPreview = ({ post }) => {
  const platform = platformColors[post.platform] || platformColors.instagram;
  const isGradient = post.platform === 'instagram';
  
  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-xl w-48 transform rotate-3" role="img" aria-label={`Moving ${post.title || 'post'}`}>
      <div className="flex items-center space-x-2 mb-2">
        <span className={clsx(
          'w-6 h-6 rounded-full flex items-center justify-center text-white text-xs',
          isGradient ? `bg-gradient-to-tr ${platform}` : platform
        )}>
          <i className={`fab fa-${post.platform}`} />
        </span>
        <span className="text-sm font-medium text-gray-800 dark:text-white truncate">
          {post.title || 'Post'}
        </span>
      </div>
      {post.image && (
        <img 
          src={post.image} 
          alt="" 
          className="w-full h-20 object-cover rounded"
        />
      )}
      <p className="text-xs text-gray-500 mt-2">
        {post.time}
      </p>
    </div>
  );
};

// Empty state component
const EmptyState = ({ day }) => (
  <div className="flex flex-col items-center justify-center py-8 text-center animate-fade-in">
    <div className="w-16 h-16 mb-3 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
      <i className="fas fa-calendar-plus text-2xl text-gray-400 dark:text-gray-500" />
    </div>
    <p className="text-sm text-gray-400 dark:text-gray-500">No posts</p>
    <p className="text-xs text-gray-300 dark:text-gray-400 mt-1">Drag posts here</p>
  </div>
);

// Skeleton loader for posts
const PostSkeleton = () => (
  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg animate-pulse">
    <div className="flex items-center space-x-2 mb-3">
      <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-600" />
      <div className="h-4 w-24 bg-gray-200 dark:bg-gray-600 rounded" />
    </div>
    <div className="w-full h-20 bg-gray-200 dark:bg-gray-600 rounded-lg mb-3" />
    <div className="h-3 w-16 bg-gray-200 dark:bg-gray-600 rounded" />
  </div>
);

// Map day names to day numbers (1-5 for Mon-Fri)
const dayToDateMap = {
  'Monday': 1,
  'Tuesday': 2,
  'Wednesday': 3,
  'Thursday': 4,
  'Friday': 5
};

// Get the date for a given day name in the current week
const getDateForDay = (dayName, referenceDate = new Date()) => {
  const targetDay = dayToDateMap[dayName];
  if (!targetDay) return null;
  
  const date = new Date(referenceDate);
  const currentDay = date.getDay() || 7; // Convert to 1-7 (Monday-Sunday)
  const diff = targetDay - currentDay;
  
  date.setDate(date.getDate() + diff);
  return date.toISOString().split('T')[0];
};

// Droppable Day Column component
const DroppableDayColumn = ({ day, children }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: day
  });
  
  return (
    <div 
      ref={setNodeRef} 
      className={`space-y-4 min-h-[200px] p-2 ${isOver ? 'bg-indigo-50 dark:bg-indigo-900/20 border-2 border-indigo-300 border-dashed rounded-lg' : ''}`}
    >
      {children}
    </div>
  );
};

const SortablePostGrid = ({ posts, onOpenModal, isLoading = false }) => {
  const { user } = useAuth();
  const [activeId, setActiveId] = useState(null);
  const [announcement, setAnnouncement] = useState('');

  // Debounce ref for Firebase updates during drag operations
  const pendingUpdates = useRef(new Map());
  const updateTimeoutRef = useRef(null);

  // Debounced Firebase update function
  const debouncedUpdate = useCallback((postId, updates) => {
    pendingUpdates.current.set(postId, updates);
    
    // Clear any existing timeout
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }
    
    // Batch updates after 500ms of no new updates
    updateTimeoutRef.current = setTimeout(async () => {
      const updatesToApply = new Map(pendingUpdates.current);
      pendingUpdates.current.clear();
      
      for (const [postId, updates] of updatesToApply) {
        try {
          await postsService.update(user.uid, postId, updates);
        } catch (error) {
          console.error('Failed to update post:', error);
        }
      }
    }, 500);
  }, [user]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
      // Require a small delay before keyboard drag activates
      // This prevents accidental drags when using Tab
      activationConstraint: {
        delay: 150,
        tolerance: 5,
      },
    })
  );

  // Handle keyboard navigation for accessibility
  const handleKeyboardDrag = useCallback((event) => {
    const { active, over } = event;
    
    if (!active || !over) return;
    
    const activePost = posts.find(p => p.id === active.id);
    if (!activePost) return;
    
    // Determine which day column we're over based on keyboard navigation
    let targetDay = null;
    
    if (dayToDateMap[over.id]) {
      targetDay = over.id;
    } else {
      const overPost = posts.find(p => p.id === over.id);
      if (overPost) {
        const postDate = new Date(overPost.date + 'T00:00:00');
        const dayOfWeek = postDate.getUTCDay() || 7;
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        targetDay = dayNames[dayOfWeek];
      }
    }
    
    if (targetDay && dayToDateMap[targetDay]) {
      const newDate = getDateForDay(targetDay);
      if (newDate && newDate !== activePost.date) {
        debouncedUpdate(activePost.id, { date: newDate });
        setAnnouncement(`Moved ${activePost.title || 'post'} to ${targetDay} using keyboard.`);
      }
    }
  }, [posts, debouncedUpdate]);

  const handleDelete = async (postId) => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      await postsService.delete(user.uid, postId);
    }
  };

  const handleToggleComplete = async (post) => {
    await postsService.update(user.uid, post.id, { completed: !post.completed });
  };

  const handleDragStart = (event) => {
    setActiveId(event.active.id);
    const post = posts.find(p => p.id === event.active.id);
    setAnnouncement(`Picked up ${post?.title || 'post'}. Use arrow keys to navigate, space to drop.`);
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) {
      setAnnouncement('Drop cancelled. Press escape to cancel.');
      return;
    }

    const activePost = posts.find(p => p.id === active.id);
    if (!activePost) return;

    // Determine the target day from the drop position
    let targetDay = null;
    
    // Check if dropped directly on a day column (the day name header)
    if (dayToDateMap[over.id]) {
      targetDay = over.id;
    } else {
      // Check if dropped on another post - get that post's day
      const overPost = posts.find(p => p.id === over.id);
      if (overPost) {
        const postDate = new Date(overPost.date + 'T00:00:00');
        const dayOfWeek = postDate.getUTCDay() || 7;
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        targetDay = dayNames[dayOfWeek];
      }
    }

    // If we found a target day and it's different from current day, update the post
    if (targetDay && dayToDateMap[targetDay]) {
      const newDate = getDateForDay(targetDay);
      console.log('Dropping post:', activePost.id, 'from', activePost.date, 'to', newDate, 'targetDay:', targetDay);
      if (newDate && newDate !== activePost.date) {
        try {
          // Use debounced update instead of direct Firebase call
          debouncedUpdate(activePost.id, { date: newDate });
          setAnnouncement(`Moved ${activePost.title || 'post'} to ${targetDay}.`);
        } catch (error) {
          console.error('Failed to update post date:', error);
        }
      } else {
        setAnnouncement(`Dropped on ${targetDay}. Post already on this day.`);
      }
    } else {
      setAnnouncement(`Dropped ${activePost.title || 'post'}.`);
    }
  };

  // Group posts by day of week
  const postsByDay = useMemo(() => {
    const days = {
      Monday: [],
      Tuesday: [],
      Wednesday: [],
      Thursday: [],
      Friday: []
    };
    
    posts.forEach(post => {
      if (!post.date) return;
      
      const dayOfWeek = new Date(post.date + 'T00:00:00').getUTCDay() || 7;
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const dayName = dayNames[dayOfWeek];
      
      if (days[dayName]) {
        days[dayName].push(post);
      }
    });
    
    return days;
  }, [posts]);

  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  // Get the active post for the drag overlay
  const activePost = activeId ? posts.find(p => p.id === activeId) : null;

  return (
    <>
      {/* Screen reader announcements for drag-and-drop */}
      <div 
        className="sr-only" 
        role="status" 
        aria-live="polite" 
        aria-atomic="true"
      >
        {announcement}
      </div>
      
      <DndContext
        sensors={sensors}
        collisionDetection={rectIntersection}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
        {dayNames.map((day) => (
          <div key={day}>
            <div className="text-center mb-4">
              <p className="font-semibold text-gray-800 dark:text-white">{day}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {postsByDay[day]?.length || 0} Post{(postsByDay[day]?.length || 0) !== 1 ? 's' : ''}
              </p>
            </div>
            
            <DroppableDayColumn day={day}>
              <SortableContext
                items={postsByDay[day]?.map(p => p.id) || []}
                strategy={verticalListSortingStrategy}
              >
                {isLoading ? (
                  // Show skeleton loaders while loading
                  Array.from({ length: 3 }).map((_, i) => (
                    <PostSkeleton key={i} />
                  ))
                ) : postsByDay[day]?.length > 0 ? (
                  postsByDay[day].map((post) => (
                    <SortablePostCard
                      key={post.id}
                      post={post}
                      onEdit={() => onOpenModal(post)}
                      onDelete={() => handleDelete(post.id)}
                      onToggleComplete={() => handleToggleComplete(post)}
                    />
                  ))
                ) : (
                  <EmptyState day={day} />
                )}
              </SortableContext>
            </DroppableDayColumn>
          </div>
        ))}
      </div>

      <DragOverlay>
        {activePost ? (
          <DragPreview post={activePost} />
        ) : null}
      </DragOverlay>
    </DndContext>
    </>
  );
};

export default SortablePostGrid;
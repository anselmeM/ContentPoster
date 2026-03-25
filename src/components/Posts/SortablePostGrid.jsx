import { useMemo, useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { useAuth } from '../../context/AuthContext';
import { postsService } from '../../services/firebase';
import SortablePostCard from './SortablePostCard';
import PostCard from './PostCard';

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

const SortablePostGrid = ({ posts, onOpenModal }) => {
  const { user } = useAuth();
  const [activeId, setActiveId] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

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
      if (newDate && newDate !== activePost.date) {
        try {
          await postsService.update(user.uid, activePost.id, { date: newDate });
        } catch (error) {
          console.error('Failed to update post date:', error);
        }
      }
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
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
        {dayNames.map((day) => (
          <SortableContext
            key={day}
            items={postsByDay[day]?.map(p => p.id) || []}
            strategy={verticalListSortingStrategy}
          >
            <div key={day} className="space-y-4">
              <div className="text-center">
                <p className="font-semibold text-gray-800 dark:text-white">{day}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {postsByDay[day]?.length || 0} Post{(postsByDay[day]?.length || 0) !== 1 ? 's' : ''}
                </p>
              </div>
              
              {postsByDay[day]?.length > 0 ? (
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
                <div className="text-center text-sm text-gray-400 p-4 border-2 border-dashed rounded-lg dark:border-gray-600 dark:text-gray-500">
                  No posts
                </div>
              )}
            </div>
          </SortableContext>
        ))}
      </div>

      <DragOverlay>
        {activePost ? (
          <PostCard
            post={activePost}
            onEdit={() => {}}
            onDelete={() => {}}
            onToggleComplete={() => {}}
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};

export default SortablePostGrid;
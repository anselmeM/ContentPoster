import { useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { postsService } from '../../services/firebase';
import PostCard from './PostCard';
import clsx from 'clsx';

const PostGrid = ({ posts, onOpenModal }) => {
  const { user } = useAuth();

  const handleDelete = async (postId) => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      await postsService.delete(user.uid, postId);
    }
  };

  const handleToggleComplete = async (post) => {
    await postsService.update(user.uid, post.id, { completed: !post.completed });
  };

  // Group posts by day of week for the default view
  const postsByDay = useMemo(() => {
    const days = {
      Monday: [],
      Tuesday: [],
      Wednesday: [],
      Thursday: [],
      Friday: []
    };
    
    posts.forEach(post => {
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

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
      {dayNames.map((day) => (
        <div key={day} className="space-y-4">
          <div className="text-center">
            <p className="font-semibold text-gray-800 dark:text-white">{day}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {postsByDay[day]?.length || 0} Post{(postsByDay[day]?.length || 0) !== 1 ? 's' : ''}
            </p>
          </div>
          
          {postsByDay[day]?.length > 0 ? (
            postsByDay[day].map((post) => (
              <PostCard
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
      ))}
    </div>
  );
};

export default PostGrid;
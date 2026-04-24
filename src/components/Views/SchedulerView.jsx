import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { postsService } from '../../services/firebase';
import SortablePostGrid from '../Posts/SortablePostGrid';
import clsx from 'clsx';

const platforms = [
  { id: 'All', label: 'All' },
  { id: 'twitter', label: 'X (Twitter)' },
  { id: 'instagram', label: 'Instagram' },
  { id: 'linkedin', label: 'LinkedIn' },
  { id: 'tiktok', label: 'TikTok' },
  { id: 'dribbble', label: 'Dribbble' },
  { id: 'facebook', label: 'Facebook' }
];

const SchedulerView = ({ selectedPlatform, setSelectedPlatform, selectedDate, setSelectedDate, searchQuery, onOpenModal, onOpenMediaLibrary }) => {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const unsubscribe = postsService.subscribe(user.uid, (postsData) => {
      setPosts(postsData);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // Filter posts based on platform and search query
  const filteredPosts = useMemo(() => {
    // Early return if no filters are applied
    if (selectedPlatform === 'All' && !searchQuery && !selectedDate) {
      return posts;
    }

    const query = searchQuery ? searchQuery.toLowerCase() : null;

    // Single-pass filter for optimal performance
    return posts.filter(p => {
      // Platform filter
      if (selectedPlatform !== 'All' && p.platform !== selectedPlatform) {
        return false;
      }

      // Date filter
      if (selectedDate && p.date !== selectedDate) {
        return false;
      }

      // Search query filter
      if (query && !(p.title?.toLowerCase().includes(query) || p.platform?.toLowerCase().includes(query))) {
        return false;
      }

      return true;
    });
  }, [posts, selectedPlatform, searchQuery, selectedDate]);

  const handleClearFilter = () => {
    setSelectedDate(null);
  };

  return (
    <div className="flex h-full">
      {/* Main content */}
      <div className="flex-1 p-6 overflow-y-auto">
        {/* Platform filter */}
        <div className="flex items-center space-x-6 mb-6">
          {platforms.map((platform) => (
            <button
              key={platform.id}
              onClick={() => setSelectedPlatform(platform.id)}
              className={clsx(
                'text-sm font-medium transition-colors duration-200',
                selectedPlatform === platform.id
                  ? 'text-gray-800 dark:text-white border-b-2 border-indigo-600 pb-1'
                  : 'text-gray-500 hover:text-gray-800 dark:hover:text-white'
              )}
            >
              {platform.label}
            </button>
          ))}
          
          <button
            onClick={() => onOpenModal()}
            className="text-indigo-600 font-semibold hover:text-indigo-700 dark:text-indigo-400"
          >
            + Add
          </button>
          
          <button
            onClick={onOpenMediaLibrary}
            className="text-gray-500 font-semibold hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400"
            title="Open Media Library"
          >
            <i className="fas fa-images mr-1" />
            Media
          </button>
        </div>
        
        {/* Clear filter button */}
        {selectedDate && (
          <button
            onClick={handleClearFilter}
            className="px-3 py-1 bg-red-100 text-red-700 text-sm rounded-lg mb-4 hover:bg-red-200 transition-colors duration-200"
          >
            Clear Filter
          </button>
        )}
        
        {/* Post grid */}
        <SortablePostGrid
          posts={filteredPosts}
          onOpenModal={onOpenModal}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
};

export default SchedulerView;
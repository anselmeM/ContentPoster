import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { postsService } from '../../services/firebase';
import PostGrid from '../Posts/PostGrid';
import LeftPanel from '../Dashboard/LeftPanel';
import clsx from 'clsx';

const platforms = [
  { id: 'All', label: 'All' },
  { id: 'instagram', label: 'Instagram' },
  { id: 'linkedin', label: 'LinkedIn' },
  { id: 'dribbble', label: 'Dribbble' },
  { id: 'facebook', label: 'Facebook' }
];

const SchedulerView = ({ selectedPlatform, setSelectedPlatform, selectedDate, setSelectedDate, searchQuery, onOpenModal }) => {
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
    let filtered = posts;
    
    // Filter by platform
    if (selectedPlatform !== 'All') {
      filtered = filtered.filter(p => p.platform === selectedPlatform);
    }
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p => 
        p.title?.toLowerCase().includes(query) ||
        p.platform?.toLowerCase().includes(query)
      );
    }
    
    // Filter by selected date
    if (selectedDate) {
      filtered = filtered.filter(p => p.date === selectedDate);
    }
    
    return filtered;
  }, [posts, selectedPlatform, searchQuery, selectedDate]);

  const handleClearFilter = () => {
    setSelectedDate(null);
  };

  return (
    <div className="flex h-full">
      {/* Left panel with calendar and stats */}
      <LeftPanel
        posts={posts}
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
      />
      
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
            className="ml-auto text-indigo-600 font-semibold hover:text-indigo-700 dark:text-indigo-400"
          >
            + Add
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
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
          </div>
        ) : (
          <PostGrid
            posts={filteredPosts}
            onOpenModal={onOpenModal}
          />
        )}
      </div>
    </div>
  );
};

export default SchedulerView;
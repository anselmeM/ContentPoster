import { useState, useEffect } from 'react';
import clsx from 'clsx';
import { useDebounce } from '../../hooks/usePerformance';

const Header = ({ currentView, searchQuery, setSearchQuery, theme, toggleTheme, user }) => {
  const [localSearch, setLocalSearch] = useState(searchQuery);
  
  // Debounce search input to prevent excessive re-renders
  const debouncedSearch = useDebounce(localSearch, 300);
  
  // Update parent state only when debounced value changes
  useEffect(() => {
    setSearchQuery(debouncedSearch);
  }, [debouncedSearch, setSearchQuery]);

  const getTitle = () => {
    switch (currentView) {
      case 'scheduler': return 'Scheduled Post';
      case 'tasks': return 'My Tasks';
      case 'templates': return 'Templates';
      case 'settings': return 'Settings';
      default: return '';
    }
  };

  return (
    <header className="flex justify-between items-center px-8 py-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-center space-x-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
          {getTitle()}
        </h2>
      </div>
      
      <div className="flex items-center space-x-4">
        {/* Search */}
        <div className="relative">
          <input
            type="search"
            placeholder="Search..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            aria-label="Search"
          />
          <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden="true" />
        </div>
        
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white transition-colors duration-200"
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          <i className={clsx('fas', theme === 'dark' ? 'fa-sun' : 'fa-moon')} aria-hidden="true" />
        </button>
        
        {/* Notifications */}
        <button
          className="p-2 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white transition-colors duration-200"
          aria-label="Notifications"
        >
          <i className="fas fa-bell" aria-hidden="true" />
        </button>
        
        {/* User avatar */}
        <img
          src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.email || 'User')}&background=E0E7FF&color=4F46E5`}
          alt="User avatar"
          className="w-8 h-8 rounded-full"
        />
      </div>
    </header>
  );
};

export default Header;
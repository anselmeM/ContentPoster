import { useState, useEffect } from 'react';
import clsx from 'clsx';
import { searchService } from '../../services/enhancedFeatures';

const AdvancedSearchFilters = ({ onSearch, initialFilters = {} }) => {
  const [filters, setFilters] = useState({
    searchText: initialFilters.searchText || '',
    platform: initialFilters.platform || 'all',
    status: initialFilters.status || 'all',
    completed: initialFilters.completed ?? 'all',
    dateRange: initialFilters.dateRange || 'all',
    startDate: initialFilters.startDate || '',
    endDate: initialFilters.endDate || ''
  });
  
  const [isExpanded, setIsExpanded] = useState(false);
  
  const platformOptions = [
    { value: 'all', label: 'All Platforms' },
    { value: 'instagram', label: 'Instagram' },
    { value: 'twitter', label: 'Twitter/X' },
    { value: 'facebook', label: 'Facebook' },
    { value: 'linkedin', label: 'LinkedIn' },
    { value: 'tiktok', label: 'TikTok' },
    { value: 'pinterest', label: 'Pinterest' },
    { value: 'youtube', label: 'YouTube' },
    { value: 'snapchat', label: 'Snapchat' },
    { value: 'reddit', label: 'Reddit' },
    { value: 'dribbble', label: 'Dribbble' }
  ];
  
  const statusOptions = [
    { value: 'all', label: 'All Statuses' },
    { value: 'draft', label: 'Draft' },
    { value: 'pending_review', label: 'Pending Review' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' }
  ];
  
  const completedOptions = [
    { value: 'all', label: 'All' },
    { value: 'true', label: 'Completed' },
    { value: 'false', label: 'Pending' }
  ];
  
  const dateRangeOptions = [
    { value: 'all', label: 'All Time' },
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'year', label: 'This Year' },
    { value: 'custom', label: 'Custom Range' }
  ];
  
  // Calculate date range based on selection
  useEffect(() => {
    if (filters.dateRange !== 'custom') {
      const now = new Date();
      let startDate = null;
      
      switch (filters.dateRange) {
        case 'today':
          startDate = now.toISOString().split('T')[0];
          break;
        case 'week':
          startDate = new Date(now.setDate(now.getDate() - 7)).toISOString().split('T')[0];
          break;
        case 'month':
          startDate = new Date(now.setMonth(now.getMonth() - 1)).toISOString().split('T')[0];
          break;
        case 'year':
          startDate = new Date(now.setFullYear(now.getFullYear() - 1)).toISOString().split('T')[0];
          break;
        default:
          startDate = null;
      }
      
      if (startDate) {
        setFilters(prev => ({ ...prev, startDate, endDate: new Date().toISOString().split('T')[0] }));
      }
    }
  }, [filters.dateRange]);
  
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };
  
  const handleSearch = () => {
    onSearch && onSearch(filters);
  };
  
  const handleClear = () => {
    const cleared = {
      searchText: '',
      platform: 'all',
      status: 'all',
      completed: 'all',
      dateRange: 'all',
      startDate: '',
      endDate: ''
    };
    setFilters(cleared);
    onSearch && onSearch(cleared);
  };
  
  const hasActiveFilters = 
    filters.searchText || 
    filters.platform !== 'all' || 
    filters.status !== 'all' || 
    filters.completed !== 'all' ||
    filters.dateRange !== 'all';
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      {/* Search Bar */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={filters.searchText}
              onChange={(e) => handleFilterChange('searchText', e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Search posts by title, content, or hashtags..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
          <button
            onClick={handleSearch}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Search
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={clsx(
              'px-4 py-2 border rounded-lg transition-colors',
              isExpanded 
                ? 'bg-indigo-50 border-indigo-300 text-indigo-700 dark:bg-indigo-900/30 dark:border-indigo-700 dark:text-indigo-300'
                : 'border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700'
            )}
          >
            <i className={clsx('fas fa-filter mr-2', hasActiveFilters && 'text-indigo-500')} />
            Filters
            {hasActiveFilters && (
              <span className="ml-1 px-1.5 py-0.5 bg-indigo-500 text-white text-xs rounded-full">
                !
              </span>
            )}
          </button>
        </div>
      </div>
      
      {/* Advanced Filters */}
      {isExpanded && (
        <div className="p-4 space-y-4 bg-gray-50 dark:bg-gray-900/50">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Platform */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Platform
              </label>
              <select
                value={filters.platform}
                onChange={(e) => handleFilterChange('platform', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
              >
                {platformOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            
            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
              >
                {statusOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            
            {/* Completion */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Completion
              </label>
              <select
                value={filters.completed}
                onChange={(e) => handleFilterChange('completed', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
              >
                {completedOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>
          
          {/* Date Range */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Date Range
              </label>
              <select
                value={filters.dateRange}
                onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
              >
                {dateRangeOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            
            {filters.dateRange === 'custom' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => handleFilterChange('startDate', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => handleFilterChange('endDate', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </>
            )}
          </div>
          
          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={handleClear}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 rounded-lg"
            >
              Clear All
            </button>
            <button
              onClick={handleSearch}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedSearchFilters;
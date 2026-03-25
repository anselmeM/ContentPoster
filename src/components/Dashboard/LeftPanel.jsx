import { useState, useEffect, useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { getOptimalTimes } from '../../utils/timezoneUtils';
import clsx from 'clsx';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const LeftPanel = ({ posts, selectedDate, setSelectedDate, onReschedulePost, isCollapsed }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [draggedPost, setDraggedPost] = useState(null);
  const [viewMode, setViewMode] = useState('month'); // month, week

  // Calculate stats
  const stats = useMemo(() => {
    const now = new Date();
    return {
      completed: posts.filter(p => p.completed).length,
      total: posts.length,
      inProgress: posts.filter(p => !p.completed && new Date(`${p.date}T${p.time}`) > now).length,
      overdue: posts.filter(p => !p.completed && new Date(`${p.date}T${p.time}`) < now).length,
      scheduled: posts.filter(p => !p.completed).length
    };
  }, [posts]);

  // Get completed posts for display
  const completedPosts = useMemo(() => {
    return posts
      .filter(p => p.completed)
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5);
  }, [posts]);

  // Get posts for a specific date
  const getPostsForDate = (dateStr) => {
    return posts.filter(p => p.date === dateStr);
  };

  // Calendar logic
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month, 1).getDay();
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const startOffset = firstDay === 0 ? 6 : firstDay - 1;
    
    const days = [];
    const today = new Date().toISOString().split('T')[0];
    
    // Empty cells for days before the first of the month
    for (let i = 0; i < startOffset; i++) {
      days.push(
        <div 
          key={`empty-${i}`} 
          className="py-2 min-h-[80px] border border-gray-100 dark:border-gray-700/50"
        />
      );
    }
    
    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayPosts = getPostsForDate(dateStr);
      const isSelected = selectedDate === dateStr;
      const isToday = dateStr === today;
      const isPast = dateStr < today;
      
      days.push(
        <div
          key={day}
          className={clsx(
            'min-h-[80px] border border-gray-100 dark:border-gray-700/50 p-1 transition-colors',
            isSelected && 'bg-indigo-50 dark:bg-indigo-900/20',
            isToday && 'bg-yellow-50 dark:bg-yellow-900/20'
          )}
          onDragOver={(e) => e.preventDefault()}
          onDrop={() => handleDrop(dateStr)}
        >
          <button
            onClick={() => setSelectedDate(isSelected ? null : dateStr)}
            className={clsx(
              'w-full text-left p-1 text-sm rounded',
              isToday && 'font-bold text-yellow-600 dark:text-yellow-400',
              isPast && !isToday && 'text-gray-400 dark:text-gray-500',
              !isPast && !isToday && 'text-gray-700 dark:text-gray-300'
            )}
          >
            {day}
          </button>
          
          {/* Post indicators */}
          <div className="space-y-1 mt-1">
            {dayPosts.slice(0, 2).map((post, idx) => (
              <div
                key={post.id}
                draggable
                onDragStart={(e) => handleDragStart(e, post)}
                className={clsx(
                  'text-xs px-1 py-0.5 rounded truncate cursor-move',
                  post.platform === 'instagram' && 'bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300',
                  post.platform === 'twitter' && 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300',
                  post.platform === 'linkedin' && 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
                  post.platform === 'facebook' && 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
                  post.platform === 'tiktok' && 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
                  post.platform === 'dribbble' && 'bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300'
                )}
                title={post.title}
              >
                {post.time} {post.title?.substring(0, 10)}
              </div>
            ))}
            {dayPosts.length > 2 && (
              <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                +{dayPosts.length - 2} more
              </div>
            )}
          </div>
        </div>
      );
    }
    
    return days;
  };

  // Drag and drop handlers
  const handleDragStart = (e, post) => {
    setDraggedPost(post);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDrop = async (newDate) => {
    if (draggedPost && onReschedulePost) {
      await onReschedulePost(draggedPost.id, newDate, draggedPost.time);
    }
    setDraggedPost(null);
  };

  const navigateMonth = (direction) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + direction, 1));
  };

  // Jump to today
  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(new Date().toISOString().split('T')[0]);
  };

  // Chart data
  const chartData = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const postsThisMonth = posts.filter(post => {
      const postDate = new Date(post.date);
      return postDate.getFullYear() === year && postDate.getMonth() === month;
    });
    
    const weeklyCounts = [0, 0, 0, 0, 0];
    postsThisMonth.forEach(post => {
      const dayOfMonth = new Date(post.date).getDate();
      const weekOfMonth = Math.floor((dayOfMonth - 1) / 7);
      if (weekOfMonth < 5) {
        weeklyCounts[weekOfMonth]++;
      }
    });
    
    return {
      labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5'],
      datasets: [
        {
          label: 'Posts',
          data: weeklyCounts,
          fill: true,
          backgroundColor: 'rgba(79, 70, 229, 0.1)',
          borderColor: 'rgba(79, 70, 229, 1)',
          borderWidth: 2,
          tension: 0.4
        }
      ]
    };
  }, [posts, currentDate]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: { beginAtZero: true, display: false },
      x: { grid: { display: false } }
    },
    plugins: {
      legend: { display: false }
    }
  };

  const monthName = currentDate.toLocaleString('default', { month: 'long' });

  return (
    <div className={clsx(
      'bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 p-4 overflow-y-auto transition-all duration-300 ease-in-out',
      isCollapsed ? 'w-16' : 'w-80'
    )}>
      {/* Expanded Content */}
      {!isCollapsed && (
        <>
      {/* User greeting */}
      <div className="flex items-center space-x-3 mb-6">
        <img
          src="https://ui-avatars.com/api/?name=User&background=E0E7FF&color=4F46E5"
          alt="User Avatar"
          className="w-10 h-10 rounded-full"
        />
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Hello 👋</p>
          <p className="font-semibold text-gray-800 dark:text-white">User</p>
        </div>
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 p-3 rounded-lg">
          <p className="text-2xl font-bold">{stats.completed}</p>
          <p className="text-xs">Completed</p>
        </div>
        <div className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300 p-3 rounded-lg">
          <p className="text-2xl font-bold">{stats.total}</p>
          <p className="text-xs">Total Posts</p>
        </div>
        <div className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 p-3 rounded-lg">
          <p className="text-2xl font-bold">{stats.scheduled}</p>
          <p className="text-xs">Scheduled</p>
        </div>
        <div className="bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 p-3 rounded-lg">
          <p className="text-2xl font-bold">{stats.overdue}</p>
          <p className="text-xs">Overdue</p>
        </div>
      </div>
      
      {/* Quick Actions */}
      <div className="flex space-x-2 mb-6">
        <button
          onClick={goToToday}
          className="flex-1 px-3 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Today
        </button>
        <select
          value={viewMode}
          onChange={(e) => setViewMode(e.target.value)}
          className="px-2 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300"
        >
          <option value="month">Month</option>
          <option value="week">Week</option>
        </select>
      </div>
      
      {/* Calendar */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-semibold text-gray-800 dark:text-white text-sm">
            {monthName} {currentDate.getFullYear()}
          </h3>
          <div className="flex space-x-1">
            <button
              onClick={() => navigateMonth(-1)}
              className="text-gray-500 hover:text-gray-800 dark:hover:text-white p-1"
              aria-label="Previous month"
            >
              <i className="fas fa-chevron-left text-xs" />
            </button>
            <button
              onClick={() => navigateMonth(1)}
              className="text-gray-500 hover:text-gray-800 dark:hover:text-white p-1"
              aria-label="Next month"
            >
              <i className="fas fa-chevron-right text-xs" />
            </button>
          </div>
        </div>
        <div className="grid grid-cols-7 text-center text-xs text-gray-500 dark:text-gray-400 mb-1">
          <div>Mo</div>
          <div>Tu</div>
          <div>We</div>
          <div>Th</div>
          <div>Fr</div>
          <div>Sa</div>
          <div>Su</div>
        </div>
        <div className="grid grid-cols-7 text-center text-xs">
          {renderCalendar()}
        </div>
      </div>
      
      {/* Post Stats Chart */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-semibold text-gray-800 dark:text-white text-sm">Post Stats</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">{monthName}</p>
        </div>
        <div className="h-32">
          <Line data={chartData} options={chartOptions} />
        </div>
      </div>

      {/* Completed Posts Section */}
      <div className="mt-6">
        <h3 className="font-semibold text-gray-800 dark:text-white text-sm mb-3">
          <i className="fas fa-check-circle mr-2 text-green-500" />
          Recent Completed Posts
        </h3>
        {completedPosts.length > 0 ? (
          <div className="space-y-2">
            {completedPosts.map((post) => (
              <div
                key={post.id}
                className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-100 dark:border-green-800"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 overflow-hidden">
                    <span className={clsx(
                      'w-5 h-5 rounded-full flex items-center justify-center text-white text-xs',
                      post.platform === 'instagram' && 'bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500',
                      post.platform === 'twitter' && 'bg-black',
                      post.platform === 'linkedin' && 'bg-blue-700',
                      post.platform === 'facebook' && 'bg-blue-600',
                      post.platform === 'tiktok' && 'bg-black',
                      post.platform === 'dribbble' && 'bg-pink-500'
                    )}>
                      <i className={`fab fa-${post.platform}`} />
                    </span>
                    <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
                      {post.title || post.content?.substring(0, 15) || 'Post'}
                    </span>
                  </div>
                  <span className="text-xs text-green-600 dark:text-green-400">
                    {post.engagement?.likes || 0} <i className="fas fa-heart text-xs" />
                  </span>
                </div>
                <div className="flex justify-between mt-1 text-xs text-gray-500 dark:text-gray-400">
                  <span>{post.date}</span>
                  <span>{post.engagement?.comments || 0} comments</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-gray-500 dark:text-gray-400">No completed posts yet</p>
        )}
      </div>
      
      {/* Tip */}
      <div className="mt-6 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <p className="text-xs text-blue-700 dark:text-blue-300">
          <i className="fas fa-lightbulb mr-1" />
          Tip: Drag and drop posts on the calendar to reschedule them.
        </p>
      </div>
        </>
      )}
    </div>
  );
};

export default LeftPanel;
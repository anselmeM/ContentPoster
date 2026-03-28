import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { postsService } from '../../services/firebase';
import { getPlatformConfig } from '../../config/platforms';
import { getLocalTimezone } from '../../utils/timezoneUtils';
import TimeZoneGrid from '../UI/TimeZoneGrid';
import clsx from 'clsx';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const CalendarView = ({ onSelectDate, onEditPost, onDragStart }) => {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [posts, setPosts] = useState([]);
  const [view, setView] = useState('month'); // 'month', 'week'
  const [gridView, setGridView] = useState('calendar'); // 'calendar' or 'timezone'
  const userTimezone = getLocalTimezone();
  
  // Pre-group posts by date to turn O(n²) rendering loop into O(n) mapping + O(1) lookups
  const postsByDate = useMemo(() => {
    const map = {};
    for (const post of (posts || [])) {
      if (!map[post.date]) {
        map[post.date] = [];
      }
      map[post.date].push(post);
    }
    return map;
  }, [posts]);

  // Load posts
  useEffect(() => {
    if (!user) return;
    
    const unsubscribe = postsService.subscribe(user.uid, (postsData) => {
      setPosts(postsData);
    });
    
    return () => unsubscribe();
  }, [user]);
  
  // Get days in month
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    
    const days = [];
    
    // Previous month days
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startingDay - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonthLastDay - i),
        isCurrentMonth: false
      });
    }
    
    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        date: new Date(year, month, i),
        isCurrentMonth: true
      });
    }
    
    // Next month days
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false
      });
    }
    
    return days;
  };
  
  // Get posts for a specific day
  const getPostsForDay = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    return postsByDate[dateStr] || [];
  };
  
  // Navigation
  const goToPrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };
  
  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };
  
  const goToToday = () => {
    setCurrentDate(new Date());
  };
  
  // Drag handlers
  const handleDragStart = (e, post) => {
    e.dataTransfer.setData('text/plain', JSON.stringify(post));
    onDragStart && onDragStart(post);
  };
  
  const handleDragOver = (e) => {
    e.preventDefault();
  };
  
  const handleDrop = async (e, date) => {
    e.preventDefault();
    try {
      const postData = JSON.parse(e.dataTransfer.getData('text/plain'));
      const newDate = date.toISOString().split('T')[0];
      
      if (user && postData.id) {
        await postsService.update(user.uid, postData.id, { date: newDate });
      }
    } catch (error) {
      console.error('Drop failed:', error);
    }
  };
  
  // Cache the string representation of today for this render cycle to avoid new Date() on every render loop iteration
  const todayString = new Date().toDateString();

  // Today check
  const isToday = (date) => {
    return date.toDateString() === todayString;
  };
  
  const days = getDaysInMonth(currentDate);
  
  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-800">
      {/* Calendar Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          <button
            onClick={goToToday}
            className="px-3 py-1 text-sm bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300"
          >
            Today
          </button>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={goToPrevMonth}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <i className="fas fa-chevron-left" />
          </button>
          <button
            onClick={goToNextMonth}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <i className="fas fa-chevron-right" />
          </button>
          
          <div className="ml-4 flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setView('month')}
              className={clsx(
                'px-3 py-1 text-sm rounded-md',
                view === 'month' ? 'bg-white dark:bg-gray-600 shadow' : ''
              )}
            >
              Month
            </button>
            <button
              onClick={() => setView('week')}
              className={clsx(
                'px-3 py-1 text-sm rounded-md',
                view === 'week' ? 'bg-white dark:bg-gray-600 shadow' : ''
              )}
            >
              Week
            </button>
          </div>
          
          <button
            onClick={() => setGridView(gridView === 'calendar' ? 'timezone' : 'calendar')}
            className={clsx(
              'ml-2 px-3 py-1 text-sm rounded-lg border-2 transition-all',
              gridView === 'timezone' 
                ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                : 'border-gray-200 dark:border-gray-600 text-gray-500 hover:border-gray-300'
            )}
            title="Toggle Time Zone Grid"
          >
            <i className="fas fa-globe mr-1" />
            {gridView === 'calendar' ? 'Grid' : 'Calendar'}
          </button>
        </div>
      </div>
      
      {/* Time Zone Grid View */}
      {gridView === 'timezone' ? (
        <div className="flex-1 p-4 overflow-auto">
          <TimeZoneGrid
            posts={posts}
            userTimezone={userTimezone}
            selectedDate={currentDate.toISOString().split('T')[0]}
          />
        </div>
      ) : (
        <>
          {/* Day Headers */}
          <div className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-700">
            {DAYS.map(day => (
              <div key={day} className="py-2 text-center text-sm font-medium text-gray-500 dark:text-gray-400">
                {day}
              </div>
            ))}
          </div>
          
          {/* Calendar Grid */}
      <div className="flex-1 grid grid-cols-7 auto-rows-fr">
        {days.map((day, index) => {
          const dayPosts = getPostsForDay(day.date);
          const today = isToday(day.date);
          
          return (
            <div
              key={index}
              className={clsx(
                'min-h-[100px] p-2 border-b border-r border-gray-200 dark:border-gray-700',
                !day.isCurrentMonth && 'bg-gray-50 dark:bg-gray-900/50',
                today && 'bg-indigo-50 dark:bg-indigo-900/20'
              )}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, day.date)}
              onClick={() => onSelectDate && onSelectDate(day.date)}
            >
              <div className={clsx(
                'text-sm font-medium mb-1',
                today 
                  ? 'text-indigo-600 dark:text-indigo-400' 
                  : day.isCurrentMonth 
                    ? 'text-gray-900 dark:text-white' 
                    : 'text-gray-400 dark:text-gray-500'
              )}>
                {day.date.getDate()}
              </div>
              
              <div className="space-y-1">
                {dayPosts.slice(0, 3).map(post => {
                  const platform = getPlatformConfig(post.platform);
                  return (
                    <div
                      key={post.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, post)}
                      onClick={(e) => { e.stopPropagation(); onEditPost && onEditPost(post); }}
                      className={clsx(
                        'text-xs p-1 rounded truncate cursor-pointer hover:opacity-80',
                        post.completed 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                      )}
                      style={{ borderLeft: `3px solid ${platform?.bgColor || '#6366f1'}` }}
                      title={post.title}
                    >
                      {post.time} {post.title}
                    </div>
                  );
                })}
                {dayPosts.length > 3 && (
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    +{dayPosts.length - 3} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Legend */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
        <span><i className="fas fa-circle text-green-500 mr-1" /> Completed</span>
        <span><i className="fas fa-circle text-gray-400 mr-1" /> Pending</span>
        <span className="text-xs">(Drag posts to reschedule)</span>
      </div>
      </>
      )}
    </div>
  );
};

export default CalendarView;
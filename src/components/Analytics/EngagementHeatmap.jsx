import { useState, useMemo } from 'react';
import clsx from 'clsx';

// Day names and hour labels
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

// Generate color scale based on engagement value
const getHeatmapColor = (value, max) => {
  if (value === 0) return 'bg-gray-100 dark:bg-gray-800';
  
  const ratio = value / max;
  
  if (ratio < 0.2) return 'bg-green-200 dark:bg-green-900';
  if (ratio < 0.4) return 'bg-green-300 dark:bg-green-700';
  if (ratio < 0.6) return 'bg-green-400 dark:bg-green-500';
  if (ratio < 0.8) return 'bg-green-500 dark:bg-green-400';
  return 'bg-green-600 dark:bg-green-300';
};

// Format time for display
const formatHour = (hour) => {
  if (hour === 0) return '12am';
  if (hour === 12) return '12pm';
  if (hour < 12) return `${hour}am`;
  return `${hour - 12}pm`;
};

const EngagementHeatmap = ({ 
  posts = [],
  showByDay = true, // Show day x hour heatmap
  showByWeek = false, // Show weekly pattern
  onCellClick,
  colorScheme = 'green'
}) => {
  const [selectedCell, setSelectedCell] = useState(null);
  const [tooltipData, setTooltipData] = useState(null);

  // Calculate heatmap data - Day of Week x Hour
  const dayHourData = useMemo(() => {
    const data = {};
    
    // Initialize all day-hour combinations with zero
    DAYS.forEach((day, dayIndex) => {
      data[dayIndex] = {};
      HOURS.forEach(hour => {
        data[dayIndex][hour] = {
          posts: [],
          likes: 0,
          comments: 0,
          shares: 0,
          views: 0,
          totalEngagement: 0
        };
      });
    });

    // Aggregate posts by day and hour
    posts.forEach(post => {
      if (!post.date || !post.time) return;
      
      const postDate = new Date(post.date);
      const dayIndex = postDate.getDay();
      
      // Parse time to get hour
      const [hour] = post.time.split(':').map(Number);
      
      if (!data[dayIndex][hour]) return;
      
      const eng = post.engagement || {};
      const engagement = (eng.likes || 0) + (eng.comments || 0) + (eng.shares || 0);
      
      data[dayIndex][hour].posts.push(post);
      data[dayIndex][hour].likes += eng.likes || 0;
      data[dayIndex][hour].comments += eng.comments || 0;
      data[dayIndex][hour].shares += eng.shares || 0;
      data[dayIndex][hour].views += eng.views || 0;
      data[dayIndex][hour].totalEngagement += engagement;
    });

    return data;
  }, [posts]);

  // Calculate heatmap data - Day of Month (calendar view)
  const dayOfMonthData = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    
    const data = {};
    
    for (let day = 1; day <= daysInMonth; day++) {
      data[day] = {
        posts: [],
        likes: 0,
        comments: 0,
        shares: 0,
        totalEngagement: 0
      };
    }

    posts.forEach(post => {
      if (!post.date) return;
      
      const postDate = new Date(post.date);
      if (postDate.getMonth() !== currentMonth || postDate.getFullYear() !== currentYear) return;
      
      const day = postDate.getDate();
      const eng = post.engagement || {};
      
      data[day].posts.push(post);
      data[day].likes += eng.likes || 0;
      data[day].comments += eng.comments || 0;
      data[day].shares += eng.shares || 0;
      data[day].totalEngagement += (eng.likes || 0) + (eng.comments || 0) + (eng.shares || 0);
    });

    return data;
  }, [posts]);

  // Find max engagement for color scaling
  const maxEngagement = useMemo(() => {
    let max = 0;
    Object.values(dayHourData).forEach(dayData => {
      Object.values(dayData).forEach(hourData => {
        if (hourData.totalEngagement > max) {
          max = hourData.totalEngagement;
        }
      });
    });
    return max || 1;
  }, [dayHourData]);

  const maxMonthEngagement = useMemo(() => {
    let max = 0;
    Object.values(dayOfMonthData).forEach(dayData => {
      if (dayData.totalEngagement > max) {
        max = dayData.totalEngagement;
      }
    });
    return max || 1;
  }, [dayOfMonthData]);

  // Get best posting times
  const bestTimes = useMemo(() => {
    const times = [];
    
    Object.entries(dayHourData).forEach(([dayIndex, dayData]) => {
      Object.entries(dayData).forEach(([hour, data]) => {
        if (data.totalEngagement > 0) {
          times.push({
            dayIndex: parseInt(dayIndex),
            day: DAYS[parseInt(dayIndex)],
            hour: parseInt(hour),
            time: formatHour(parseInt(hour)),
            engagement: data.totalEngagement,
            postCount: data.posts.length
          });
        }
      });
    });

    return times.sort((a, b) => b.engagement - a.engagement).slice(0, 5);
  }, [dayHourData]);

  // Handle cell click
  const handleCellClick = (dayIndex, hour, data) => {
    setSelectedCell({ dayIndex, hour, data });
    onCellClick && onCellClick({ dayIndex, hour, data });
  };

  // Render day x hour heatmap
  const renderDayHourHeatmap = () => (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr>
            <th className="p-2 text-xs text-gray-500 dark:text-gray-400"></th>
            {HOURS.filter((h, i) => i % 3 === 0).map(hour => (
              <th key={hour} className="p-2 text-xs text-gray-500 dark:text-gray-400 text-center">
                {formatHour(hour)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {DAYS.map((day, dayIndex) => (
            <tr key={day}>
              <td className="p-2 text-xs text-gray-600 dark:text-gray-400 font-medium w-12">
                {day}
              </td>
              {HOURS.filter((h, i) => i % 3 === 0).map(hour => {
                const data = dayHourData[dayIndex][hour];
                const isSelected = selectedCell?.dayIndex === dayIndex && selectedCell?.hour === hour;
                
                return (
                  <td key={hour} className="p-1">
                    <div
                      className={clsx(
                        'w-full h-8 rounded cursor-pointer transition-transform hover:scale-105',
                        getHeatmapColor(data.totalEngagement, maxEngagement),
                        isSelected && 'ring-2 ring-indigo-500 ring-offset-2'
                      )}
                      onClick={() => handleCellClick(dayIndex, hour, data)}
                      onMouseEnter={() => setTooltipData({ day, hour: formatHour(hour), ...data })}
                      onMouseLeave={() => setTooltipData(null)}
                      title={`${day} ${formatHour(hour)}: ${data.totalEngagement} engagement`}
                    />
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  // Render calendar month heatmap
  const renderCalendarHeatmap = () => {
    const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).getDay();
    const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
    
    const weeks = [];
    let currentWeek = [];
    
    // Add empty cells for days before the first of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      currentWeek.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      currentWeek.push(day);
      
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    }
    
    // Add empty cells for remaining days
    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push(null);
      }
      weeks.push(currentWeek);
    }

    return (
      <div className="grid grid-cols-7 gap-1">
        {/* Day headers */}
        {DAYS.map(day => (
          <div key={day} className="text-center text-xs text-gray-500 dark:text-gray-400 font-medium py-2">
            {day}
          </div>
        ))}
        
        {/* Calendar cells */}
        {weeks.map((week, weekIndex) => (
          week.map((day, dayIndex) => {
            if (day === null) {
              return <div key={`empty-${weekIndex}-${dayIndex}`} className="h-12" />;
            }
            
            const data = dayOfMonthData[day] || { totalEngagement: 0, posts: [] };
            const isToday = day === new Date().getDate();
            
            return (
              <div
                key={day}
                className={clsx(
                  'h-12 rounded flex items-center justify-center cursor-pointer transition-all hover:scale-105',
                  getHeatmapColor(data.totalEngagement, maxMonthEngagement),
                  isToday && 'ring-2 ring-indigo-500'
                )}
                onClick={() => onCellClick && onCellClick({ day, data })}
                onMouseEnter={() => setTooltipData({ day, ...data })}
                onMouseLeave={() => setTooltipData(null)}
              >
                <span className={clsx(
                  'text-xs font-medium',
                  data.totalEngagement > maxMonthEngagement * 0.5 ? 'text-white' : 'text-gray-700 dark:text-gray-300'
                )}>
                  {day}
                </span>
              </div>
            );
          })
        ))}
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
            <i className="fas fa-calendar-alt mr-2 text-indigo-600" />
            Engagement Heatmap
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Visualize posting patterns and engagement distribution
          </p>
        </div>
        
        {/* Best Times */}
        {bestTimes.length > 0 && (
          <div className="text-right">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Best Times to Post</p>
            <div className="flex gap-2">
              {bestTimes.slice(0, 3).map((time, idx) => (
                <span 
                  key={idx}
                  className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs rounded"
                >
                  {time.day} {time.time}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* View Toggle */}
      <div className="flex items-center gap-4 mb-4">
        <button
          onClick={() => {}}
          className={clsx(
            'px-3 py-1 text-sm rounded-lg border transition-all',
            showByDay 
              ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
              : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400'
          )}
        >
          <i className="fas fa-clock mr-1" />
          Day x Hour
        </button>
        <button
          onClick={() => {}}
          className={clsx(
            'px-3 py-1 text-sm rounded-lg border transition-all',
            showByWeek 
              ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
              : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400'
          )}
        >
          <i className="fas fa-calendar-week mr-1" />
          Monthly Calendar
        </button>
      </div>

      {/* Heatmap */}
      {showByDay ? renderDayHourHeatmap() : renderCalendarHeatmap()}

      {/* Legend */}
      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 dark:text-gray-400">Less</span>
          <div className="flex gap-1">
            {['bg-gray-100 dark:bg-gray-800', 'bg-green-200 dark:bg-green-900', 'bg-green-400 dark:bg-green-500', 'bg-green-600 dark:bg-green-300'].map((color, idx) => (
              <div key={idx} className={`w-4 h-4 rounded ${color}`} />
            ))}
          </div>
          <span className="text-xs text-gray-500 dark:text-gray-400">More</span>
        </div>
        
        {selectedCell && (
          <div className="text-sm text-gray-600 dark:text-gray-400">
            <i className="fas fa-info-circle mr-1" />
            {DAYS[selectedCell.dayIndex]} at {formatHour(selectedCell.hour)}: 
            {selectedCell.data.posts.length} posts, {selectedCell.data.totalEngagement} engagement
          </div>
        )}
      </div>

      {/* No Data State */}
      {posts.length === 0 && (
        <div className="flex items-center justify-center h-48 text-gray-500 dark:text-gray-400">
          <div className="text-center">
            <i className="fas fa-calendar Heatmap text-4xl mb-3 opacity-50" />
            <p>No engagement data available</p>
            <p className="text-sm mt-1">Schedule posts to see heatmap data</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default EngagementHeatmap;
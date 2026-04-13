import { useState, useMemo } from 'react';
import clsx from 'clsx';

// Default timezones to display in the grid
const DEFAULT_DISPLAY_TIMEZONES = [
  { value: 'America/New_York', label: 'New York', offset: '-05:00', region: 'US East' },
  { value: 'America/Los_Angeles', label: 'Los Angeles', offset: '-08:00', region: 'US West' },
  { value: 'America/Chicago', label: 'Chicago', offset: '-06:00', region: 'US Central' },
  { value: 'Europe/London', label: 'London', offset: '+00:00', region: 'Europe' },
  { value: 'Europe/Paris', label: 'Paris', offset: '+01:00', region: 'Europe' },
  { value: 'Asia/Tokyo', label: 'Tokyo', offset: '+09:00', region: 'Asia' },
  { value: 'Australia/Sydney', label: 'Sydney', offset: '+11:00', region: 'Australia' },
];

// Convert time from one timezone to another
const convertTime = (date, time, fromTimezone, toTimezone) => {
  if (!date || !time) return null;
  
  try {
    // Create a date object in the source timezone
    const [hours, minutes] = time.split(':').map(Number);
    const sourceDate = new Date(date);
    sourceDate.setHours(hours, minutes, 0, 0);
    
    // Get the time in the target timezone
    const targetTimeStr = sourceDate.toLocaleString('en-US', { 
      timeZone: toTimezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
    
    return targetTimeStr;
  } catch (error) {
    console.error('Time conversion error:', error);
    return time; // Fallback to original time
  }
};

// Get current time in a specific timezone
const getCurrentTimeInTimezone = (timezone) => {
  return new Date().toLocaleString('en-US', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
};

// Get timezone abbreviation
const getTimezoneAbbr = (timezone) => {
  const abbrs = {
    'America/New_York': 'ET',
    'America/Los_Angeles': 'PT',
    'America/Chicago': 'CT',
    'America/Denver': 'MT',
    'Europe/London': 'GMT',
    'Europe/Paris': 'CET',
    'Asia/Tokyo': 'JST',
    'Asia/Singapore': 'SGT',
    'Australia/Sydney': 'AEST'
  };
  return abbrs[timezone] || timezone.split('/').pop();
};

const TimeZoneGrid = ({ 
  posts = [], 
  userTimezone = 'America/New_York',
  displayTimezones = DEFAULT_DISPLAY_TIMEZONES,
  onTimezoneToggle,
  selectedDate = null 
}) => {
  const [selectedReferenceTimezone, setSelectedReferenceTimezone] = useState(userTimezone);
  const [showTimezoneSelector, setShowTimezoneSelector] = useState(false);
  
  // Group posts by time for the grid
  const postsByTime = useMemo(() => {
    if (!posts.length) return {};
    
    const grouped = {};
    posts.forEach(post => {
      if (!post.time) return;
      if (selectedDate && post.date !== selectedDate) return;
      
      // Use reference timezone for grouping
      const localTime = convertTime(post.date, post.time, userTimezone, selectedReferenceTimezone);
      if (!grouped[localTime]) {
        grouped[localTime] = [];
      }
      grouped[localTime].push(post);
    });
    
    return grouped;
  }, [posts, userTimezone, selectedReferenceTimezone, selectedDate]);
  
  // Sort times
  const sortedTimes = useMemo(() => {
    return Object.keys(postsByTime).sort((a, b) => {
      const [aH, aM] = a.split(':').map(Number);
      const [bH, bM] = b.split(':').map(Number);
      return aH * 60 + aM - (bH * 60 + bM);
    });
  }, [postsByTime]);
  
  // Check if a time is "now" in a timezone
  const isCurrentTime = (time, timezone) => {
    const current = getCurrentTimeInTimezone(timezone);
    const [ch, cm] = current.split(':').map(Number);
    const [th, tm] = time.split(':').map(Number);
    const diff = Math.abs(ch * 60 + cm - (th * 60 + tm));
    return diff <= 30; // Within 30 minutes
  };
  
  // Get platform color
  const getPlatformColor = (platform) => {
    const colors = {
      instagram: 'from-yellow-400 via-red-500 to-purple-500',
      twitter: 'bg-black',
      facebook: 'bg-blue-600',
      linkedin: 'bg-blue-700',
      tiktok: 'bg-black',
      dribbble: 'bg-pink-500'
    };
    return colors[platform] || 'bg-indigo-600';
  };
  
  const toggleTimezone = (tz) => {
    if (onTimezoneToggle) {
      onTimezoneToggle(tz);
    }
  };
  
  // Current times in each timezone
  const currentTimes = useMemo(() => {
    return displayTimezones.reduce((acc, tz) => {
      acc[tz.value] = getCurrentTimeInTimezone(tz.value);
      return acc;
    }, {});
  }, [displayTimezones]);
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            <i className="fas fa-globe mr-2 text-indigo-600" />
            Time Zone Grid
          </h3>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Reference: {displayTimezones.find(tz => tz.value === selectedReferenceTimezone)?.label || selectedReferenceTimezone}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <select
            value={selectedReferenceTimezone}
            onChange={(e) => setSelectedReferenceTimezone(e.target.value)}
            className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 bg-white dark:bg-gray-700 dark:text-white"
          >
            {displayTimezones.map(tz => (
              <option key={tz.value} value={tz.value}>
                {tz.label} ({tz.offset})
              </option>
            ))}
          </select>
          
          <button
            onClick={() => setShowTimezoneSelector(!showTimezoneSelector)}
            className="text-sm text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
          >
            <i className="fas fa-cog" />
          </button>
        </div>
      </div>
      
      {/* Timezone Selector */}
      {showTimezoneSelector && (
        <div className="p-4 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Select timezones to display:
          </p>
          <div className="flex flex-wrap gap-2">
            {DEFAULT_DISPLAY_TIMEZONES.map(tz => {
              const isActive = displayTimezones.some(dt => dt.value === tz.value);
              return (
                <button
                  key={tz.value}
                  onClick={() => toggleTimezone(tz)}
                  className={clsx(
                    'px-3 py-1.5 text-sm rounded-lg border-2 transition-all',
                    isActive 
                      ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                      : 'border-gray-200 dark:border-gray-600 text-gray-500 hover:border-gray-300'
                  )}
                >
                  {isActive ? <i className="fas fa-check-circle mr-1" /> : <i className="fas fa-circle mr-1 text-xs" />}
                  {tz.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
      
      {/* Grid Header */}
      <div className="grid gap-px bg-gray-200 dark:bg-gray-700" 
           style={{ gridTemplateColumns: `120px repeat(${displayTimezones.length}, 1fr)` }}>
        {/* Corner cell */}
        <div className="bg-gray-100 dark:bg-gray-700 p-3 text-xs font-medium text-gray-500 dark:text-gray-400">
          Time
        </div>
        
        {/* Timezone headers */}
        {displayTimezones.map(tz => (
          <div 
            key={tz.value} 
            className="bg-gray-100 dark:bg-gray-700 p-3 text-center"
          >
            <div className="text-sm font-semibold text-gray-900 dark:text-white">
              {tz.label}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {getTimezoneAbbr(tz.value)} ({tz.offset})
            </div>
            <div className={clsx(
              'text-xs font-mono mt-1',
              isCurrentTime(currentTimes[tz.value], tz.value) 
                ? 'text-green-600 font-bold'
                : 'text-gray-400'
            )}>
              {currentTimes[tz.value]}
              {isCurrentTime(currentTimes[tz.value], tz.value) && (
                <span className="ml-1 text-xs">now</span>
              )}
            </div>
          </div>
        ))}
      </div>
      
      {/* Grid Body */}
      {sortedTimes.length === 0 ? (
        <div className="p-8 text-center text-gray-500 dark:text-gray-400">
          <i className="fas fa-clock text-3xl mb-3 opacity-50" />
          <p>No posts scheduled for the selected date</p>
        </div>
      ) : (
        <div className="max-h-96 overflow-y-auto">
          {sortedTimes.map(time => (
            <div 
              key={time} 
              className="grid gap-px bg-gray-200 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
              style={{ gridTemplateColumns: `120px repeat(${displayTimezones.length}, 1fr)` }}
            >
              {/* Time column */}
              <div className="bg-white dark:bg-gray-800 p-3 flex items-center">
                <span className={clsx(
                  'text-sm font-mono font-semibold',
                  isCurrentTime(time, selectedReferenceTimezone)
                    ? 'text-green-600'
                    : 'text-gray-900 dark:text-white'
                )}>
                  {time}
                </span>
                <span className="text-xs text-gray-400 ml-1">
                  {selectedReferenceTimezone.includes('America') ? 'ET' : 'GMT'}
                </span>
              </div>
              
              {/* Posts in each timezone */}
              {displayTimezones.map(tz => {
                // Convert reference time to this timezone
                const localTime = convertTime(
                  selectedDate || new Date().toISOString().split('T')[0],
                  time,
                  selectedReferenceTimezone,
                  tz.value
                );
                
                // Get posts that are visible at this time
                const postsAtTime = postsByTime[time] || [];
                const isCurrentSlot = isCurrentTime(localTime, tz.value);
                
                return (
                  <div 
                    key={tz.value}
                    className={clsx(
                      'bg-white dark:bg-gray-800 p-2 min-h-[60px]',
                      isCurrentSlot && 'bg-green-50 dark:bg-green-900/20'
                    )}
                  >
                    {postsAtTime.map(post => (
                      <div
                        key={post.id}
                        className={clsx(
                          'text-xs p-1.5 rounded mb-1 cursor-pointer hover:opacity-80',
                          post.completed
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                        )}
                        style={{ borderLeft: `3px solid` }}
                        title={`${post.title || post.content?.slice(0, 30)}`}
                      >
                        <div className="flex items-center gap-1">
                          <span className={clsx(
                            'w-2 h-2 rounded-full flex-shrink-0',
                            getPlatformColor(post.platform)
                          )} />
                          <span className="truncate">
                            {post.title || post.content?.slice(0, 20)}
                          </span>
                        </div>
                        <div className="text-gray-400 mt-0.5">
                          {localTime}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}
      
      {/* Legend */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex items-center gap-6 text-xs text-gray-500 dark:text-gray-400">
        <span>
          <i className="fas fa-circle text-green-500 mr-1" />
          Current time (within 30 min)
        </span>
        <span>
          <i className="fas fa-square text-indigo-500 mr-1" />
          Reference timezone
        </span>
        <span className="ml-auto">
          Showing {posts.length} posts across {displayTimezones.length} timezones
        </span>
      </div>
    </div>
  );
};

export default TimeZoneGrid;
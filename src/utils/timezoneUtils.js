// Timezone utilities for handling time across different regions

// Common timezone options
export const TIMEZONES = [
  { value: 'America/New_York', label: 'Eastern Time (ET)', offset: '-05:00' },
  { value: 'America/Chicago', label: 'Central Time (CT)', offset: '-06:00' },
  { value: 'America/Denver', label: 'Mountain Time (MT)', offset: '-07:00' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)', offset: '-08:00' },
  { value: 'America/Anchorage', label: 'Alaska Time (AKT)', offset: '-09:00' },
  { value: 'Pacific/Honolulu', label: 'Hawaii Time (HST)', offset: '-10:00' },
  { value: 'Europe/London', label: 'Greenwich Mean Time (GMT)', offset: '+00:00' },
  { value: 'Europe/Paris', label: 'Central European Time (CET)', offset: '+01:00' },
  { value: 'Europe/Berlin', label: 'Berlin Time (CET)', offset: '+01:00' },
  { value: 'Asia/Dubai', label: 'Gulf Standard Time (GST)', offset: '+04:00' },
  { value: 'Asia/Kolkata', label: 'India Standard Time (IST)', offset: '+05:30' },
  { value: 'Asia/Singapore', label: 'Singapore Time (SGT)', offset: '+08:00' },
  { value: 'Asia/Tokyo', label: 'Japan Standard Time (JST)', offset: '+09:00' },
  { value: 'Australia/Sydney', label: 'Australian Eastern Time (AET)', offset: '+11:00' }
];

// Get user's local timezone
export const getLocalTimezone = () => {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
};

// Convert date to specific timezone
export const convertToTimezone = (date, timezone) => {
  if (!date) return null;
  const dateObj = new Date(date);
  return dateObj.toLocaleString('en-US', { timeZone: timezone });
};

// Get current time in a specific timezone
export const getCurrentTimeInTimezone = (timezone) => {
  return new Date().toLocaleString('en-US', { timeZone: timezone });
};

// Calculate optimal posting times per platform
export const getOptimalTimes = (platform, userTimezone = null) => {
  const optimalTimes = {
    instagram: {
      weekday: ['09:00', '12:00', '14:00', '19:00', '21:00'],
      weekend: ['10:00', '14:00', '19:00']
    },
    twitter: {
      weekday: ['09:00', '12:00', '17:00', '20:00'],
      weekend: ['10:00', '13:00', '18:00']
    },
    facebook: {
      weekday: ['09:00', '13:00', '16:00', '20:00'],
      weekend: ['11:00', '15:00', '19:00']
    },
    linkedin: {
      weekday: ['07:00', '09:00', '12:00', '17:00'],
      weekend: []
    },
    tiktok: {
      weekday: ['06:00', '10:00', '19:00', '22:00'],
      weekend: ['07:00', '11:00', '20:00', '23:00']
    },
    dribbble: {
      weekday: ['10:00', '14:00', '17:00'],
      weekend: ['11:00', '15:00']
    }
  };
  
  const platformTimes = optimalTimes[platform] || { weekday: [], weekend: [] };
  const isWeekend = new Date().getDay() === 0 || new Date().getDay() === 6;
  
  return isWeekend ? platformTimes.weekend : platformTimes.weekday;
};

// Format date/time for display
export const formatDateTime = (date, time, timezone = null) => {
  const dateObj = new Date(`${date}T${time || '00:00'}`);
  
  if (timezone) {
    return dateObj.toLocaleString('en-US', {
      timeZone: timezone,
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  
  return dateObj.toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Get relative time (e.g., "in 2 hours", "2 days ago")
export const getRelativeTime = (date, time) => {
  const postDate = new Date(`${date}T${time || '00:00'}`);
  const now = new Date();
  const diffMs = postDate - now;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffMs < 0) {
    // Past
    if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  } else {
    // Future
    if (diffDays > 0) return `in ${diffDays} day${diffDays > 1 ? 's' : ''}`;
    if (diffHours > 0) return `in ${diffHours} hour${diffHours > 1 ? 's' : ''}`;
    return `in ${diffMins} minute${diffMins > 1 ? 's' : ''}`;
  }
};

// Check if post is overdue
export const isPostOverdue = (date, time) => {
  const postDate = new Date(`${date}T${time || '23:59'}`);
  return postDate < new Date();
};

// Get next optimal posting window
export const getNextOptimalSlot = (platform) => {
  const times = getOptimalTimes(platform);
  if (times.length === 0) return null;
  
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentTime = currentHour * 60 + currentMinute;
  
  for (const time of times) {
    const [hours, minutes] = time.split(':').map(Number);
    const timeInMins = hours * 60 + minutes;
    
    if (timeInMins > currentTime) {
      const date = new Date(now);
      date.setHours(hours, minutes, 0, 0);
      return date;
    }
  }
  
  // If no time today, use first time tomorrow
  const [hours, minutes] = times[0].split(':').map(Number);
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(hours, minutes, 0, 0);
  return tomorrow;
};
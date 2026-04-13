// Timezone utility for automatic timezone handling

// Get user's timezone
export const getUserTimezone = () => {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
};

// Get timezone offset in hours
export const getTimezoneOffset = (timezone) => {
  const now = new Date();
  const tzDate = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
  const utcDate = new Date(now.toLocaleString('en-US', { timeZone: 'UTC' }));
  return (tzDate - utcDate) / (1000 * 60 * 60);
};

// Convert time from one timezone to another
export const convertTimezone = (date, fromTimezone, toTimezone) => {
  const dateStr = date.toLocaleString('en-US', { timeZone: fromTimezone });
  const fromOffset = getTimezoneOffset(fromTimezone);
  const toOffset = getTimezoneOffset(toTimezone);
  const diff = toOffset - fromOffset;
  
  const result = new Date(date);
  result.setHours(result.getHours() + diff);
  return result;
};

// Optimal posting times by platform (in user's local timezone)
export const optimalPostingTimes = {
  linkedin: [
    { day: 'monday', time: '09:00', label: 'Morning commute' },
    { day: 'tuesday', time: '10:00', label: 'Mid-morning' },
    { day: 'wednesday', time: '11:00', label: 'Late morning' },
    { day: 'thursday', time: '09:00', label: 'Morning commute' },
    { day: 'friday', time: '08:00', label: 'Early morning' }
  ],
  instagram: [
    { day: 'monday', time: '11:00', label: 'Late morning' },
    { day: 'tuesday', time: '14:00', label: ' afternoon' },
    { day: 'wednesday', time: '13:00', label: 'Lunch time' },
    { day: 'thursday', time: '19:00', label: 'Evening' },
    { day: 'friday', time: '15:00', label: ' afternoon' }
  ],
  twitter: [
    { day: 'monday', time: '09:00', label: 'Morning commute' },
    { day: 'tuesday', time: '12:00', label: ' midday' },
    { day: 'wednesday', time: '17:00', label: 'Evening commute' },
    { day: 'thursday', time: '09:00', label: 'Morning commute' },
    { day: 'friday', time: '16:00', label: 'End of work' }
  ],
  facebook: [
    { day: 'monday', time: '10:00', label: 'Mid-morning' },
    { day: 'tuesday', time: '11:00', label: 'Late morning' },
    { day: 'wednesday', time: '13:00', label: 'Lunch time' },
    { day: 'thursday', time: '14:00', label: ' afternoon' },
    { day: 'friday', time: '11:00', label: 'Late morning' }
  ],
  tiktok: [
    { day: 'monday', time: '18:00', label: 'Evening' },
    { day: 'tuesday', time: '20:00', label: 'Prime time' },
    { day: 'wednesday', time: '19:00', label: 'Evening' },
    { day: 'thursday', time: '21:00', label: 'Late evening' },
    { day: 'friday', time: '20:00', label: 'Prime time' }
  ],
  dribbble: [
    { day: 'monday', time: '10:00', label: 'Mid-morning' },
    { day: 'tuesday', time: '14:00', label: ' afternoon' },
    { day: 'wednesday', time: '11:00', label: 'Late morning' },
    { day: 'thursday', time: '15:00', label: ' afternoon' },
    { day: 'friday', time: '12:00', label: ' midday' }
  ]
};

// Get optimal posting times for a specific platform and day
export const getOptimalTimes = (platform, dayOfWeek) => {
  const times = optimalPostingTimes[platform?.toLowerCase()] || optimalPostingTimes.linkedin;
  const dayName = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][dayOfWeek];
  return times.filter(t => t.day === dayName);
};

// Suggest best time for a post based on platform
export const suggestBestTime = (platform) => {
  const today = new Date().getDay();
  const times = optimalPostingTimes[platform?.toLowerCase()] || optimalPostingTimes.linkedin;
  const todayTimes = times.filter(t => t.day === ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][today]);
  
  if (todayTimes.length > 0) {
    return todayTimes[0];
  }
  return times[0];
};

// Timezone list for settings
export const commonTimezones = [
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'America/Anchorage', label: 'Alaska Time (AKT)' },
  { value: 'Pacific/Honolulu', label: 'Hawaii Time (HT)' },
  { value: 'Europe/London', label: 'GMT/BST (London)' },
  { value: 'Europe/Paris', label: 'CET (Paris)' },
  { value: 'Europe/Berlin', label: 'CET (Berlin)' },
  { value: 'Asia/Tokyo', label: 'JST (Tokyo)' },
  { value: 'Asia/Shanghai', label: 'CST (Shanghai)' },
  { value: 'Asia/Dubai', label: 'GST (Dubai)' },
  { value: 'Asia/Singapore', label: 'SGT (Singapore)' },
  { value: 'Australia/Sydney', label: 'AEST (Sydney)' },
  { value: 'UTC', label: 'UTC' }
];
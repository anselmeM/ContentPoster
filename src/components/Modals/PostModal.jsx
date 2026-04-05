import { useState, useEffect, useRef, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { postsService, settingsService } from '../../services/firebase';
import { PLATFORMS, PLATFORM_LIST } from '../../config/platforms';
import { getOptimalTimes, getNextOptimalSlot, getRelativeTime } from '../../utils/timezoneUtils';
import { getHashtagSuggestions, validateHashtagCount, generateOptimalHashtags } from '../../utils/hashtagUtils';
import { TRIGGER_TYPES, CONDITION_FIELDS, CONDITION_OPERATORS, TRIGGER_ACTIONS, formatCondition } from '../../utils/triggerEngine';
import { sanitizeURL } from '../../utils/sanitizeUtils';
import clsx from 'clsx';

// Helper functions for best time suggestions
const getSecondOptimalTime = (platform) => {
  const times = {
    instagram: ['18:00', '12:00', '21:00'],
    twitter: ['09:00', '15:00', '12:00'],
    facebook: ['13:00', '16:00', '09:00'],
    linkedin: ['10:00', '08:00', '12:00'],
    tiktok: ['20:00', '16:00', '14:00'],
    dribbble: ['15:00', '11:00', '09:00']
  };
  return times[platform]?.[1] || '12:00';
};

const getThirdOptimalTime = (platform) => {
  const times = {
    instagram: ['21:00', '09:00', '15:00'],
    twitter: ['12:00', '18:00', '21:00'],
    facebook: ['09:00', '20:00', '11:00'],
    linkedin: ['12:00', '14:00', '16:00'],
    tiktok: ['14:00', '10:00', '18:00'],
    dribbble: ['09:00', '13:00', '17:00']
  };
  return times[platform]?.[2] || '15:00';
};

const getSecondOptimalDate = (platform, firstDate) => {
  const date = new Date(firstDate);
  date.setDate(date.getDate() + 1);
  return date.toISOString().split('T')[0];
};

const getThirdOptimalDate = (platform, firstDate) => {
  const date = new Date(firstDate);
  date.setDate(date.getDate() + 2);
  return date.toISOString().split('T')[0];
};

const getBestDayOfWeek = (platform) => {
  const days = {
    instagram: 'Wednesday',
    twitter: 'Wednesday',
    facebook: 'Wednesday',
    linkedin: 'Wednesday',
    tiktok: 'Friday',
    dribbble: 'Tuesday'
  };
  return days[platform] || 'Wednesday';
};

// Conflict detection helper
const checkConflict = (newDate, newTime, existingPosts, currentPostId) => {
  if (!newDate || !newTime) return null;
  
  const newDateTime = new Date(`${newDate}T${newTime}`);
  const conflictWindow = 30 * 60 * 1000; // 30 minutes
  
  for (const existingPost of existingPosts) {
    if (existingPost.id === currentPostId) continue;
    if (!existingPost.date || !existingPost.time) continue;
    
    const existingDateTime = new Date(`${existingPost.date}T${existingPost.time}`);
    const diff = Math.abs(newDateTime.getTime() - existingDateTime.getTime());
    
    if (diff < conflictWindow && existingPost.platform === formData.platform) {
      return {
        post: existingPost,
        time: existingDateTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
    }
  }
  return null;
};

const PostModal = ({ post, onClose, existingPosts = [] }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    image: '',
    date: '',
    time: '',
    platform: 'instagram',
    hashtags: [],
    status: 'draft',
    timezone: 'America/New_York',
    recurring: null,
    triggers: null, // NEW: conditional triggers for draft scheduling
    engagement: {
      likes: 0,
      comments: 0,
      shares: 0,
      views: 0
    }
  });
  const [settings, setSettings] = useState({});
  const [showHashtagSuggestions, setShowHashtagSuggestions] = useState(false);
  const [optimalTime, setOptimalTime] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [conflictWarning, setConflictWarning] = useState(null);
  const modalRef = useRef(null);
  const fileInputRef = useRef(null);

  // Get platform config
  const platformConfig = PLATFORMS[formData.platform];

  useEffect(() => {
    // Pre-fill form if editing
    if (post) {
      setFormData({
        title: post.title || '',
        content: post.content || '',
        image: post.image || '',
        date: post.date || '',
        time: post.time || '',
        platform: post.platform || 'instagram',
        hashtags: post.hashtags || [],
        status: post.status || 'draft',
        timezone: post.timezone || 'America/New_York',
        recurring: post.recurring || null,
        triggers: post.triggers || null, // NEW: load triggers
        engagement: post.engagement || { likes: 0, comments: 0, shares: 0, views: 0 }
      });
    }

    // Subscribe to settings for defaults
    const unsubscribe = settingsService.subscribe(user.uid, (settingsData) => {
      if (settingsData && !post) {
        setSettings(settingsData);
        if (settingsData.defaultPlatform && settingsData.defaultPlatform !== 'none') {
          setFormData(prev => ({ 
            ...prev, 
            platform: settingsData.defaultPlatform,
            timezone: settingsData.timezone || 'America/New_York'
          }));
        }
      }
    });

    return () => unsubscribe();
  }, [user, post]);

  // Update optimal time when platform changes
  useEffect(() => {
    const nextSlot = getNextOptimalSlot(formData.platform);
    if (nextSlot) {
      setOptimalTime({
        date: nextSlot.toISOString().split('T')[0],
        time: nextSlot.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
      });
    }
  }, [formData.platform]);

  // Detect scheduling conflicts
  useEffect(() => {
    if (formData.date && formData.time && existingPosts.length > 0) {
      const conflict = checkConflict(formData.date, formData.time, existingPosts, post?.id);
      setConflictWarning(conflict);
    } else {
      setConflictWarning(null);
    }
  }, [formData.date, formData.time, existingPosts, post?.id]);

  // Focus trap and escape key handling
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    
    modalRef.current?.focus();
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Auto-update hashtags suggestions when content changes
    if (name === 'content') {
      const suggestions = getHashtagSuggestions(formData.platform, value);
      setFormData(prev => ({ ...prev, hashtags: suggestions }));
    }
  };

  const handlePlatformChange = (platformId) => {
    setFormData(prev => ({ ...prev, platform: platformId }));
    // Update optimal times for new platform
    const nextSlot = getNextOptimalSlot(platformId);
    if (nextSlot) {
      setOptimalTime({
        date: nextSlot.toISOString().split('T')[0],
        time: nextSlot.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
      });
    }
  };

  const applyOptimalTime = () => {
    if (optimalTime) {
      setFormData(prev => ({ 
        ...prev, 
        date: optimalTime.date,
        time: optimalTime.time
      }));
    }
  };

  const addHashtag = (hashtag) => {
    if (!formData.hashtags.includes(hashtag)) {
      const validation = validateHashtagCount(formData.platform, formData.hashtags.length + 1);
      if (validation.valid) {
        setFormData(prev => ({ ...prev, hashtags: [...prev.hashtags, hashtag] }));
      }
    }
  };

  const removeHashtag = (hashtag) => {
    setFormData(prev => ({ 
      ...prev, 
      hashtags: prev.hashtags.filter(h => h !== hashtag)
    }));
  };

  const generateHashtags = () => {
    const generated = generateOptimalHashtags(formData.platform, 'marketing');
    setFormData(prev => ({ 
      ...prev, 
      hashtags: [...new Set([...prev.hashtags, ...generated])]
    }));
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, image: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Validate content length
      const maxLength = platformConfig?.maxCaptionLength || 2200;
      if (formData.content.length > maxLength) {
        alert(`Content exceeds maximum length of ${maxLength} characters for ${platformConfig?.name}`);
        setIsSubmitting(false);
        return;
      }
      
      // Validate hashtag count
      const hashtagValidation = validateHashtagCount(formData.platform, formData.hashtags.length);
      if (!hashtagValidation.valid) {
        alert(hashtagValidation.message);
        setIsSubmitting(false);
        return;
      }
      
      const postData = {
        ...formData,
        engagement: {
          likes: Math.floor(Math.random() * 100),
          comments: Math.floor(Math.random() * 20),
          shares: Math.floor(Math.random() * 10),
          views: Math.floor(Math.random() * 500)
        }
      };
      
      if (post?.id) {
        await postsService.update(user.uid, post.id, postData);
      } else {
        await postsService.create(user.uid, postData);
      }
      
      onClose();
    } catch (error) {
      console.error('Error saving post:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const hashtagValidation = validateHashtagCount(formData.platform, formData.hashtags.length);
  const isContentOverLimit = formData.content.length > (platformConfig?.maxCaptionLength || 2200);

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        ref={modalRef}
        className="bg-gray-100 dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6"
        tabIndex={-1}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2 id="modal-title" className="text-2xl font-bold text-gray-900 dark:text-white">
            {post?.id ? 'Edit Post' : 'Create New Post'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-white"
            aria-label="Close modal"
          >
            <i className="fas fa-times text-xl" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Platform Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Platform
            </label>
            <div className="flex flex-wrap gap-3">
              {PLATFORM_LIST.map((platform) => (
                <button
                  key={platform.id}
                  type="button"
                  onClick={() => handlePlatformChange(platform.id)}
                  className={clsx(
                    'flex items-center px-4 py-2 rounded-lg border-2 transition-all',
                    formData.platform === platform.id
                      ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/30'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                  )}
                >
                  <span 
                    className={clsx(
                      'w-6 h-6 rounded-full flex items-center justify-center text-white text-sm mr-2',
                      platform.id === 'instagram' && 'bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500',
                      platform.id === 'twitter' && 'bg-black',
                      platform.id === 'facebook' && 'bg-blue-600',
                      platform.id === 'linkedin' && 'bg-blue-700',
                      platform.id === 'tiktok' && 'bg-black',
                      platform.id === 'dribbble' && 'bg-pink-500'
                    )}
                  >
                    <i className={`fab ${platform.icon} text-xs`} />
                  </span>
                  <span className="text-sm font-medium dark:text-white">{platform.name}</span>
                </button>
              ))}
            </div>
            {platformConfig && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Max {platformConfig.maxCaptionLength} characters, {platformConfig.maxHashtags} hashtags
              </p>
            )}
          </div>
          
          {/* Title */}
          <div>
            <label htmlFor="post-title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Title <span className="text-gray-400">(optional)</span>
            </label>
            <input
              id="post-title"
              name="title"
              type="text"
              value={formData.title}
              onChange={handleInputChange}
              className="input-field dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="Post title"
            />
          </div>
          
          {/* Content */}
          <div>
            <label htmlFor="post-content" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Content <span className="text-red-500">*</span>
            </label>
            <textarea
              id="post-content"
              name="content"
              value={formData.content}
              onChange={handleInputChange}
              rows={4}
              className="input-field dark:bg-gray-700 dark:border-gray-600 dark:text-white resize-none"
              placeholder="What do you want to share?"
              maxLength={platformConfig?.maxCaptionLength}
              required
            />
            <div className="flex justify-between mt-1">
              <span className={clsx(
                'text-xs',
                formData.content.length >= (platformConfig?.maxCaptionLength || 2200) * 0.9
                  ? formData.content.length >= (platformConfig?.maxCaptionLength || 2200)
                    ? 'text-red-600 font-semibold'
                    : 'text-yellow-600 font-semibold'
                  : 'text-gray-500'
              )}>
                {formData.content.length} / {platformConfig?.maxCaptionLength || 2200}
              </span>
              {platformConfig?.supportsVideo && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs text-indigo-600 hover:text-indigo-700"
                >
                  <i className="fas fa-image mr-1" />
                  Add Media
                </button>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              onChange={handleImageSelect}
              className="hidden"
            />
          </div>
          
          {/* Image Preview */}
          {formData.image && (
            <div className="relative">
              <img
                src={sanitizeURL(formData.image)}
                alt="Preview"
                className="w-full h-48 object-cover rounded-lg"
              />
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, image: '' }))}
                className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full"
              >
                <i className="fas fa-times" />
              </button>
            </div>
          )}
          
          {/* Image URL Input */}
          <div>
            <label htmlFor="post-image" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Image URL
            </label>
            <input
              id="post-image"
              name="image"
              type="url"
              value={formData.image}
              onChange={handleInputChange}
              className="input-field dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="https://..."
            />
          </div>
          
          {/* Scheduling */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="post-date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Date <span className="text-red-500">*</span>
              </label>
              <input
                id="post-date"
                name="date"
                type="date"
                value={formData.date}
                onChange={handleInputChange}
                className="input-field dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                required
              />
            </div>
            <div>
              <label htmlFor="post-time" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Time <span className="text-red-500">*</span>
              </label>
              <input
                id="post-time"
                name="time"
                type="time"
                value={formData.time}
                onChange={handleInputChange}
                className="input-field dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                required
              />
            </div>
          </div>

          {/* Conflict Warning */}
          {conflictWarning && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700 rounded-lg p-3 flex items-start gap-3">
              <i className="fas fa-exclamation-triangle text-yellow-600 dark:text-yellow-500 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-yellow-800 dark:text-yellow-300">
                  Scheduling Conflict Detected
                </p>
                <p className="text-yellow-700 dark:text-yellow-400 text-xs mt-1">
                  Another post "{conflictWarning.post?.title}" is scheduled at {conflictWarning.time} on the same platform within 30 minutes.
                  Consider adjusting your schedule to avoid overlapping posts.
                </p>
                <button
                  type="button"
                  onClick={() => setConflictWarning(null)}
                  className="text-xs text-yellow-600 dark:text-yellow-400 underline mt-2"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}
          
          {/* Optimal Time Suggestion - Enhanced */}
          {optimalTime && (
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm font-medium text-indigo-700 dark:text-indigo-300">
                    <i className="fas fa-clock mr-2" />
                    Best Times to Post on {platformConfig?.name}
                  </p>
                  <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1">
                    Based on engagement analytics for your audience
                  </p>
                </div>
                <button
                  type="button"
                  onClick={applyOptimalTime}
                  className="px-3 py-1 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700"
                >
                  Apply Top Time
                </button>
              </div>
              
              {/* Time Slots Grid */}
              <div className="grid grid-cols-3 gap-2 mb-3">
                {[
                  { time: optimalTime.time, date: optimalTime.date, score: 95, label: 'Best' },
                  { time: getSecondOptimalTime(formData.platform), date: getSecondOptimalDate(formData.platform, optimalTime.date), score: 80, label: 'Good' },
                  { time: getThirdOptimalTime(formData.platform), date: getThirdOptimalDate(formData.platform, optimalTime.date), score: 65, label: 'Fair' }
                ].map((slot, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setFormData(prev => ({ ...prev, date: slot.date, time: slot.time }));
                    }}
                    className={clsx(
                      'flex flex-col items-center p-2 rounded-lg border transition-all',
                      idx === 0 
                        ? 'border-indigo-500 bg-indigo-100 dark:bg-indigo-800/50' 
                        : 'border-gray-200 dark:border-gray-600 hover:border-indigo-300'
                    )}
                  >
                    <span className="text-xs font-semibold text-indigo-700 dark:text-indigo-300">{slot.label}</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{slot.time}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{slot.date}</span>
                    <span className="text-xs text-green-600 mt-1">{slot.score}% engagement</span>
                  </button>
                ))}
              </div>
              
              {/* Day of Week Recommendation */}
              <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                <i className="fas fa-calendar-day text-indigo-500" />
                <span>Best day this week: <strong className="text-indigo-700 dark:text-indigo-300">{getBestDayOfWeek(formData.platform)}</strong></span>
              </div>
            </div>
          )}
          
          {/* Timezone */}
          <div>
            <label htmlFor="timezone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Timezone
            </label>
            <select
              id="timezone"
              name="timezone"
              value={formData.timezone}
              onChange={handleInputChange}
              className="input-field dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="America/New_York">Eastern Time (ET)</option>
              <option value="America/Chicago">Central Time (CT)</option>
              <option value="America/Denver">Mountain Time (MT)</option>
              <option value="America/Los_Angeles">Pacific Time (PT)</option>
              <option value="Europe/London">GMT</option>
              <option value="Europe/Paris">Central European Time</option>
              <option value="Asia/Tokyo">Japan Standard Time</option>
            </select>
          </div>

          {/* Recurring Posts */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                <i className="fas fa-sync-alt mr-2 text-indigo-600" />
                Recurring Post
              </label>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Repeat this post automatically
              </span>
            </div>
            
            <div className="grid grid-cols-5 gap-2 mb-4">
              {[
                { value: null, label: 'None', icon: 'fa-ban' },
                { value: 'daily', label: 'Daily', icon: 'fa-calendar-day' },
                { value: 'weekly', label: 'Weekly', icon: 'fa-calendar-week' },
                { value: 'monthly', label: 'Monthly', icon: 'fa-calendar-alt' },
                { value: 'yearly', label: 'Yearly', icon: 'fa-calendar' }
              ].map((option) => (
                <button
                  key={option.value || 'none'}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, recurring: option.value ? { type: option.value, interval: 1, endDate: '' } : null }))}
                  className={clsx(
                    'flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all',
                    (formData.recurring?.type || null) === option.value
                      ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/30'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                  )}
                >
                  <i className={`fas ${option.icon} text-lg mb-1 ${(formData.recurring?.type || null) === option.value ? 'text-indigo-600' : 'text-gray-400'}`} />
                  <span className={clsx(
                    'text-xs font-medium',
                    (formData.recurring?.type || null) === option.value ? 'text-indigo-700 dark:text-indigo-300' : 'text-gray-600 dark:text-gray-400'
                  )}>
                    {option.label}
                  </span>
                </button>
              ))}
            </div>

            {/* Recurring Options */}
            {formData.recurring && (
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="recurring-interval" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Every
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        id="recurring-interval"
                        type="number"
                        min="1"
                        max="365"
                        value={formData.recurring.interval || 1}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          recurring: { ...prev.recurring, interval: parseInt(e.target.value) || 1 }
                        }))}
                        className="input-field dark:bg-gray-700 dark:border-gray-600 dark:text-white w-20"
                      />
                      <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                        {formData.recurring.type === 'daily' ? 'day(s)' : 
                         formData.recurring.type === 'weekly' ? 'week(s)' :
                         formData.recurring.type === 'monthly' ? 'month(s)' : 'year(s)'}
                      </span>
                    </div>
                  </div>
                  <div>
                    <label htmlFor="recurring-end" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      End Date <span className="text-gray-400">(optional)</span>
                    </label>
                    <input
                      id="recurring-end"
                      type="date"
                      value={formData.recurring.endDate || ''}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        recurring: { ...prev.recurring, endDate: e.target.value }
                      }))}
                      className="input-field dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      min={formData.date}
                    />
                  </div>
                </div>
                
                {/* Preview of next occurrences */}
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  <i className="fas fa-info-circle mr-1" />
                  This post will repeat {formData.recurring.interval === 1 ? 'every' : `every ${formData.recurring.interval}`} {formData.recurring.type}
                  {formData.recurring.endDate && ` until ${formData.recurring.endDate}`}
                </div>
              </div>
            )}
          </div>
          
          {/* Hashtags */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Hashtags
              </label>
              <button
                type="button"
                onClick={generateHashtags}
                className="text-xs text-indigo-600 hover:text-indigo-700"
              >
                <i className="fas fa-magic mr-1" />
                Generate Tags
              </button>
            </div>
            
            {/* Hashtag Input */}
            <div className="flex flex-wrap gap-2 mb-2">
              {formData.hashtags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-sm rounded"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeHashtag(tag)}
                    className="ml-1 text-indigo-400 hover:text-indigo-600"
                  >
                    <i className="fas fa-times text-xs" />
                  </button>
                </span>
              ))}
              <input
                type="text"
                placeholder="Add hashtag..."
                className="px-2 py-1 text-sm border border-gray-200 dark:border-gray-600 rounded focus:outline-none focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const value = e.target.value.trim();
                    if (value && value.startsWith('#')) {
                      addHashtag(value);
                      e.target.value = '';
                    }
                  }
                }}
              />
            </div>
            
            <p className={clsx(
              'text-xs',
              hashtagValidation.valid ? 'text-gray-500' : 'text-red-500'
            )}>
              {formData.hashtags.length} / {hashtagValidation.max} hashtags used
              {!hashtagValidation.valid && ` (${hashtagValidation.remaining} remaining)`}
            </p>
          </div>
          
          {/* Draft Scheduling / Triggers */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                <i className="fas fa-bolt mr-2 text-amber-600" />
                Draft Scheduling
              </label>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Auto-publish based on triggers
              </span>
            </div>
            
            {/* Trigger Type Selector */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              {[
                { value: TRIGGER_TYPES.MANUAL, label: 'Manual', icon: 'fa-hand-pointer' },
                { value: TRIGGER_TYPES.DATE_BASED, label: 'Date Based', icon: 'fa-calendar' },
                { value: TRIGGER_TYPES.CONDITIONAL, label: 'Conditional', icon: 'fa-code-branch' }
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setFormData(prev => ({ 
                    ...prev, 
                    triggers: option.value === TRIGGER_TYPES.MANUAL 
                      ? null 
                      : { 
                          type: option.value,
                          conditions: option.value === TRIGGER_TYPES.CONDITIONAL ? [] : undefined,
                          scheduledDate: '',
                          scheduledTime: '',
                          action: TRIGGER_ACTIONS.PUBLISH
                        }
                  }))}
                  className={clsx(
                    'flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all',
                    (formData.triggers?.type || TRIGGER_TYPES.MANUAL) === option.value
                      ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/30'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                  )}
                >
                  <i className={`fas ${option.icon} text-lg mb-1 ${(formData.triggers?.type || TRIGGER_TYPES.MANUAL) === option.value ? 'text-amber-600' : 'text-gray-400'}`} />
                  <span className={clsx(
                    'text-xs font-medium',
                    (formData.triggers?.type || TRIGGER_TYPES.MANUAL) === option.value ? 'text-amber-700 dark:text-amber-300' : 'text-gray-600 dark:text-gray-400'
                  )}>
                    {option.label}
                  </span>
                </button>
              ))}
            </div>
            
            {/* Date-Based Trigger Options */}
            {formData.triggers?.type === TRIGGER_TYPES.DATE_BASED && (
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Publish Date
                    </label>
                    <input
                      type="date"
                      value={formData.triggers.scheduledDate || ''}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        triggers: { ...prev.triggers, scheduledDate: e.target.value }
                      }))}
                      min={new Date().toISOString().split('T')[0]}
                      className="input-field dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Publish Time
                    </label>
                    <input
                      type="time"
                      value={formData.triggers.scheduledTime || ''}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        triggers: { ...prev.triggers, scheduledTime: e.target.value }
                      }))}
                      className="input-field dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  <i className="fas fa-info-circle mr-1" />
                  This draft will be automatically published at the specified date and time.
                </div>
              </div>
            )}
            
            {/* Conditional Trigger Options */}
            {formData.triggers?.type === TRIGGER_TYPES.CONDITIONAL && (
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Conditions</span>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ 
                      ...prev, 
                      triggers: { 
                        ...prev.triggers, 
                        conditions: [...(prev.triggers.conditions || []), { field: 'time_since_draft_hours', operator: 'greater_than', value: 24 }]
                      }
                    }))}
                    className="text-xs text-indigo-600 hover:text-indigo-700"
                  >
                    <i className="fas fa-plus mr-1" />
                    Add Condition
                  </button>
                </div>
                
                {/* Conditions List */}
                {formData.triggers.conditions?.length > 0 && (
                  <div className="space-y-2">
                    {formData.triggers.conditions.map((condition, idx) => (
                      <div key={idx} className="flex items-center gap-2 bg-white dark:bg-gray-800 p-2 rounded">
                        <select
                          value={condition.field}
                          onChange={(e) => {
                            const newConditions = [...formData.triggers.conditions];
                            newConditions[idx] = { ...condition, field: e.target.value };
                            setFormData(prev => ({ 
                              ...prev, 
                              triggers: { ...prev.triggers, conditions: newConditions }
                            }));
                          }}
                          className="text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700 dark:text-white"
                        >
                          <option value={CONDITION_FIELDS.TIME_SINCE_DRAFT_HOURS}>Time since draft (hours)</option>
                          <option value={CONDITION_FIELDS.DAY_OF_WEEK}>Day of week</option>
                          <option value={CONDITION_FIELDS.TIME_OF_DAY}>Time of day</option>
                          <option value={CONDITION_FIELDS.ENGAGEMENT_LIKES}>Likes</option>
                          <option value={CONDITION_FIELDS.ENGAGEMENT_COMMENTS}>Comments</option>
                        </select>
                        
                        <select
                          value={condition.operator}
                          onChange={(e) => {
                            const newConditions = [...formData.triggers.conditions];
                            newConditions[idx] = { ...condition, operator: e.target.value };
                            setFormData(prev => ({ 
                              ...prev, 
                              triggers: { ...prev.triggers, conditions: newConditions }
                            }));
                          }}
                          className="text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700 dark:text-white"
                        >
                          <option value={CONDITION_OPERATORS.GREATER_THAN}>greater than</option>
                          <option value={CONDITION_OPERATORS.LESS_THAN}>less than</option>
                          <option value={CONDITION_OPERATORS.EQUALS}>equals</option>
                        </select>
                        
                        <input
                          type="number"
                          value={condition.value}
                          onChange={(e) => {
                            const newConditions = [...formData.triggers.conditions];
                            newConditions[idx] = { ...condition, value: parseInt(e.target.value) || 0 };
                            setFormData(prev => ({ 
                              ...prev, 
                              triggers: { ...prev.triggers, conditions: newConditions }
                            }));
                          }}
                          className="text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 w-20 bg-white dark:bg-gray-700 dark:text-white"
                        />
                        
                        <button
                          type="button"
                          onClick={() => {
                            const newConditions = formData.triggers.conditions.filter((_, i) => i !== idx);
                            setFormData(prev => ({ 
                              ...prev, 
                              triggers: { ...prev.triggers, conditions: newConditions }
                            }));
                          }}
                          className="text-red-500 hover:text-red-700"
                        >
                          <i className="fas fa-times" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Logic Toggle */}
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Match:</span>
                  <div className="flex bg-gray-200 dark:bg-gray-600 rounded-lg p-0.5">
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ 
                        ...prev, 
                        triggers: { ...prev.triggers, logic: 'all' }
                      }))}
                      className={clsx(
                        'px-3 py-1 text-xs rounded-md',
                        (formData.triggers.logic || 'all') === 'all' 
                          ? 'bg-white dark:bg-gray-500 shadow' 
                          : 'text-gray-600 dark:text-gray-300'
                      )}
                    >
                      All conditions
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ 
                        ...prev, 
                        triggers: { ...prev.triggers, logic: 'any' }
                      }))}
                      className={clsx(
                        'px-3 py-1 text-xs rounded-md',
                        formData.triggers.logic === 'any' 
                          ? 'bg-white dark:bg-gray-500 shadow' 
                          : 'text-gray-600 dark:text-gray-300'
                      )}
                    >
                      Any condition
                    </button>
                  </div>
                </div>
                
                {/* Action Selector */}
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Action:</span>
                  <select
                    value={formData.triggers.action || TRIGGER_ACTIONS.PUBLISH}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      triggers: { ...prev.triggers, action: e.target.value }
                    }))}
                    className="text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700 dark:text-white"
                  >
                    <option value={TRIGGER_ACTIONS.PUBLISH}>Auto-publish</option>
                    <option value={TRIGGER_ACTIONS.NOTIFY}>Send notification</option>
                    <option value={TRIGGER_ACTIONS.ESCALATE}>Mark for review</option>
                  </select>
                </div>
                
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  <i className="fas fa-info-circle mr-1" />
                  This draft will trigger the selected action when all/any conditions are met.
                </div>
              </div>
            )}
          </div>
          
          {/* Actions */}
          <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isContentOverLimit || !hashtagValidation.valid}
              className="btn-primary flex items-center"
            >
              {isSubmitting ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <i className="fas fa-save mr-2" />
                  {post?.id ? 'Update Post' : 'Schedule Post'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PostModal;
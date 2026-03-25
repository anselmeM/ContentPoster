import { useState, useEffect, useRef, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { postsService, settingsService } from '../../services/firebase';
import { PLATFORMS, PLATFORM_LIST } from '../../config/platforms';
import { getOptimalTimes, getNextOptimalSlot, getRelativeTime } from '../../utils/timezoneUtils';
import { getHashtagSuggestions, validateHashtagCount, generateOptimalHashtags } from '../../utils/hashtagUtils';
import clsx from 'clsx';

const PostModal = ({ post, onClose }) => {
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

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        ref={modalRef}
        className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto"
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
              <span className="text-xs text-gray-500">
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
                src={formData.image}
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
          
          {/* Optimal Time Suggestion */}
          {optimalTime && (
            <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-indigo-700 dark:text-indigo-300">
                    <i className="fas fa-clock mr-2" />
                    Optimal posting time for {platformConfig?.name}
                  </p>
                  <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1">
                    {optimalTime.date} at {optimalTime.time}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={applyOptimalTime}
                  className="px-3 py-1 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700"
                >
                  Apply
                </button>
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
              disabled={isSubmitting}
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
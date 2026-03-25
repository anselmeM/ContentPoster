import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { postsService, settingsService } from '../../services/firebase';
import clsx from 'clsx';

const PostModal = ({ post, onClose }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    image: '',
    date: '',
    time: '',
    platform: 'instagram'
  });
  const [settings, setSettings] = useState({});
  const modalRef = useRef(null);

  useEffect(() => {
    // Pre-fill form if editing
    if (post) {
      setFormData({
        title: post.title || '',
        image: post.image || '',
        date: post.date || '',
        time: post.time || '',
        platform: post.platform || 'instagram'
      });
    }

    // Subscribe to settings for default platform
    const unsubscribe = settingsService.subscribe(user.uid, (settingsData) => {
      if (settingsData && !post) {
        setSettings(settingsData);
        if (settingsData.defaultPlatform && settingsData.defaultPlatform !== 'none') {
          setFormData(prev => ({ ...prev, platform: settingsData.defaultPlatform }));
        }
      }
    });

    return () => unsubscribe();
  }, [user, post]);

  // Focus trap and escape key handling
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    
    // Focus modal
    modalRef.current?.focus();
    
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (post?.id) {
      // Update existing post
      await postsService.update(user.uid, post.id, formData);
    } else {
      // Create new post
      await postsService.create(user.uid, formData);
    }
    
    onClose();
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        ref={modalRef}
        className="bg-white dark:bg-gray-800 rounded-lg p-8 w-full max-w-md"
        tabIndex={-1}
      >
        <h2 id="modal-title" className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
          {post?.id ? 'Edit Post' : 'Add New Post'}
        </h2>
        
        <form onSubmit={handleSubmit}>
          <input type="hidden" id="post-id" value={post?.id || ''} />
          
          <div className="mb-4">
            <label htmlFor="post-title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Title
            </label>
            <input
              id="post-title"
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="input-field dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              required
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="post-image" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Image URL
            </label>
            <input
              id="post-image"
              type="url"
              value={formData.image}
              onChange={(e) => setFormData({ ...formData, image: e.target.value })}
              className="input-field dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="https://placehold.co/..."
              required
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="post-date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Date
            </label>
            <input
              id="post-date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="input-field dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              required
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="post-time" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Time
            </label>
            <input
              id="post-time"
              type="time"
              value={formData.time}
              onChange={(e) => setFormData({ ...formData, time: e.target.value })}
              className="input-field dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              required
            />
          </div>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Platform
            </label>
            <div className="flex space-x-4">
              {['linkedin', 'instagram', 'dribbble'].map((platform) => (
                <label key={platform} className="flex items-center dark:text-gray-300">
                  <input
                    type="radio"
                    name="platform"
                    value={platform}
                    checked={formData.platform === platform}
                    onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                    className="mr-2"
                  />
                  <span className="capitalize">{platform}</span>
                </label>
              ))}
            </div>
          </div>
          
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
            >
              {post?.id ? 'Update Post' : 'Save Post'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PostModal;
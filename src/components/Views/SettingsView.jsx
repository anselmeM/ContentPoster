import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { settingsService, postsService, exportToCSV } from '../../services/firebase';
import SocialConnections from '../Social/SocialConnections';
import clsx from 'clsx';

const SettingsView = () => {
  const { user, updatePassword } = useAuth();
  const [settings, setSettings] = useState({});
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [defaultPlatform, setDefaultPlatform] = useState('none');
  const [passwordFeedback, setPasswordFeedback] = useState({ type: '', message: '' });
  const [preferencesFeedback, setPreferencesFeedback] = useState('');
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    if (!user) return;

    const unsubscribeSettings = settingsService.subscribe(user.uid, (settingsData) => {
      if (settingsData) {
        setSettings(settingsData);
        setDefaultPlatform(settingsData.defaultPlatform || 'none');
      }
    });

    const unsubscribePosts = postsService.subscribe(user.uid, (postsData) => {
      setPosts(postsData);
    });

    return () => {
      unsubscribeSettings();
      unsubscribePosts();
    };
  }, [user]);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordFeedback({ type: '', message: '' });

    try {
      await updatePassword(currentPassword, newPassword);
      setPasswordFeedback({ type: 'success', message: 'Password updated successfully!' });
      setCurrentPassword('');
      setNewPassword('');
    } catch (error) {
      setPasswordFeedback({ type: 'error', message: `Error: ${error.message}` });
    }
  };

  const handleSavePreferences = async () => {
    try {
      await settingsService.update(user.uid, { defaultPlatform });
      setPreferencesFeedback('Preferences saved successfully!');
      setTimeout(() => setPreferencesFeedback(''), 3000);
    } catch (error) {
      setPreferencesFeedback('Error saving preferences');
    }
  };

  const handleExportCSV = () => {
    if (posts.length === 0) {
      alert('No posts to export.');
      return;
    }
    exportToCSV(posts);
  };

  return (
    <div className="p-6 space-y-12 max-w-2xl">
      {/* Account Information */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Account Information
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Email Address
            </label>
            <input
              type="email"
              value={user?.email || ''}
              disabled
              className="mt-1 block w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-gray-500 dark:text-gray-400 sm:text-sm"
            />
          </div>
          
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label htmlFor="current-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Current Password
              </label>
              <input
                id="current-password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                placeholder="Enter your current password"
              />
            </div>
            <div>
              <label htmlFor="new-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                New Password
              </label>
              <input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                placeholder="Enter a new password"
              />
            </div>
            <div className="flex justify-end">
              <button type="submit" className="btn-primary">
                Change Password
              </button>
            </div>
            {passwordFeedback.message && (
              <p className={clsx(
                'text-sm',
                passwordFeedback.type === 'error' ? 'text-red-600' : 'text-green-600'
              )}>
                {passwordFeedback.message}
              </p>
            )}
          </form>
        </div>
      </div>

      {/* Preferences */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Preferences
        </h3>
        <div className="space-y-4">
          <div>
            <label htmlFor="default-platform" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Default Platform for New Posts
            </label>
            <select
              id="default-platform"
              value={defaultPlatform}
              onChange={(e) => setDefaultPlatform(e.target.value)}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="none">None</option>
              <option value="linkedin">LinkedIn</option>
              <option value="instagram">Instagram</option>
              <option value="dribbble">Dribbble</option>
            </select>
          </div>
          <div className="flex justify-end">
            <button onClick={handleSavePreferences} className="btn-primary">
              Save Preferences
            </button>
          </div>
          {preferencesFeedback && (
            <p className="text-sm text-green-600">{preferencesFeedback}</p>
          )}
        </div>
      </div>

      {/* Data Management */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Data Management
        </h3>
        <div className="flex justify-start">
          <button
            onClick={handleExportCSV}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm flex items-center"
          >
            <i className="fas fa-file-csv mr-2" aria-hidden="true" />
            Export All Posts to CSV
          </button>
        </div>
      </div>

      {/* Social Media API Connections */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          <i className="fab fa-connectdevelop mr-2 text-indigo-600" />
          Social Media Connections
        </h3>
        <SocialConnections />
      </div>
    </div>
  );
};

export default SettingsView;
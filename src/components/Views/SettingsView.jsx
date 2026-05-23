import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { settingsService, postsService, exportToCSV } from '../../services/firebase';
import SocialConnections from '../Social/SocialConnections';
import { toast } from '../../services/notifications';
import clsx from 'clsx';

const SettingsView = () => {
  const { user, updatePassword } = useAuth();
  const [settings, setSettings] = useState({});
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [defaultPlatform, setDefaultPlatform] = useState('none');
  const [posts, setPosts] = useState([]);
  
  // Navigation State
  const [activeTab, setActiveTab] = useState('account');
  
  // Danger Zone State
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');

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
    try {
      await updatePassword(currentPassword, newPassword);
      toast.success('Success', 'Password updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
    } catch (error) {
      toast.error('Update Failed', error.message);
    }
  };

  const handleSavePreferences = async () => {
    try {
      await settingsService.update(user.uid, { defaultPlatform });
      toast.success('Preferences Saved', 'Your default platform has been updated.');
    } catch (error) {
      toast.error('Save Failed', 'Could not save preferences.');
    }
  };

  const handleExportCSV = () => {
    if (posts.length === 0) {
      toast.warning('No Data', 'No posts available to export.');
      return;
    }
    exportToCSV(posts);
    toast.success('Export Started', 'Your CSV file is downloading.');
  };

  const handleDeleteAccount = () => {
    if (deleteConfirmationText !== 'DELETE') {
      toast.error('Invalid Confirmation', 'Please type DELETE to confirm.');
      return;
    }
    // Simulate deletion (In a real app, call a cloud function to wipe user data)
    toast.info('Account Deletion', 'Account deletion initiated. Logging out...');
    // Implementation of account wipe would follow here
  };

  const tabs = [
    { id: 'account', label: 'Account', icon: 'fa-user' },
    { id: 'preferences', label: 'Preferences', icon: 'fa-sliders-h' },
    { id: 'connections', label: 'Connections', icon: 'fa-link' },
    { id: 'data', label: 'Data & Privacy', icon: 'fa-database' },
    { id: 'security', label: 'Security', icon: 'fa-shield-alt' },
  ];

  return (
    <div className="max-w-6xl mx-auto h-full flex flex-col md:flex-row gap-6 p-4 md:p-6">
      
      {/* Sidebar Navigation */}
      <div className="w-full md:w-64 flex-shrink-0">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden sticky top-6">
          <nav className="flex md:flex-col overflow-x-auto md:overflow-visible">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={clsx(
                  'flex items-center px-4 md:px-6 py-4 text-sm font-medium transition-all min-w-max border-b-2 md:border-b-0 md:border-l-4 outline-none',
                  activeTab === tab.id
                    ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-900/20'
                    : 'border-transparent text-gray-500 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-white'
                )}
              >
                <i className={`fas ${tab.icon} w-5 mr-3 text-center ${activeTab === tab.id ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400'}`} />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 space-y-6">
        
        {/* Account Tab */}
        {activeTab === 'account' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 animate-fadeIn">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Account Information</h3>
            <div className="max-w-md space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <i className="fas fa-envelope text-gray-400"></i>
                  </div>
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="block w-full pl-10 pr-3 py-2.5 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-500 dark:text-gray-400 sm:text-sm cursor-not-allowed"
                  />
                </div>
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  Your email address is used for login and notifications.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Preferences Tab */}
        {activeTab === 'preferences' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 animate-fadeIn">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">App Preferences</h3>
            <div className="max-w-md space-y-6">
              <div>
                <label htmlFor="default-platform" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Default Platform for New Posts
                </label>
                <select
                  id="default-platform"
                  value={defaultPlatform}
                  onChange={(e) => setDefaultPlatform(e.target.value)}
                  className="block w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white transition-shadow"
                >
                  <option value="none">None (Select per post)</option>
                  <option value="linkedin">LinkedIn</option>
                  <option value="instagram">Instagram</option>
                  <option value="dribbble">Dribbble</option>
                  <option value="facebook">Facebook</option>
                </select>
              </div>
              <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
                <button onClick={handleSavePreferences} className="btn-primary w-full md:w-auto">
                  <i className="fas fa-save mr-2" /> Save Preferences
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Connections Tab */}
        {activeTab === 'connections' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 animate-fadeIn">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
              Social Media Connections
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              Connect your social media accounts to enable direct scheduling and publishing.
            </p>
            <SocialConnections />
          </div>
        )}

        {/* Data & Privacy Tab */}
        {activeTab === 'data' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 animate-fadeIn">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Data Management</h3>
            
            <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700 flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white">Export Your Data</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Download a CSV archive of all your posts and schedules.
                </p>
              </div>
              <button
                onClick={handleExportCSV}
                className="px-5 py-2.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-sm font-medium transition-colors shadow-sm whitespace-nowrap"
              >
                <i className="fas fa-file-csv mr-2 text-green-600 dark:text-green-400" />
                Export to CSV
              </button>
            </div>
          </div>
        )}

        {/* Security Tab (Includes Danger Zone) */}
        {activeTab === 'security' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Password Change */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Security Settings</h3>
              
              <form onSubmit={handleChangePassword} className="max-w-md space-y-5">
                <div>
                  <label htmlFor="current-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Current Password
                  </label>
                  <input
                    id="current-password"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    className="block w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                    placeholder="Enter your current password"
                  />
                </div>
                <div>
                  <label htmlFor="new-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    New Password
                  </label>
                  <input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={6}
                    className="block w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                    placeholder="Enter a strong new password"
                  />
                </div>
                <div className="pt-2">
                  <button type="submit" className="btn-primary w-full md:w-auto">
                    Update Password
                  </button>
                </div>
              </form>
            </div>

            {/* Danger Zone */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-red-200 dark:border-red-900/50 p-6 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-red-500"></div>
              <h3 className="text-xl font-bold text-red-600 dark:text-red-500 mb-2">Danger Zone</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                Irreversible and destructive actions. Once you delete your account, there is no going back.
              </p>
              
              {!showDeleteConfirm ? (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-5 py-2.5 bg-white dark:bg-gray-800 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 text-sm font-medium transition-colors shadow-sm"
                >
                  Delete Account & Data
                </button>
              ) : (
                <div className="p-5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-lg space-y-4">
                  <div>
                    <h4 className="font-semibold text-red-800 dark:text-red-400">Are you absolutely sure?</h4>
                    <p className="text-sm text-red-600 dark:text-red-300 mt-1">
                      This action will cascade and delete all your posts, tasks, templates, and your user identity. Please type <strong>DELETE</strong> to confirm.
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="text"
                      value={deleteConfirmationText}
                      onChange={(e) => setDeleteConfirmationText(e.target.value)}
                      placeholder="Type DELETE"
                      className="flex-1 px-4 py-2 border border-red-300 dark:border-red-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setShowDeleteConfirm(false);
                          setDeleteConfirmationText('');
                        }}
                        className="px-4 py-2 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleDeleteAccount}
                        disabled={deleteConfirmationText !== 'DELETE'}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Confirm
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default SettingsView;
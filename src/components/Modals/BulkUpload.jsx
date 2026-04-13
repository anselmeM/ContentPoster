import { useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { postsService } from '../../services/firebase';
import { PLATFORM_LIST } from '../../config/platforms';
import { getOptimalTimes, getNextOptimalSlot } from '../../utils/timezoneUtils';
import clsx from 'clsx';

const BulkUpload = ({ onClose, onUploadComplete }) => {
  const { user } = useAuth();
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState({});
  const [platform, setPlatform] = useState('instagram');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('09:00');
  const [postContent, setPostContent] = useState('');
  const [batchSize, setBatchSize] = useState(5); // Posts per day
  const [useOptimalTime, setUseOptimalTime] = useState(true);
  const [activeTab, setActiveTab] = useState('upload'); // upload, csv
  const [csvData, setCsvData] = useState('');
  const fileInputRef = useRef(null);

  // Get optimal times for selected platform
  const optimalTimes = useOptimalTime ? getOptimalTimes(platform) : [];

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles(prev => [...prev, ...selectedFiles]);
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleCsvImport = () => {
    if (!csvData.trim()) return;
    
    // Parse CSV data
    const lines = csvData.trim().split('\n');
    const parsedData = lines.slice(1).map(line => {
      const [title, content, date, time, platform] = line.split(',');
      return { title, content, date, time, platform };
    });
    
    // Create posts from CSV
    const csvPosts = parsedData.map(row => ({
      title: row.title || `Post ${Date.now()}`,
      content: row.content || '',
      platform: row.platform || platform,
      date: row.date || scheduledDate || new Date().toISOString().split('T')[0],
      time: row.time || scheduledTime
    }));
    
    // Store for later processing
    setFiles(csvPosts.map((p, i) => ({
      name: p.title,
      isCsvEntry: true,
      ...p
    })));
  };

  const handleUpload = async () => {
    if (!files.length || !user) return;

    setUploading(true);
    
    let successCount = 0;
    let failCount = 0;
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      try {
        // For CSV entries or files
        if (file.isCsvEntry) {
          await postsService.create(user.uid, {
            title: file.title,
            content: file.content,
            platform: file.platform,
            date: file.date,
            time: file.time,
            status: 'scheduled'
          });
        } else {
          // For file uploads
          await postsService.create(user.uid, {
            title: file.name,
            content: postContent,
            platform,
            date: scheduledDate || new Date().toISOString().split('T')[0],
            time: scheduledTime,
            status: 'scheduled',
            image: file.name // In production, would upload to storage first
          });
        }
        
        successCount++;
        setProgress(prev => ({ ...prev, [i]: 100 }));
      } catch (error) {
        console.error('Upload failed:', error);
        failCount++;
        setProgress(prev => ({ ...prev, [i]: -1 }));
      }
    }

    setUploading(false);
    alert(`Upload complete! ${successCount} succeeded, ${failCount} failed.`);
    
    if (onUploadComplete) {
      onUploadComplete();
    }
    onClose();
  };

  const downloadTemplate = () => {
    const template = 'Title,Content,Date,Time,Platform\n"Post Title","Post content here","2024-12-31","09:00","instagram"';
    const blob = new Blob([template], { type: 'text/csv' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'bulk_post_template.csv';
    link.click();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
            Bulk Upload & Schedule
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:hover:text-white"
            aria-label="Close modal"
          >
            <i className="fas fa-times text-xl" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('upload')}
            className={clsx(
              'px-6 py-3 text-sm font-medium border-b-2 transition-colors',
              activeTab === 'upload'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            )}
          >
            <i className="fas fa-upload mr-2" />
            File Upload
          </button>
          <button
            onClick={() => setActiveTab('csv')}
            className={clsx(
              'px-6 py-3 text-sm font-medium border-b-2 transition-colors',
              activeTab === 'csv'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            )}
          >
            <i className="fas fa-file-csv mr-2" />
            CSV Import
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Platform Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select Platform
            </label>
            <div className="flex flex-wrap gap-2">
              {PLATFORM_LIST.map(p => (
                <button
                  key={p.id}
                  onClick={() => setPlatform(p.id)}
                  className={clsx(
                    'px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    platform === p.id
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/50'
                  )}
                >
                  <i className={`fab ${p.icon} mr-1`} />
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          {/* Schedule Settings */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Time
              </label>
              <input
                type="time"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Posts per Day
              </label>
              <input
                type="number"
                min="1"
                max="20"
                value={batchSize}
                onChange={(e) => setBatchSize(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
              />
            </div>
          </div>

          {/* Optimal Time Toggle */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="useOptimalTime"
              checked={useOptimalTime}
              onChange={(e) => setUseOptimalTime(e.target.checked)}
              className="rounded text-indigo-600"
            />
            <label htmlFor="useOptimalTime" className="text-sm text-gray-700 dark:text-gray-300">
              Use optimal posting times for {platform}
            </label>
            {useOptimalTime && optimalTimes.length > 0 && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                ({optimalTimes.join(', ')})
              </span>
            )}
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Default Post Content
            </label>
            <textarea
              value={postContent}
              onChange={(e) => setPostContent(e.target.value)}
              rows={3}
              placeholder="Enter default content for all posts..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
            />
          </div>

          {/* Tab Content */}
          {activeTab === 'upload' ? (
            <>
              {/* File Upload Area */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-500 dark:hover:border-indigo-400 transition-colors"
              >
                <i className="fas fa-cloud-upload-alt text-4xl text-gray-400 mb-4" />
                <p className="text-gray-600 dark:text-gray-400">
                  Click to select files or drag and drop
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                  Supports images (JPG, PNG, GIF) and videos (MP4, MOV)
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>

              {/* Selected Files List */}
              {files.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Selected Files ({files.length})
                  </h3>
                  <div className="max-h-48 overflow-y-auto space-y-2">
                    {files.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          <i className={clsx(
                            'fas',
                            file.type?.startsWith('video') || file.isCsvEntry ? 'fa-video' : 'fa-image',
                            'text-indigo-600'
                          )} />
                          <span className="text-sm text-gray-800 dark:text-gray-200 truncate max-w-xs">
                            {file.name || file.title}
                          </span>
                        </div>
                        <button
                          onClick={() => removeFile(index)}
                          className="text-red-500 hover:text-red-600"
                          aria-label={`Remove file ${file.name || file.title}`}
                        >
                          <i className="fas fa-trash" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              {/* CSV Import */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <button
                    onClick={downloadTemplate}
                    className="text-sm text-indigo-600 hover:text-indigo-700"
                  >
                    <i className="fas fa-download mr-1" />
                    Download CSV Template
                  </button>
                </div>
                <textarea
                  value={csvData}
                  onChange={(e) => setCsvData(e.target.value)}
                  placeholder="Paste your CSV data here...&#10;Title,Content,Date,Time,Platform"
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white font-mono text-sm"
                />
                <button
                  onClick={handleCsvImport}
                  disabled={!csvData.trim()}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                >
                  Parse CSV Data
                </button>
              </div>
            </>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center p-6 border-t border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {files.length > 0 && `${files.length} items ready to schedule`}
          </div>
          <div className="flex space-x-4">
            <button
              onClick={onClose}
              className="px-6 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white"
            >
              Cancel
            </button>
            <button
              onClick={handleUpload}
              disabled={!files.length || uploading}
              className={clsx(
                'px-6 py-2 rounded-lg font-medium transition-colors flex items-center',
                files.length && !uploading
                  ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                  : 'bg-gray-300 dark:bg-gray-600 text-gray-500 cursor-not-allowed'
              )}
            >
              {uploading ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-2" />
                  Uploading...
                </>
              ) : (
                <>
                  <i className="fas fa-calendar-plus mr-2" />
                  Schedule Posts
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkUpload;

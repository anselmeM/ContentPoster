import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { storageService } from '../../services/storage';
import { toast } from '../../services/notifications';
import { sanitizeURL } from '../../utils/sanitizeUtils';
import { EmptyMediaState } from '../UI/EmptyState';
import clsx from 'clsx';

const MediaLibrary = ({ onSelectMedia, onClose, isInline = false }) => {
  const { user } = useAuth();
  const [media, setMedia] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [filter, setFilter] = useState('all'); // all, image, video
  const fileInputRef = useRef(null);
  const dropZoneRef = useRef(null);

  useEffect(() => {
    if (!user) {
      setMedia([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const unsubscribe = storageService.subscribeFiles(user.uid, (items) => {
      setMedia(items);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const processFiles = async (files) => {
    if (files.length === 0) return;

    setUploading(true);
    setUploadProgress(0);
    
    let uploadedCount = 0;
    let failedCount = 0;

    for (const file of files) {
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');
      
      if (!isImage && !isVideo) {
        toast.warning('Invalid File', `${file.name} is not an image or video.`);
        continue;
      }

      try {
        await storageService.uploadFile(user.uid, file, (progress) => {
          setUploadProgress(progress);
        });
        uploadedCount++;
      } catch (error) {
        console.error('Error uploading file:', file.name, error);
        failedCount++;
      }
    }

    setUploading(false);
    setUploadProgress(0);

    if (uploadedCount > 0 && failedCount === 0) {
      toast.success('Upload Complete', `Successfully uploaded ${uploadedCount} file${uploadedCount > 1 ? 's' : ''}.`);
    } else if (uploadedCount > 0 && failedCount > 0) {
      toast.warning('Upload Partial', `Uploaded ${uploadedCount} file${uploadedCount > 1 ? 's' : ''}, but ${failedCount} failed.`);
    } else if (failedCount > 0) {
      toast.error('Upload Failed', `Failed to upload ${failedCount} file${failedCount > 1 ? 's' : ''}.`);
    }
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    processFiles(files);
  };

  const onDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const onDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const onDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files);
      processFiles(files);
    }
  };

  const handleDelete = async (mediaItem) => {
    if (window.confirm(`Are you sure you want to delete "${mediaItem.name}"?`)) {
      try {
        await storageService.deleteFile(user.uid, mediaItem.id, mediaItem.storagePath);
        toast.info('Media Deleted', 'The file has been deleted from your library.');
      } catch (error) {
        console.error('Error deleting media:', error);
        toast.error('Delete Failed', 'Could not delete the file.');
      }
    }
  };

  const filteredMedia = media.filter(m => {
    if (filter === 'all') return true;
    if (filter === 'image') return m.type === 'image';
    if (filter === 'video') return m.type === 'video';
    return true;
  });

  const renderContent = () => (
    <div className={clsx(
      "flex flex-col h-full bg-white dark:bg-gray-800 transition-all",
      isInline ? "w-full" : "rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
    )}>
      {/* Header - Only render if not inline */}
      {!isInline && (
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Media Library</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors"
            aria-label="Close media library"
          >
            <i className="fas fa-times text-xl" />
          </button>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex space-x-2 bg-gray-100 dark:bg-gray-900/50 p-1 rounded-lg">
          {['all', 'image', 'video'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={clsx(
                "px-4 py-1.5 rounded-md text-sm font-medium transition-all",
                filter === f 
                  ? "bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm" 
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-gray-800/50"
              )}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}s
            </button>
          ))}
        </div>
        
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="btn-primary flex items-center px-4 py-2 text-sm transition-transform hover:scale-105 active:scale-95 disabled:hover:scale-100"
          >
            {uploading ? (
              <i className="fas fa-circle-notch fa-spin mr-2" />
            ) : (
              <i className="fas fa-cloud-upload-alt mr-2" />
            )}
            {uploading ? 'Uploading...' : 'Upload Media'}
          </button>
        </div>
      </div>

      {/* Upload Progress Bar */}
      {uploading && (
        <div className="w-full bg-gray-100 dark:bg-gray-700 h-1">
          <div 
            className="bg-indigo-600 h-1 transition-all duration-200 ease-out" 
            style={{ width: `${uploadProgress}%` }}
          />
        </div>
      )}

      {/* Media Grid & Drag Drop Zone */}
      <div 
        ref={dropZoneRef}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={clsx(
          "flex-1 overflow-y-auto p-4 min-h-[400px] relative transition-colors duration-200",
          isDragging ? "bg-indigo-50/50 dark:bg-indigo-900/10" : ""
        )}
      >
        {isDragging && (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-indigo-500/10 dark:bg-indigo-500/20 backdrop-blur-sm border-2 border-dashed border-indigo-500 rounded-lg m-4">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-full shadow-lg mb-4 animate-bounce">
              <i className="fas fa-cloud-upload-alt text-4xl text-indigo-600 dark:text-indigo-400" />
            </div>
            <h3 className="text-xl font-bold text-indigo-700 dark:text-indigo-300">Drop files here to upload</h3>
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin shadow-sm" />
          </div>
        ) : filteredMedia.length === 0 ? (
          <EmptyMediaState onUpload={() => fileInputRef.current?.click()} />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-12">
            {filteredMedia.map((item, i) => (
              <div
                key={item.id}
                className="relative group rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 shadow-sm hover:shadow-md transition-all animate-fadeIn"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                {item.type === 'image' ? (
                  <img
                    src={sanitizeURL(item.url)}
                    alt={item.name}
                    className="w-full h-40 object-cover transform group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-40 bg-gray-900 flex items-center justify-center group-hover:bg-gray-800 transition-colors">
                    <i className="fas fa-play-circle text-4xl text-white opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all" />
                  </div>
                )}
                
                {/* Mobile / Touch Action Corner Buttons */}
                <div className="absolute top-2 right-2 flex space-x-1.5 md:hidden z-10">
                  {onSelectMedia && (
                    <button
                      onClick={() => onSelectMedia(item)}
                      className="p-1.5 bg-white/95 dark:bg-gray-800/95 rounded-full text-gray-800 dark:text-white shadow-sm hover:bg-white flex items-center justify-center w-8 h-8"
                      title="Select"
                    >
                      <i className="fas fa-check text-sm text-indigo-600" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(item)}
                    className="p-1.5 bg-white/95 dark:bg-gray-800/95 rounded-full text-red-600 shadow-sm hover:bg-white flex items-center justify-center w-8 h-8"
                    title="Delete"
                  >
                    <i className="fas fa-trash text-sm" />
                  </button>
                </div>

                {/* Desktop Hover Overlay */}
                <div className="absolute inset-0 bg-black/60 transition-opacity hidden md:flex flex-col items-center justify-center space-y-3 opacity-0 group-hover:opacity-100 backdrop-blur-[2px]">
                  {onSelectMedia && (
                    <button
                      onClick={() => onSelectMedia(item)}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 font-medium text-sm transition-transform transform hover:scale-105"
                      title="Select Media"
                    >
                      <i className="fas fa-check mr-2" /> Select
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(item)}
                    className="px-4 py-2 bg-white text-red-600 rounded-lg hover:bg-red-50 font-medium text-sm transition-transform transform hover:scale-105"
                    title="Delete Media"
                  >
                    <i className="fas fa-trash-alt mr-2" /> Delete
                  </button>
                </div>
                
                {/* File name */}
                <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 via-black/50 to-transparent pointer-events-none">
                  <p className="text-white text-xs truncate font-medium drop-shadow-md">{item.name}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50">
        <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center justify-center">
          <i className="fas fa-hdd mr-2" />
          {filteredMedia.length} file{filteredMedia.length !== 1 ? 's' : ''} stored in your library
        </p>
      </div>
    </div>
  );

  if (isInline) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col w-full h-full">
        {renderContent()}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 sm:p-6 animate-fadeIn">
      {renderContent()}
    </div>
  );
};

export default MediaLibrary;
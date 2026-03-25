import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { storageService } from '../../services/storage';

const MediaLibrary = ({ onSelectMedia, onClose }) => {
  const { user } = useAuth();
  const [media, setMedia] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [filter, setFilter] = useState('all'); // all, image, video
  const fileInputRef = useRef(null);

  useEffect(() => {
    // Load media from storage (would connect to actual storage in production)
    setIsLoading(false);
    // Demo media items
    setMedia([
      { id: '1', url: 'https://placehold.co/400x300/6366f1/ffffff?text=Image+1', type: 'image', name: 'marketing-image-1.jpg', uploadedAt: Date.now() },
      { id: '2', url: 'https://placehold.co/400x300/ec4899/ffffff?text=Image+2', type: 'image', name: 'product-photo.jpg', uploadedAt: Date.now() - 86400000 },
      { id: '3', url: 'https://placehold.co/400x300/10b981/ffffff?text=Image+3', type: 'image', name: 'team-photo.jpg', uploadedAt: Date.now() - 172800000 },
    ]);
  }, [user]);

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploading(true);
    
    for (const file of files) {
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');
      
      if (!isImage && !isVideo) continue;

      // In production, this would upload to Firebase Storage
      // For demo, create object URL
      const newMedia = {
        id: Date.now().toString() + Math.random(),
        url: URL.createObjectURL(file),
        type: isImage ? 'image' : 'video',
        name: file.name,
        uploadedAt: Date.now(),
        file
      };
      
      setMedia(prev => [newMedia, ...prev]);
    }
    
    setUploading(false);
  };

  const handleDelete = (mediaId) => {
    if (window.confirm('Are you sure you want to delete this media?')) {
      setMedia(prev => prev.filter(m => m.id !== mediaId));
    }
  };

  const filteredMedia = media.filter(m => {
    if (filter === 'all') return true;
    if (filter === 'image') return m.type === 'image';
    if (filter === 'video') return m.type === 'video';
    return true;
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Media Library</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-white"
          >
            <i className="fas fa-times text-xl" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex space-x-2">
            {['all', 'image', 'video'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === f 
                    ? 'bg-indigo-600 text-white' 
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
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
              className="btn-primary flex items-center"
            >
              <i className="fas fa-upload mr-2" />
              {uploading ? 'Uploading...' : 'Upload'}
            </button>
          </div>
        </div>

        {/* Media Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
            </div>
          ) : filteredMedia.length === 0 ? (
            <div className="text-center text-gray-500 dark:text-gray-400 py-12">
              <i className="fas fa-images text-4xl mb-4" />
              <p>No media files yet. Upload some to get started!</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredMedia.map(item => (
                <div
                  key={item.id}
                  className="relative group rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700"
                >
                  {item.type === 'image' ? (
                    <img
                      src={item.url}
                      alt={item.name}
                      className="w-full h-40 object-cover"
                    />
                  ) : (
                    <div className="w-full h-40 bg-gray-900 flex items-center justify-center">
                      <i className="fas fa-play-circle text-4xl text-white" />
                    </div>
                  )}
                  
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all flex items-center justify-center space-x-2 opacity-0 group-hover:opacity-100">
                    <button
                      onClick={() => onSelectMedia && onSelectMedia(item)}
                      className="p-2 bg-white rounded-full text-gray-800 hover:bg-gray-100"
                      title="Select"
                    >
                      <i className="fas fa-check" />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-2 bg-white rounded-full text-red-600 hover:bg-gray-100"
                      title="Delete"
                    >
                      <i className="fas fa-trash" />
                    </button>
                  </div>
                  
                  {/* File name */}
                  <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black to-transparent">
                    <p className="text-white text-xs truncate">{item.name}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {filteredMedia.length} file{filteredMedia.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>
    </div>
  );
};

export default MediaLibrary;
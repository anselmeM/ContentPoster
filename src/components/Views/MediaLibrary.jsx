import { useState, useEffect, useRef, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { storageService } from '../../services/storage';
import { toast } from '../../services/notifications';
import { sanitizeURL } from '../../utils/sanitizeUtils';
import { EmptyMediaState } from '../UI/EmptyState';
import clsx from 'clsx';

// Modal component for editing media item tags, folder, category, and name
const EditMediaModal = ({ item, userId, onClose }) => {
  const [name, setName] = useState(item.name || '');
  const [category, setCategory] = useState(item.category || 'uncategorized');
  const [folder, setFolder] = useState((item.folder || '/').replace(/^\//, ''));
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState(item.tags || []);
  const [isSaving, setIsSaving] = useState(false);

  const handleAddTag = (e) => {
    e.preventDefault();
    const tag = tagInput.trim().toLowerCase();
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag]);
    }
    setTagInput('');
  };

  const handleRemoveTag = (tagToRemove) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const cleanFolder = folder.trim() ? `/${folder.trim().replace(/^\/+|\/+$/g, '')}` : '/';
      await storageService.updateFileMetadata(userId, item.id, {
        name: name.trim(),
        category: category.trim(),
        folder: cleanFolder,
        tags: tags
      });
      toast.success('Saved', 'File metadata updated successfully.');
      onClose();
    } catch (err) {
      console.error(err);
      toast.error('Failed to Save', 'Could not save metadata details.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-[110] p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md p-6 border border-gray-150 dark:border-gray-700 animate-fadeIn">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Edit Media Details</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-white">
            <i className="fas fa-times text-lg" />
          </button>
        </div>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">File Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500"
            >
              <option value="uncategorized">Uncategorized</option>
              <option value="banner">Banner / Cover</option>
              <option value="product">Product Shot</option>
              <option value="promo">Promotional / Ads</option>
              <option value="behind-scenes">Behind the Scenes</option>
              <option value="logo">Logo / Asset</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Folder Path</label>
            <div className="flex items-center">
              <span className="text-gray-400 dark:text-gray-500 mr-1.5 text-sm">/</span>
              <input
                type="text"
                value={folder}
                onChange={(e) => setFolder(e.target.value)}
                placeholder="e.g. Campaigns/Social"
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Tags</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder="Add a tag..."
                className="flex-1 px-3 py-2 border rounded-lg dark:bg-gray-700 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500"
              />
              <button type="button" onClick={handleAddTag} className="btn-primary px-3 py-2 text-sm">Add</button>
            </div>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {tags.map(t => (
                <span key={t} className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-850">
                  #{t}
                  <button type="button" onClick={() => handleRemoveTag(t)} className="text-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-200">
                    <i className="fas fa-times text-[10px]" />
                  </button>
                </span>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:text-white rounded-lg text-sm transition-colors">Cancel</button>
            <button type="submit" disabled={isSaving} className="btn-primary px-4 py-2 text-sm">{isSaving ? 'Saving...' : 'Save Changes'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const MediaLibrary = ({ onSelectMedia, onClose, isInline = false }) => {
  const { user } = useAuth();
  const [media, setMedia] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [filter, setFilter] = useState('all'); // all, image, video
  
  // Tag, Category, and Folder state variables
  const [currentFolder, setCurrentFolder] = useState('/');
  const [selectedTag, setSelectedTag] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [editingItem, setEditingItem] = useState(null);
  const [extraFolders, setExtraFolders] = useState([]);

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

  // Compute list of dynamic folders, categories, and tags
  const uniqueTags = useMemo(() => {
    const tags = new Set();
    media.forEach(item => {
      if (item.tags) {
        item.tags.forEach(t => tags.add(t));
      }
    });
    return Array.from(tags);
  }, [media]);

  const categoriesList = [
    { value: 'all', label: 'All Categories' },
    { value: 'uncategorized', label: 'Uncategorized' },
    { value: 'banner', label: 'Banners' },
    { value: 'product', label: 'Product Shots' },
    { value: 'promo', label: 'Promos / Ads' },
    { value: 'behind-scenes', label: 'Behind the Scenes' },
    { value: 'logo', label: 'Logos / Assets' }
  ];

  const { currentFolders, folderFiles } = useMemo(() => {
    const folders = new Set();
    const files = [];

    // Find dynamic folders based on file entries
    media.forEach(item => {
      const folderPath = item.folder || '/';
      
      if (folderPath === currentFolder) {
        files.push(item);
      } else if (folderPath.startsWith(currentFolder === '/' ? '/' : currentFolder + '/')) {
        const subPath = currentFolder === '/' 
          ? folderPath.slice(1) 
          : folderPath.slice(currentFolder.length + 1);
        const nextSegment = subPath.split('/')[0];
        if (nextSegment) {
          folders.add(nextSegment);
        }
      }
    });

    // Merge manually created empty folders matching the path
    extraFolders.forEach(f => {
      const parentPath = f.path.substring(0, f.path.lastIndexOf('/')) || '/';
      if (parentPath === currentFolder) {
        folders.add(f.name);
      }
    });

    return {
      currentFolders: Array.from(folders),
      folderFiles: files
    };
  }, [media, currentFolder, extraFolders]);

  const filteredMedia = useMemo(() => {
    return folderFiles.filter(item => {
      if (filter !== 'all') {
        if (filter === 'image' && item.type !== 'image') return false;
        if (filter === 'video' && item.type !== 'video') return false;
      }
      if (selectedCategory !== 'all') {
        const itemCat = item.category || 'uncategorized';
        if (itemCat !== selectedCategory) return false;
      }
      if (selectedTag) {
        if (!item.tags || !item.tags.includes(selectedTag)) return false;
      }
      return true;
    });
  }, [folderFiles, filter, selectedCategory, selectedTag]);

  const renderContent = () => (
    <div className={clsx(
      "flex flex-col h-full bg-white dark:bg-gray-800 transition-all relative",
      isInline ? "w-full" : "rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden"
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

      {/* Dynamic 2-column Layout split */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Column: Sidebar Filters */}
        <div className="w-56 border-r border-gray-200 dark:border-gray-700 p-4 space-y-6 overflow-y-auto hidden md:block bg-gray-50/30 dark:bg-gray-900/10">
          {/* Categories */}
          <div>
            <h4 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2.5">Category</h4>
            <div className="space-y-1">
              {categoriesList.map(cat => (
                <button
                  key={cat.value}
                  onClick={() => setSelectedCategory(cat.value)}
                  className={clsx(
                    "w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center justify-between",
                    selectedCategory === cat.value
                      ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300"
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-850"
                  )}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div>
            <h4 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2.5">Tags</h4>
            <div className="space-y-1">
              <button
                onClick={() => setSelectedTag('')}
                className={clsx(
                  "w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors",
                  selectedTag === ''
                    ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-850"
                )}
              >
                All Tags
              </button>
              {uniqueTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(tag)}
                  className={clsx(
                    "w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5",
                    selectedTag === tag
                      ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300"
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-850"
                  )}
                >
                  <i className="fas fa-tag text-[10px] text-gray-400" />
                  <span className="truncate">#{tag}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Content Area (Toolbar, Folders, Grid) */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center justify-between p-4 gap-3 border-b border-gray-200 dark:border-gray-700">
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
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const name = prompt('Enter new folder name:');
                  if (name && name.trim()) {
                    const cleanName = name.trim().replace(/^\/+|\/+$/g, '');
                    const folderPath = currentFolder === '/' ? `/${cleanName}` : `${currentFolder}/${cleanName}`;
                    setExtraFolders([...extraFolders, { path: folderPath, name: cleanName }]);
                  }
                }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg text-sm font-semibold transition-colors"
              >
                <i className="fas fa-folder-plus mr-2" />
                New Folder
              </button>

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
                {uploading ? 'Uploading...' : 'Upload'}
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

          {/* Media View Contents */}
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

            {/* Breadcrumbs trail */}
            <div className="flex items-center gap-1.5 text-xs mb-4 bg-gray-50 dark:bg-gray-900/20 p-2 rounded-lg border border-gray-200/50 dark:border-gray-750">
              <button 
                onClick={() => setCurrentFolder('/')}
                className="text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 font-semibold flex items-center gap-1"
              >
                <i className="fas fa-home" /> Root
              </button>
              {currentFolder !== '/' && currentFolder.split('/').filter(Boolean).map((seg, idx, arr) => {
                const path = '/' + arr.slice(0, idx + 1).join('/');
                return (
                  <span key={path} className="flex items-center gap-1.5 text-gray-400">
                    <i className="fas fa-chevron-right text-[10px]" />
                    <button 
                      onClick={() => setCurrentFolder(path)}
                      className="hover:text-indigo-600 dark:hover:text-indigo-400 text-gray-650 dark:text-gray-300"
                    >
                      {seg}
                    </button>
                  </span>
                );
              })}
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin shadow-sm" />
              </div>
            ) : (
              <div className="space-y-4">
                {/* Dynamic folders list cards */}
                {currentFolders.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {currentFolders.map(folderName => {
                      const fullFolderPath = currentFolder === '/' ? `/${folderName}` : `${currentFolder}/${folderName}`;
                      return (
                        <div
                          key={folderName}
                          onClick={() => setCurrentFolder(fullFolderPath)}
                          className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-indigo-500/50 hover:shadow-xs cursor-pointer group transition-all"
                        >
                          <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:scale-105 transition-transform">
                            <i className="fas fa-folder text-lg" />
                          </div>
                          <div className="truncate">
                            <p className="font-semibold text-sm text-gray-800 dark:text-white truncate">{folderName}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Media files list cards */}
                {filteredMedia.length === 0 && currentFolders.length === 0 ? (
                  <EmptyMediaState onUpload={() => fileInputRef.current?.click()} />
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 pb-12">
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
                        
                        {/* Mobile Action buttons */}
                        <div className="absolute top-2 right-2 flex space-x-1.5 md:hidden z-10">
                          <button
                            onClick={() => setEditingItem(item)}
                            className="p-1.5 bg-white/95 dark:bg-gray-800/95 rounded-full text-gray-800 dark:text-white shadow-sm flex items-center justify-center w-8 h-8 font-semibold"
                            title="Edit details"
                          >
                            <i className="fas fa-pen text-xs" />
                          </button>
                          {onSelectMedia && (
                            <button
                              onClick={() => onSelectMedia(item)}
                              className="p-1.5 bg-white/95 dark:bg-gray-800/95 rounded-full text-gray-800 dark:text-white shadow-sm flex items-center justify-center w-8 h-8"
                              title="Select"
                            >
                              <i className="fas fa-check text-sm text-indigo-600" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(item)}
                            className="p-1.5 bg-white/95 dark:bg-gray-800/95 rounded-full text-red-650 shadow-sm flex items-center justify-center w-8 h-8"
                            title="Delete"
                          >
                            <i className="fas fa-trash text-sm" />
                          </button>
                        </div>

                        {/* Desktop Hover Overlay */}
                        <div className="absolute inset-0 bg-black/60 transition-opacity hidden md:flex flex-col items-center justify-center space-y-2.5 opacity-0 group-hover:opacity-100 backdrop-blur-[2px]">
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
                            onClick={() => setEditingItem(item)}
                            className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-750 font-medium text-sm transition-transform transform hover:scale-105"
                            title="Edit Media Details"
                          >
                            <i className="fas fa-pen mr-2" /> Edit Details
                          </button>
                          <button
                            onClick={() => handleDelete(item)}
                            className="px-4 py-2 bg-white text-red-655 rounded-lg hover:bg-red-50 font-medium text-sm transition-transform transform hover:scale-105"
                            title="Delete Media"
                          >
                            <i className="fas fa-trash-alt mr-2" /> Delete
                          </button>
                        </div>
                        
                        {/* File name / Category display */}
                        <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/85 via-black/50 to-transparent pointer-events-none">
                          <p className="text-white text-xs truncate font-semibold drop-shadow-md">{item.name}</p>
                          {item.category && item.category !== 'uncategorized' && (
                            <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-indigo-600 text-white leading-none">
                              {item.category}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50">
        <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center justify-center">
          <i className="fas fa-hdd mr-2" />
          {filteredMedia.length} file{filteredMedia.length !== 1 ? 's' : ''} stored in this folder
        </p>
      </div>

      {/* Render Edit Media Modal */}
      {editingItem && (
        <EditMediaModal 
          item={editingItem} 
          userId={user.uid} 
          onClose={() => setEditingItem(null)} 
        />
      )}
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
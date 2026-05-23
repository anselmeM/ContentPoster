import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { templatesService } from '../../services/firebase';
import { sanitizeURL } from '../../utils/sanitizeUtils';
import { EmptyTemplatesState } from '../UI/EmptyState';
import clsx from 'clsx';

const platformIcons = {
  linkedin: 'fa-linkedin-in',
  instagram: 'fa-instagram',
  dribbble: 'fa-dribbble',
  facebook: 'fa-facebook-f'
};

const platformStyles = {
  linkedin: { active: 'bg-blue-600 text-white', hover: 'hover:bg-blue-700 hover:text-white text-blue-600 border border-blue-600' },
  instagram: { active: 'bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500 text-white', hover: 'hover:opacity-90 text-pink-500 border border-pink-500' },
  dribbble: { active: 'bg-pink-500 text-white', hover: 'hover:bg-pink-600 hover:text-white text-pink-500 border border-pink-500' },
  facebook: { active: 'bg-blue-800 text-white', hover: 'hover:bg-blue-900 hover:text-white text-blue-800 border border-blue-800' }
};

const TemplatesView = ({ onOpenModal }) => {
  const { user } = useAuth();
  const [templates, setTemplates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    title: '',
    image: '',
    platform: 'instagram'
  });

  useEffect(() => {
    if (!user) return;

    const unsubscribe = templatesService.subscribe(user.uid, (templatesData) => {
      setTemplates(templatesData);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleCreateTemplate = async (e) => {
    e.preventDefault();
    if (!newTemplate.name || !newTemplate.title) return;

    await templatesService.create(user.uid, newTemplate);
    setNewTemplate({ name: '', title: '', image: '', platform: 'instagram' });
    setShowForm(false);
  };

  const handleDeleteTemplate = async (templateId) => {
    if (window.confirm('Are you sure you want to delete this template?')) {
      await templatesService.delete(user.uid, templateId);
    }
  };

  const handleUseTemplate = (template) => {
    // Open post modal with template data pre-filled
    onOpenModal({
      title: template.title,
      image: template.image,
      platform: template.platform,
      date: '',
      time: ''
    });
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
          Post Templates
        </h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className={`btn-primary flex items-center ${showForm ? 'bg-gray-500 hover:bg-gray-600' : ''}`}
        >
          {showForm ? 'Cancel' : '+ New Template'}
        </button>
      </div>
      
      {/* Create template form */}
      {showForm && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8 transition-all duration-300">
          <h4 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">Create New Template</h4>
          <form onSubmit={handleCreateTemplate} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Template Name
              </label>
              <input
                type="text"
                value={newTemplate.name}
                onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                className="input-field dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="e.g., Weekly Update"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Default Title
              </label>
              <input
                type="text"
                value={newTemplate.title}
                onChange={(e) => setNewTemplate({ ...newTemplate, title: e.target.value })}
                className="input-field dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="Post title"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Default Image URL
              </label>
              <input
                type="url"
                value={newTemplate.image}
                onChange={(e) => setNewTemplate({ ...newTemplate, image: e.target.value })}
                className="input-field dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="https://..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Platform
              </label>
              <div className="flex space-x-3">
                {['instagram', 'linkedin', 'dribbble', 'facebook'].map((platform) => {
                  const isActive = newTemplate.platform === platform;
                  return (
                    <button
                      key={platform}
                      type="button"
                      onClick={() => setNewTemplate(prev => ({ ...prev, platform }))}
                      className={clsx(
                        'w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500',
                        isActive 
                          ? platformStyles[platform].active 
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                      )}
                      aria-label={`Select ${platform}`}
                      title={platform.charAt(0).toUpperCase() + platform.slice(1)}
                    >
                      <i className={`fab ${platformIcons[platform]} text-base`} />
                    </button>
                  );
                })}
              </div>
            </div>
            
            <div className="pt-2">
              <button type="submit" className="btn-primary">
                Save Template
              </button>
            </div>
          </form>
        </div>
      )}
      
      {/* Templates grid */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
        </div>
      ) : templates.length === 0 ? (
        <EmptyTemplatesState onCreateTemplate={() => setShowForm(true)} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <div
              key={template.id}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5 flex flex-col justify-between transition-all duration-300 hover:shadow-md hover:border-indigo-100 dark:hover:border-gray-600"
            >
              <div>
                {/* Template Name & Delete Button */}
                <div className="flex justify-between items-start mb-3">
                  <h4 className="font-bold text-gray-900 dark:text-white truncate pr-2" title={template.name}>
                    {template.name}
                  </h4>
                  <button
                    onClick={() => handleDeleteTemplate(template.id)}
                    className="text-gray-400 hover:text-red-600 dark:hover:text-red-400 p-1 rounded-md transition-colors"
                    aria-label={`Delete ${template.name}`}
                  >
                    <i className="fas fa-trash-alt" aria-hidden="true" />
                  </button>
                </div>

                {/* Aspect-Video Preview */}
                <div className="relative rounded-lg overflow-hidden mb-4 aspect-video bg-gray-100 dark:bg-gray-700 flex items-center justify-center border border-gray-200 dark:border-gray-600">
                  {template.image ? (
                    <img
                      src={sanitizeURL(template.image)}
                      alt={template.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-indigo-50 to-indigo-100/50 dark:from-indigo-950/35 dark:to-indigo-900/15 flex flex-col items-center justify-center p-4">
                      <i className="fas fa-file-alt text-2xl text-indigo-400/80 dark:text-indigo-600/80 mb-2" />
                      <span className="text-xs text-indigo-500/80 dark:text-indigo-400/80 font-medium">Text Post Template</span>
                    </div>
                  )}
                  {/* Platform Badge Overlay */}
                  <div className={clsx(
                    'absolute top-2 right-2 w-7 h-7 rounded-full text-white flex items-center justify-center text-xs shadow-md',
                    template.platform === 'linkedin' && 'bg-blue-600',
                    template.platform === 'instagram' && 'bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500',
                    template.platform === 'dribbble' && 'bg-pink-500',
                    template.platform === 'facebook' && 'bg-blue-700'
                  )}>
                    <i className={`fab ${platformIcons[template.platform]}`} aria-hidden="true" />
                  </div>
                </div>

                {/* Post Title Preview */}
                <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-3 mb-4 min-h-[40px]" title={template.title}>
                  {template.title}
                </p>
              </div>
              
              {/* Actions Footer */}
              <div className="flex items-center justify-end pt-3 border-t border-gray-100 dark:border-gray-700">
                <button
                  onClick={() => handleUseTemplate(template)}
                  className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 hover:dark:text-indigo-300 text-sm font-semibold flex items-center gap-1.5 transition-colors group"
                >
                  <i className="fas fa-paper-plane text-xs transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  Use Template
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TemplatesView;
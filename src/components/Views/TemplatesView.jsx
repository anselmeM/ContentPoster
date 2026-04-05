import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { templatesService } from '../../services/firebase';
import { sanitizeURL } from '../../utils/sanitizeUtils';
import clsx from 'clsx';

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

  const platformIcons = {
    linkedin: 'fa-linkedin-in',
    instagram: 'fa-instagram',
    dribbble: 'fa-dribbble',
    facebook: 'fa-facebook-f'
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
          Post Templates
        </h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-primary"
        >
          {showForm ? 'Cancel' : '+ New Template'}
        </button>
      </div>
      
      {/* Create template form */}
      {showForm && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
          <h4 className="text-md font-semibold mb-4 dark:text-white">Create New Template</h4>
          <form onSubmit={handleCreateTemplate} className="space-y-4">
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
              <div className="flex space-x-4">
                {['instagram', 'linkedin', 'dribbble'].map((platform) => (
                  <label key={platform} className="flex items-center">
                    <input
                      type="radio"
                      name="platform"
                      value={platform}
                      checked={newTemplate.platform === platform}
                      onChange={(e) => setNewTemplate({ ...newTemplate, platform: e.target.value })}
                      className="mr-2"
                    />
                    <span className="capitalize dark:text-white">{platform}</span>
                  </label>
                ))}
              </div>
            </div>
            <button type="submit" className="btn-primary">
              Save Template
            </button>
          </form>
        </div>
      )}
      
      {/* Templates grid */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
        </div>
      ) : templates.length === 0 ? (
        <div className="text-center text-gray-500 dark:text-gray-400 py-12">
          <i className="fas fa-file-alt text-4xl mb-4" aria-hidden="true" />
          <p>No templates yet. Create one to get started!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <div
              key={template.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4"
            >
              <div className="flex justify-between items-start mb-3">
                <h4 className="font-semibold text-gray-800 dark:text-white">
                  {template.name}
                </h4>
                <button
                  onClick={() => handleDeleteTemplate(template.id)}
                  className="text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                  aria-label={`Delete ${template.name}`}
                >
                  <i className="fas fa-trash-alt" aria-hidden="true" />
                </button>
              </div>
              
              {template.image && (
                <img
                    src={sanitizeURL(template.image)}
                  alt={template.name}
                  className="rounded-lg mb-3 w-full h-32 object-cover"
                />
              )}
              
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                {template.title}
              </p>
              
              <div className="flex items-center justify-between">
                <span className={clsx(
                  'w-6 h-6 rounded-full text-white flex items-center justify-center text-sm',
                  template.platform === 'linkedin' && 'bg-blue-600',
                  template.platform === 'instagram' && 'bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500',
                  template.platform === 'dribbble' && 'bg-pink-500'
                )}>
                  <i className={`fab ${platformIcons[template.platform]}`} aria-hidden="true" />
                </span>
                
                <button
                  onClick={() => handleUseTemplate(template)}
                  className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 text-sm font-medium"
                >
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
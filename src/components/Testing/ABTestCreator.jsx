import { useState } from 'react';
import clsx from 'clsx';
import { PLATFORMS, PLATFORM_LIST } from '../../config/platforms';
import { TEST_TYPES, PRIMARY_METRICS, TEST_STATUS } from './ABTestDashboard';

const ABTestCreator = ({ onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    testType: TEST_TYPES.CONTENT,
    platform: 'instagram',
    primaryMetric: PRIMARY_METRICS.ENGAGEMENT_RATE,
    variants: [
      { id: 'a', name: 'Variant A', content: '', mediaUrl: '', scheduledTime: '' },
      { id: 'b', name: 'Variant B', content: '', mediaUrl: '', scheduledTime: '' }
    ],
    trafficSplit: { variantA: 50, variantB: 50 },
    confidenceLevel: 95,
    startDate: new Date().toISOString().split('T')[0],
    endDate: ''
  });

  const [validation, setValidation] = useState({});

  // Update form field
  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setValidation(prev => ({ ...prev, [field]: null }));
  };

  // Update variant
  const updateVariant = (variantId, field, value) => {
    setFormData(prev => ({
      ...prev,
      variants: prev.variants.map(v => 
        v.id === variantId ? { ...v, [field]: value } : v
      )
    }));
  };

  // Add more variants
  const addVariant = () => {
    if (formData.variants.length >= 4) return;
    const newId = String.fromCharCode(97 + formData.variants.length); // c, d
    setFormData(prev => ({
      ...prev,
      variants: [...prev.variants, { 
        id: newId, 
        name: `Variant ${newId.toUpperCase()}`, 
        content: '', 
        mediaUrl: '', 
        scheduledTime: '' 
      }]
    }));
  };

  // Remove variant
  const removeVariant = (variantId) => {
    if (formData.variants.length <= 2) return;
    setFormData(prev => ({
      ...prev,
      variants: prev.variants.filter(v => v.id !== variantId)
    }));
  };

  // Update traffic split
  const updateTrafficSplit = (variant, value) => {
    const newValue = parseInt(value) || 0;
    const otherVariant = variant === 'variantA' ? 'variantB' : 'variantA';
    const otherValue = 100 - newValue;
    
    setFormData(prev => ({
      ...prev,
      trafficSplit: {
        [variant]: newValue,
        [otherVariant]: otherValue
      }
    }));
  };

  // Validate form
  const validate = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = 'Test name is required';
    if (!formData.startDate) errors.startDate = 'Start date is required';
    formData.variants.forEach((v, idx) => {
      if (!v.content.trim()) errors[`variant_${idx}`] = 'Content is required';
    });
    return errors;
  };

  // Handle submit
  const handleSubmit = (e) => {
    e.preventDefault();
    
    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setValidation(errors);
      return;
    }

    // Create test object
    const test = {
      id: `test_${Date.now()}`,
      name: formData.name,
      testType: formData.testType,
      platform: formData.platform,
      primaryMetric: formData.primaryMetric,
      variants: formData.variants,
      trafficSplit: formData.trafficSplit,
      confidenceLevel: formData.confidenceLevel,
      startDate: formData.startDate,
      endDate: formData.endDate || null,
      status: TEST_STATUS.DRAFT,
      results: null,
      createdAt: new Date().toISOString()
    };

    onSave && onSave(test);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-gray-800 dark:text-white">
          <i className="fas fa-flask mr-2 text-purple-600" />
          Create A/B Test
        </h3>
        <button
          onClick={onCancel}
          className="text-gray-500 hover:text-gray-700 dark:hover:text-white"
        >
          <i className="fas fa-times text-xl" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Test Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => updateField('name', e.target.value)}
              className={clsx(
                'input-field dark:bg-gray-700 dark:border-gray-600 dark:text-white',
                validation.name && 'border-red-500'
              )}
              placeholder="e.g., Headline Test for Product Launch"
            />
            {validation.name && (
              <p className="text-red-500 text-xs mt-1">{validation.name}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Test Type
            </label>
            <select
              value={formData.testType}
              onChange={(e) => updateField('testType', e.target.value)}
              className="input-field dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value={TEST_TYPES.CONTENT}>Content Testing</option>
              <option value={TEST_TYPES.TIMING}>Timing Testing</option>
              <option value={TEST_TYPES.FORMAT}>Format Testing</option>
              <option value={TEST_TYPES.HASHTAG}>Hashtag Testing</option>
            </select>
          </div>
        </div>

        {/* Platform & Metric */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Platform
            </label>
            <select
              value={formData.platform}
              onChange={(e) => updateField('platform', e.target.value)}
              className="input-field dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              {PLATFORM_LIST.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Primary Metric
            </label>
            <select
              value={formData.primaryMetric}
              onChange={(e) => updateField('primaryMetric', e.target.value)}
              className="input-field dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value={PRIMARY_METRICS.ENGAGEMENT_RATE}>Engagement Rate</option>
              <option value={PRIMARY_METRICS.CLICKS}>Clicks</option>
              <option value={PRIMARY_METRICS.REACH}>Reach</option>
              <option value={PRIMARY_METRICS.CONVERSIONS}>Conversions</option>
            </select>
          </div>
        </div>

        {/* Variants */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Variants <span className="text-red-500">*</span>
            </label>
            {formData.variants.length < 4 && (
              <button
                type="button"
                onClick={addVariant}
                className="text-sm text-indigo-600 hover:text-indigo-700"
              >
                <i className="fas fa-plus mr-1" />
                Add Variant
              </button>
            )}
          </div>
          
          <div className="space-y-4">
            {formData.variants.map((variant, idx) => (
              <div 
                key={variant.id}
                className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600"
              >
                <div className="flex items-center justify-between mb-2">
                  <input
                    type="text"
                    value={variant.name}
                    onChange={(e) => updateVariant(variant.id, 'name', e.target.value)}
                    className="font-medium text-gray-800 dark:text-white bg-transparent border-b border-gray-300 dark:border-gray-600 focus:outline-none focus:border-indigo-500"
                  />
                  {formData.variants.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeVariant(variant.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <i className="fas fa-trash" />
                    </button>
                  )}
                </div>
                
                <textarea
                  value={variant.content}
                  onChange={(e) => updateVariant(variant.id, 'content', e.target.value)}
                  rows={3}
                  className={clsx(
                    'w-full input-field dark:bg-gray-700 dark:border-gray-600 dark:text-white resize-none',
                    validation[`variant_${idx}`] && 'border-red-500'
                  )}
                  placeholder={`Enter content for ${variant.name}...`}
                />
                {validation[`variant_${idx}`] && (
                  <p className="text-red-500 text-xs mt-1">{validation[`variant_${idx}`]}</p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Traffic Split */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Traffic Split
          </label>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-600 dark:text-gray-400">Variant A</span>
                <span className="text-sm font-medium text-gray-800 dark:text-white">
                  {formData.trafficSplit.variantA}%
                </span>
              </div>
              <input
                type="range"
                min="10"
                max="90"
                value={formData.trafficSplit.variantA}
                onChange={(e) => updateTrafficSplit('variantA', e.target.value)}
                className="w-full"
              />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-600 dark:text-gray-400">Variant B</span>
                <span className="text-sm font-medium text-gray-800 dark:text-white">
                  {formData.trafficSplit.variantB}%
                </span>
              </div>
              <input
                type="range"
                min="10"
                max="90"
                value={formData.trafficSplit.variantB}
                onChange={(e) => updateTrafficSplit('variantB', e.target.value)}
                className="w-full"
              />
            </div>
          </div>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Start Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={formData.startDate}
              onChange={(e) => updateField('startDate', e.target.value)}
              className={clsx(
                'input-field dark:bg-gray-700 dark:border-gray-600 dark:text-white',
                validation.startDate && 'border-red-500'
              )}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              End Date <span className="text-gray-400">(optional)</span>
            </label>
            <input
              type="date"
              value={formData.endDate}
              onChange={(e) => updateField('endDate', e.target.value)}
              min={formData.startDate}
              className="input-field dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
        </div>

        {/* Confidence Level */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Confidence Level
          </label>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min="80"
              max="99"
              value={formData.confidenceLevel}
              onChange={(e) => updateField('confidenceLevel', parseInt(e.target.value))}
              className="flex-1"
            />
            <span className="text-sm font-medium text-gray-800 dark:text-white w-12">
              {formData.confidenceLevel}%
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Statistical significance threshold for declaring a winner
          </p>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            <i className="fas fa-save mr-2" />
            Create Test
          </button>
        </div>
      </form>
    </div>
  );
};

export default ABTestCreator;
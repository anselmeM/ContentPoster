import { useState, useMemo } from 'react';
import clsx from 'clsx';

// A/B Test status constants
export const TEST_STATUS = {
  DRAFT: 'draft',
  RUNNING: 'running',
  COMPLETED: 'completed',
  PAUSED: 'paused'
};

// A/B Test types
export const TEST_TYPES = {
  CONTENT: 'content',
  TIMING: 'timing',
  FORMAT: 'format',
  HASHTAG: 'hashtag'
};

// Primary metrics
export const PRIMARY_METRICS = {
  ENGAGEMENT_RATE: 'engagement_rate',
  CLICKS: 'clicks',
  REACH: 'reach',
  CONVERSIONS: 'conversions'
};

// Calculate statistical significance using two-tailed t-test
const calculateStatisticalSignificance = (variantA, variantB) => {
  if (!variantA.impressions || !variantB.impressions) {
    return { pValue: null, confidence: 0, isSignificant: false };
  }
  
  // Calculate engagement rates
  const rateA = variantA.engagement / variantA.impressions;
  const rateB = variantB.engagement / variantB.impressions;
  
  // Pooled probability
  const pPooled = (variantA.engagement + variantB.engagement) / 
                  (variantA.impressions + variantB.impressions);
  
  // Standard error
  const se = Math.sqrt(pPooled * (1 - pPooled) * 
    (1/variantA.impressions + 1/variantB.impressions));
  
  if (se === 0) {
    return { pValue: null, confidence: 0, isSignificant: false };
  }
  
  // Z-score
  const z = (rateA - rateB) / se;
  
  // Approximate p-value from z-score (two-tailed)
  // Using simple approximation
  const pValue = Math.exp(-0.717 * z * Math.abs(z) - 0.416 * z * Math.abs(z));
  
  const confidence = Math.min(99.9, Math.max(0, (1 - pValue) * 100));
  const isSignificant = confidence >= 95;
  
  return { pValue, confidence, isSignificant };
};

// Calculate winner based on results
const determineWinner = (results, primaryMetric) => {
  if (!results) return null;
  
  const variantA = results.variantA;
  const variantB = results.variantB;
  
  if (!variantA?.impressions || !variantB?.impressions) {
    return 'insufficient_data';
  }
  
  // Get metric values based on primary metric
  let metricA, metricB;
  
  switch (primaryMetric) {
    case PRIMARY_METRICS.ENGAGEMENT_RATE:
      metricA = (variantA.engagement / variantA.impressions) * 100;
      metricB = (variantB.engagement / variantB.impressions) * 100;
      break;
    case PRIMARY_METRICS.CLICKS:
      metricA = variantA.clicks || 0;
      metricB = variantB.clicks || 0;
      break;
    case PRIMARY_METRICS.REACH:
      metricA = variantA.impressions;
      metricB = variantB.impressions;
      break;
    case PRIMARY_METRICS.CONVERSIONS:
      metricA = variantA.conversions || 0;
      metricB = variantB.conversions || 0;
      break;
    default:
      metricA = variantA.engagement;
      metricB = variantB.engagement;
  }
  
  // Calculate significance
  const { confidence, isSignificant } = calculateStatisticalSignificance(variantA, variantB);
  
  if (!isSignificant) {
    return { winner: 'insufficient_data', confidence, isSignificant };
  }
  
  return {
    winner: metricA > metricB ? 'variantA' : 'variantB',
    confidence,
    isSignificant,
    improvement: Math.abs((metricA - metricB) / Math.max(metricA, metricB) * 100).toFixed(1)
  };
};

const ABTestDashboard = ({ 
  tests = [], 
  onTestSelect,
  onTestCreate,
  onTestStatusChange,
  onTestDelete,
  showCreateButton = true
}) => {
  const [filter, setFilter] = useState('all');
  const [expandedTest, setExpandedTest] = useState(null);

  // Filter tests by status
  const filteredTests = useMemo(() => {
    if (filter === 'all') return tests;
    return tests.filter(t => t.status === filter);
  }, [tests, filter]);

  // Stats summary
  // Optimized: Single pass to count all statuses, avoiding O(4N) complexity
  // and multiple intermediate array allocations.
  const stats = useMemo(() => {
    const counts = tests.reduce(
      (acc, t) => {
        if (t.status === TEST_STATUS.RUNNING) acc.running++;
        else if (t.status === TEST_STATUS.COMPLETED) acc.completed++;
        else if (t.status === TEST_STATUS.DRAFT) acc.draft++;
        else if (t.status === TEST_STATUS.PAUSED) acc.paused++;
        return acc;
      },
      { running: 0, completed: 0, draft: 0, paused: 0 }
    );
    return { total: tests.length, ...counts };
  }, [tests]);

  // Format date
  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Get status badge
  const getStatusBadge = (status) => {
    const config = {
      [TEST_STATUS.DRAFT]: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Draft' },
      [TEST_STATUS.RUNNING]: { bg: 'bg-green-100', text: 'text-green-700', label: 'Running' },
      [TEST_STATUS.COMPLETED]: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Completed' },
      [TEST_STATUS.PAUSED]: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Paused' }
    };
    const c = config[status] || config.draft;
    return (
      <span className={clsx('px-2 py-1 rounded-full text-xs font-medium', c.bg, c.text)}>
        {c.label}
      </span>
    );
  };

  // Toggle test expansion
  const toggleExpand = (testId) => {
    setExpandedTest(expandedTest === testId ? null : testId);
  };

  // Render test card
  const renderTestCard = (test) => {
    const winner = determineWinner(test.results, test.primaryMetric);
    
    return (
      <div 
        key={test.id} 
        className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
      >
        {/* Test Header */}
        <div 
          className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50"
          onClick={() => toggleExpand(test.id)}
        >
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h4 className="text-lg font-semibold text-gray-800 dark:text-white">
                  {test.name}
                </h4>
                {getStatusBadge(test.status)}
              </div>
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
                <span><i className="fas fa-flask mr-1" />{test.testType}</span>
                <span><i className="fas fa-chart-line mr-1" />{test.primaryMetric}</span>
                <span><i className="fas fa-calendar mr-1" />Started: {formatDate(test.startDate)}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {test.status === TEST_STATUS.RUNNING && (
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-sm text-green-600">Active</span>
                </div>
              )}
              {winner?.winner && winner.winner !== 'insufficient_data' && (
                <span className="px-3 py-1 bg-green-100 text-green-700 text-sm rounded-full">
                  <i className="fas fa-trophy mr-1" />
                  Winner: {winner.winner === 'variantA' ? 'A' : 'B'}
                </span>
              )}
              <i className={clsx(
                'fas text-gray-400 transition-transform',
                expandedTest === test.id ? 'fa-chevron-up' : 'fa-chevron-down'
              )} />
            </div>
          </div>
        </div>

        {/* Expanded Details */}
        {expandedTest === test.id && (
          <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-900/50">
            {/* Variants Comparison */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              {['variantA', 'variantB'].map(variant => {
                const data = test.results?.[variant] || {};
                return (
                  <div 
                    key={variant}
                    className={clsx(
                      'p-4 rounded-lg',
                      winner?.winner === variant 
                        ? 'bg-green-50 dark:bg-green-900/20 border-2 border-green-500'
                        : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
                    )}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-gray-800 dark:text-white">{variant === 'variantA' ? 'Variant A' : 'Variant B'}</span>
                      {winner?.winner === variant && (
                        <i className="fas fa-star text-green-500" />
                      )}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                      <p>Impressions: {data.impressions?.toLocaleString() || 0}</p>
                      <p>Engagement: {data.engagement?.toLocaleString() || 0}</p>
                      <p>Eng. Rate: {data.impressions ? ((data.engagement / data.impressions) * 100).toFixed(2) : 0}%</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Statistical Results */}
            {test.results && (
              <div className="mb-4 p-3 bg-white dark:bg-gray-800 rounded-lg">
                <h5 className="font-medium text-gray-800 dark:text-white mb-2">
                  <i className="fas fa-calculator mr-2" />
                  Statistical Analysis
                </h5>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Confidence: </span>
                    <span className={clsx(
                      'font-medium',
                      (winner?.confidence || 0) >= 95 ? 'text-green-600' : 'text-yellow-600'
                    )}>
                      {winner?.confidence?.toFixed(1) || 0}%
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Significant: </span>
                    <span className={clsx(
                      'font-medium',
                      winner?.isSignificant ? 'text-green-600' : 'text-gray-600'
                    )}>
                      {winner?.isSignificant ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Improvement: </span>
                    <span className="font-medium text-green-600">
                      {winner?.improvement ? `+${winner.improvement}%` : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Traffic Split */}
            <div className="mb-4">
              <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Traffic Split</h5>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-4 bg-purple-500 rounded-l" 
                     style={{ width: `${test.trafficSplit?.variantA || 50}%` }} />
                <div className="flex-1 h-4 bg-indigo-500 rounded-r" 
                     style={{ width: `${test.trafficSplit?.variantB || 50}%` }} />
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Variant A: {test.trafficSplit?.variantA || 50}%</span>
                <span>Variant B: {test.trafficSplit?.variantB || 50}%</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={() => onTestSelect && onTestSelect(test)}
                className="px-3 py-1.5 text-sm bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300"
              >
                <i className="fas fa-eye mr-1" />
                View Details
              </button>
              {test.status === TEST_STATUS.RUNNING && (
                <button
                  onClick={() => onTestStatusChange && onTestStatusChange(test.id, TEST_STATUS.PAUSED)}
                  className="px-3 py-1.5 text-sm bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200"
                >
                  <i className="fas fa-pause mr-1" />
                  Pause
                </button>
              )}
              {test.status === TEST_STATUS.PAUSED && (
                <button
                  onClick={() => onTestStatusChange && onTestStatusChange(test.id, TEST_STATUS.RUNNING)}
                  className="px-3 py-1.5 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200"
                >
                  <i className="fas fa-play mr-1" />
                  Resume
                </button>
              )}
              {test.status === TEST_STATUS.RUNNING && (
                <button
                  onClick={() => onTestStatusChange && onTestStatusChange(test.id, TEST_STATUS.COMPLETED)}
                  className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300"
                >
                  <i className="fas fa-flag mr-1" />
                  End Test
                </button>
              )}
              {(test.status === TEST_STATUS.COMPLETED || test.status === TEST_STATUS.DRAFT) && (
                <button
                  onClick={() => {
                    if (window.confirm('Are you sure you want to delete this A/B test?')) {
                      onTestDelete && onTestDelete(test.id);
                    }
                  }}
                  className="px-3 py-1.5 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
                >
                  <i className="fas fa-trash mr-1" />
                  Delete
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
            <i className="fas fa-flask mr-2 text-purple-600" />
            A/B Testing Dashboard
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Create, monitor, and analyze A/B tests
          </p>
        </div>
        
        {showCreateButton && (
          <button
            onClick={onTestCreate}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            <i className="fas fa-plus mr-2" />
            Create Test
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-4 mb-6">
        {[
          { label: 'Total', count: stats.total, color: 'gray' },
          { label: 'Running', count: stats.running, color: 'green' },
          { label: 'Completed', count: stats.completed, color: 'blue' },
          { label: 'Draft', count: stats.draft, color: 'gray' },
          { label: 'Paused', count: stats.paused, color: 'yellow' }
        ].map(item => (
          <div key={item.label} className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <p className="text-2xl font-bold text-gray-800 dark:text-white">{item.count}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{item.label}</p>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-4">
        {['all', TEST_STATUS.RUNNING, TEST_STATUS.COMPLETED, TEST_STATUS.DRAFT].map(status => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={clsx(
              'px-3 py-1.5 text-sm rounded-lg transition-all',
              filter === status
                ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100'
            )}
          >
            {status === 'all' ? 'All Tests' : status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {/* Tests List */}
      <div className="space-y-3">
        {filteredTests.length > 0 ? (
          filteredTests.map(renderTestCard)
        ) : (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <i className="fas fa-flask text-4xl mb-3 opacity-50" />
            <p>No A/B tests found</p>
            <p className="text-sm mt-1">Create a test to start experimenting</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ABTestDashboard;
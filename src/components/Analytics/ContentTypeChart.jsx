import { useMemo } from 'react';
import { Doughnut, Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import clsx from 'clsx';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

// Content type definitions with metadata
const CONTENT_TYPES = {
  image: {
    label: 'Image',
    icon: 'fa-image',
    color: '#3B82F6',
    bgColor: 'bg-blue-500'
  },
  video: {
    label: 'Video',
    icon: 'fa-video',
    color: '#EF4444',
    bgColor: 'bg-red-500'
  },
  carousel: {
    label: 'Carousel',
    icon: 'fa-images',
    color: '#8B5CF6',
    bgColor: 'bg-purple-500'
  },
  text: {
    label: 'Text Only',
    icon: 'fa-align-left',
    color: '#6B7280',
    bgColor: 'bg-gray-500'
  },
  link: {
    label: 'Link',
    icon: 'fa-link',
    color: '#10B981',
    bgColor: 'bg-green-500'
  },
  story: {
    label: 'Story',
    icon: 'fa-story',
    color: '#F59E0B',
    bgColor: 'bg-yellow-500'
  }
};

// Detect content type from post
const detectContentType = (post) => {
  // Check explicit mediaType field first
  if (post.mediaType) return post.mediaType;
  
  // Check video first
  if (post.video || post.media?.some(m => m.type === 'video')) return 'video';
  
  // Check story
  if (post.story || post.isStory) return 'story';
  
  // Check carousel (multiple images/videos)
  if (post.carousel || (post.media?.length > 1)) return 'carousel';
  
  // Check link
  if (post.link || post.url) return 'link';
  
  // Check image
  if (post.image || post.media?.some(m => m.type === 'image')) return 'image';
  
  // Default to text
  return 'text';
};

const ContentTypeChart = ({ 
  posts = [],
  chartType = 'doughnut', // 'doughnut', 'bar', 'pie'
  showMetrics = true,
  onTypeClick
}) => {
  // Calculate metrics by content type
  const typeMetrics = useMemo(() => {
    const metrics = {
      image: { count: 0, likes: 0, comments: 0, shares: 0, views: 0, totalEngagement: 0 },
      video: { count: 0, likes: 0, comments: 0, shares: 0, views: 0, totalEngagement: 0 },
      carousel: { count: 0, likes: 0, comments: 0, shares: 0, views: 0, totalEngagement: 0 },
      text: { count: 0, likes: 0, comments: 0, shares: 0, views: 0, totalEngagement: 0 },
      link: { count: 0, likes: 0, comments: 0, shares: 0, views: 0, totalEngagement: 0 },
      story: { count: 0, likes: 0, comments: 0, shares: 0, views: 0, totalEngagement: 0 }
    };

    posts.forEach(post => {
      const type = detectContentType(post);
      const eng = post.engagement || {};
      
      metrics[type].count++;
      metrics[type].likes += eng.likes || 0;
      metrics[type].comments += eng.comments || 0;
      metrics[type].shares += eng.shares || 0;
      metrics[type].views += eng.views || 0;
      metrics[type].totalEngagement += (eng.likes || 0) + (eng.comments || 0) + (eng.shares || 0);
    });

    // Calculate averages
    Object.keys(metrics).forEach(type => {
      const m = metrics[type];
      m.avgLikes = m.count > 0 ? Math.round(m.likes / m.count) : 0;
      m.avgComments = m.count > 0 ? Math.round(m.comments / m.count) : 0;
      m.avgShares = m.count > 0 ? Math.round(m.shares / m.count) : 0;
      m.avgViews = m.count > 0 ? Math.round(m.views / m.count) : 0;
      m.avgEngagement = m.count > 0 ? Math.round(m.totalEngagement / m.count) : 0;
    });

    return metrics;
  }, [posts]);

  // Filter out zero-count types
  const activeTypes = Object.keys(typeMetrics).filter(type => typeMetrics[type].count > 0);

  // Chart data for distribution
  const distributionData = useMemo(() => ({
    labels: activeTypes.map(type => CONTENT_TYPES[type].label),
    datasets: [{
      data: activeTypes.map(type => typeMetrics[type].count),
      backgroundColor: activeTypes.map(type => CONTENT_TYPES[type].color),
      borderWidth: 0,
      hoverOffset: 10
    }]
  }), [activeTypes, typeMetrics]);

  // Chart data for engagement comparison
  const engagementData = useMemo(() => ({
    labels: activeTypes.map(type => CONTENT_TYPES[type].label),
    datasets: [{
      label: 'Avg Likes',
      data: activeTypes.map(type => typeMetrics[type].avgLikes),
      backgroundColor: 'rgba(239, 68, 68, 0.7)',
      borderRadius: 4
    }, {
      label: 'Avg Comments',
      data: activeTypes.map(type => typeMetrics[type].avgComments),
      backgroundColor: 'rgba(59, 130, 246, 0.7)',
      borderRadius: 4
    }, {
      label: 'Avg Shares',
      data: activeTypes.map(type => typeMetrics[type].avgShares),
      backgroundColor: 'rgba(16, 185, 129, 0.7)',
      borderRadius: 4
    }]
  }), [activeTypes, typeMetrics]);

  // Chart data for total engagement
  const totalEngagementData = useMemo(() => ({
    labels: activeTypes.map(type => CONTENT_TYPES[type].label),
    datasets: [{
      label: 'Total Engagement',
      data: activeTypes.map(type => typeMetrics[type].totalEngagement),
      backgroundColor: activeTypes.map(type => CONTENT_TYPES[type].color),
      borderRadius: 6
    }]
  }), [activeTypes, typeMetrics]);

  // Chart options
  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom'
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        }
      },
      x: {
        grid: {
          display: false
        }
      }
    }
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom'
      }
    },
    cutout: '60%',
    onClick: (event, elements) => {
      if (elements.length > 0 && onTypeClick) {
        const index = elements[0].index;
        onTypeClick(activeTypes[index]);
      }
    }
  };

  // Determine which chart to render
  const renderChart = () => {
    if (chartType === 'bar') {
      return <Bar data={engagementData} options={barOptions} />;
    }
    if (chartType === 'pie') {
      return <Pie data={distributionData} options={doughnutOptions} />;
    }
    return <Doughnut data={distributionData} options={doughnutOptions} />;
  };

  // Find best performing type
  const bestPerformer = useMemo(() => {
    let best = null;
    let maxEngagement = 0;
    
    activeTypes.forEach(type => {
      const avg = typeMetrics[type].avgEngagement;
      if (avg > maxEngagement) {
        maxEngagement = avg;
        best = type;
      }
    });
    
    return best;
  }, [activeTypes, typeMetrics]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
            <i className="fas fa-th-large mr-2 text-indigo-600" />
            Content Type Effectiveness
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Engagement analysis by content format
          </p>
        </div>
        
        {/* Best Performer Badge */}
        {bestPerformer && (
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-sm rounded-full">
              <i className="fas fa-star mr-1" />
              Best: {CONTENT_TYPES[bestPerformer].label}
            </span>
          </div>
        )}
      </div>

      {/* Chart Controls */}
      <div className="flex items-center gap-4 mb-4">
        <span className="text-sm text-gray-600 dark:text-gray-400">Chart:</span>
        <div className="flex gap-2">
          {[
            { value: 'doughnut', label: 'Distribution', icon: 'fa-chart-pie' },
            { value: 'bar', label: 'Comparison', icon: 'fa-chart-bar' },
            { value: 'pie', label: 'Share', icon: 'fa-chart-pie' }
          ].map(option => (
            <button
              key={option.value}
              className={clsx(
                'px-3 py-1 text-sm rounded-lg border transition-all',
                chartType === option.value
                  ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                  : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-gray-300'
              )}
            >
              <i className={`fas ${option.icon} mr-1`} />
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="h-64">
        {renderChart()}
      </div>

      {/* Metrics Table */}
      {showMetrics && activeTypes.length > 0 && (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-2 px-3 text-gray-500 dark:text-gray-400">Type</th>
                <th className="text-right py-2 px-3 text-gray-500 dark:text-gray-400">Posts</th>
                <th className="text-right py-2 px-3 text-gray-500 dark:text-gray-400">Avg Likes</th>
                <th className="text-right py-2 px-3 text-gray-500 dark:text-gray-400">Avg Comments</th>
                <th className="text-right py-2 px-3 text-gray-500 dark:text-gray-400">Avg Shares</th>
                <th className="text-right py-2 px-3 text-gray-500 dark:text-gray-400">Avg Engagement</th>
                <th className="text-right py-2 px-3 text-gray-500 dark:text-gray-400">Total Views</th>
              </tr>
            </thead>
            <tbody>
              {activeTypes.map(type => (
                <tr 
                  key={type} 
                  className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30 cursor-pointer"
                  onClick={() => onTypeClick && onTypeClick(type)}
                >
                  <td className="py-2 px-3">
                    <div className="flex items-center gap-2">
                      <div 
                        className={clsx('w-2 h-2 rounded-full', CONTENT_TYPES[type].bgColor)}
                      />
                      <span className="font-medium text-gray-800 dark:text-white">
                        {CONTENT_TYPES[type].label}
                      </span>
                    </div>
                  </td>
                  <td className="py-2 px-3 text-right text-gray-600 dark:text-gray-300">
                    {typeMetrics[type].count}
                  </td>
                  <td className="py-2 px-3 text-right text-gray-600 dark:text-gray-300">
                    {typeMetrics[type].avgLikes}
                  </td>
                  <td className="py-2 px-3 text-right text-gray-600 dark:text-gray-300">
                    {typeMetrics[type].avgComments}
                  </td>
                  <td className="py-2 px-3 text-right text-gray-600 dark:text-gray-300">
                    {typeMetrics[type].avgShares}
                  </td>
                  <td className="py-2 px-3 text-right">
                    <span className={clsx(
                      'px-2 py-0.5 rounded text-xs font-medium',
                      type === bestPerformer 
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                    )}>
                      {typeMetrics[type].avgEngagement}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-right text-gray-600 dark:text-gray-300">
                    {typeMetrics[type].views.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* No Data State */}
      {activeTypes.length === 0 && (
        <div className="flex items-center justify-center h-48 text-gray-500 dark:text-gray-400">
          <div className="text-center">
            <i className="fas fa-th-large text-4xl mb-3 opacity-50" />
            <p>No content type data available</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContentTypeChart;
import { useState, useMemo } from 'react';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import clsx from 'clsx';
import { PLATFORMS } from '../../config/platforms';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

// Platform colors
const platformColors = {
  instagram: '#E1306C',
  twitter: '#000000',
  facebook: '#1877F2',
  linkedin: '#0077B5',
  tiktok: '#000000',
  dribbble: '#EA4C89'
};

const PlatformPerformanceChart = ({ 
  posts = [],
  sortBy = 'totalEngagement',
  onPlatformSelect
}) => {
  const [selectedPlatforms, setSelectedPlatforms] = useState([]);
  const [viewMode, setViewMode] = useState('table'); // 'table', 'chart', 'timeline'
  const [timeRange, setTimeRange] = useState('30');
  const [metricType, setMetricType] = useState('total'); // 'total', 'average', 'rate'
  const [showDetailedView, setShowDetailedView] = useState(null); // platform ID

  // Calculate platform metrics
  const platformMetrics = useMemo(() => {
    const metrics = {};
    
    posts.forEach(post => {
      const platform = post.platform || 'unknown';
      if (!metrics[platform]) {
        metrics[platform] = {
          platform,
          name: PLATFORMS[platform]?.name || platform.charAt(0).toUpperCase() + platform.slice(1),
          posts: 0,
          totalLikes: 0,
          totalComments: 0,
          totalShares: 0,
          totalViews: 0,
          totalReach: 0,
          totalEngagement: 0,
          completedPosts: 0,
          scheduledPosts: 0,
          postDates: []
        };
      }
      
      const eng = post.engagement || {};
      metrics[platform].posts++;
      metrics[platform].totalLikes += eng.likes || 0;
      metrics[platform].totalComments += eng.comments || 0;
      metrics[platform].totalShares += eng.shares || 0;
      metrics[platform].totalViews += eng.views || 0;
      metrics[platform].totalReach += eng.reach || eng.views || 0;
      metrics[platform].totalEngagement += (eng.likes || 0) + (eng.comments || 0) + (eng.shares || 0);
      
      if (post.completed) metrics[platform].completedPosts++;
      else metrics[platform].scheduledPosts++;
      
      if (post.date) metrics[platform].postDates.push(post.date);
    });

    // Calculate averages and rates
    Object.values(metrics).forEach(m => {
      m.avgLikes = m.posts > 0 ? Math.round(m.totalLikes / m.posts) : 0;
      m.avgComments = m.posts > 0 ? Math.round(m.totalComments / m.posts) : 0;
      m.avgShares = m.posts > 0 ? Math.round(m.totalShares / m.posts) : 0;
      m.avgViews = m.posts > 0 ? Math.round(m.totalViews / m.posts) : 0;
      m.avgEngagement = m.posts > 0 ? Math.round(m.totalEngagement / m.posts) : 0;
      m.engagementRate = m.totalReach > 0 ? ((m.totalEngagement / m.totalReach) * 100).toFixed(2) : 0;
      m.completionRate = m.posts > 0 ? Math.round((m.completedPosts / m.posts) * 100) : 0;
    });

    return Object.values(metrics);
  }, [posts]);

  // Sort platforms
  const sortedPlatforms = useMemo(() => {
    return [...platformMetrics].sort((a, b) => {
      switch (sortBy) {
        case 'totalEngagement':
          return b.totalEngagement - a.totalEngagement;
        case 'posts':
          return b.posts - a.posts;
        case 'avgEngagement':
          return b.avgEngagement - a.avgEngagement;
        case 'engagementRate':
          return parseFloat(b.engagementRate) - parseFloat(a.engagementRate);
        case 'likes':
          return b.totalLikes - a.totalLikes;
        case 'reach':
          return b.totalReach - a.totalReach;
        default:
          return 0;
      }
    });
  }, [platformMetrics, sortBy]);

  // Filter by selected platforms
  const filteredPlatforms = useMemo(() => {
    if (selectedPlatforms.length === 0) return sortedPlatforms;
    return sortedPlatforms.filter(p => selectedPlatforms.includes(p.platform));
  }, [sortedPlatforms, selectedPlatforms]);

  // Chart data
  const barChartData = useMemo(() => ({
    labels: filteredPlatforms.map(p => p.name),
    datasets: [{
      label: metricType === 'total' ? 'Total Engagement' : metricType === 'average' ? 'Avg Engagement' : 'Engagement Rate %',
      data: filteredPlatforms.map(p => 
        metricType === 'total' ? p.totalEngagement : 
        metricType === 'average' ? p.avgEngagement : 
        parseFloat(p.engagementRate)
      ),
      backgroundColor: filteredPlatforms.map(p => platformColors[p.platform] || '#6366f1'),
      borderRadius: 6
    }]
  }), [filteredPlatforms, metricType]);

  const doughnutChartData = useMemo(() => ({
    labels: filteredPlatforms.map(p => p.name),
    datasets: [{
      data: filteredPlatforms.map(p => p.posts),
      backgroundColor: filteredPlatforms.map(p => platformColors[p.platform] || '#6366f1'),
      borderWidth: 0
    }]
  }), [filteredPlatforms]);

  // Timeline data for selected platforms
  const timelineData = useMemo(() => {
    const platforms = selectedPlatforms.length > 0 ? selectedPlatforms : Object.keys(platformColors);
    const now = new Date();
    const days = 30;
    const labels = [];
    const dateStrs = [];
    
    // Pre-calculate date strings and labels
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(now.getDate() - i);
      labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
      dateStrs.push(date.toISOString().split('T')[0]);
    }

    // Pre-calculate engagement data grouped by platform and date using a single O(N) pass
    const engagementMap = {};
    for (const post of posts) {
      if (!post.platform || !post.date) continue;
      if (!engagementMap[post.platform]) {
        engagementMap[post.platform] = {};
      }
      if (!engagementMap[post.platform][post.date]) {
        engagementMap[post.platform][post.date] = 0;
      }
      engagementMap[post.platform][post.date] += (post.engagement?.likes || 0) + (post.engagement?.comments || 0);
    }

    // Bolt Optimization: Pre-group posts by platform and date into a hash map
    // to change O(Platform*TimeRange*Posts) nested loop to O(Posts) + O(Platform*TimeRange)
    const postsByPlatformDate = posts.reduce((acc, post) => {
      if (!post.platform || !post.date) return acc;
      if (!acc[post.platform]) acc[post.platform] = {};
      if (!acc[post.platform][post.date]) acc[post.platform][post.date] = [];
      acc[post.platform][post.date].push(post);
      return acc;
    }, {});

    const datasets = platforms.map(platformId => {
      const data = labels.map((_, idx) => {
        const date = new Date(now);
        date.setDate(now.getDate() - (days - 1 - idx));
        const dateStr = date.toISOString().split('T')[0];
        const dayPosts = (postsByPlatformDate[platformId] && postsByPlatformDate[platformId][dateStr]) || [];
        return dayPosts.reduce((sum, p) => sum + ((p.engagement?.likes || 0) + (p.engagement?.comments || 0)), 0);
      });

      return {
        label: PLATFORMS[platformId]?.name || platformId,
        data,
        borderColor: platformColors[platformId] || '#6366f1',
        backgroundColor: 'transparent',
        tension: 0.4
      };
    });

    return { labels, datasets };
  }, [posts, selectedPlatforms]);

  // Calculate winner metrics
  const winnerMetrics = useMemo(() => {
    if (platformMetrics.length === 0) return null;
    
    return {
      bestPerforming: sortedPlatforms[0]?.name || 'N/A',
      highestReach: [...platformMetrics].sort((a, b) => b.totalReach - a.totalReach)[0]?.name || 'N/A',
      highestEngagementRate: [...platformMetrics].sort((a, b) => parseFloat(b.engagementRate) - parseFloat(a.engagementRate))[0]?.name || 'N/A',
      mostPosts: [...platformMetrics].sort((a, b) => b.posts - a.posts)[0]?.name || 'N/A'
    };
  }, [platformMetrics, sortedPlatforms]);

  const chartOptions = {
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
    cutout: '60%'
  };

  // Toggle platform selection
  const togglePlatform = (platformId) => {
    setSelectedPlatforms(prev => 
      prev.includes(platformId)
        ? prev.filter(p => p !== platformId)
        : [...prev, platformId]
    );
  };

  // Render detailed view for a platform
  const renderDetailedView = (platform) => (
    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 mt-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold text-gray-800 dark:text-white">{platform.name} Details</h4>
        <button
          onClick={() => setShowDetailedView(null)}
          className="text-gray-500 hover:text-gray-700"
        >
          <i className="fas fa-times" />
        </button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg">
          <p className="text-xs text-gray-500 dark:text-gray-400">Total Posts</p>
          <p className="text-xl font-bold text-gray-800 dark:text-white">{platform.posts}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg">
          <p className="text-xs text-gray-500 dark:text-gray-400">Avg Likes</p>
          <p className="text-xl font-bold text-gray-800 dark:text-white">{platform.avgLikes}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg">
          <p className="text-xs text-gray-500 dark:text-gray-400">Avg Comments</p>
          <p className="text-xl font-bold text-gray-800 dark:text-white">{platform.avgComments}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg">
          <p className="text-xs text-gray-500 dark:text-gray-400">Engagement Rate</p>
          <p className="text-xl font-bold text-gray-800 dark:text-white">{platform.engagementRate}%</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
            <i className="fas fa-chart-bar mr-2 text-indigo-600" />
            Platform Performance Comparison
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Side-by-side analysis across all social platforms
          </p>
        </div>
        
        {/* Winner Badges */}
        {winnerMetrics && (
          <div className="flex items-center gap-2">
            <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs rounded">
              <i className="fas fa-trophy mr-1" />
              Top: {winnerMetrics.bestPerforming}
            </span>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-4 mb-4">
        {/* Platform Selector */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">Platforms:</span>
          <div className="flex flex-wrap gap-1">
            {Object.entries(PLATFORMS).map(([id, config]) => (
              <button
                key={id}
                onClick={() => togglePlatform(id)}
                className={clsx(
                  'px-2 py-1 text-xs rounded border transition-all',
                  selectedPlatforms.length === 0 || selectedPlatforms.includes(id)
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                    : 'border-gray-200 dark:border-gray-600 text-gray-400'
                )}
              >
                {config.name}
              </button>
            ))}
          </div>
        </div>

        {/* Sort */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">Sort by:</span>
          <select
            value={sortBy}
            onChange={() => {}}
            className="text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700 dark:text-white"
          >
            <option value="totalEngagement">Total Engagement</option>
            <option value="posts">Post Count</option>
            <option value="avgEngagement">Avg Engagement</option>
            <option value="engagementRate">Engagement Rate</option>
            <option value="likes">Total Likes</option>
            <option value="reach">Reach</option>
          </select>
        </div>

        {/* Metric Type */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">Show:</span>
          <select
            value={metricType}
            onChange={() => {}}
            className="text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700 dark:text-white"
          >
            <option value="total">Total</option>
            <option value="average">Average</option>
            <option value="rate">Rate %</option>
          </select>
        </div>

        {/* View Mode */}
        <div className="ml-auto flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
          {['table', 'chart', 'timeline'].map(mode => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={clsx(
                'px-3 py-1 text-sm rounded-md capitalize',
                viewMode === mode ? 'bg-white dark:bg-gray-600 shadow' : ''
              )}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {/* Table View */}
      {viewMode === 'table' && (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Platform</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Posts</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Likes</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Comments</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Shares</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Views</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Avg Engagement</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Eng. Rate</th>
              </tr>
            </thead>
            <tbody>
              {filteredPlatforms.length > 0 ? filteredPlatforms.map((platform, idx) => (
                <tr 
                  key={platform.platform} 
                  className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30 cursor-pointer"
                  onClick={() => setShowDetailedView(platform.platform)}
                >
                  <td className="py-3 px-4">
                    <div className="flex items-center">
                      <div 
                        className="w-3 h-3 rounded-full mr-2" 
                        style={{ backgroundColor: platformColors[platform.platform] }}
                      />
                      <span className="font-medium text-gray-800 dark:text-white">{platform.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right text-gray-600 dark:text-gray-300">{platform.posts}</td>
                  <td className="py-3 px-4 text-right text-gray-600 dark:text-gray-300">{platform.totalLikes.toLocaleString()}</td>
                  <td className="py-3 px-4 text-right text-gray-600 dark:text-gray-300">{platform.totalComments.toLocaleString()}</td>
                  <td className="py-3 px-4 text-right text-gray-600 dark:text-gray-300">{platform.totalShares.toLocaleString()}</td>
                  <td className="py-3 px-4 text-right text-gray-600 dark:text-gray-300">{platform.totalViews.toLocaleString()}</td>
                  <td className="py-3 px-4 text-right">
                    <span className={clsx(
                      'px-2 py-1 rounded text-xs font-medium',
                      platform.avgEngagement > 50 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                      platform.avgEngagement > 20 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                      'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                    )}>
                      {platform.avgEngagement}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span className="text-gray-600 dark:text-gray-300">{platform.engagementRate}%</span>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-gray-500 dark:text-gray-400">
                    No platform data available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Chart View */}
      {viewMode === 'chart' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-64">
            <Bar data={barChartData} options={chartOptions} />
          </div>
          <div className="h-64">
            <Doughnut data={doughnutChartData} options={doughnutOptions} />
          </div>
        </div>
      )}

      {/* Timeline View */}
      {viewMode === 'timeline' && (
        <div className="h-80">
          <Line data={timelineData} options={chartOptions} />
        </div>
      )}

      {/* Detailed View */}
      {showDetailedView && renderDetailedView(filteredPlatforms.find(p => p.platform === showDetailedView))}

      {/* No Data State */}
      {platformMetrics.length === 0 && (
        <div className="flex items-center justify-center h-48 text-gray-500 dark:text-gray-400">
          <div className="text-center">
            <i className="fas fa-chart-pie text-4xl mb-3 opacity-50" />
            <p>No platform data available</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlatformPerformanceChart;
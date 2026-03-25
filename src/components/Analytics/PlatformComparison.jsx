import { useState, useMemo } from 'react';
import { Bar, Line, Radar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import clsx from 'clsx';
import { PLATFORMS, PLATFORM_LIST } from '../../config/platforms';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  RadialLinearScale,
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

const PlatformComparison = ({ 
  posts = [],
  selectedPlatforms = [],
  onPlatformSelect,
  showDetails = true
}) => {
  const [viewMode, setViewMode] = useState('table'); // 'table', 'chart', 'radar'
  const [metricView, setMetricView] = useState('engagement'); // 'engagement', 'reach', 'growth'
  const [timeRange, setTimeRange] = useState(30);
  const [expandedPlatform, setExpandedPlatform] = useState(null);

  // Calculate comprehensive metrics for each platform
  const platformMetrics = useMemo(() => {
    const metrics = {};
    
    posts.forEach(post => {
      const platform = post.platform || 'unknown';
      if (!metrics[platform]) {
        metrics[platform] = {
          platform,
          name: PLATFORMS[platform]?.name || platform,
          posts: 0,
          likes: 0,
          comments: 0,
          shares: 0,
          views: 0,
          reach: 0,
          engagement: 0,
          completed: 0,
          scheduled: 0,
          growth: 0,
          avgEngagementRate: 0,
          avgLikes: 0,
          avgComments: 0,
          avgShares: 0,
          avgViews: 0,
          bestPost: null,
          worstPost: null
        };
      }
      
      const eng = post.engagement || {};
      metrics[platform].posts++;
      metrics[platform].likes += eng.likes || 0;
      metrics[platform].comments += eng.comments || 0;
      metrics[platform].shares += eng.shares || 0;
      metrics[platform].views += eng.views || 0;
      metrics[platform].reach += eng.reach || eng.views || 0;
      metrics[platform].engagement += (eng.likes || 0) + (eng.comments || 0) + (eng.shares || 0);
      
      if (post.completed) metrics[platform].completed++;
      else metrics[platform].scheduled++;
    });

    // Calculate averages and rates
    Object.values(metrics).forEach(m => {
      if (m.posts > 0) {
        m.avgLikes = Math.round(m.likes / m.posts);
        m.avgComments = Math.round(m.comments / m.posts);
        m.avgShares = Math.round(m.shares / m.posts);
        m.avgViews = Math.round(m.views / m.posts);
        m.avgEngagementRate = ((m.engagement / m.reach) * 100).toFixed(2);
        m.growth = Math.round(((m.likes + m.comments + m.shares) / m.posts) * 10);
      }
    });

    return Object.values(metrics);
  }, [posts]);

  // Filter by selected platforms
  const filteredMetrics = useMemo(() => {
    if (selectedPlatforms.length === 0) return platformMetrics;
    return platformMetrics.filter(p => selectedPlatforms.includes(p.platform));
  }, [platformMetrics, selectedPlatforms]);

  // Determine winner metrics
  const winnerMetrics = useMemo(() => {
    if (filteredMetrics.length === 0) return {};
    
    const sorted = [...filteredMetrics];
    return {
      mostPosts: sorted.sort((a, b) => b.posts - a.posts)[0]?.platform,
      highestEngagement: sorted.sort((a, b) => b.engagement - a.engagement)[0]?.platform,
      highestReach: sorted.sort((a, b) => b.reach - a.reach)[0]?.platform,
      bestEngagementRate: sorted.sort((a, b) => parseFloat(b.avgEngagementRate) - parseFloat(a.avgEngagementRate))[0]?.platform,
      bestGrowth: sorted.sort((a, b) => b.growth - a.growth)[0]?.platform
    };
  }, [filteredMetrics]);

  // Chart data - Bar comparison
  const barChartData = useMemo(() => ({
    labels: filteredMetrics.map(p => p.name),
    datasets: [
      {
        label: 'Total Engagement',
        data: filteredMetrics.map(p => p.engagement),
        backgroundColor: 'rgba(139, 92, 246, 0.7)',
        borderRadius: 4
      },
      {
        label: 'Total Reach',
        data: filteredMetrics.map(p => p.reach),
        backgroundColor: 'rgba(59, 130, 246, 0.7)',
        borderRadius: 4
      }
    ]
  }), [filteredMetrics]);

  // Chart data - Radar comparison
  const radarData = useMemo(() => ({
    labels: ['Posts', 'Engagement', 'Reach', 'Avg Likes', 'Avg Comments', 'Growth'],
    datasets: filteredMetrics.map(p => ({
      label: p.name,
      data: [
        Math.min(100, (p.posts / Math.max(...filteredMetrics.map(m => m.posts))) * 100),
        Math.min(100, (p.engagement / Math.max(...filteredMetrics.map(m => m.engagement))) * 100),
        Math.min(100, (p.reach / Math.max(...filteredMetrics.map(m => m.reach))) * 100),
        Math.min(100, (p.avgLikes / Math.max(...filteredMetrics.map(m => m.avgLikes))) * 100),
        Math.min(100, (p.avgComments / Math.max(...filteredMetrics.map(m => m.avgComments))) * 100),
        Math.min(100, (p.growth / Math.max(...filteredMetrics.map(m => m.growth))) * 100)
      ],
      backgroundColor: `${platformColors[p.platform]}40`,
      borderColor: platformColors[p.platform],
      borderWidth: 2,
      pointBackgroundColor: platformColors[p.platform]
    }))
  }), [filteredMetrics]);

  // Chart options
  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom' }
    },
    scales: {
      y: { beginAtZero: true },
      x: { grid: { display: false } }
    }
  };

  const radarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom' }
    },
    scales: {
      r: {
        beginAtZero: true,
        max: 100
      }
    }
  };

  // Toggle platform selection
  const togglePlatform = (platformId) => {
    if (onPlatformSelect) {
      onPlatformSelect(platformId);
    }
  };

  // Render platform details
  const renderPlatformDetails = (platform) => {
    const postsByPlatform = posts.filter(p => p.platform === platform.platform);
    const sortedByEngagement = [...postsByPlatform].sort((a, b) => 
      ((b.engagement?.likes || 0) + (b.engagement?.comments || 0)) - 
      ((a.engagement?.likes || 0) + (a.engagement?.comments || 0))
    );
    
    const bestPost = sortedByEngagement[0];
    const worstPost = sortedByEngagement[sortedByEngagement.length - 1];

    return (
      <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
        <h5 className="font-medium text-gray-800 dark:text-white mb-3">
          Top Performing Posts on {platform.name}
        </h5>
        <div className="space-y-2">
          {sortedByEngagement.slice(0, 3).map((post, idx) => (
            <div key={post.id || idx} className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400 truncate max-w-xs">
                {post.title || post.content?.slice(0, 40) || 'Untitled'}
              </span>
              <span className="text-gray-500">
                {(post.engagement?.likes || 0) + (post.engagement?.comments || 0)} engagement
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
            <i className="fas fa-balance-scale mr-2 text-indigo-600" />
            Platform Comparison
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Side-by-side performance analysis across platforms
          </p>
        </div>
        
        {/* Winner Badges */}
        <div className="flex gap-2">
          {Object.entries(winnerMetrics).slice(0, 2).map(([key, platformId]) => (
            <span 
              key={key}
              className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs rounded"
            >
              {key.replace(/([A-Z])/g, ' $1').trim()}: {PLATFORMS[platformId]?.name || platformId}
            </span>
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-4 mb-4">
        {/* Platform Selector */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">Platforms:</span>
          <div className="flex flex-wrap gap-1">
            {PLATFORM_LIST.map(platform => (
              <button
                key={platform.id}
                onClick={() => togglePlatform(platform.id)}
                className={clsx(
                  'px-2 py-1 text-xs rounded border transition-all',
                  selectedPlatforms.length === 0 || selectedPlatforms.includes(platform.id)
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                    : 'border-gray-200 dark:border-gray-600 text-gray-400'
                )}
              >
                {platform.name}
              </button>
            ))}
          </div>
        </div>

        {/* View Mode */}
        <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
          {[
            { value: 'table', icon: 'fa-table' },
            { value: 'chart', icon: 'fa-chart-bar' },
            { value: 'radar', icon: 'fa-bullseye' }
          ].map(mode => (
            <button
              key={mode.value}
              onClick={() => setViewMode(mode.value)}
              className={clsx(
                'px-3 py-1 text-sm rounded-md',
                viewMode === mode.value ? 'bg-white dark:bg-gray-600 shadow' : ''
              )}
            >
              <i className={`fas ${mode.icon}`} />
            </button>
          ))}
        </div>

        {/* Time Range */}
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(parseInt(e.target.value))}
          className="text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700 dark:text-white"
        >
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
        </select>
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
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Views/Reach</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Eng. Rate</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Avg Eng</th>
              </tr>
            </thead>
            <tbody>
              {filteredMetrics.length > 0 ? filteredMetrics.map((platform, idx) => (
                <tr key={platform.platform}>
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
                  <td className="py-3 px-4 text-right text-gray-600 dark:text-gray-300">{platform.likes.toLocaleString()}</td>
                  <td className="py-3 px-4 text-right text-gray-600 dark:text-gray-300">{platform.comments.toLocaleString()}</td>
                  <td className="py-3 px-4 text-right text-gray-600 dark:text-gray-300">{platform.shares.toLocaleString()}</td>
                  <td className="py-3 px-4 text-right text-gray-600 dark:text-gray-300">{platform.reach.toLocaleString()}</td>
                  <td className="py-3 px-4 text-right">
                    <span className={clsx(
                      'px-2 py-1 rounded text-xs font-medium',
                      parseFloat(platform.avgEngagementRate) > 5 ? 'bg-green-100 text-green-700' :
                      parseFloat(platform.avgEngagementRate) > 2 ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-700'
                    )}>
                      {platform.avgEngagementRate}%
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right text-gray-600 dark:text-gray-300">
                    {Math.round((platform.likes + platform.comments + platform.shares) / platform.posts)}
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
        <div className="h-80">
          <Bar data={barChartData} options={barOptions} />
        </div>
      )}

      {/* Radar View */}
      {viewMode === 'radar' && (
        <div className="h-80">
          <Radar data={radarData} options={radarOptions} />
        </div>
      )}

      {/* Platform Details */}
      {showDetails && expandedPlatform && (
        renderPlatformDetails(filteredMetrics.find(p => p.platform === expandedPlatform))
      )}

      {/* No Data */}
      {filteredMetrics.length === 0 && (
        <div className="flex items-center justify-center h-48 text-gray-500 dark:text-gray-400">
          <div className="text-center">
            <i className="fas fa-balance-scale text-4xl mb-3 opacity-50" />
            <p>No comparison data available</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlatformComparison;
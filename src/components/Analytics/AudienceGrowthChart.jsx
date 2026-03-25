import { useState, useMemo } from 'react';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import clsx from 'clsx';
import { PLATFORMS } from '../../config/platforms';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Platform colors for follower tracking
const platformColors = {
  instagram: '#E1306C',
  twitter: '#000000',
  facebook: '#1877F2',
  linkedin: '#0077B5',
  tiktok: '#000000',
  dribbble: '#EA4C89'
};

const AudienceGrowthChart = ({ 
  posts = [],
  timeRange = 90,
  showPlatformBreakdown = true,
  onTimeRangeChange
}) => {
  const [selectedPlatforms, setSelectedPlatforms] = useState([]);
  const [viewMode, setViewMode] = useState('line'); // 'line', 'bar', 'compare'
  const [metricType, setMetricType] = useState('followers'); // 'followers', 'engagement', 'reach'

  // Simulated follower data (in a real app, this would come from platform APIs)
  // Generate mock historical follower data
  const generateFollowerData = useMemo(() => {
    const now = new Date();
    const data = {};
    
    // Initialize platforms
    const platforms = Object.keys(PLATFORMS);
    platforms.forEach(platform => {
      data[platform] = [];
      
      // Generate 90 days of mock follower data
      // Start with some base followers and grow over time
      let baseFollowers = {
        instagram: 5000,
        twitter: 3000,
        facebook: 8000,
        linkedin: 2000,
        tiktok: 1000,
        dribbble: 1500
      }[platform] || 1000;
      
      for (let i = timeRange; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(now.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        // Add some random growth with trend
        const randomGrowth = Math.floor(Math.random() * 20) - 5; // -5 to +15
        const trendGrowth = Math.floor((timeRange - i) / 10); // Slight upward trend
        baseFollowers += randomGrowth + trendGrowth;
        
        // Add posts engagement to calculate growth
        const dayPosts = posts.filter(p => p.platform === platform && p.date === dateStr);
        const dayEngagement = dayPosts.reduce((sum, p) => 
          sum + ((p.engagement?.likes || 0) * 0.1) + ((p.engagement?.comments || 0) * 0.5), 0);
        
        data[platform].push({
          date: dateStr,
          displayDate: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          followers: Math.max(0, baseFollowers + Math.floor(dayEngagement)),
          following: Math.floor(baseFollowers * 0.1),
          posts: dayPosts.length,
          engagement: dayPosts.reduce((sum, p) => 
            sum + (p.engagement?.likes || 0) + (p.engagement?.comments || 0), 0)
        });
      }
    });
    
    return data;
  }, [posts, timeRange]);

  // Calculate growth stats
  const growthStats = useMemo(() => {
    const stats = {};
    
    Object.keys(PLATFORMS).forEach(platform => {
      const data = generateFollowerData[platform];
      if (!data || data.length < 2) return;
      
      const start = data[0].followers;
      const end = data[data.length - 1].followers;
      const growth = end - start;
      const growthRate = start > 0 ? ((growth / start) * 100).toFixed(1) : 0;
      
      // Calculate daily average
      const dailyAvg = (growth / timeRange).toFixed(1);
      
      // Find best day
      const bestDay = [...data].sort((a, b) => b.engagement - a.engagement)[0];
      
      stats[platform] = {
        startFollowers: start,
        endFollowers: end,
        growth,
        growthRate,
        dailyAvg,
        bestDay: bestDay?.displayDate || 'N/A',
        bestDayEngagement: bestDay?.engagement || 0
      };
    });
    
    return stats;
  }, [generateFollowerData, timeRange]);

  // Filter platforms for chart
  const displayedPlatforms = useMemo(() => {
    if (selectedPlatforms.length === 0) return Object.keys(PLATFORMS);
    return selectedPlatforms;
  }, [selectedPlatforms]);

  // Chart data - Line chart
  const lineChartData = useMemo(() => ({
    labels: generateFollowerData[displayedPlatforms[0]]?.map(d => d.displayDate) || [],
    datasets: displayedPlatforms.map(platform => ({
      label: PLATFORMS[platform]?.name || platform,
      data: generateFollowerData[platform]?.map(d => d.followers) || [],
      borderColor: platformColors[platform] || '#6366f1',
      backgroundColor: `${platformColors[platform] || '#6366f1'}20`,
      fill: true,
      tension: 0.4,
      pointRadius: 0,
      pointHoverRadius: 4
    }))
  }), [generateFollowerData, displayedPlatforms]);

  // Chart data - Bar chart (daily growth)
  const barChartData = useMemo(() => {
    const data = generateFollowerData[displayedPlatforms[0]] || [];
    return {
      labels: data.map(d => d.displayDate),
      datasets: [{
        label: 'New Followers',
        data: data.map((d, i) => i === 0 ? 0 : Math.max(0, d.followers - data[i-1].followers)),
        backgroundColor: 'rgba(79, 70, 229, 0.7)',
        borderRadius: 4
      }]
    };
  }, [generateFollowerData, displayedPlatforms]);

  // Comparison data
  const comparisonData = useMemo(() => ({
    labels: displayedPlatforms.map(p => PLATFORMS[p]?.name || p),
    datasets: [{
      label: 'Follower Growth',
      data: displayedPlatforms.map(p => parseFloat(growthStats[p]?.growthRate || 0)),
      backgroundColor: displayedPlatforms.map(p => platformColors[p] || '#6366f1'),
      borderRadius: 6
    }]
  }), [displayedPlatforms, growthStats]);

  // Find best performing platform
  const bestPerformingPlatform = useMemo(() => {
    let best = null;
    let maxRate = -Infinity;
    
    Object.entries(growthStats).forEach(([platform, stats]) => {
      if (parseFloat(stats.growthRate) > maxRate) {
        maxRate = parseFloat(stats.growthRate);
        best = platform;
      }
    });
    
    return best;
  }, [growthStats]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom'
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        padding: 12,
        cornerRadius: 8,
        callbacks: {
          label: (context) => `${context.dataset.label}: ${context.parsed.y.toLocaleString()} followers`
        }
      }
    },
    scales: {
      y: {
        beginAtZero: false,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        },
        ticks: {
          callback: (value) => value.toLocaleString()
        }
      },
      x: {
        grid: {
          display: false
        },
        ticks: {
          maxTicksLimit: 15
        }
      }
    }
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
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

  // Toggle platform selection
  const togglePlatform = (platformId) => {
    setSelectedPlatforms(prev => 
      prev.includes(platformId)
        ? prev.filter(p => p !== platformId)
        : [...prev, platformId]
    );
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
            <i className="fas fa-users mr-2 text-indigo-600" />
            Audience Growth
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Track follower trends and audience growth over time
          </p>
        </div>
        
        {/* Best Performer */}
        {bestPerformingPlatform && (
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-sm rounded-full">
              <i className="fas fa-arrow-trend-up mr-1" />
              {PLATFORMS[bestPerformingPlatform]?.name}: +{growthStats[bestPerformingPlatform]?.growthRate}%
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

        {/* Time Range */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">Period:</span>
          <select
            value={timeRange}
            onChange={(e) => onTimeRangeChange && onTimeRangeChange(parseInt(e.target.value))}
            className="text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700 dark:text-white"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="365">Last year</option>
          </select>
        </div>

        {/* View Mode */}
        <div className="ml-auto flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
          {[
            { value: 'line', icon: 'fa-chart-line', label: 'Growth' },
            { value: 'bar', icon: 'fa-chart-bar', label: 'Daily' },
            { value: 'compare', icon: 'fa-balance-scale', label: 'Compare' }
          ].map(mode => (
            <button
              key={mode.value}
              onClick={() => setViewMode(mode.value)}
              className={clsx(
                'px-3 py-1 text-sm rounded-md flex items-center gap-1',
                viewMode === mode.value ? 'bg-white dark:bg-gray-600 shadow' : 'text-gray-600 dark:text-gray-300'
              )}
            >
              <i className={`fas ${mode.icon} text-xs`} />
              {mode.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="h-80">
        {viewMode === 'line' && <Line data={lineChartData} options={chartOptions} />}
        {viewMode === 'bar' && <Bar data={barChartData} options={barOptions} />}
        {viewMode === 'compare' && <Bar data={comparisonData} options={barOptions} />}
      </div>

      {/* Growth Stats Table */}
      {showPlatformBreakdown && (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 px-4 text-gray-500 dark:text-gray-400">Platform</th>
                <th className="text-right py-3 px-4 text-gray-500 dark:text-gray-400">Start</th>
                <th className="text-right py-3 px-4 text-gray-500 dark:text-gray-400">Current</th>
                <th className="text-right py-3 px-4 text-gray-500 dark:text-gray-400">Growth</th>
                <th className="text-right py-3 px-4 text-gray-500 dark:text-gray-400">Rate</th>
                <th className="text-right py-3 px-4 text-gray-500 dark:text-gray-400">Daily Avg</th>
                <th className="text-right py-3 px-4 text-gray-500 dark:text-gray-400">Best Day</th>
              </tr>
            </thead>
            <tbody>
              {displayedPlatforms.map(platform => {
                const stats = growthStats[platform];
                if (!stats) return null;
                
                return (
                  <tr key={platform} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30">
                    <td className="py-3 px-4">
                      <div className="flex items-center">
                        <div 
                          className="w-3 h-3 rounded-full mr-2" 
                          style={{ backgroundColor: platformColors[platform] }}
                        />
                        <span className="font-medium text-gray-800 dark:text-white">
                          {PLATFORMS[platform]?.name || platform}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right text-gray-600 dark:text-gray-300">
                      {stats.startFollowers.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right text-gray-600 dark:text-gray-300">
                      {stats.endFollowers.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className={clsx(
                        'px-2 py-0.5 rounded text-xs font-medium',
                        stats.growth > 0 
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      )}>
                        {stats.growth > 0 ? '+' : ''}{stats.growth.toLocaleString()}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className={clsx(
                        'px-2 py-0.5 rounded text-xs font-medium',
                        parseFloat(stats.growthRate) > 0 
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                      )}>
                        {stats.growthRate}%
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right text-gray-600 dark:text-gray-300">
                      {stats.dailyAvg}
                    </td>
                    <td className="py-3 px-4 text-right text-gray-600 dark:text-gray-300">
                      {stats.bestDay}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* No Data State */}
      {Object.keys(growthStats).length === 0 && (
        <div className="flex items-center justify-center h-48 text-gray-500 dark:text-gray-400">
          <div className="text-center">
            <i className="fas fa-users text-4xl mb-3 opacity-50" />
            <p>No audience data available</p>
            <p className="text-sm mt-1">Connect social accounts to track follower growth</p>
          </div>
        </div>
      )}

      {/* Disclaimer */}
      <p className="text-xs text-gray-400 dark:text-gray-500 mt-4 text-center">
        <i className="fas fa-info-circle mr-1" />
        Follower data is simulated for demonstration. Connect platform APIs for real-time metrics.
      </p>
    </div>
  );
};

export default AudienceGrowthChart;
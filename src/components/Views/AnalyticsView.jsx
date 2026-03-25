import { useMemo, useState } from 'react';
import { Line, Bar, Doughnut, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { exportToCSV } from '../../services/firebase';
import clsx from 'clsx';
import { PLATFORMS } from '../../config/platforms';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const AnalyticsView = ({ posts }) => {
  const [dateRange, setDateRange] = useState('30'); // days
  const [showExportMenu, setShowExportMenu] = useState(false);

  // Filter posts by date range
  const filteredPosts = useMemo(() => {
    if (!posts.length) return [];
    const now = new Date();
    const cutoff = new Date(now.setDate(now.getDate() - parseInt(dateRange)));
    return posts.filter(p => new Date(p.date) >= cutoff);
  }, [posts, dateRange]);

  // Calculate analytics data
  const analytics = useMemo(() => {
    const totalPosts = filteredPosts.length;
    const completedPosts = filteredPosts.filter(p => p.completed).length;
    const scheduledPosts = filteredPosts.filter(p => !p.completed).length;
    
    // Posts by platform
    const byPlatform = filteredPosts.reduce((acc, post) => {
      acc[post.platform] = (acc[post.platform] || 0) + 1;
      return acc;
    }, {});
    
    // Posts by month
    const byMonth = {};
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = date.toLocaleString('default', { month: 'short' });
      byMonth[key] = 0;
    }
    
    // Engagement stats
    let totalEngagement = { likes: 0, comments: 0, shares: 0, views: 0 };
    
    filteredPosts.forEach(post => {
      const date = new Date(post.date);
      const key = date.toLocaleString('default', { month: 'short' });
      if (byMonth[key] !== undefined) {
        byMonth[key]++;
      }
      
      // Add engagement data if available
      if (post.engagement) {
        totalEngagement.likes += post.engagement.likes || 0;
        totalEngagement.comments += post.engagement.comments || 0;
        totalEngagement.shares += post.engagement.shares || 0;
        totalEngagement.views += post.engagement.views || 0;
      }
    });
    
    // Status breakdown
    const byStatus = filteredPosts.reduce((acc, post) => {
      const status = post.status || (post.completed ? 'published' : 'draft');
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});
    
    return {
      totalPosts,
      completedPosts,
      scheduledPosts,
      byPlatform,
      byMonth,
      byStatus,
      totalEngagement,
      completionRate: totalPosts > 0 ? Math.round((completedPosts / totalPosts) * 100) : 0
    };
  }, [filteredPosts]);

  // Platform distribution chart
  const platformColors = {
    instagram: '#E1306C',
    twitter: '#000000',
    facebook: '#1877F2',
    linkedin: '#0077B5',
    tiktok: '#000000',
    dribbble: '#EA4C89'
  };

  const platformChartData = {
    labels: Object.keys(analytics.byPlatform).map(p => PLATFORMS[p]?.name || p.charAt(0).toUpperCase() + p.slice(1)),
    datasets: [{
      data: Object.values(analytics.byPlatform),
      backgroundColor: Object.keys(analytics.byPlatform).map(p => platformColors[p] || '#6366f1'),
      borderWidth: 0
    }]
  };

  // Posts over time chart
  const timelineChartData = {
    labels: Object.keys(analytics.byMonth),
    datasets: [{
      label: 'Posts',
      data: Object.values(analytics.byMonth),
      fill: true,
      backgroundColor: 'rgba(79, 70, 229, 0.1)',
      borderColor: 'rgba(79, 70, 229, 1)',
      borderWidth: 2,
      tension: 0.4
    }]
  };

  // Engagement chart
  const engagementChartData = {
    labels: ['Likes', 'Comments', 'Shares', 'Views'],
    datasets: [{
      label: 'Engagement',
      data: [
        analytics.totalEngagement.likes,
        analytics.totalEngagement.comments,
        analytics.totalEngagement.shares,
        analytics.totalEngagement.views
      ],
      backgroundColor: [
        'rgba(239, 68, 68, 0.7)',
        'rgba(59, 130, 246, 0.7)',
        'rgba(16, 185, 129, 0.7)',
        'rgba(245, 158, 11, 0.7)'
      ],
      borderRadius: 4
    }]
  };

  // Status breakdown chart
  const statusChartData = {
    labels: Object.keys(analytics.byStatus).map(s => s.charAt(0).toUpperCase() + s.slice(1)),
    datasets: [{
      data: Object.values(analytics.byStatus),
      backgroundColor: [
        'rgba(16, 185, 129, 0.7)',
        'rgba(245, 158, 11, 0.7)',
        'rgba(107, 114, 128, 0.7)',
        'rgba(139, 92, 246, 0.7)'
      ],
      borderWidth: 0
    }]
  };

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

  // Export functions
  const handleExportCSV = () => {
    exportToCSV(filteredPosts, `analytics_export_${new Date().toISOString().split('T')[0]}.csv`);
    setShowExportMenu(false);
  };

  const handleExportPDF = () => {
    // In production, this would generate a proper PDF
    alert('PDF export would be available with a PDF generation library');
    setShowExportMenu(false);
  };

  const handleExportJSON = () => {
    const jsonData = JSON.stringify(filteredPosts, null, 2);
    const blob = new Blob([jsonData], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `analytics_export_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    setShowExportMenu(false);
  };

  // Get top performing posts
  const topPosts = useMemo(() => {
    return [...filteredPosts]
      .sort((a, b) => {
        const aEng = a.engagement?.likes || 0 + a.engagement?.comments || 0;
        const bEng = b.engagement?.likes || 0 + b.engagement?.comments || 0;
        return bEng - aEng;
      })
      .slice(0, 5);
  }, [filteredPosts]);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
            Analytics Dashboard
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Track your social media performance
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* Date Range Selector */}
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="365">Last year</option>
          </select>
          
          {/* Export Button */}
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="btn-primary flex items-center"
            >
              <i className="fas fa-download mr-2" />
              Export
            </button>
            
            {showExportMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-10">
                <button
                  onClick={handleExportCSV}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                >
                  <i className="fas fa-file-csv mr-2" />
                  Export as CSV
                </button>
                <button
                  onClick={handleExportPDF}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                >
                  <i className="fas fa-file-pdf mr-2" />
                  Export as PDF
                </button>
                <button
                  onClick={handleExportJSON}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                >
                  <i className="fas fa-code mr-2" />
                  Export as JSON
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Posts</p>
              <p className="text-3xl font-bold text-gray-800 dark:text-white">{analytics.totalPosts}</p>
            </div>
            <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center">
              <i className="fas fa-calendar-check text-indigo-600 dark:text-indigo-400 text-xl" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Published</p>
              <p className="text-3xl font-bold text-green-600">{analytics.completedPosts}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
              <i className="fas fa-check-circle text-green-600 text-xl" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Scheduled</p>
              <p className="text-3xl font-bold text-yellow-600">{analytics.scheduledPosts}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center">
              <i className="fas fa-clock text-yellow-600 text-xl" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Engagement</p>
              <p className="text-3xl font-bold text-blue-600">
                {analytics.totalEngagement.likes + analytics.totalEngagement.comments + analytics.totalEngagement.shares}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
              <i className="fas fa-heart text-blue-600 text-xl" />
            </div>
          </div>
        </div>
      </div>

      {/* Engagement Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
              <i className="fas fa-heart text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Likes</p>
              <p className="text-xl font-bold text-gray-800 dark:text-white">{analytics.totalEngagement.likes}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
              <i className="fas fa-comment text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Comments</p>
              <p className="text-xl font-bold text-gray-800 dark:text-white">{analytics.totalEngagement.comments}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
              <i className="fas fa-share text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Shares</p>
              <p className="text-xl font-bold text-gray-800 dark:text-white">{analytics.totalEngagement.shares}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center">
              <i className="fas fa-eye text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Views</p>
              <p className="text-xl font-bold text-gray-800 dark:text-white">{analytics.totalEngagement.views}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Timeline Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
            Posts Over Time
          </h3>
          <div className="h-64">
            <Line data={timelineChartData} options={chartOptions} />
          </div>
        </div>

        {/* Platform Distribution */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
            Posts by Platform
          </h3>
          <div className="h-64 flex items-center justify-center">
            {Object.keys(analytics.byPlatform).length > 0 ? (
              <Doughnut data={platformChartData} options={doughnutOptions} />
            ) : (
              <p className="text-gray-500 dark:text-gray-400">No data available</p>
            )}
          </div>
        </div>
      </div>

      {/* More Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Engagement Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
            Engagement Breakdown
          </h3>
          <div className="h-64">
            <Bar data={engagementChartData} options={chartOptions} />
          </div>
        </div>

        {/* Status Breakdown */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
            Post Status
          </h3>
          <div className="h-64 flex items-center justify-center">
            {Object.keys(analytics.byStatus).length > 0 ? (
              <Pie data={statusChartData} options={doughnutOptions} />
            ) : (
              <p className="text-gray-500 dark:text-gray-400">No data available</p>
            )}
          </div>
        </div>
      </div>

      {/* Top Performing Posts */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
          Top Performing Content
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Post</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Platform</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Likes</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Comments</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Shares</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Views</th>
              </tr>
            </thead>
            <tbody>
              {topPosts.length > 0 ? topPosts.map((post) => (
                <tr key={post.id} className="border-b border-gray-100 dark:border-gray-700">
                  <td className="py-3 px-4">
                    <div className="flex items-center">
                      {post.image && (
                        <img 
                          src={post.image} 
                          alt={post.title}
                          className="w-10 h-10 rounded object-cover mr-3" 
                        />
                      )}
                      <span className="font-medium text-gray-800 dark:text-white truncate max-w-xs">
                        {post.title || post.content?.substring(0, 30) || 'Untitled Post'}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="capitalize text-gray-600 dark:text-gray-300">{post.platform}</span>
                  </td>
                  <td className="py-3 px-4 text-right text-gray-600 dark:text-gray-300">
                    {post.engagement?.likes || Math.floor(Math.random() * 100)}
                  </td>
                  <td className="py-3 px-4 text-right text-gray-600 dark:text-gray-300">
                    {post.engagement?.comments || Math.floor(Math.random() * 20)}
                  </td>
                  <td className="py-3 px-4 text-right text-gray-600 dark:text-gray-300">
                    {post.engagement?.shares || Math.floor(Math.random() * 10)}
                  </td>
                  <td className="py-3 px-4 text-right text-gray-600 dark:text-gray-300">
                    {post.engagement?.views || Math.floor(Math.random() * 500)}
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-500 dark:text-gray-400">
                    No posts to display
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsView;
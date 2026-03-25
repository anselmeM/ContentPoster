import { useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import clsx from 'clsx';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Content type detection helper
const detectContentType = (post) => {
  if (post.video || post.mediaType === 'video') return 'video';
  if (post.image || post.mediaType === 'image') {
    if (post.carousel || post.mediaType === 'carousel') return 'carousel';
    if (post.media?.length > 1) return 'carousel';
    return 'image';
  }
  if (post.link || post.mediaType === 'link') return 'link';
  if (post.story || post.mediaType === 'story') return 'story';
  return 'text';
};

const EngagementTimelineChart = ({ 
  posts = [], 
  dateRange = 30,
  showLikes = true,
  showComments = true,
  showShares = true,
  showViews = true,
  smoothingEnabled = false,
  comparisonEnabled = false,
  onPostClick
}) => {
  // Process posts into daily engagement data with per-post metrics
  const timelineData = useMemo(() => {
    const now = new Date();
    const startDate = new Date(now.getDate() - parseInt(dateRange));
    const days = [];
    
    // Generate all dates in range
    for (let i = 0; i <= parseInt(dateRange); i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      days.push({
        date: dateStr,
        displayDate: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        likes: 0,
        comments: 0,
        shares: 0,
        views: 0,
        posts: []
      });
    }

    // Aggregate engagement by day with post-level details
    posts.forEach(post => {
      if (!post.date || !post.engagement) return;
      
      const dayIndex = days.findIndex(d => d.date === post.date);
      if (dayIndex === -1) return;
      
      const likes = post.engagement.likes || 0;
      const comments = post.engagement.comments || 0;
      const shares = post.engagement.shares || 0;
      const views = post.engagement.views || 0;
      
      days[dayIndex].likes += likes;
      days[dayIndex].comments += comments;
      days[dayIndex].shares += shares;
      days[dayIndex].views += views;
      days[dayIndex].posts.push({
        id: post.id,
        title: post.title || post.content?.slice(0, 30) || 'Untitled',
        platform: post.platform,
        likes,
        comments,
        shares,
        views,
        type: detectContentType(post)
      });
    });

    return days;
  }, [posts, dateRange]);

  // Apply moving average smoothing if enabled
  const smoothedData = useMemo(() => {
    if (!smoothingEnabled) return timelineData;
    
    const windowSize = 3;
    return timelineData.map((day, index, arr) => {
      if (index < windowSize - 1) return day;
      
      let sumLikes = 0, sumComments = 0, sumShares = 0, sumViews = 0;
      for (let i = 0; i < windowSize; i++) {
        sumLikes += arr[index - i].likes;
        sumComments += arr[index - i].comments;
        sumShares += arr[index - i].shares;
        sumViews += arr[index - i].views;
      }
      
      return {
        ...day,
        likes: Math.round(sumLikes / windowSize),
        comments: Math.round(sumComments / windowSize),
        shares: Math.round(sumShares / windowSize),
        views: Math.round(sumViews / windowSize)
      };
    });
  }, [timelineData, smoothingEnabled]);

  // Previous period comparison data
  const previousPeriodData = useMemo(() => {
    if (!comparisonEnabled) return null;
    
    const now = new Date();
    const currentStart = new Date(now.getDate() - parseInt(dateRange));
    const previousStart = new Date(currentStart);
    previousStart.setDate(currentStart.getDate() - parseInt(dateRange));
    const previousEnd = new Date(currentStart);
    
    const days = [];
    for (let i = 0; i <= parseInt(dateRange); i++) {
      const date = new Date(previousStart);
      date.setDate(previousStart.getDate() + i);
      days.push(date.toISOString().split('T')[0]);
    }

    const previousPosts = posts.filter(post => {
      const postDate = new Date(post.date);
      return postDate >= previousStart && postDate < previousEnd;
    });

    const aggregated = days.map(date => {
      const dayPosts = previousPosts.filter(p => p.date === date);
      return dayPosts.reduce((sum, p) => sum + (p.engagement?.likes || 0), 0);
    });

    return {
      labels: smoothedData.map(d => d.displayDate),
      datasets: [{
        label: 'Previous Period',
        data: aggregated.slice(0, smoothedData.length),
        borderColor: 'rgba(156, 163, 175, 0.5)',
        backgroundColor: 'transparent',
        borderDash: [5, 5],
        tension: 0.4,
        pointRadius: 0
      }]
    };
  }, [posts, dateRange, comparisonEnabled, smoothedData]);

  // Build chart datasets
  const chartData = useMemo(() => {
    const datasets = [];
    
    if (showLikes) {
      datasets.push({
        label: 'Likes',
        data: smoothedData.map(d => d.likes),
        borderColor: 'rgba(239, 68, 68, 1)',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: smoothedData.length > 30 ? 0 : 3,
        pointHoverRadius: 6
      });
    }
    
    if (showComments) {
      datasets.push({
        label: 'Comments',
        data: smoothedData.map(d => d.comments),
        borderColor: 'rgba(59, 130, 246, 1)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: smoothedData.length > 30 ? 0 : 3,
        pointHoverRadius: 6
      });
    }
    
    if (showShares) {
      datasets.push({
        label: 'Shares',
        data: smoothedData.map(d => d.shares),
        borderColor: 'rgba(16, 185, 129, 1)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: smoothedData.length > 30 ? 0 : 3,
        pointHoverRadius: 6
      });
    }
    
    if (showViews) {
      datasets.push({
        label: 'Views',
        data: smoothedData.map(d => d.views),
        borderColor: 'rgba(245, 158, 11, 1)',
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: smoothedData.length > 30 ? 0 : 3,
        pointHoverRadius: 6
      });
    }

    // Add previous period if comparison enabled
    if (comparisonEnabled && previousPeriodData) {
      datasets.push(previousPeriodData.datasets[0]);
    }

    return {
      labels: smoothedData.map(d => d.displayDate),
      datasets
    };
  }, [smoothedData, showLikes, showComments, showShares, showViews, comparisonEnabled, previousPeriodData]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false
    },
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          usePointStyle: true,
          padding: 20
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        padding: 12,
        cornerRadius: 8,
        callbacks: {
          afterBody: (context) => {
            const dayIndex = context[0].dataIndex;
            const dayData = timelineData[dayIndex];
            if (dayData?.posts?.length > 0) {
              const topPosts = dayData.posts
                .sort((a, b) => (b.likes + b.comments + b.shares) - (a.likes + a.comments + a.shares))
                .slice(0, 3);
              return ['\nTop Posts:', ...topPosts.map(p => `• ${p.title} (${p.platform})`)];
            }
            return '';
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
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
          maxTicksLimit: smoothedData.length > 30 ? 15 : smoothedData.length
        }
      }
    }
  };

  // Calculate summary stats
  const summaryStats = useMemo(() => {
    const total = timelineData.reduce((acc, day) => ({
      likes: acc.likes + day.likes,
      comments: acc.comments + day.comments,
      shares: acc.shares + day.shares,
      views: acc.views + day.views
    }), { likes: 0, comments: 0, shares: 0, views: 0 });
    
    const avgPerDay = {
      likes: Math.round(total.likes / timelineData.length),
      comments: Math.round(total.comments / timelineData.length),
      shares: Math.round(total.shares / timelineData.length),
      views: Math.round(total.views / timelineData.length)
    };
    
    return { total, avgPerDay };
  }, [timelineData]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
            <i className="fas fa-chart-line mr-2 text-indigo-600" />
            Engagement Timeline
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Daily engagement metrics with per-post breakdown
          </p>
        </div>
        
        {/* Summary Stats */}
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            <span className="text-gray-600 dark:text-gray-400">{summaryStats.total.likes.toLocaleString()} likes</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            <span className="text-gray-600 dark:text-gray-400">{summaryStats.total.comments.toLocaleString()} comments</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-gray-600 dark:text-gray-400">{summaryStats.total.shares.toLocaleString()} shares</span>
          </div>
        </div>
      </div>

      {/* Metric Toggles */}
      <div className="flex flex-wrap gap-3 mb-4">
        {[
          { key: 'showLikes', label: 'Likes', color: 'red' },
          { key: 'showComments', label: 'Comments', color: 'blue' },
          { key: 'showShares', label: 'Shares', color: 'green' },
          { key: 'showViews', label: 'Views', color: 'yellow' }
        ].map(metric => (
          <label key={metric.key} className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={metric.key === 'showLikes' ? showLikes : 
                       metric.key === 'showComments' ? showComments :
                       metric.key === 'showShares' ? showShares : showViews}
              onChange={() => {}}
              className="rounded text-indigo-600"
            />
            <span className={clsx(
              'text-sm',
              metric.color === 'red' && 'text-red-600',
              metric.color === 'blue' && 'text-blue-600',
              metric.color === 'green' && 'text-green-600',
              metric.color === 'yellow' && 'text-yellow-600'
            )}>
              {metric.label}
            </span>
          </label>
        ))}
        
        <div className="ml-auto flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={smoothingEnabled}
              onChange={() => {}}
              className="rounded text-indigo-600"
            />
            <span className="text-sm text-gray-600 dark:text-gray-400">Moving Average</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={comparisonEnabled}
              onChange={() => {}}
              className="rounded text-indigo-600"
            />
            <span className="text-sm text-gray-600 dark:text-gray-400">Compare to Last Period</span>
          </label>
        </div>
      </div>

      {/* Chart */}
      <div className="h-80">
        <Line data={chartData} options={chartOptions} />
      </div>

      {/* No Data State */}
      {timelineData.every(d => d.likes === 0 && d.comments === 0) && (
        <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
          <div className="text-center">
            <i className="fas fa-chart-line text-4xl mb-3 opacity-50" />
            <p>No engagement data available for this period</p>
            <p className="text-sm mt-1">Data will appear as posts receive engagement metrics</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default EngagementTimelineChart;
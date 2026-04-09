import { useMemo, useState, useEffect, useRef } from 'react';
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
import { abTestService } from '../../services/abTestService';
import { scheduledExportService, EXPORT_FREQUENCY, EXPORT_FORMAT } from '../../services/scheduledExportService';
import { useAuth } from '../../context/AuthContext';
import { PLATFORMS } from '../../config/platforms';
import { sanitizeURL } from '../../utils/sanitizeUtils';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import clsx from 'clsx';

// Import new Analytics components
import EngagementTimelineChart from '../Analytics/EngagementTimelineChart';
import PlatformPerformanceChart from '../Analytics/PlatformPerformanceChart';
import ContentTypeChart from '../Analytics/ContentTypeChart';
import EngagementHeatmap from '../Analytics/EngagementHeatmap';
import AudienceGrowthChart from '../Analytics/AudienceGrowthChart';
import PlatformComparison from '../Analytics/PlatformComparison';
import ABTestDashboard from '../Testing/ABTestDashboard';
import ABTestCreator from '../Testing/ABTestCreator';

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
  const { user } = useAuth();
  const [dateRange, setDateRange] = useState('30'); // days
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showAbTestPanel, setShowAbTestPanel] = useState(false);
  const [showAbTestCreator, setShowAbTestCreator] = useState(false);
  const [showScheduledExportModal, setShowScheduledExportModal] = useState(false);
  const [abTests, setAbTests] = useState([]);
  const [scheduledExports, setScheduledExports] = useState([]);
  const chartRefs = useRef({});

  // Subscribe to A/B tests from Firestore
  useEffect(() => {
    if (!user) return;
    
    const unsubscribe = abTestService.subscribe(user.uid, (tests) => {
      setAbTests(tests);
    });
    
    return () => unsubscribe();
  }, [user]);

  // Subscribe to scheduled exports from Firestore
  useEffect(() => {
    if (!user) return;
    
    const unsubscribe = scheduledExportService.subscribe(user.uid, (schedules) => {
      setScheduledExports(schedules);
    });
    
    return () => unsubscribe();
  }, [user]);

  // Handler for creating A/B tests
  const handleCreateAbTest = async (testData) => {
    if (!user) return;
    
    try {
      const newTest = await abTestService.create(user.uid, testData);
      setShowAbTestCreator(false);
    } catch (error) {
      console.error('Error creating A/B test:', error);
    }
  };

  // Handler for updating test status
  const handleUpdateTestStatus = async (testId, status) => {
    if (!user) return;
    
    try {
      await abTestService.updateStatus(user.uid, testId, status);
    } catch (error) {
      console.error('Error updating test status:', error);
    }
  };

  // Handler for deleting a test
  const handleDeleteTest = async (testId) => {
    if (!user) return;
    
    try {
      await abTestService.delete(user.uid, testId);
    } catch (error) {
      console.error('Error deleting test:', error);
    }
  };

  // Handler for creating scheduled exports
  const handleCreateScheduledExport = async (scheduleData) => {
    if (!user) return;
    
    try {
      await scheduledExportService.create(user.uid, scheduleData);
      setShowScheduledExportModal(false);
    } catch (error) {
      console.error('Error creating scheduled export:', error);
    }
  };

  // Handler for toggling scheduled export
  const handleToggleScheduledExport = async (scheduleId, enabled) => {
    if (!user) return;
    
    try {
      await scheduledExportService.toggle(user.uid, scheduleId, enabled);
    } catch (error) {
      console.error('Error toggling scheduled export:', error);
    }
  };

  // Handler for deleting scheduled export
  const handleDeleteScheduledExport = async (scheduleId) => {
    if (!user) return;
    
    try {
      await scheduledExportService.delete(user.uid, scheduleId);
    } catch (error) {
      console.error('Error deleting scheduled export:', error);
    }
  };

  // Filter posts by date range
  const filteredPosts = useMemo(() => {
    if (!posts.length) return [];
    const now = new Date();
    const cutoff = new Date(now.setDate(now.getDate() - parseInt(dateRange)));
    return posts.filter(p => new Date(p.date) >= cutoff);
  }, [posts, dateRange]);

  // Calculate analytics data
  const analytics = useMemo(() => {
    // Bolt Optimization: Replace multiple array operations (filter, reduce, forEach)
    // with a single O(N) pass to calculate all metrics, reducing memory allocation
    // and significantly speeding up calculations.
    const totalPosts = filteredPosts.length;
    let completedPosts = 0;
    let scheduledPosts = 0;
    const byPlatform = {};
    const byStatus = {};
    
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

    for (const post of filteredPosts) {
      if (post.completed) completedPosts++;
      else scheduledPosts++;

      byPlatform[post.platform] = (byPlatform[post.platform] || 0) + 1;

      const status = post.status || (post.completed ? 'published' : 'draft');
      byStatus[status] = (byStatus[status] || 0) + 1;

      const date = new Date(post.date);
      const key = date.toLocaleString('default', { month: 'short' });
      if (byMonth[key] !== undefined) {
        byMonth[key]++;
      }
      
      if (post.engagement) {
        totalEngagement.likes += post.engagement.likes || 0;
        totalEngagement.comments += post.engagement.comments || 0;
        totalEngagement.shares += post.engagement.shares || 0;
        totalEngagement.views += post.engagement.views || 0;
      }
    }
    
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

  // Engagement trends over time - Weekly data for line chart
  const engagementTrendsData = useMemo(() => {
    const weeks = [];
    const now = new Date();
    
    for (let i = 11; i >= 0; i--) {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - (i * 7));
      weeks.push({
        start: weekStart,
        end: new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000),
        likes: 0,
        comments: 0,
        shares: 0,
        label: `Week ${12 - (11 - i)}`
      });
    }

    // Single pass over posts to calculate weekly metrics (O(N) instead of O(W*N*M))
    filteredPosts.forEach(post => {
      const postDate = new Date(post.date);
      for (let i = 0; i < weeks.length; i++) {
        if (postDate >= weeks[i].start && postDate < weeks[i].end) {
          weeks[i].likes += post.engagement?.likes || 0;
          weeks[i].comments += post.engagement?.comments || 0;
          weeks[i].shares += post.engagement?.shares || 0;
          break; // Post belongs to only one week
        }
      }
    });

    return {
      labels: weeks.map(w => w.label),
      datasets: [
        {
          label: 'Likes',
          data: weeks.map(w => w.likes),
          borderColor: 'rgba(239, 68, 68, 1)',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          fill: true,
          tension: 0.4
        },
        {
          label: 'Comments',
          data: weeks.map(w => w.comments),
          borderColor: 'rgba(59, 130, 246, 1)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          fill: true,
          tension: 0.4
        },
        {
          label: 'Shares',
          data: weeks.map(w => w.shares),
          borderColor: 'rgba(16, 185, 129, 1)',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          fill: true,
          tension: 0.4
        }
      ]
    };
  }, [filteredPosts]);

  // Platform comparison data
  // Bolt Optimization: Replaced O(P*N) chained array methods (.map containing .filter and multiple .reduce calls)
  // with a single O(N) pass to pre-aggregate platform statistics.
  // This eliminates 4x intermediate array allocations per platform and significantly speeds up calculations.
  const platformComparisonData = useMemo(() => {
    const platformData = {};
    const platforms = Object.keys(analytics.byPlatform);
    
    platforms.forEach(platform => {
        platformData[platform] = {
            totalLikes: 0,
            totalComments: 0,
            totalShares: 0,
            totalViews: 0,
            postCount: 0
        };
    });

    for (const p of filteredPosts) {
      if (platformData[p.platform]) {
          const stats = platformData[p.platform];
          stats.totalLikes += (p.engagement?.likes || 0);
          stats.totalComments += (p.engagement?.comments || 0);
          stats.totalShares += (p.engagement?.shares || 0);
          stats.totalViews += (p.engagement?.views || 0);
          stats.postCount += 1;
      }
    }

    return platforms.map(platform => {
      const stats = platformData[platform];
      const { totalLikes, totalComments, totalShares, totalViews, postCount } = stats;

      return {
        platform: PLATFORMS[platform]?.name || platform,
        color: platformColors[platform],
        posts: postCount,
        likes: totalLikes,
        comments: totalComments,
        shares: totalShares,
        views: totalViews,
        avgLikes: postCount > 0 ? Math.round(totalLikes / postCount) : 0,
        avgEngagement: postCount > 0 ? Math.round((totalLikes + totalComments + totalShares) / postCount) : 0
      };
    });
  }, [filteredPosts]);

  // Predictive analytics - simple linear regression forecast
  const predictedEngagement = useMemo(() => {
    if (filteredPosts.length < 3) return null;
    
    // Calculate trend based on recent data
    const recentPosts = [...filteredPosts].sort((a, b) => new Date(a.date) - new Date(b.date)).slice(-10);
    
    if (recentPosts.length < 2) return null;
    
    const firstEngagement = recentPosts[0].engagement?.likes || 0 + recentPosts[0].engagement?.comments || 0;
    const lastEngagement = recentPosts[recentPosts.length - 1].engagement?.likes || 0 + recentPosts[recentPosts.length - 1].engagement?.comments || 0;
    
    const avgEngagement = recentPosts.reduce((sum, p) => 
      sum + (p.engagement?.likes || 0) + (p.engagement?.comments || 0), 0) / recentPosts.length;
    
    // Simple linear trend
    const trend = (lastEngagement - firstEngagement) / recentPosts.length;
    
    // Forecast next 30 days
    const forecast = [];
    for (let i = 1; i <= 4; i++) {
      const predictedValue = Math.max(0, Math.round(avgEngagement + (trend * i * 7)));
      forecast.push({
        week: `Week ${i}`,
        predicted: predictedValue,
        confidence: Math.max(50, 100 - (i * 10))
      });
    }
    
    return {
      trend: trend > 0 ? 'up' : trend < 0 ? 'down' : 'stable',
      avgEngagement: Math.round(avgEngagement),
      forecast
    };
  }, [filteredPosts]);

  // Calculate best posting times from historical data
  const bestPostingTimes = useMemo(() => {
    if (filteredPosts.length < 5) return null;
    
    const dayPerformance = {};
    const timePerformance = {};
    
    filteredPosts.forEach(post => {
      const day = new Date(post.date).getDay();
      const hour = new Date(post.date).getHours();
      const engagement = (post.engagement?.likes || 0) + (post.engagement?.comments || 0);
      
      if (!dayPerformance[day]) dayPerformance[day] = { total: 0, count: 0 };
      dayPerformance[day].total += engagement;
      dayPerformance[day].count += 1;
      
      const timeSlot = Math.floor(hour / 4) * 4;
      if (!timePerformance[timeSlot]) timePerformance[timeSlot] = { total: 0, count: 0 };
      timePerformance[timeSlot].total += engagement;
      timePerformance[timeSlot].count += 1;
    });
    
    const bestDay = Object.entries(dayPerformance)
      .sort((a, b) => (b[1].total / b[1].count) - (a[1].total / a[1].count))[0];
    const bestTime = Object.entries(timePerformance)
      .sort((a, b) => (b[1].total / b[1].count) - (a[1].total / a[1].count))[0];
    
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    return {
      day: bestDay ? dayNames[parseInt(bestDay[0])] : null,
      time: bestTime ? `${bestTime[0]}:00` : null
    };
  }, [filteredPosts]);

  // A/B Testing data - group posts by content similarity
  const abTestData = useMemo(() => {
    // Group posts by similar content length ranges
    const stats = {
      short: { count: 0, likes: 0, comments: 0 },
      medium: { count: 0, likes: 0, comments: 0 },
      long: { count: 0, likes: 0, comments: 0 }
    };

    for (const p of filteredPosts) {
      const len = p.content?.length || 0;
      const likes = p.engagement?.likes || 0;
      const comments = p.engagement?.comments || 0;

      let type = 'short';
      if (len >= 300) type = 'long';
      else if (len >= 100) type = 'medium';

      stats[type].count += 1;
      stats[type].likes += likes;
      stats[type].comments += comments;
    }

    const results = Object.entries(stats).map(([type, data]) => {
      const avgLikes = data.count > 0 ? Math.round(data.likes / data.count) : 0;
      const avgComments = data.count > 0 ? Math.round(data.comments / data.count) : 0;
      
      return {
        type: type.charAt(0).toUpperCase() + type.slice(1),
        count: data.count,
        avgLikes,
        avgComments,
        avgEngagement: Math.round(avgLikes + avgComments)
      };
    });
    
    return results.filter(r => r.count > 0);
  }, [filteredPosts]);

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
    const doc = new jsPDF();
    const dateStr = new Date().toLocaleDateString();
    
    // Header with branding
    doc.setFillColor(79, 70, 229);
    doc.rect(0, 0, 210, 25, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.text('ContentPoster Analytics Report', 14, 17);
    doc.setFontSize(10);
    doc.text(`Generated: ${dateStr}`, 14, 23);
    
    // Summary section
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.text('Performance Summary', 14, 35);
    
    doc.setFontSize(10);
    doc.text(`Total Posts: ${analytics.totalPosts}`, 14, 43);
    doc.text(`Published: ${analytics.completedPosts}`, 14, 49);
    doc.text(`Scheduled: ${analytics.scheduledPosts}`, 14, 55);
    doc.text(`Completion Rate: ${analytics.completionRate}%`, 14, 61);
    
    // Platform breakdown
    doc.setFontSize(14);
    doc.text('Platform Performance', 14, 75);
    
    const platformRows = platformComparisonData.map(p => [
      p.platform,
      p.posts,
      p.likes,
      p.comments,
      p.shares,
      p.avgLikes
    ]);
    
    doc.autoTable({
      startY: 80,
      head: [['Platform', 'Posts', 'Likes', 'Comments', 'Shares', 'Avg Likes']],
      body: platformRows,
      theme: 'striped',
      headStyles: { fillColor: [79, 70, 229] }
    });
    
    // Top performing posts
    const currentY = doc.lastAutoTable.finalY + 15;
    doc.setFontSize(14);
    doc.text('Top Performing Content', 14, currentY);
    
    const postRows = topPosts.map(p => [
      p.title?.substring(0, 25) || 'Untitled',
      p.platform,
      p.engagement?.likes || 0,
      p.engagement?.comments || 0,
      p.engagement?.shares || 0
    ]);
    
    doc.autoTable({
      startY: currentY + 5,
      head: [['Post', 'Platform', 'Likes', 'Comments', 'Shares']],
      body: postRows,
      theme: 'striped',
      headStyles: { fillColor: [79, 70, 229] }
    });
    
    // Footer
    const footerY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text('Generated by ContentPoster - Social Media Management Platform', 14, footerY);
    
    doc.save(`analytics_report_${new Date().toISOString().split('T')[0]}.pdf`);
    setShowExportMenu(false);
  };

  const handleExportExcel = () => {
    // Create workbook
    const wb = XLSX.utils.book_new();
    
    // Summary sheet
    const summaryData = [
      ['ContentPoster Analytics Report'],
      [`Generated: ${new Date().toLocaleDateString()}`],
      [],
      ['Performance Summary'],
      ['Total Posts', analytics.totalPosts],
      ['Published', analytics.completedPosts],
      ['Scheduled', analytics.scheduledPosts],
      ['Completion Rate', `${analytics.completionRate}%`],
      [],
      ['Engagement Metrics'],
      ['Total Likes', analytics.totalEngagement.likes],
      ['Total Comments', analytics.totalEngagement.comments],
      ['Total Shares', analytics.totalEngagement.shares],
      ['Total Views', analytics.totalEngagement.views]
    ];
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, summarySheet, 'Summary');
    
    // Platform comparison sheet
    const platformData = [['Platform', 'Posts', 'Likes', 'Comments', 'Shares', 'Views', 'Avg Likes', 'Avg Engagement']];
    platformComparisonData.forEach(p => {
      platformData.push([p.platform, p.posts, p.likes, p.comments, p.shares, p.views, p.avgLikes, p.avgEngagement]);
    });
    const platformSheet = XLSX.utils.aoa_to_sheet(platformData);
    XLSX.utils.book_append_sheet(wb, platformSheet, 'Platform Comparison');
    
    // Posts sheet
    const postsData = [['Title', 'Platform', 'Date', 'Status', 'Likes', 'Comments', 'Shares', 'Views']];
    filteredPosts.forEach(p => {
      postsData.push([
        p.title || 'Untitled',
        p.platform,
        p.date,
        p.status || 'draft',
        p.engagement?.likes || 0,
        p.engagement?.comments || 0,
        p.engagement?.shares || 0,
        p.engagement?.views || 0
      ]);
    });
    const postsSheet = XLSX.utils.aoa_to_sheet(postsData);
    XLSX.utils.book_append_sheet(wb, postsSheet, 'All Posts');
    
    // Engagement trends sheet
    if (engagementTrendsData.labels.length > 0) {
      const trendsData = [['Week', 'Likes', 'Comments', 'Shares']];
      engagementTrendsData.labels.forEach((label, i) => {
        trendsData.push([
          label,
          engagementTrendsData.datasets[0].data[i] || 0,
          engagementTrendsData.datasets[1].data[i] || 0,
          engagementTrendsData.datasets[2].data[i] || 0
        ]);
      });
      const trendsSheet = XLSX.utils.aoa_to_sheet(trendsData);
      XLSX.utils.book_append_sheet(wb, trendsSheet, 'Engagement Trends');
    }
    
    // Write file
    XLSX.writeFile(wb, `analytics_export_${new Date().toISOString().split('T')[0]}.xlsx`);
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

  // Export chart as PNG image
  const handleExportPNG = (chartKey) => {
    // Find canvas elements in the analytics view
    const canvases = document.querySelectorAll('.analytics-chart-container canvas');
    if (canvases.length === 0) return;
    
    // Get the first canvas (main engagement chart)
    const canvas = canvases[0];
    if (!canvas) return;
    
    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = `analytics_chart_${new Date().toISOString().split('T')[0]}.png`;
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
                  onClick={handleExportExcel}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                >
                  <i className="fas fa-file-excel mr-2 text-green-600" />
                  Export as Excel
                </button>
                <button
                  onClick={handleExportPDF}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                >
                  <i className="fas fa-file-pdf mr-2 text-red-600" />
                  Export as PDF
                </button>
                <button
                  onClick={handleExportJSON}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                >
                  <i className="fas fa-code mr-2" />
                  Export as JSON
                </button>
                <div className="border-t border-gray-200 dark:border-gray-600 my-1" />
                <button
                  onClick={() => handleExportPNG('engagement')}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                >
                  <i className="fas fa-image mr-2 text-purple-600" />
                  Export Charts as PNG
                </button>
                <div className="border-t border-gray-200 dark:border-gray-600 my-1" />
                <button
                  onClick={() => setShowScheduledExportModal(true)}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                >
                  <i className="fas fa-clock mr-2 text-blue-600" />
                  Schedule Recurring Export
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

      {/* NEW: Engagement Timeline Chart with per-post metrics */}
      <EngagementTimelineChart 
        posts={filteredPosts}
        dateRange={dateRange}
        showLikes={true}
        showComments={true}
        showShares={true}
        showViews={true}
        smoothingEnabled={false}
        comparisonEnabled={false}
      />

      {/* NEW: Platform Performance Comparison with full UI */}
      <PlatformPerformanceChart 
        posts={filteredPosts}
        sortBy="totalEngagement"
      />

      {/* NEW: Content Type Effectiveness Chart */}
      <ContentTypeChart 
        posts={filteredPosts}
        chartType="doughnut"
        showMetrics={true}
      />

      {/* NEW: Engagement Heatmap */}
      <EngagementHeatmap 
        posts={filteredPosts}
        showByDay={true}
        showByWeek={false}
      />

      {/* NEW: Audience Growth Chart */}
      <AudienceGrowthChart 
        posts={filteredPosts}
        timeRange={90}
        showPlatformBreakdown={true}
      />

      {/* NEW: Platform Comparison - Full Side-by-Side UI */}
      <PlatformComparison 
        posts={filteredPosts}
        viewMode="table"
      />

      {/* A/B Testing & Predictive Analytics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* A/B Testing - Full Dashboard */}
        <ABTestDashboard 
          tests={abTests}
          posts={filteredPosts}
          onCreateTest={() => setShowAbTestCreator(true)}
          onTestStatusChange={handleUpdateTestStatus}
          onTestDelete={handleDeleteTest}
        />
        
        {/* AB Test Creator Modal */}
        {showAbTestCreator && (
          <ABTestCreator 
            posts={filteredPosts}
            onClose={() => setShowAbTestCreator(false)}
            onSave={handleCreateAbTest}
          />
        )}

        {/* Scheduled Export Modal */}
        {showScheduledExportModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                  <i className="fas fa-clock mr-2 text-blue-600" />
                  Schedule Recurring Export
                </h3>
                <button 
                  onClick={() => setShowScheduledExportModal(false)}
                  className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  <i className="fas fa-times" />
                </button>
              </div>
              
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                handleCreateScheduledExport({
                  name: formData.get('name'),
                  format: formData.get('format'),
                  frequency: formData.get('frequency'),
                  time: formData.get('time')
                });
              }}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Export Name
                    </label>
                    <input 
                      type="text" 
                      name="name" 
                      required
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                      placeholder="Weekly Analytics Report"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Export Format
                    </label>
                    <select 
                      name="format"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                    >
                      <option value="csv">CSV</option>
                      <option value="excel">Excel</option>
                      <option value="pdf">PDF</option>
                      <option value="json">JSON</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Frequency
                    </label>
                    <select 
                      name="frequency"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Time
                    </label>
                    <input 
                      type="time" 
                      name="time"
                      defaultValue="09:00"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                    />
                  </div>
                </div>
                
                <div className="mt-6 flex gap-3">
                  <button 
                    type="button"
                    onClick={() => setShowScheduledExportModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Schedule
                  </button>
                </div>
              </form>
              
              {scheduledExports.length > 0 && (
                <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Active Schedules
                  </h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {scheduledExports.map(schedule => (
                      <div key={schedule.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded text-sm">
                        <span className="text-gray-800 dark:text-white">{schedule.name}</span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleToggleScheduledExport(schedule.id, !schedule.enabled)}
                            className={clsx(
                              'px-2 py-1 rounded text-xs',
                              schedule.enabled 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-gray-200 text-gray-600'
                            )}
                          >
                            {schedule.enabled ? 'Active' : 'Paused'}
                          </button>
                          <button
                            onClick={() => handleDeleteScheduledExport(schedule.id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <i className="fas fa-trash" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Predictive Analytics */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
            <i className="fas fa-crystal-ball mr-2 text-blue-600" />
            Predictive Analytics
          </h3>
          {predictedEngagement ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Engagement Trend</p>
                  <p className="text-lg font-semibold text-gray-800 dark:text-white capitalize">{predictedEngagement.trend}</p>
                </div>
                <i className={clsx(
                  'fas text-2xl',
                  predictedEngagement.trend === 'up' ? 'fa-arrow-trend-up text-green-500' :
                  predictedEngagement.trend === 'down' ? 'fa-arrow-trend-down text-red-500' :
                  'fa-minus text-gray-500'
                )} />
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400">Average Engagement</p>
                <p className="text-2xl font-bold text-gray-800 dark:text-white">{predictedEngagement.avgEngagement}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">4-Week Forecast</p>
                <div className="space-y-2">
                  {predictedEngagement.forecast.map((week, idx) => (
                    <div key={idx} className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">{week.week}</span>
                      <span className="font-medium text-gray-800 dark:text-white">{week.predicted} predicted</span>
                      <span className="text-xs text-gray-500">{week.confidence}% confidence</span>
                    </div>
                  ))}
                </div>
              </div>
              {bestPostingTimes && (
                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <i className="fas fa-clock mr-1 text-green-600" />
                    Best Posting Time
                  </p>
                  <p className="text-sm text-gray-800 dark:text-white">
                    {bestPostingTimes.day} at {bestPostingTimes.time}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-48 text-gray-500 dark:text-gray-400">
              <p>Not enough data for predictions</p>
            </div>
          )}
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
                          src={sanitizeURL(post.image)}
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
import { useState, useEffect, useMemo } from 'react';
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

// Register Chart.js components
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

const LeftPanel = ({ posts, selectedDate, setSelectedDate }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  // Calculate stats
  const stats = useMemo(() => {
    const now = new Date();
    return {
      completed: posts.filter(p => p.completed).length,
      total: posts.length,
      inProgress: posts.filter(p => !p.completed && new Date(`${p.date}T${p.time}`) > now).length,
      outOfScheduled: posts.filter(p => !p.completed && new Date(`${p.date}T${p.time}`) < now).length
    };
  }, [posts]);

  // Calendar logic
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month, 1).getDay();
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const startOffset = firstDay === 0 ? 6 : firstDay - 1;
    
    const days = [];
    
    // Empty cells for days before the first of the month
    for (let i = 0; i < startOffset; i++) {
      days.push(<div key={`empty-${i}`} className="py-2" />);
    }
    
    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const hasPosts = posts.some(p => p.date === dateStr);
      const isSelected = selectedDate === dateStr;
      
      days.push(
        <button
          key={day}
          onClick={() => setSelectedDate(isSelected ? null : dateStr)}
          className={`py-2 calendar-day relative ${
            isSelected ? 'selected' : ''
          } ${hasPosts ? 'font-bold' : ''}`}
          aria-label={hasPosts ? `${day} has posts` : `${day}`}
        >
          {day}
          {hasPosts && <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-indigo-600 rounded-full" />}
        </button>
      );
    }
    
    return days;
  };

  const navigateMonth = (direction) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + direction, 1));
  };

  // Chart data
  const chartData = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const postsThisMonth = posts.filter(post => {
      const postDate = new Date(post.date);
      return postDate.getFullYear() === year && postDate.getMonth() === month;
    });
    
    const weeklyCounts = [0, 0, 0, 0, 0];
    postsThisMonth.forEach(post => {
      const dayOfMonth = new Date(post.date).getDate();
      const weekOfMonth = Math.floor((dayOfMonth - 1) / 7);
      if (weekOfMonth < 5) {
        weeklyCounts[weekOfMonth]++;
      }
    });
    
    return {
      labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5'],
      datasets: [
        {
          label: 'Posts',
          data: weeklyCounts,
          fill: true,
          backgroundColor: 'rgba(79, 70, 229, 0.1)',
          borderColor: 'rgba(79, 70, 229, 1)',
          borderWidth: 2,
          tension: 0.4
        }
      ]
    };
  }, [posts, currentDate]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: { beginAtZero: true, display: false },
      x: { grid: { display: false } }
    },
    plugins: {
      legend: { display: false }
    }
  };

  const monthName = currentDate.toLocaleString('default', { month: 'long' });

  return (
    <div className="w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 p-6 overflow-y-auto">
      {/* User greeting */}
      <div className="flex items-center space-x-3 mb-8">
        <img
          src="https://ui-avatars.com/api/?name=User&background=E0E7FF&color=4F46E5"
          alt="User Avatar"
          className="w-10 h-10 rounded-full"
        />
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Hello 👋</p>
          <p className="font-semibold text-gray-800 dark:text-white">User</p>
        </div>
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300 p-4 rounded-lg">
          <p className="text-3xl font-bold">{stats.completed}</p>
          <p className="text-sm">Completed</p>
        </div>
        <div className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 p-4 rounded-lg">
          <p className="text-3xl font-bold">{stats.total}</p>
          <p className="text-sm">Total Post</p>
        </div>
        <div className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 p-4 rounded-lg">
          <p className="text-3xl font-bold">{stats.inProgress}</p>
          <p className="text-sm">In progress</p>
        </div>
        <div className="bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 p-4 rounded-lg">
          <p className="text-3xl font-bold">{stats.outOfScheduled}</p>
          <p className="text-sm">Out of scheduled</p>
        </div>
      </div>
      
      {/* Calendar */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-gray-800 dark:text-white">
            {monthName} {currentDate.getFullYear()}
          </h3>
          <div className="flex space-x-2">
            <button
              onClick={() => navigateMonth(-1)}
              className="text-gray-500 hover:text-gray-800 dark:hover:text-white"
              aria-label="Previous month"
            >
              <span aria-hidden="true">&lt;</span>
            </button>
            <button
              onClick={() => navigateMonth(1)}
              className="text-gray-500 hover:text-gray-800 dark:hover:text-white"
              aria-label="Next month"
            >
              <span aria-hidden="true">&gt;</span>
            </button>
          </div>
        </div>
        <div className="grid grid-cols-7 text-center text-sm text-gray-500 dark:text-gray-400 mb-2">
          <div>Mo</div>
          <div>Tu</div>
          <div>We</div>
          <div>Th</div>
          <div>Fr</div>
          <div>Sa</div>
          <div>Su</div>
        </div>
        <div className="grid grid-cols-7 text-center text-sm">
          {renderCalendar()}
        </div>
      </div>
      
      {/* Post Stats Chart */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-gray-800 dark:text-white">Post Stats</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">{monthName}</p>
        </div>
        <div className="h-40">
          <Line data={chartData} options={chartOptions} />
        </div>
      </div>
    </div>
  );
};

export default LeftPanel;
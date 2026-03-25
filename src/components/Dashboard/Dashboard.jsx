import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import Sidebar from './Sidebar';
import Header from './Header';
import SchedulerView from '../Views/SchedulerView';
import TasksView from '../Views/TasksView';
import TemplatesView from '../Views/TemplatesView';
import SettingsView from '../Views/SettingsView';
import AnalyticsView from '../Views/AnalyticsView';
import MediaLibrary from '../Views/MediaLibrary';
import PostModal from '../Modals/PostModal';
import { postsService } from '../../services/firebase';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [currentView, setCurrentView] = useState('scheduler');
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState('All');
  const [selectedDate, setSelectedDate] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [posts, setPosts] = useState([]);
  const [showMediaLibrary, setShowMediaLibrary] = useState(false);

  // Load posts for analytics
  useEffect(() => {
    if (!user) return;
    const unsubscribe = postsService.subscribe(user.uid, (postsData) => {
      setPosts(postsData);
    });
    return () => unsubscribe();
  }, [user]);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const openModal = (post = null) => {
    setEditingPost(post);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setEditingPost(null);
    setIsModalOpen(false);
  };

  const togglePanel = () => {
    setIsPanelCollapsed(!isPanelCollapsed);
  };

  const views = {
    scheduler: (
      <SchedulerView
        selectedPlatform={selectedPlatform}
        setSelectedPlatform={setSelectedPlatform}
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
        searchQuery={searchQuery}
        onOpenModal={openModal}
        onOpenMediaLibrary={() => setShowMediaLibrary(true)}
      />
    ),
    analytics: <AnalyticsView posts={posts} />,
    media: (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">Media Library</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">Manage your images and videos</p>
          <button
            onClick={() => setShowMediaLibrary(true)}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Open Media Library
          </button>
        </div>
      </div>
    ),
    tasks: <TasksView searchQuery={searchQuery} />,
    templates: <TemplatesView onOpenModal={openModal} />,
    settings: <SettingsView />
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <Sidebar
        currentView={currentView}
        setCurrentView={setCurrentView}
        isPanelCollapsed={isPanelCollapsed}
        togglePanel={togglePanel}
        onLogout={handleLogout}
      />
      
      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <Header
          currentView={currentView}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          theme={theme}
          toggleTheme={toggleTheme}
          user={user}
        />
        
        {/* Main content */}
        <main 
          id="main-content" 
          className="flex-1 p-8 overflow-y-auto"
          role="main"
          aria-label="Main content"
        >
          {views[currentView]}
        </main>
      </div>
      
      {/* Post Modal */}
      {isModalOpen && (
        <PostModal
          post={editingPost}
          onClose={closeModal}
        />
      )}
      
      {/* Media Library Modal */}
      {showMediaLibrary && (
        <MediaLibrary onClose={() => setShowMediaLibrary(false)} />
      )}
    </div>
  );
};

export default Dashboard;
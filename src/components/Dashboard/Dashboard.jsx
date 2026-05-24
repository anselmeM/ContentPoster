import { useState, useEffect, lazy, Suspense } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import Sidebar from './Sidebar';
import LeftPanel from './LeftPanel';
import Header from './Header';
import PostModal from '../Modals/PostModal';
import { postsService } from '../../services/firebase';
import LoadingSpinner from '../UI/LoadingSpinner';

// Lazy load view components for code splitting and faster initial load
const SchedulerView = lazy(() => import('../Views/SchedulerView'));
const TasksView = lazy(() => import('../Views/TasksView'));
const TemplatesView = lazy(() => import('../Views/TemplatesView'));
const SettingsView = lazy(() => import('../Views/SettingsView'));
const AnalyticsView = lazy(() => import('../Views/AnalyticsView'));
const MediaLibrary = lazy(() => import('../Views/MediaLibrary'));
const WorkspaceView = lazy(() => import('../Views/WorkspaceView'));

const Dashboard = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [currentView, setCurrentView] = useState('scheduler');
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebarCollapsed');
    return saved ? JSON.parse(saved) : false;
  });
  const [selectedPlatform, setSelectedPlatform] = useState('All');
  const [selectedDate, setSelectedDate] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [posts, setPosts] = useState([]);
  const [showMediaLibrary, setShowMediaLibrary] = useState(false);

  // Persist collapse state to localStorage
  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', JSON.stringify(isPanelCollapsed));
  }, [isPanelCollapsed]);

  // Load posts for analytics
  useEffect(() => {
    if (!user?.uid) return;
    const unsubscribe = postsService.subscribe(user.uid, (postsData) => {
      setPosts(postsData);
    });
    return () => unsubscribe();
  }, [user?.uid]);

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
      <Suspense fallback={<LoadingSpinner />}>
        <SchedulerView
          selectedPlatform={selectedPlatform}
          setSelectedPlatform={setSelectedPlatform}
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
          searchQuery={searchQuery}
          onOpenModal={openModal}
          onOpenMediaLibrary={() => setShowMediaLibrary(true)}
        />
      </Suspense>
    ),
    analytics: (
      <Suspense fallback={<LoadingSpinner />}>
        <AnalyticsView posts={posts} />
      </Suspense>
    ),
    media: (
      <Suspense fallback={<LoadingSpinner />}>
        <MediaLibrary isInline={true} />
      </Suspense>
    ),
    tasks: (
      <Suspense fallback={<LoadingSpinner />}>
        <TasksView searchQuery={searchQuery} />
      </Suspense>
    ),
    templates: (
      <Suspense fallback={<LoadingSpinner />}>
        <TemplatesView onOpenModal={openModal} />
      </Suspense>
    ),
    settings: (
      <Suspense fallback={<LoadingSpinner />}>
        <SettingsView />
      </Suspense>
    ),
    workspace: (
      <Suspense fallback={<LoadingSpinner />}>
        <WorkspaceView />
      </Suspense>
    )
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

      {/* Left Panel - Collapsible */}
      <LeftPanel
        posts={posts}
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
        isCollapsed={isPanelCollapsed}
        onReschedulePost={async (postId, newDate, newTime) => {
          await postsService.update(user.uid, postId, { date: newDate, time: newTime });
        }}
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
          existingPosts={posts}
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
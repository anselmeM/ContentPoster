import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import Sidebar from './Sidebar';
import Header from './Header';
import SchedulerView from '../Views/SchedulerView';
import TasksView from '../Views/TasksView';
import TemplatesView from '../Views/TemplatesView';
import SettingsView from '../Views/SettingsView';
import PostModal from '../Modals/PostModal';

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
      />
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
    </div>
  );
};

export default Dashboard;
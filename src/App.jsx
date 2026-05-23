import { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { TeamProvider } from './context/TeamContext';
import LoginForm from './components/Auth/LoginForm';
import SignupForm from './components/Auth/SignupForm';
import Dashboard from './components/Dashboard/Dashboard';
import LandingPage from './components/Landing/LandingPage';
import LoadingSpinner from './components/UI/LoadingSpinner';
import ToastContainer from './components/UI/ToastContainer';
import { ErrorBoundary } from './components/ErrorBoundary/ErrorBoundary';
import { initNotifications, toast } from './services/notifications';
import { triggerScheduler } from './services/triggerScheduler';

function App() {
  const { user, loading } = useAuth();
  const [showSignup, setShowSignup] = useState(false);
  const [showLanding, setShowLanding] = useState(true);

  // Initialize notifications
  useEffect(() => {
    initNotifications();
  }, []);

  // Network offline/online listeners
  useEffect(() => {
    const handleOffline = () => {
      toast.warning('Offline Mode', 'You are currently offline. Changes will be saved locally.');
    };

    const handleOnline = () => {
      toast.success('Back Online', 'Network restored. Syncing changes...');
    };

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  // Skip link for accessibility
  const skipLink = (
    <a href="#main-content" className="skip-link">
      Skip to main content
    </a>
  );

  if (loading) {
    return (
      <>
        {skipLink}
        <LoadingSpinner />
      </>
    );
  }

  // Auth views - show landing page first for new visitors
  if (!user) {
    // If user was already on the app (coming back), show auth forms directly
    // Otherwise show landing page for marketing
    if (showLanding) {
      return (
        <>
          {skipLink}
          <LandingPage onNavigateToApp={() => setShowLanding(false)} />
        </>
      );
    }
    
    return (
      <>
        {skipLink}
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
          {showSignup ? (
            <SignupForm onSwitchToLogin={() => setShowSignup(false)} />
          ) : (
            <LoginForm onSwitchToSignup={() => setShowSignup(true)} />
          )}
        </div>
      </>
    );
  }

  // Main app - wrap with TeamProvider for collaboration features
  return (
    <ErrorBoundary fallbackMessage="An unexpected error occurred in the application">
      <>
        {skipLink}
        <ToastContainer />
        <TeamProvider>
          <Dashboard />
        </TeamProvider>
      </>
    </ErrorBoundary>
  );
}

export default App;
import { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { TeamProvider } from './context/TeamContext';
import LoginForm from './components/Auth/LoginForm';
import SignupForm from './components/Auth/SignupForm';
import Dashboard from './components/Dashboard/Dashboard';
import LoadingSpinner from './components/UI/LoadingSpinner';
import ToastContainer from './components/UI/ToastContainer';
import { ErrorBoundary } from './components/ErrorBoundary/ErrorBoundary';
import { initNotifications } from './services/notifications';
import { triggerScheduler } from './services/triggerScheduler';

function App() {
  const { user, loading } = useAuth();
  const [showSignup, setShowSignup] = useState(false);

  // Initialize notifications
  useEffect(() => {
    initNotifications();
  }, []);

  // Start trigger scheduler when user logs in
  useEffect(() => {
    if (user) {
      // Start the trigger scheduler with 60 second interval
      triggerScheduler.start(user.uid, 60000);
      
      // Cleanup on unmount or user change
      return () => {
        triggerScheduler.stop();
      };
    }
  }, [user]);

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

  // Auth views
  if (!user) {
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
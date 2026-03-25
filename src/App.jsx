import { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import LoginForm from './components/Auth/LoginForm';
import SignupForm from './components/Auth/SignupForm';
import Dashboard from './components/Dashboard/Dashboard';
import LoadingSpinner from './components/UI/LoadingSpinner';

function App() {
  const { user, loading } = useAuth();
  const [showSignup, setShowSignup] = useState(false);

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

  // Main app
  return (
    <>
      {skipLink}
      <Dashboard />
    </>
  );
}

export default App;
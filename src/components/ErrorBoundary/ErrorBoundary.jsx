import React from 'react';
import clsx from 'clsx';

// Global error boundary for catching React component errors
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ errorInfo });
    
    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      const { fallback: FallbackComponent, fallbackMessage } = this.props;
      
      if (FallbackComponent) {
        return (
          <FallbackComponent 
            error={this.state.error} 
            onRetry={this.handleRetry}
          />
        );
      }
      
      return (
        <ErrorFallback 
          error={this.state.error}
          onRetry={this.handleRetry}
          message={fallbackMessage}
        />
      );
    }

    return this.props.children;
  }
}

// Default error fallback UI
const ErrorFallback = ({ error, onRetry, message }) => {
  return (
    <div className="min-h-[200px] flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
          <i className="fas fa-exclamation-triangle text-2xl text-red-600 dark:text-red-400" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Something went wrong
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          {message || 'An unexpected error occurred. Please try again.'}
        </p>
        {error && (
          <details className="text-left mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <summary className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
              Error Details
            </summary>
            <pre className="mt-2 text-xs text-red-600 dark:text-red-400 overflow-auto max-h-32">
              {error.toString()}
            </pre>
          </details>
        )}
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <i className="fas fa-redo mr-2" />
            Try Again
          </button>
        )}
      </div>
    </div>
  );
};

// HOC to wrap any component with error boundary
export const withErrorBoundary = (Component, errorBoundaryProps = {}) => {
  const WrappedComponent = (props) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );
  
  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  return WrappedComponent;
};

// Hook for handling errors in functional components
export const useErrorHandler = () => {
  const [error, setError] = React.useState(null);
  
  const handleError = React.useCallback((err) => {
    console.error('Hook error:', err);
    setError(err);
  }, []);
  
  const clearError = React.useCallback(() => {
    setError(null);
  }, []);
  
  if (error) {
    throw error;
  }
  
  return { handleError, clearError };
};

// Async error boundary wrapper for handling async operations
export const AsyncErrorBoundary = ({ children, onError }) => {
  const [error, setError] = React.useState(null);
  
  React.useEffect(() => {
    const handleUnhandledRejection = (event) => {
      setError(event.reason);
      if (onError) onError(event.reason);
    };
    
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    return () => window.removeEventListener('unhandledrejection', handleUnhandledRejection);
  }, [onError]);
  
  if (error) {
    return (
      <ErrorFallback 
        error={error} 
        onRetry={() => setError(null)}
        message="An async operation failed"
      />
    );
  }
  
  return children;
};

// Feature-specific error boundaries
export const SchedulerErrorBoundary = ({ children }) => (
  <ErrorBoundary 
    fallbackMessage="Scheduler view encountered an error"
    onError={(err) => console.error('Scheduler error:', err)}
  >
    {children}
  </ErrorBoundary>
);

export const AnalyticsErrorBoundary = ({ children }) => (
  <ErrorBoundary 
    fallbackMessage="Analytics view encountered an error"
    onError={(err) => console.error('Analytics error:', err)}
  >
    {children}
  </ErrorBoundary>
);

export const PostModalErrorBoundary = ({ children }) => (
  <ErrorBoundary 
    fallbackMessage="Post modal encountered an error"
    onError={(err) => console.error('Post modal error:', err)}
  >
    {children}
  </ErrorBoundary>
);

export default ErrorBoundary;
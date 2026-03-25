import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

const LoginForm = ({ onSwitchToSignup }) => {
  const { login, error, clearError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();
    setIsLoading(true);
    
    try {
      await login(email, password);
    } catch (err) {
      // Error is handled by AuthContext
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md dark:bg-gray-800">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Content Cadence</h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Sign in to manage your content schedule</p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="login-email" className="sr-only">Email address</label>
          <input
            id="login-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
            className="input-field dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            placeholder="Email address"
            aria-describedby={error ? 'auth-error' : undefined}
          />
        </div>
        
        <div>
          <label htmlFor="login-password" className="sr-only">Password</label>
          <input
            id="login-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
            className="input-field dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            placeholder="Password"
          />
        </div>
        
        {error && (
          <p id="auth-error" className="text-sm text-center text-red-600" role="alert">
            {error}
          </p>
        )}
        
        <button
          type="submit"
          disabled={isLoading}
          className="btn-primary w-full flex justify-center"
        >
          {isLoading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>
      
      <p className="text-sm text-center text-gray-600 dark:text-gray-400">
        Don't have an account?{' '}
        <button
          onClick={onSwitchToSignup}
          className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
        >
          Sign up
        </button>
      </p>
    </div>
  );
};

export default LoginForm;
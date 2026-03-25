import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

const SignupForm = ({ onSwitchToLogin }) => {
  const { signup, error, clearError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();
    setIsLoading(true);
    
    try {
      await signup(email, password);
    } catch (err) {
      // Error is handled by AuthContext
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md dark:bg-gray-800">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Create Account</h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Get started with Content Cadence</p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="signup-email" className="sr-only">Email address</label>
          <input
            id="signup-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
            className="input-field dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            placeholder="Email address"
          />
        </div>
        
        <div>
          <label htmlFor="signup-password" className="sr-only">Password</label>
          <input
            id="signup-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            required
            minLength={6}
            className="input-field dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            placeholder="Password (min. 6 characters)"
          />
        </div>
        
        {error && (
          <p id="signup-error" className="text-sm text-center text-red-600" role="alert">
            {error}
          </p>
        )}
        
        <button
          type="submit"
          disabled={isLoading}
          className="btn-primary w-full flex justify-center"
        >
          {isLoading ? 'Creating account...' : 'Create Account'}
        </button>
      </form>
      
      <p className="text-sm text-center text-gray-600 dark:text-gray-400">
        Already have an account?{' '}
        <button
          onClick={onSwitchToLogin}
          className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
        >
          Sign in
        </button>
      </p>
    </div>
  );
};

export default SignupForm;
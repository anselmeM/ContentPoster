import { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/firebase';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribe = authService.subscribe((authUser) => {
      setUser(authUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email, password) => {
    try {
      setError(null);
      const user = await authService.login(email, password);
      return user;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const signup = async (email, password) => {
    try {
      setError(null);
      const user = await authService.signup(email, password);
      return user;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const updatePassword = async (currentPassword, newPassword) => {
    try {
      setError(null);
      await authService.updatePassword(currentPassword, newPassword);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const value = {
    user,
    loading,
    error,
    login,
    signup,
    logout,
    updatePassword,
    clearError: () => setError(null)
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
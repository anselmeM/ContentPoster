import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const ThemeContext = createContext(null);

const THEME_KEY = 'content-cadence-theme';
const ACCENT_KEY = 'content-cadence-accent';

// Default accent color palettes
export const ACCENT_PRESETS = {
  indigo: {
    name: 'Indigo',
    primary: '#4f46e5',
    primaryDark: '#4338ca',
    light: '#818cf8',
    dark: '#3730a3'
  },
  blue: {
    name: 'Blue',
    primary: '#2563eb',
    primaryDark: '#1d4ed8',
    light: '#60a5fa',
    dark: '#1e40af'
  },
  green: {
    name: 'Green',
    primary: '#16a34a',
    primaryDark: '#15803d',
    light: '#4ade80',
    dark: '#166534'
  },
  purple: {
    name: 'Purple',
    primary: '#9333ea',
    primaryDark: '#7e22ce',
    light: '#c084fc',
    dark: '#6b21a8'
  },
  pink: {
    name: 'Pink',
    primary: '#db2777',
    primaryDark: '#be185d',
    light: '#f472b6',
    dark: '#9d174d'
  },
  orange: {
    name: 'Orange',
    primary: '#ea580c',
    primaryDark: '#c2410c',
    light: '#fb923c',
    dark: '#9a3412'
  },
  teal: {
    name: 'Teal',
    primary: '#0d9488',
    primaryDark: '#0f766e',
    light: '#2dd4bf',
    dark: '#115e59'
  },
  rose: {
    name: 'Rose',
    primary: '#f43f5e',
    primaryDark: '#e11d48',
    light: '#fb7185',
    dark: '#be123c'
  }
};

export const ThemeProvider = ({ children }) => {
  const [theme, setThemeState] = useState(() => {
    // First check localStorage
    const stored = localStorage.getItem(THEME_KEY);
    if (stored) return stored;
    
    // Then check system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    
    return 'light';
  });

  const [accentColor, setAccentColorState] = useState(() => {
    const stored = localStorage.getItem(ACCENT_KEY);
    return stored && ACCENT_PRESETS[stored] ? stored : 'indigo';
  });

  // Apply accent colors as CSS variables
  useEffect(() => {
    const accent = ACCENT_PRESETS[accentColor];
    const root = document.documentElement;
    
    root.style.setProperty('--color-accent', accent.primary);
    root.style.setProperty('--color-accent-dark', accent.primaryDark);
    root.style.setProperty('--color-accent-light', accent.light);
    root.style.setProperty('--color-accent-dark-mode', accent.dark);
    
    localStorage.setItem(ACCENT_KEY, accentColor);
  }, [accentColor]);

  useEffect(() => {
    // Update document class and localStorage when theme changes
    const root = document.documentElement;
    
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    
    localStorage.setItem(THEME_KEY, theme);
    
    // Listen for system preference changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => {
      // Only auto-switch if user hasn't manually set a preference
      if (!localStorage.getItem(THEME_KEY)) {
        setThemeState(e.matches ? 'dark' : 'light');
      }
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setThemeState(prev => prev === 'light' ? 'dark' : 'light');
  }, []);

  const changeTheme = useCallback((newTheme) => {
    setThemeState(newTheme);
    localStorage.setItem(THEME_KEY, newTheme);
  }, []);

  const setAccentColor = useCallback((color) => {
    if (ACCENT_PRESETS[color]) {
      setAccentColorState(color);
    }
  }, []);

  const value = {
    theme,
    isDark: theme === 'dark',
    toggleTheme,
    setTheme: changeTheme,
    accentColor,
    setAccentColor,
    accentPresets: ACCENT_PRESETS
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export default ThemeContext;
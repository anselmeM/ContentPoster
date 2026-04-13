import { useEffect, useState, useCallback } from 'react';

/**
 * Dynamic color utility hook
 * Provides theme-aware color values that respond to accent color changes
 */
export const useAccentColors = () => {
  const [colors, setColors] = useState({
    primary: 'bg-indigo-600',
    primaryDark: 'bg-indigo-700',
    primaryLight: 'bg-indigo-500',
    text: 'text-indigo-600',
    textLight: 'text-indigo-500',
    border: 'border-indigo-600',
    ring: 'ring-indigo-500',
    hover: 'hover:bg-indigo-700',
    focus: 'focus:ring-indigo-500',
    from: 'from-indigo-500',
    via: 'via-indigo-500',
    to: 'to-indigo-600'
  });

  const updateColors = useCallback((accentPreset) => {
    if (!accentPreset) return;

    // Map accent preset names to Tailwind color classes
    const colorMap = {
      indigo: { primary: 'indigo', primaryDark: 'indigo-700', primaryLight: 'indigo-500', blue: 'blue', green: 'green', purple: 'purple', pink: 'pink', orange: 'orange', teal: 'teal', rose: 'rose' },
      blue: { primary: 'blue', primaryDark: 'blue-700', primaryLight: 'blue-500', blue: 'blue', green: 'green', purple: 'purple', pink: 'pink', orange: 'orange', teal: 'teal', rose: 'rose' },
      green: { primary: 'green', primaryDark: 'green-700', primaryLight: 'green-500', blue: 'blue', green: 'green', purple: 'purple', pink: 'pink', orange: 'orange', teal: 'teal', rose: 'rose' },
      purple: { primary: 'purple', primaryDark: 'purple-700', primaryLight: 'purple-500', blue: 'blue', green: 'green', purple: 'purple', pink: 'pink', orange: 'orange', teal: 'teal', rose: 'rose' },
      pink: { primary: 'pink', primaryDark: 'pink-700', primaryLight: 'pink-500', blue: 'blue', green: 'green', purple: 'purple', pink: 'pink', orange: 'orange', teal: 'teal', rose: 'rose' },
      orange: { primary: 'orange', primaryDark: 'orange-700', primaryLight: 'orange-500', blue: 'blue', green: 'green', purple: 'purple', pink: 'pink', orange: 'orange', teal: 'teal', rose: 'rose' },
      teal: { primary: 'teal', primaryDark: 'teal-700', primaryLight: 'teal-500', blue: 'blue', green: 'green', purple: 'purple', pink: 'pink', orange: 'orange', teal: 'teal', rose: 'rose' },
      rose: { primary: 'rose', primaryDark: 'rose-700', primaryLight: 'rose-500', blue: 'blue', green: 'green', purple: 'purple', pink: 'pink', orange: 'orange', teal: 'teal', rose: 'rose' }
    };

    const map = colorMap[accentPreset] || colorMap.indigo;

    setColors({
      primary: `bg-${map.primary}-600`,
      primaryDark: `bg-${map.primaryDark}`,
      primaryLight: `bg-${map.primaryLight}`,
      text: `text-${map.primary}-600`,
      textLight: `text-${map.primary}-500`,
      border: `border-${map.primary}-600`,
      ring: `ring-${map.primary}-500`,
      hover: `hover:bg-${map.primaryDark}`,
      focus: `focus:ring-${map.primary}-500`,
      from: `from-${map.primary}-500`,
      via: `via-${map.primary}-500`,
      to: `to-${map.primaryDark}`
    });
  }, []);

  return { colors, updateColors };
};

/**
 * Hook to get computed accent colors from CSS variables
 * Returns actual color hex values for inline styles
 */
export const useAccentHex = () => {
  const [accentColors, setAccentColors] = useState({
    primary: '#4f46e5',
    primaryDark: '#4338ca',
    light: '#818cf8',
    dark: '#3730a3'
  });

  useEffect(() => {
    const root = document.documentElement;
    
    const updateHex = () => {
      const primary = getComputedStyle(root).getPropertyValue('--color-accent').trim() || '#4f46e5';
      const primaryDark = getComputedStyle(root).getPropertyValue('--color-accent-dark').trim() || '#4338ca';
      const light = getComputedStyle(root).getPropertyValue('--color-accent-light').trim() || '#818cf8';
      const dark = getComputedStyle(root).getPropertyValue('--color-accent-dark-mode').trim() || '#3730a3';
      
      setAccentColors({ primary, primaryDark, light, dark });
    };

    // Initial read
    updateHex();

    // Watch for changes
    const observer = new MutationObserver(updateHex);
    observer.observe(root, { attributes: true, attributeFilter: ['style'] });

    return () => observer.disconnect();
  }, []);

  return accentColors;
};

/**
 * Utility to generate inline style for accent-colored elements
 */
export const getAccentStyle = (type = 'primary', isDark = false) => {
  const styleMap = {
    primary: { backgroundColor: 'var(--color-accent, #4f46e5)' },
    primaryDark: { backgroundColor: 'var(--color-accent-dark, #4338ca)' },
    text: { color: 'var(--color-accent, #4f46e5)' },
    border: { borderColor: 'var(--color-accent, #4f46e5)' },
    ring: { 
      '--tw-ring-color': 'var(--color-accent, #4f46e5)',
    },
    gradient: {
      background: `linear-gradient(to right, var(--color-accent-light, #818cf8), var(--color-accent, #4f46e5))`
    }
  };
  
  return styleMap[type] || styleMap.primary;
};

export default useAccentColors;

import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Custom hook for debouncing values
 * @param {*} value - Value to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {*} Debounced value
 */
export const useDebounce = (value, delay = 300) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
};

/**
 * Custom hook for debouncing callback functions
 * @param {Function} callback - Callback function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} Debounced callback
 */
export const useDebouncedCallback = (callback, delay = 300) => {
  const timeoutRef = useRef(null);

  const debouncedCallback = useCallback((...args) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      callback(...args);
    }, delay);
  }, [callback, delay]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return debouncedCallback;
};

/**
 * Custom hook for throttling callback functions
 * @param {Function} callback - Callback function to throttle
 * @param {number} limit - Time limit in milliseconds
 * @returns {Function} Throttled callback
 */
export const useThrottledCallback = (callback, limit = 100) => {
  const inThrottleRef = useRef(false);

  const throttledCallback = useCallback((...args) => {
    if (!inThrottleRef.current) {
      callback(...args);
      inThrottleRef.current = true;
      setTimeout(() => {
        inThrottleRef.current = false;
      }, limit);
    }
  }, [callback, limit]);

  return throttledCallback;
};

/**
 * Custom hook for local storage persistence
 * @param {string} key - Storage key
 * @param {*} initialValue - Initial value
 * @returns {[*, Function]} Stored value and setter
 */
export const useLocalStorage = (key, initialValue) => {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return initialValue;
    }
  });

  const setValue = useCallback((value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error('Error writing to localStorage:', error);
    }
  }, [key, storedValue]);

  return [storedValue, setValue];
};

/**
 * Custom hook for interval management
 * @param {Function} callback - Callback to run
 * @param {number} delay - Delay in milliseconds (null to stop)
 */
export const useInterval = (callback, delay) => {
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (delay !== null) {
      const id = setInterval(() => savedCallback.current(), delay);
      return () => clearInterval(id);
    }
  }, [delay]);
};

/**
 * Custom hook for previous value
 * @param {*} value - Current value
 * @returns {*} Previous value
 */
export const usePrevious = (value) => {
  const ref = useRef();

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref.current;
};

/**
 * Custom hook for click outside detection
 * @param {React.RefObject} ref - React ref object
 * @param {Function} handler - Callback when click outside
 */
export const useClickOutside = (ref, handler) => {
  useEffect(() => {
    const listener = (event) => {
      if (!ref.current || ref.current.contains(event.target)) {
        return;
      }
      handler(event);
    };

    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);

    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [ref, handler]);
};

/**
 * Custom hook for window size
 * @returns {{width: number, height: number}} Window dimensions
 */
export const useWindowSize = () => {
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return windowSize;
};

/**
 * Custom hook for async operations with loading state
 * @param {Function} asyncFunction - Async function to execute
 * @returns {Object} { execute, loading, error, data }
 */
export const useAsync = (asyncFunction) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  const execute = useCallback(async (...args) => {
    setLoading(true);
    setError(null);
    try {
      const result = await asyncFunction(...args);
      setData(result);
      return result;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [asyncFunction]);

  return { execute, loading, error, data };
};

/**
 * Custom hook for keyboard shortcuts
 * @param {Object} keyMap - Map of keys to callbacks
 * @param {Object} options - Options for the hook
 */
export const useKeyboardShortcut = (keyMap, options = {}) => {
  const { ctrl = false, shift = false, alt = false, meta = false } = options;

  useEffect(() => {
    const handleKeyDown = (event) => {
      const key = event.key.toLowerCase();
      
      Object.keys(keyMap).forEach((shortcutKey) => {
        const [shortcutCtrl, shortcutShift, shortcutAlt, shortcutMeta, shortcutKeyPart] = 
          shortcutKey.split('+').map(k => k.toLowerCase());
        
        const ctrlMatch = shortcutCtrl === 'ctrl' ? ctrl : true;
        const shiftMatch = shortcutShift === 'shift' ? shift : true;
        const altMatch = shortcutAlt === 'alt' ? alt : true;
        const metaMatch = shortcutMeta === 'meta' ? meta : true;
        const keyMatch = key === shortcutKeyPart;

        if (ctrlMatch && shiftMatch && altMatch && metaMatch && keyMatch) {
          event.preventDefault();
          keyMap[shortcutKey](event);
        }
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [keyMap, ctrl, shift, alt, meta]);
};

export default {
  useDebounce,
  useDebouncedCallback,
  useThrottledCallback,
  useLocalStorage,
  useInterval,
  usePrevious,
  useClickOutside,
  useWindowSize,
  useAsync,
  useKeyboardShortcut
};
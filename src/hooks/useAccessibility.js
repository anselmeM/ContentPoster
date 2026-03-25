import { useEffect, useCallback, useRef, useState } from 'react';

/**
 * Focus Trap Hook
 * Traps focus within a container element (modal, dialog)
 * Returns focus to the previously focused element on cleanup
 */
export const useFocusTrap = (isActive = true) => {
  const containerRef = useRef(null);
  const previousFocus = useRef(null);
  const selector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

  useEffect(() => {
    if (!isActive) return;

    // Store the currently focused element
    previousFocus.current = document.activeElement;

    // Focus the first focusable element in the container
    const container = containerRef.current;
    if (container) {
      const firstFocusable = container.querySelector(selector);
      if (firstFocusable) {
        firstFocusable.focus();
      }
    }

    // Handle tab key to trap focus
    const handleKeyDown = (e) => {
      if (e.key !== 'Tab') return;

      const container = containerRef.current;
      if (!container) return;

      const focusableElements = container.querySelectorAll(selector);
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement || document.activeElement === container) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement || document.activeElement === container) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    // Cleanup: restore focus to previous element
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      if (previousFocus.current && typeof previousFocus.current.focus === 'function') {
        previousFocus.current.focus();
      }
    };
  }, [isActive, selector]);

  return containerRef;
};

/**
 * Focus Restore Hook
 * Manages focus restoration when returning from modal/views
 */
export const useFocusRestore = (trigger) => {
  const previousFocus = useRef(null);

  const saveFocus = useCallback(() => {
    previousFocus.current = document.activeElement;
  }, []);

  const restoreFocus = useCallback(() => {
    if (previousFocus.current && typeof previousFocus.current.focus === 'function') {
      previousFocus.current.focus();
    }
  }, []);

  useEffect(() => {
    if (trigger) {
      saveFocus();
    } else {
      restoreFocus();
    }
  }, [trigger, saveFocus, restoreFocus]);

  return { saveFocus, restoreFocus };
};

/**
 * Live Region Hook
 * Manages ARIA live regions for dynamic content
 */
export const useLiveRegion = ({ politeness = 'polite', atomic = true } = {}) => {
  const [message, setMessage] = useState('');
  const regionRef = useRef(null);

  // Clear message after it's announced
  useEffect(() => {
    if (message && regionRef.current) {
      const timer = setTimeout(() => {
        setMessage('');
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const announce = useCallback((msg) => {
    setMessage(msg);
  }, []);

  return { announce, message, regionRef, politeness, atomic };
};

/**
 * Keyboard Shortcut Hook
 * Registers keyboard shortcuts for improved accessibility
 */
export const useKeyboardShortcut = (key, callback, options = {}) => {
  const { ctrl = false, shift = false, alt = false, meta = false } = options;

  useEffect(() => {
    const handleKeyDown = (e) => {
      const ctrlMatch = ctrl ? (e.ctrlKey || e.metaKey) : true;
      const shiftMatch = shift ? e.shiftKey : !e.shiftKey;
      const altMatch = alt ? e.altKey : !e.altKey;
      const metaMatch = meta ? e.metaKey : !e.metaKey;

      if (e.key.toLowerCase() === key.toLowerCase() && ctrlMatch && shiftMatch && altMatch && metaMatch) {
        e.preventDefault();
        callback(e);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [key, callback, ctrl, shift, alt, meta]);
};

/**
 * Scroll into View Hook
 * Ensures focused elements are visible in scrollable containers
 */
export const useScrollIntoView = (containerRef, deps = []) => {
  useEffect(() => {
    const container = containerRef?.current;
    const activeElement = document.activeElement;

    if (container && activeElement && container.contains(activeElement)) {
      activeElement.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'nearest'
      });
    }
  }, [...deps]);
};

export default useFocusTrap;

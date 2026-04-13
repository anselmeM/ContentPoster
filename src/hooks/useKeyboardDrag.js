import { useCallback, useState, useEffect } from 'react';

/**
 * Custom hook for keyboard-driven drag-and-drop functionality
 * Provides complete keyboard accessibility for sortable grids
 */
export const useKeyboardDragAndDrop = ({
  items,
  onMove,
  getPosition,
  sensitivity = 10
}) => {
  const [activeId, setActiveId] = useState(null);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  // Keyboard event handler
  const handleKeyDown = useCallback((event, containerRef) => {
    const { key, shiftKey, ctrlKey, metaKey } = event;
    const currentItems = items || [];
    
    // Don't handle if no items
    if (currentItems.length === 0) return;

    // Navigation keys
    const isArrowUp = key === 'ArrowUp';
    const isArrowDown = key === 'ArrowDown';
    const isArrowLeft = key === 'ArrowLeft';
    const isArrowRight = key === 'ArrowRight';
    const isEnter = key === 'Enter';
    const isSpace = key === ' ';
    const isEscape = key === 'Escape';
    const isHome = key === 'Home';
    const isEnd = key === 'End';

    // Start drag with Enter or Space
    if ((isEnter || isSpace) && !isDragging && focusedIndex < currentItems.length) {
      event.preventDefault();
      setActiveId(currentItems[focusedIndex].id);
      setIsDragging(true);
      return;
    }

    // Cancel drag with Escape
    if (isEscape && isDragging) {
      event.preventDefault();
      setActiveId(null);
      setIsDragging(false);
      return;
    }

    // Navigation within items
    if (!isDragging) {
      let newIndex = focusedIndex;

      if (isArrowUp || isArrowDown || isArrowLeft || isArrowRight) {
        event.preventDefault();

        // Get grid dimensions
        const columns = getPosition ? 5 : 1; // Default to 5 columns for week view

        if (isArrowUp) {
          newIndex = Math.max(0, focusedIndex - columns);
        } else if (isArrowDown) {
          newIndex = Math.min(currentItems.length - 1, focusedIndex + columns);
        } else if (isArrowLeft && !shiftKey) {
          newIndex = Math.max(0, focusedIndex - 1);
        } else if (isArrowRight && !shiftKey) {
          newIndex = Math.min(currentItems.length - 1, focusedIndex + 1);
        } else if (isArrowLeft && shiftKey) {
          // Jump to start of row
          const rowStart = Math.floor(focusedIndex / columns) * columns;
          newIndex = rowStart;
        } else if (isArrowRight && shiftKey) {
          // Jump to end of row
          const rowStart = Math.floor(focusedIndex / columns) * columns;
          const rowEnd = Math.min(currentItems.length - 1, rowStart + columns - 1);
          newIndex = rowEnd;
        }

        setFocusedIndex(newIndex);

        // Update focus in DOM
        const items = containerRef?.current?.querySelectorAll('[data-draggable]');
        if (items && items[newIndex]) {
          items[newIndex].focus();
        }
      }

      // Jump to first item
      if (isHome) {
        event.preventDefault();
        setFocusedIndex(0);
      }

      // Jump to last item
      if (isEnd) {
        event.preventDefault();
        setFocusedIndex(currentItems.length - 1);
      }

      return;
    }

    // During drag - move between columns/days
    if (isDragging && activeId) {
      if (isArrowLeft || isArrowRight || isArrowUp || isArrowDown) {
        event.preventDefault();

        // Find current position and target position
        const currentIndex = currentItems.findIndex(item => item.id === activeId);
        const columns = getPosition ? 5 : 1;
        
        let targetIndex = currentIndex;
        let targetPosition = null;

        if (isArrowLeft) {
          targetIndex = Math.max(0, currentIndex - 1);
        } else if (isArrowRight) {
          targetIndex = Math.min(currentItems.length - 1, currentIndex + 1);
        } else if (isArrowUp) {
          targetIndex = Math.max(0, currentIndex - columns);
        } else if (isArrowDown) {
          targetIndex = Math.min(currentItems.length - 1, currentIndex + 1);
        }

        if (targetIndex !== currentIndex && onMove) {
          const targetItem = currentItems[targetIndex];
          if (targetItem) {
            // Get position info for the move
            targetPosition = getPosition ? getPosition(targetItem) : targetIndex;
            onMove(activeId, targetItem.id, targetPosition);
          }
        }

        setAnnouncement(`Moved to position ${targetIndex + 1} of ${currentItems.length}`);
      }
    }
  }, [items, focusedIndex, isDragging, activeId, onMove, getPosition]);

  // Announce status for screen readers
  const [announcement, setAnnouncement] = useState('');

  const announce = useCallback((message) => {
    setAnnouncement(message);
  }, []);

  // Reset state when items change
  useEffect(() => {
    if (items && focusedIndex >= items.length) {
      setFocusedIndex(Math.max(0, items.length - 1));
    }
  }, [items, focusedIndex]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      setActiveId(null);
      setIsDragging(false);
    };
  }, []);

  return {
    handleKeyDown,
    activeId,
    focusedIndex,
    isDragging,
    announcement,
    setFocusedIndex,
    setActiveId,
    setIsDragging,
    announce
  };
};

// Hook for managing focus within a container
export const useFocusManagement = (containerRef) => {
  const [focusedElement, setFocusedElement] = useState(null);

  const focusFirst = useCallback(() => {
    const first = containerRef?.current?.querySelector('[data-draggable], [tabindex]');
    if (first) {
      first.focus();
      setFocusedElement(first);
    }
  }, [containerRef]);

  const focusLast = useCallback(() => {
    const elements = containerRef?.current?.querySelectorAll('[data-draggable], [tabindex]');
    if (elements && elements.length > 0) {
      elements[elements.length - 1].focus();
      setFocusedElement(elements[elements.length - 1]);
    }
  }, [containerRef]);

  const focusNext = useCallback(() => {
    const elements = Array.from(containerRef?.current?.querySelectorAll('[data-draggable], [tabindex]') || []);
    if (elements.length === 0) return;

    const currentIndex = focusedElement 
      ? elements.indexOf(focusedElement)
      : -1;
    
    const nextIndex = (currentIndex + 1) % elements.length;
    elements[nextIndex].focus();
    setFocusedElement(elements[nextIndex]);
  }, [containerRef, focusedElement]);

  const focusPrevious = useCallback(() => {
    const elements = Array.from(containerRef?.current?.querySelectorAll('[data-draggable], [tabindex]') || []);
    if (elements.length === 0) return;

    const currentIndex = focusedElement 
      ? elements.indexOf(focusedElement)
      : 0;
    
    const prevIndex = currentIndex <= 0 ? elements.length - 1 : currentIndex - 1;
    elements[prevIndex].focus();
    setFocusedElement(elements[prevIndex]);
  }, [containerRef, focusedElement]);

  return {
    focusedElement,
    setFocusedElement,
    focusFirst,
    focusLast,
    focusNext,
    focusPrevious
  };
};

export default useKeyboardDragAndDrop;

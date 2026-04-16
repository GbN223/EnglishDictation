import { useEffect, useCallback, useRef } from 'react';

export interface KeyboardShortcutActions {
  onPlayPause?: () => void;
  onSubmit?: () => void;
  onReplay?: () => void;
  onHint?: () => void;
  onNavigateUp?: () => void;
  onNavigateDown?: () => void;
}

interface ToastNotification {
  message: string;
  icon?: string;
}

/**
 * Custom hook for global keyboard shortcuts
 * Only activates when no input field is focused (except for navigation)
 */
export function useKeyboardShortcuts(actions: KeyboardShortcutActions) {
  const actionsRef = useRef(actions);
  actionsRef.current = actions;

  const showToast = useCallback((notification: ToastNotification) => {
    // Create a temporary toast element
    const toast = document.createElement('div');
    toast.className = 'fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-4 py-2 rounded-lg shadow-lg z-50 text-sm font-medium animate-fade-in';
    toast.textContent = `${notification.icon || ''} ${notification.message}`;
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.remove();
    }, 2000);
  }, []);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    const target = event.target as HTMLElement;
    const isInputFocused = 
      target.tagName === 'INPUT' || 
      target.tagName === 'TEXTAREA' || 
      target.isContentEditable;

    const actions = actionsRef.current;

    // Space: Toggle Play/Pause (only when not typing in an input)
    if (event.code === 'Space' && !isInputFocused) {
      event.preventDefault();
      if (actions.onPlayPause) {
        actions.onPlayPause();
        showToast({ message: 'Playing/Paused', icon: '⏯️' });
      }
      return;
    }

    // Ctrl+Space: Toggle Play/Pause (works even when input is focused)
    if (event.code === 'Space' && event.ctrlKey && isInputFocused) {
      event.preventDefault();
      if (actions.onPlayPause) {
        actions.onPlayPause();
        showToast({ message: 'Playing/Paused', icon: '⏯️' });
      }
      return;
    }

    // Enter or Ctrl+Enter: Submit/Check Answers
    if ((event.key === 'Enter' || (event.key === 'Enter' && event.ctrlKey))) {
      // Only trigger if we're in a context where submit makes sense
      if (actions.onSubmit) {
        event.preventDefault();
        actions.onSubmit();
        showToast({ message: 'Submitted', icon: '✅' });
        return;
      }
    }

    // R: Replay current sentence/block
    if (event.key === 'r' || event.key === 'R') {
      if (!isInputFocused && actions.onReplay) {
        event.preventDefault();
        actions.onReplay();
        showToast({ message: 'Replaying', icon: '🔁' });
        return;
      }
    }

    // H: Show Hint for currently focused input
    if (event.key === 'h' || event.key === 'H') {
      if (isInputFocused && actions.onHint) {
        event.preventDefault();
        actions.onHint();
        showToast({ message: 'Hint shown', icon: '💡' });
        return;
      }
    }

    // Arrow Up: Navigate between input fields
    if (event.key === 'ArrowUp') {
      if (isInputFocused && actions.onNavigateUp) {
        event.preventDefault();
        actions.onNavigateUp();
        return;
      }
    }

    // Arrow Down: Navigate between input fields
    if (event.key === 'ArrowDown') {
      if (isInputFocused && actions.onNavigateDown) {
        event.preventDefault();
        actions.onNavigateDown();
        return;
      }
    }
  }, [showToast]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
}

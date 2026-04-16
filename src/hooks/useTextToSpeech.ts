import { useState, useCallback, useEffect, useRef } from 'react';
import { useDictationStore } from '../store/dictationStore';
import { getLanguage } from '../config/languages';

/**
 * A mock audio element ref for Web Speech API that provides timeupdate events
 */
export interface SpeechAudioRef {
  current: {
    currentTime: number;
    addEventListener: (event: string, handler: () => void) => void;
    removeEventListener: (event: string, handler: () => void) => void;
  } | null;
}

export function useTextToSpeech() {
  const { selectedLanguage, practiceSpeed, isPlaying, setPlaying } = useDictationStore();
  const [isSupported, setIsSupported] = useState(false);
  const currentTimeRef = useRef<number>(0);
  const timeUpdateHandlersRef = useRef<Set<() => void>>(new Set());
  const seekedHandlersRef = useRef<Set<() => void>>(new Set());
  const timerRef = useRef<number | null>(null);

  // Create a mock audio element ref that mimics HTMLAudioElement behavior
  const audioRef = useRef<{
    currentTime: number;
    addEventListener: (event: string, handler: () => void) => void;
    removeEventListener: (event: string, handler: () => void) => void;
  } | null>({
    currentTime: 0,
    addEventListener: (event: string, handler: () => void) => {
      if (event === 'timeupdate') {
        timeUpdateHandlersRef.current.add(handler);
      } else if (event === 'seeked') {
        seekedHandlersRef.current.add(handler);
      }
    },
    removeEventListener: (event: string, handler: () => void) => {
      if (event === 'timeupdate') {
        timeUpdateHandlersRef.current.delete(handler);
      } else if (event === 'seeked') {
        seekedHandlersRef.current.delete(handler);
      }
    },
  });

  useEffect(() => {
    // Check if speech synthesis is supported
    if ('speechSynthesis' in window) {
      setIsSupported(true);
    }
  }, []);

  // Start/stop time tracking timer when playing state changes
  useEffect(() => {
    if (isPlaying) {
      // Start tracking time
      const startTime = Date.now();
      const startOffset = currentTimeRef.current;
      
      timerRef.current = window.setInterval(() => {
        const elapsed = (Date.now() - startTime) / 1000;
        currentTimeRef.current = startOffset + elapsed;
        
        // Update the mock audio element's currentTime
        if (audioRef.current) {
          audioRef.current.currentTime = currentTimeRef.current;
        }
        
        // Fire timeupdate handlers
        timeUpdateHandlersRef.current.forEach((handler) => handler());
      }, 100); // Update every 100ms
    } else {
      // Stop tracking time
      if (timerRef.current !== null) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current !== null) {
        clearInterval(timerRef.current);
      }
    };
  }, [isPlaying]);

  const speak = useCallback((text: string) => {
    if (!('speechSynthesis' in window) || !text) {
      return;
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();
    
    // Reset time tracking
    currentTimeRef.current = 0;
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    const lang = getLanguage(selectedLanguage);

    // Set language
    utterance.lang = lang?.speechCode || 'en-US';

    // Convert WPM to rate (1.0 is normal speed)
    // Average speaking rate is ~150 WPM
    utterance.rate = Math.max(0.5, Math.min(2, practiceSpeed / 150));
    utterance.pitch = 1;
    utterance.volume = 1;

    // Try to find a voice for the selected language
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(
      (v) => v.lang.startsWith(lang?.speechCode.split('-')[0] || 'en')
    );

    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.onstart = () => {
      setPlaying(true);
    };

    utterance.onend = () => {
      setPlaying(false);
      currentTimeRef.current = 0;
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
      }
    };

    utterance.onerror = () => {
      setPlaying(false);
    };

    window.speechSynthesis.speak(utterance);
  }, [selectedLanguage, practiceSpeed, setPlaying]);

  const stop = useCallback(() => {
    window.speechSynthesis.cancel();
    setPlaying(false);
    currentTimeRef.current = 0;
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
    }
  }, [setPlaying]);

  const pause = useCallback(() => {
    window.speechSynthesis.pause();
    setPlaying(false);
  }, [setPlaying]);

  const resume = useCallback(() => {
    window.speechSynthesis.resume();
    setPlaying(true);
  }, [setPlaying]);

  // Load voices (they load asynchronously in some browsers)
  useEffect(() => {
    const handleVoicesChanged = () => {
      // Voices are loaded, ready to use
    };

    window.speechSynthesis.addEventListener('voiceschanged', handleVoicesChanged);

    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged);
      window.speechSynthesis.cancel();
      if (timerRef.current !== null) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  return {
    speak,
    stop,
    pause,
    resume,
    isSupported,
    isPlaying,
    audioRef,
  };
}

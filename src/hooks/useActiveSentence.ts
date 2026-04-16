import { useEffect, useState, useRef } from 'react';

export interface SentenceTimestamp {
  id: number | string;
  start_time: number;
  end_time: number;
}

/**
 * Custom hook to track the currently active sentence based on audio playback time.
 * Syncs audio timeupdate events with sentence timestamps to determine which sentence is playing.
 * 
 * @param audioRef - Reference to the HTMLAudioElement
 * @param sentences - Array of sentences with their timestamp information
 * @returns The ID of the currently active sentence, or null if none is active
 */
export function useActiveSentence(
  audioRef: React.RefObject<{ currentTime: number; addEventListener: (event: string, handler: () => void) => void; removeEventListener: (event: string, handler: () => void) => void } | null>,
  sentences: SentenceTimestamp[]
): string | number | null {
  const [activeSentenceId, setActiveSentenceId] = useState<string | number | null>(null);
  const lastScrollTimeRef = useRef<number>(0);
  const SCROLL_THROTTLE_MS = 500; // Minimum time between auto-scrolls

  useEffect(() => {
    const el = audioRef.current;
    if (!el || sentences.length === 0) {
      setActiveSentenceId(null);
      return;
    }

    const handleTimeUpdate = () => {
      const currentTime = el.currentTime;
      
      // Find the sentence that contains the current time
      const activeSentence = sentences.find(
        (sentence) => currentTime >= sentence.start_time && currentTime <= sentence.end_time
      );

      const newActiveId = activeSentence?.id ?? null;
      
      // Only update state if the active sentence changed
      if (newActiveId !== activeSentenceId) {
        setActiveSentenceId(newActiveId);

        // Auto-scroll to keep the active sentence centered
        if (newActiveId !== null) {
          const now = Date.now();
          // Throttle scroll to avoid excessive scrolling during rapid sentence changes
          if (now - lastScrollTimeRef.current > SCROLL_THROTTLE_MS) {
            lastScrollTimeRef.current = now;
            
            // Find the element for this sentence and scroll it into view
            requestAnimationFrame(() => {
              const element = document.querySelector(`[data-sentence-id="${newActiveId}"]`);
              if (element) {
                element.scrollIntoView({
                  behavior: 'smooth',
                  block: 'center',
                });
              }
            });
          }
        }
      }
    };

    el.addEventListener('timeupdate', handleTimeUpdate);
    
    // Also listen to seeked event for when user manually seeks
    el.addEventListener('seeked', handleTimeUpdate);

    return () => {
      el.removeEventListener('timeupdate', handleTimeUpdate);
      el.removeEventListener('seeked', handleTimeUpdate);
    };
  }, [audioRef, sentences, activeSentenceId]);

  return activeSentenceId;
}

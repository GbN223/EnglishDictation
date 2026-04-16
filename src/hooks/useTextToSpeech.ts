import { useState, useCallback, useEffect } from 'react';
import { useDictationStore } from '../store/dictationStore';
import { getLanguage } from '../config/languages';

export function useTextToSpeech() {
  const { selectedLanguage, practiceSpeed, isPlaying, setPlaying } = useDictationStore();
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    // Check if speech synthesis is supported
    if ('speechSynthesis' in window) {
      setIsSupported(true);
    }
  }, []);

  const speak = useCallback((text: string) => {
    if (!('speechSynthesis' in window) || !text) {
      return;
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

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
    };

    utterance.onerror = () => {
      setPlaying(false);
    };

    window.speechSynthesis.speak(utterance);
  }, [selectedLanguage, practiceSpeed, setPlaying]);

  const stop = useCallback(() => {
    window.speechSynthesis.cancel();
    setPlaying(false);
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
    };
  }, []);

  return {
    speak,
    stop,
    pause,
    resume,
    isSupported,
    isPlaying,
  };
}

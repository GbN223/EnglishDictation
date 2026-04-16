import { useState, useCallback, useRef, useEffect } from 'react';

export interface ShadowRecognitionResult {
  isListening: boolean;
  interimTranscript: string;
  finalTranscript: string;
  accuracy: number | null;
  error: string | null;
  isSupported: boolean;
}

export interface UseShadowRecognitionOptions {
  lang?: string;
  onResult?: (transcript: string) => void;
  onError?: (error: string) => void;
}

/**
 * Custom hook for speech recognition in Shadow Reading Mode
 * Uses native Web Speech API with continuous: false for single phrase capture
 */
export function useShadowRecognition(options: UseShadowRecognitionOptions = {}): [
  ShadowRecognitionResult,
  {
    startListening: () => void;
    stopListening: () => void;
    reset: () => void;
  }
] {
  const { lang = 'en-US', onResult, onError } = options;

  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [finalTranscript, setFinalTranscript] = useState('');
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const isListeningRef = useRef(false);

  // Check if Speech Recognition is supported
  const isSupported = typeof window !== 'undefined' && 
    (window.SpeechRecognition || window.webkitSpeechRecognition);

  const startListening = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      const errorMsg = 'Shadow Mode requires Chrome, Edge, or Safari. Speech recognition is not supported in this browser.';
      setError(errorMsg);
      onError?.(errorMsg);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      
      recognition.lang = lang;
      recognition.continuous = false;  // Stop after one sentence/phrase
      recognition.interimResults = true;  // Show real-time transcription
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        isListeningRef.current = true;
        setIsListening(true);
        setInterimTranscript('');
        setFinalTranscript('');
        setAccuracy(null);
        setError(null);
      };

      recognition.onresult = (event: any) => {
        let interim = '';
        let final = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          const transcript = result[0].transcript;

          if (result.isFinal) {
            final += transcript;
          } else {
            interim += transcript;
          }
        }

        setInterimTranscript(interim);
        
        if (final) {
          setFinalTranscript(final);
          onResult?.(final);
        }
      };

      recognition.onerror = (event: any) => {
        console.error('Shadow recognition error:', event.error);

        let errorMsg = '';
        switch (event.error) {
          case 'not-allowed':
            errorMsg = 'Microphone access denied. Please allow microphone permission and try again.';
            break;
          case 'no-microphone':
            errorMsg = 'No microphone detected. Please connect a microphone and try again.';
            break;
          case 'network':
            errorMsg = 'Network error. Speech recognition requires an internet connection.';
            break;
          case 'no-speech':
            errorMsg = 'No speech detected. Please try speaking again.';
            break;
          case 'aborted':
            // User aborted, don't show error
            return;
          default:
            errorMsg = `Speech recognition error: ${event.error}`;
        }

        setError(errorMsg);
        onError?.(errorMsg);
        setIsListening(false);
        isListeningRef.current = false;
      };

      recognition.onend = () => {
        isListeningRef.current = false;
        setIsListening(false);
        setInterimTranscript('');
      };

      recognition.start();
      recognitionRef.current = recognition;
    } catch (err) {
      const errorMsg = 'Failed to start speech recognition. Please try again.';
      setError(errorMsg);
      onError?.(errorMsg);
    }
  }, [lang, onResult, onError]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    isListeningRef.current = false;
    setIsListening(false);
    setInterimTranscript('');
  }, []);

  const reset = useCallback(() => {
    stopListening();
    setFinalTranscript('');
    setInterimTranscript('');
    setAccuracy(null);
    setError(null);
  }, [stopListening]);

  // Update accuracy when final transcript is set
  useEffect(() => {
    if (finalTranscript) {
      // Accuracy will be calculated by the parent component
      // This hook just provides the transcript
    }
  }, [finalTranscript]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
    };
  }, []);

  return [
    {
      isListening,
      interimTranscript,
      finalTranscript,
      accuracy,
      error,
      isSupported,
    },
    {
      startListening,
      stopListening,
      reset,
    },
  ];
}

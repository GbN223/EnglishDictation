import { useEffect, useRef, useCallback } from 'react';
import { useDictationStore } from '../store/dictationStore';
import { getLanguage } from '../config/languages';
import { processVoiceCommand } from '../utils/voiceCommands';
import { SpeechRecognitionError } from '../types';

export function useSpeechRecognition() {
  const {
    selectedLanguage,
    dictationStatus,
    setDictationStatus,
    setCurrentText,
    setInterimText,
    addTranscript,
    setConfidenceScores,
    setErrorMessage,
    continuousMode,
    appendText,
    deleteLastWord,
    clearText,
  } = useDictationStore();

  const recognitionRef = useRef<any>(null);
  const isListeningRef = useRef(false);

  const handleError = useCallback((error: SpeechRecognitionError) => {
    setDictationStatus('error');
    setErrorMessage(error.message);
    isListeningRef.current = false;
  }, [setDictationStatus, setErrorMessage]);

  const startRecognition = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      handleError({
        type: 'not-supported',
        message: 'Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.',
      });
      return;
    }

    const recognition = new SpeechRecognition();
    const lang = getLanguage(selectedLanguage);

    recognition.lang = lang?.speechCode || 'en-US';
    recognition.continuous = continuousMode;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      isListeningRef.current = true;
      setDictationStatus('listening');
      setErrorMessage(null);
    };

    recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';
      let confidence = 0;

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0].transcript;
        confidence = result[0].confidence;

        if (result.isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      // Update interim text (showing what's being recognized)
      setInterimText(interimTranscript);

      // Process final transcript
      if (finalTranscript) {
        // Check for voice commands
        const trimmedText = finalTranscript.trim().toLowerCase();
        const commandResult = processVoiceCommand(trimmedText, selectedLanguage);

        if (commandResult.isCommand) {
          // Handle voice command
          switch (commandResult.action) {
            case 'STOP_COMMAND':
              stopRecognition();
              return;
            case 'PAUSE_COMMAND':
              pauseRecognition();
              return;
            case 'RESUME_COMMAND':
              resumeRecognition();
              return;
            case 'DELETE_LAST_WORD':
              deleteLastWord();
              break;
            case 'DELETE_ALL':
              clearText();
              break;
            case 'COPY_TEXT':
              navigator.clipboard.writeText(useDictationStore.getState().currentText);
              break;
            default:
              // Insert punctuation or newline
              appendText(commandResult.action);
          }
        } else {
          // Regular speech - append to text
          appendText(finalTranscript);

          // Add to transcript segments
          addTranscript({
            id: Math.random().toString(36).substring(2, 11),
            text: finalTranscript,
            confidence,
            timestamp: Date.now(),
            isFinal: true,
          });

          // Update confidence scores
          const scores = useDictationStore.getState().confidenceScores;
          setConfidenceScores([...scores, confidence]);
        }

        // Clear interim after processing
        setInterimText('');
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);

      switch (event.error) {
        case 'not-allowed':
          handleError({
            type: 'permission-denied',
            message: 'Microphone access denied. Please allow microphone permission and try again.',
          });
          break;
        case 'no-microphone':
          handleError({
            type: 'no-microphone',
            message: 'No microphone detected. Please connect a microphone and try again.',
          });
          break;
        case 'network':
          handleError({
            type: 'network',
            message: 'Network error. Speech recognition requires an internet connection.',
          });
          break;
        case 'no-speech':
          // No speech detected, not necessarily an error
          break;
        case 'aborted':
          // User aborted, don't show error
          break;
        default:
          handleError({
            type: 'unknown',
            message: `Speech recognition error: ${event.error}`,
          });
      }
    };

    recognition.onend = () => {
      isListeningRef.current = false;
      setInterimText('');
      
      // Auto-restart if in continuous mode and not manually stopped
      if (continuousMode && useDictationStore.getState().dictationStatus === 'listening') {
        try {
          recognition.start();
          isListeningRef.current = true;
        } catch (err) {
          // Ignore restart errors
        }
      } else if (useDictationStore.getState().dictationStatus === 'listening') {
        setDictationStatus('idle');
      }
    };

    try {
      recognition.start();
      recognitionRef.current = recognition;
    } catch (err) {
      handleError({
        type: 'unknown',
        message: 'Failed to start speech recognition. Please try again.',
      });
    }
  }, [
    selectedLanguage,
    continuousMode,
    appendText,
    addTranscript,
    setConfidenceScores,
    setDictationStatus,
    setErrorMessage,
    setInterimText,
    deleteLastWord,
    clearText,
    handleError,
  ]);

  const stopRecognition = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    isListeningRef.current = false;
    setDictationStatus('idle');
    setInterimText('');
  }, [setDictationStatus, setInterimText]);

  const pauseRecognition = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    isListeningRef.current = false;
    setDictationStatus('paused');
    setInterimText('');
  }, [setDictationStatus, setInterimText]);

  const resumeRecognition = useCallback(() => {
    if (!isListeningRef.current) {
      startRecognition();
    }
  }, [startRecognition]);

  // Handle window events from controls
  useEffect(() => {
    const handleStart = () => startRecognition();
    const handlePause = () => pauseRecognition();
    const handleResume = () => resumeRecognition();
    const handleStop = () => stopRecognition();

    window.addEventListener('dictation-start', handleStart);
    window.addEventListener('dictation-pause', handlePause);
    window.addEventListener('dictation-resume', handleResume);
    window.addEventListener('dictation-stop', handleStop);

    return () => {
      window.removeEventListener('dictation-start', handleStart);
      window.removeEventListener('dictation-pause', handlePause);
      window.removeEventListener('dictation-resume', handleResume);
      window.removeEventListener('dictation-stop', handleStop);
    };
  }, [startRecognition, pauseRecognition, resumeRecognition, stopRecognition]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
    };
  }, []);

  return {
    startRecognition,
    stopRecognition,
    pauseRecognition,
    resumeRecognition,
  };
}

// Core types for the dictation app

export type AppMode = 'dictation' | 'practice' | 'shadow';

export type DictationStatus = 'idle' | 'listening' | 'paused' | 'error';

export interface TranscriptSegment {
  id: string;
  text: string;
  confidence: number;
  timestamp: number;
  isFinal: boolean;
}

export interface Draft {
  id: string;
  content: string;
  language: string;
  createdAt: number;
  updatedAt: number;
  wordCount: number;
}

export interface PracticeSession {
  id: string;
  originalText: string;
  userText: string;
  accuracy: number;
  timestamp: number;
  language: string;
}

export interface ShadowSession {
  id: string;
  targetText: string;
  spokenText: string;
  accuracy: number;
  timestamp: number;
  language: string;
  scoreCategory: 'excellent' | 'good' | 'needs-improvement';
}

export interface UserProgress {
  date: string; // YYYY-MM-DD format
  totalExercises: number;
  avgAccuracy: number;
  streakCount: number;
}

export interface DiffResult {
  type: 'match' | 'insert' | 'delete' | 'replace';
  value: string;
  originalIndex?: number;
  userIndex?: number;
}

export interface VoiceCommandResult {
  command: string;
  action: string;
  success: boolean;
}

export interface SpeechRecognitionError {
  type: 'not-supported' | 'no-microphone' | 'permission-denied' | 'network' | 'no-speech' | 'aborted' | 'unknown';
  message: string;
}

// Extended Window interface for Web Speech API
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

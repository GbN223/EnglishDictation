import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AppMode, DictationStatus, TranscriptSegment, Draft, PracticeSession } from '../types';

interface DictationStore {
  // State
  appMode: AppMode;
  selectedLanguage: string;
  dictationStatus: DictationStatus;
  transcripts: TranscriptSegment[];
  currentText: string;
  interimText: string;
  drafts: Draft[];
  isDarkMode: boolean;
  continuousMode: boolean;
  confidenceScores: number[];
  errorMessage: string | null;
  
  // Practice mode state
  practiceOriginalText: string;
  practiceUserText: string;
  practiceSessions: PracticeSession[];
  practiceSpeed: number; // words per minute for TTS
  isPlaying: boolean;
  
  // Actions
  setAppMode: (mode: AppMode) => void;
  setSelectedLanguage: (code: string) => void;
  setDictationStatus: (status: DictationStatus) => void;
  addTranscript: (segment: TranscriptSegment) => void;
  setCurrentText: (text: string) => void;
  setInterimText: (text: string) => void;
  appendText: (text: string) => void;
  clearText: () => void;
  deleteLastWord: () => void;
  addDraft: (draft: Draft) => void;
  loadDraft: (id: string) => void;
  deleteDraft: (id: string) => void;
  toggleDarkMode: () => void;
  setDarkMode: (dark: boolean) => void;
  toggleContinuousMode: () => void;
  setConfidenceScores: (scores: number[]) => void;
  setErrorMessage: (message: string | null) => void;
  getText: () => string;
  getWordCount: () => number;
  
  // Practice mode actions
  setPracticeOriginalText: (text: string) => void;
  setPracticeUserText: (text: string) => void;
  addPracticeSession: (session: PracticeSession) => void;
  clearPracticeSession: () => void;
  setPracticeSpeed: (speed: number) => void;
  setPlaying: (playing: boolean) => void;
}

const generateId = () => Math.random().toString(36).substring(2, 11);

export const useDictationStore = create<DictationStore>()(
  persist(
    (set, get) => ({
      // Initial state
      appMode: 'dictation',
      selectedLanguage: 'en-US',
      dictationStatus: 'idle',
      transcripts: [],
      currentText: '',
      interimText: '',
      drafts: [],
      isDarkMode: false,
      continuousMode: true,
      confidenceScores: [],
      errorMessage: null,
      
      // Practice mode initial state
      practiceOriginalText: '',
      practiceUserText: '',
      practiceSessions: [],
      practiceSpeed: 150,
      isPlaying: false,

      // Actions
      setAppMode: (mode: AppMode) => set({ appMode: mode }),
      
      setSelectedLanguage: (code: string) => set({ selectedLanguage: code }),
      
      setDictationStatus: (status: DictationStatus) => set({ dictationStatus: status }),
      
      addTranscript: (segment: TranscriptSegment) =>
        set((state) => ({
          transcripts: [...state.transcripts, segment],
          confidenceScores: [...state.confidenceScores, segment.confidence],
        })),
      
      setCurrentText: (text: string) => set({ currentText: text }),
      
      setInterimText: (text: string) => set({ interimText: text }),
      
      appendText: (text: string) =>
        set((state) => {
          const newText = state.currentText + text;
          return { currentText: newText };
        }),
      
      clearText: () => set({ currentText: '', transcripts: [], interimText: '', confidenceScores: [] }),
      
      deleteLastWord: () =>
        set((state) => {
          const words = state.currentText.trimEnd().split(/\s+/);
          words.pop();
          return { currentText: words.join(' ') + (words.length > 0 ? ' ' : '') };
        }),
      
      addDraft: (draft: Draft) =>
        set((state) => ({
          drafts: [draft, ...state.drafts],
        })),
      
      loadDraft: (id: string) =>
        set((state) => {
          const draft = state.drafts.find((d) => d.id === id);
          return draft ? { currentText: draft.content, selectedLanguage: draft.language } : state;
        }),
      
      deleteDraft: (id: string) =>
        set((state) => ({
          drafts: state.drafts.filter((d) => d.id !== id),
        })),
      
      toggleDarkMode: () =>
        set((state) => {
          const newDarkMode = !state.isDarkMode;
          document.documentElement.classList.toggle('dark', newDarkMode);
          return { isDarkMode: newDarkMode };
        }),
      
      setDarkMode: (dark: boolean) =>
        set((state) => {
          document.documentElement.classList.toggle('dark', dark);
          return { isDarkMode: dark };
        }),
      
      toggleContinuousMode: () =>
        set((state) => ({ continuousMode: !state.continuousMode })),
      
      setConfidenceScores: (scores: number[]) => set({ confidenceScores: scores }),
      
      setErrorMessage: (message: string | null) => set({ errorMessage: message }),
      
      getText: () => get().currentText,
      
      getWordCount: () => {
        const text = get().currentText.trim();
        return text ? text.split(/\s+/).length : 0;
      },
      
      // Practice mode actions
      setPracticeOriginalText: (text: string) => set({ practiceOriginalText: text }),
      
      setPracticeUserText: (text: string) => set({ practiceUserText: text }),
      
      addPracticeSession: (session: PracticeSession) =>
        set((state) => ({
          practiceSessions: [session, ...state.practiceSessions],
        })),
      
      clearPracticeSession: () =>
        set({ practiceOriginalText: '', practiceUserText: '' }),
      
      setPracticeSpeed: (speed: number) => set({ practiceSpeed: speed }),
      
      setPlaying: (playing: boolean) => set({ isPlaying: playing }),
    }),
    {
      name: 'dictation-storage',
      partialize: (state) => ({
        drafts: state.drafts,
        isDarkMode: state.isDarkMode,
        selectedLanguage: state.selectedLanguage,
        continuousMode: state.continuousMode,
        appMode: state.appMode,
        practiceSpeed: state.practiceSpeed,
        practiceSessions: state.practiceSessions,
      }),
    }
  )
);

// Apply dark mode on load
const store = useDictationStore.getState();
if (store.isDarkMode) {
  document.documentElement.classList.add('dark');
}

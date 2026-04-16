# 🎙️ VoiceDictation

**A Modern, Multilingual Dictation App with Real-Time Speech-to-Text**

> *Speak naturally in 14+ languages. Voice commands make editing magical.*

---

## 📋 Table of Contents

1. [Tech Stack](#tech-stack)
2. [Features](#features)
3. [Folder Structure](#folder-structure)
4. [Setup & Run Instructions](#setup--run-instructions)
5. [How to Add New Languages](#how-to-add-new-languages)
6. [Voice Commands Reference](#voice-commands-reference)
7. [API Integration Guide](#api-integration-guide)
8. [Future Enhancement Roadmap](#future-enhancement-roadmap)
9. [Troubleshooting](#troubleshooting)

---

## 🛠️ Tech Stack

| Technology | Purpose | Justification |
|------------|---------|---------------|
| **React 18** | UI Framework | Component-based, excellent ecosystem |
| **TypeScript** | Type Safety | Catches errors early, better DX |
| **Vite** | Build Tool | Lightning-fast HMR, optimal for React |
| **Tailwind CSS** | Styling | Utility-first, customizable, small bundle |
| **Zustand** | State Management | Lightweight, no boilerplate, persistent state |
| **Web Speech API** | Speech Recognition | Built-in, free, no API keys needed |
| **Lucide React** | Icons | Beautiful, consistent, tree-shakeable |
| **MyMemory API** | Translation | Free tier, no API key required |

### Why Web Speech API?
- ✅ **Free** - No API keys or usage costs
- ✅ **Built-in** - Works in Chrome, Edge, Safari
- ✅ **Real-time** - Interim results for live feedback
- ⚠️ **Limitations** - Requires internet, browser-dependent accuracy

### Fallback Options (See [API Integration Guide](#api-integration-guide))
- OpenAI Whisper API
- Google Cloud Speech-to-Text
- Azure Speech Services
- Deepgram

---

## ✨ Features

### Core Features
- ✅ **14+ Languages Supported** - English (US/UK/AU), Spanish, French, German, Italian, Portuguese, Chinese (Mandarin), Japanese, Korean, Arabic, Hindi, Russian
- ✅ **Real-Time Transcription** - See text appear as you speak
- ✅ **Voice Commands** - Punctuation, formatting, and app control via voice
- ✅ **Language Switching** - Seamless switching with visual feedback
- ✅ **Continuous Dictation Mode** - Keep listening without manual restart
- ✅ **Pause/Resume/Stop** - Full control over dictation sessions
- ✅ **Confidence Scoring** - Visual accuracy indicator per session
- ✅ **Translation** - Translate text to 12+ languages instantly
- ✅ **Auto-Save Drafts** - Never lose your work
- ✅ **Copy/Download/Share** - Export your text easily
- ✅ **Dark/Light Mode** - Beautiful themes with smooth transitions
- ✅ **Mobile-First Responsive** - Works beautifully on all devices
- ✅ **Keyboard Accessible** - Full ARIA support, keyboard navigation

---

## 📁 Folder Structure

```
EnglishDictation/
├── package.json              # Dependencies and scripts
├── tsconfig.json             # TypeScript configuration
├── tsconfig.node.json        # Node-specific TS config
├── vite.config.ts            # Vite build configuration
├── tailwind.config.js        # Tailwind CSS configuration
├── postcss.config.js         # PostCSS configuration
├── index.html                # Entry HTML file
│
└── src/
    ├── main.tsx              # React entry point
    ├── App.tsx               # Main app component
    ├── index.css             # Global styles + Tailwind
    ├── vite-env.d.ts         # Vite type declarations
    │
    ├── config/
    │   └── languages.ts      # Language definitions & voice commands
    │
    ├── types/
    │   └── index.ts          # TypeScript type definitions
    │
    ├── store/
    │   └── dictationStore.ts # Zustand state management
    │
    ├── hooks/
    │   └── useSpeechRecognition.ts  # Speech recognition hook
    │
    ├── utils/
    │   └── voiceCommands.ts  # Voice command processing
    │
    └── components/
        ├── Header.tsx              # App header with stats
        ├── LanguageSelector.tsx    # Language dropdown with search
        ├── Controls.tsx            # Mic controls (start/pause/stop)
        ├── Editor.tsx              # Rich text editor area
        ├── ConfidenceIndicator.tsx # Accuracy score display
        ├── VoiceWaveform.tsx       # Animated waveform visualization
        ├── TranslationModal.tsx    # Translation dialog
        ├── DraftsManager.tsx       # Saved drafts list
        ├── ErrorDialog.tsx         # Error notification dialog
        └── Toast.tsx               # Toast notifications
```

---

## 🚀 Setup & Run Instructions

### Prerequisites
- **Node.js** 18+ ([Download](https://nodejs.org/))
- **npm** or **yarn**
- **Modern browser** (Chrome 25+, Edge 79+, Safari 14+)
- **Microphone** for speech recognition
- **Internet connection** (required for Web Speech API)

### Step-by-Step Setup

#### 1. Install Dependencies
```bash
npm install
```

#### 2. Start Development Server
```bash
npm run dev
```

The app will start at `http://localhost:5173`

#### 3. Open in Browser
- Navigate to the URL shown in terminal
- **Allow microphone permission** when prompted
- Select your language and start speaking!

#### 4. Build for Production
```bash
npm run build
```

Output will be in `dist/` folder - deploy to any static host (Vercel, Netlify, GitHub Pages, etc.)

#### 5. Preview Production Build
```bash
npm run preview
```

### Browser Compatibility

| Browser | Speech Recognition | Notes |
|---------|-------------------|-------|
| Chrome 25+ | ✅ Full support | Best accuracy |
| Edge 79+ | ✅ Full support | Chromium-based |
| Safari 14+ | ✅ Full support | macOS/iOS |
| Firefox | ⚠️ Limited | Not enabled by default |
| Opera | ✅ Full support | Chromium-based |

### No API Keys Required!
The app works out-of-the-box using Web Speech API. For enhanced accuracy or offline support, see [API Integration Guide](#api-integration-guide).

---

## 🌍 How to Add New Languages

Adding a new language is **simple and straightforward**. Follow these steps:

### Step 1: Add Language Configuration

Open `src/config/languages.ts` and add your language to the `SUPPORTED_LANGUAGES` object:

```typescript
'xx-XX': {
  code: 'xx-XX',
  name: 'Language Name',
  flag: '🏳️',  // Replace with appropriate flag emoji
  speechCode: 'xx-XX',  // Web Speech API language code
  voiceCommands: {
    'new paragraph': '\n\n',
    'new line': '\n',
    'period': '.',
    'comma': ',',
    'question mark': '?',
    'exclamation mark': '!',
    'stop': 'STOP_COMMAND',
    'pause': 'PAUSE_COMMAND',
    'resume': 'RESUME_COMMAND',
    'delete last word': 'DELETE_LAST_WORD',
    'delete all': 'DELETE_ALL',
    // Add more voice commands specific to this language
  },
},
```

**Example: Adding Turkish**
```typescript
'tr-TR': {
  code: 'tr-TR',
  name: 'Türkçe',
  flag: '🇹🇷',
  speechCode: 'tr-TR',
  voiceCommands: {
    'yeni paragraf': '\n\n',
    'yeni satır': '\n',
    'nokta': '.',
    'virgül': ',',
    'soru işareti': '?',
    'ünlem işareti': '!',
    'dur': 'STOP_COMMAND',
    'duraklat': 'PAUSE_COMMAND',
    'devam et': 'RESUME_COMMAND',
    'son kelimeyi sil': 'DELETE_LAST_WORD',
    'hepsini sil': 'DELETE_ALL',
  },
},
```

### Step 2: Add Translation Language (Optional)

If you want the language to appear in the translation dropdown, add it to `TRANSLATION_LANGUAGES` array:

```typescript
{ code: 'tr', name: 'Turkish', flag: '🇹🇷' },
```

### Step 3: That's It! 🎉

The language will automatically:
- ✅ Appear in the language selector
- ✅ Show with the correct flag
- ✅ Use the correct speech recognition model
- ✅ Support voice commands in that language
- ✅ Be available for translation

### Finding Speech API Language Codes

Web Speech API supports many language codes. Find the complete list:
- [MDN Web Docs - SpeechRecognition.lang](https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition/lang)
- Common format: `language-COUNTRY` (e.g., `en-US`, `fr-FR`, `zh-CN`)

### Testing Your New Language

1. Save the file (hot reload will update automatically)
2. Open the app in browser
3. Select your new language from dropdown
4. Start speaking in that language!

---

## 🎤 Voice Commands Reference

Voice commands allow you to format and control the dictation **using only your voice**.

### Punctuation Commands (English)
| Say This | Does This |
|----------|-----------|
| "period" | Inserts `.` |
| "comma" | Inserts `,` |
| "question mark" | Inserts `?` |
| "exclamation mark" | Inserts `!` |
| "colon" | Inserts `:` |
| "semicolon" | Inserts `;` |
| "open quote" | Inserts `"` |
| "close quote" | Inserts `"` |
| "open paren" | Inserts `(` |
| "close paren" | Inserts `)` |

### Formatting Commands (English)
| Say This | Does This |
|----------|-----------|
| "new paragraph" | Inserts blank line |
| "new line" | Inserts line break |
| "delete last word" | Removes last word |
| "delete all" | Clears all text |

### Control Commands (English)
| Say This | Does This |
|----------|-----------|
| "stop" | Stops dictation |
| "pause" | Pauses dictation |
| "resume" | Resumes dictation |
| "copy text" | Copies to clipboard |
| "save draft" | Saves current draft |

### Tips for Voice Commands
- ✅ Speak commands **clearly** and **slowly**
- ✅ Commands work best when spoken as **exact phrases**
- ✅ Each language has **localized commands**
- ✅ Mix regular speech with commands seamlessly

---

## 🔌 API Integration Guide

While the app works with Web Speech API out-of-the-box, you can integrate more powerful APIs for:
- Better accuracy
- Offline support
- Custom vocabulary
- Real-time translation

### Option 1: OpenAI Whisper API

**Pros:** Highest accuracy, supports 100+ languages, handles accents
**Cons:** Requires API key, pay-per-use

#### Integration Steps:

1. **Get API Key**: Sign up at [OpenAI](https://platform.openai.com/)
2. **Install OpenAI SDK**:
   ```bash
   npm install openai
   ```
3. **Create Whisper Hook** (`src/hooks/useWhisperRecognition.ts`):
   ```typescript
   import OpenAI from 'openai';
   
   const openai = new OpenAI({
     apiKey: import.meta.env.VITE_OPENAI_API_KEY,
     dangerouslyAllowBrowser: true, // Use backend in production
   });
   
   export function useWhisperRecognition() {
     // Similar to useSpeechRecognition but calls Whisper API
     // Record audio chunks and send to Whisper API
     // Process response and update store
   }
   ```

4. **Add to `.env`**:
   ```env
   VITE_OPENAI_API_KEY=your-api-key-here
   ```

### Option 2: Google Cloud Speech-to-Text

**Pros:** Excellent accuracy, real-time streaming, custom models
**Cons:** Requires API key, more complex setup

#### Integration Steps:

1. **Get API Key**: [Google Cloud Console](https://console.cloud.google.com/)
2. **Enable Speech-to-Text API**
3. **Use REST API or Client Library**
4. **Similar hook pattern as Whisper**

### Option 3: Azure Speech Services

**Pros:** Enterprise-grade, real-time, custom neural voices
**Cons:** Requires Azure subscription

### Option 4: Deepgram

**Pros:** Real-time streaming, excellent accuracy, free tier
**Cons:** Requires API key

---

## 🗺️ Future Enhancement Roadmap

Here are 10 powerful features to make this app even better:

### 1. 🎯 **Auto Language Detection**
Automatically detect spoken language and switch transcription model in real-time. No manual selection needed.

**Implementation:** Use language detection API or confidence scoring across multiple models.

### 2. 📝 **Rich Text Formatting**
Support bold, italic, headings, lists via voice commands.

**Voice Commands:** "bold that", "italic last sentence", "make heading one"

### 3. 🌐 **Real-Time Translation Mode**
Speak in one language, see transcription in another language instantly.

**Implementation:** Chain Speech-to-Text + Translation API + Text-to-Speech

### 4. 🎭 **Speaker Diarization**
Identify and label different speakers in multi-person conversations.

**Implementation:** Integrate with APIs that support speaker separation (Whisper, Azure)

### 5. 📊 **Analytics Dashboard**
Track dictation sessions: words per minute, accuracy trends, most-used languages, time saved.

### 6. 🔊 **Text-to-Speech Playback**
Listen back to your transcribed text in the original voice or selected voice.

**Implementation:** Web Speech API `SpeechSynthesis` or ElevenLabs API

### 7. 📱 **Progressive Web App (PWA)**
Install on mobile/desktop, offline support with cached models.

**Implementation:** Add service worker, manifest.json, local storage for drafts

### 8. 🤝 **Collaborative Editing**
Real-time collaborative dictation - multiple people speak, one document.

**Implementation:** WebSocket + CRDT (Yjs or Automerge)

### 9. 🎓 **AI Writing Assistant**
Grammar correction, style suggestions, auto-complete as you dictate.

**Implementation:** Integrate GPT-4 or similar LLM API

### 10. 🔒 **End-to-End Encryption**
Secure dictation for sensitive content (medical, legal, personal).

**Implementation:** Client-side encryption before sending to APIs, local processing

---

## 🛠️ Troubleshooting

### Speech Recognition Not Working

**Problem:** "Microphone not detected" or "Permission denied"

**Solutions:**
1. Check browser microphone permissions
2. Ensure microphone is connected and working
3. Try a different browser (Chrome recommended)
4. Check OS-level microphone permissions (Windows/Mac settings)

### Poor Accuracy

**Problem:** Transcription quality is low

**Solutions:**
1. Speak clearly and at moderate pace
2. Use a good quality microphone
3. Reduce background noise
4. Select correct language variant (US vs UK English)
5. Consider upgrading to Whisper API for better accuracy

### Not Supported in Browser

**Problem:** "Speech recognition is not supported"

**Solutions:**
- Use Chrome, Edge, or Safari (Firefox has limited support)
- Update browser to latest version
- Check if Web Speech API is enabled in browser flags

### Commands Not Recognizing

**Problem:** Voice commands not working

**Solutions:**
1. Speak commands clearly as exact phrases
2. Check that you're using the correct language's commands
3. Commands only work when in "Listening" state
4. Review the voice commands reference for your language

---

## 📄 License

MIT License - feel free to use this for personal or commercial projects.

---

## 🙏 Credits

Built with:
- Web Speech API (W3C)
- React + Vite + TypeScript
- Tailwind CSS
- Zustand
- Lucide Icons
- MyMemory Translation API

---

**Enjoy dictating in your language! 🎙️✨**

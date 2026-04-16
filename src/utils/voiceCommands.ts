import { SUPPORTED_LANGUAGES } from '../config/languages';

export interface VoiceCommandResult {
  isCommand: boolean;
  action: string;
  replacement?: string;
}

export function processVoiceCommand(text: string, languageCode: string): VoiceCommandResult {
  const lang = SUPPORTED_LANGUAGES[languageCode];
  if (!lang) {
    return { isCommand: false, action: '' };
  }

  const lowerText = text.toLowerCase().trim();

  // Check if the text matches any voice command
  for (const [command, action] of Object.entries(lang.voiceCommands)) {
    if (lowerText === command.toLowerCase()) {
      return {
        isCommand: true,
        action,
        replacement: action.startsWith('\n') ? action : undefined,
      };
    }
  }

  return { isCommand: false, action: '' };
}

export function getVoiceCommandsForLanguage(languageCode: string): Record<string, string> {
  const lang = SUPPORTED_LANGUAGES[languageCode];
  return lang?.voiceCommands || {};
}

export function formatVoiceCommandsHint(languageCode: string): string {
  const commands = getVoiceCommandsForLanguage(languageCode);
  const examples = Object.keys(commands)
    .filter((cmd) => !cmd.startsWith('delete') && !cmd.startsWith('stop') && !cmd.startsWith('pause'))
    .slice(0, 6);

  return `Voice commands: ${examples.join(', ')}`;
}

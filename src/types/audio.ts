export type LanguageChoice = 'auto' | 'pt' | 'en';
export type ResolvedLanguage = 'pt' | 'en';

export type CutMode = 'exclude' | 'extract';
export type ExportFormat = 'mp3' | 'wav' | 'ogg';

export interface AudioMetadata {
  fileName: string;
  fileSize: number;
  duration: number;
  sampleRate: number;
  numberOfChannels: number;
}

export interface ToastMessage {
  id: string;
  type: 'info' | 'success' | 'error';
  text: string;
}

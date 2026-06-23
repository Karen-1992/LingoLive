/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface VocabularyCard {
  id: string;
  word: string;
  translation: string;
  pronunciation?: string;
  example: string;
  exampleTranslation: string;
}

export interface Language {
  id: string;
  name: string; // e.g., "Английский"
  englishName: string; // e.g., "English"
  flag: string; // emoji flag
  code: string; // e.g., "en"
}

export interface Teacher {
  id: string;
  languageId: string;
  name: string;
  russianName: string;
  avatar: string; // placeholder description or gender for avatar UI
  persona: string; // short Russian description of personality
  voiceName: "Puck" | "Charon" | "Kore" | "Fenrir" | "Zephyr" | "Aoede" | "Leda" | "Orus" | "Orion" | "Lyra";
  systemInstruction: string; // base instruction for Gemini
  greetings: string[]; // preset sample starting lines
}

export interface CallHistoryEntry {
  id: string;
  languageId: string;
  teacherId: string;
  languageName: string;
  teacherName: string;
  date: string;
  durationSeconds: number;
  level: string;
  topic: string;
  transcriptsCount: number;
  transcripts?: LiveTranscriptMessage[];
}

export interface UserStats {
  totalDurationSeconds: number;
  completedCallsCount: number;
  history: CallHistoryEntry[];
  savedWords: VocabularyCard[];
  userFacts?: string[];
  conversationNotes?: string[];
}

export interface LiveTranscriptMessage {
  id: string;
  speaker: "student" | "teacher" | "system";
  text: string;
  timestamp: string;
}

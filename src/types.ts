/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Language {
  id: string;
  name: string;
  englishName: string;
  flag: string;
  code: string;
}

export interface Teacher {
  id: string;
  languageId: string;
  name: string;
  russianName: string;
  avatar: string;
  persona: string;
  voiceName: "Puck" | "Charon" | "Kore" | "Fenrir" | "Zephyr" | "Aoede" | "Leda" | "Orus" | "Orion" | "Lyra";
  systemInstruction: string;
  greetings: string[];
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
  transcriptsCount: number;
  transcripts?: LiveTranscriptMessage[];
}

export interface VocabWord {
  id: string;
  text: string;
  translation?: string;
  transcription?: string;
}

export interface LanguageStats {
  totalDurationSeconds: number;
  completedCallsCount: number;
  memories: string[];
  vocabWords: VocabWord[];
}

export interface UserStats {
  history: CallHistoryEntry[];
  byLanguage: Record<string, LanguageStats>;
}

export interface LiveTranscriptMessage {
  id: string;
  speaker: "student" | "teacher" | "system";
  text: string;
  timestamp: string;
}

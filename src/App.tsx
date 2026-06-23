/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { Teacher, VocabularyCard, UserStats as UserStatsType, CallHistoryEntry, LiveTranscriptMessage } from "./types";
import { LANGUAGES, TEACHERS } from "./data/languages";
import LiveCall from "./components/LiveCall";
import UserStats from "./components/UserStats";
import LessonSetup from "./components/LessonSetup";
import { GraduationCap, BarChart3, Heart, Flame } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

const DEFAULT_LANGUAGE = LANGUAGES[0];
const DEFAULT_TEACHER = TEACHERS[0];

export default function App() {
  const [activeTab, setActiveTab] = useState<"lesson" | "stats">("lesson");
  const [lessonStep, setLessonStep] = useState<"select_lang" | "calling">("select_lang");

  const [selectedLevel, setSelectedLevel] = useState("Средний (B1)");
  const [selectedTopic] = useState("Свободный разговор");
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher>(DEFAULT_TEACHER);

  const [stats, setStats] = useState<UserStatsType>({
    totalDurationSeconds: 0,
    completedCallsCount: 0,
    history: [],
    savedWords: [],
  });

  useEffect(() => {
    const local = localStorage.getItem("lingo_live_stats");
    if (local) {
      try { setStats(JSON.parse(local)); } catch {}
    }
  }, []);

  const saveStats = (updated: UserStatsType) => {
    setStats(updated);
    localStorage.setItem("lingo_live_stats", JSON.stringify(updated));
  };

  const handleAddNoteWord = (card: VocabularyCard) => {
    if (stats.savedWords.some((w) => w.word.toLowerCase() === card.word.toLowerCase())) return;
    saveStats({ ...stats, savedWords: [...stats.savedWords, card] });
  };

  const handleRemoveWord = (wordId: string) => {
    saveStats({ ...stats, savedWords: stats.savedWords.filter((w) => w.id !== wordId) });
  };

  const handleClearHistory = () => {
    saveStats({ ...stats, history: [] });
  };

  const handleSaveFact = (fact: string) => {
    setStats((prev) => {
      const currentFacts = prev.userFacts || [];
      if (currentFacts.includes(fact.trim())) return prev;
      const updated = { ...prev, userFacts: [...currentFacts, fact.trim()] };
      localStorage.setItem("lingo_live_stats", JSON.stringify(updated));
      return updated;
    });
  };

  const handleSaveNote = (note: string) => {
    setStats((prev) => {
      const currentNotes = prev.conversationNotes || [];
      if (currentNotes.includes(note.trim())) return prev;
      const updated = { ...prev, conversationNotes: [...currentNotes, note.trim()] };
      localStorage.setItem("lingo_live_stats", JSON.stringify(updated));
      return updated;
    });
  };

  const handleRemoveFact = (indexToRemove: number) => {
    const updatedFacts = (stats.userFacts || []).filter((_, idx) => idx !== indexToRemove);
    saveStats({ ...stats, userFacts: updatedFacts });
  };

  const handleAddManualFact = (factText: string) => {
    if (!factText.trim()) return;
    const currentFacts = stats.userFacts || [];
    if (currentFacts.includes(factText.trim())) return;
    saveStats({ ...stats, userFacts: [...currentFacts, factText.trim()] });
  };

  const handleHangUp = (durationSeconds: number, transcripts: LiveTranscriptMessage[]) => {
    const filteredCount = transcripts.filter((t) => t.speaker === "student" || t.speaker === "teacher").length;

    const newEntry: CallHistoryEntry = {
      id: "call_" + Date.now(),
      languageId: DEFAULT_LANGUAGE.id,
      teacherId: selectedTeacher.id,
      languageName: DEFAULT_LANGUAGE.name,
      teacherName: selectedTeacher.name,
      date: new Date().toLocaleString("ru-RU", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      }),
      durationSeconds,
      level: selectedLevel,
      topic: selectedTopic,
      transcriptsCount: filteredCount,
      transcripts,
    };

    saveStats({
      ...stats,
      totalDurationSeconds: stats.totalDurationSeconds + durationSeconds,
      completedCallsCount: stats.completedCallsCount + 1,
      history: [newEntry, ...stats.history],
    });

    setLessonStep("select_lang");
    setSelectedTeacher(DEFAULT_TEACHER);
    setSelectedLevel("Средний (B1)");
    setActiveTab("stats");
  };

  const handleGoToLesson = () => {
    setActiveTab("lesson");
    setLessonStep("select_lang");
    setSelectedTeacher(DEFAULT_TEACHER);
  };

  return (
    <div className="min-h-screen bg-brand-cream text-brand-dark flex flex-col font-sans" id="app-root-container">

      <nav className="bg-white border-b border-brand-sand/60 sticky top-0 z-50 shadow-sm shadow-brand-sand/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-olive rounded-xl flex items-center justify-center text-white shadow-sm shadow-brand-olive/10 shrink-0">
              <span className="text-brand-cream font-bold text-xl font-serif">L</span>
            </div>
            <div>
              <h1 className="text-2xl font-serif font-bold italic text-brand-olive tracking-tight leading-none">LingoLive</h1>
              <span className="text-[10px] text-brand-terracotta font-bold uppercase tracking-wider block mt-1.5 flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-brand-terracotta fill-brand-terracotta/20" />
                Живой ИИ-репетитор
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 border border-brand-sand/60 p-1 bg-brand-light-gray rounded-2xl">
            <button
              onClick={handleGoToLesson}
              className={`py-2 px-5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === "lesson"
                  ? "bg-white text-brand-olive shadow-sm border border-brand-sand/40"
                  : "text-brand-dark/60 hover:text-brand-dark"
              }`}
            >
              <GraduationCap className="w-4 h-4 text-brand-terracotta" />
              Обучение
            </button>
            <button
              onClick={() => setActiveTab("stats")}
              className={`py-2 px-5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === "stats"
                  ? "bg-white text-brand-olive shadow-sm border border-brand-sand/40"
                  : "text-brand-dark/60 hover:text-brand-dark"
              }`}
            >
              <BarChart3 className="w-4 h-4 text-brand-terracotta" />
              Моя Статистика
            </button>
          </div>

        </div>
      </nav>

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">

          {activeTab === "lesson" && (
            <motion.div
              key="lesson_view"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
              className="space-y-6"
            >
              {lessonStep === "select_lang" && (
                <LessonSetup
                  selectedLevel={selectedLevel}
                  setSelectedLevel={setSelectedLevel}
                  selectedTeacher={selectedTeacher}
                  setSelectedTeacher={setSelectedTeacher}
                  userFacts={stats.userFacts || []}
                  onRemoveFact={handleRemoveFact}
                  onAddManualFact={handleAddManualFact}
                  onStartCall={() => setLessonStep("calling")}
                />
              )}

              {lessonStep === "calling" && (
                <LiveCall
                  language={DEFAULT_LANGUAGE}
                  teacher={selectedTeacher}
                  level={selectedLevel}
                  topic={selectedTopic}
                  savedWords={stats.savedWords}
                  onAddNoteWord={handleAddNoteWord}
                  onHangUp={handleHangUp}
                  userFacts={stats.userFacts || []}
                  conversationNotes={stats.conversationNotes || []}
                  onSaveFact={handleSaveFact}
                  onSaveNote={handleSaveNote}
                />
              )}
            </motion.div>
          )}

          {activeTab === "stats" && (
            <motion.div
              key="stats_view"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
            >
              <UserStats
                stats={stats}
                onRemoveWord={handleRemoveWord}
                onClearHistory={handleClearHistory}
                onRemoveFact={handleRemoveFact}
                onAddManualFact={handleAddManualFact}
              />
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      <footer className="bg-white border-t border-brand-sand py-8 text-center text-xs text-brand-dark/50 mt-12">
        <div className="flex items-center justify-center gap-1.5 font-medium text-brand-dark/70">
          Изучение английского языка <span className="font-serif italic font-bold">LingoLive</span> с ИИ • Создано с любовью к знаниям
          <Heart className="w-3.5 h-3.5 text-brand-red fill-brand-red" />
        </div>
        <p className="mt-2 text-brand-dark/40 max-w-md mx-auto">Для полноценной работы звонков требуется доступ к микрофону.</p>
      </footer>

    </div>
  );
}

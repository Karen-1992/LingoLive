/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { Language, Teacher, UserStats as UserStatsType, LanguageStats, CallHistoryEntry, LiveTranscriptMessage, VocabWord } from "./types";
import { LANGUAGES, TEACHERS } from "./data/languages";
import LiveCall from "./components/LiveCall";
import UserStats from "./components/UserStats";
import LessonSetup from "./components/LessonSetup";
import { GraduationCap, BarChart3, Heart, Flame } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

const DEFAULT_LANGUAGE = LANGUAGES[0];
const DEFAULT_TEACHER = TEACHERS[0];

const emptyLanguageStats = (): LanguageStats => ({
  totalDurationSeconds: 0,
  completedCallsCount: 0,
  memories: [],
  vocabWords: [],
});

export default function App() {
  const [activeTab, setActiveTab] = useState<"lesson" | "stats">("lesson");
  const [lessonStep, setLessonStep] = useState<"select_lang" | "calling">("select_lang");

  const [selectedLanguage, setSelectedLanguage] = useState<Language>(DEFAULT_LANGUAGE);
  const [selectedLevel, setSelectedLevel] = useState("Средний (B1)");
const [selectedTeacher, setSelectedTeacher] = useState<Teacher>(DEFAULT_TEACHER);
  const [selectedGrammar, setSelectedGrammar] = useState<string[]>([]);
  const [prefsLoaded, setPrefsLoaded] = useState(false);

  useEffect(() => {
    const local = localStorage.getItem("lingo_live_prefs");
    if (local) {
      try {
        const prefs = JSON.parse(local);
        const lang = LANGUAGES.find((l) => l.id === prefs.languageId) || DEFAULT_LANGUAGE;
        const teacher = TEACHERS.find((t) => t.id === prefs.teacherId && t.languageId === lang.id)
          || TEACHERS.find((t) => t.languageId === lang.id)
          || DEFAULT_TEACHER;
        setSelectedLanguage(lang);
        setSelectedTeacher(teacher);
        if (prefs.level) setSelectedLevel(prefs.level);
      } catch {}
    }
    setPrefsLoaded(true);
  }, []);

  useEffect(() => {
    if (!prefsLoaded) return;
    localStorage.setItem("lingo_live_prefs", JSON.stringify({
      languageId: selectedLanguage.id,
      teacherId: selectedTeacher.id,
      level: selectedLevel,
    }));
  }, [prefsLoaded, selectedLanguage, selectedTeacher, selectedLevel]);

  const handleSelectLanguage = (lang: Language) => {
    setSelectedLanguage(lang);
    setSelectedGrammar([]);
    const firstTeacher = TEACHERS.find((t) => t.languageId === lang.id);
    if (firstTeacher) setSelectedTeacher(firstTeacher);
  };

  const [stats, setStats] = useState<UserStatsType>({
    history: [],
    byLanguage: {},
  });

  const [statsLanguage, setStatsLanguage] = useState<Language>(DEFAULT_LANGUAGE);

  useEffect(() => {
    const local = localStorage.getItem("lingo_live_stats");
    if (local) {
      try {
        const parsed = JSON.parse(local);
        // migrate legacy flat format (no byLanguage) — old data was always English-only
        if (!parsed.byLanguage) {
          const migrated: UserStatsType = {
            history: parsed.history || [],
            byLanguage: {
              [DEFAULT_LANGUAGE.id]: {
                totalDurationSeconds: parsed.totalDurationSeconds || 0,
                completedCallsCount: parsed.completedCallsCount || 0,
                memories: [...(parsed.userFacts || []), ...(parsed.conversationNotes || [])],
                vocabWords: parsed.vocabWords || [],
              },
            },
          };
          setStats(migrated);
          localStorage.setItem("lingo_live_stats", JSON.stringify(migrated));
        } else {
          setStats(parsed);
        }
      } catch {}
    }
  }, []);

  const saveStats = (updated: UserStatsType) => {
    setStats(updated);
    localStorage.setItem("lingo_live_stats", JSON.stringify(updated));
  };

  const getLangStats = (langId: string): LanguageStats =>
    stats.byLanguage[langId] || emptyLanguageStats();

  const updateLangStats = (langId: string, updater: (ls: LanguageStats) => LanguageStats) => {
    const current = getLangStats(langId);
    saveStats({ ...stats, byLanguage: { ...stats.byLanguage, [langId]: updater(current) } });
  };

  const activeLangStats = getLangStats(selectedLanguage.id);

  const handleClearHistory = () => {
    saveStats({ ...stats, history: stats.history.filter((h) => h.languageId !== statsLanguage.id) });
  };

  const handleSaveMemory = (memory: string) => {
    updateLangStats(selectedLanguage.id, (ls) =>
      ls.memories.includes(memory.trim()) ? ls : { ...ls, memories: [...ls.memories, memory.trim()] }
    );
  };

  const handleRemoveFact = (indexToRemove: number) => {
    updateLangStats(statsLanguage.id, (ls) => ({
      ...ls,
      memories: ls.memories.filter((_, i) => i !== indexToRemove),
    }));
  };

  const handleAddManualFact = (factText: string) => {
    if (!factText.trim()) return;
    updateLangStats(statsLanguage.id, (ls) =>
      ls.memories.includes(factText.trim()) ? ls : { ...ls, memories: [...ls.memories, factText.trim()] }
    );
  };

  const handleClearMemory = () => {
    updateLangStats(statsLanguage.id, (ls) => ({ ...ls, memories: [] }));
  };

  const handleClearWords = () => {
    updateLangStats(selectedLanguage.id, (ls) => ({ ...ls, vocabWords: [] }));
  };

  const handleAddWord = (word: VocabWord) => {
    updateLangStats(selectedLanguage.id, (ls) =>
      ls.vocabWords.some((w) => w.text.trim().toLowerCase() === word.text.trim().toLowerCase())
        ? ls
        : { ...ls, vocabWords: [...ls.vocabWords, word] }
    );
  };

  const handleRemoveWord = (id: string) => {
    updateLangStats(selectedLanguage.id, (ls) => ({ ...ls, vocabWords: ls.vocabWords.filter((w) => w.id !== id) }));
  };

  const handleHangUp = (durationSeconds: number, transcripts: LiveTranscriptMessage[]) => {
    const filteredCount = transcripts.filter((t) => t.speaker === "student" || t.speaker === "teacher").length;

    const newEntry: CallHistoryEntry = {
      id: "call_" + Date.now(),
      languageId: selectedLanguage.id,
      teacherId: selectedTeacher.id,
      languageName: selectedLanguage.name,
      teacherName: selectedTeacher.name,
      date: new Date().toLocaleString("ru-RU", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      }),
      durationSeconds,
      level: selectedLevel,
transcriptsCount: filteredCount,
      transcripts,
    };

    const langId = selectedLanguage.id;
    const current = getLangStats(langId);
    saveStats({
      ...stats,
      byLanguage: {
        ...stats.byLanguage,
        [langId]: {
          ...current,
          totalDurationSeconds: current.totalDurationSeconds + durationSeconds,
          completedCallsCount: current.completedCallsCount + 1,
        },
      },
      history: [newEntry, ...stats.history],
    });

    setStatsLanguage(selectedLanguage);
    setLessonStep("select_lang");
    setActiveTab("stats");
  };

  const handleGoToLesson = () => {
    setActiveTab("lesson");
    setLessonStep("select_lang");
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
                  selectedLanguage={selectedLanguage}
                  onSelectLanguage={handleSelectLanguage}
                  selectedLevel={selectedLevel}
                  setSelectedLevel={setSelectedLevel}
                  selectedTeacher={selectedTeacher}
                  setSelectedTeacher={setSelectedTeacher}
                  selectedGrammar={selectedGrammar}
                  setSelectedGrammar={setSelectedGrammar}
                  vocabWords={activeLangStats.vocabWords}
                  onAddWord={handleAddWord}
                  onRemoveWord={handleRemoveWord}
                  onClearWords={handleClearWords}
                  onStartCall={() => setLessonStep("calling")}
                />
              )}

              {lessonStep === "calling" && (
                <LiveCall
                  language={selectedLanguage}
                  teacher={selectedTeacher}
                  level={selectedLevel}
                  onHangUp={handleHangUp}
                  memories={activeLangStats.memories}
                  onSaveMemory={handleSaveMemory}
                  practiceGrammar={selectedGrammar}
                  vocabWords={activeLangStats.vocabWords}
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
                viewLanguage={statsLanguage}
                onSelectViewLanguage={setStatsLanguage}
                onClearHistory={handleClearHistory}
                onRemoveFact={handleRemoveFact}
                onAddManualFact={handleAddManualFact}
                onClearMemory={handleClearMemory}
              />
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      <footer className="bg-white border-t border-brand-sand py-8 text-center text-xs text-brand-dark/50 mt-12">
        <div className="flex items-center justify-center gap-1.5 font-medium text-brand-dark/70">
          Изучение языков <span className="font-serif italic font-bold">LingoLive</span> с ИИ • Создано с любовью к знаниям
          <Heart className="w-3.5 h-3.5 text-brand-red fill-brand-red" />
        </div>
        <p className="mt-2 text-brand-dark/40 max-w-md mx-auto">Для полноценной работы звонков требуется доступ к микрофону.</p>
      </footer>

    </div>
  );
}

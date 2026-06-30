import { useState, useRef } from "react";
import { Language, Teacher, VocabWord } from "../types";
import { LANGUAGES, TEACHERS } from "../data/languages";
import { GRAMMAR_TOPICS_BY_LANGUAGE } from "../data/grammar";
import { translateWord } from "../utils/translate";
import { Volume2, Trash2, Check, Plus, Sparkles, Play, BookOpen, Languages, Loader2 } from "lucide-react";
import { motion } from "motion/react";

const LEVELS = [
  { value: "Начальный (A1)", label: "Elementary (A1-A2)", desc: "Медленный темп, подсказки на русском, простая лексика." },
  { value: "Средний (B1)", label: "Intermediate (B1-B2)", desc: "Естественный темп, повседневные выражения, развитие оборотов." },
  { value: "Продвинутый (C1)", label: "Advanced (C1-C2)", desc: "Беглый темп носителя, современный сленг, идиомы и юмор." },
];

interface Props {
  selectedLanguage: Language;
  onSelectLanguage: (l: Language) => void;
  selectedLevel: string;
  setSelectedLevel: (v: string) => void;
  selectedTeacher: Teacher;
  setSelectedTeacher: (t: Teacher) => void;
  selectedGrammar: string[];
  setSelectedGrammar: (v: string[]) => void;
  vocabWords: VocabWord[];
  onAddWord: (word: VocabWord) => void;
  onRemoveWord: (id: string) => void;
  onClearWords: () => void;
  onStartCall: () => void;
}

const ACCENT_MAP: Record<string, string> = {
  en_sarah: "Британский акцент",
  en_emma: "Британский акцент",
  en_john: "Американский акцент",
  en_alex: "Американский акцент",
  en_olivia: "Австралийский акцент",
  en_marcus: "Британский акцент",
  fi_aino: "Хельсинкский говор",
  fi_eero: "Тамперский говор",
};


export default function LessonSetup({
  selectedLanguage,
  onSelectLanguage,
  selectedLevel,
  setSelectedLevel,
  selectedTeacher,
  setSelectedTeacher,
  selectedGrammar,
  setSelectedGrammar,
  vocabWords,
  onAddWord,
  onRemoveWord,
  onClearWords,
  onStartCall,
}: Props) {
  const teachersForLanguage = TEACHERS.filter((t) => t.languageId === selectedLanguage.id);
  const grammarTopicsForLanguage = GRAMMAR_TOPICS_BY_LANGUAGE[selectedLanguage.id] ?? [];
  const [wordInput, setWordInput] = useState("");
  const [isTranslating, setIsTranslating] = useState(false);
  const [wordError, setWordError] = useState("");
  const wordInputRef = useRef<HTMLInputElement>(null);

  const handleAddWord = async () => {
    const input = wordInput.trim();
    if (!input || isTranslating) return;
    setIsTranslating(true);
    setWordError("");
    try {
      const result = await translateWord(input);
      onAddWord({
        id: Date.now().toString(),
        text: result.word,
        transcription: result.transcription,
        translation: result.translation,
      });
      setWordInput("");
      wordInputRef.current?.focus();
    } catch {
      setWordError("Не удалось перевести. Попробуйте ещё раз.");
    } finally {
      setIsTranslating(false);
    }
  };

  const toggleGrammar = (label: string) => {
    setSelectedGrammar(
      selectedGrammar.includes(label)
        ? selectedGrammar.filter((g) => g !== label)
        : [...selectedGrammar, label]
    );
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-white rounded-[32px] p-6 sm:p-8 border border-brand-warm-gray shadow-sm space-y-8">
          {/* Header */}
          <div className="space-y-4">
            <div className="inline-flex items-center gap-1.5 bg-brand-light-gray text-brand-olive py-1.5 px-4 rounded-full text-[11px] font-bold border border-brand-sand/30">
              <Sparkles className="w-3.5 h-3.5 text-brand-terracotta" /> Голосовой агент: {selectedLanguage.name}
            </div>
            <h2 className="text-3xl font-serif font-bold italic text-brand-olive tracking-tight leading-tight">
              Персональная разговорная практика в реальном времени
            </h2>
            <p className="text-sm text-brand-dark/70 leading-relaxed">
              Ваш ИИ-собеседник обучен живой непринужденной беседе. Выберите язык, уровень и голос — преподаватель подстроится под ваш ритм.
            </p>
          </div>

          {/* Language selector */}
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-brand-olive/80 block">
              1. Какой язык изучаем
            </label>
            <div className="flex flex-wrap gap-3">
              {LANGUAGES.map((lang) => {
                const isSelected = selectedLanguage.id === lang.id;
                return (
                  <button
                    key={lang.id}
                    onClick={() => onSelectLanguage(lang)}
                    className={`px-4 py-2.5 rounded-2xl border flex items-center gap-2 transition-all cursor-pointer ${
                      isSelected
                        ? "border-brand-terracotta bg-brand-light-gray/40 ring-2 ring-brand-terracotta/25"
                        : "border-brand-sand/55 bg-white hover:border-brand-sand hover:bg-brand-cream/40"
                    }`}
                  >
                    <span className="text-lg leading-none">{lang.flag}</span>
                    <span className={`text-xs font-bold ${isSelected ? "text-brand-terracotta" : "text-brand-olive"}`}>
                      {lang.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Level selector */}
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-brand-olive/80 block">
              2. Ваш текущий уровень
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {LEVELS.map((item) => {
                const isSelected = selectedLevel === item.value;
                return (
                  <button
                    key={item.value}
                    onClick={() => setSelectedLevel(item.value)}
                    className={`p-4 rounded-2xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                      isSelected
                        ? "border-brand-terracotta bg-brand-light-gray/40 ring-2 ring-brand-terracotta/25"
                        : "border-brand-sand/55 bg-white hover:border-brand-sand hover:bg-brand-cream/40"
                    }`}
                  >
                    <span className={`text-xs font-bold ${isSelected ? "text-brand-terracotta" : "text-brand-olive"}`}>
                      {item.label}
                    </span>
                    <span className="text-[10px] text-brand-dark/60 leading-tight">{item.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Teacher / Voice selector */}
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-brand-olive/80 block">
              3. Выберите голос собеседника
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {teachersForLanguage.map((teacher) => {
                const isSelected = selectedTeacher.id === teacher.id;
                const accent = ACCENT_MAP[teacher.id];
                return (
                  <div
                    key={teacher.id}
                    onClick={() => setSelectedTeacher(teacher)}
                    className={`p-5 rounded-2xl border text-left flex gap-4 transition-all cursor-pointer relative overflow-hidden ${
                      isSelected
                        ? "border-brand-terracotta bg-brand-light-gray/45 ring-2 ring-brand-terracotta/25 shadow-sm"
                        : "border-brand-sand/55 bg-white hover:border-brand-sand hover:bg-brand-cream/45"
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute top-0 right-0 bg-brand-terracotta text-white text-[9px] font-bold px-2.5 py-0.5 rounded-bl-xl uppercase tracking-wider flex items-center gap-1 shadow-sm">
                        <Check className="w-3 h-3 stroke-3" /> Выбран
                      </div>
                    )}
                    <div className="relative shrink-0 mt-1">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center font-serif font-bold uppercase text-base ${
                        isSelected ? "bg-brand-terracotta text-white" : "bg-brand-olive text-brand-cream"
                      }`}>
                        {teacher.name[0]}
                      </div>
                    </div>
                    <div className="space-y-1.5 flex-1 pr-4">
                      <h4 className="font-serif font-bold italic text-brand-dark text-base flex items-center gap-1.5">
                        {teacher.name}
                        <span className="text-[10px] font-sans font-normal text-brand-dark/50">({accent})</span>
                      </h4>
                      <p className="text-[10.5px] text-brand-dark/70 leading-relaxed">{teacher.persona}</p>
                      <div className="flex gap-1.5 pt-1">
                        <span className="text-[9px] font-bold uppercase tracking-wider bg-brand-light-gray border border-brand-sand/60 px-2 py-0.5 rounded-lg text-brand-olive flex items-center gap-1 text-[10px]">
                          <Volume2 className="w-3 h-3 text-brand-terracotta" /> Голос: {teacher.voiceName}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Grammar focus */}
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-brand-olive/80 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-brand-terracotta" />
              4. Фокус на грамматике
              <span className="text-brand-dark/40 normal-case font-normal tracking-normal ml-1">(необязательно)</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {grammarTopicsForLanguage.map((topic) => {
                const isSelected = selectedGrammar.includes(topic.label);
                return (
                  <button
                    key={topic.id}
                    onClick={() => toggleGrammar(topic.label)}
                    title={topic.description}
                    className={`px-3 py-1.5 rounded-xl border text-[11px] font-semibold transition-all cursor-pointer ${
                      isSelected
                        ? "bg-brand-terracotta text-white border-brand-terracotta shadow-sm"
                        : "bg-white text-brand-dark/70 border-brand-sand/60 hover:border-brand-terracotta/40 hover:text-brand-dark"
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 inline mr-1 stroke-3" />}
                    {topic.label}
                  </button>
                );
              })}
            </div>
            {selectedGrammar.length > 0 && (
              <p className="text-[10.5px] text-brand-terracotta/80 italic">
                ИИ будет активно использовать эти конструкции и поправлять ошибки в них
              </p>
            )}
          </div>

          {/* Vocabulary */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-brand-olive/80 flex items-center gap-1.5">
                <Languages className="w-3.5 h-3.5 text-brand-terracotta" />
                5. Словарь урока
                <span className="text-brand-dark/40 normal-case font-normal tracking-normal ml-1">(необязательно)</span>
              </label>
              {vocabWords.length > 0 && (
                <button onClick={onClearWords} className="text-[10px] text-brand-dark/40 hover:text-brand-red transition-colors cursor-pointer shrink-0">
                  Очистить
                </button>
              )}
            </div>
            <p className="text-[10.5px] text-brand-dark/55 leading-relaxed">
              Добавьте слова или фразы — ИИ будет вплетать их в разговор и следить за тем, чтобы вы их использовали.
            </p>

            {vocabWords.length > 0 && (
              <div className="space-y-1.5">
                {vocabWords.map((w) => (
                  <div
                    key={w.id}
                    className="flex items-start justify-between gap-2 bg-brand-light-gray/50 border border-brand-sand/60 rounded-xl px-3 py-2 group"
                  >
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <span className="text-[12px] font-semibold text-brand-dark">{w.text}</span>
                        {w.transcription && (
                          <span className="text-[10px] text-brand-dark/40 font-mono">{w.transcription}</span>
                        )}
                      </div>
                      {w.translation && (
                        <p className="text-[10.5px] text-brand-dark/55">{w.translation}</p>
                      )}
                    </div>
                    <button
                      onClick={() => onRemoveWord(w.id)}
                      className="text-brand-dark/25 hover:text-brand-red opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shrink-0 mt-0.5"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <input
                ref={wordInputRef}
                type="text"
                value={wordInput}
                onChange={(e) => { setWordInput(e.target.value); setWordError(""); }}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddWord(); } }}
                placeholder="Слово или фраза на любом языке..."
                className="flex-1 p-2 border border-brand-sand/70 rounded-xl text-[11px] bg-brand-light-gray/30 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-terracotta"
              />
              <button
                onClick={handleAddWord}
                disabled={!wordInput.trim() || isTranslating}
                title="Перевести и добавить"
                className="py-2 px-3 bg-brand-terracotta hover:bg-[#C16C48] text-white rounded-xl text-xs font-bold transition-colors disabled:opacity-40 cursor-pointer shrink-0"
              >
                {isTranslating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
              </button>
            </div>
            {wordError && <p className="text-[10.5px] text-red-500 italic">{wordError}</p>}
          </div>

          {/* Start button */}
          <div className="pt-4 border-t border-brand-sand/60 flex justify-end">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onStartCall}
              className="py-4 px-10 bg-brand-terracotta text-white rounded-2xl font-bold hover:bg-[#C16C48] transition-colors flex items-center gap-3 text-sm shadow-md shadow-brand-terracotta/15 cursor-pointer"
              id="dash-start-call-btn"
            >
              Начать разговор
              <Play className="w-4 h-4 fill-current" />
            </motion.button>
          </div>
        </div>
    </div>
  );
}

import { Teacher } from "../types";
import { TEACHERS } from "../data/languages";
import { Volume2, Trash2, Check, Plus, Sparkles, Play } from "lucide-react";
import { motion } from "motion/react";

const LEVELS = [
  { value: "Начальный (A1)", label: "Elementary (A1-A2)", desc: "Медленный темп, подсказки на русском, простая лексика." },
  { value: "Средний (B1)", label: "Intermediate (B1-B2)", desc: "Естественный темп, повседневные выражения, развитие оборотов." },
  { value: "Продвинутый (C1)", label: "Advanced (C1-C2)", desc: "Беглый темп носителя, современный сленг, идиомы и юмор." },
];

interface Props {
  selectedLevel: string;
  setSelectedLevel: (v: string) => void;
  selectedTeacher: Teacher;
  setSelectedTeacher: (t: Teacher) => void;
  userFacts: string[];
  onRemoveFact: (idx: number) => void;
  onAddManualFact: (text: string) => void;
  onStartCall: () => void;
}

const ACCENT_MAP: Record<string, string> = {
  en_sarah: "Британский акцент",
  en_emma: "Британский акцент",
  en_john: "Американский акцент",
  en_alex: "Американский акцент",
  en_olivia: "Австралийский акцент",
  en_marcus: "Британский акцент",
};


export default function LessonSetup({
  selectedLevel,
  setSelectedLevel,
  selectedTeacher,
  setSelectedTeacher,
  userFacts,
  onRemoveFact,
  onAddManualFact,
  onStartCall,
}: Props) {

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Left + Center: Configuration */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white rounded-[32px] p-6 sm:p-8 border border-brand-warm-gray shadow-sm space-y-8">
          {/* Header */}
          <div className="space-y-4">
            <div className="inline-flex items-center gap-1.5 bg-brand-light-gray text-brand-olive py-1.5 px-4 rounded-full text-[11px] font-bold border border-brand-sand/30">
              <Sparkles className="w-3.5 h-3.5 text-brand-terracotta" /> Голосовой агент английского языка
            </div>
            <h2 className="text-3xl font-serif font-bold italic text-brand-olive tracking-tight leading-tight">
              Персональная разговорная практика в реальном времени
            </h2>
            <p className="text-sm text-brand-dark/70 leading-relaxed">
              Ваш ИИ-собеседник обучен живой непринужденной беседе. Выберите уровень и голос — преподаватель подстроится под ваш ритм.
            </p>
          </div>

          {/* Level selector */}
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-brand-olive/80 block">
              1. Ваш уровень английского
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
              2. Выберите голос собеседника
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {TEACHERS.map((teacher) => {
                const isSelected = selectedTeacher.id === teacher.id;
                const accent = ACCENT_MAP[teacher.id] ?? "Английский акцент";
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
                        <Check className="w-3 h-3 stroke-[3]" /> Выбран
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

      {/* Right column: Memory Panel */}
      <div className="space-y-6">
        <div className="bg-white rounded-[32px] p-6 border border-brand-warm-gray shadow-sm h-full flex flex-col justify-between space-y-4">
          <div className="space-y-2 border-b border-brand-sand/50 pb-3">
            <h4 className="text-xs font-bold text-brand-olive uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-brand-terracotta shrink-0 animate-pulse" />
              Память ИИ-репетитора
            </h4>
            <p className="text-[10.5px] text-brand-dark/50 leading-relaxed">
              Во время разговора репетитор автоматически сохранит факты о вас, чтобы использовать в будущих диалогах.
            </p>
          </div>

          <div className="flex-1 overflow-y-auto max-h-[280px] space-y-2.5 pr-1 scrollbar-thin">
            {userFacts.length === 0 ? (
              <div className="text-center py-12 text-brand-dark/40 italic space-y-2 text-xs">
                <span className="text-xl">🧠</span>
                <p>Память пока чиста. Расскажите репетитору о себе во время звонка — он запомнит это!</p>
              </div>
            ) : (
              <div className="space-y-2">
                {userFacts.map((fact, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-brand-light-gray/40 border border-brand-sand/40 rounded-xl flex justify-between items-start gap-2 text-xs text-brand-dark group hover:bg-brand-light-gray transition-colors"
                  >
                    <span className="leading-relaxed flex-1">💡 {fact}</span>
                    <button
                      onClick={() => onRemoveFact(idx)}
                      className="text-brand-dark/30 hover:text-brand-red opacity-0 group-hover:opacity-100 transition-opacity p-0.5 cursor-pointer"
                      title="Забыть факт"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-brand-sand/50 space-y-2">
            <p className="text-[10px] font-bold text-brand-dark/50 uppercase">Добавить факт вручную:</p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const input = (e.currentTarget.elements.namedItem("factInput") as HTMLInputElement);
                if (input.value.trim()) {
                  onAddManualFact(input.value);
                  input.value = "";
                }
              }}
              className="flex gap-2"
            >
              <input
                name="factInput"
                type="text"
                placeholder="Напр., Меня зовут Анна, я дизайнер"
                className="flex-1 p-2 border border-brand-sand/70 rounded-xl text-[11px] bg-brand-light-gray/30 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-terracotta"
              />
              <button
                type="submit"
                className="py-2 px-3 bg-brand-olive hover:bg-brand-olive/90 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import { UserStats as UserStatsType } from "../types";
import { Award, Trash2, Clock, BarChart3, Lightbulb, BookOpen } from "lucide-react";
import { motion } from "motion/react";

interface UserStatsProps {
  stats: UserStatsType;
  onClearHistory: () => void;
  onRemoveFact?: (index: number) => void;
  onAddManualFact?: (fact: string) => void;
  onRemoveWord?: (id: string) => void;
  onClearMemory?: () => void;
}

export default function UserStats({
  stats,
  onClearHistory,
  onRemoveFact,
  onAddManualFact,
  onRemoveWord,
  onClearMemory,
}: UserStatsProps) {
  const [activeTranscriptItem, setActiveTranscriptItem] = useState<any | null>(null);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins === 0) return `${secs} сек`;
    return `${mins} мин ${secs} сек`;
  };

  const achievements = [
    {
      id: "first_call",
      title: "Первый Контакт",
      desc: "Сделать 1 успешный звонок иностранному преподавателю.",
      unlocked: stats.completedCallsCount >= 1,
      icon: "📞",
    },
    {
      id: "talk_5min",
      title: "Разговорный Спринт",
      desc: "Наговорить более 5 минут (300 секунд) по аудиосвязи.",
      unlocked: stats.totalDurationSeconds >= 300,
      icon: "⏱️",
    },
    {
      id: "polyglot",
      title: "Юный Полиглот",
      desc: "Провести уроки по разным языкам (2 или более уникальных языков).",
      unlocked: new Set(stats.history.map((h) => h.languageId)).size >= 2,
      icon: "🌍",
    },
  ];

  return (
    <div className="space-y-6" id="user-stats-dashboard">
      
      {/* Краткие счетчики */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        <div className="bg-white border border-brand-warm-gray p-6 rounded-[28px] shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-brand-light-gray flex items-center justify-center text-brand-terracotta shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-brand-dark/50 font-bold uppercase tracking-wider block">Общее время практики</span>
            <p className="text-lg font-serif font-bold italic text-brand-olive">{formatDuration(stats.totalDurationSeconds)}</p>
          </div>
        </div>

        <div className="bg-white border border-brand-warm-gray p-6 rounded-[28px] shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-brand-light-gray flex items-center justify-center text-brand-terracotta shrink-0">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-brand-dark/50 font-bold uppercase tracking-wider block">Пройдено звонков</span>
            <p className="text-lg font-serif font-bold italic text-brand-olive">{stats.completedCallsCount} занятий</p>
          </div>
        </div>

        <div className="bg-white border border-brand-warm-gray p-6 rounded-[28px] shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-brand-light-gray flex items-center justify-center text-brand-terracotta shrink-0">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-brand-dark/50 font-bold uppercase tracking-wider block">Слов в учебнике</span>
            <p className="text-lg font-serif font-bold italic text-brand-olive">{(stats.vocabWords || []).length} слов</p>
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Мой словарь */}
        <div className="lg:col-span-1 bg-white border border-brand-warm-gray rounded-[32px] p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-brand-sand/40 pb-3">
            <BookOpen className="w-5 h-5 text-brand-terracotta" />
            <h3 className="font-serif font-bold italic text-brand-olive text-base">Мой словарь</h3>
          </div>

          {(!stats.vocabWords || stats.vocabWords.length === 0) ? (
            <div className="text-center py-8 text-[11px] text-brand-dark/40 italic">
              Словарь пуст. Добавьте слова перед уроком — ИИ будет отрабатывать их в разговоре.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {stats.vocabWords.map((w) => (
                <div
                  key={w.id}
                  className="p-3 bg-brand-light-gray/30 border border-brand-sand/40 rounded-2xl"
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
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Память обучения (Что помнит преподаватель) */}
        <div className="lg:col-span-2 bg-white border border-brand-warm-gray rounded-[32px] p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-brand-sand/40 pb-3">
            <div className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-brand-terracotta" />
              <h3 className="font-serif font-bold italic text-brand-olive text-base">Что помнит преподаватель</h3>
            </div>
            {[...(stats.userFacts || []), ...(stats.conversationNotes || [])].length > 0 && (
              <button
                onClick={onClearMemory}
                className="text-[10.5px] text-brand-dark/50 hover:text-brand-red underline font-medium cursor-pointer"
              >
                Очистить память
              </button>
            )}
          </div>

          <div className="space-y-3">
            <p className="text-[11px] text-brand-dark/60 leading-relaxed">
              Преподаватель запоминает ваше имя, увлечения, цели и уровень, настраивая темп речи и используемые слова.
            </p>

            {/* Custom Manual Fact adding form */}
            <form onSubmit={(e) => {
              e.preventDefault();
              const input = (e.currentTarget.elements.namedItem("factText") as HTMLInputElement);
              if (input && input.value.trim() && onAddManualFact) {
                onAddManualFact(input.value.trim());
                input.value = "";
              }
            }} className="flex gap-1.5 shadow-xs">
              <input
                name="factText"
                type="text"
                placeholder="Записать факт вручную..."
                className="flex-1 py-1.5 px-3 border border-brand-sand/70 rounded-xl text-xs focus:ring-1 focus:ring-brand-terracotta bg-brand-light-gray/25 outline-none text-brand-dark"
              />
              <button
                type="submit"
                className="bg-brand-olive text-white px-3 py-1.5 rounded-xl text-sm font-bold hover:bg-brand-olive/90 transition-colors cursor-pointer shrink-0"
              >
                +
              </button>
            </form>

            {(() => {
              const allMemories = [...(stats.userFacts || []), ...(stats.conversationNotes || [])];
              return (
            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
              {allMemories.length === 0 ? (
                <div className="p-3.5 rounded-2xl bg-brand-light-gray/20 border border-brand-sand/30 text-center py-6 text-[11px] text-brand-dark/50 italic leading-normal">
                  Память пуста. Преподаватель автоматически сохранит важное во время занятия!
                </div>
              ) : (
                allMemories.map((fact, index) => (
                  <div
                    key={index}
                    className="p-2.5 bg-brand-light-gray/20 border border-brand-olive/10 rounded-xl flex justify-between items-center gap-2 text-xs"
                  >
                    <span className="text-brand-dark/95 leading-normal flex-1">💡 {fact}</span>
                    <button
                      type="button"
                      onClick={() => onRemoveFact && onRemoveFact(index)}
                      className="p-1 text-brand-dark/40 hover:text-brand-red hover:bg-brand-red/10 rounded transition-colors shrink-0 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
            );
            })()}
          </div>
        </div>

      </div>

      {/* Роскошные Достижения */}
      <div className="bg-white border border-brand-warm-gray rounded-[32px] p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-brand-sand/40 pb-3">
          <Award className="w-5 h-5 text-brand-terracotta" />
          <h3 className="font-serif font-bold italic text-brand-olive text-base">Ваши персональные достижения</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {achievements.map((ach) => (
            <div
              key={ach.id}
              className={`p-4 rounded-3xl border flex gap-3.5 transition-all ${
                ach.unlocked
                  ? "border-brand-olive/30 bg-brand-light-gray/30 opacity-100"
                  : "border-brand-sand/20 bg-brand-light-gray/10 opacity-50"
              }`}
            >
              <div className="text-2xl select-none flex items-center justify-center shrink-0">
                {ach.unlocked ? ach.icon : "🔒"}
              </div>
              <div className="space-y-0.5">
                <h4 className={`text-xs font-bold ${ach.unlocked ? "text-brand-olive" : "text-brand-dark/50"}`}>
                  {ach.title}
                </h4>
                <p className="text-[10.5px] text-brand-dark/50 leading-snug">{ach.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* История звонков */}
      <div className="bg-white border border-brand-warm-gray rounded-[32px] p-6 shadow-sm space-y-4">
        <div className="flex justify-between items-center border-b border-brand-sand/40 pb-3">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-brand-terracotta" />
            <h3 className="font-serif font-bold italic text-brand-olive text-base">История ваших занятий</h3>
          </div>
          {stats.history.length > 0 && (
            <button
              onClick={onClearHistory}
              className="text-[10.5px] text-brand-dark/50 hover:text-brand-red underline font-medium cursor-pointer"
            >
              Очистить историю
            </button>
          )}
        </div>

        {stats.history.length === 0 ? (
          <div className="text-center py-8 text-xs text-brand-dark/40 italic">
            История звонков пока пуста. Сделайте первый аудиозвонок, чтобы записать урок!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-brand-dark/80">
              <thead>
                <tr className="border-b border-brand-sand/30 text-brand-dark/50">
                  <th className="py-2 font-serif font-bold italic text-brand-olive text-sm">Преподаватель</th>
                  <th className="py-2 font-bold uppercase tracking-wider text-[10px]">Язык</th>
                  <th className="py-2 font-bold uppercase tracking-wider text-[10px]">Время и Уровень</th>
                  <th className="py-2 font-bold uppercase tracking-wider text-[10px]">Длительность</th>
                  <th className="py-2 font-bold uppercase tracking-wider text-[10px]">Транскрипт</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-sand/20 text-brand-dark/95">
                {stats.history.map((item) => (
                  <tr
                    key={item.id}
                    title="Нажмите, чтобы прочитать полный транскрипт разговора"
                    className="hover:bg-brand-light-gray/30 cursor-pointer transition-all duration-150 group"
                    onClick={() => setActiveTranscriptItem(item)}
                  >
                    <td className="py-3 font-serif font-bold italic text-brand-olive text-sm flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-brand-light-gray text-[10px] font-sans font-bold flex items-center justify-center uppercase border border-brand-sand/40">
                        {item.teacherName[0]}
                      </span>
                      {item.teacherName}
                    </td>
                    <td className="py-3 font-medium">{item.languageName}</td>
                    <td className="py-3">
                      <div className="space-y-0.5">
                        <span className="text-[10px] text-brand-dark/50 block font-normal">{item.date}</span>
                        <span className="text-[10px] bg-brand-light-gray text-brand-olive border border-brand-sand/40 px-1.5 py-0.2 rounded font-medium">
                          {item.level}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 font-mono">{formatDuration(item.durationSeconds)}</td>
                    <td className="py-3 font-bold text-brand-terracotta group-hover:underline flex items-center gap-1.5">
                      {item.transcriptsCount} фраз
                      <span className="text-[11px] text-brand-dark/30 group-hover:text-brand-terracotta transition-colors">➔</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Модальное окно просмотра полного транскрипта урока (Dialogue history) */}
      {activeTranscriptItem && (
        <div className="fixed inset-0 bg-black/45 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-[32px] border border-brand-sand shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col p-6 space-y-4"
          >
            {/* Header */}
            <div className="flex justify-between items-start border-b border-brand-sand/40 pb-3 shrink-0">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold tracking-wider text-brand-terracotta bg-brand-terracotta/10 px-2 py-0.5 rounded-md">
                  История занятия
                </span>
                <h3 className="font-serif font-bold italic text-brand-olive text-lg">
                  Диалог с преподавателем {activeTranscriptItem.teacherName}
                </h3>
                <p className="text-[11px] text-brand-dark/60">
                  Язык: <span className="font-semibold text-brand-olive">{activeTranscriptItem.languageName}</span> | Дата: {activeTranscriptItem.date} | Уровень: {activeTranscriptItem.level}
                </p>
              </div>
              <button
                onClick={() => setActiveTranscriptItem(null)}
                className="w-8 h-8 rounded-full bg-brand-light-gray hover:bg-brand-sand/40 flex items-center justify-center text-brand-dark/60 hover:text-brand-dark transition-colors cursor-pointer text-sm font-bold shadow-xs"
              >
                ✕
              </button>
            </div>

            {/* Transcript Messages Area */}
            <div className="flex-1 overflow-y-auto pr-2 space-y-3 p-3 min-h-[300px] bg-brand-light-gray/20 rounded-2xl border border-brand-sand/35">
              {!activeTranscriptItem.transcripts || activeTranscriptItem.transcripts.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-xs text-brand-dark/40 italic py-20 space-y-2">
                  <span className="text-3xl">💬</span>
                  <p>Разговор завершен без реплик или аудио было слишком коротким.</p>
                </div>
              ) : (
                activeTranscriptItem.transcripts.map((msg: any, idx: number) => {
                  const isTeacher = msg.speaker === "teacher";
                  const isSystem = msg.speaker === "system";

                  if (isSystem) {
                    return (
                      <div key={msg.id || idx} className="flex justify-center my-2">
                        <span className="bg-brand-terracotta/10 border border-brand-terracotta/20 text-brand-terracotta text-[10px] px-3 py-1 rounded-full font-medium">
                          {msg.text}
                        </span>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={msg.id || idx}
                      className={`flex flex-col max-w-[85%] ${isTeacher ? "mr-auto items-start" : "ml-auto items-end"}`}
                    >
                      <div className="flex items-center gap-1.5 px-1">
                        <span className="text-[10px] font-bold text-brand-olive uppercase">
                          {isTeacher ? activeTranscriptItem.teacherName : "Вы"}
                        </span>
                        <span className="text-[9px] text-brand-dark/45 font-mono">{msg.timestamp}</span>
                      </div>
                      <div
                        className={`mt-1 p-3 rounded-2xl text-xs leading-relaxed ${
                          isTeacher
                            ? "bg-white border border-brand-sand/65 text-brand-dark rounded-tl-sm shadow-xs"
                            : "bg-brand-olive text-white rounded-tr-sm shadow-xs"
                        }`}
                      >
                        {msg.text}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="pt-2 flex justify-end shrink-0">
              <button
                onClick={() => setActiveTranscriptItem(null)}
                className="bg-brand-olive text-white px-5 py-2.5 rounded-2xl text-xs font-bold hover:bg-brand-olive/90 transition-colors shadow-sm cursor-pointer"
              >
                Закрыть просмотр
              </button>
            </div>
          </motion.div>
        </div>
      )}

    </div>
  );
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from "react";
import { Language, Teacher, LiveTranscriptMessage } from "../types";
import { floatTo16BitPCM, arrayBufferToBase64, base64ToFloat32Array, downsampleBuffer } from "../utils/audio";
import { createGeminiSession, GeminiLiveSession } from "../utils/geminiLive";
import { PhoneOff, Mic, RefreshCw, Volume2, MessagesSquare, Clock } from "lucide-react";
import { motion } from "motion/react";

interface LiveCallProps {
  language: Language;
  teacher: Teacher;
  level: string;
  topic: string;
  onHangUp: (durationSeconds: number, transcripts: LiveTranscriptMessage[]) => void;
  userFacts?: string[];
  conversationNotes?: string[];
  onSaveFact?: (fact: string) => void;
  onSaveNote?: (note: string) => void;
  practiceGrammar?: string[];
}

export default function LiveCall({
  language,
  teacher,
  level,
  topic,
  onHangUp,
  userFacts = [],
  conversationNotes = [],
  onSaveFact,
  onSaveNote,
  practiceGrammar = [],
}: LiveCallProps) {
  const [sessionStatus, setSessionStatus] = useState<"idle" | "connecting" | "active" | "error" | "closed">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [transcripts, setTranscripts] = useState<LiveTranscriptMessage[]>([]);
  const [studentVolume, setStudentVolume] = useState(0);
  const [teacherVolume, setTeacherVolume] = useState(0);
  const [audioUnlocked, setAudioUnlocked] = useState(false);
  

  // Low-level Ref handles
  const geminiSessionRef = useRef<GeminiLiveSession | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const inputAudioCtxRef = useRef<AudioContext | null>(null);
  const processorNodeRef = useRef<ScriptProcessorNode | null>(null);
  const outputAudioCtxRef = useRef<AudioContext | null>(null);
  
  const activeSourcesRef = useRef<AudioBufferSourceNode[]>([]);
  const nextStartTimeRef = useRef<number>(0);
  const transcriptsEndRef = useRef<HTMLDivElement | null>(null);
  const transcriptContainerRef = useRef<HTMLDivElement | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const callStartTimeRef = useRef<number>(0);
  const micSourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  // Guards against React StrictMode double-invoking the effect in dev mode
  const sessionStartedRef = useRef(false);

  // Auto-scroll only inside the transcript container, not the whole page
  useEffect(() => {
    if (transcriptContainerRef.current) {
      transcriptContainerRef.current.scrollTop = transcriptContainerRef.current.scrollHeight;
    }
  }, [transcripts]);

  // Connect on mount
  useEffect(() => {
    if (sessionStartedRef.current) return;
    sessionStartedRef.current = true;
    startSession();
    return () => {
      cleanupSession();
    };
  }, []);

  // Format timer
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const appendTranscript = (speaker: "student" | "teacher", text: string) => {
    setTranscripts((prev) => {
      const filtered = prev.filter(m => m.id !== "sys-init" && m.id !== "sys-connected");
      const lastIndex = filtered.length - 1;
      if (lastIndex >= 0 && filtered[lastIndex].speaker === speaker) {
        const last = filtered[lastIndex];
        const cleanNew = text.trim();
        if (last.text.includes(cleanNew)) return filtered;
        const updated = [...filtered];
        updated[lastIndex] = { ...last, text: (last.text + " " + cleanNew).trim().replace(/\s+/g, " ") };
        return updated;
      }
      return [...filtered, {
        id: Math.random().toString(),
        speaker,
        text: text.trim(),
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      }];
    });
  };

  // Connect directly to Gemini Live API from the browser
  const startSession = async () => {
    setErrorMessage("");
    setSessionStatus("connecting");
    setDurationSeconds(0);
    setTranscripts([{
      id: "sys-init",
      speaker: "system",
      text: `Устанавливаем соединение с ИИ-преподавателем ${teacher.name}...`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
    }]);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      micStreamRef.current = stream;

      // Don't force sample rate — iOS Safari throws NotSupportedError with custom rates.
      // Downsampling to 16kHz happens in startMicrophoneNode; output buffers specify their own rate.
      inputAudioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      outputAudioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      // Resume immediately while inside the user gesture (button click).
      // Mobile browsers (Android/iOS) block AudioContext.resume() outside of a gesture.
      await inputAudioCtxRef.current.resume();
      await outputAudioCtxRef.current.resume();
      nextStartTimeRef.current = 0;

      const session = await createGeminiSession(
        {
          languageName: language.englishName,
          studentLevel: level,
          teacherName: teacher.name,
          voiceName: teacher.voiceName,
          currentTopic: topic,
          baseSystemPrompt: teacher.systemInstruction,
          userFacts,
          conversationNotes,
          practiceGrammar,
        },
        {
          onAudio: (base64) => playTeacherAudioChunk(base64),
          onTeacherTranscription: (text) => appendTranscript("teacher", text),
          onStudentTranscription: (text) => appendTranscript("student", text),
          onInterrupted: () => handleVoiceInterruption(),
          onSaveFact: (fact) => {
            onSaveFact?.(fact);
            setTranscripts((prev) => [...prev, {
              id: "fact_" + Date.now(), speaker: "system",
              text: `💡 Факт сохранён: "${fact}"`,
              timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            }]);
          },
          onSaveNote: (note) => {
            onSaveNote?.(note);
            setTranscripts((prev) => [...prev, {
              id: "note_" + Date.now(), speaker: "system",
              text: `📝 Заметка сохранена: "${note}"`,
              timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            }]);
          },
          onEndCall: () => setTimeout(() => handleManualHangup(), 3500),
          onMicReady: () => startMicrophoneNode(stream),
          onDisconnected: (reason) => {
            console.warn("Gemini session disconnected:", reason);
            setErrorMessage(`Соединение прервано: ${reason}. Нажмите «Попробовать снова».`);
            setSessionStatus("error");
            cleanupSession();
          },
        }
      );

      geminiSessionRef.current = session;
      setSessionStatus("active");
      callStartTimeRef.current = Date.now();
      timerIntervalRef.current = setInterval(() => {
        setDurationSeconds(Math.floor((Date.now() - callStartTimeRef.current) / 1000));
      }, 500);

      setTranscripts((prev) => [...prev, {
        id: "sys-connected", speaker: "system",
        text: `${teacher.name} сейчас поприветствует вас на ${language.name}. Ожидайте...`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      }]);

    } catch (err: any) {
      console.error("Session start failed:", err);
      setErrorMessage(
        err.name === "NotAllowedError" || err.message?.includes("Permission")
          ? "Доступ к микрофону заблокирован. Разрешите его в настройках браузера."
          : `Не удалось начать сессию: ${err.message || err}`
      );
      setSessionStatus("error");
      cleanupSession();
    }
  };

  // Convert and capture mic input channels
  const startMicrophoneNode = (stream: MediaStream) => {
    if (!inputAudioCtxRef.current) return;
    const ctx = inputAudioCtxRef.current;
    
    const sourceNode = ctx.createMediaStreamSource(stream);
    micSourceNodeRef.current = sourceNode;
    // Buffer size of 4096 gives neat packetization intervals (~250ms)
    const processor = ctx.createScriptProcessor(4096, 1, 1);
    processorNodeRef.current = processor;

    sourceNode.connect(processor);
    processor.connect(ctx.destination);

    processor.onaudioprocess = (e) => {
      if (!geminiSessionRef.current) return;

      const floatSamples = e.inputBuffer.getChannelData(0);

      // Render physical reactive wave for student
      let sum = 0;
      for (let i = 0; i < floatSamples.length; i++) {
        sum += floatSamples[i] * floatSamples[i];
      }
      const rms = Math.sqrt(sum / floatSamples.length);
      setStudentVolume(rms);

      // Prevent initial microphone hardware clicks/pops on initialization by ignoring first 300ms.
      if (Date.now() - callStartTimeRef.current < 300) {
        return;
      }

      const resampled = downsampleBuffer(floatSamples, ctx.sampleRate, 16000);
      const pcmBuffer = floatTo16BitPCM(resampled);
      const base64Audio = arrayBufferToBase64(pcmBuffer);
      geminiSessionRef.current?.sendAudio(base64Audio);
    };
  };

  // Precision gapless playback of Gemini speaker stream
  const playTeacherAudioChunk = async (base64Chunk: string) => {
    if (!outputAudioCtxRef.current) return;
    const ctx = outputAudioCtxRef.current;

    if (ctx.state === "suspended") {
      await ctx.resume();
    }

    const pcmSamples = base64ToFloat32Array(base64Chunk);
    
    // Animate teacher's waveform volume reactive
    let sum = 0;
    for (let i = 0; i < pcmSamples.length; i++) {
      sum += pcmSamples[i] * pcmSamples[i];
    }
    const rms = Math.sqrt(sum / pcmSamples.length);
    setTeacherVolume((prev) => Math.max(prev * 0.4, rms)); // smooth decay

    const audioBuffer = ctx.createBuffer(1, pcmSamples.length, 24000);
    audioBuffer.getChannelData(0).set(pcmSamples);

    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(ctx.destination);

    activeSourcesRef.current.push(source);
    source.onended = () => {
      activeSourcesRef.current = activeSourcesRef.current.filter((src) => src !== source);
    };

    const currentTime = ctx.currentTime;
    if (nextStartTimeRef.current < currentTime) {
      nextStartTimeRef.current = currentTime + 0.05; // tiny playback tolerance buffer
    }

    source.start(nextStartTimeRef.current);
    nextStartTimeRef.current += audioBuffer.duration;
  };

  // React to student cutting into AI conversation flow
  const handleVoiceInterruption = () => {
    console.log("Teacher voice interrupted. Flushing active voice timeline buffers immediately.");
    activeSourcesRef.current.forEach((src) => {
      try {
        src.stop();
      } catch (err) {
        // already stopped
      }
    });
    activeSourcesRef.current = [];
    nextStartTimeRef.current = 0;
    setTeacherVolume(0);
  };

  const handleUnlockAudio = async () => {
    try {
      if (inputAudioCtxRef.current?.state === "suspended") await inputAudioCtxRef.current.resume();
      if (outputAudioCtxRef.current?.state === "suspended") await outputAudioCtxRef.current.resume();
      // Restart mic node if it never started
      if (!processorNodeRef.current && micStreamRef.current) {
        startMicrophoneNode(micStreamRef.current);
      }
      // Re-trigger agent greeting — the first one may have played while output was suspended
      nextStartTimeRef.current = 0;
      geminiSessionRef.current?.retrigger();
      setAudioUnlocked(true);
    } catch (err) {
      console.error("Audio unlock failed:", err);
    }
  };

  const cleanupSession = () => {
    if (timerIntervalRef.current) { clearInterval(timerIntervalRef.current); timerIntervalRef.current = null; }
    if (micSourceNodeRef.current) { try { micSourceNodeRef.current.disconnect(); } catch {} micSourceNodeRef.current = null; }
    if (processorNodeRef.current) { try { processorNodeRef.current.disconnect(); } catch {} processorNodeRef.current = null; }
    if (micStreamRef.current) { try { micStreamRef.current.getTracks().forEach((t: MediaStreamTrack) => t.stop()); } catch {} micStreamRef.current = null; }
    if (inputAudioCtxRef.current) { try { inputAudioCtxRef.current.close(); } catch {} inputAudioCtxRef.current = null; }
    if (outputAudioCtxRef.current) { try { outputAudioCtxRef.current.close(); } catch {} outputAudioCtxRef.current = null; }
    geminiSessionRef.current?.close();
    geminiSessionRef.current = null;
    setStudentVolume(0);
    setTeacherVolume(0);
  };

  const handleManualHangup = () => {
    cleanupSession();
    onHangUp(durationSeconds, transcripts);
  };

  // Render responsive voice ripple wave SVG height
  const getAmplitudeScale = (volume: number) => {
    return Math.min(100, Math.floor(volume * 500));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="live-call-container">
      {/* Левая интерактивная колонка: Кабина Аудио звонка */}
      <div className="lg:col-span-2 space-y-6 flex flex-col justify-between">
        <div className={`border rounded-[32px] p-4 sm:p-6 shadow-sm flex-1 flex flex-col justify-between space-y-4 sm:space-y-6 min-h-85 sm:min-h-120 transition-all relative overflow-hidden ${
          sessionStatus === "active"
            ? "bg-brand-olive text-brand-cream border-brand-olive/80"
            : "bg-white text-brand-dark border-brand-warm-gray"
        }`}>
          {/* Abstract background graphics when session is active */}
          {sessionStatus === "active" && (
            <>
              <div className="absolute w-96 h-96 border border-white/[0.04] rounded-full -top-12 -left-12 pointer-events-none" />
              <div className="absolute w-[500px] h-[500px] border border-white/[0.02] rounded-full -bottom-24 -right-12 pointer-events-none" />
            </>
          )}
          
          {/* Шапка звонка */}
          <div className={`flex justify-between items-center p-3 sm:p-4 rounded-2xl border transition-all ${
            sessionStatus === "active"
              ? "bg-[#4E4E37] border-white/10"
              : "bg-brand-light-gray/30 border-brand-sand/60"
          }`}>
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="relative shrink-0">
                <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-serif font-bold uppercase text-sm ${
                  sessionStatus === "active" ? "bg-brand-terracotta text-white" : "bg-brand-olive text-brand-cream"
                }`}>
                  {teacher.name[0]}
                </div>
                {sessionStatus === "active" && (
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-brand-terracotta border-2 border-brand-olive rounded-full animate-pulse" />
                )}
              </div>
              <div className="min-w-0">
                <h4 className={`font-serif font-bold italic text-sm leading-none truncate ${
                    sessionStatus === "active" ? "text-white" : "text-brand-olive"
                  }`}>
                  {teacher.name}
                  <span className={`hidden sm:inline text-[10px] font-sans font-normal ml-1 ${sessionStatus === "active" ? "text-white/60" : "text-brand-dark/50"}`}>({teacher.russianName})</span>
                </h4>
                <p className={`text-[10px] font-medium truncate mt-0.5 ${sessionStatus === "active" ? "text-white/60" : "text-brand-dark/50"}`}>
                  {level}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0 ml-2">
              <Clock className="w-3.5 h-3.5 text-brand-terracotta" />
              <span className={`font-mono text-sm font-bold px-2 py-1 rounded-xl border ${
                sessionStatus === "active"
                  ? "bg-brand-terracotta text-white border-brand-terracotta/40"
                  : "bg-brand-light-gray text-brand-dark border-brand-sand/65"
              }`}>
                {formatTime(durationSeconds)}
              </span>
            </div>
          </div>

          {/* Индикатор сессии и волны */}
          <div className="flex-1 flex flex-col items-center justify-center space-y-8 py-4 relative z-10">
            
            {sessionStatus === "connecting" && (
              <div className="text-center space-y-4">
                <RefreshCw className="w-10 h-10 text-brand-terracotta animate-spin mx-auto" />
                <p className="text-xs text-brand-dark/60 font-medium animate-pulse">
                  Пожалуйста, подождите. Идет вызов преподавателя в реальном времени...
                </p>
              </div>
            )}

            {sessionStatus === "error" && (
              <div className="text-center p-6 space-y-3 max-w-sm">
                <p className="text-sm font-bold font-serif italic text-brand-red">Ошибка подключения</p>
                <div className="text-xs text-brand-dark/80 bg-brand-red/10 border border-brand-red/20 p-4 rounded-xl break-words">
                  {errorMessage || "Неизвестный сбой сессии."}
                </div>
                <button
                  onClick={startSession}
                  className="py-2.5 px-6 bg-brand-olive hover:bg-brand-olive/90 text-brand-cream rounded-xl text-xs font-bold shadow-sm transition-colors mt-4 cursor-pointer"
                >
                  Попробовать снова
                </button>
              </div>
            )}

            {sessionStatus === "active" && (
              <div className="flex flex-col items-center justify-center gap-10 w-full">
                
                {/* Тандем Голосовых Радаров */}
                <div className="grid grid-cols-2 gap-10 max-w-sm w-full mx-auto">
                  
                  {/* Левый радар: Студент */}
                  <div className="flex flex-col items-center gap-3">
                    <div className="relative flex items-center justify-center">
                      <motion.div
                        animate={{
                          scale: 1 + studentVolume * 2,
                          opacity: 1 - studentVolume,
                        }}
                        transition={{ duration: 0.1 }}
                        className="absolute w-24 h-24 rounded-full bg-brand-terracotta/20"
                      />
                      <div className="w-20 h-20 rounded-full border border-white/10 bg-white/5 flex items-center justify-center relative shadow-sm">
                        <Mic className="w-6 h-6 text-brand-terracotta" />
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-white/50 uppercase tracking-wide">Ваш микрофон</span>
                    
                    {/* График RMS громкости */}
                    <div className="h-1.5 w-24 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-brand-terracotta transition-all duration-75"
                        style={{ width: `${getAmplitudeScale(studentVolume)}%` }}
                      />
                    </div>
                  </div>

                  {/* Правый радар: Преподаватель */}
                  <div className="flex flex-col items-center gap-3">
                    <div className="relative flex items-center justify-center">
                      <motion.div
                        animate={{
                          scale: 1 + teacherVolume * 3,
                          opacity: 1 - teacherVolume,
                        }}
                        transition={{ duration: 0.1 }}
                        className="absolute w-24 h-24 rounded-full bg-white/20"
                      />
                      <div className="w-20 h-20 rounded-full border border-white/15 bg-white/5 flex items-center justify-center relative shadow-sm">
                        <Volume2 className="w-6 h-6 text-white" />
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-white/50 uppercase tracking-wide">{teacher.name}</span>

                    {/* График RMS громкости */}
                    <div className="h-1.5 w-24 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-white transition-all duration-75"
                        style={{ width: `${getAmplitudeScale(teacherVolume)}%` }}
                      />
                    </div>
                  </div>

                </div>

                <div className="flex flex-col items-center gap-2">
                  <div className="flex items-center gap-2 px-3.5 py-1.5 bg-brand-terracotta/20 rounded-full border border-brand-terracotta/30">
                    <span className="w-2 h-2 bg-brand-terracotta rounded-full animate-ping" />
                    <span className="text-[10px] font-bold text-brand-terracotta uppercase tracking-wider">Идет живой диалог</span>
                  </div>
                  <p className="text-xs text-white/60 italic text-center max-w-xs leading-relaxed">
                    Преподаватель переключится на русский, если вы замолчите или попросите о помощи.
                  </p>
                </div>
              </div>
            )}
            
            {sessionStatus === "closed" && (
              <div className="text-center space-y-3 py-6">
                <span className="text-3xl">🏁</span>
                <h4 className="font-serif font-bold italic text-brand-olive text-base">Звонок успешно завершен</h4>
                <p className="text-xs text-brand-dark/60">Сессия связи закрыта.</p>
              </div>
            )}

          </div>

          {/* Кнопка "Повесить Трубку" + разблокировка аудио */}
          <div className="flex flex-col items-center gap-3 pt-2 relative z-10">
            {sessionStatus === "active" && !audioUnlocked && (
              <button
                onClick={handleUnlockAudio}
                className="py-2 px-6 bg-white/15 hover:bg-white/25 border border-white/30 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
              >
                <Volume2 className="w-4 h-4" />
                Нет звука? Нажмите здесь
              </button>
            )}
            <button
              onClick={handleManualHangup}
              className="py-3 sm:py-4 px-6 sm:px-10 bg-brand-red hover:bg-[#D43D3D] text-white rounded-2xl font-bold shadow-md shadow-brand-red/10 flex items-center gap-3 transition-colors text-sm cursor-pointer"
              id="live-call-hang-up-btn"
            >
              <PhoneOff className="w-5 h-5 fill-current" />
              Завершить беседу
            </button>
          </div>

        </div>
      </div>

      {/* Правая колонка: Субтитры и Блокнот */}
      <div className="space-y-6">
        
        {/* Живые титры / транскрипция */}
        <div className="bg-white border border-brand-warm-gray rounded-[32px] p-4 sm:p-6 shadow-sm h-56 sm:h-75 flex flex-col justify-between">
          <div className="flex items-center gap-2 border-b border-brand-sand/50 pb-3">
            <MessagesSquare className="w-4 h-4 text-brand-terracotta" />
            <h4 className="text-xs font-bold text-brand-olive uppercase tracking-wider">Субтитры занятия (Live)</h4>
          </div>

          <div ref={transcriptContainerRef} className="flex-1 overflow-y-auto py-3 space-y-3 text-xs pr-1 scrollbar-thin">
            {transcripts.length === 0 ? (
              <div className="text-center text-brand-dark/40 py-10 italic">Разговор пока не начался...</div>
            ) : (
              transcripts.map((t) => {
                if (t.speaker === "system") {
                  return (
                    <div key={t.id} className="text-[10px] text-brand-dark/60 italic text-center bg-brand-light-gray/40 p-2 rounded-xl border border-brand-sand/30">
                      {t.text}
                    </div>
                  );
                }

                const isTeacher = t.speaker === "teacher";
                return (
                  <div
                    key={t.id}
                    className={`flex flex-col gap-1 max-w-[85%] ${isTeacher ? "mr-auto items-start" : "ml-auto items-end"}`}
                  >
                    <span className="text-[9px] text-brand-dark/50 font-mono flex items-center gap-1">
                      {isTeacher ? teacher.name : "Вы"} • {t.timestamp}
                    </span>
                    <div
                      className={`p-3 rounded-2xl leading-relaxed font-sans text-xs ${
                        isTeacher
                          ? "bg-brand-light-gray text-brand-dark rounded-tl-sm border border-brand-sand/40"
                          : "bg-brand-terracotta text-white rounded-tr-sm"
                      }`}
                    >
                      {t.text}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={transcriptsEndRef} />
          </div>
        </div>

        {/* Память ИИ */}
        <div className="bg-white border border-brand-warm-gray rounded-[32px] p-4 sm:p-6 shadow-sm h-64 sm:h-80 flex flex-col gap-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-brand-dark/50 pb-1 border-b border-brand-sand/50">
            🧠 Память ИИ
          </p>
          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin">
            {userFacts.length === 0 ? (
              <div className="text-center py-8 text-brand-dark/35 italic text-[11px] space-y-1">
                <p>💡 Копим факты...</p>
                <p className="text-[10px] max-w-[200px] mx-auto leading-normal">Представьтесь преподавателю, расскажите о вашей работе, хобби или целях обучения.</p>
              </div>
            ) : (
              userFacts.map((fact, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="p-2 border border-brand-sand/40 bg-brand-light-gray/40 rounded-xl text-[11px] text-brand-dark flex items-start gap-1.5"
                >
                  <span className="text-brand-terracotta shrink-0 mt-0.5">✨</span>
                  <span className="leading-tight flex-1">{fact}</span>
                </motion.div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

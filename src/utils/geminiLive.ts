import { GoogleGenAI, Modality, MediaResolution } from "@google/genai";

export interface GeminiSessionConfig {
  languageName: string;
  studentLevel: string;
  teacherName: string;
  voiceName: string;
  baseSystemPrompt: string;
  memories: string[];
  practiceGrammar: string[];
  practiceWords: { text: string; translation?: string }[];
}

export interface GeminiSessionCallbacks {
  onAudio: (base64pcm: string) => void;
  onTeacherTranscription: (text: string) => void;
  onStudentTranscription: (text: string) => void;
  onInterrupted: () => void;
  onSaveMemory: (memory: string) => void;
  onEndCall: () => void;
  onMicReady: () => void;
  onDisconnected?: (reason: string) => void;
}

export interface GeminiLiveSession {
  sendAudio: (base64pcm: string) => void;
  retrigger: () => void;
  close: () => void;
}

function buildLevelInstructions(studentLevel: string, languageName: string): string {
  const lvl = studentLevel.toLowerCase();
  if (lvl.includes("elementary") || lvl.includes("beginner") || lvl.includes("начальный") || lvl.includes("a1") || lvl.includes("a2")) {
    return `
Guidelines for student level "Elementary" (A1-A2):
- Speak VERY SLOWLY, clearly, and use simple high-frequency vocabulary.
- Keep your sentences short and grammatically simple.
- Be extremely encouraging and warm. Help them build confidence.`;
  }
  if (lvl.includes("advanced") || lvl.includes("продвинутый") || lvl.includes("c1") || lvl.includes("c2")) {
    return `
Guidelines for student level "Advanced" (C1-C2):
- Speak at a normal, rapid, natural native speed.
- Use rich vocabulary, idioms, complex sentence structures, and subtle humor or cultural nuances.
- Challenge them and speak completely in ${languageName}.`;
  }
  return `
Guidelines for student level "Intermediate" (B1-B2):
- Speak at moderate speed with clear pronunciation.
- Use standard everyday vocabulary, occasionally weave in idiomatic expressions.
- Keep turns engaging and slightly stretch their vocabulary without overwhelming them.`;
}

function buildSystemInstruction(config: GeminiSessionConfig): string {
  const { languageName, studentLevel, teacherName, baseSystemPrompt, memories, practiceGrammar, practiceWords } = config;

  const isFirstSession = memories.length === 0;

  let contextPrompt = "";
  if (memories.length > 0) {
    contextPrompt = "\n\nMEMORY FROM PREVIOUS SESSIONS (use naturally as context — don't ask again about things you already know):\n" +
      memories.map(m => `- ${m}`).join("\n") + "\n";
  }

  const levelInstructions = buildLevelInstructions(studentLevel, languageName);

  let practicePrompt = "";
  if (practiceGrammar.length > 0) {
    practicePrompt += `\n\nGRAMMAR FOCUS FOR THIS SESSION:\n` +
      practiceGrammar.map(g => `- ${g}`).join("\n") + `\n` +
      `→ Actively use these grammar constructions in your own speech as natural examples. ` +
      `When the student uses them correctly, briefly praise it ("Nice use of past perfect!"). ` +
      `When they make mistakes with these specific constructions, correct immediately and model the right form. ` +
      `If 2+ minutes pass without the student attempting the target grammar, find a natural way to prompt them.`;
  }
  if (practiceWords.length > 0) {
    practicePrompt += `\n\nVOCABULARY FOR THIS SESSION:\n` +
      practiceWords.map(w => `- ${w.text}${w.translation ? ` (${w.translation})` : ""}`).join("\n") + `\n` +
      `→ If the student asks what vocabulary you have for today, tell them the list. ` +
      `Otherwise let these words appear naturally in conversation — only use them when they genuinely fit. ` +
      `Don't steer the whole conversation around them. When the student uses one correctly, praise briefly.`;
  }

  const greetingInstruction = isFirstSession
    ? `9. This is the first session — you have no memory of this student yet. After your warm greeting, ask their name and one or two natural questions to get to know them (what they do, why they're learning ${languageName}, what they find hardest). Save what you learn with "save_memory". Only then ease into the lesson.`
    : `9. When you receive input, greet the student warmly, introduce yourself as ${teacherName}, and ask one engaging open-ended question to kick off the dialogue.`;

  return `${baseSystemPrompt}${contextPrompt}${practicePrompt}

Strict Constraints:
1. Speak in ${languageName} for the lesson itself. The ONLY exception is constraint 3 below — outside of that, never mix languages or speak Russian unprompted.
2. Your student is a Russian native speaker at ${studentLevel} difficulty. ${levelInstructions}
3. EXPLANATION EXCEPTION — this overrides constraint 1. If the student explicitly asks you to explain or translate something (e.g. "переведи", "как сказать", "что значит", "объясни", "не понимаю", "what does X mean", or simply seems lost and asks for help), STOP and actually answer in Russian — explain the word, phrase, or grammar point clearly in 1-2 short sentences. Do this every time it's asked, don't dodge it or stay in ${languageName} instead. Once you've explained, return to ${languageName} for your next turn. Don't translate proactively when NOT asked.
4. TOPIC FOCUS — your primary goal is ${languageName} language practice. If the student tries to drift into casual off-topic chat unrelated to the lesson (e.g. asking personal questions about you, discussing random news, or just chatting in Russian), acknowledge briefly and steer back: "That's interesting! Let's keep practising — how would you say that?" or similar. Occasional light small talk is fine as a warm-up, but always bring it back to practice within 1-2 exchanges.
5. STUDENT MUST SPEAK ${languageName.toUpperCase()} during normal conversation — if the student responds in Russian without asking for help (see constraint 3 — that's different, always honor it), do NOT answer in Russian. Instead, gently but firmly prompt them to try in ${languageName}: say something like "Try to say that! Even a few words is great." or "Can you give it a go first?". Repeat the question in simpler form if needed.
6. Keep answers under 3 sentences so the student has frequent turns to speak. Always end your turn with a question or prompt that invites them to respond.
7. MEMORY — use the "save_memory" tool aggressively. Save immediately when you learn: name, age, job, city, hobbies, travel plans, family, learning goals, what they find hard, topics covered this session, grammar mistakes you corrected, vocabulary they struggled with. Don't wait until the end — save each piece as soon as you hear it. Write a concise note in Russian.
7b. Use the "end_call" tool when the student clearly wants to finish (says goodbye, needs to go, asks to stop). Say a warm farewell in ${languageName} first, then call the tool.
8. Be warm, encouraging, and patient — like a great coach, not a strict examiner. Celebrate effort. Keep it fun.
${greetingInstruction}`;
}

export async function createGeminiSession(
  config: GeminiSessionConfig,
  callbacks: GeminiSessionCallbacks
): Promise<GeminiLiveSession> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("VITE_GEMINI_API_KEY не найден. Добавьте его в .env файл.");
  }

  const ai = new GoogleGenAI({ apiKey });
  let micEnabled = true;

  const session = await ai.live.connect({
    model: "models/gemini-3.1-flash-live-preview",
    config: {
      responseModalities: [Modality.AUDIO],
      mediaResolution: MediaResolution.MEDIA_RESOLUTION_MEDIUM,
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName: config.voiceName as any } },
      },
      systemInstruction: buildSystemInstruction(config),
      outputAudioTranscription: {},
      inputAudioTranscription: {},
      tools: [
        {
          functionDeclarations: [
            {
              name: "save_memory",
              description: "Save anything worth remembering for future sessions: personal details, learning goals, grammar struggles, vocabulary gaps, topics covered, or notable moments. Use proactively — if in doubt, save it.",
              parameters: {
                type: "OBJECT" as any,
                properties: {
                  memory: { type: "STRING" as any, description: "Short self-contained note in Russian, e.g. 'Студентку зовут Анна, работает дизайнером'" },
                },
                required: ["memory"],
              },
            },
            {
              name: "end_call",
              description: "Ends the lesson. Call after saying goodbye when the student wants to finish.",
              parameters: { type: "OBJECT" as any, properties: {}, required: [] },
            },
          ],
        },
      ],
    },
    callbacks: {
      onerror: (e: any) => {
        callbacks.onDisconnected?.(`Ошибка соединения: ${e?.message ?? e}`);
      },
      onclose: (e: any) => {
        if (e?.code !== 1000) {
          callbacks.onDisconnected?.(`Соединение закрыто: ${e?.reason || e?.code || "неизвестно"}`);
        }
      },
      onmessage: (message: any) => {
        try {
          if (message.toolCall?.functionCalls) {
            for (const call of message.toolCall.functionCalls) {
              if (call.name === "save_memory" && call.args?.memory) {
                callbacks.onSaveMemory(call.args.memory);
              } else if (call.name === "end_call") {
                callbacks.onEndCall();
              }
              session.sendToolResponse({
                functionResponses: [{ id: call.id, name: call.name, response: { response: "success" } }],
              });
            }
          }

          if (message.serverContent?.modelTurn?.parts) {
            for (const part of message.serverContent.modelTurn.parts) {
              if (part.inlineData?.data) callbacks.onAudio(part.inlineData.data);
            }
          }

          const outText = (message.serverContent as any)?.outputTranscription?.text;
          if (outText) callbacks.onTeacherTranscription(outText);

          const inText = (message.serverContent as any)?.inputTranscription?.text;
          if (inText) callbacks.onStudentTranscription(inText);

          if (message.serverContent?.interrupted) {
            callbacks.onInterrupted();
          }

          if (message.serverContent?.turnComplete) {
            // no-op: mic is enabled from the start
          }
        } catch (err) {
          console.error("Error processing Gemini Live message", err);
        }
      },
    },
  });

  const trigger = () => session.sendClientContent({
    turns: [{ role: "user", parts: [{ text: "Hello!" }] }],
    turnComplete: true,
  });

  // Small delay so AudioContext is fully running before mic and trigger start
  setTimeout(() => {
    callbacks.onMicReady();
    trigger();
  }, 300);

  return {
    sendAudio: (base64pcm: string) => {
      if (!micEnabled) return;
      session.sendRealtimeInput({ audio: { data: base64pcm, mimeType: "audio/pcm;rate=16000" } });
    },
    retrigger: () => {
      micEnabled = true;
      trigger();
    },
    close: () => {
      try { session.close(); } catch {}
    },
  };
}

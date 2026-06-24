import { GoogleGenAI, Modality, MediaResolution } from "@google/genai";

export interface GeminiSessionConfig {
  languageName: string;
  studentLevel: string;
  teacherName: string;
  voiceName: string;
  currentTopic: string;
  baseSystemPrompt: string;
  userFacts: string[];
  conversationNotes: string[];
  practiceGrammar: string[];
}

export interface GeminiSessionCallbacks {
  onAudio: (base64pcm: string) => void;
  onTeacherTranscription: (text: string) => void;
  onStudentTranscription: (text: string) => void;
  onInterrupted: () => void;
  onSaveFact: (fact: string) => void;
  onSaveNote: (note: string) => void;
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
  const { languageName, studentLevel, teacherName, baseSystemPrompt, userFacts, conversationNotes, practiceGrammar } = config;

  let contextPrompt = "";
  if (userFacts.length > 0 || conversationNotes.length > 0) {
    contextPrompt = "\n\n";
    if (userFacts.length > 0) {
      contextPrompt += "STUDENT PROFILE (personal facts — use naturally, don't ask again):\n" +
        userFacts.map(f => `- ${f}`).join("\n") + "\n";
    }
    if (conversationNotes.length > 0) {
      contextPrompt += "\nPREVIOUS SESSION NOTES (context from past lessons — reference naturally when relevant):\n" +
        conversationNotes.map(n => `- ${n}`).join("\n") + "\n";
    }
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

  return `${baseSystemPrompt}${contextPrompt}${practicePrompt}

Strict Constraints:
1. Speak EXCLUSIVELY in ${languageName} at ALL times. Never mix languages or repeat yourself in Russian unprompted.
2. Your student is a Russian native speaker at ${studentLevel} difficulty. ${levelInstructions}
3. Switch to Russian ONLY when the student explicitly asks (e.g. "переведи", "как сказать", "объясни по-русски"). Keep it to one short sentence, then return immediately to ${languageName}. Never proactively translate.
4. TOPIC FOCUS — your primary goal is English language practice. If the student tries to drift into casual off-topic chat unrelated to the lesson (e.g. asking personal questions about you, discussing random news, or just chatting in Russian), acknowledge briefly and steer back: "That's interesting! Let's keep practising — how would you say that in English?" or similar. Occasional light small talk is fine as a warm-up, but always bring it back to English practice within 1-2 exchanges.
5. STUDENT MUST SPEAK ENGLISH — if the student responds in Russian (other than asking for a translation), do NOT answer in Russian. Instead, gently but firmly prompt them to try in English: say something like "Try to say that in English! Even a few words is great." or "Can you give it a go in English first?". Repeat the question in simpler form if needed. Only translate as a last resort after two failed attempts.
6. Keep answers under 3 sentences so the student has frequent turns to speak. Always end your turn with a question or prompt that invites them to respond in English.
7. Use the "save_user_fact" tool whenever the student shares personal details (name, job, hobbies, goals). Don't ask again about things you already know.
7b. Use the "save_conversation_note" tool to record notable moments: grammar topics covered, mistakes corrected, vocabulary practiced, student strengths or struggles. Write notes in Russian.
7c. Use the "end_call" tool when the student clearly wants to finish (says goodbye, needs to go, asks to stop). Say a warm farewell in ${languageName} first, then call the tool.
8. Be warm, encouraging, and patient — like a great coach, not a strict examiner. Celebrate effort. Keep it fun.
9. When you receive input, greet the student warmly, introduce yourself as ${teacherName}, and ask one engaging open-ended question to kick off the dialogue.`;
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
              name: "save_user_fact",
              description: "Saves a personal fact about the student (name, job, hobbies, goals). Use when the student shares something personal.",
              parameters: {
                type: "OBJECT" as any,
                properties: {
                  fact: { type: "STRING" as any, description: "Short fact in Russian, e.g. 'Студента зовут Анна'" },
                },
                required: ["fact"],
              },
            },
            {
              name: "save_conversation_note",
              description: "Saves a notable moment from this conversation: vocabulary covered, grammar corrected, topics discussed, student struggles or strengths.",
              parameters: {
                type: "OBJECT" as any,
                properties: {
                  note: { type: "STRING" as any, description: "Short self-contained note in Russian" },
                },
                required: ["note"],
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
              if (call.name === "save_user_fact" && call.args?.fact) {
                callbacks.onSaveFact(call.args.fact);
              } else if (call.name === "save_conversation_note" && call.args?.note) {
                callbacks.onSaveNote(call.args.note);
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

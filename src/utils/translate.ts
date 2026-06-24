import { GoogleGenAI, Type } from "@google/genai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string;

export interface WordTranslation {
  word: string;
  transcription: string;
  translation: string;
  example: string;
  exampleTranslation: string;
}

async function doTranslate(input: string): Promise<WordTranslation> {
  const ai = new GoogleGenAI({ apiKey: API_KEY });

  const result = await ai.models.generateContent({
    model: "gemini-3.1-flash-lite",
    contents: `The user is learning English. They typed: "${input}"

Your task:
- If the input is already English: use it as the English word/phrase.
- If the input is Russian (or any other language): find the natural English equivalent.
- Always output: the English word/phrase, its IPA phonetic transcription (British English), Russian translation, a short example sentence in English, and Russian translation of that sentence.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          word: {
            type: Type.STRING,
            description: "The English word or phrase (normalized to English regardless of input language)",
          },
          transcription: {
            type: Type.STRING,
            description: "IPA phonetic transcription in British English, e.g. /ˈteɪbəl/",
          },
          translation: {
            type: Type.STRING,
            description: "Russian translation of the English word/phrase",
          },
          example: {
            type: Type.STRING,
            description: "Short natural English sentence using the word",
          },
          exampleTranslation: {
            type: Type.STRING,
            description: "Russian translation of the example sentence",
          },
        },
        required: ["word", "transcription", "translation", "example", "exampleTranslation"],
      },
    },
  });

  const text = result.text?.trim();
  if (!text) throw new Error("Empty response");

  const data = JSON.parse(text) as WordTranslation;
  if (!data.word || !data.translation) throw new Error("Incomplete response");

  return data;
}

function is429(err: unknown): boolean {
  const msg = String(err);
  return msg.includes("429") || msg.includes("Too Many Requests") || msg.includes("RESOURCE_EXHAUSTED");
}

export async function translateWord(input: string): Promise<WordTranslation> {
  const maxAttempts = 4;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await doTranslate(input);
    } catch (err) {
      const isLast = attempt === maxAttempts - 1;
      if (is429(err) && !isLast) {
        await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, attempt)));
        continue;
      }
      throw err;
    }
  }
  throw new Error("Failed after retries");
}

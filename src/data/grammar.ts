export interface GrammarTopic {
  id: string;
  label: string;
  description: string;
}

export const GRAMMAR_TOPICS_BY_LANGUAGE: Record<string, GrammarTopic[]> = {
  en: [
    { id: "present_simple_cont", label: "Present Simple / Continuous", description: "I work / I am working" },
    { id: "past_simple_cont", label: "Past Simple / Continuous", description: "I worked / I was working" },
    { id: "present_perfect", label: "Present Perfect", description: "I have done / have been doing" },
    { id: "future_forms", label: "Future Forms", description: "will / going to / present cont." },
    { id: "conditionals", label: "Conditionals", description: "If I go… / If I went… / If I had gone…" },
    { id: "passive_voice", label: "Passive Voice", description: "It was done / is being done" },
    { id: "modal_verbs", label: "Modal Verbs", description: "can, must, should, might, could…" },
    { id: "phrasal_verbs", label: "Phrasal Verbs", description: "give up, look into, carry on…" },
    { id: "reported_speech", label: "Reported Speech", description: "She said she was / had been…" },
    { id: "articles", label: "Articles", description: "a, an, the — when and why" },
    { id: "prepositions", label: "Prepositions", description: "in/on/at time & place" },
    { id: "comparatives", label: "Comparatives & Superlatives", description: "bigger, the most important…" },
  ],
  fi: [
    { id: "fi_cases_basic", label: "Базовые падежи", description: "nominatiivi, genetiivi, partitiivi" },
    { id: "fi_cases_location", label: "Местные падежи", description: "talossa, talosta, taloon…" },
    { id: "fi_consonant_gradation", label: "Чередование согласных", description: "kk-k, pp-p, tt-t: matto → maton" },
    { id: "fi_possessive", label: "Притяжательные суффиксы", description: "taloni, talosi, talomme…" },
    { id: "fi_verb_types", label: "Типы глаголов", description: "puhua, syödä, tulla, haluta…" },
    { id: "fi_negation", label: "Отрицание", description: "en, et, ei + основа глагола" },
    { id: "fi_questions", label: "Вопросительная форма", description: "-ko/-kö, kysymyssanat" },
    { id: "fi_past_tense", label: "Имперфект (прошедшее время)", description: "puhuin, söin, tulin…" },
    { id: "fi_comparatives", label: "Сравнительная степень", description: "isompi, suurin…" },
    { id: "fi_partitive_object", label: "Партитив объекта", description: "syön omenaa vs syön omenan" },
  ],
};

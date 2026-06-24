export interface GrammarTopic {
  id: string;
  label: string;
  description: string;
}

export const GRAMMAR_TOPICS: GrammarTopic[] = [
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
];

/**
 * Canonical onboarding content — single source of truth.
 * The client renders whatever this serves (GET /onboarding/config),
 * so copy tweaks never need an app release.
 */
export const PERSONALITY_QUESTIONS = [
  { id: "social-energy", text: "A full room fills me up.", low: "Quiet nights", high: "Crowded rooms" },
  { id: "spontaneity", text: "The best plans are unplanned.", low: "Planner", high: "Spontaneous" },
  { id: "depth", text: "Small talk is a warm-up, not the point.", low: "Keep it light", high: "Go deep fast" },
  { id: "adventure", text: "Comfort zones are made to be left.", low: "Comfort", high: "Adventure" },
  { id: "expression", text: "I say what I feel, when I feel it.", low: "Reserved", high: "Open book" },
  { id: "togetherness", text: "Closeness means sharing almost everything.", low: "Independent", high: "Intertwined" },
] as const;

export const VALUES = [
  "Honesty", "Loyalty", "Ambition", "Kindness", "Family", "Freedom",
  "Growth", "Faith", "Humor", "Stability", "Adventure", "Creativity",
  "Empathy", "Passion", "Balance", "Curiosity",
] as const;

export const INTERESTS = [
  "Music", "Travel", "Fitness", "Art", "Film", "Reading",
  "Cooking", "Gaming", "Nature", "Photography", "Dance", "Fashion",
  "Tech", "Sports", "Yoga", "Coffee", "Food", "Pets",
  "Writing", "Theatre", "Astrology", "Volunteering", "Nightlife", "Meditation",
] as const;

export const PROMPTS = [
  { id: "way-to-heart", question: "The way to my heart is..." },
  { id: "perfect-sunday", question: "A perfect Sunday looks like..." },
  { id: "most-alive", question: "I feel most alive when..." },
  { id: "never-stop", question: "Something I'll never stop talking about..." },
  { id: "kind-of-love", question: "The kind of love I'm looking for..." },
] as const;

export const EDUCATION = [
  { id: "high-school", label: "High school" },
  { id: "in-college", label: "In college" },
  { id: "undergraduate", label: "Undergraduate" },
  { id: "postgraduate", label: "Postgraduate" },
  { id: "doctorate", label: "Doctorate" },
  { id: "self-taught", label: "Self-taught" },
] as const;

export const HABITS = [
  { id: "never", label: "Never" },
  { id: "socially", label: "Socially" },
  { id: "regularly", label: "Regularly" },
] as const;

export const KIDS = [
  { id: "want-someday", label: "Want someday" },
  { id: "dont-want", label: "Don't want" },
  { id: "have-and-want-more", label: "Have and want more" },
  { id: "have-and-done", label: "Have and complete" },
  { id: "unsure", label: "Still figuring it out" },
] as const;

export const LANGUAGES = [
  "English", "Hindi", "Bengali", "Marathi", "Telugu", "Tamil",
  "Gujarati", "Kannada", "Malayalam", "Punjabi", "Urdu", "Odia",
  "Assamese", "Spanish", "French", "German", "Arabic", "Mandarin",
] as const;

export const GENDERS = ["woman", "man", "nonbinary", "other"] as const;
export const INTERESTED_IN = ["women", "men", "nonbinary", "everyone"] as const;
export const INTENTS = [
  { id: "long-term", label: "Something lasting", description: "Building toward a real relationship" },
  { id: "slow-discovery", label: "Slow discovery", description: "No rush — let chemistry decide the pace" },
  { id: "open-to-either", label: "Open to either", description: "Meaningful connection, wherever it leads" },
  { id: "friendship-first", label: "Friendship first", description: "Start as friends, see what grows" },
] as const;

export const ONBOARDING_CONFIG = {
  personalityQuestions: PERSONALITY_QUESTIONS,
  values: VALUES,
  interests: INTERESTS,
  prompts: PROMPTS,
  genders: GENDERS,
  interestedIn: INTERESTED_IN,
  intents: INTENTS,
  education: EDUCATION,
  habits: HABITS,
  kids: KIDS,
  languages: LANGUAGES,
  rules: {
    minAge: 18,
    values: { min: 3, max: 5 },
    interests: { min: 3, max: 8 },
    prompts: { min: 2, max: 3, maxAnswerLength: 240 },
    photos: { min: 1, max: 6 },
    languages: { max: 5 },
  },
};

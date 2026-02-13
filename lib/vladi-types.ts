// VLADI Core Types based on DEAM EQ Model

export type ValenceType = "positive" | "negative" | "neutral"

export type EmotionCategory =
  | "alegría"
  | "serenidad"
  | "gratitud"
  | "entusiasmo"
  | "amor"
  | "esperanza"
  | "orgullo"
  | "alivio" // Positive
  | "tristeza"
  | "ansiedad"
  | "frustración"
  | "ira"
  | "miedo"
  | "culpa"
  | "vergüenza"
  | "soledad"
  | "desesperanza" // Negative
  | "neutralidad"
  | "confusión"
  | "sorpresa"
  | "anticipación" // Neutral/Mixed

export type ContextCategory =
  | "trabajo"
  | "pareja"
  | "familia"
  | "salud"
  | "amigos"
  | "finanzas"
  | "autoexigencia"
  | "sueño"
  | "ocio"
  | "otro"

export interface Emotion {
  id: string
  label: EmotionCategory
  valence: ValenceType
  color: string
  icon: string
}

export interface CheckIn {
  id: string
  userId: string
  timestamp: Date
  valence: ValenceType
  intensityBefore: number // 1-10
  emotionLabelBefore: EmotionCategory
  contextCategory: ContextCategory
  contextText?: string
  interventionId?: string
  intensityAfter?: number // 1-10
  emotionLabelAfter?: EmotionCategory
}

export interface Intervention {
  id: string
  type: "respiración" | "reencuadre" | "grounding" | "gratitud" | "mindfulness" | "savoring"
  name: string
  description: string
  duration: number // in seconds
  icon: string
}

// DEAM EQ v2: Onset & Physical State types
export type OnsetBucket = "just_now" | "10_30_min" | "30_60_min" | "1_3_hours" | "3_plus_hours"

export const ONSET_TO_MINUTES: Record<OnsetBucket, number> = {
  just_now: 0,
  "10_30_min": 20,
  "30_60_min": 45,
  "1_3_hours": 120,
  "3_plus_hours": 240,
}

export type PhysicalState = "low" | "mid" | "high"

export type PhysicalFlag = "hungry" | "sick"

// DEAM EQ Metrics
export interface DEAMMetrics {
  granularity: number // G: 0-100
  perception: number // P: 0-100
  consciousness: number // C: 0-100
  adaptability: number // A: 0-100
  emotionalInertia: number // Iₑ: hours (lower is better)
  deamScore: number // Overall EQ score: 0-100
}

export const EMOTIONS: Emotion[] = [
  // Positive
  { id: "1", label: "alegría", valence: "positive", color: "bg-yellow-400", icon: "😊" },
  { id: "2", label: "serenidad", valence: "positive", color: "bg-cyan-400", icon: "😌" },
  { id: "3", label: "gratitud", valence: "positive", color: "bg-pink-400", icon: "🙏" },
  { id: "4", label: "entusiasmo", valence: "positive", color: "bg-orange-400", icon: "🤩" },
  { id: "5", label: "amor", valence: "positive", color: "bg-red-400", icon: "❤️" },
  { id: "6", label: "esperanza", valence: "positive", color: "bg-green-400", icon: "🌱" },
  { id: "7", label: "orgullo", valence: "positive", color: "bg-amber-400", icon: "💪" },
  { id: "8", label: "alivio", valence: "positive", color: "bg-teal-400", icon: "😮‍💨" },
  // Negative
  { id: "9", label: "tristeza", valence: "negative", color: "bg-blue-500", icon: "😢" },
  { id: "10", label: "ansiedad", valence: "negative", color: "bg-purple-500", icon: "😰" },
  { id: "11", label: "frustración", valence: "negative", color: "bg-orange-600", icon: "😤" },
  { id: "12", label: "ira", valence: "negative", color: "bg-red-600", icon: "😠" },
  { id: "13", label: "miedo", valence: "negative", color: "bg-slate-600", icon: "😨" },
  { id: "14", label: "culpa", valence: "negative", color: "bg-indigo-600", icon: "😔" },
  { id: "15", label: "vergüenza", valence: "negative", color: "bg-rose-600", icon: "😳" },
  { id: "16", label: "soledad", valence: "negative", color: "bg-gray-500", icon: "🥺" },
  { id: "17", label: "desesperanza", valence: "negative", color: "bg-zinc-600", icon: "😞" },
  // Neutral
  { id: "18", label: "neutralidad", valence: "neutral", color: "bg-gray-400", icon: "😐" },
  { id: "19", label: "confusión", valence: "neutral", color: "bg-violet-400", icon: "🤔" },
  { id: "20", label: "sorpresa", valence: "neutral", color: "bg-sky-400", icon: "😮" },
  { id: "21", label: "anticipación", valence: "neutral", color: "bg-lime-400", icon: "🤨" },
]

export const CONTEXTS: { id: ContextCategory; label: string; icon: string }[] = [
  { id: "trabajo", label: "Trabajo", icon: "💼" },
  { id: "pareja", label: "Pareja", icon: "💑" },
  { id: "familia", label: "Familia", icon: "👨‍👩‍👧" },
  { id: "salud", label: "Salud", icon: "🏥" },
  { id: "amigos", label: "Amigos", icon: "👥" },
  { id: "finanzas", label: "Finanzas", icon: "💰" },
  { id: "autoexigencia", label: "Autoexigencia", icon: "🎯" },
  { id: "sueño", label: "Sueño", icon: "😴" },
  { id: "ocio", label: "Ocio", icon: "🎮" },
  { id: "otro", label: "Otro", icon: "📝" },
]

export const INTERVENTIONS: Intervention[] = [
  {
    id: "1",
    type: "respiración",
    name: "Respiración Guiada",
    description: "Técnica 4-7-8 para calmar el sistema nervioso",
    duration: 120,
    icon: "🌬️",
  },
  {
    id: "2",
    type: "reencuadre",
    name: "Reencuadre Cognitivo",
    description: "Cambia la perspectiva sobre la situación",
    duration: 180,
    icon: "🔄",
  },
  {
    id: "3",
    type: "grounding",
    name: "Técnica 5-4-3-2-1",
    description: "Conecta con tus sentidos para anclarte al presente",
    duration: 150,
    icon: "🌍",
  },
  {
    id: "4",
    type: "gratitud",
    name: "Momento de Gratitud",
    description: "Identifica 3 cosas por las que estás agradecido",
    duration: 90,
    icon: "🙏",
  },
  {
    id: "5",
    type: "mindfulness",
    name: "Mindfulness Express",
    description: "Meditación breve de atención plena",
    duration: 180,
    icon: "🧘",
  },
  {
    id: "6",
    type: "savoring",
    name: "Savoring Positivo",
    description: "Disfruta y amplifica un momento positivo",
    duration: 120,
    icon: "✨",
  },
]

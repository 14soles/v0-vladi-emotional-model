// DEAM Telemetry System Types

export type EventType =
  | "app_open"
  | "app_close"
  | "app_background"
  | "app_foreground"
  | "emotion_start"
  | "emotion_complete"
  | "emotion_abandon"
  | "ieq_view"
  | "ieq_detail_open"
  | "chat_start"
  | "chat_end"
  | "chat_message"
  | "intervention_start"
  | "intervention_complete"
  | "intervention_skip"
  | "social_view"
  | "social_interact"
  | "profile_view"
  | "notification_received"
  | "notification_clicked"

export type InterventionType =
  | "breathing_478"
  | "breathing_box"
  | "grounding_54321"
  | "journaling"
  | "movement"
  | "meditation"
  | "reframing"
  | "social_contact"

export type VisibilityLevel = "private" | "friends" | "groups" | "public"

export interface AppSession {
  id: string
  user_id: string
  started_at: string
  ended_at: string | null
  duration_seconds: number | null
  screens_visited: string[]
  emotions_registered: number
  chat_interactions: number
  interventions_completed: number
  platform: string | null
  app_version: string | null
}

export interface UserEvent {
  id: string
  user_id: string
  session_id: string | null
  event_type: EventType
  event_data: Record<string, unknown>
  screen_name: string | null
  timestamp: string
}

export interface InterventionLog {
  id: string
  user_id: string
  session_id: string | null
  emotion_entry_id: string | null
  intervention_type: InterventionType
  started_at: string
  completed_at: string | null
  duration_seconds: number | null
  intensity_before: number | null
  intensity_after: number | null
  perceived_utility: number | null // 1-5
  skipped: boolean
  skip_reason: string | null
}

export interface EmotionEpisode {
  id: string
  user_id: string
  started_at: string
  ended_at: string | null
  dominant_emotion: string | null
  dominant_family: string | null
  entry_count: number
  avg_intensity: number | null
  avg_valence: number | null
  recovery_time_minutes: number | null
  interventions_used: number
}

export interface EmotionEpisodeEntry {
  episode_id: string
  emotion_entry_id: string
  sequence_order: number
}

// Intervention definitions
export interface InterventionDefinition {
  type: InterventionType
  name: string
  description: string
  duration_seconds: number
  icon: string
  category: "breathing" | "grounding" | "cognitive" | "physical" | "social"
  recommended_for: string[] // emotion families
}

export const INTERVENTIONS: InterventionDefinition[] = [
  {
    type: "breathing_478",
    name: "Respiración 4-7-8",
    description: "Inhala 4s, mantén 7s, exhala 8s. Calma el sistema nervioso.",
    duration_seconds: 120,
    icon: "wind",
    category: "breathing",
    recommended_for: ["tension", "tristeza"],
  },
  {
    type: "breathing_box",
    name: "Respiración cuadrada",
    description: "4 tiempos iguales: inhala, mantén, exhala, mantén.",
    duration_seconds: 90,
    icon: "square",
    category: "breathing",
    recommended_for: ["tension", "energia"],
  },
  {
    type: "grounding_54321",
    name: "Grounding 5-4-3-2-1",
    description: "5 cosas que ves, 4 que tocas, 3 que oyes, 2 que hueles, 1 que saboreas.",
    duration_seconds: 180,
    icon: "hand",
    category: "grounding",
    recommended_for: ["tension", "tristeza"],
  },
  {
    type: "journaling",
    name: "Escritura expresiva",
    description: "Escribe libremente sobre lo que sientes sin juzgarte.",
    duration_seconds: 300,
    icon: "pencil",
    category: "cognitive",
    recommended_for: ["tristeza", "tension", "calma"],
  },
  {
    type: "movement",
    name: "Movimiento consciente",
    description: "Estira, camina o muévete suavemente durante unos minutos.",
    duration_seconds: 180,
    icon: "activity",
    category: "physical",
    recommended_for: ["tristeza", "calma"],
  },
  {
    type: "meditation",
    name: "Meditación breve",
    description: "Centra tu atención en la respiración y el momento presente.",
    duration_seconds: 180,
    icon: "brain",
    category: "cognitive",
    recommended_for: ["tension", "energia"],
  },
  {
    type: "reframing",
    name: "Reencuadre cognitivo",
    description: "Identifica el pensamiento negativo y busca una perspectiva alternativa.",
    duration_seconds: 240,
    icon: "refresh-cw",
    category: "cognitive",
    recommended_for: ["tristeza", "tension"],
  },
  {
    type: "social_contact",
    name: "Contacto social",
    description: "Llama o escribe a alguien de confianza.",
    duration_seconds: 300,
    icon: "users",
    category: "social",
    recommended_for: ["tristeza", "calma"],
  },
]

// Helper to get recommended interventions for an emotion family
export function getRecommendedInterventions(emotionFamily: string): InterventionDefinition[] {
  return INTERVENTIONS.filter((i) => i.recommended_for.includes(emotionFamily.toLowerCase()))
}

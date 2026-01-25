// Intervention Recommendation Engine based on DEAM EQ Model
// Uses valence, arousal, and intensity to recommend the most appropriate intervention

import { INTERVENTIONS, type InterventionType, type InterventionDefinition } from "./types/telemetry"

// Emotion family mapping from emotion labels
export const EMOTION_TO_FAMILY: Record<string, "tension" | "tristeza" | "calma" | "energia"> = {
  // Positive - mapped to calma or energia
  "alegría": "energia",
  "serenidad": "calma",
  "gratitud": "calma",
  "entusiasmo": "energia",
  "amor": "calma",
  "esperanza": "calma",
  "orgullo": "energia",
  "alivio": "calma",
  // Negative - mapped to tension or tristeza
  "tristeza": "tristeza",
  "ansiedad": "tension",
  "frustración": "tension",
  "ira": "tension",
  "miedo": "tension",
  "culpa": "tristeza",
  "vergüenza": "tension",
  "soledad": "tristeza",
  "desesperanza": "tristeza",
  // Neutral
  "neutralidad": "calma",
  "confusión": "tension",
  "sorpresa": "energia",
  "anticipación": "energia",
  // English fallbacks (from emotion-screen quadrants)
  "Motivado": "energia",
  "Sereno": "calma",
  "Ansioso": "tension",
  "Triste": "tristeza",
}

// Quadrant to family mapping
export const QUADRANT_TO_FAMILY: Record<string, "tension" | "tristeza" | "calma" | "energia"> = {
  "green": "calma",    // High valence, low arousal
  "yellow": "energia", // High valence, high arousal  
  "red": "tension",    // Low valence, high arousal
  "blue": "tristeza",  // Low valence, low arousal
}

interface EmotionState {
  valence: number    // -1 to 1
  arousal: number    // -1 to 1
  intensity: number  // 0 to 100 (or 0 to 10)
  emotionLabel?: string
  quadrant?: string
}

/**
 * Main recommendation function based on the DEAM EQ model
 * Returns ordered list of recommended interventions
 */
export function recommendInterventions(state: EmotionState): InterventionDefinition[] {
  const { valence, arousal, intensity } = state
  
  // Normalize intensity to 0-10 if it's 0-100
  const normalizedIntensity = intensity > 10 ? intensity / 10 : intensity
  
  let recommendedTypes: InterventionType[]

  // 1) Crisis / pico de intensidad
  if (normalizedIntensity >= 8) {
    recommendedTypes = ["breathing_box", "grounding_54321", "movement"]
  }
  // 2) Negativo + alta activación (ansiedad, ira, frustración)
  else if (valence <= -0.3 && arousal >= 0.4) {
    recommendedTypes = ["breathing_box", "grounding_54321", "movement"]
  }
  // 3) Negativo + baja activación (tristeza, apatía, desesperanza)
  else if (valence <= -0.3 && arousal < 0.2) {
    recommendedTypes = ["movement", "journaling", "social_contact"]
  }
  // 4) Neutro + alta activación (nervios, estrés sin tristeza)
  else if (valence > -0.3 && valence < 0.3 && arousal >= 0.4) {
    recommendedTypes = ["breathing_478", "grounding_54321", "meditation"]
  }
  // 5) Positivo (consolidar, reflexionar)
  else if (valence >= 0.3) {
    recommendedTypes = ["journaling", "meditation", "breathing_478"]
  }
  // 6) Fallback (neutro-bajo)
  else {
    recommendedTypes = ["grounding_54321", "breathing_478", "journaling"]
  }

  // Map types to full intervention definitions
  return recommendedTypes
    .map(type => INTERVENTIONS.find(i => i.type === type))
    .filter((i): i is InterventionDefinition => i !== undefined)
}

/**
 * Get the single best intervention for the current state
 */
export function getTopIntervention(state: EmotionState): InterventionDefinition {
  const recommendations = recommendInterventions(state)
  return recommendations[0] || INTERVENTIONS[0]
}

/**
 * Calculate fallback intensity from valence/arousal distance to center
 * Used when no self-reported intensity is available
 */
export function calculateFallbackIntensity(pleasantness: number, energy: number): number {
  const v = (pleasantness - 50) / 50 // -1..1
  const a = (energy - 50) / 50       // -1..1
  const d = Math.sqrt(v * v + a * a) / Math.sqrt(2) // 0..1
  return Math.round(Math.max(1, Math.min(10, 1 + 9 * d)))
}

/**
 * Convert emotion data to the state format needed for recommendations
 */
export function emotionDataToState(data: {
  emotion?: string
  quadrant?: string
  energy?: number        // 0-100 (arousal)
  pleasantness?: number  // 0-100 (valence)
  intensity?: number     // 1-10 (self-reported intensity) - NEW!
}): EmotionState {
  // Convert pleasantness (0-100) to valence (-1 to 1)
  const valence = data.pleasantness !== undefined 
    ? (data.pleasantness - 50) / 50 
    : 0

  // Derive arousal from quadrant if available
  let arousal = 0
  if (data.quadrant) {
    if (data.quadrant === "yellow" || data.quadrant === "red") {
      arousal = 0.5 // High arousal quadrants
    } else {
      arousal = -0.3 // Low arousal quadrants
    }
  }

  // Adjust arousal based on energy
  if (data.energy !== undefined) {
    arousal = Math.max(arousal, (data.energy - 50) / 100)
  }

  // Use self-reported intensity if available, otherwise calculate fallback
  let intensity: number
  if (data.intensity !== undefined && data.intensity >= 1 && data.intensity <= 10) {
    intensity = data.intensity
  } else {
    // Fallback: use distance from center of 2D plane
    intensity = calculateFallbackIntensity(data.pleasantness || 50, data.energy || 50)
  }

  return {
    valence,
    arousal,
    intensity, // Now in 1-10 scale
    emotionLabel: data.emotion,
    quadrant: data.quadrant,
  }
}

/**
 * Get emotion family from various inputs
 */
export function getEmotionFamily(
  emotionLabel?: string, 
  quadrant?: string
): "tension" | "tristeza" | "calma" | "energia" {
  // Try emotion label first
  if (emotionLabel) {
    const family = EMOTION_TO_FAMILY[emotionLabel.toLowerCase()]
    if (family) return family
  }
  
  // Fall back to quadrant
  if (quadrant) {
    return QUADRANT_TO_FAMILY[quadrant] || "calma"
  }
  
  return "calma"
}

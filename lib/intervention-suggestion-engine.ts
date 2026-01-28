// ============================================
// INTERVENTION SUGGESTION ENGINE
// Lógica de sugerencia de intervenciones basada en:
// 1. Estado emocional actual (quadrant, pleasantness, energy)
// 2. Clasificación AI de la nota (si existe)
// 3. Historial de efectividad de intervenciones del usuario
// ============================================

import type { NoteClassification } from "@/app/api/vladi/classify-note/route"

export type InterventionType = 
  | "breathing" 
  | "grounding" 
  | "reframe" 
  | "gratitude" 
  | "savoring" 
  | "writing" 
  | "movement"
  | "mindfulness"

export interface InterventionSuggestion {
  type: InterventionType
  confidence: number // 0-1
  reasons: string[]
  priority: number // 1-5 (5 = más urgente)
}

export interface EmotionalContext {
  quadrant: "green" | "yellow" | "red" | "blue"
  pleasantness: number // 0-100
  energy: number // 0-100
  intensity?: number // 0-100
  emotion?: string
}

export interface UserInterventionHistory {
  type: InterventionType
  uses: number
  avgDelta: number // Reducción promedio de intensidad
}

// Mapeo de cuadrantes a intervenciones recomendadas
const QUADRANT_INTERVENTIONS: Record<string, InterventionType[]> = {
  red: ["breathing", "grounding", "reframe"], // Alta energía, baja pleasantness -> calmar
  blue: ["movement", "gratitude", "savoring"], // Baja energía, baja pleasantness -> activar positivo
  yellow: ["savoring", "gratitude", "mindfulness"], // Alta energía, alta pleasantness -> mantener/saborear
  green: ["mindfulness", "writing", "gratitude"], // Baja energía, alta pleasantness -> reflexión tranquila
}

// Mapeo de patrones cognitivos a intervenciones
const COGNITIVE_PATTERN_INTERVENTIONS: Record<string, InterventionType> = {
  rumiacion: "writing",
  catastrofismo: "reframe",
  generalizacion: "reframe",
  pensamiento_dicotomico: "reframe",
  lectura_mental: "grounding",
  personalizacion: "reframe",
  filtro_mental: "gratitude",
}

// Mapeo de necesidades a intervenciones
const NEED_INTERVENTIONS: Record<string, InterventionType> = {
  descanso: "breathing",
  claridad: "writing",
  conexion: "gratitude",
  validacion: "writing",
  autonomia: "mindfulness",
  seguridad: "grounding",
  expresion: "writing",
  movimiento: "movement",
  silencio: "mindfulness",
  distraccion: "grounding",
}

// Mapeo de niveles de riesgo a intervenciones prioritarias
const RISK_LEVEL_INTERVENTIONS: Record<string, { types: InterventionType[]; priority: number }> = {
  none: { types: [], priority: 1 },
  low: { types: ["breathing", "mindfulness"], priority: 2 },
  medium: { types: ["breathing", "grounding"], priority: 4 },
  high: { types: ["breathing", "grounding"], priority: 5 },
}

/**
 * Sugiere intervenciones basándose en el contexto emocional y clasificación AI
 */
export function suggestInterventions(
  context: EmotionalContext,
  aiClassification?: NoteClassification | null,
  userHistory?: UserInterventionHistory[]
): InterventionSuggestion[] {
  const suggestions = new Map<InterventionType, InterventionSuggestion>()

  // 1. Sugerencias basadas en el cuadrante emocional
  const quadrantTypes = QUADRANT_INTERVENTIONS[context.quadrant] || []
  quadrantTypes.forEach((type, index) => {
    addOrUpdateSuggestion(suggestions, type, {
      confidence: 0.6 - index * 0.1,
      reasons: [`Estado ${getQuadrantLabel(context.quadrant)}`],
      priority: context.quadrant === "red" ? 3 : 2,
    })
  })

  // 2. Ajustar por intensidad (si alta intensidad, priorizar breathing/grounding)
  if (context.intensity && context.intensity > 70) {
    addOrUpdateSuggestion(suggestions, "breathing", {
      confidence: 0.3,
      reasons: ["Alta intensidad emocional"],
      priority: 1,
    })
    addOrUpdateSuggestion(suggestions, "grounding", {
      confidence: 0.2,
      reasons: ["Alta intensidad emocional"],
      priority: 1,
    })
  }

  // 3. Sugerencias basadas en clasificación AI (si existe)
  if (aiClassification) {
    // Por patrones cognitivos
    aiClassification.cognitive_patterns.forEach((pattern) => {
      if (pattern !== "ninguno") {
        const type = COGNITIVE_PATTERN_INTERVENTIONS[pattern]
        if (type) {
          addOrUpdateSuggestion(suggestions, type, {
            confidence: 0.4,
            reasons: [`Patrón detectado: ${formatPattern(pattern)}`],
            priority: 1,
          })
        }
      }
    })

    // Por necesidades inferidas
    aiClassification.needs.forEach((need) => {
      const type = NEED_INTERVENTIONS[need]
      if (type) {
        addOrUpdateSuggestion(suggestions, type, {
          confidence: 0.3,
          reasons: [`Necesidad: ${formatNeed(need)}`],
          priority: 0,
        })
      }
    })

    // Por nivel de riesgo
    const riskConfig = RISK_LEVEL_INTERVENTIONS[aiClassification.risk_level]
    riskConfig.types.forEach((type) => {
      addOrUpdateSuggestion(suggestions, type, {
        confidence: 0.5,
        reasons: [`Nivel de riesgo: ${aiClassification.risk_level}`],
        priority: riskConfig.priority,
      })
    })

    // Usar sugerencia AI directa si está disponible
    if (aiClassification.suggested_intervention_type && 
        aiClassification.suggested_intervention_type !== "none") {
      addOrUpdateSuggestion(suggestions, aiClassification.suggested_intervention_type as InterventionType, {
        confidence: 0.5,
        reasons: ["Sugerencia AI personalizada"],
        priority: 2,
      })
    }
  }

  // 4. Ajustar por historial del usuario (boost a las que le funcionan mejor)
  if (userHistory && userHistory.length > 0) {
    userHistory.forEach((h) => {
      if (h.avgDelta > 1 && suggestions.has(h.type)) {
        const existing = suggestions.get(h.type)!
        existing.confidence = Math.min(1, existing.confidence + 0.2)
        existing.reasons.push(`Históricamente efectiva (${h.avgDelta.toFixed(1)} puntos)`)
      }
    })
  }

  // Convertir a array y ordenar
  const result = Array.from(suggestions.values())
    .sort((a, b) => {
      // Primero por prioridad (mayor = más urgente)
      if (b.priority !== a.priority) return b.priority - a.priority
      // Luego por confianza
      return b.confidence - a.confidence
    })
    .slice(0, 5) // Top 5 sugerencias

  return result
}

/**
 * Obtiene la sugerencia principal (la de mayor confianza y prioridad)
 */
export function getTopSuggestion(
  context: EmotionalContext,
  aiClassification?: NoteClassification | null,
  userHistory?: UserInterventionHistory[]
): InterventionSuggestion | null {
  const suggestions = suggestInterventions(context, aiClassification, userHistory)
  return suggestions.length > 0 ? suggestions[0] : null
}

/**
 * Obtiene el tipo de intervención recomendada como string simple
 */
export function getRecommendedInterventionType(
  context: EmotionalContext,
  aiClassification?: NoteClassification | null,
  userHistory?: UserInterventionHistory[]
): string | undefined {
  const top = getTopSuggestion(context, aiClassification, userHistory)
  return top?.type
}

// ============================================
// Helpers
// ============================================

function addOrUpdateSuggestion(
  map: Map<InterventionType, InterventionSuggestion>,
  type: InterventionType,
  partial: { confidence: number; reasons: string[]; priority: number }
) {
  const existing = map.get(type)
  if (existing) {
    existing.confidence = Math.min(1, existing.confidence + partial.confidence)
    existing.reasons.push(...partial.reasons)
    existing.priority = Math.max(existing.priority, partial.priority)
  } else {
    map.set(type, {
      type,
      confidence: partial.confidence,
      reasons: partial.reasons,
      priority: partial.priority,
    })
  }
}

function getQuadrantLabel(quadrant: string): string {
  const labels: Record<string, string> = {
    green: "en calma",
    yellow: "con energía",
    red: "en tensión",
    blue: "sin ánimo",
  }
  return labels[quadrant] || quadrant
}

function formatPattern(pattern: string): string {
  const labels: Record<string, string> = {
    rumiacion: "rumiación",
    catastrofismo: "catastrofismo",
    generalizacion: "generalización",
    pensamiento_dicotomico: "pensamiento dicotómico",
    lectura_mental: "lectura mental",
    personalizacion: "personalización",
    filtro_mental: "filtro mental",
  }
  return labels[pattern] || pattern
}

function formatNeed(need: string): string {
  const labels: Record<string, string> = {
    descanso: "descanso",
    claridad: "claridad mental",
    conexion: "conexión social",
    validacion: "validación",
    autonomia: "autonomía",
    seguridad: "seguridad",
    expresion: "expresión",
    movimiento: "movimiento físico",
    silencio: "silencio",
    distraccion: "distracción positiva",
  }
  return labels[need] || need
}

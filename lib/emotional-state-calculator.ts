/**
 * Calculador de Estado Emocional Reciente - VLADI DEAM EQ
 * Implementa la lógica especificada en el documento de diseño del Bloque 1
 */

import type { EmotionEntry } from "./vladi-store"

export interface EmotionalStateResult {
  category: "calma" | "sin_animo" | "energia" | "tension"
  categoryLabel: string
  feedbackText: string
  V_mean: number // Valencia media ponderada
  A_mean: number // Arousal medio ponderado
  stability: number // 0-1, qué tan estable es el estado
  n_events: number
  periodLabel: string
  hasEnoughData: boolean
}

// Tabla de mapeo de emociones a ejes valence/arousal
// Valores en rango -1..+1
const EMOTION_TO_AXES: Record<string, { valence: number; arousal: number }> = {
  // Cuadrante Verde (Calma): valencia positiva o neutra, arousal bajo
  Soñoliento: { valence: 0.1, arousal: -0.8 },
  Complaciente: { valence: 0.3, arousal: -0.5 },
  Sosegado: { valence: 0.4, arousal: -0.7 },
  Acogido: { valence: 0.5, arousal: -0.4 },
  Sereno: { valence: 0.6, arousal: -0.6 },
  Apacible: { valence: 0.4, arousal: -0.6 },
  Reflexivo: { valence: 0.2, arousal: -0.4 },
  Pacífico: { valence: 0.5, arousal: -0.7 },
  Cómodo: { valence: 0.4, arousal: -0.5 },
  Despreocupado: { valence: 0.3, arousal: -0.5 },
  Relajado: { valence: 0.4, arousal: -0.7 },
  Tranquilo: { valence: 0.5, arousal: -0.6 },
  Repuesto: { valence: 0.3, arousal: -0.4 },
  Afortunado: { valence: 0.6, arousal: -0.3 },
  Equilibrado: { valence: 0.5, arousal: -0.4 },
  Calmado: { valence: 0.4, arousal: -0.6 },
  Seguro: { valence: 0.5, arousal: -0.3 },
  Satisfecho: { valence: 0.6, arousal: -0.4 },
  Agradecido: { valence: 0.7, arousal: -0.3 },
  Conmovido: { valence: 0.5, arousal: -0.2 },
  "A gusto": { valence: 0.5, arousal: -0.5 },
  Desenfadado: { valence: 0.4, arousal: -0.4 },
  Contento: { valence: 0.6, arousal: -0.3 },
  Afectuoso: { valence: 0.6, arousal: -0.2 },
  Realizado: { valence: 0.7, arousal: -0.2 },

  // Cuadrante Amarillo (Energía): valencia positiva, arousal alto
  Agradable: { valence: 0.5, arousal: 0.3 },
  Jubiloso: { valence: 0.7, arousal: 0.6 },
  Esperanzado: { valence: 0.6, arousal: 0.4 },
  Juguetón: { valence: 0.6, arousal: 0.5 },
  Dichoso: { valence: 0.8, arousal: 0.4 },
  Complacido: { valence: 0.6, arousal: 0.3 },
  Centrado: { valence: 0.5, arousal: 0.4 },
  Feliz: { valence: 0.8, arousal: 0.5 },
  Orgulloso: { valence: 0.7, arousal: 0.4 },
  Encantado: { valence: 0.8, arousal: 0.5 },
  Enérgico: { valence: 0.6, arousal: 0.7 },
  Vivaz: { valence: 0.7, arousal: 0.7 },
  Emocionado: { valence: 0.7, arousal: 0.8 },
  Optimista: { valence: 0.7, arousal: 0.5 },
  Entusiasta: { valence: 0.8, arousal: 0.7 },
  Hiperactivo: { valence: 0.4, arousal: 0.9 },
  Alegre: { valence: 0.7, arousal: 0.6 },
  Motivado: { valence: 0.7, arousal: 0.6 },
  Inspirado: { valence: 0.8, arousal: 0.6 },
  Exaltado: { valence: 0.7, arousal: 0.8 },
  Sorprendido: { valence: 0.3, arousal: 0.7 },
  Animado: { valence: 0.6, arousal: 0.6 },
  Festivo: { valence: 0.7, arousal: 0.7 },
  Eufórico: { valence: 0.9, arousal: 0.9 },
  Extasiado: { valence: 0.9, arousal: 0.8 },

  // Cuadrante Rojo (Tensión): valencia negativa, arousal alto
  Asqueado: { valence: -0.7, arousal: 0.5 },
  Intranquilo: { valence: -0.4, arousal: 0.6 },
  Alarmado: { valence: -0.6, arousal: 0.8 },
  Incómodo: { valence: -0.4, arousal: 0.5 },
  Fastidiado: { valence: -0.5, arousal: 0.4 },
  Ansioso: { valence: -0.6, arousal: 0.7 },
  Temeroso: { valence: -0.7, arousal: 0.7 },
  Preocupado: { valence: -0.5, arousal: 0.6 },
  Irritado: { valence: -0.6, arousal: 0.6 },
  Molesto: { valence: -0.5, arousal: 0.5 },
  "Hirviendo de rabia": { valence: -0.9, arousal: 0.9 },
  Asustado: { valence: -0.7, arousal: 0.8 },
  Enfadado: { valence: -0.7, arousal: 0.7 },
  Nervioso: { valence: -0.5, arousal: 0.7 },
  Inquieto: { valence: -0.4, arousal: 0.6 },
  Rabioso: { valence: -0.8, arousal: 0.8 },
  Furioso: { valence: -0.9, arousal: 0.9 },
  Frustrado: { valence: -0.7, arousal: 0.7 },
  Tenso: { valence: -0.6, arousal: 0.7 },
  Desconcertado: { valence: -0.5, arousal: 0.6 },
  Enfurecido: { valence: -0.9, arousal: 0.9 },
  Aterrorizado: { valence: -0.9, arousal: 0.9 },
  Estresado: { valence: -0.7, arousal: 0.8 },
  Alterado: { valence: -0.6, arousal: 0.8 },
  Impactado: { valence: -0.6, arousal: 0.7 },

  // Cuadrante Azul (Sin ánimo): valencia negativa, arousal bajo
  Desesperado: { valence: -0.9, arousal: -0.3 },
  "Sin esperanza": { valence: -0.9, arousal: -0.5 },
  Desolado: { valence: -0.8, arousal: -0.6 },
  Fundido: { valence: -0.7, arousal: -0.8 },
  "Sin energía": { valence: -0.6, arousal: -0.9 },
  Abatido: { valence: -0.7, arousal: -0.6 },
  Deprimido: { valence: -0.8, arousal: -0.7 },
  Huraño: { valence: -0.6, arousal: -0.5 },
  Agotado: { valence: -0.6, arousal: -0.8 },
  Fatigado: { valence: -0.5, arousal: -0.7 },
  Aislado: { valence: -0.7, arousal: -0.5 },
  Miserable: { valence: -0.9, arousal: -0.4 },
  Solitario: { valence: -0.7, arousal: -0.5 },
  Descorazonado: { valence: -0.7, arousal: -0.5 },
  Cansado: { valence: -0.4, arousal: -0.8 },
  Pesimista: { valence: -0.6, arousal: -0.4 },
  Sombrío: { valence: -0.7, arousal: -0.5 },
  Desanimado: { valence: -0.6, arousal: -0.6 },
  Triste: { valence: -0.7, arousal: -0.5 },
  Aburrido: { valence: -0.3, arousal: -0.7 },
  Disgustado: { valence: -0.6, arousal: -0.4 },
  Apagado: { valence: -0.5, arousal: -0.7 },
  Decepcionado: { valence: -0.6, arousal: -0.5 },
  Decaído: { valence: -0.5, arousal: -0.6 },
  Apático: { valence: -0.4, arousal: -0.8 },
}

// Umbrales para categorización (ajustables según calibración)
const THRESHOLDS = {
  valence: 0.15,
  arousal: 0.15,
}

const MIN_EVENTS_REQUIRED = 3

/**
 * Calcula el estado emocional reciente del usuario
 */
export function calculateEmotionalState(
  entries: EmotionEntry[],
  timeRange: "7D" | "14D" | "30D",
): EmotionalStateResult {
  const now = new Date()
  const rangeDays = timeRange === "7D" ? 7 : timeRange === "14D" ? 14 : 30
  const rangeMs = rangeDays * 24 * 60 * 60 * 1000

  // Filtrar entradas dentro de la ventana temporal
  const filteredEntries = entries.filter((e) => {
    const entryTime = new Date(e.timestamp).getTime()
    return now.getTime() - entryTime <= rangeMs
  })

  const periodLabel =
    timeRange === "7D" ? "últimos 7 días" : timeRange === "14D" ? "últimas 2 semanas" : "últimos 30 días"

  // Verificar datos suficientes
  if (filteredEntries.length < MIN_EVENTS_REQUIRED) {
    return {
      category: "calma",
      categoryLabel: "Aún sin tendencia",
      feedbackText: `Registra ${MIN_EVENTS_REQUIRED - filteredEntries.length} check-ins más para ver cómo te has sentido últimamente.`,
      V_mean: 0,
      A_mean: 0,
      stability: 0,
      n_events: filteredEntries.length,
      periodLabel,
      hasEnoughData: false,
    }
  }

  // Calcular tau para peso temporal
  const tau = timeRange === "7D" ? 3 : timeRange === "14D" ? 6 : 10

  // Calcular pesos y agregados
  let weightedValenceSum = 0
  let weightedArousalSum = 0
  let totalWeight = 0
  const valences: number[] = []
  const arousals: number[] = []

  filteredEntries.forEach((entry) => {
    // Obtener valence y arousal
    let valence = 0
    let arousal = 0

    // Priorizar valores de BD si existen, sino derivar de emoción
    if (entry.valence !== undefined && entry.arousal !== undefined) {
      valence = entry.valence
      arousal = entry.arousal
    } else if (EMOTION_TO_AXES[entry.emotion]) {
      valence = EMOTION_TO_AXES[entry.emotion].valence
      arousal = EMOTION_TO_AXES[entry.emotion].arousal
    } else {
      // Fallback basado en quadrant
      const quadrantMap = {
        green: { valence: 0.3, arousal: -0.5 },
        yellow: { valence: 0.5, arousal: 0.6 },
        red: { valence: -0.6, arousal: 0.7 },
        blue: { valence: -0.4, arousal: -0.6 },
      }
      const mapped = quadrantMap[entry.quadrant as keyof typeof quadrantMap] || { valence: 0, arousal: 0 }
      valence = mapped.valence
      arousal = mapped.arousal
    }

    // Calcular peso temporal (recencia)
    const age_days = (now.getTime() - new Date(entry.timestamp).getTime()) / (1000 * 60 * 60 * 24)
    const w_time = Math.exp(-age_days / tau)

    // Peso total considerando confianza (si existe)
    const confidence = entry.confidence || 1
    const w = w_time * (0.7 + 0.3 * confidence)

    weightedValenceSum += valence * w
    weightedArousalSum += arousal * w
    totalWeight += w

    valences.push(valence)
    arousals.push(arousal)
  })

  // Calcular medias ponderadas
  const V_mean = weightedValenceSum / totalWeight
  const A_mean = weightedArousalSum / totalWeight

  // Calcular estabilidad (varianza)
  const V_variance = valences.reduce((sum, v) => sum + Math.pow(v - V_mean, 2), 0) / valences.length
  const A_variance = arousals.reduce((sum, a) => sum + Math.pow(a - A_mean, 2), 0) / arousals.length
  const stability = Math.max(0, 1 - (V_variance + A_variance) / 2)

  // Mapear a categoría usando umbrales
  const Tv = THRESHOLDS.valence
  const Ta = THRESHOLDS.arousal

  let category: "calma" | "sin_animo" | "energia" | "tension"
  let categoryLabel: string

  if (A_mean <= -Ta && V_mean >= -Tv) {
    category = "calma"
    categoryLabel = "En calma"
  } else if (A_mean <= -Ta && V_mean < -Tv) {
    category = "sin_animo"
    categoryLabel = "Sin ánimo"
  } else if (A_mean > -Ta && V_mean >= -Tv) {
    category = "energia"
    categoryLabel = "Con energía"
  } else {
    category = "tension"
    categoryLabel = "En tensión"
  }

  // Zona neutra fallback
  if (Math.abs(V_mean) < Tv && Math.abs(A_mean) < Ta) {
    category = "calma"
    categoryLabel = "En calma"
  }

  // Generar feedback contextual
  const feedbackText = generateFeedbackText(category, filteredEntries.length, stability)

  return {
    category,
    categoryLabel,
    feedbackText,
    V_mean: Math.round(V_mean * 100) / 100,
    A_mean: Math.round(A_mean * 100) / 100,
    stability: Math.round(stability * 100) / 100,
    n_events: filteredEntries.length,
    periodLabel,
    hasEnoughData: true,
  }
}

/**
 * Genera texto de feedback según la categoría
 */
function generateFeedbackText(category: string, n_events: number, stability: number): string {
  // Textos de ejemplo según especificación
  const templates = {
    calma: [
      "En general, últimamente te has sentido más estable y con una tranquilidad bastante presente.",
      "Últimamente has mantenido un estado de mayor serenidad y control emocional.",
      "En estos días has experimentado una sensación de calma más constante.",
    ],
    sin_animo: [
      "En general, estos días has estado con menos impulso y una sensación de bajón más frecuente.",
      "Últimamente has sentido menos energía y un ánimo más bajo de lo habitual.",
      "En este periodo has tenido momentos con menor motivación y vitalidad.",
    ],
    energia: [
      "En general, últimamente has tenido más empuje y una sensación de activación positiva más constante.",
      "Estos días has experimentado mayor vitalidad y energía para afrontar las cosas.",
      "Últimamente te has sentido con más impulso y una actitud más activa.",
    ],
    tension: [
      "En general, estos días se nota más tensión y cierta presión interna, aunque con momentos de control.",
      "Últimamente has experimentado mayor activación y algo más de tensión emocional.",
      "En este periodo has tenido momentos con más presión interna y activación.",
    ],
  }

  const texts = templates[category as keyof typeof templates] || templates.calma
  const randomIndex = Math.floor(Math.random() * texts.length)
  return texts[randomIndex]
}

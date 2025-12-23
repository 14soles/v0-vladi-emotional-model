import type { EmotionEntry } from "./vladi-store"

// Definiciones científicas de las métricas DEAM
export const DEAM_DEFINITIONS = {
  g: {
    name: "Granularidad Emocional",
    description:
      "Capacidad de distinguir entre emociones similares con precisión. Una alta granularidad indica un vocabulario emocional rico y la habilidad de identificar matices sutiles en tus estados emocionales.",
    branch: "Rama 1 - Mayer & Salovey: Percepción emocional",
  },
  p: {
    name: "Percepción Emocional",
    description:
      "Frecuencia y consistencia con la que registras tus emociones. Una alta percepción indica que prestas atención regular a tu estado emocional y lo monitorizas activamente.",
    branch: "Rama 1 - Mayer & Salovey: Percepción emocional",
  },
  c: {
    name: "Conciencia Contextual",
    description:
      "Capacidad de identificar los contextos, situaciones y triggers que influyen en tus emociones. Alta conciencia indica comprensión de los factores externos que afectan tu bienestar.",
    branch: "Rama 3 - Mayer & Salovey: Comprensión emocional",
  },
  a: {
    name: "Adaptabilidad Emocional",
    description:
      "Capacidad de regular y transformar tus emociones mediante intervenciones. Alta adaptabilidad indica que puedes modificar tu estado emocional cuando lo deseas.",
    branch: "Rama 4 - Mayer & Salovey: Regulación emocional",
  },
  ie: {
    name: "Inercia Emocional",
    description:
      "Tendencia de las emociones negativas a persistir en el tiempo. Una inercia baja (buena) indica que te recuperas rápidamente de estados emocionales negativos.",
    branch: "Indicador de salud mental - estudios longitudinales",
  },
}

// Pesos calibrados para la fórmula DEAM EQ
const WEIGHTS = {
  alpha: 0.2, // Granularidad
  beta: 0.15, // Percepción
  gamma: 0.25, // Conciencia
  delta: 0.4, // Adaptabilidad
}

export interface InertiaData {
  avgRecoveryTimeHours: number // Tiempo medio de recuperación en horas
  avgRecoveryTimeFormatted: string // Formato legible "2,3 h" o "45 min"
  peakCount: number // Número de picos emocionales
  recoveredPeaks: number // Picos recuperados
  recoveryRate: number // % de picos recuperados en menos de X horas
  baselineIntensity: number // Línea base del usuario
  trendVsPrevious: number // Variación en % vs periodo anterior
  trendHoursDiff: number // Diferencia en horas vs periodo anterior
}

export interface DEAMMetrics {
  G: number // Granularidad (0-1)
  P: number // Percepción (0-1)
  C: number // Conciencia (0-1)
  A: number // Adaptabilidad (0-1)
  Ie: number // Inercia Emocional (0-1)
  deamEQ: number // Índice compuesto (0-100)
  deamTrend: number // Tendencia vs periodo anterior
  inertiaTrend: number // Tendencia de inercia
  inertiaPeaks: Date[] // Picos de inercia detectados
  inertiaData: InertiaData // Datos detallados de inercia
  climate: {
    green: number
    yellow: number
    red: number
    blue: number
  }
  interventionStats: {
    type: string
    uses: number
    avgDelta: number
  }[]
  topTriggers: {
    context: string
    count: number
    avgIntensity: number
  }[]
  adherence: number // Porcentaje de adherencia
  uniqueEmotions: string[]
}

function calculateInertiaData(entries: EmotionEntry[], previousEntries: EmotionEntry[] | null = null): InertiaData {
  const defaultData: InertiaData = {
    avgRecoveryTimeHours: 0,
    avgRecoveryTimeFormatted: "Sin datos",
    peakCount: 0,
    recoveredPeaks: 0,
    recoveryRate: 0,
    baselineIntensity: 5,
    trendVsPrevious: 0,
    trendHoursDiff: 0,
  }

  if (!entries || entries.length < 2) {
    return defaultData
  }

  // Ordenar por timestamp
  const sorted = [...entries].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())

  // 1. Calcular línea base emocional (promedio de intensidad de los últimos 30 registros)
  const recentForBaseline = sorted.slice(-30)
  const baselineIntensity =
    recentForBaseline.reduce((sum, e) => sum + (e.intensity_before || 5), 0) / recentForBaseline.length

  // 2. Identificar picos emocionales (intensidad >= 7 en cuadrantes negativos)
  const UMBRAL_PICO = 7
  const negativeQuadrants = ["red", "blue"]
  const peaks: { entry: EmotionEntry; index: number; timestamp: Date }[] = []

  sorted.forEach((entry, index) => {
    if (negativeQuadrants.includes(entry.quadrant) && (entry.intensity_before || 5) >= UMBRAL_PICO) {
      peaks.push({
        entry,
        index,
        timestamp: new Date(entry.timestamp),
      })
    }
  })

  if (peaks.length === 0) {
    return {
      ...defaultData,
      baselineIntensity: Math.round(baselineIntensity * 10) / 10,
      avgRecoveryTimeFormatted: "0 h",
    }
  }

  // 3. Para cada pico, encontrar el tiempo de recuperación
  const MARGEN_RECUPERACION = 2 // Puntos de intensidad cerca de la línea base
  const MAX_RECOVERY_HOURS = 72 // Máximo tiempo de búsqueda

  const recoveryTimes: number[] = []
  let recoveredCount = 0

  peaks.forEach((peak) => {
    // Buscar el siguiente check-in donde la intensidad esté cerca de la línea base
    let recovered = false
    for (let i = peak.index + 1; i < sorted.length; i++) {
      const nextEntry = sorted[i]
      const timeDiffHours = (new Date(nextEntry.timestamp).getTime() - peak.timestamp.getTime()) / (1000 * 60 * 60)

      // Si pasaron más de 72h sin recuperación, truncar
      if (timeDiffHours > MAX_RECOVERY_HOURS) {
        recoveryTimes.push(MAX_RECOVERY_HOURS)
        break
      }

      // Condición de recuperación: intensidad cerca de línea base
      const intensityDiff = Math.abs((nextEntry.intensity_before || 5) - baselineIntensity)
      if (intensityDiff <= MARGEN_RECUPERACION) {
        recoveryTimes.push(timeDiffHours)
        recoveredCount++
        recovered = true
        break
      }
    }

    // Si no hay más entradas después del pico
    if (!recovered && recoveryTimes.length < peaks.length) {
      // No añadir nada, pico no recuperado aún
    }
  })

  // 4. Calcular media de tiempo de recuperación
  const avgRecoveryTimeHours =
    recoveryTimes.length > 0 ? recoveryTimes.reduce((sum, t) => sum + t, 0) / recoveryTimes.length : 0

  // Formatear tiempo
  let avgRecoveryTimeFormatted: string
  if (avgRecoveryTimeHours === 0) {
    avgRecoveryTimeFormatted = "0 h"
  } else if (avgRecoveryTimeHours < 1) {
    avgRecoveryTimeFormatted = `${Math.round(avgRecoveryTimeHours * 60)} min`
  } else {
    avgRecoveryTimeFormatted = `${(Math.round(avgRecoveryTimeHours * 10) / 10).toFixed(1).replace(".", ",")} h`
  }

  // 5. Calcular tendencia vs periodo anterior
  let trendVsPrevious = 0
  let trendHoursDiff = 0

  if (previousEntries && previousEntries.length >= 2) {
    const prevInertia = calculateInertiaData(previousEntries, null)
    if (prevInertia.avgRecoveryTimeHours > 0) {
      trendHoursDiff = avgRecoveryTimeHours - prevInertia.avgRecoveryTimeHours
      trendVsPrevious = Math.round(
        ((avgRecoveryTimeHours - prevInertia.avgRecoveryTimeHours) / prevInertia.avgRecoveryTimeHours) * 100,
      )
    }
  }

  return {
    avgRecoveryTimeHours,
    avgRecoveryTimeFormatted,
    peakCount: peaks.length,
    recoveredPeaks: recoveredCount,
    recoveryRate: peaks.length > 0 ? Math.round((recoveredCount / peaks.length) * 100) : 0,
    baselineIntensity: Math.round(baselineIntensity * 10) / 10,
    trendVsPrevious,
    trendHoursDiff: Math.round(trendHoursDiff * 10) / 10,
  }
}

// Calcular métricas DEAM EQ
export function calculateDEAMMetrics(
  currentEntries: EmotionEntry[],
  previousEntries: EmotionEntry[],
  periodDays: number,
): DEAMMetrics {
  const defaultMetrics: DEAMMetrics = {
    G: 0,
    P: 0,
    C: 0,
    A: 0,
    Ie: 0.5,
    deamEQ: 0,
    deamTrend: 0,
    inertiaTrend: 0,
    inertiaPeaks: [],
    inertiaData: {
      avgRecoveryTimeHours: 0,
      avgRecoveryTimeFormatted: "Sin datos",
      peakCount: 0,
      recoveredPeaks: 0,
      recoveryRate: 0,
      baselineIntensity: 5,
      trendVsPrevious: 0,
      trendHoursDiff: 0,
    },
    climate: { green: 25, yellow: 25, red: 25, blue: 25 },
    interventionStats: [],
    topTriggers: [],
    adherence: 0,
    uniqueEmotions: [],
  }

  if (!currentEntries || currentEntries.length === 0) {
    return defaultMetrics
  }

  // 1. Granularidad (G) - Variedad de emociones únicas
  const uniqueEmotions = [...new Set(currentEntries.map((e) => e.emotion))]
  const maxEmotions = 25 // Número máximo de emociones en el sistema
  const G = Math.min(1, uniqueEmotions.length / Math.min(maxEmotions, currentEntries.length * 0.7))

  // 2. Percepción (P) - Frecuencia de registros
  const expectedEntries = periodDays * 2 // 2 registros esperados por día
  const P = Math.min(1, currentEntries.length / expectedEntries)

  // 3. Conciencia (C) - Proporción de registros con contexto
  const entriesWithContext = currentEntries.filter(
    (e) => (e.tags && e.tags.length > 0) || (e.note && e.note.trim().length > 0),
  )
  const C = currentEntries.length > 0 ? entriesWithContext.length / currentEntries.length : 0

  // 4. Adaptabilidad (A) - Eficacia de las intervenciones
  const entriesWithIntervention = currentEntries.filter(
    (e) => e.intensity_after !== undefined && e.intensity_after !== null,
  )
  let A = 0.5 // Valor por defecto
  if (entriesWithIntervention.length > 0) {
    const deltas = entriesWithIntervention.map((e) => {
      const before = e.intensity_before || 5
      const after = e.intensity_after || before
      return Math.max(0, before - after) / 10
    })
    A = deltas.reduce((sum, d) => sum + d, 0) / deltas.length
    A = Math.min(1, A * 2) // Escalar para mejor visualización
  }

  // 5. Inercia Emocional (Ie) - Persistencia de emociones negativas
  const negativeQuadrants = ["red", "blue"]
  const negativeEntries = currentEntries.filter((e) => negativeQuadrants.includes(e.quadrant))

  let Ie = 0.5 // Valor por defecto
  const inertiaPeaks: Date[] = []

  if (negativeEntries.length >= 2) {
    // Calcular duración de estados negativos consecutivos
    const sortedNegative = [...negativeEntries].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    )

    let totalPersistence = 0
    let consecutiveCount = 0

    for (let i = 1; i < sortedNegative.length; i++) {
      const timeDiff =
        (new Date(sortedNegative[i].timestamp).getTime() - new Date(sortedNegative[i - 1].timestamp).getTime()) /
        (1000 * 60 * 60) // horas

      if (timeDiff < 24) {
        // Si hay otra emoción negativa en menos de 24h
        totalPersistence += timeDiff
        consecutiveCount++

        // Detectar picos (más de 12 horas en negativo)
        if (timeDiff > 12) {
          inertiaPeaks.push(new Date(sortedNegative[i].timestamp))
        }
      }
    }

    // Normalizar inercia (0 = sin inercia, 1 = máxima inercia)
    const avgPersistence = consecutiveCount > 0 ? totalPersistence / consecutiveCount : 0
    Ie = Math.min(1, avgPersistence / 24) // Normalizar a 24 horas
  }

  const inertiaData = calculateInertiaData(currentEntries, previousEntries)

  // Calcular clima emocional
  const climateCounts = { green: 0, yellow: 0, red: 0, blue: 0 }
  currentEntries.forEach((e) => {
    if (climateCounts[e.quadrant as keyof typeof climateCounts] !== undefined) {
      climateCounts[e.quadrant as keyof typeof climateCounts]++
    }
  })
  const total = currentEntries.length || 1
  const climate = {
    green: Math.round((climateCounts.green / total) * 100),
    yellow: Math.round((climateCounts.yellow / total) * 100),
    red: Math.round((climateCounts.red / total) * 100),
    blue: Math.round((climateCounts.blue / total) * 100),
  }

  // Estadísticas de intervenciones
  const interventionMap = new Map<string, { uses: number; totalDelta: number }>()
  currentEntries.forEach((e) => {
    if (e.intervention_type && e.intensity_after !== undefined) {
      const existing = interventionMap.get(e.intervention_type) || { uses: 0, totalDelta: 0 }
      const delta = (e.intensity_before || 5) - (e.intensity_after || 5)
      interventionMap.set(e.intervention_type, {
        uses: existing.uses + 1,
        totalDelta: existing.totalDelta + delta,
      })
    }
  })
  const interventionStats = Array.from(interventionMap.entries())
    .map(([type, data]) => ({
      type,
      uses: data.uses,
      avgDelta: Math.round((data.totalDelta / data.uses) * 10) / 10,
    }))
    .sort((a, b) => b.avgDelta - a.avgDelta)

  // Top triggers/contextos
  const triggerMap = new Map<string, { count: number; totalIntensity: number }>()
  currentEntries.forEach((e) => {
    if (e.tags && e.tags.length > 0) {
      e.tags.forEach((tag) => {
        const existing = triggerMap.get(tag) || { count: 0, totalIntensity: 0 }
        triggerMap.set(tag, {
          count: existing.count + 1,
          totalIntensity: existing.totalIntensity + (e.intensity_before || 5),
        })
      })
    }
  })
  const topTriggers = Array.from(triggerMap.entries())
    .map(([context, data]) => ({
      context,
      count: data.count,
      avgIntensity: Math.round((data.totalIntensity / data.count) * 10) / 10,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  // Calcular índice DEAM EQ compuesto
  // Fórmula: EQ = 100 × (αG + βP + γC + δA)(1 - I'ₑ)
  const weightedSum = WEIGHTS.alpha * G + WEIGHTS.beta * P + WEIGHTS.gamma * C + WEIGHTS.delta * A
  const deamEQ = Math.round(100 * weightedSum * (1 - Ie * 0.5))

  // Calcular tendencias vs periodo anterior
  let deamTrend = 0
  let inertiaTrend = 0

  if (previousEntries && previousEntries.length > 0) {
    const prevMetrics = calculateDEAMMetricsSimple(previousEntries, periodDays)
    deamTrend = deamEQ - prevMetrics.deamEQ
    inertiaTrend = Math.round((Ie - prevMetrics.Ie) * 100)
  }

  // Adherencia (porcentaje de días con al menos un registro)
  const daysWithEntries = new Set(currentEntries.map((e) => new Date(e.timestamp).toDateString())).size
  const adherence = Math.round((daysWithEntries / periodDays) * 100)

  return {
    G,
    P,
    C,
    A,
    Ie,
    deamEQ,
    deamTrend,
    inertiaTrend,
    inertiaPeaks,
    inertiaData,
    climate,
    interventionStats,
    topTriggers,
    adherence,
    uniqueEmotions,
  }
}

// Versión simplificada para calcular tendencias (sin recursión)
function calculateDEAMMetricsSimple(entries: EmotionEntry[], periodDays: number): { deamEQ: number; Ie: number } {
  if (!entries || entries.length === 0) {
    return { deamEQ: 0, Ie: 0.5 }
  }

  const uniqueEmotions = [...new Set(entries.map((e) => e.emotion))]
  const G = Math.min(1, uniqueEmotions.length / Math.min(25, entries.length * 0.7))
  const P = Math.min(1, entries.length / (periodDays * 2))
  const entriesWithContext = entries.filter(
    (e) => (e.tags && e.tags.length > 0) || (e.note && e.note.trim().length > 0),
  )
  const C = entries.length > 0 ? entriesWithContext.length / entries.length : 0

  const entriesWithIntervention = entries.filter((e) => e.intensity_after !== undefined && e.intensity_after !== null)
  let A = 0.5
  if (entriesWithIntervention.length > 0) {
    const deltas = entriesWithIntervention.map((e) => {
      const before = e.intensity_before || 5
      const after = e.intensity_after || before
      return Math.max(0, before - after) / 10
    })
    A = deltas.reduce((sum, d) => sum + d, 0) / deltas.length
    A = Math.min(1, A * 2)
  }

  const negativeQuadrants = ["red", "blue"]
  const negativeEntries = entries.filter((e) => negativeQuadrants.includes(e.quadrant))
  let Ie = 0.5
  if (negativeEntries.length >= 2) {
    const sortedNegative = [...negativeEntries].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    )
    let totalPersistence = 0
    let consecutiveCount = 0
    for (let i = 1; i < sortedNegative.length; i++) {
      const timeDiff =
        (new Date(sortedNegative[i].timestamp).getTime() - new Date(sortedNegative[i - 1].timestamp).getTime()) /
        (1000 * 60 * 60)
      if (timeDiff < 24) {
        totalPersistence += timeDiff
        consecutiveCount++
      }
    }
    const avgPersistence = consecutiveCount > 0 ? totalPersistence / consecutiveCount : 0
    Ie = Math.min(1, avgPersistence / 24)
  }

  const weightedSum = WEIGHTS.alpha * G + WEIGHTS.beta * P + WEIGHTS.gamma * C + WEIGHTS.delta * A
  const deamEQ = Math.round(100 * weightedSum * (1 - Ie * 0.5))

  return { deamEQ, Ie }
}

// Generar insights basados en las métricas
export function generateInsights(metrics: DEAMMetrics | null | undefined): string[] {
  const insights: string[] = []

  if (!metrics) {
    return insights
  }

  if (metrics.G > 0.7) {
    insights.push("Tu vocabulario emocional es rico y diverso. Esto te permite expresar con precisión lo que sientes.")
  } else if (metrics.G < 0.3 && metrics.P > 0.3) {
    insights.push(
      "Podrías beneficiarte de explorar más matices emocionales. Intenta identificar emociones más específicas.",
    )
  }

  if (metrics.Ie > 0.6) {
    insights.push(
      "Las emociones negativas tienden a persistir más tiempo. Las intervenciones de regulación podrían ayudarte.",
    )
  } else if (metrics.Ie < 0.3) {
    insights.push("Tu capacidad de recuperación emocional es excelente. Te recuperas rápido de los estados negativos.")
  }

  if (metrics.A > 0.7) {
    insights.push("Las intervenciones que utilizas están siendo muy efectivas para regular tus emociones.")
  }

  if (metrics.C > 0.7) {
    insights.push("Tienes una excelente conciencia de los contextos que influyen en tus emociones.")
  } else if (metrics.C < 0.3 && metrics.P > 0.3) {
    insights.push("Añadir notas y etiquetas a tus registros te ayudará a identificar patrones emocionales.")
  }

  if (metrics.climate) {
    if (metrics.climate.red > 40) {
      insights.push("Has experimentado bastante tensión recientemente. Considera practicar técnicas de relajación.")
    }

    if (metrics.climate.green > 50) {
      insights.push("Tu estado emocional predominante es de calma. Sigue cultivando lo que te funciona.")
    }
  }

  return insights.slice(0, 4)
}

// Generar recomendaciones personalizadas
export function generateRecommendations(metrics: DEAMMetrics | null | undefined): string[] {
  const recommendations: string[] = []

  if (!metrics) {
    return recommendations
  }

  if (metrics.P < 0.5) {
    recommendations.push("Intenta registrar tus emociones al menos 2 veces al día para obtener mejores insights.")
  }

  if (metrics.Ie > 0.5) {
    recommendations.push("Practica la respiración 4-7-8 cuando sientas emociones negativas persistentes.")
  }

  if (metrics.C < 0.5) {
    recommendations.push("Añade contexto a tus registros para descubrir qué situaciones afectan más tu bienestar.")
  }

  if (metrics.A < 0.5 && metrics.interventionStats && metrics.interventionStats.length > 0) {
    recommendations.push("Explora diferentes tipos de intervenciones para encontrar las que mejor te funcionan.")
  }

  if (metrics.climate && metrics.climate.blue > 30) {
    recommendations.push(
      "Cuando te sientas sin ánimo, el ejercicio de gratitud puede ayudarte a cambiar la perspectiva.",
    )
  }

  if (metrics.inertiaData && metrics.inertiaData.peakCount > 2) {
    recommendations.push("Has tenido varios picos de inercia. Considera hablar con un profesional si persisten.")
  }

  return recommendations.slice(0, 3)
}

import type { MoodEntry as EmotionEntry } from "./vladi-store"

// Definiciones científicas de las métricas DEAM EQ
// Basado en el modelo de Mayer & Salovey de las 4 ramas de inteligencia emocional
export const DEAM_DEFINITIONS = {
  g: {
    name: "Granularidad Emocional",
    shortName: "G",
    description:
      "Capacidad de distinguir entre emociones similares con precisión. Una alta granularidad indica un vocabulario emocional rico y la habilidad de identificar matices sutiles en tus estados emocionales.",
    branch: "Rama 1 - Mayer & Salovey: Percepción emocional",
    formula: "G = entropia_normalizada(etiquetas) * penalizacion_repeticion",
  },
  h: {
    name: "Constancia (Adherencia)",
    shortName: "H",
    description:
      "Frecuencia y consistencia con la que registras tus emociones. Mide tu adherencia al automonitoreo emocional activo.",
    branch: "Rama 1 - Mayer & Salovey: Percepción emocional",
    formula: "H = min(1, dias_activos / dias_esperados)",
  },
  // P (Percepción externa) reservado para microtests futuros - no mostrar aún
  c: {
    name: "Conciencia Contextual",
    shortName: "C",
    description:
      "Capacidad de identificar los contextos, situaciones y triggers que influyen en tus emociones. Alta conciencia indica comprensión de los factores externos que afectan tu bienestar.",
    branch: "Rama 3 - Mayer & Salovey: Comprensión emocional",
    formula: "C = registros_con_contexto / total_registros",
  },
  a: {
    name: "Adaptabilidad Emocional",
    shortName: "A",
    description:
      "Capacidad de regular y transformar tus emociones mediante intervenciones. Alta adaptabilidad indica que puedes modificar tu estado emocional cuando lo deseas.",
    branch: "Rama 4 - Mayer & Salovey: Regulación emocional",
    formula: "A = 0.4*efectividad + 0.3*utilidad_percibida + 0.3*engagement",
  },
  ie: {
    name: "Inercia Emocional",
    shortName: "Ie",
    description:
      "Tendencia de las emociones negativas a persistir en el tiempo. Una inercia baja (buena) indica que te recuperas rápidamente de estados emocionales negativos.",
    branch: "Indicador de salud mental - estudios longitudinales",
    formula: "Ie = tiempo_promedio_recuperacion / tiempo_maximo_esperado",
  },
}

// Pesos calibrados para la fórmula DEAM EQ compuesta
// Fórmula: EQ = 100 * (αG + βH + γC + δA) * (1 - Ie')
// Donde H = Adherencia/Constancia, Ie' = inercia normalizada (0-1)
const WEIGHTS = {
  alpha: 0.20, // G - Granularidad - importancia moderada
  beta: 0.15,  // H - Adherencia/Constancia - base necesaria
  gamma: 0.25, // C - Conciencia Contextual - comprensión emocional
  delta: 0.40, // A - Adaptabilidad - mayor peso porque regulación es clave
}

// Configuración de adherencia por defecto
export const DEFAULT_ADHERENCE_CONFIG = {
  targetCheckinsPerDay: 1,    // Registros esperados por día
  adherenceWindowDays: 14,    // Ventana de cálculo de adherencia
  maxRecoveryHours: 72,       // Tiempo máximo de recuperación considerado
  peakIntensityThreshold: 7,  // Umbral para considerar un pico de inercia (1-10)
  recoveryMargin: 2,          // Margen de intensidad para considerar recuperación
}

// ============================================
// DATA GATING THRESHOLDS - Umbrales EXACTOS para mostrar métricas
// Si no se cumple min → valor NULL y UI muestra "Calibrando"
// ============================================
export const DATA_GATING_THRESHOLDS = {
  // G (Granularidad): min 5 check-ins
  granularity: {
    min: 5,           // Mínimo 5 registros para calcular G
    optimal: 15,      // Óptimo para cálculo fiable
    message: "Necesitas al menos 5 registros para calcular tu granularidad emocional"
  },
  // H (Adherencia/Constancia): calculado por días activos, no por registros
  // Se calcula aparte con periodDays
  adherence: {
    min: 7,           // Mínimo 7 días de uso
    optimal: 14,      // Óptimo para cálculo fiable (2 semanas)
    message: "Necesitas al menos 7 días de uso para calcular tu constancia"
  },
  // C (Conciencia): min 5 check-ins con contexto
  consciousness: {
    min: 5,           // Mínimo 5 registros con contexto
    optimal: 15,      // Óptimo para cálculo fiable
    message: "Necesitas al menos 5 registros con contexto para calcular tu conciencia"
  },
  // A (Adaptabilidad): min 1 intervención done con post-check (NULL si <1)
  // "Confianza baja" hasta 3, pero NO bloquear
  adaptability: {
    min: 1,           // Mínimo 1 intervención con post-check
    lowConfidence: 3, // Menos de 3 = "confianza baja"
    optimal: 7,       // Óptimo para cálculo fiable
    message: "Necesitas completar al menos 1 intervención para calcular tu adaptabilidad"
  },
  // Ie (Inercia): min 1 episodio recuperable (NULL si <1)
  // A partir de 2 marcar como "más fiable"
  inertia: {
    min: 1,           // Mínimo 1 episodio recuperable
    reliable: 2,      // A partir de 2 es "más fiable"
    optimal: 5,       // Óptimo para cálculo fiable
    message: "Necesitas al menos 1 episodio de recuperación para calcular tu inercia"
  },
  // Score DEAM EQ: min 10 check-ins O 7 días (lo que ocurra antes)
  deamEQ: {
    min: 10,          // Mínimo 10 registros
    minDays: 7,       // O mínimo 7 días
    optimal: 21,      // Óptimo (3 semanas de datos)
    message: "Necesitas al menos 10 registros o 7 días de uso para calcular tu DEAM EQ"
  }
}

// Estados de calibración para cada métrica
export type CalibrationState = 
  | "insufficient"   // No hay datos suficientes (< min)
  | "calibrating"    // Datos en proceso de calibración (>= min, < optimal)
  | "stable"         // Datos suficientes para cálculo fiable (>= optimal)

export interface MetricCalibration {
  state: CalibrationState
  current: number      // Registros/datos actuales
  min: number          // Umbral mínimo
  optimal: number      // Umbral óptimo
  progress: number     // 0-100% hacia optimal
  message: string      // Mensaje para el usuario
}

export interface DEAMCalibrationStatus {
  granularity: MetricCalibration      // G
  adherence: MetricCalibration        // H (antes P)
  consciousness: MetricCalibration    // C
  adaptability: MetricCalibration & { lowConfidence: boolean }  // A
  inertia: MetricCalibration & { reliable: boolean }            // Ie
  deamEQ: MetricCalibration
  overallState: CalibrationState
  overallProgress: number
}

// Calcula el estado de calibración para cada métrica
// Usa los nuevos campos: onset_bucket, intervention_done, physical_state
export function calculateCalibrationStatus(
  entries: EmotionEntry[],
  periodDays: number
): DEAMCalibrationStatus {
  const totalEntries = entries.length
  
  // Registros con contexto (tags, notas, o triggers estructurados)
  const entriesWithContext = entries.filter(
    (e) => (e.tags && e.tags.length > 0) || 
           (e.notes && e.notes.trim().length > 0) ||
           (e.activity_tags && e.activity_tags.length > 0) ||
           (e.social_tags && e.social_tags.length > 0)
  ).length
  
  // Intervenciones completadas con post-check (intervention_done=true Y intensity_after)
  const entriesWithIntervention = entries.filter(
    (e) => e.intervention_done === true && e.intensity_after !== undefined
  ).length
  
  // Episodios recuperables para inercia (picos negativos con onset válido o sin él)
  const recoverableEpisodes = entries.filter(
    (e) => (e.quadrant === "red" || e.quadrant === "blue") && 
           (e.intensity || e.intensity_before || 5) >= 7
  ).length

  const getCalibration = (
    current: number,
    config: { min: number; optimal: number; message: string }
  ): MetricCalibration => {
    let state: CalibrationState
    if (current < config.min) {
      state = "insufficient"
    } else if (current < config.optimal) {
      state = "calibrating"
    } else {
      state = "stable"
    }

    return {
      state,
      current,
      min: config.min,
      optimal: config.optimal,
      progress: Math.min(100, Math.round((current / config.optimal) * 100)),
      message: state === "insufficient" ? config.message : 
               state === "calibrating" ? `Calibrando... (${current}/${config.optimal})` :
               "Datos suficientes"
    }
  }

  // G: min 5 check-ins
  const granularity = getCalibration(totalEntries, DATA_GATING_THRESHOLDS.granularity)
  
  // H: min 7 días (usamos periodDays como aproximación)
  const adherence = getCalibration(
    Math.min(periodDays, totalEntries), // días con al menos 1 registro
    DATA_GATING_THRESHOLDS.adherence
  )
  
  // C: min 5 con contexto
  const consciousness = getCalibration(entriesWithContext, DATA_GATING_THRESHOLDS.consciousness)
  
  // A: min 1 intervención done+post-check, lowConfidence si <3
  const adaptabilityBase = getCalibration(entriesWithIntervention, {
    min: DATA_GATING_THRESHOLDS.adaptability.min,
    optimal: DATA_GATING_THRESHOLDS.adaptability.optimal,
    message: DATA_GATING_THRESHOLDS.adaptability.message
  })
  const adaptability = {
    ...adaptabilityBase,
    lowConfidence: entriesWithIntervention < (DATA_GATING_THRESHOLDS.adaptability.lowConfidence || 3)
  }
  
  // Ie: min 1 episodio recuperable, reliable si >=2
  const inertiaBase = getCalibration(recoverableEpisodes, {
    min: DATA_GATING_THRESHOLDS.inertia.min,
    optimal: DATA_GATING_THRESHOLDS.inertia.optimal,
    message: DATA_GATING_THRESHOLDS.inertia.message
  })
  const inertia = {
    ...inertiaBase,
    reliable: recoverableEpisodes >= (DATA_GATING_THRESHOLDS.inertia.reliable || 2)
  }
  
  // DEAM EQ: min 10 check-ins O 7 días (lo que ocurra antes)
  const meetsEQMin = totalEntries >= DATA_GATING_THRESHOLDS.deamEQ.min || 
                     periodDays >= (DATA_GATING_THRESHOLDS.deamEQ.minDays || 7)
  const deamEQ: MetricCalibration = {
    state: meetsEQMin ? (totalEntries >= DATA_GATING_THRESHOLDS.deamEQ.optimal ? "stable" : "calibrating") : "insufficient",
    current: totalEntries,
    min: DATA_GATING_THRESHOLDS.deamEQ.min,
    optimal: DATA_GATING_THRESHOLDS.deamEQ.optimal,
    progress: Math.min(100, Math.round((totalEntries / DATA_GATING_THRESHOLDS.deamEQ.optimal) * 100)),
    message: meetsEQMin ? "Datos suficientes" : DATA_GATING_THRESHOLDS.deamEQ.message
  }

  // Estado general: el más restrictivo
  const states = [granularity, adherence, consciousness, adaptability, inertia, deamEQ]
  let overallState: CalibrationState = "stable"
  if (states.some(s => s.state === "insufficient")) {
    overallState = "insufficient"
  } else if (states.some(s => s.state === "calibrating")) {
    overallState = "calibrating"
  }

  // Progreso general: promedio ponderado
  const overallProgress = Math.round(
    (granularity.progress + adherence.progress + consciousness.progress + 
     adaptability.progress + inertia.progress + deamEQ.progress) / 6
  )

  return {
    granularity,
    adherence,
    consciousness,
    adaptability,
    inertia,
    deamEQ,
    overallState,
    overallProgress
  }
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
  G: number | null      // Granularidad (0-1) - NULL si <5 check-ins
  H: number | null      // Adherencia/Constancia (0-1) - NULL si <7 días
  C: number | null      // Conciencia (0-1) - NULL si <5 con contexto
  A: number | null      // Adaptabilidad (0-1) - NULL si <1 intervención done
  A_lowConfidence: boolean // true si A tiene menos de 3 intervenciones
  Ie: number | null     // Inercia Emocional (0-1) - NULL si <1 episodio
  Ie_reliable: boolean  // true si Ie tiene 2+ episodios
  deamEQ: number | null // Índice compuesto (0-100) - NULL si no cumple min
  deamTrend: number     // Tendencia vs periodo anterior
  inertiaTrend: number  // Tendencia de inercia
  inertiaPeaks: Date[]  // Picos de inercia detectados
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
  adherence: number     // Porcentaje de adherencia (raw)
  uniqueEmotions: string[]
  calibration: DEAMCalibrationStatus // Estado de calibración de cada métrica
}

// Mapeo EXACTO de onset_bucket a minutos (especificado en documento)
// Si onset es null, no usar en inercia (fallback a 0 o no computar)
const ONSET_BUCKET_MINUTES: Record<string, number> = {
  "just_now": 0,        // just_now → 0 min
  "10_30_min": 20,      // 10_30min → 20 min
  "30_60_min": 45,      // 30_60min → 45 min
  "1_3_hours": 120,     // 1_3h → 120 min (2 horas)
  "3_plus_hours": 240,  // 3h_plus → 240 min (4 horas)
  // "unknown" NO se mapea - se ignora en cálculo de inercia
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
    recentForBaseline.reduce((sum, e) => sum + (e.intensity_before || e.intensity || 5), 0) / recentForBaseline.length

  // 2. Identificar episodios negativos
  // NUEVO: Usar onset_bucket si está disponible para calcular tiempo real de emoción
  const UMBRAL_PICO = 7
  const negativeQuadrants = ["red", "blue"]
  const peaks: { entry: EmotionEntry; index: number; timestamp: Date; onsetMinutes: number }[] = []

  sorted.forEach((entry, index) => {
    const intensity = entry.intensity_before || entry.intensity || 5
    if (negativeQuadrants.includes(entry.quadrant) && intensity >= UMBRAL_PICO) {
      // Usar onset_bucket o onset_estimated_minutes si están disponibles
      let onsetMinutes = 0
      if (entry.onset_estimated_minutes !== undefined && entry.onset_estimated_minutes !== null) {
        onsetMinutes = entry.onset_estimated_minutes
      } else if (entry.onset_bucket && ONSET_BUCKET_MINUTES[entry.onset_bucket]) {
        onsetMinutes = ONSET_BUCKET_MINUTES[entry.onset_bucket]
      }

      peaks.push({
        entry,
        index,
        timestamp: new Date(entry.timestamp),
        onsetMinutes,
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
    
    // NUEVO: Si tenemos onset_bucket, añadir ese tiempo al cálculo
    // El tiempo total de inercia = onset_time + tiempo_hasta_recuperación
    const onsetHours = peak.onsetMinutes / 60
    
    for (let i = peak.index + 1; i < sorted.length; i++) {
      const nextEntry = sorted[i]
      const timeDiffHours = (new Date(nextEntry.timestamp).getTime() - peak.timestamp.getTime()) / (1000 * 60 * 60)

      // Si pasaron más de 72h sin recuperación, truncar
      if (timeDiffHours > MAX_RECOVERY_HOURS) {
        recoveryTimes.push(MAX_RECOVERY_HOURS + onsetHours)
        break
      }

      // Condición de recuperación: intensidad cerca de línea base
      const nextIntensity = nextEntry.intensity_before || nextEntry.intensity || 5
      const intensityDiff = Math.abs(nextIntensity - baselineIntensity)
      if (intensityDiff <= MARGEN_RECUPERACION) {
        // Tiempo total = onset + tiempo desde check-in hasta recuperación
        recoveryTimes.push(timeDiffHours + onsetHours)
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
// Implementa las fórmulas canónicas del modelo DEAM EQ
export function calculateDEAMMetrics(
  currentEntries: EmotionEntry[],
  previousEntries: EmotionEntry[],
  periodDays: number,
  userConfig?: { targetCheckinsPerDay?: number; adherenceWindowDays?: number }
): DEAMMetrics {
  const config = {
    ...DEFAULT_ADHERENCE_CONFIG,
    ...userConfig,
  }

  // Calcular estado de calibración primero
  const calibration = calculateCalibrationStatus(currentEntries || [], periodDays)

  const defaultMetrics: DEAMMetrics = {
    G: null,              // NULL hasta 5 check-ins
    H: null,              // NULL hasta 7 días
    C: null,              // NULL hasta 5 con contexto
    A: null,              // NULL hasta 1 intervención done
    A_lowConfidence: true,
    Ie: null,             // NULL hasta 1 episodio recuperable
    Ie_reliable: false,
    deamEQ: null,         // NULL hasta cumplir min
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
    calibration,
  }

  if (!currentEntries || currentEntries.length === 0) {
    return defaultMetrics
  }

  // ============================================
  // 1. GRANULARIDAD (G) - Diversidad de vocabulario emocional
  // Formula: G = entropia_normalizada * (1 - penalizacion_repeticion)
  // ============================================
  const uniqueEmotions = [...new Set(currentEntries.map((e) => e.emotion))]
  
  // Calcular entropía de etiquetas emocionales
  const emotionCounts = new Map<string, number>()
  currentEntries.forEach((e) => {
    emotionCounts.set(e.emotion, (emotionCounts.get(e.emotion) || 0) + 1)
  })
  
  const total = currentEntries.length
  let entropyLabels = 0
  emotionCounts.forEach((count) => {
    const p = count / total
    if (p > 0) entropyLabels -= p * Math.log(p)
  })
  const maxEntropyLabels = emotionCounts.size > 1 ? Math.log(emotionCounts.size) : 1
  const normalizedEntropyLabels = emotionCounts.size > 1 ? entropyLabels / maxEntropyLabels : 0
  
  // Penalizar repetición excesiva de una misma etiqueta
  const maxCount = Math.max(...Array.from(emotionCounts.values()))
  const topProportion = maxCount / total
  const repeatPenalty = Math.max(0, Math.min(1, (topProportion - 0.35) / (1 - 0.35)))
  
  const G = normalizedEntropyLabels * (1 - 0.35 * repeatPenalty)

  // ============================================
  // 2. ADHERENCIA/CONSTANCIA (H) - Adherencia al automonitoreo
  // Formula: H = min(1, dias_activos / dias_esperados)
  // ============================================
  const expectedEntries = periodDays * config.targetCheckinsPerDay
  const H_raw = Math.min(1, currentEntries.length / expectedEntries)

  // ============================================
  // 3. CONCIENCIA CONTEXTUAL (C) - Triggers y contextos
  // Formula: C = registros_con_contexto / total_registros
  // ============================================
  const entriesWithContext = currentEntries.filter(
    (e) => (e.tags && e.tags.length > 0) || (e.note && e.note.trim().length > 0),
  )
  const C = currentEntries.length > 0 ? entriesWithContext.length / currentEntries.length : 0

  // ============================================
  // 4. ADAPTABILIDAD (A) - Eficacia de las intervenciones
  // Formula oficial v1: delta = max(0, before - after) / 9, A = mean(delta) clamp [0..1]
  // Solo registros con intervention_done=true Y post_check (intensity_after)
  // ============================================
  const entriesWithIntervention = currentEntries.filter(
    (e) => e.intervention_done === true && 
           e.intensity_after !== undefined && 
           e.intensity_after !== null
  )
  
  let A = 0.5 // Valor por defecto si no hay intervenciones
  
  if (entriesWithIntervention.length > 0) {
    // Formula oficial: delta = max(0, before - after) / 9
    const deltas = entriesWithIntervention.map((e) => {
      const before = e.intensity_before || e.intensity || 5
      const after = e.intensity_after!
      return Math.max(0, before - after) / 9 // Escala 1-10, max delta = 9
    })
    // A = mean(delta) clamp [0..1]
    A = Math.min(1, Math.max(0, deltas.reduce((sum, d) => sum + d, 0) / deltas.length))
  }

  // ============================================
  // 5. INERCIA EMOCIONAL (Ie) - Persistencia de estados negativos
  // Formula oficial v1: Ie_score = min(1, Ie_hours / 24)
  // Donde Ie_hours = tiempo promedio de recuperación tras picos
  // Un Ie bajo (cercano a 0) = buena recuperación (resiliencia alta)
  // Resilience = 1 - Ie_score (para radar, más alto = mejor)
  // ============================================
  const negativeQuadrants = ["red", "blue"]
  const negativeEntries = currentEntries.filter((e) => negativeQuadrants.includes(e.quadrant))

  let Ie = 0.5 // Valor por defecto (inercia media)
  const inertiaPeaks: Date[] = []

  // Calcular datos detallados de inercia
  const inertiaData = calculateInertiaData(currentEntries, previousEntries)
  
  // Normalizar inercia basándose en el tiempo de recuperación
  // 0-6h = baja inercia (0-0.25), 6-12h = media (0.25-0.5), 12-24h = alta (0.5-1.0)
  if (inertiaData.avgRecoveryTimeHours > 0) {
    Ie = Math.min(1, inertiaData.avgRecoveryTimeHours / 24)
  } else if (negativeEntries.length >= 2) {
    // Fallback: calcular basándose en persistencia de estados negativos consecutivos
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
        totalPersistence += timeDiff
        consecutiveCount++

        if (timeDiff > 12) {
          inertiaPeaks.push(new Date(sortedNegative[i].timestamp))
        }
      }
    }

    const avgPersistence = consecutiveCount > 0 ? totalPersistence / consecutiveCount : 0
    Ie = Math.min(1, avgPersistence / 24)
  }

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

  // ============================================
  // APLICAR DATA GATING - Valores NULL si no hay datos suficientes
  // ============================================
  
  // G: NULL si <5 check-ins
  const G_final = calibration.granularity.state === "insufficient" ? null : G
  
  // H: NULL si <7 días
  const H_final = calibration.adherence.state === "insufficient" ? null : H_raw
  
  // C: NULL si <5 con contexto
  const C_final = calibration.consciousness.state === "insufficient" ? null : C
  
  // A: NULL si <1 intervención done, lowConfidence si <3
  const A_final = calibration.adaptability.state === "insufficient" ? null : A
  const A_lowConfidence = calibration.adaptability.lowConfidence
  
  // Ie: NULL si <1 episodio, reliable si >=2
  const Ie_final = calibration.inertia.state === "insufficient" ? null : Ie
  const Ie_reliable = calibration.inertia.reliable

  // ============================================
  // CALCULO DEL INDICE DEAM EQ COMPUESTO
  // Formula: EQ = 100 * (αG + βH + γC + δA) * (1 - Ie')
  // Solo si cumple min (10 check-ins O 7 días)
  // ============================================
  let deamEQ_final: number | null = null
  
  if (calibration.deamEQ.state !== "insufficient") {
    // Usar valores no-null para el cálculo, con fallbacks conservadores
    const G_calc = G_final ?? 0.5
    const H_calc = H_final ?? 0.5
    const C_calc = C_final ?? 0.5
    const A_calc = A_final ?? 0.5
    const Ie_calc = Ie_final ?? 0.5
    
    const weightedSum = WEIGHTS.alpha * G_calc + WEIGHTS.beta * H_calc + WEIGHTS.gamma * C_calc + WEIGHTS.delta * A_calc
    const inertiaPenalty = 1 - Ie_calc * 0.5 // Penalización moderada por inercia
    deamEQ_final = Math.round(100 * weightedSum * inertiaPenalty)
  }

  // Calcular tendencias vs periodo anterior
  let deamTrend = 0
  let inertiaTrend = 0

  if (previousEntries && previousEntries.length > 0 && deamEQ_final !== null) {
    const prevMetrics = calculateDEAMMetricsSimple(previousEntries, periodDays)
    deamTrend = deamEQ_final - prevMetrics.deamEQ
    inertiaTrend = Ie_final !== null ? Math.round((Ie_final - prevMetrics.Ie) * 100) : 0
  }

  // Adherencia (porcentaje de días con al menos un registro)
  const daysWithEntries = new Set(currentEntries.map((e) => new Date(e.timestamp).toDateString())).size
  const adherence = Math.round((daysWithEntries / periodDays) * 100)

  return {
    G: G_final,
    H: H_final,
    C: C_final,
    A: A_final,
    A_lowConfidence,
    Ie: Ie_final,
    Ie_reliable,
    deamEQ: deamEQ_final,
    deamTrend,
    inertiaTrend,
    inertiaPeaks,
    inertiaData,
    climate,
    interventionStats,
    topTriggers,
    adherence,
    uniqueEmotions,
    calibration,
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

  if (metrics.G !== null && metrics.G > 0.7) {
    insights.push("Tu vocabulario emocional es rico y diverso. Esto te permite expresar con precisión lo que sientes.")
  } else if (metrics.G !== null && metrics.G < 0.3 && metrics.H !== null && metrics.H > 0.3) {
    insights.push(
      "Podrías beneficiarte de explorar más matices emocionales. Intenta identificar emociones más específicas.",
    )
  }

  if (metrics.Ie !== null && metrics.Ie > 0.6) {
    insights.push(
      "Las emociones negativas tienden a persistir más tiempo. Las intervenciones de regulación podrían ayudarte.",
    )
  } else if (metrics.Ie !== null && metrics.Ie < 0.3) {
    insights.push("Tu capacidad de recuperación emocional es excelente. Te recuperas rápido de los estados negativos.")
  }

  if (metrics.A !== null && metrics.A > 0.7) {
    insights.push("Las intervenciones que utilizas están siendo muy efectivas para regular tus emociones.")
  }

  if (metrics.C !== null && metrics.C > 0.7) {
    insights.push("Tienes una excelente conciencia de los contextos que influyen en tus emociones.")
  } else if (metrics.C !== null && metrics.C < 0.3 && metrics.H !== null && metrics.H > 0.3) {
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

  if (metrics.H !== null && metrics.H < 0.5) {
    recommendations.push("Intenta registrar tus emociones al menos 2 veces al día para obtener mejores insights.")
  }

  if (metrics.Ie !== null && metrics.Ie > 0.5) {
    recommendations.push("Practica la respiración 4-7-8 cuando sientas emociones negativas persistentes.")
  }

  if (metrics.C !== null && metrics.C < 0.5) {
    recommendations.push("Añade contexto a tus registros para descubrir qué situaciones afectan más tu bienestar.")
  }

  if (metrics.A !== null && metrics.A < 0.5 && metrics.interventionStats && metrics.interventionStats.length > 0) {
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

// IEQ (Inteligencia Emocional Quantificada) Calculator
// Based on VLADI DEAM EQ methodology

import { getEmotionAxes } from "./emotion-mapping"

export interface EmotionEntry {
  timestamp: string
  emotion: string
  intensity: number
  valence?: number
  arousal?: number
  confidence?: number
  activity_context?: boolean
  social_context?: boolean
  free_text?: string
  body_signals?: any[]
  time_reference?: string
  certainty_bucket?: string
}

export type EmotionalCategory = "en calma" | "sin ánimo" | "con energía" | "en tensión"

export interface EmotionalStateResult {
  category: EmotionalCategory
  valence: number
  arousal: number
  stability: number
  nEvents: number
  description: string
  color: string
}

export interface IEQData {
  emotionalState: EmotionalStateResult
  deamScore: number
  inertia: number
  intensityAvg: number
  wellbeingAvg: number
}

const CATEGORY_COLORS = {
  "en calma": "#94B22E",
  "sin ánimo": "#466D91",
  "con energía": "#E6B04F",
  "en tensión": "#E6584F",
}

const CATEGORY_DESCRIPTIONS = {
  "en calma": "Hoy, te has sentido mayormente calmado y tranquilo.",
  "sin ánimo": "Hoy, te has sentido con poca energía y algo desanimado.",
  "con energía": "Hoy, te has sentido activo y con buen ánimo.",
  "en tensión": "Hoy, te has sentido algo tenso y bajo presión.",
}

export function calculateEmotionalState(entries: EmotionEntry[], timeRangeDays: number): EmotionalStateResult | null {
  if (entries.length < 3) {
    return null
  }

  const now = new Date()
  const tau = timeRangeDays === 7 ? 3 : timeRangeDays === 14 ? 6 : 10

  // Calculate temporal weights and aggregate valence/arousal
  let sumValence = 0
  let sumArousal = 0
  let sumWeights = 0
  const valences: number[] = []
  const arousals: number[] = []

  entries.forEach((entry) => {
    const timestamp = new Date(entry.timestamp)
    const ageDays = (now.getTime() - timestamp.getTime()) / (1000 * 60 * 60 * 24)
    const wTime = Math.exp(-ageDays / tau)

    let valence = entry.valence
    let arousal = entry.arousal

    // Derive from emotion if not present
    if (valence === undefined || arousal === undefined) {
      const axes = getEmotionAxes(entry.emotion)
      valence = axes.valence
      arousal = axes.arousal
    }

    const confidence = entry.confidence || 0.7
    const weight = wTime * (0.7 + 0.3 * confidence)

    sumValence += valence * weight
    sumArousal += arousal * weight
    sumWeights += weight

    valences.push(valence)
    arousals.push(arousal)
  })

  const V = sumValence / sumWeights
  const A = sumArousal / sumWeights

  // Calculate stability (variance)
  const meanValence = valences.reduce((a, b) => a + b, 0) / valences.length
  const meanArousal = arousals.reduce((a, b) => a + b, 0) / arousals.length
  const varV = valences.reduce((sum, v) => sum + Math.pow(v - meanValence, 2), 0) / valences.length
  const varA = arousals.reduce((sum, a) => sum + Math.pow(a - meanArousal, 2), 0) / arousals.length
  const stability = 1 - Math.min((varV + varA) / 2, 1)

  // Map to category
  const Tv = 0.15
  const Ta = 0.15

  let category: EmotionalCategory

  if (A <= -Ta && V >= -Tv) {
    category = "en calma"
  } else if (A <= -Ta && V < -Tv) {
    category = "sin ánimo"
  } else if (A > -Ta && V >= -Tv) {
    category = "con energía"
  } else {
    category = "en tensión"
  }

  // Fallback for neutral zone
  if (Math.abs(V) < Tv && Math.abs(A) < Ta) {
    category = "en calma"
  }

  return {
    category,
    valence: V,
    arousal: A,
    stability,
    nEvents: entries.length,
    description: CATEGORY_DESCRIPTIONS[category],
    color: CATEGORY_COLORS[category],
  }
}

export function calculateInertia(entries: EmotionEntry[]): number {
  // Calculate average recovery time from negative states
  // Returns average hours to recover
  const negativeEntries = entries.filter((e) => {
    const valence = e.valence !== undefined ? e.valence : getEmotionAxes(e.emotion).valence
    return valence < -0.3
  })

  if (negativeEntries.length === 0) return 0

  let totalRecoveryHours = 0
  let recoveryCount = 0

  for (let i = 0; i < negativeEntries.length; i++) {
    const negEntry = negativeEntries[i]
    const negTime = new Date(negEntry.timestamp)

    // Find next positive entry
    const nextPositive = entries.find((e) => {
      const eTime = new Date(e.timestamp)
      const valence = e.valence !== undefined ? e.valence : getEmotionAxes(e.emotion).valence
      return eTime > negTime && valence > 0.3
    })

    if (nextPositive) {
      const posTime = new Date(nextPositive.timestamp)
      const hours = (posTime.getTime() - negTime.getTime()) / (1000 * 60 * 60)
      totalRecoveryHours += hours
      recoveryCount++
    }
  }

  return recoveryCount > 0 ? totalRecoveryHours / recoveryCount : 0
}

export function calculateInertiaWithWeekly(entries: EmotionEntry[]): {
  average: number
  lastWeek: number
  lastWeekFormatted: string
} {
  const avgInertia = calculateInertia(entries)

  // Calculate last 7 days
  const now = new Date()
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const lastWeekEntries = entries.filter((e) => new Date(e.timestamp) >= sevenDaysAgo)

  const lastWeekInertia = calculateInertia(lastWeekEntries)

  // Format as "Xh Ymin"
  const hours = Math.floor(lastWeekInertia)
  const minutes = Math.round((lastWeekInertia - hours) * 60)
  const lastWeekFormatted = `${hours}h ${minutes}min`

  return {
    average: avgInertia,
    lastWeek: lastWeekInertia,
    lastWeekFormatted,
  }
}

export function calculateDEAMScore(entries: EmotionEntry[], periodDays: number): { score: number; delta: number } {
  if (entries.length < 4) {
    return { score: 0, delta: 0 }
  }

  // Calculate submetrics (simplified for v1)
  // G: Granularity - measure emotion diversity
  const emotionSet = new Set(entries.map((e) => e.emotion))
  const G = Math.min(emotionSet.size / 10, 1) // Normalize by typical max

  // C: Coherence - measure intensity consistency
  const avgIntensity = entries.reduce((sum, e) => sum + e.intensity, 0) / entries.length
  const variance = entries.reduce((sum, e) => sum + Math.pow(e.intensity - avgIntensity, 2), 0) / entries.length
  const C = 1 - Math.min(Math.sqrt(variance), 1)

  // A: Adaptability - measure emotional range
  const valenceRange = Math.max(...entries.map((e) => e.valence || 0)) - Math.min(...entries.map((e) => e.valence || 0))
  const A = Math.min(valenceRange / 2, 1)

  // Ie: Inertia - already calculated
  const inertiaHours = calculateInertia(entries)
  const Ie = 1 - Math.min(1 - Math.exp(-inertiaHours / 6), 1)

  // P: Precision - measure regularity
  const P = Math.min(entries.length / periodDays, 1)

  // Combine with equal weights (v1.0)
  const wG = 0.2
  const wC = 0.2
  const wA = 0.2
  const wI = 0.2
  const wP = 0.2

  const scoreNorm = wG * G + wC * C + wA * A + wI * Ie + wP * P
  const score = Math.round(100 * Math.max(0, Math.min(1, scoreNorm)))

  // Mock delta for now (would need previous period calculation)
  const delta = Math.round(Math.random() * 30 - 5)

  return { score, delta }
}

export interface IntensityWellbeingData {
  meanIntensity: number
  meanWellbeing: number
  distributions: Array<{
    emotion: string
    intensity: number
    wellbeing: number
    color: string
  }>
  interpretationText: string
}

export function calculateIntensityWellbeing(entries: EmotionEntry[]): IntensityWellbeingData {
  if (entries.length === 0) {
    return {
      meanIntensity: 0,
      meanWellbeing: 50,
      distributions: [],
      interpretationText: "Aún no hay suficientes registros para ver tu patrón emocional.",
    }
  }

  // Transform entries to intensity/wellbeing scores
  const distributions = entries.map((entry) => {
    const intensityScore = Math.round((entry.intensity || 0) * 100)

    let valence = entry.valence
    if (valence === undefined) {
      valence = getEmotionAxes(entry.emotion).valence
    }
    const wellbeingScore = Math.round((valence + 1) * 50)

    // Determine color based on quadrant
    let color = "#94B22E" // green default
    const arousal = entry.arousal !== undefined ? entry.arousal : getEmotionAxes(entry.emotion).arousal

    if (arousal <= -0.15 && valence >= -0.15) {
      color = "#94B22E" // green - calm
    } else if (arousal <= -0.15 && valence < -0.15) {
      color = "#466D91" // blue - low mood
    } else if (arousal > -0.15 && valence >= -0.15) {
      color = "#E6B04F" // yellow - energetic
    } else {
      color = "#E6584F" // red - tense
    }

    return {
      emotion: entry.emotion,
      intensity: intensityScore,
      wellbeing: wellbeingScore,
      color,
    }
  })

  // Calculate means
  const meanIntensity = Math.round(distributions.reduce((sum, d) => sum + d.intensity, 0) / distributions.length)
  const meanWellbeing = Math.round(distributions.reduce((sum, d) => sum + d.wellbeing, 0) / distributions.length)

  // Generate interpretation text (neutral, descriptive)
  let interpretationText = "Tus emociones se mantienen estables en bienestar y con ligeros picos de intensidad."

  const intensityVariance =
    distributions.reduce((sum, d) => sum + Math.pow(d.intensity - meanIntensity, 2), 0) / distributions.length
  const wellbeingVariance =
    distributions.reduce((sum, d) => sum + Math.pow(d.wellbeing - meanWellbeing, 2), 0) / distributions.length

  if (intensityVariance > 400 && wellbeingVariance < 200) {
    interpretationText = "Tus emociones muestran variaciones en intensidad, manteniendo un bienestar estable."
  } else if (intensityVariance < 200 && wellbeingVariance > 400) {
    interpretationText = "Tus emociones presentan variaciones en bienestar, con intensidad relativamente constante."
  } else if (intensityVariance > 400 && wellbeingVariance > 400) {
    interpretationText = "Tus emociones muestran variabilidad tanto en intensidad como en bienestar."
  } else if (meanIntensity > 70) {
    interpretationText = "Tus emociones tienden a sentirse de forma intensa de manera general."
  } else if (meanIntensity < 30) {
    interpretationText = "Tus emociones tienden a ser suaves y de baja intensidad."
  }

  return {
    meanIntensity,
    meanWellbeing,
    distributions,
    interpretationText,
  }
}

export interface GranularityData {
  granularityNorm: number
  deltaPct: number
  trend: "up" | "down" | "stable"
  topEmotions: Array<{ label: string; count: number }>
  newEmotions: string[]
  families: Record<string, number>
  interpretationText: string
  trendBadgeText: string
}

export function calculateGranularity(currentEntries: EmotionEntry[], previousEntries: EmotionEntry[]): GranularityData {
  // Calculate granularity for current period
  const currentGranularity = calculateGranularityForPeriod(currentEntries)
  const previousGranularity = calculateGranularityForPeriod(previousEntries)

  // Calculate delta percentage
  const epsilon = 0.01
  const deltaPct =
    ((currentGranularity.norm - previousGranularity.norm) / Math.max(previousGranularity.norm, epsilon)) * 100

  // Determine trend
  let trend: "up" | "down" | "stable" = "stable"
  if (deltaPct >= 5) {
    trend = "up"
  } else if (deltaPct <= -5) {
    trend = "down"
  }

  // Get top emotions
  const emotionCounts = new Map<string, number>()
  currentEntries.forEach((entry) => {
    emotionCounts.set(entry.emotion, (emotionCounts.get(entry.emotion) || 0) + 1)
  })
  const topEmotions = Array.from(emotionCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([label, count]) => ({ label, count }))

  // Get new emotions (in current but not in previous)
  const previousEmotionSet = new Set(previousEntries.map((e) => e.emotion))
  const currentEmotionSet = new Set(currentEntries.map((e) => e.emotion))
  const newEmotions = Array.from(currentEmotionSet)
    .filter((emotion) => !previousEmotionSet.has(emotion))
    .slice(0, 6)

  // Calculate family distribution
  const familyCounts = new Map<string, number>()
  currentEntries.forEach((entry) => {
    const family = getEmotionFamily(entry.emotion)
    familyCounts.set(family, (familyCounts.get(family) || 0) + 1)
  })
  const total = currentEntries.length
  const families: Record<string, number> = {}
  familyCounts.forEach((count, family) => {
    families[family] = count / total
  })

  // Generate interpretation text
  let interpretationText =
    "Cada vez identificas mejor lo que sientes. Eso te da más adaptación y mejor regulación emocional."
  if (trend === "down") {
    interpretationText =
      "Tu vocabulario emocional es válido. Identificar con mayor precisión puede ayudarte a regularte mejor."
  } else if (trend === "stable") {
    interpretationText = "Tu capacidad para identificar emociones se mantiene estable y es funcional."
  }

  // Generate trend badge text
  const trendBadgeText = `${deltaPct >= 0 ? "+" : ""}${Math.round(deltaPct)}% variedad emocional funcional`

  return {
    granularityNorm: currentGranularity.norm,
    deltaPct: Math.round(deltaPct),
    trend,
    topEmotions,
    newEmotions,
    families,
    interpretationText,
    trendBadgeText,
  }
}

function calculateGranularityForPeriod(entries: EmotionEntry[]): { norm: number } {
  if (entries.length === 0) {
    return { norm: 0 }
  }

  // Count labels and families
  const labelCounts = new Map<string, number>()
  const familyCounts = new Map<string, number>()

  entries.forEach((entry) => {
    labelCounts.set(entry.emotion, (labelCounts.get(entry.emotion) || 0) + 1)
    const family = getEmotionFamily(entry.emotion)
    familyCounts.set(family, (familyCounts.get(family) || 0) + 1)
  })

  const total = entries.length

  // Calculate entropy for labels
  let H_labels = 0
  labelCounts.forEach((count) => {
    const p = count / total
    H_labels -= p * Math.log(p)
  })
  const Hmax_labels = Math.log(labelCounts.size)
  const Hn_labels = labelCounts.size > 1 ? H_labels / Hmax_labels : 0

  // Calculate entropy for families
  let H_fam = 0
  familyCounts.forEach((count) => {
    const p = count / total
    H_fam -= p * Math.log(p)
  })
  const Hmax_fam = Math.log(Math.max(familyCounts.size, 1))
  const Hn_fam = familyCounts.size > 1 ? H_fam / Hmax_fam : 0

  // Penalize repetition
  const labelCountsArray = Array.from(labelCounts.values())
  const p_top = Math.max(...labelCountsArray) / total
  const repeat_penalty = Math.max(0, Math.min(1, (p_top - 0.35) / (1 - 0.35)))

  // Calculate final granularity
  const G_norm = (0.6 * Hn_labels + 0.4 * Hn_fam) * (1 - 0.35 * repeat_penalty)

  return { norm: Math.max(0, Math.min(1, G_norm)) }
}

function getEmotionFamily(emotion: string): string {
  const axes = getEmotionAxes(emotion)
  const Tv = -0.15
  const Ta = -0.15

  if (axes.arousal <= Ta && axes.valence >= Tv) {
    return "calma"
  } else if (axes.arousal <= Ta && axes.valence < Tv) {
    return "tristeza"
  } else if (axes.arousal > Ta && axes.valence >= Tv) {
    return "energía"
  } else {
    return "tensión"
  }
}

export interface EmotionalAwarenessData {
  ceScore: number
  deltaPoints: number
  trend: "up" | "down" | "stable"
  subscores: {
    CC: number // Contextual Awareness
    CB: number // Body Awareness
    CT: number // Temporal Awareness
    MC: number // Meta-awareness
    CEe: number // Elaborative Awareness
  }
  insights: string[]
  interpretationText: string
  nCheckins: number
}

export function calculateEmotionalAwareness(
  currentEntries: any[],
  previousEntries: any[],
  periodDays: number,
): EmotionalAwarenessData {
  if (currentEntries.length === 0) {
    return {
      ceScore: 0,
      deltaPoints: 0,
      trend: "stable",
      subscores: { CC: 0, CB: 0, CT: 0, MC: 0, CEe: 0 },
      insights: [],
      interpretationText: "Aún no hay suficientes registros para calcular conciencia emocional.",
      nCheckins: 0,
    }
  }

  // Calculate subscores for current period
  let totalCC = 0
  let totalCB = 0
  let totalCT = 0
  let totalMC = 0
  let totalCEe = 0

  currentEntries.forEach((entry) => {
    // 1. Conciencia Contextual (CC) - 0-100
    let cc = 0
    const hasActivity = entry.activity_tags && entry.activity_tags.length > 0
    const hasCompany = entry.company_tags && entry.company_tags.length > 0
    const hasCustomActivity = entry.custom_activity && entry.custom_activity.trim().length > 0
    const hasCustomCompany = entry.custom_company && entry.custom_company.trim().length > 0
    const hasContextText = entry.notes && entry.notes.trim().length > 0

    if (hasActivity || hasCustomActivity) cc += 40
    if (hasCompany || hasCustomCompany) cc += 40
    if (hasContextText) cc += 20

    totalCC += cc

    // 2. Conciencia Corporal (CB) - 0-100
    let cb = 0
    const bodyLocations = entry.body_location || []
    const nBodyParts = bodyLocations.length
    const hasBodyText = hasContextText // Assuming notes can describe body sensations

    if (nBodyParts === 0) cb = 0
    else if (nBodyParts === 1) cb = hasBodyText ? 100 : 70
    else if (nBodyParts >= 2) cb = hasBodyText ? 100 : 85

    totalCB += cb

    // 3. Conciencia Temporal (CT) - 0-100
    let ct = 60 // Default if no time reference
    const timeRef = entry.when_occurred || ""

    if (timeRef.includes("Ahora mismo") || timeRef.includes("Hace 1-2h")) ct = 100
    else if (timeRef.includes("Hace 24h")) ct = 80
    else if (timeRef.includes("Hace +3 días") || timeRef.includes("Hace +1 mes")) ct = 60
    else if (timeRef.includes("No ha pasado")) ct = 40

    totalCT += ct

    // 4. Metaconciencia (MC) - 0-100
    let mc = 60 // Default
    const certainty = entry.certainty_bucket || ""

    if (certainty.includes("70-100%")) mc = 100
    else if (certainty.includes("50-70%")) mc = 80
    else if (certainty.includes("20-50%")) mc = 60
    else if (certainty.includes("5-20%")) mc = 40
    else if (certainty.includes("0-5%")) mc = 20
    else if (certainty.includes("No lo sé")) mc = 30

    totalMC += mc

    // 5. Conciencia Elaborativa (CEe) - 0-100
    let cee = 0
    if (hasContextText) {
      const textLength = entry.notes.trim().length
      if (textLength < 20) cee = 50
      else if (textLength >= 20 && textLength < 100) cee = 75
      else cee = 100
    }

    totalCEe += cee
  })

  // Calculate average subscores
  const n = currentEntries.length
  const CC = Math.round(totalCC / n)
  const CB = Math.round(totalCB / n)
  const CT = Math.round(totalCT / n)
  const MC = Math.round(totalMC / n)
  const CEe = Math.round(totalCEe / n)

  // Calculate total CE score (0-100) with weighted formula
  const ceScore = Math.round(0.25 * CC + 0.2 * CB + 0.2 * CT + 0.25 * MC + 0.1 * CEe)

  // Calculate previous period score
  let previousCEScore = 0
  if (previousEntries.length > 0) {
    let prevTotalCC = 0,
      prevTotalCB = 0,
      prevTotalCT = 0,
      prevTotalMC = 0,
      prevTotalCEe = 0

    previousEntries.forEach((entry) => {
      // Same calculation for previous period
      let cc = 0
      const hasActivity = entry.activity_tags && entry.activity_tags.length > 0
      const hasCompany = entry.company_tags && entry.company_tags.length > 0
      const hasCustomActivity = entry.custom_activity && entry.custom_activity.trim().length > 0
      const hasCustomCompany = entry.custom_company && entry.custom_company.trim().length > 0
      const hasContextText = entry.notes && entry.notes.trim().length > 0

      if (hasActivity || hasCustomActivity) cc += 40
      if (hasCompany || hasCustomCompany) cc += 40
      if (hasContextText) cc += 20

      prevTotalCC += cc

      let cb = 0
      const bodyLocations = entry.body_location || []
      const nBodyParts = bodyLocations.length
      if (nBodyParts === 0) cb = 0
      else if (nBodyParts === 1) cb = hasContextText ? 100 : 70
      else if (nBodyParts >= 2) cb = hasContextText ? 100 : 85

      prevTotalCB += cb

      let ct = 60
      const timeRef = entry.when_occurred || ""
      if (timeRef.includes("Ahora mismo") || timeRef.includes("Hace 1-2h")) ct = 100
      else if (timeRef.includes("Hace 24h")) ct = 80
      else if (timeRef.includes("Hace +3 días") || timeRef.includes("Hace +1 mes")) ct = 60
      else if (timeRef.includes("No ha pasado")) ct = 40

      prevTotalCT += ct

      let mc = 60
      const certainty = entry.certainty_bucket || ""
      if (certainty.includes("70-100%")) mc = 100
      else if (certainty.includes("50-70%")) mc = 80
      else if (certainty.includes("20-50%")) mc = 60
      else if (certainty.includes("5-20%")) mc = 40
      else if (certainty.includes("0-5%")) mc = 20
      else if (certainty.includes("No lo sé")) mc = 30

      prevTotalMC += mc

      let cee = 0
      if (hasContextText) {
        const textLength = entry.notes.trim().length
        if (textLength < 20) cee = 50
        else if (textLength >= 20 && textLength < 100) cee = 75
        else cee = 100
      }

      prevTotalCEe += cee
    })

    const prevN = previousEntries.length
    const prevCC = Math.round(prevTotalCC / prevN)
    const prevCB = Math.round(prevTotalCB / prevN)
    const prevCT = Math.round(prevTotalCT / prevN)
    const prevMC = Math.round(prevTotalMC / prevN)
    const prevCEe = Math.round(prevTotalCEe / prevN)

    previousCEScore = Math.round(0.25 * prevCC + 0.2 * prevCB + 0.2 * prevCT + 0.25 * prevMC + 0.1 * prevCEe)
  }

  // Calculate delta and trend
  const deltaPoints = ceScore - previousCEScore
  let trend: "up" | "down" | "stable" = "stable"
  if (deltaPoints >= 5) trend = "up"
  else if (deltaPoints <= -5) trend = "down"

  // Generate insights
  const insights: string[] = []

  // Insight 1: Body awareness correlation
  const withBody = currentEntries.filter((e) => e.body_location && e.body_location.length > 0)
  const withoutBody = currentEntries.filter((e) => !e.body_location || e.body_location.length === 0)

  if (withBody.length >= 3 && withoutBody.length >= 3) {
    const avgCertaintyWithBody =
      withBody.reduce((sum, e) => {
        const cert = e.certainty_bucket || ""
        if (cert.includes("70-100%")) return sum + 100
        if (cert.includes("50-70%")) return sum + 80
        return sum + 60
      }, 0) / withBody.length

    const avgCertaintyWithoutBody =
      withoutBody.reduce((sum, e) => {
        const cert = e.certainty_bucket || ""
        if (cert.includes("70-100%")) return sum + 100
        if (cert.includes("50-70%")) return sum + 80
        return sum + 60
      }, 0) / withoutBody.length

    if (avgCertaintyWithBody > avgCertaintyWithoutBody + 10) {
      insights.push("Cuando indicas el cuerpo, tu seguridad suele aumentar.")
    }
  }

  // Generate interpretation text
  let interpretationText = ""
  if (ceScore >= 75) {
    interpretationText = "Estás ubicando muy bien lo que sientes y cuándo aparece."
  } else if (ceScore >= 60) {
    interpretationText = "Identificas bien tus emociones en la mayoría de contextos."
  } else if (ceScore >= 40) {
    interpretationText = "Cuando registras emociones intensas, la claridad suele ser un poco menor."
  } else {
    interpretationText = "Aún estás desarrollando tu capacidad para situar emociones."
  }

  return {
    ceScore,
    deltaPoints,
    trend,
    subscores: { CC, CB, CT, MC, CEe },
    insights,
    interpretationText,
    nCheckins: currentEntries.length,
  }
}

// Custom hook for IEQ data fetching and calculation
"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase/client"
import { getEmotionAxes } from "@/lib/emotion-mapping"
import {
  calculateEmotionalState,
  calculateDEAMScore,
  calculateInertiaWithWeekly,
  calculateEmotionalAwareness,
  type EmotionEntry,
  type EmotionalStateResult,
  type EmotionalAwarenessData,
} from "@/lib/ieq-calculator"

export type TimePeriod = "today" | "3d" | "7d" | "30d" | "60d"

export interface IEQData {
  emotionalState: EmotionalStateResult | null
  deamScore: number
  deamTrend: number
  inertia: number
  inertiaTrend: string
  emotionalAwarenessData: EmotionalAwarenessData
  currentEntries: EmotionEntry[]
  previousEntries: EmotionEntry[]
  emotionPoints: Array<{
    emotion: string
    wellbeing: number
    intensity: number
    color: string
    timestamp: string
  }>
  averageIntensity: number
  averageWellbeing: number
  granularityData: {
    score: number
    deltaPercent: number
    trend: "up" | "down" | "stable"
    topEmotions: Array<{ emotion: string; count: number }>
    newEmotions: Array<{ emotion: string; count: number }> // Updated to include count
    totalEmotions: number
  }
  loading: boolean
  error: Error | null
}

function getEmotionColor(valence: number, arousal: number): string {
  if (arousal >= 0 && valence >= 0) return "#FFD95A" // Yellow - Con energía
  if (arousal >= 0 && valence < 0) return "#FF6B82" // Red - En tensión
  if (arousal < 0 && valence >= 0) return "#7FBA7A" // Green - En calma
  return "#7BA5DD" // Blue - Sin ánimo
}

function calculateGranularity(
  currentEntries: EmotionEntry[],
  previousEntries: EmotionEntry[],
): {
  score: number
  deltaPercent: number
  trend: "up" | "down" | "stable"
  topEmotions: Array<{ emotion: string; count: number }>
  newEmotions: Array<{ emotion: string; count: number }> // Updated to include count
  totalEmotions: number
} {
  if (currentEntries.length === 0) {
    return {
      score: 0,
      deltaPercent: 0,
      trend: "stable",
      topEmotions: [],
      newEmotions: [],
      totalEmotions: 0,
    }
  }

  // Count emotions in current period
  const emotionCounts = new Map<string, number>()
  currentEntries.forEach((entry) => {
    const count = emotionCounts.get(entry.emotion) || 0
    emotionCounts.set(entry.emotion, count + 1)
  })

  // Calculate entropy (normalized)
  const total = currentEntries.length
  let entropy = 0
  emotionCounts.forEach((count) => {
    const p = count / total
    entropy -= p * Math.log(p)
  })
  const maxEntropy = Math.log(emotionCounts.size)
  const normalizedEntropy = maxEntropy > 0 ? entropy / maxEntropy : 0

  // Penalize repetition
  const maxCount = Math.max(...Array.from(emotionCounts.values()))
  const topRatio = maxCount / total
  const repeatPenalty = Math.max(0, Math.min(1, (topRatio - 0.35) / 0.65))

  // Final granularity score (0-100)
  const granularityScore = Math.round(normalizedEntropy * (1 - 0.35 * repeatPenalty) * 100)

  // Calculate previous period score
  let previousScore = 0
  if (previousEntries.length > 0) {
    const prevCounts = new Map<string, number>()
    previousEntries.forEach((entry) => {
      const count = prevCounts.get(entry.emotion) || 0
      prevCounts.set(entry.emotion, count + 1)
    })

    const prevTotal = previousEntries.length
    let prevEntropy = 0
    prevCounts.forEach((count) => {
      const p = count / prevTotal
      prevEntropy -= p * Math.log(p)
    })
    const prevMaxEntropy = Math.log(prevCounts.size)
    const prevNormalizedEntropy = prevMaxEntropy > 0 ? prevEntropy / prevMaxEntropy : 0

    const prevMaxCount = Math.max(...Array.from(prevCounts.values()))
    const prevTopRatio = prevMaxCount / prevTotal
    const prevRepeatPenalty = Math.max(0, Math.min(1, (prevTopRatio - 0.35) / 0.65))

    previousScore = Math.round(prevNormalizedEntropy * (1 - 0.35 * prevRepeatPenalty) * 100)
  }

  // Calculate trend
  const deltaPercent = previousScore > 0 ? Math.round(((granularityScore - previousScore) / previousScore) * 100) : 0
  let trend: "up" | "down" | "stable" = "stable"
  if (deltaPercent >= 5) trend = "up"
  else if (deltaPercent <= -5) trend = "down"

  // Get top emotions
  const topEmotions = Array.from(emotionCounts.entries())
    .map(([emotion, count]) => ({ emotion, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8)

  // Find new emotions (in current but not in previous)
  const previousEmotions = new Set(previousEntries.map((e) => e.emotion))
  const newEmotions = Array.from(new Set(currentEntries.map((e) => e.emotion)))
    .filter((emotion) => !previousEmotions.has(emotion))
    .map((emotion) => ({
      emotion,
      count: emotionCounts.get(emotion) || 0,
    }))
    .sort((a, b) => b.count - a.count)

  return {
    score: granularityScore,
    deltaPercent,
    trend,
    topEmotions,
    newEmotions,
    totalEmotions: emotionCounts.size,
  }
}

export function useIEQData(userId?: string, period: TimePeriod = "7d"): IEQData {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [currentEntries, setCurrentEntries] = useState<EmotionEntry[]>([])
  const [previousEntries, setPreviousEntries] = useState<EmotionEntry[]>([])

  // Computed states
  const [emotionalState, setEmotionalState] = useState<EmotionalStateResult | null>(null)
  const [deamScore, setDeamScore] = useState(0)
  const [deamTrend, setDeamTrend] = useState(0)
  const [inertia, setInertia] = useState(0)
  const [inertiaTrend, setInertiaTrend] = useState("0h 0min")
  const [emotionalAwarenessData, setEmotionalAwarenessData] = useState<EmotionalAwarenessData>({
    ceScore: 0,
    deltaPoints: 0,
    trend: "stable",
    subscores: { CC: 0, CB: 0, CT: 0, MC: 0, CEe: 0 },
    insights: [],
    interpretationText: "Aún no hay suficientes registros.",
    nCheckins: 0,
  })

  const [emotionPoints, setEmotionPoints] = useState<
    Array<{
      emotion: string
      wellbeing: number
      intensity: number
      color: string
      timestamp: string
    }>
  >([])
  const [averageIntensity, setAverageIntensity] = useState(0)
  const [averageWellbeing, setAverageWellbeing] = useState(0)
  const [granularityData, setGranularityData] = useState({
    score: 0,
    deltaPercent: 0,
    trend: "stable" as "up" | "down" | "stable",
    topEmotions: [] as Array<{ emotion: string; count: number }>,
    newEmotions: [] as Array<{ emotion: string; count: number }>, // Updated type
    totalEmotions: 0,
  })

  const getPeriodDays = () => {
    switch (period) {
      case "today":
        return 1
      case "3d":
        return 3
      case "7d":
        return 7
      case "30d":
        return 30
      case "60d":
        return 60
      default:
        return 7
    }
  }

  useEffect(() => {
    async function loadIEQData() {
      if (!userId) {
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)

      try {
        const now = new Date()
        const periodDays = getPeriodDays()
        const startDate = new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000)
        const previousStartDate = new Date(startDate.getTime() - periodDays * 24 * 60 * 60 * 1000)

        // Fetch current period entries
        const { data: entries, error: entriesError } = await supabase
          .from("emotion_entries")
          .select("*")
          .eq("user_id", userId)
          .gte("created_at", startDate.toISOString())
          .lte("created_at", now.toISOString())
          .order("created_at", { ascending: true })

        if (entriesError) throw entriesError

        // Fetch previous period entries
        const { data: prevEntries } = await supabase
          .from("emotion_entries")
          .select("*")
          .eq("user_id", userId)
          .gte("created_at", previousStartDate.toISOString())
          .lt("created_at", startDate.toISOString())
          .order("created_at", { ascending: true })

        // Transform entries
        const transformedEntries: EmotionEntry[] = (entries || []).map((entry) => {
          const axes = getEmotionAxes(entry.emotion)
          return {
            timestamp: entry.created_at,
            emotion: entry.emotion,
            intensity: entry.intensity / 100,
            valence: axes.valence,
            arousal: axes.arousal,
            confidence: 0.7,
            activity_context: (entry.activity_tags && entry.activity_tags.length > 0) || !!entry.custom_activity,
            social_context: (entry.company_tags && entry.company_tags.length > 0) || !!entry.custom_company,
            free_text: entry.notes,
            body_signals: entry.body_location,
            time_reference: entry.when_occurred,
            certainty_bucket: entry.certainty_bucket,
          }
        })

        const transformedPreviousEntries: EmotionEntry[] = (prevEntries || []).map((entry) => {
          const axes = getEmotionAxes(entry.emotion)
          return {
            timestamp: entry.created_at,
            emotion: entry.emotion,
            intensity: entry.intensity / 100,
            valence: axes.valence,
            arousal: axes.arousal,
            confidence: 0.7,
            activity_context: (entry.activity_tags && entry.activity_tags.length > 0) || !!entry.custom_activity,
            social_context: (entry.company_tags && entry.company_tags.length > 0) || !!entry.custom_company,
            free_text: entry.notes,
            body_signals: entry.body_location,
            time_reference: entry.when_occurred,
            certainty_bucket: entry.certainty_bucket,
          }
        })

        setCurrentEntries(transformedEntries)
        setPreviousEntries(transformedPreviousEntries)

        if (entries && entries.length > 0) {
          const points = entries.map((entry) => {
            const axes = getEmotionAxes(entry.emotion)
            return {
              emotion: entry.emotion,
              wellbeing: entry.wellbeing || 50,
              intensity: entry.intensity || 50, // ENERGÍA 0-100
              color: getEmotionColor(axes.valence, axes.arousal),
              timestamp: entry.created_at,
            }
          })
          setEmotionPoints(points)

          const avgIntensity = Math.round(points.reduce((sum, p) => sum + p.intensity, 0) / points.length)
          const avgWellbeing = Math.round(points.reduce((sum, p) => sum + p.wellbeing, 0) / points.length)
          setAverageIntensity(avgIntensity)
          setAverageWellbeing(avgWellbeing)
        }

        // Calculate all metrics
        if (transformedEntries.length > 0) {
          const state = calculateEmotionalState(transformedEntries, periodDays)
          setEmotionalState(state)

          const deam = calculateDEAMScore(transformedEntries, periodDays)
          setDeamScore(deam.score)
          setDeamTrend(deam.delta)

          const inertiaData = calculateInertiaWithWeekly(transformedEntries)
          setInertia(inertiaData.average)
          setInertiaTrend(inertiaData.lastWeekFormatted)

          const emotionalAwareness = calculateEmotionalAwareness(entries || [], prevEntries || [], periodDays)
          setEmotionalAwarenessData(emotionalAwareness)

          const granularity = calculateGranularity(transformedEntries, transformedPreviousEntries)
          setGranularityData(granularity)
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Error loading IEQ data"))
      } finally {
        setLoading(false)
      }
    }

    loadIEQData()
  }, [userId, period])

  return {
    emotionalState,
    deamScore,
    deamTrend,
    inertia,
    inertiaTrend,
    emotionalAwarenessData,
    currentEntries,
    previousEntries,
    emotionPoints,
    averageIntensity,
    averageWellbeing,
    granularityData, // Added granularity data to return
    loading,
    error,
  }
}

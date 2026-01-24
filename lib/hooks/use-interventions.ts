"use client"

import { useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import type { InterventionType, InterventionLog } from "@/lib/types/telemetry"

export function useInterventions(userId: string | null, sessionId: string | null) {
  const supabase = createClient()
  const [currentIntervention, setCurrentIntervention] = useState<InterventionLog | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Start an intervention
  const startIntervention = useCallback(
    async (
      type: InterventionType,
      emotionEntryId: string | null,
      intensityBefore: number | null
    ): Promise<string | null> => {
      if (!userId) return null

      setIsLoading(true)

      const { data, error } = await supabase
        .from("interventions_log")
        .insert({
          user_id: userId,
          session_id: sessionId,
          emotion_entry_id: emotionEntryId,
          intervention_type: type,
          started_at: new Date().toISOString(),
          intensity_before: intensityBefore,
          skipped: false,
        })
        .select()
        .single()

      setIsLoading(false)

      if (error) {
        return null
      }

      setCurrentIntervention(data)
      return data.id
    },
    [userId, sessionId, supabase]
  )

  // Complete an intervention
  const completeIntervention = useCallback(
    async (
      interventionId: string,
      intensityAfter: number | null,
      perceivedUtility: number | null
    ) => {
      if (!userId) return false

      setIsLoading(true)

      const intervention = currentIntervention
      const startedAt = intervention?.started_at
        ? new Date(intervention.started_at)
        : new Date()

      const durationSeconds = Math.floor((Date.now() - startedAt.getTime()) / 1000)

      const { error } = await supabase
        .from("interventions_log")
        .update({
          completed_at: new Date().toISOString(),
          duration_seconds: durationSeconds,
          intensity_after: intensityAfter,
          perceived_utility: perceivedUtility,
          skipped: false,
        })
        .eq("id", interventionId)

      setIsLoading(false)
      setCurrentIntervention(null)

      return !error
    },
    [userId, currentIntervention, supabase]
  )

  // Skip an intervention
  const skipIntervention = useCallback(
    async (interventionId: string, reason: string | null) => {
      if (!userId) return false

      setIsLoading(true)

      const { error } = await supabase
        .from("interventions_log")
        .update({
          skipped: true,
          skip_reason: reason,
        })
        .eq("id", interventionId)

      setIsLoading(false)
      setCurrentIntervention(null)

      return !error
    },
    [userId, supabase]
  )

  // Get user's intervention history
  const getInterventionHistory = useCallback(
    async (limit = 20) => {
      if (!userId) return []

      const { data, error } = await supabase
        .from("interventions_log")
        .select("*")
        .eq("user_id", userId)
        .order("started_at", { ascending: false })
        .limit(limit)

      if (error) {
        return []
      }

      return data as InterventionLog[]
    },
    [userId, supabase]
  )

  // Get intervention stats
  const getInterventionStats = useCallback(async () => {
    if (!userId) return null

    const { data, error } = await supabase
      .from("interventions_log")
      .select("*")
      .eq("user_id", userId)
      .eq("skipped", false)
      .not("completed_at", "is", null)

    if (error || !data) {
      return null
    }

    // Calculate stats
    const totalCompleted = data.length
    const avgUtility =
      data.filter((i) => i.perceived_utility).reduce((sum, i) => sum + (i.perceived_utility || 0), 0) /
        (data.filter((i) => i.perceived_utility).length || 1)

    // Calculate avg intensity delta
    const withDelta = data.filter((i) => i.intensity_before !== null && i.intensity_after !== null)
    const avgDelta =
      withDelta.reduce((sum, i) => sum + ((i.intensity_before || 0) - (i.intensity_after || 0)), 0) /
      (withDelta.length || 1)

    // Most effective intervention type
    const byType: Record<string, { count: number; totalDelta: number }> = {}
    for (const i of withDelta) {
      const type = i.intervention_type
      if (!byType[type]) {
        byType[type] = { count: 0, totalDelta: 0 }
      }
      byType[type].count++
      byType[type].totalDelta += (i.intensity_before || 0) - (i.intensity_after || 0)
    }

    let mostEffective: string | null = null
    let maxAvgDelta = 0
    for (const [type, stats] of Object.entries(byType)) {
      const avgD = stats.totalDelta / stats.count
      if (avgD > maxAvgDelta) {
        maxAvgDelta = avgD
        mostEffective = type
      }
    }

    return {
      totalCompleted,
      avgUtility: Math.round(avgUtility * 10) / 10,
      avgIntensityReduction: Math.round(avgDelta * 10) / 10,
      mostEffectiveType: mostEffective,
    }
  }, [userId, supabase])

  return {
    currentIntervention,
    isLoading,
    startIntervention,
    completeIntervention,
    skipIntervention,
    getInterventionHistory,
    getInterventionStats,
  }
}

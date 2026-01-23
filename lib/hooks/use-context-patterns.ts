"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase/client"

export interface ContextPattern {
  label: string
  count: number
  percentage: number
  type: "negative" | "positive"
  impact: string
  avgIntensity: number
}

export function useContextPatterns(userId: string) {
  const [patterns, setPatterns] = useState<ContextPattern[]>([])
  const [aiInsight, setAiInsight] = useState<string>("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchPatterns() {
      if (!userId) return

      try {
        const { data: entries, error } = await supabase
          .from("emotion_entries")
          .select("context, activity_tags, company_tags, intensity, wellbeing, arousal, created_at")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(100)

        if (error) throw error

        const contextCounts = new Map<string, { count: number; totalIntensity: number; totalArousal: number }>()

        entries?.forEach((entry) => {
          const contexts = [entry.context, ...(entry.activity_tags || []), ...(entry.company_tags || [])].filter(
            Boolean,
          )

          contexts.forEach((ctx) => {
            const existing = contextCounts.get(ctx) || { count: 0, totalIntensity: 0, totalArousal: 0 }
            contextCounts.set(ctx, {
              count: existing.count + 1,
              totalIntensity: existing.totalIntensity + (entry.intensity || 50),
              totalArousal: existing.totalArousal + (entry.arousal || 0.5),
            })
          })
        })

        const totalEntries = entries?.length || 1
        const patternsArray: ContextPattern[] = []

        contextCounts.forEach((data, label) => {
          const percentage = Math.round((data.count / totalEntries) * 100)
          const avgIntensity = data.totalIntensity / data.count
          const avgArousal = data.totalArousal / data.count

          // Determine if negative or positive based on arousal (tension)
          const type = avgArousal > 0.6 ? "negative" : "positive"
          const impact = type === "negative" ? `${Math.round(avgIntensity)}% intensidad` : `+bienestar`

          patternsArray.push({
            label,
            count: data.count,
            percentage,
            type,
            impact,
            avgIntensity,
          })
        })

        const topPatterns = patternsArray.sort((a, b) => b.count - a.count).slice(0, 8)

        setPatterns(topPatterns)

        if (topPatterns.length > 0) {
          const response = await fetch("/api/ai/context-insights", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ patterns: topPatterns }),
          })

          const { insight } = await response.json()
          setAiInsight(insight)
        }
      } catch {
        // Silent fail - patterns are non-critical
      } finally {
        setLoading(false)
      }
    }

    fetchPatterns()
  }, [userId])

  return { patterns, aiInsight, loading }
}

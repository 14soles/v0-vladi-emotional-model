// Enhanced hook for check-in with Zustand integration
"use client"

import { useCallback } from "react"
import { supabase } from "@/lib/supabase/client"
import { useVladiActions } from "@/lib/vladi-store"
import type { EmotionData } from "./use-emotion-selector"

export interface CheckInData {
  emotion: EmotionData
  intensity: number
  context?: string
  contextText?: string
  bodySignals?: string[]
  timeReference?: string
  certainty?: string
  activityContext?: boolean
  socialContext?: boolean
}

export function useVladiCheckIn(userId?: string) {
  const { addEntry } = useVladiActions()

  const saveCheckIn = useCallback(
    async (data: CheckInData) => {
      if (!userId) {
        throw new Error("User ID is required")
      }

      try {
        // Save to Supabase
        const { data: entry, error } = await supabase
          .from("emotion_entries")
          .insert({
            user_id: userId,
            emotion: data.emotion.emotion,
            intensity: data.intensity,
            valence: data.emotion.valence,
            arousal: data.emotion.energy / 100,
            context: data.context,
            free_text: data.contextText,
            body_signals: data.bodySignals,
            time_reference: data.timeReference,
            certainty_bucket: data.certainty,
            activity_context: data.activityContext,
            social_context: data.socialContext,
            created_at: new Date().toISOString(),
          })
          .select()
          .single()

        if (error) throw error

        // Update local store
        addEntry({
          id: entry.id,
          timestamp: entry.created_at,
          emotion: data.emotion.emotion,
          quadrant: data.emotion.quadrant,
          valence: data.emotion.valence,
          energy: data.emotion.energy,
          pleasantness: data.emotion.pleasantness,
          intensity_before: data.intensity,
          intensity_after: null,
          text: data.contextText || "",
          contextTags: data.context ? [data.context] : [],
          context: data.context,
          privacy: "all",
        })

        return entry
      } catch (error) {
        throw error
      }
    },
    [userId, addEntry],
  )

  return { saveCheckIn }
}

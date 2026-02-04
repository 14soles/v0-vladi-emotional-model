// Enhanced hook for check-in with Zustand integration
"use client"

import { useCallback } from "react"
import { supabase } from "@/lib/supabase/client"
import { useVladiActions } from "@/lib/vladi-store"
import type { EmotionData } from "./use-emotion-selector"

import type { OnsetBucket, PhysicalState, PhysicalFlag } from "./use-check-in-flow"

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
  // Nuevos campos DEAM EQ v2
  onsetBucket?: OnsetBucket
  onsetEstimatedMinutes?: number
  physicalState?: PhysicalState
  physicalFlags?: PhysicalFlag[]
}

// Helper to get current location
async function getCurrentLocation(precision: "approximate" | "precise"): Promise<{
  latitude: number
  longitude: number
  accuracy: number
} | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null)
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        let { latitude, longitude, accuracy } = position.coords
        
        // If approximate precision, round coordinates (about 1km precision)
        if (precision === "approximate") {
          latitude = Math.round(latitude * 100) / 100
          longitude = Math.round(longitude * 100) / 100
        }
        
        resolve({ latitude, longitude, accuracy })
      },
      () => {
        resolve(null)
      },
      {
        enableHighAccuracy: precision === "precise",
        timeout: 5000,
        maximumAge: precision === "precise" ? 0 : 60000
      }
    )
  })
}

export function useVladiCheckIn(userId?: string) {
  const { addEntry } = useVladiActions()

  const saveCheckIn = useCallback(
    async (data: CheckInData) => {
      if (!userId) {
        throw new Error("User ID is required")
      }

      try {
        // Save to Supabase with new DEAM EQ v2 fields
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
            // Nuevos campos DEAM EQ v2
            onset_bucket: data.onsetBucket,
            onset_estimated_minutes: data.onsetEstimatedMinutes,
            physical_state: data.physicalState,
            physical_flags: data.physicalFlags,
            created_at: new Date().toISOString(),
          })
          .select()
          .single()

        if (error) throw error

        // Check if user has share_location enabled and create emotional ping
        const { data: profile } = await supabase
          .from("profiles")
          .select("share_location, location_precision")
          .eq("id", userId)
          .single()

        if (profile?.share_location) {
          const location = await getCurrentLocation(profile.location_precision || "approximate")
          
          if (location) {
            // Create emotional ping for radar
            await supabase
              .from("emotional_pings")
              .insert({
                user_id: userId,
                latitude: location.latitude,
                longitude: location.longitude,
                accuracy_meters: location.accuracy,
                emotion: data.emotion.emotion,
                quadrant: data.emotion.quadrant,
                intensity: data.intensity,
                emotion_entry_id: entry.id,
              })
          }
        }

        // Update local store with new fields
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
          // Nuevos campos DEAM EQ v2
          onset_bucket: data.onsetBucket,
          onset_estimated_minutes: data.onsetEstimatedMinutes,
          physical_state: data.physicalState,
          physical_flags: data.physicalFlags,
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

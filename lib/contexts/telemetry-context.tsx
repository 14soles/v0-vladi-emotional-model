"use client"

import { createContext, useContext, useCallback, useState, type ReactNode } from "react"
import { useAppSession } from "@/lib/hooks/use-app-session"
import { useInterventions } from "@/lib/hooks/use-interventions"
import { processNewEmotionEntry } from "@/lib/services/emotion-episodes"
import type { EventType, InterventionDefinition, InterventionType } from "@/lib/types/telemetry"

interface TelemetryContextType {
  // Session tracking
  sessionId: string | null
  trackEvent: (eventType: EventType, eventData: Record<string, unknown>, screenName?: string) => Promise<void>
  trackScreen: (screenName: string) => void

  // Interventions
  startIntervention: (
    type: InterventionType,
    emotionEntryId: string | null,
    intensityBefore: number | null
  ) => Promise<string | null>
  completeIntervention: (
    interventionId: string,
    intensityAfter: number | null,
    perceivedUtility: number | null
  ) => Promise<boolean>
  skipIntervention: (interventionId: string, reason: string | null) => Promise<boolean>
  currentIntervention: any

  // Emotion entry processing
  onEmotionRegistered: (entryId: string) => Promise<void>

  // UI state for interventions
  showInterventionPicker: boolean
  setShowInterventionPicker: (show: boolean) => void
  pendingEmotionContext: {
    entryId: string | null
    emotionFamily: string
    intensity: number
  } | null
  setPendingEmotionContext: (context: {
    entryId: string | null
    emotionFamily: string
    intensity: number
  } | null) => void
}

const TelemetryContext = createContext<TelemetryContextType | null>(null)

interface TelemetryProviderProps {
  children: ReactNode
  userId: string | null
}

export function TelemetryProvider({ children, userId }: TelemetryProviderProps) {
  const session = useAppSession(userId)
  const interventions = useInterventions(userId, session.sessionId)

  const [showInterventionPicker, setShowInterventionPicker] = useState(false)
  const [pendingEmotionContext, setPendingEmotionContext] = useState<{
    entryId: string | null
    emotionFamily: string
    intensity: number
  } | null>(null)

  // Process new emotion entry and potentially trigger intervention suggestion
  const onEmotionRegistered = useCallback(
    async (entryId: string) => {
      if (!userId) return

      // Track event
      await session.trackEvent("emotion_complete", { entry_id: entryId })
      session.incrementEmotions()

      // Process episode grouping in background
      processNewEmotionEntry(userId, entryId).catch(() => {
        // Silently fail episode processing
      })
    },
    [userId, session]
  )

  const value: TelemetryContextType = {
    sessionId: session.sessionId,
    trackEvent: session.trackEvent,
    trackScreen: session.trackScreen,

    startIntervention: interventions.startIntervention,
    completeIntervention: interventions.completeIntervention,
    skipIntervention: interventions.skipIntervention,
    currentIntervention: interventions.currentIntervention,

    onEmotionRegistered,

    showInterventionPicker,
    setShowInterventionPicker,
    pendingEmotionContext,
    setPendingEmotionContext,
  }

  return <TelemetryContext.Provider value={value}>{children}</TelemetryContext.Provider>
}

export function useTelemetry() {
  const context = useContext(TelemetryContext)
  if (!context) {
    throw new Error("useTelemetry must be used within a TelemetryProvider")
  }
  return context
}

// Hook for suggesting interventions based on emotion
export function useSuggestIntervention() {
  const telemetry = useTelemetry()

  const suggestIntervention = useCallback(
    (emotionFamily: string, intensity: number, entryId: string | null = null) => {
      // Only suggest interventions for high-intensity negative emotions
      const shouldSuggest =
        intensity >= 60 && (emotionFamily === "en tensión" || emotionFamily === "sin ánimo")

      if (shouldSuggest) {
        telemetry.setPendingEmotionContext({
          entryId,
          emotionFamily,
          intensity,
        })
        telemetry.setShowInterventionPicker(true)
      }
    },
    [telemetry]
  )

  return { suggestIntervention }
}

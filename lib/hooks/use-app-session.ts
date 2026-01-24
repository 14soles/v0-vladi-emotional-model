"use client"

import { useEffect, useRef, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import type { EventType } from "@/lib/types/telemetry"

const SESSION_KEY = "vladi_current_session_id"

export function useAppSession(userId: string | null) {
  const supabase = createClient()
  const sessionIdRef = useRef<string | null>(null)
  const screensVisitedRef = useRef<Set<string>>(new Set())
  const emotionsCountRef = useRef(0)
  const chatCountRef = useRef(0)
  const interventionsCountRef = useRef(0)

  // Start session when user logs in
  const startSession = useCallback(async () => {
    if (!userId) return null

    // Check if there's an existing session in localStorage
    const existingSessionId = localStorage.getItem(SESSION_KEY)
    if (existingSessionId) {
      sessionIdRef.current = existingSessionId
      return existingSessionId
    }

    // Create new session
    const { data, error } = await supabase
      .from("app_sessions")
      .insert({
        user_id: userId,
        started_at: new Date().toISOString(),
        screens_visited: [],
        emotions_registered: 0,
        chat_interactions: 0,
        interventions_completed: 0,
        platform: typeof navigator !== "undefined" ? navigator.userAgent : null,
        app_version: "1.0.0",
      })
      .select("id")
      .single()

    if (error) {
      return null
    }

    sessionIdRef.current = data.id
    localStorage.setItem(SESSION_KEY, data.id)

    // Track app_open event
    await trackEvent("app_open", {})

    return data.id
  }, [userId, supabase])

  // End session
  const endSession = useCallback(async () => {
    const sessionId = sessionIdRef.current
    if (!sessionId || !userId) return

    const startedAt = await supabase
      .from("app_sessions")
      .select("started_at")
      .eq("id", sessionId)
      .single()

    const duration = startedAt.data
      ? Math.floor((Date.now() - new Date(startedAt.data.started_at).getTime()) / 1000)
      : null

    await supabase
      .from("app_sessions")
      .update({
        ended_at: new Date().toISOString(),
        duration_seconds: duration,
        screens_visited: Array.from(screensVisitedRef.current),
        emotions_registered: emotionsCountRef.current,
        chat_interactions: chatCountRef.current,
        interventions_completed: interventionsCountRef.current,
      })
      .eq("id", sessionId)

    // Track app_close event
    await trackEvent("app_close", { duration_seconds: duration })

    // Clear session
    localStorage.removeItem(SESSION_KEY)
    sessionIdRef.current = null
    screensVisitedRef.current.clear()
    emotionsCountRef.current = 0
    chatCountRef.current = 0
    interventionsCountRef.current = 0
  }, [userId, supabase])

  // Track event
  const trackEvent = useCallback(
    async (eventType: EventType, eventData: Record<string, unknown>, screenName?: string) => {
      if (!userId) return

      const sessionId = sessionIdRef.current

      await supabase.from("user_events").insert({
        user_id: userId,
        session_id: sessionId,
        event_type: eventType,
        event_data: eventData,
        screen_name: screenName || null,
        timestamp: new Date().toISOString(),
      })

      // Update counters
      if (eventType === "emotion_complete") {
        emotionsCountRef.current++
      } else if (eventType === "chat_message" || eventType === "chat_start") {
        chatCountRef.current++
      } else if (eventType === "intervention_complete") {
        interventionsCountRef.current++
      }
    },
    [userId, supabase]
  )

  // Track screen visit
  const trackScreen = useCallback(
    (screenName: string) => {
      screensVisitedRef.current.add(screenName)
      trackEvent("app_foreground", { screen: screenName }, screenName)
    },
    [trackEvent]
  )

  // Increment emotion count
  const incrementEmotions = useCallback(() => {
    emotionsCountRef.current++
  }, [])

  // Increment chat count
  const incrementChat = useCallback(() => {
    chatCountRef.current++
  }, [])

  // Increment interventions count
  const incrementInterventions = useCallback(() => {
    interventionsCountRef.current++
  }, [])

  // Handle visibility change (app goes to background/foreground)
  useEffect(() => {
    if (!userId) return

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        trackEvent("app_background", {})
      } else {
        trackEvent("app_foreground", {})
      }
    }

    // Handle before unload (closing tab/browser)
    const handleBeforeUnload = () => {
      // Use sendBeacon for reliable delivery
      const sessionId = sessionIdRef.current
      if (sessionId) {
        navigator.sendBeacon(
          "/api/telemetry/end-session",
          JSON.stringify({
            session_id: sessionId,
            user_id: userId,
            screens_visited: Array.from(screensVisitedRef.current),
            emotions_registered: emotionsCountRef.current,
            chat_interactions: chatCountRef.current,
            interventions_completed: interventionsCountRef.current,
          })
        )
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)
    window.addEventListener("beforeunload", handleBeforeUnload)

    // Start session on mount
    startSession()

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      window.removeEventListener("beforeunload", handleBeforeUnload)
    }
  }, [userId, startSession, trackEvent])

  return {
    sessionId: sessionIdRef.current,
    trackEvent,
    trackScreen,
    incrementEmotions,
    incrementChat,
    incrementInterventions,
    endSession,
  }
}

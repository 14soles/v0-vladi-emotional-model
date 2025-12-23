// Hook for check-in flow state management
"use client"

import { useState, useCallback } from "react"
import { useVladiStore } from "@/lib/vladi-store"
import { useVladiCheckIn } from "./use-vladi-check-in"
import type { Emotion, ContextCategory } from "@/lib/vladi-types"

export type CheckInStep = "emotion" | "intensity" | "context" | "summary" | "intervention" | "complete"

export interface CheckInState {
  selectedEmotion: Emotion | null
  intensity: number
  context: ContextCategory | null
  contextText: string
  interventionDelta: number | null
}

export function useCheckInFlow(userId?: string) {
  const [step, setStep] = useState<CheckInStep>("emotion")
  const [state, setState] = useState<CheckInState>({
    selectedEmotion: null,
    intensity: 5,
    context: null,
    contextText: "",
    interventionDelta: null,
  })

  const { startCheckIn, updateCheckIn } = useVladiStore()
  const { saveCheckIn } = useVladiCheckIn(userId)

  const steps: CheckInStep[] = ["emotion", "intensity", "context", "summary"]
  const currentStepIndex = steps.indexOf(step)

  const canProceed = useCallback(() => {
    switch (step) {
      case "emotion":
        return state.selectedEmotion !== null
      case "intensity":
        return state.intensity >= 1 && state.intensity <= 10
      case "context":
        return true
      case "summary":
        return true
      default:
        return false
    }
  }, [step, state])

  const setEmotion = useCallback((emotion: Emotion | null) => {
    setState((prev) => ({ ...prev, selectedEmotion: emotion }))
  }, [])

  const setIntensity = useCallback((intensity: number) => {
    setState((prev) => ({ ...prev, intensity }))
  }, [])

  const setContext = useCallback((context: ContextCategory | null) => {
    setState((prev) => ({ ...prev, context }))
  }, [])

  const setContextText = useCallback((text: string) => {
    setState((prev) => ({ ...prev, contextText: text }))
  }, [])

  const setInterventionDelta = useCallback((delta: number | null) => {
    setState((prev) => ({ ...prev, interventionDelta: delta }))
  }, [])

  const nextStep = useCallback(() => {
    if (step === "summary") {
      startCheckIn()
      updateCheckIn({
        valence: state.selectedEmotion?.valence || "neutral",
        emotionLabelBefore: state.selectedEmotion?.label,
        intensityBefore: state.intensity,
        contextCategory: state.context || "otro",
        contextText: state.contextText || undefined,
      })
      setStep("complete")

      // Offer intervention if intensity is high and negative
      if (state.intensity >= 6 && state.selectedEmotion?.valence === "negative") {
        setStep("intervention")
      }
      return
    }

    const nextIndex = currentStepIndex + 1
    if (nextIndex < steps.length) {
      setStep(steps[nextIndex])
    }
  }, [step, currentStepIndex, steps, state, startCheckIn, updateCheckIn])

  const previousStep = useCallback(() => {
    const prevIndex = currentStepIndex - 1
    if (prevIndex >= 0) {
      setStep(steps[prevIndex])
    }
  }, [currentStepIndex, steps])

  const goToStep = useCallback((newStep: CheckInStep) => {
    setStep(newStep)
  }, [])

  const reset = useCallback(() => {
    setStep("emotion")
    setState({
      selectedEmotion: null,
      intensity: 5,
      context: null,
      contextText: "",
      interventionDelta: null,
    })
  }, [])

  const completeCheckIn = useCallback(async () => {
    if (!state.selectedEmotion) return

    try {
      await saveCheckIn({
        emotion: {
          emotion: state.selectedEmotion.label,
          quadrant: "green" as any,
          energy: 50,
          pleasantness: 50,
          description: "",
          valence:
            state.selectedEmotion.valence === "positive" ? 1 : state.selectedEmotion.valence === "negative" ? -1 : 0,
          intensity: state.intensity,
        },
        intensity: state.intensity,
        context: state.context || undefined,
        contextText: state.contextText || undefined,
      })
    } catch (error) {
      throw error
    }
  }, [state, saveCheckIn])

  return {
    step,
    state,
    steps,
    currentStepIndex,
    canProceed,
    setEmotion,
    setIntensity,
    setContext,
    setContextText,
    setInterventionDelta,
    nextStep,
    previousStep,
    goToStep,
    reset,
    completeCheckIn,
  }
}

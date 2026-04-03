"use client"

import { useState, useEffect, useCallback } from "react"
import { X, ChevronRight, Check, Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface ToolItem {
  id: string
  stimulus_url: string
  correct_label: string
  options: string[]
  emotion_family: string
  difficulty: number
  is_anchor_item: boolean
}

interface Answer {
  itemId: string
  selectedOption: string
  isCorrect: boolean
  responseTimeMs: number
}

interface PonleNombreToolProps {
  userId: string
  mode: "training" | "assessment"
  onClose: () => void
  onComplete: (sessionId: string, score: number, totalItems: number) => void
}

type ToolState = "intro" | "loading" | "playing" | "feedback" | "results"

export function PonleNombreTool({ userId, mode, onClose, onComplete }: PonleNombreToolProps) {
  const [state, setState] = useState<ToolState>("intro")
  const [items, setItems] = useState<ToolItem[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Answer[]>([])
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [showFeedback, setShowFeedback] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [itemStartTime, setItemStartTime] = useState<number>(0)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  // Fetch items when starting
  const startSession = useCallback(async () => {
    setState("loading")
    setError(null)

    try {
      // Determine number of items based on mode
      const numItems = mode === "training" ? 5 : 10
      const numAnchorItems = mode === "assessment" ? 4 : 0

      // Fetch recent items to avoid repetition
      const { data: recentSessions } = await supabase
        .from("tool_sessions")
        .select("id")
        .eq("user_id", userId)
        .eq("tool_type", "ponle_nombre")
        .order("created_at", { ascending: false })
        .limit(3)

      const recentSessionIds = recentSessions?.map((s) => s.id) || []

      let recentItemIds: string[] = []
      if (recentSessionIds.length > 0) {
        const { data: recentAnswers } = await supabase
          .from("tool_answers")
          .select("item_id")
          .in("session_id", recentSessionIds)

        recentItemIds = recentAnswers?.map((a) => a.item_id) || []
      }

      // Fetch anchor items if assessment mode
      let anchorItems: ToolItem[] = []
      if (numAnchorItems > 0) {
        const { data: anchors, error: anchorError } = await supabase
          .from("tool_items")
          .select("*")
          .eq("tool_type", "ponle_nombre")
          .eq("is_anchor_item", true)
          .eq("is_active", true)
          .limit(numAnchorItems)

        if (anchorError) throw anchorError
        anchorItems = (anchors || []).map((item) => ({
          id: item.id,
          stimulus_url: item.stimulus_url,
          correct_label: item.correct_label,
          options: item.options,
          emotion_family: item.emotion_family,
          difficulty: item.difficulty,
          is_anchor_item: item.is_anchor_item,
        }))
      }

      // Fetch regular items avoiding recent ones
      const remainingCount = numItems - anchorItems.length
      let query = supabase
        .from("tool_items")
        .select("*")
        .eq("tool_type", "ponle_nombre")
        .eq("is_active", true)

      if (recentItemIds.length > 0) {
        query = query.not("id", "in", `(${recentItemIds.join(",")})`)
      }

      // Balance by difficulty for training
      if (mode === "training") {
        query = query.order("difficulty", { ascending: true })
      }

      const { data: regularItems, error: regularError } = await query.limit(remainingCount * 2) // Fetch extra for randomization

      if (regularError) throw regularError

      // Shuffle and pick items
      const shuffledRegular = (regularItems || [])
        .sort(() => Math.random() - 0.5)
        .slice(0, remainingCount)
        .map((item) => ({
          id: item.id,
          stimulus_url: item.stimulus_url,
          correct_label: item.correct_label,
          options: item.options,
          emotion_family: item.emotion_family,
          difficulty: item.difficulty,
          is_anchor_item: item.is_anchor_item,
        }))

      // Combine and shuffle all items
      const allItems = [...anchorItems, ...shuffledRegular].sort(() => Math.random() - 0.5)

      if (allItems.length === 0) {
        setError("No hay ítems disponibles. Inténtalo más tarde.")
        setState("intro")
        return
      }

      // Create session
      const { data: session, error: sessionError } = await supabase
        .from("tool_sessions")
        .insert({
          user_id: userId,
          tool_type: "ponle_nombre",
          mode,
          started_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (sessionError) throw sessionError

      setSessionId(session.id)
      setItems(allItems)
      setCurrentIndex(0)
      setAnswers([])
      setItemStartTime(Date.now())
      setState("playing")
    } catch (err) {
      console.error("Error starting session:", err)
      setError("Error al iniciar la sesión. Inténtalo de nuevo.")
      setState("intro")
    }
  }, [userId, mode, supabase])

  // Handle option selection
  const handleSelectOption = async (option: string) => {
    if (selectedOption !== null) return // Already selected

    const currentItem = items[currentIndex]
    const responseTime = Date.now() - itemStartTime
    const isCorrect = option === currentItem.correct_label

    setSelectedOption(option)

    const answer: Answer = {
      itemId: currentItem.id,
      selectedOption: option,
      isCorrect,
      responseTimeMs: responseTime,
    }

    setAnswers((prev) => [...prev, answer])

    // Save answer to database
    if (sessionId) {
      await supabase.from("tool_answers").insert({
        session_id: sessionId,
        item_id: currentItem.id,
        selected_option: option,
        is_correct: isCorrect,
        response_time_ms: responseTime,
      })

      // Update item stats
      await supabase.rpc("update_tool_item_stats", {
        p_item_id: currentItem.id,
        p_user_id: userId,
        p_is_correct: isCorrect,
      })
    }

    // Show feedback in training mode
    if (mode === "training") {
      setShowFeedback(true)
    } else {
      // Auto-advance in assessment mode
      setTimeout(() => goToNext(), 800)
    }
  }

  // Go to next item
  const goToNext = () => {
    setSelectedOption(null)
    setShowFeedback(false)

    if (currentIndex + 1 >= items.length) {
      // Session complete
      finishSession()
    } else {
      setCurrentIndex((prev) => prev + 1)
      setItemStartTime(Date.now())
    }
  }

  // Finish session
  const finishSession = async () => {
    setState("results")

    const correctCount = answers.filter((a) => a.isCorrect).length
    const score = Math.round((correctCount / items.length) * 100)

    if (sessionId) {
      // Update session with results
      await supabase
        .from("tool_sessions")
        .update({
          completed_at: new Date().toISOString(),
          score,
          total_items: items.length,
          correct_count: correctCount,
        })
        .eq("id", sessionId)
    }

    // Notify parent after a delay
    setTimeout(() => {
      onComplete(sessionId || "", score, items.length)
    }, 3000)
  }

  // Shuffle options for current item
  const getShuffledOptions = (item: ToolItem) => {
    return [...item.options].sort(() => Math.random() - 0.5)
  }

  const currentItem = items[currentIndex]
  const correctCount = answers.filter((a) => a.isCorrect).length

  // Intro screen
  if (state === "intro") {
    return (
      <div className="fixed inset-0 bg-background z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 shrink-0">
          <button
            onClick={onClose}
            className="p-2 -ml-2 hover:bg-muted rounded-full transition-colors touch-manipulation"
          >
            <X className="w-5 h-5 text-foreground" />
          </button>
          <div className="w-9" />
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          <div className="w-24 h-24 bg-teal-400 rounded-full flex items-center justify-center mb-6">
            <svg viewBox="0 0 48 48" className="w-16 h-16 text-white" fill="currentColor">
              <circle cx="24" cy="24" r="20" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.3"/>
              <circle cx="16" cy="20" r="2.5"/>
              <circle cx="32" cy="20" r="2.5"/>
              <line x1="16" y1="32" x2="32" y2="32" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
          </div>

          <h1 className="text-2xl font-bold text-foreground mb-3">
            Ponle nombre a lo que sientes
          </h1>

          <p className="text-muted-foreground mb-8 max-w-sm">
            {mode === "training"
              ? "Practica identificando emociones en rostros. Verás 5 imágenes y tendrás que elegir qué emoción representan."
              : "Evalúa tu capacidad para reconocer emociones. Responderás a 10 preguntas sin recibir feedback inmediato."}
          </p>

          {error && (
            <p className="text-red-500 text-sm mb-4">{error}</p>
          )}

          <button
            onClick={startSession}
            className="bg-foreground text-background font-medium px-8 py-3 rounded-full hover:opacity-90 transition-opacity touch-manipulation"
          >
            Comenzar
          </button>

          <p className="text-xs text-muted-foreground mt-4">
            {mode === "training" ? "~3 minutos" : "~5 minutos"}
          </p>
        </div>
      </div>
    )
  }

  // Loading screen
  if (state === "loading") {
    return (
      <div className="fixed inset-0 bg-background z-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          <p className="text-muted-foreground">Preparando ejercicio...</p>
        </div>
      </div>
    )
  }

  // Results screen
  if (state === "results") {
    const score = Math.round((correctCount / items.length) * 100)
    const message =
      score >= 80
        ? "¡Excelente! Tienes un gran vocabulario emocional."
        : score >= 60
          ? "¡Bien hecho! Sigue practicando para mejorar."
          : "Buen intento. La práctica te ayudará a mejorar."

    return (
      <div className="fixed inset-0 bg-background z-50 flex flex-col items-center justify-center px-6 text-center">
        <div className="w-20 h-20 bg-teal-400 rounded-full flex items-center justify-center mb-6">
          <Check className="w-10 h-10 text-white" />
        </div>

        <h1 className="text-2xl font-bold text-foreground mb-2">
          ¡Sesión completada!
        </h1>

        <p className="text-4xl font-bold text-teal-500 mb-2">
          {score}%
        </p>

        <p className="text-muted-foreground mb-2">
          {correctCount} de {items.length} correctas
        </p>

        <p className="text-foreground mb-8 max-w-sm">
          {message}
        </p>

        <button
          onClick={onClose}
          className="bg-foreground text-background font-medium px-8 py-3 rounded-full hover:opacity-90 transition-opacity touch-manipulation"
        >
          Continuar
        </button>
      </div>
    )
  }

  // Playing screen
  if (!currentItem) return null

  const shuffledOptions = getShuffledOptions(currentItem)

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col">
      {/* Header with progress */}
      <div className="px-4 py-3 shrink-0">
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={onClose}
            className="p-2 -ml-2 hover:bg-muted rounded-full transition-colors touch-manipulation"
          >
            <X className="w-5 h-5 text-foreground" />
          </button>
          <span className="text-sm text-muted-foreground">
            {currentIndex + 1} / {items.length}
          </span>
          <div className="w-9" />
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-teal-400 transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / items.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center px-4 py-6">
        {/* Question */}
        <h2 className="text-lg font-medium text-foreground mb-6 text-center">
          ¿Qué emoción expresa este rostro?
        </h2>

        {/* Image */}
        <div className="w-48 h-48 sm:w-56 sm:h-56 rounded-3xl overflow-hidden mb-8 bg-muted">
          <img
            src={currentItem.stimulus_url}
            alt="Rostro expresando una emoción"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Options */}
        <div className="w-full max-w-sm space-y-3">
          {shuffledOptions.map((option) => {
            const isSelected = selectedOption === option
            const isCorrect = option === currentItem.correct_label
            const showCorrectness = showFeedback || (selectedOption !== null && mode === "assessment")

            let bgColor = "bg-muted hover:bg-muted/80"
            let textColor = "text-foreground"
            let borderColor = "border-transparent"

            if (showCorrectness && isCorrect) {
              bgColor = "bg-green-100"
              textColor = "text-green-800"
              borderColor = "border-green-500"
            } else if (showCorrectness && isSelected && !isCorrect) {
              bgColor = "bg-red-100"
              textColor = "text-red-800"
              borderColor = "border-red-500"
            } else if (isSelected) {
              bgColor = "bg-teal-100"
              borderColor = "border-teal-500"
            }

            return (
              <button
                key={option}
                onClick={() => handleSelectOption(option)}
                disabled={selectedOption !== null}
                className={`w-full py-3 px-4 rounded-xl border-2 ${bgColor} ${textColor} ${borderColor} font-medium transition-all touch-manipulation ${selectedOption === null ? "active:scale-[0.98]" : ""}`}
              >
                {option}
              </button>
            )
          })}
        </div>

        {/* Feedback in training mode */}
        {showFeedback && (
          <div className="mt-6 w-full max-w-sm">
            <div className={`p-4 rounded-xl ${selectedOption === currentItem.correct_label ? "bg-green-50 border border-green-200" : "bg-amber-50 border border-amber-200"}`}>
              <p className={`text-sm font-medium ${selectedOption === currentItem.correct_label ? "text-green-800" : "text-amber-800"}`}>
                {selectedOption === currentItem.correct_label
                  ? "¡Correcto! Has identificado bien la emoción."
                  : `La respuesta correcta era: ${currentItem.correct_label}`}
              </p>
            </div>

            <button
              onClick={goToNext}
              className="mt-4 w-full bg-foreground text-background font-medium py-3 rounded-full flex items-center justify-center gap-2 hover:opacity-90 transition-opacity touch-manipulation"
            >
              {currentIndex + 1 >= items.length ? "Ver resultados" : "Siguiente"}
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

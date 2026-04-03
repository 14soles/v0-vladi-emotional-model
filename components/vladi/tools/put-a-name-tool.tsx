"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { X } from "lucide-react"
import { 
  selectItems, 
  randomizeOptions, 
  type PutANameItem,
} from "@/lib/tools/put-a-name"
import { supabase } from "@/lib/supabase/client"

interface PutANameToolProps {
  userId?: string
  mode?: "training" | "assessment"
  onClose: () => void
  onComplete?: (results: SessionResults) => void
}

interface SessionResults {
  totalItems: number
  correctAnswers: number
  accuracyScore: number
  totalTimeMs: number
  emotionBreakdown: Record<string, { correct: number; total: number }>
}

interface ItemState {
  item: PutANameItem
  shuffledOptions: string[]
  correctIndex: number
  selectedIndex: number | null
  isCorrect: boolean | null
  responseTimeMs: number | null
  shownAt: string
}

type ScreenState = "intro" | "question" | "result"

export function PutANameTool({
  userId,
  mode = "training",
  onClose,
  onComplete,
}: PutANameToolProps) {
  const [screen, setScreen] = useState<ScreenState>("intro")
  const [items, setItems] = useState<ItemState[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [sessionId, setSessionId] = useState<string>("")
  const [sessionStartTime, setSessionStartTime] = useState<number>(0)
  const questionStartTimeRef = useRef<number>(0)

  // Initialize session
  const initializeSession = useCallback(() => {
    const selectedItems = selectItems(mode)
    const itemStates: ItemState[] = selectedItems.map(item => {
      const { options, correctIndex } = randomizeOptions(item)
      return {
        item,
        shuffledOptions: options,
        correctIndex,
        selectedIndex: null,
        isCorrect: null,
        responseTimeMs: null,
        shownAt: new Date().toISOString(),
      }
    })
    
    setItems(itemStates)
    setCurrentIndex(0)
    setSessionId(crypto.randomUUID())
    setSessionStartTime(Date.now())
    setScreen("question")
    questionStartTimeRef.current = Date.now()
  }, [mode])

  // Handle option selection
  const handleSelectOption = useCallback((optionIndex: number) => {
    if (items[currentIndex].selectedIndex !== null) return // Already answered

    const responseTime = Date.now() - questionStartTimeRef.current
    const isCorrect = optionIndex === items[currentIndex].correctIndex

    setItems(prev => {
      const updated = [...prev]
      updated[currentIndex] = {
        ...updated[currentIndex],
        selectedIndex: optionIndex,
        isCorrect,
        responseTimeMs: responseTime,
      }
      return updated
    })
  }, [currentIndex, items])

  // Handle next question
  const handleNext = useCallback(() => {
    if (currentIndex < items.length - 1) {
      setCurrentIndex(prev => prev + 1)
      questionStartTimeRef.current = Date.now()
      
      // Update shownAt for next item
      setItems(prev => {
        const updated = [...prev]
        updated[currentIndex + 1] = {
          ...updated[currentIndex + 1],
          shownAt: new Date().toISOString(),
        }
        return updated
      })
    } else {
      // Session complete
      setScreen("result")
    }
  }, [currentIndex, items.length])

  // Calculate results
  const calculateResults = useCallback((): SessionResults => {
    const correctAnswers = items.filter(i => i.isCorrect).length
    const totalTimeMs = Date.now() - sessionStartTime
    
    // Group by emotion (correct_option)
    const emotionBreakdown: Record<string, { correct: number; total: number }> = {}
    items.forEach(itemState => {
      const emotion = itemState.item.correct_option
      if (!emotionBreakdown[emotion]) {
        emotionBreakdown[emotion] = { correct: 0, total: 0 }
      }
      emotionBreakdown[emotion].total++
      if (itemState.isCorrect) {
        emotionBreakdown[emotion].correct++
      }
    })

    return {
      totalItems: items.length,
      correctAnswers,
      accuracyScore: Math.round((correctAnswers / items.length) * 100),
      totalTimeMs,
      emotionBreakdown,
    }
  }, [items, sessionStartTime])

  // Save session to database
  const saveSession = useCallback(async () => {
    if (!userId) return

    const results = calculateResults()
    
    try {
      // Save session
      await supabase.from("tool_sessions").insert({
        id: sessionId,
        profile_id: userId,
        tool_code: "put_a_name_v1",
        mode,
        started_at: new Date(sessionStartTime).toISOString(),
        completed_at: new Date().toISOString(),
        items_presented_count: items.length,
        items_answered_count: items.filter(i => i.selectedIndex !== null).length,
        total_time_ms: results.totalTimeMs,
        accuracy_score_100: results.accuracyScore,
        is_completed: true,
      })

      // Save individual answers
      const answers = items.map((itemState, index) => ({
        id: crypto.randomUUID(),
        session_id: sessionId,
        profile_id: userId,
        item_id: itemState.item.id,
        tool_code: "put_a_name_v1",
        domain: itemState.item.domain,
        subdomain: itemState.item.subdomain,
        context_tag: itemState.item.context_tag,
        difficulty: itemState.item.difficulty,
        selected_option: itemState.selectedIndex !== null 
          ? itemState.shuffledOptions[itemState.selectedIndex] 
          : null,
        correct_option: itemState.item.correct_option,
        is_correct: itemState.isCorrect,
        raw_score: itemState.isCorrect ? 1 : 0,
        response_time_ms: itemState.responseTimeMs,
        shown_at: itemState.shownAt,
        answered_at: new Date().toISOString(),
        presented_order: index + 1,
      }))

      await supabase.from("tool_answers").insert(answers)

      if (onComplete) {
        onComplete(results)
      }
    } catch (error) {
      console.error("Error saving tool session:", error)
    }
  }, [userId, sessionId, mode, sessionStartTime, items, calculateResults, onComplete])

  // Save when reaching result screen
  useEffect(() => {
    if (screen === "result" && userId) {
      saveSession()
    }
  }, [screen, userId, saveSession])

  const currentItem = items[currentIndex]
  const results = screen === "result" ? calculateResults() : null

  // Intro screen
  if (screen === "intro") {
    return (
      <div className="fixed inset-0 bg-background z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4">
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-muted transition-colors touch-manipulation"
          >
            <X className="w-6 h-6 text-foreground" />
          </button>
          <div />
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          {/* Icon */}
          <div className="w-24 h-24 rounded-full bg-red-100 flex items-center justify-center mb-6">
            <svg className="w-14 h-14 text-red-500" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="12" r="10" fillOpacity="0.2" />
              <circle cx="8" cy="10" r="1.5" />
              <circle cx="16" cy="10" r="1.5" />
              <path d="M8 15c0 0 2 2 4 2s4-2 4-2" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
            </svg>
          </div>

          <h1 className="text-2xl font-semibold text-foreground mb-3">
            Ponle nombre
          </h1>
          
          <p className="text-muted-foreground mb-2">
            Afina tu manera de reconocer emociones
          </p>
          
          <p className="text-sm text-muted-foreground max-w-xs leading-relaxed mb-8">
            Lee la situación y elige la emoción que mejor encaja. No busques la perfecta; elige la más probable.
          </p>

          {/* Info badges */}
          <div className="flex gap-4 mb-10">
            <div className="bg-muted px-4 py-2 rounded-full">
              <span className="text-sm text-muted-foreground">
                {mode === "training" ? "5 retos" : "8-12 retos"}
              </span>
            </div>
            <div className="bg-muted px-4 py-2 rounded-full">
              <span className="text-sm text-muted-foreground">
                {mode === "training" ? "~30 seg" : "~2 min"}
              </span>
            </div>
          </div>

          {/* Start button */}
          <button
            onClick={initializeSession}
            className="w-full max-w-xs bg-foreground text-background py-4 rounded-full font-medium text-lg transition-all active:scale-[0.98] touch-manipulation"
          >
            Empezar
          </button>
        </div>
      </div>
    )
  }

  // Question screen
  if (screen === "question" && currentItem) {
    const hasAnswered = currentItem.selectedIndex !== null
    const showFeedback = mode === "training" && hasAnswered

    return (
      <div className="fixed inset-0 bg-background z-50 flex flex-col">
        {/* Header - matches Vladi app style */}
        <div className="flex items-center justify-between px-4 py-3">
          {/* Logo */}
          <div className="flex items-center gap-1.5">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L15 8L22 9L17 14L18 21L12 18L6 21L7 14L2 9L9 8L12 2Z" fill="#EF4444"/>
              <path d="M12 6L13.5 9L17 9.5L14.5 12L15 15.5L12 14L9 15.5L9.5 12L7 9.5L10.5 9L12 6Z" fill="#22C55E"/>
              <path d="M12 8L12.75 9.5L14.5 9.75L13.25 11L13.5 12.75L12 12L10.5 12.75L10.75 11L9.5 9.75L11.25 9.5L12 8Z" fill="#3B82F6"/>
              <path d="M12 9L12.375 9.75L13.25 9.875L12.625 10.5L12.75 11.375L12 11L11.25 11.375L11.375 10.5L10.75 9.875L11.625 9.75L12 9Z" fill="#FBBF24"/>
            </svg>
            <span className="text-base font-semibold text-foreground">Vladi</span>
          </div>
          
          {/* Progress indicator */}
          <div className="text-sm font-medium text-foreground">
            {currentIndex + 1}/{items.length}
          </div>
          
          {/* Finalizar link */}
          <button
            onClick={onClose}
            className="text-sm font-medium text-foreground hover:text-muted-foreground transition-colors touch-manipulation"
          >
            Finalizar
          </button>
        </div>

        {/* Progress bar */}
        <div className="px-4 pt-2 pb-8">
          <div className="h-1 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-foreground transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / items.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Question content */}
        <div className="flex-1 flex flex-col px-6">
          {/* Prompt text - centered and clean */}
          <div className="flex-1 flex items-start justify-center pt-8">
            <p className="text-foreground text-center text-lg leading-relaxed max-w-sm">
              {currentItem.item.prompt}
            </p>
          </div>

          {/* Options - pill style with selection circles */}
          <div className="flex flex-col gap-3 pb-6">
            {currentItem.shuffledOptions.map((option, index) => {
              const isSelected = currentItem.selectedIndex === index
              const isCorrectOption = index === currentItem.correctIndex
              
              // Determine circle and border styles
              let borderStyle = "border-muted"
              let circleContent = (
                <div className="w-6 h-6 rounded-full border-2 border-muted" />
              )
              
              if (hasAnswered && showFeedback) {
                if (isCorrectOption) {
                  borderStyle = "border-green-500"
                  circleContent = (
                    <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )
                } else if (isSelected && !currentItem.isCorrect) {
                  borderStyle = "border-red-500"
                  circleContent = (
                    <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </div>
                  )
                }
              } else if (isSelected) {
                borderStyle = "border-foreground"
                circleContent = (
                  <div className="w-6 h-6 rounded-full bg-foreground flex items-center justify-center">
                    <svg className="w-4 h-4 text-background" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )
              }

              return (
                <button
                  key={index}
                  onClick={() => handleSelectOption(index)}
                  disabled={hasAnswered}
                  className={`
                    w-full py-4 px-5 rounded-full bg-background border-2 text-left
                    transition-all duration-200 touch-manipulation
                    flex items-center justify-between
                    ${borderStyle}
                    ${!hasAnswered ? "active:scale-[0.98]" : ""}
                  `}
                >
                  <span className="text-foreground font-medium">{option}</span>
                  {circleContent}
                </button>
              )
            })}
          </div>

          {/* Next button and back link */}
          <div className="pb-8">
            <button
              onClick={handleNext}
              disabled={!hasAnswered}
              className={`
                w-full py-4 rounded-full font-medium text-base
                transition-all touch-manipulation
                ${hasAnswered 
                  ? "bg-foreground text-background active:scale-[0.98]" 
                  : "bg-muted text-muted-foreground cursor-not-allowed"
                }
              `}
            >
              Siguiente
            </button>
            
            <button
              onClick={() => {
                if (currentIndex > 0) {
                  setCurrentIndex(prev => prev - 1)
                } else {
                  setScreen("intro")
                }
              }}
              className="w-full py-3 text-sm text-muted-foreground hover:text-foreground transition-colors touch-manipulation"
            >
              Volver atrás
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Result screen
  if (screen === "result" && results) {
    // Find most confused emotions (lowest accuracy)
    const emotionAccuracies = Object.entries(results.emotionBreakdown)
      .map(([emotion, data]) => ({
        emotion,
        accuracy: data.total > 0 ? data.correct / data.total : 0,
        total: data.total,
      }))
      .sort((a, b) => a.accuracy - b.accuracy)

    const weakEmotions = emotionAccuracies.filter(e => e.accuracy < 1 && e.total > 0).slice(0, 2)
    const strongEmotions = emotionAccuracies.filter(e => e.accuracy === 1 && e.total > 0).slice(0, 2)

    return (
      <div className="fixed inset-0 bg-background z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4">
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-muted transition-colors touch-manipulation"
          >
            <X className="w-6 h-6 text-foreground" />
          </button>
          <div />
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col items-center px-6 pt-8 pb-6 overflow-y-auto">
          {/* Score circle */}
          <div className="relative w-32 h-32 mb-6">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="64"
                cy="64"
                r="56"
                strokeWidth="8"
                stroke="currentColor"
                className="text-muted"
                fill="none"
              />
              <circle
                cx="64"
                cy="64"
                r="56"
                strokeWidth="8"
                stroke="currentColor"
                className={results.accuracyScore >= 70 ? "text-green-500" : results.accuracyScore >= 50 ? "text-amber-500" : "text-red-500"}
                fill="none"
                strokeLinecap="round"
                strokeDasharray={`${(results.accuracyScore / 100) * 352} 352`}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold text-foreground">{results.accuracyScore}%</span>
              <span className="text-xs text-muted-foreground">precisión</span>
            </div>
          </div>

          <h2 className="text-xl font-semibold text-foreground mb-2">
            {results.accuracyScore >= 80 
              ? "Excelente trabajo" 
              : results.accuracyScore >= 60 
                ? "Buen trabajo" 
                : "Sigue practicando"}
          </h2>
          
          <p className="text-muted-foreground text-center mb-8">
            Has acertado {results.correctAnswers} de {results.totalItems} emociones
          </p>

          {/* Feedback cards */}
          <div className="w-full space-y-4 mb-8">
            {strongEmotions.length > 0 && (
              <div className="bg-green-50 rounded-2xl p-4">
                <h4 className="font-medium text-green-800 mb-1">Emociones que dominas</h4>
                <p className="text-sm text-green-700">
                  {strongEmotions.map(e => e.emotion).join(", ")}
                </p>
              </div>
            )}

            {weakEmotions.length > 0 && (
              <div className="bg-amber-50 rounded-2xl p-4">
                <h4 className="font-medium text-amber-800 mb-1">Emociones a practicar</h4>
                <p className="text-sm text-amber-700">
                  {weakEmotions.map(e => e.emotion).join(", ")}
                </p>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="w-full space-y-3 mt-auto">
            <button
              onClick={initializeSession}
              className="w-full bg-foreground text-background py-4 rounded-full font-medium transition-all active:scale-[0.98] touch-manipulation"
            >
              Hacer otra sesión
            </button>
            
            <button
              onClick={onClose}
              className="w-full bg-muted text-foreground py-4 rounded-full font-medium transition-all active:scale-[0.98] touch-manipulation"
            >
              Volver
            </button>
          </div>
        </div>
      </div>
    )
  }

  return null
}

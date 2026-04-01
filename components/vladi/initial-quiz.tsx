"use client"

import { useState, useEffect, useCallback } from "react"
import { X, Play, Check } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

// Demo questions - will be replaced with real questions from the user
const DEMO_QUESTIONS = [
  {
    id: "q1",
    type: "video" as const,
    domain: "recognition" as const,
    title: "RECONOCIMIENTO EMOCIONAL",
    videoUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop", // Placeholder image
    options: ["Ansiedad", "Orgullo", "Ternura", "Calma"],
    correctAnswer: "Ansiedad",
  },
  {
    id: "q2",
    type: "scenario" as const,
    domain: "comprehension" as const,
    title: 'MISIÓN — "Ponle nombre"',
    scenario:
      '"Llevabas días esperando una respuesta importante. Te contestan con un \'ya lo vemos\' muy frío. Notas tensión y te quedas dándole vueltas."',
    options: ["Tristeza", "Frustración", "Vergüenza", "Alegría"],
    correctAnswer: "Frustración",
  },
  {
    id: "q3",
    type: "scenario" as const,
    domain: "regulation" as const,
    title: 'MISIÓN — "Qué harías"',
    scenario:
      '"Un compañero te critica delante de otros. Sientes que te hierve la sangre. ¿Cuál sería tu primera reacción?"',
    options: ["Responder de inmediato", "Respirar y calmarme", "Ignorarlo", "Pedir hablar en privado"],
    correctAnswer: "Respirar y calmarme",
  },
]

interface InitialQuizProps {
  userId: string
  onComplete: () => void
  onClose: () => void
}

export function InitialQuiz({ userId, onComplete, onClose }: InitialQuizProps) {
  const [stage, setStage] = useState<"intro" | "quiz" | "completing">("intro")
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [answers, setAnswers] = useState<
    Array<{
      questionId: string
      answer: string
      responseTimeMs: number
      shownAt: Date
    }>
  >([])
  const [questionShownAt, setQuestionShownAt] = useState<Date | null>(null)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [sessionId, setSessionId] = useState<string | null>(null)

  const supabase = createClient()
  const currentQuestion = DEMO_QUESTIONS[currentIndex]
  const totalQuestions = DEMO_QUESTIONS.length

  // Timer for current question
  useEffect(() => {
    if (stage !== "quiz" || !questionShownAt) return

    const interval = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - questionShownAt.getTime()) / 1000))
    }, 1000)

    return () => clearInterval(interval)
  }, [stage, questionShownAt])

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  // Start the quiz
  const startQuiz = async () => {
    try {
      // Create a session
      const { data: session, error } = await supabase
        .from("initial_quiz_sessions")
        .insert({
          user_id: userId,
          total_questions: totalQuestions,
          status: "in_progress",
        })
        .select()
        .single()

      if (error) throw error

      setSessionId(session.id)
      setStage("quiz")
      setQuestionShownAt(new Date())
      setElapsedTime(0)
    } catch (error) {
      console.error("Error starting quiz:", error)
      // Continue anyway for demo
      setStage("quiz")
      setQuestionShownAt(new Date())
      setElapsedTime(0)
    }
  }

  // Handle answer selection
  const selectAnswer = (answer: string) => {
    setSelectedAnswer(answer)
  }

  // Go to next question
  const nextQuestion = async () => {
    if (!selectedAnswer || !questionShownAt) return

    const responseTimeMs = Date.now() - questionShownAt.getTime()
    const newAnswer = {
      questionId: currentQuestion.id,
      answer: selectedAnswer,
      responseTimeMs,
      shownAt: questionShownAt,
    }

    // Save response to database
    if (sessionId) {
      try {
        await supabase.from("initial_quiz_responses").insert({
          session_id: sessionId,
          user_id: userId,
          question_id: currentQuestion.id,
          question_index: currentIndex,
          domain: currentQuestion.domain,
          question_type: currentQuestion.type,
          selected_answer: selectedAnswer,
          is_correct: selectedAnswer === currentQuestion.correctAnswer,
          score: selectedAnswer === currentQuestion.correctAnswer ? 1 : 0,
          response_time_ms: responseTimeMs,
          shown_at: questionShownAt.toISOString(),
        })
      } catch (error) {
        console.error("Error saving response:", error)
      }
    }

    setAnswers([...answers, newAnswer])

    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex(currentIndex + 1)
      setSelectedAnswer(null)
      setQuestionShownAt(new Date())
      setElapsedTime(0)
    } else {
      // Quiz complete
      completeQuiz([...answers, newAnswer])
    }
  }

  // Go back to previous question
  const previousQuestion = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
      const prevAnswer = answers[currentIndex - 1]
      setSelectedAnswer(prevAnswer?.answer || null)
      setQuestionShownAt(new Date())
      setElapsedTime(0)
    }
  }

  // Complete the quiz
  const completeQuiz = async (finalAnswers: typeof answers) => {
    setStage("completing")

    try {
      // Calculate scores
      let scoreRecognition = 0
      let scoreComprehension = 0
      let scoreRegulation = 0

      finalAnswers.forEach((a, idx) => {
        const q = DEMO_QUESTIONS[idx]
        const isCorrect = a.answer === q.correctAnswer
        if (isCorrect) {
          if (q.domain === "recognition") scoreRecognition++
          if (q.domain === "comprehension") scoreComprehension++
          if (q.domain === "regulation") scoreRegulation++
        }
      })

      const scoreTotal = scoreRecognition + scoreComprehension + scoreRegulation
      const totalDurationMs = finalAnswers.reduce((sum, a) => sum + a.responseTimeMs, 0)

      // Update session
      if (sessionId) {
        await supabase
          .from("initial_quiz_sessions")
          .update({
            status: "completed",
            completed_at: new Date().toISOString(),
            total_duration_ms: totalDurationMs,
            score_total: scoreTotal,
            score_recognition: scoreRecognition,
            score_comprehension: scoreComprehension,
            score_regulation: scoreRegulation,
          })
          .eq("id", sessionId)
      }

      // Mark profile as completed
      await supabase
        .from("profiles")
        .update({
          initial_quiz_completed: true,
          initial_quiz_completed_at: new Date().toISOString(),
        })
        .eq("id", userId)

      // Notify parent
      onComplete()
    } catch (error) {
      console.error("Error completing quiz:", error)
      // Still notify parent to continue
      onComplete()
    }
  }

  // End quiz early
  const endQuizEarly = async () => {
    if (sessionId) {
      try {
        await supabase
          .from("initial_quiz_sessions")
          .update({
            status: "abandoned",
            completed_at: new Date().toISOString(),
          })
          .eq("id", sessionId)
      } catch (error) {
        console.error("Error abandoning quiz:", error)
      }
    }
    // For now, don't mark as complete - user must finish
    // onComplete()
  }

  // Close/exit the quiz intro (without completing)
  const handleClose = () => {
    onClose()
  }

  // Intro Screen
  if (stage === "intro") {
    return (
      <div className="flex flex-col h-full bg-white">
        {/* Header with X close button */}
        <div className="flex items-center px-5 py-4">
          <button 
            onClick={handleClose}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
          {/* Level 1 Badge - Explorador Emocional */}
          <div className="mb-6">
            <img
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/1-9dY9dM01JmyMGtHobbNfbL2wHOkutm.png"
              alt="Explorador Emocional - Nivel 1"
              className="w-40 h-40 object-contain"
            />
          </div>

          <h1 className="text-lg font-semibold text-gray-900 mb-4">Descubre tu punto de partida emocional</h1>

          <p className="text-gray-600 text-base leading-relaxed mb-6">
            Te mostraremos pequeñas situaciones, preguntas y retos breves. Tu tarea será elegir la respuesta que mejor
            encaje contigo de la forma más natural posible.
          </p>

          <p className="text-gray-400 text-sm italic mb-12">
            {'"Responde con intuición. No busques la respuesta perfecta."'}
          </p>
        </div>

        {/* Footer */}
        <div className="px-5 pb-8">
          <button
            onClick={startQuiz}
            className="w-full py-4 bg-gray-900 text-white rounded-full text-base font-medium active:scale-[0.98] transition-transform"
          >
            Empezar
          </button>

          <p className="text-center text-xs text-gray-400 mt-4">
            Si estás en crisis, contacta con un profesional{" "}
            <a href="#" className="underline">
              aquí
            </a>
          </p>
        </div>
      </div>
    )
  }

  // Completing screen
  if (stage === "completing") {
    return (
      <div className="flex flex-col h-full bg-white items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-gray-300 border-t-gray-900 rounded-full mb-4" />
        <p className="text-gray-600">Guardando tus resultados...</p>
      </div>
    )
  }

  // Quiz Screen
  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <X className="w-5 h-5 text-[#E6584F]" />
          <span className="text-lg font-semibold text-gray-900">Vladi</span>
        </div>

        <span className="text-sm text-gray-500 font-mono">{formatTime(elapsedTime)}</span>

        <button onClick={endQuizEarly} className="text-sm text-gray-500 hover:text-gray-700">
          Finalizar
        </button>
      </div>

      {/* Question Content */}
      <div className="flex-1 overflow-y-auto px-5 py-6">
        {/* Title */}
        <p className="text-xs font-medium text-gray-400 text-center tracking-wide mb-4">{currentQuestion.title}</p>

        {/* Video or Scenario */}
        {currentQuestion.type === "video" ? (
          <div className="relative rounded-xl overflow-hidden mb-6 bg-gray-100 aspect-video">
            <img
              src={currentQuestion.videoUrl}
              alt="Video preview"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
              <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center">
                <Play className="w-6 h-6 text-gray-900 ml-1" />
              </div>
            </div>
          </div>
        ) : (
          <div className="mb-6">
            <p className="text-lg text-gray-700 text-center leading-relaxed">{currentQuestion.scenario}</p>
          </div>
        )}

        {/* Options */}
        <div className="space-y-3">
          {currentQuestion.options.map((option) => (
            <button
              key={option}
              onClick={() => selectAnswer(option)}
              className={`w-full flex items-center justify-between px-5 py-4 rounded-2xl border-2 transition-all ${
                selectedAnswer === option
                  ? "border-gray-900 bg-gray-50"
                  : "border-gray-200 bg-white hover:border-gray-300"
              }`}
            >
              <span className="text-base text-gray-900">{option}</span>
              <div
                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                  selectedAnswer === option ? "border-gray-900 bg-gray-900" : "border-gray-300"
                }`}
              >
                {selectedAnswer === option && <Check className="w-4 h-4 text-white" />}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="px-5 pb-8 pt-4 border-t border-gray-100">
        <button
          onClick={nextQuestion}
          disabled={!selectedAnswer}
          className="w-full py-4 bg-gray-900 text-white rounded-full text-base font-medium disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] transition-transform"
        >
          Siguiente
        </button>

        {currentIndex > 0 && (
          <button onClick={previousQuestion} className="w-full py-3 text-gray-500 text-sm mt-2">
            Volver atrás
          </button>
        )}

        {/* Progress indicator */}
        <div className="flex justify-center gap-1.5 mt-4">
          {DEMO_QUESTIONS.map((_, idx) => (
            <div
              key={idx}
              className={`w-2 h-2 rounded-full transition-colors ${
                idx === currentIndex ? "bg-gray-900" : idx < currentIndex ? "bg-gray-400" : "bg-gray-200"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

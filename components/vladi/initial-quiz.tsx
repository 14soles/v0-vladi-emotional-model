"use client"

import { useState, useEffect, useCallback } from "react"
import { X, Check } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

// Types for assessment data
interface AssessmentQuestion {
  id: string
  code: string
  domain: "recognition" | "understanding" | "management"
  question_type: "single_choice" | "ranking"
  prompt: string
  media_type: "none" | "image" | "video"
  media_url: string | null
  order_index: number
  assessment_options: AssessmentOption[]
}

interface AssessmentOption {
  id: string
  option_key: string
  label: string
  display_order: number
  is_correct: boolean
  weight: number
}

interface AssessmentDefinition {
  id: string
  slug: string
  title: string
  version: string
}

interface InitialQuizProps {
  userId: string
  onComplete: () => void
  onClose: () => void
}



// Shuffle array using Fisher-Yates algorithm
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

export function InitialQuiz({ userId, onComplete, onClose }: InitialQuizProps) {
  const [stage, setStage] = useState<"loading" | "intro" | "quiz" | "completing" | "complete">("loading")
  const [error, setError] = useState<string | null>(null)
  
  // Assessment data
  const [definition, setDefinition] = useState<AssessmentDefinition | null>(null)
  const [questions, setQuestions] = useState<AssessmentQuestion[]>([])
  const [sessionId, setSessionId] = useState<string | null>(null)
  
  // Quiz state
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null)
  const [questionShownAt, setQuestionShownAt] = useState<Date | null>(null)
  const [elapsedTime, setElapsedTime] = useState(0)
  
  // Answers tracking
  const [answers, setAnswers] = useState<Map<string, {
    optionId: string
    isCorrect: boolean
    responseTimeMs: number
  }>>(new Map())

  const supabase = createClient()
  const currentQuestion = questions[currentIndex]
  const totalQuestions = questions.length

  // Load assessment data on mount
  useEffect(() => {
    loadAssessmentData()
  }, [])

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

  // Load assessment definition and questions
  const loadAssessmentData = async () => {
    try {
      // Get assessment definition
      const { data: defData, error: defError } = await supabase
        .from("assessment_definitions")
        .select("*")
        .eq("slug", "initial_quiz_v1")
        .eq("is_active", true)
        .single()

      if (defError) throw defError
      if (!defData) throw new Error("Assessment definition not found")

      setDefinition(defData)

      // Get all questions with options
      const { data: questionsData, error: questionsError } = await supabase
        .from("assessment_questions")
        .select(`
          *,
          assessment_options (*)
        `)
        .eq("assessment_definition_id", defData.id)
        .eq("is_active", true)
        .order("order_index", { ascending: true })

      if (questionsError) throw questionsError
      if (!questionsData || questionsData.length === 0) {
        throw new Error("No questions found")
      }

      // Shuffle options within each question
      const shuffledQuestions = questionsData.map(q => ({
        ...q,
        assessment_options: shuffleArray(q.assessment_options)
      }))

      setQuestions(shuffledQuestions)
      setStage("intro")
    } catch (err) {
      console.error("Error loading assessment:", err)
      setError(err instanceof Error ? err.message : "Error loading quiz")
      setStage("intro") // Still show intro, will handle error there
    }
  }

  // Start the quiz - create session
  const startQuiz = async () => {
    if (!definition) {
      setError("Quiz not loaded properly")
      return
    }

    try {
      // Create assessment session
      const { data: session, error: sessionError } = await supabase
        .from("assessment_sessions")
        .insert({
          profile_id: userId,
          assessment_definition_id: definition.id,
          session_type: "baseline",
          status: "in_progress",
          is_first_assessment: true,
          current_question_index: 0,
          completed_questions_count: 0,
        })
        .select()
        .single()

      if (sessionError) throw sessionError

      setSessionId(session.id)
      setStage("quiz")
      setQuestionShownAt(new Date())
      setElapsedTime(0)
    } catch (err) {
      console.error("Error starting quiz:", err)
      setError("Error starting quiz. Please try again.")
    }
  }

  // Handle answer selection
  const selectOption = (optionId: string) => {
    setSelectedOptionId(optionId)
  }

  // Save current answer and move to next question
  const nextQuestion = async () => {
    if (!selectedOptionId || !questionShownAt || !currentQuestion || !sessionId) return

    const selectedOption = currentQuestion.assessment_options.find(o => o.id === selectedOptionId)
    if (!selectedOption) return

    const responseTimeMs = Date.now() - questionShownAt.getTime()
    const isCorrect = selectedOption.is_correct

    // Save answer to state
    const newAnswers = new Map(answers)
    newAnswers.set(currentQuestion.id, {
      optionId: selectedOptionId,
      isCorrect,
      responseTimeMs,
    })
    setAnswers(newAnswers)

    // Save answer to database
    try {
      await supabase.from("assessment_answers").insert({
        session_id: sessionId,
        profile_id: userId,
        question_id: currentQuestion.id,
        domain: currentQuestion.domain,
        question_type: currentQuestion.question_type,
        presented_order_json: currentQuestion.assessment_options.map(o => o.id),
        selected_option_id: selectedOptionId,
        is_correct: isCorrect,
        raw_score: isCorrect ? 1 : 0,
        response_time_ms: responseTimeMs,
        shown_at: questionShownAt.toISOString(),
      })

      // Update session progress
      await supabase
        .from("assessment_sessions")
        .update({
          current_question_index: currentIndex + 1,
          completed_questions_count: currentIndex + 1,
        })
        .eq("id", sessionId)
    } catch (err) {
      console.error("Error saving answer:", err)
    }

    // Move to next question or complete
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex(currentIndex + 1)
      setSelectedOptionId(null)
      setQuestionShownAt(new Date())
      setElapsedTime(0)
    } else {
      // Quiz complete - calculate and save results
      await completeQuiz(newAnswers)
    }
  }

  // Go back to previous question
  const previousQuestion = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
      // Restore previous answer if exists
      const prevQuestion = questions[currentIndex - 1]
      const prevAnswer = answers.get(prevQuestion.id)
      setSelectedOptionId(prevAnswer?.optionId || null)
      setQuestionShownAt(new Date())
      setElapsedTime(0)
    }
  }

  // Complete the quiz - calculate scores and save results
  const completeQuiz = async (finalAnswers: Map<string, { optionId: string; isCorrect: boolean; responseTimeMs: number }>) => {
    setStage("completing")

    try {
      // Calculate scores by domain
      let recognitionCorrect = 0
      let understandingCorrect = 0
      let managementCorrect = 0
      let totalTimeMs = 0

      questions.forEach(q => {
        const answer = finalAnswers.get(q.id)
        if (answer) {
          totalTimeMs += answer.responseTimeMs
          if (answer.isCorrect) {
            if (q.domain === "recognition") recognitionCorrect++
            else if (q.domain === "understanding") understandingCorrect++
            else if (q.domain === "management") managementCorrect++
          }
        }
      })

      const globalCorrect = recognitionCorrect + understandingCorrect + managementCorrect

      // Calculate percentage scores (each domain has 12 questions max)
      const recognitionScore100 = Math.round((recognitionCorrect / 12) * 100)
      const understandingScore100 = Math.round((understandingCorrect / 12) * 100)
      const managementScore100 = Math.round((managementCorrect / 12) * 100)
      const globalScore100 = Math.round((globalCorrect / 36) * 100)

      // Save results
      const { data: resultData, error: resultError } = await supabase
        .from("assessment_results")
        .insert({
          session_id: sessionId,
          profile_id: userId,
          recognition_score_raw: recognitionCorrect,
          recognition_score_100: recognitionScore100,
          understanding_score_raw: understandingCorrect,
          understanding_score_100: understandingScore100,
          management_score_raw: managementCorrect,
          management_score_100: managementScore100,
          global_score_raw: globalCorrect,
          global_score_100: globalScore100,
        })
        .select()
        .single()

      if (resultError) throw resultError

      // Create baseline record
      await supabase.from("profile_assessment_baseline").insert({
        profile_id: userId,
        baseline_session_id: sessionId,
        baseline_result_id: resultData.id,
      })

      // Update session as completed
      await supabase
        .from("assessment_sessions")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
          total_time_ms: totalTimeMs,
        })
        .eq("id", sessionId)

      // Mark profile as quiz completed
      await supabase
        .from("profiles")
        .update({
          initial_quiz_completed: true,
          initial_quiz_completed_at: new Date().toISOString(),
        })
        .eq("id", userId)

      setStage("complete")

      // Wait a moment to show completion, then notify parent
      setTimeout(() => {
        onComplete()
      }, 2000)
    } catch (err) {
      console.error("Error completing quiz:", err)
      // Still try to mark profile and notify parent
      try {
        await supabase
          .from("profiles")
          .update({
            initial_quiz_completed: true,
            initial_quiz_completed_at: new Date().toISOString(),
          })
          .eq("id", userId)
      } catch (e) {
        console.error("Error updating profile:", e)
      }
      onComplete()
    }
  }

  // End quiz early (abandon)
  const endQuizEarly = async () => {
    if (sessionId) {
      try {
        await supabase
          .from("assessment_sessions")
          .update({
            status: "abandoned",
            completed_at: new Date().toISOString(),
          })
          .eq("id", sessionId)
      } catch (err) {
        console.error("Error abandoning quiz:", err)
      }
    }
    onClose()
  }

  // Loading screen
  if (stage === "loading") {
    return (
      <div className="flex flex-col h-full min-h-screen bg-background">
        {/* Header with X close button */}
        <div className="flex items-center px-5 pt-5">
          <button 
            type="button"
            onClick={onClose}
            className="p-1 text-foreground/70 hover:text-foreground transition-colors z-50"
          >
            <X className="w-5 h-5" strokeWidth={1.5} />
          </button>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="animate-spin w-8 h-8 border-2 border-muted-foreground/30 border-t-foreground rounded-full mb-4" />
          <p className="text-muted-foreground">Cargando cuestionario...</p>
        </div>
      </div>
    )
  }

  // Intro Screen
  if (stage === "intro") {
    return (
      <div className="flex flex-col h-full min-h-screen bg-background">
        {/* Header with X close button */}
        <div className="flex items-center px-5 pt-5">
          <button 
            type="button"
            onClick={onClose}
            className="p-1 text-foreground/70 hover:text-foreground transition-colors z-50"
          >
            <X className="w-5 h-5" strokeWidth={1.5} />
          </button>
        </div>

        {/* Content - centered vertically */}
        <div className="flex-1 flex flex-col items-center justify-center px-10 -mt-8">
          {/* Vladi Logo */}
          <img 
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Logo-fcHJRsxAqLJb5NnpPWPuhRu1tTl5Z3.png" 
            alt="Vladi"
            className="h-6 w-auto mb-8"
          />

          {/* Level 1 Badge - Explorador Emocional */}
          <div className="mb-6">
            <img
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/1-9dY9dM01JmyMGtHobbNfbL2wHOkutm.png"
              alt="Explorador Emocional - Nivel 1"
              className="w-28 h-28 object-contain"
            />
          </div>

          {/* Small title */}
          <h2 className="text-sm font-semibold text-foreground mb-6">
            Descubre tu punto de partida emocional
          </h2>

          {error ? (
            <div className="text-destructive text-sm mb-4 p-3 bg-destructive/10 rounded-lg">
              {error}
            </div>
          ) : (
            <>
              {/* Main description - larger text */}
              <p className="text-[22px] leading-[1.4] text-foreground text-center mb-8 font-normal">
                Te mostraremos pequeñas situaciones, preguntas y retos breves. Tu tarea será elegir la respuesta que mejor encaje contigo de la forma más natural posible.
              </p>

              {/* Italic quote */}
              <p className="text-sm text-muted-foreground italic text-center leading-relaxed">
                {'"Responde con intuición. No busques la'}
                <br />
                {'respuesta perfecta."'}
              </p>
            </>
          )}
        </div>

        {/* Footer - fixed at bottom */}
        <div className="px-8 pb-6 pt-4">
          <button
            onClick={startQuiz}
            disabled={questions.length === 0 || !!error}
            className="w-full py-4 bg-foreground text-background rounded-full text-base font-medium active:scale-[0.98] transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Empezar
          </button>

          <p className="text-center text-xs text-muted-foreground mt-4">
            Si estás en crisis, contacta con un profesional{" "}
            <a href="#" className="underline hover:text-foreground transition-colors">
              aquí
            </a>
            .
          </p>
        </div>
      </div>
    )
  }

  // Completing screen
  if (stage === "completing") {
    return (
      <div className="flex flex-col h-full bg-background items-center justify-center px-8 text-center">
        <div className="animate-spin w-8 h-8 border-2 border-muted-foreground/30 border-t-foreground rounded-full mb-4" />
        <p className="text-muted-foreground">Calculando tu perfil emocional...</p>
      </div>
    )
  }

  // Complete screen
  if (stage === "complete") {
    return (
      <div className="flex flex-col h-full bg-background items-center justify-center px-8 text-center">
        <div className="mb-6">
          <img
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/1-9dY9dM01JmyMGtHobbNfbL2wHOkutm.png"
            alt="Explorador Emocional - Nivel 1"
            className="w-32 h-32 object-contain"
          />
        </div>
        <h2 className="text-xl font-semibold text-foreground mb-2">Punto de partida completado</h2>
        <p className="text-muted-foreground">
          Tu perfil emocional inicial ha sido guardado. Ahora puedes empezar a explorar VLADI.
        </p>
      </div>
    )
  }

  // Quiz Screen
  if (!currentQuestion) {
    return (
      <div className="flex flex-col h-full bg-background items-center justify-center">
        <p className="text-muted-foreground">Error: pregunta no encontrada</p>
      </div>
    )
  }

  // Calculate progress percentage
  const progressPercentage = ((currentIndex + 1) / totalQuestions) * 100

  return (
    <div className="flex flex-col h-full min-h-screen bg-background">
      {/* Progress bar - subtle at top */}
      <div className="px-4 pt-3">
        <div className="h-1 bg-muted/50 rounded-full overflow-hidden">
          <div 
            className="h-full bg-foreground/20 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Header - Vladi logo, Timer, Finalizar button */}
      <div className="flex items-center justify-between px-5 py-3">
        {/* Vladi Logo */}
        <img 
          src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Logo-fcHJRsxAqLJb5NnpPWPuhRu1tTl5Z3.png" 
          alt="Vladi"
          className="h-5 w-auto"
        />

        {/* Timer */}
        <span className="text-sm text-foreground/70">{formatTime(elapsedTime)}</span>

        {/* Finalizar button */}
        <button 
          type="button"
          onClick={endQuizEarly} 
          className="text-sm text-foreground/70 hover:text-foreground transition-colors"
        >
          Finalizar
        </button>
      </div>

      {/* Question Content - scrollable area */}
      <div className="flex-1 overflow-y-auto">
        {/* Question prompt */}
        <div className="px-6 pt-6 pb-4">
          <p className="text-[17px] text-foreground text-center leading-relaxed">
            {currentQuestion.prompt}
          </p>
        </div>

        {/* Media (if video/image) - full width */}
        {currentQuestion.media_type === "video" && currentQuestion.media_url && (
          <div className="relative overflow-hidden mb-5 bg-muted mx-4 rounded-2xl">
            <video 
              src={currentQuestion.media_url}
              controls
              className="w-full h-auto object-cover"
            />
          </div>
        )}
        {currentQuestion.media_type === "image" && currentQuestion.media_url && (
          <div className="relative overflow-hidden mb-5 bg-muted mx-4 rounded-2xl">
            <img
              src={currentQuestion.media_url}
              alt="Question media"
              className="w-full h-auto object-cover"
            />
          </div>
        )}

        {/* Options - Pill style buttons with circle checkbox on right */}
        <div className="px-5 space-y-3 pb-4">
          {currentQuestion.assessment_options.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => selectOption(option.id)}
              className={`w-full flex items-center justify-between px-5 py-4 rounded-full border transition-all ${
                selectedOptionId === option.id
                  ? "border-foreground bg-background"
                  : "border-border bg-background hover:border-muted-foreground/50"
              }`}
            >
              <span className="text-[15px] text-foreground">{option.label}</span>
              <div
                className={`w-7 h-7 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                  selectedOptionId === option.id 
                    ? "border-foreground bg-foreground" 
                    : "border-muted-foreground/30 bg-transparent"
                }`}
              >
                {selectedOptionId === option.id && <Check className="w-4 h-4 text-background" strokeWidth={2.5} />}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Footer - Siguiente button and Volver atrás link - fixed at bottom */}
      <div className="px-6 pb-6 pt-4 mt-auto bg-background">
        <button
          type="button"
          onClick={nextQuestion}
          disabled={!selectedOptionId}
          className="w-full py-4 bg-foreground text-background rounded-full text-base font-medium disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] transition-all"
        >
          Siguiente
        </button>
        
        <button
          type="button"
          onClick={currentIndex > 0 ? previousQuestion : undefined}
          disabled={currentIndex === 0}
          className={`w-full py-3 text-sm transition-colors mt-1 ${
            currentIndex > 0 
              ? "text-muted-foreground hover:text-foreground cursor-pointer" 
              : "text-transparent cursor-default"
          }`}
        >
          Volver atrás
        </button>
      </div>
    </div>
  )
}

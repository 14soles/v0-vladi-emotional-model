"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { X, Play, Pause, Check, AlertCircle } from "lucide-react"
import type { InterventionDefinition } from "@/lib/types/telemetry"
import type { LinkedEmotionContext } from "./mirror-overlay"

interface InterventionRunnerProps {
  intervention: InterventionDefinition
  linkedEmotion?: LinkedEmotionContext | null
  onComplete: (intensityAfter: number, perceivedUtility: number) => void
  onSkip: (reason: string) => void
  onClose: () => void
  onRequestEmotionLink?: () => void // Called when user wants to link an emotion mid-activity
}

// Emotion family colors and labels
const emotionFamilyConfig: Record<string, { color: string; bgColor: string; label: string }> = {
  calma: { color: "text-green-600", bgColor: "bg-green-100", label: "En calma" },
  energia: { color: "text-yellow-600", bgColor: "bg-yellow-100", label: "Con energia" },
  tension: { color: "text-red-600", bgColor: "bg-red-100", label: "En tension" },
  tristeza: { color: "text-blue-600", bgColor: "bg-blue-100", label: "Sin animo" },
}

// Breathing phases with durations
interface BreathingPhase {
  name: string
  instruction: string
  duration: number // seconds
}

const breathing478Phases: BreathingPhase[] = [
  { name: "inhale", instruction: "Inhala por la nariz", duration: 4 },
  { name: "hold", instruction: "Mantén el aire", duration: 7 },
  { name: "exhale", instruction: "Exhala por la boca", duration: 8 },
]

const breathingBoxPhases: BreathingPhase[] = [
  { name: "inhale", instruction: "Inhala", duration: 4 },
  { name: "hold1", instruction: "Mantén", duration: 4 },
  { name: "exhale", instruction: "Exhala", duration: 4 },
  { name: "hold2", instruction: "Espera", duration: 4 },
]

// Grounding 5-4-3-2-1 steps
const groundingSteps = [
  { count: 5, sense: "VES", instruction: "Nombra 5 cosas que puedas VER a tu alrededor", color: "from-blue-500 to-blue-600" },
  { count: 4, sense: "TOCAS", instruction: "Nombra 4 cosas que puedas TOCAR", color: "from-green-500 to-green-600" },
  { count: 3, sense: "OYES", instruction: "Nombra 3 cosas que puedas OÍR", color: "from-yellow-500 to-yellow-600" },
  { count: 2, sense: "HUELES", instruction: "Nombra 2 cosas que puedas OLER", color: "from-orange-500 to-orange-600" },
  { count: 1, sense: "SABOREAS", instruction: "Nombra 1 cosa que puedas SABOREAR", color: "from-red-500 to-red-600" },
]

// Journaling prompts
const journalingPrompts = [
  "¿Qué estás sintiendo exactamente en este momento?",
  "¿Qué pensamientos acompañan a esta emoción?",
  "¿Qué necesitas en este momento?",
  "¿Qué te gustaría soltar o dejar ir?",
  "¿Qué te haría sentir un poco mejor ahora?",
]

// Meditation guidance
const meditationSteps = [
  { instruction: "Encuentra una posición cómoda", duration: 10 },
  { instruction: "Cierra suavemente los ojos", duration: 5 },
  { instruction: "Respira naturalmente y observa tu respiración", duration: 30 },
  { instruction: "Si tu mente divaga, vuelve gentilmente a la respiración", duration: 30 },
  { instruction: "Siente cómo tu cuerpo se relaja con cada exhalación", duration: 30 },
  { instruction: "Permanece presente en este momento", duration: 60 },
  { instruction: "Lentamente, vuelve a ser consciente de tu entorno", duration: 15 },
]

// Movement exercises
const movementExercises = [
  { name: "Estiramiento de cuello", instruction: "Inclina la cabeza hacia un lado, mantén 15s, cambia de lado", duration: 30 },
  { name: "Giro de hombros", instruction: "Gira los hombros hacia atrás 10 veces, luego hacia adelante", duration: 30 },
  { name: "Estiramiento de brazos", instruction: "Estira un brazo sobre el pecho, mantén 15s, cambia", duration: 30 },
  { name: "Respiración profunda", instruction: "Inhala subiendo los brazos, exhala bajándolos", duration: 30 },
  { name: "Sacudir el cuerpo", instruction: "Sacude suavemente todo tu cuerpo para liberar tensión", duration: 30 },
]

// Reframing questions
const reframingQuestions = [
  { question: "¿Cuál es el pensamiento que te está causando malestar?", hint: "Identifícalo claramente" },
  { question: "¿Qué evidencia tienes de que este pensamiento es 100% cierto?", hint: "Busca hechos, no suposiciones" },
  { question: "¿Hay otra forma de ver esta situación?", hint: "Imagina cómo lo vería un amigo" },
  { question: "¿Qué le dirías a un amigo en esta situación?", hint: "Sé compasivo contigo mismo" },
  { question: "¿Qué es lo peor que podría pasar? ¿Y lo mejor?", hint: "Pon perspectiva" },
]

export function InterventionRunner({
  intervention,
  linkedEmotion,
  onComplete,
  onSkip,
  onClose,
  onRequestEmotionLink,
}: InterventionRunnerProps) {
  const [phase, setPhase] = useState<"running" | "rating">("running")
  const [timeRemaining, setTimeRemaining] = useState(intervention.duration_seconds)
  const [isPaused, setIsPaused] = useState(false)
  const [intensityAfter, setIntensityAfter] = useState(5)
  const [perceivedUtility, setPerceivedUtility] = useState(3)
  
  // Breathing-specific state
  const [breathingPhaseIndex, setBreathingPhaseIndex] = useState(0)
  const [breathingPhaseTime, setBreathingPhaseTime] = useState(0)
  const [breathingCycles, setBreathingCycles] = useState(0)
  
  // Grounding-specific state
  const [groundingStepIndex, setGroundingStepIndex] = useState(0)
  const [groundingItems, setGroundingItems] = useState<string[]>([])
  
  // Journaling state
  const [journalText, setJournalText] = useState("")
  const [currentPromptIndex, setCurrentPromptIndex] = useState(0)
  
  // Meditation state
  const [meditationStepIndex, setMeditationStepIndex] = useState(0)
  const [meditationStepTime, setMeditationStepTime] = useState(0)
  
  // Movement state
  const [movementIndex, setMovementIndex] = useState(0)
  const [movementTime, setMovementTime] = useState(0)
  
  // Reframing state
  const [reframingIndex, setReframingIndex] = useState(0)
  const [reframingAnswers, setReframingAnswers] = useState<string[]>(Array(reframingQuestions.length).fill(""))

  const isBreathing = intervention.type.startsWith("breathing")
  const breathingPhases = intervention.type === "breathing_478" ? breathing478Phases : breathingBoxPhases
  const currentBreathingPhase = breathingPhases[breathingPhaseIndex]
  const totalCycleTime = breathingPhases.reduce((sum, p) => sum + p.duration, 0)

  // Main timer
  useEffect(() => {
    if (phase !== "running" || isPaused || timeRemaining <= 0) return

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          setPhase("rating")
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [phase, isPaused, timeRemaining])

  // Breathing timer
  useEffect(() => {
    if (!isBreathing || phase !== "running" || isPaused) return

    const timer = setInterval(() => {
      setBreathingPhaseTime((prev) => {
        if (prev >= currentBreathingPhase.duration - 1) {
          // Move to next phase
          setBreathingPhaseIndex((prevIndex) => {
            const nextIndex = (prevIndex + 1) % breathingPhases.length
            if (nextIndex === 0) {
              setBreathingCycles((c) => c + 1)
            }
            return nextIndex
          })
          return 0
        }
        return prev + 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [isBreathing, phase, isPaused, currentBreathingPhase, breathingPhases.length])

  // Meditation timer
  useEffect(() => {
    if (intervention.type !== "meditation" || phase !== "running" || isPaused) return

    const currentStep = meditationSteps[meditationStepIndex]
    if (!currentStep) return

    const timer = setInterval(() => {
      setMeditationStepTime((prev) => {
        if (prev >= currentStep.duration - 1) {
          setMeditationStepIndex((i) => Math.min(i + 1, meditationSteps.length - 1))
          return 0
        }
        return prev + 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [intervention.type, phase, isPaused, meditationStepIndex])

  // Movement timer
  useEffect(() => {
    if (intervention.type !== "movement" || phase !== "running" || isPaused) return

    const currentExercise = movementExercises[movementIndex]
    if (!currentExercise) return

    const timer = setInterval(() => {
      setMovementTime((prev) => {
        if (prev >= currentExercise.duration - 1) {
          setMovementIndex((i) => Math.min(i + 1, movementExercises.length - 1))
          return 0
        }
        return prev + 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [intervention.type, phase, isPaused, movementIndex])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const progress = 1 - timeRemaining / intervention.duration_seconds

  const handleFinishEarly = useCallback(() => {
    setPhase("rating")
  }, [])

  const handleSubmitRating = useCallback(() => {
    onComplete(intensityAfter, perceivedUtility)
  }, [intensityAfter, perceivedUtility, onComplete])

  // Calculate breathing circle scale
  const breathingScale = useMemo(() => {
    if (!isBreathing) return 1
    const phaseProgress = breathingPhaseTime / currentBreathingPhase.duration
    
    if (currentBreathingPhase.name === "inhale") {
      return 0.6 + (0.4 * phaseProgress) // Grow from 0.6 to 1.0
    } else if (currentBreathingPhase.name === "exhale") {
      return 1.0 - (0.4 * phaseProgress) // Shrink from 1.0 to 0.6
    }
    return breathingPhaseIndex === 0 || currentBreathingPhase.name === "hold" ? 1.0 : 0.6 // Hold at current size
  }, [isBreathing, breathingPhaseTime, currentBreathingPhase, breathingPhaseIndex])

  // Emotion indicator component shown at top
  const EmotionIndicator = ({ variant = "dark" }: { variant?: "dark" | "light" }) => {
    if (!linkedEmotion && !onRequestEmotionLink) return null

    const config = linkedEmotion ? emotionFamilyConfig[linkedEmotion.emotionFamily] : null

    if (!linkedEmotion) {
      return (
        <button
          onClick={onRequestEmotionLink}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
            variant === "dark" 
              ? "bg-white/20 text-white hover:bg-white/30" 
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          <AlertCircle className="w-3.5 h-3.5" />
          <span>Vincular emocion</span>
        </button>
      )
    }

    return (
      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
        variant === "dark" 
          ? "bg-white/20 text-white" 
          : config?.bgColor + " " + config?.color
      }`}>
        <span className="opacity-70">Empezaste:</span>
        <span className="font-semibold">{linkedEmotion.emotion}</span>
        <span className="opacity-70">(intensidad {linkedEmotion.intensity}/10)</span>
      </div>
    )
  }

  // Rating screen
  if (phase === "rating") {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white w-full max-w-md rounded-2xl overflow-hidden">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold text-gray-900">Como te sientes ahora?</h2>
            {linkedEmotion && (
              <p className="text-sm text-gray-500 mt-1">
                Empezaste sintiendote <span className="font-medium">{linkedEmotion.emotion}</span> con intensidad {linkedEmotion.intensity}/10
              </p>
            )}
          </div>

          <div className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Tu intensidad emocional ahora (1-10)
              </label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400 w-8">Baja</span>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={intensityAfter}
                  onChange={(e) => setIntensityAfter(Number(e.target.value))}
                  className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <span className="text-sm text-gray-400 w-8">Alta</span>
              </div>
              <div className="text-center mt-2">
                <span className="text-2xl font-semibold text-gray-900">{intensityAfter}</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                ¿Te ha sido útil esta técnica?
              </label>
              <div className="flex justify-between gap-2">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    onClick={() => setPerceivedUtility(value)}
                    className={`flex-1 py-3 rounded-lg border-2 transition-all ${
                      perceivedUtility === value
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <span className="text-lg font-medium">{value}</span>
                  </button>
                ))}
              </div>
              <div className="flex justify-between text-xs text-gray-400 mt-1 px-1">
                <span>Nada útil</span>
                <span>Muy útil</span>
              </div>
            </div>
          </div>

          <div className="p-4 border-t bg-gray-50">
            <button
              onClick={handleSubmitRating}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <Check className="w-5 h-5" />
              Guardar y continuar
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Breathing intervention
  if (isBreathing) {
    return (
      <div className="fixed inset-0 bg-gradient-to-b from-blue-600 to-blue-800 z-50 flex flex-col">
        <div className="flex flex-col p-4 text-white">
          <div className="flex items-center justify-between">
            <button onClick={() => onSkip("cancelled")} className="p-2 hover:bg-white/10 rounded-full">
              <X className="w-6 h-6" />
            </button>
            <span className="font-medium">{intervention.name}</span>
            <span className="text-sm opacity-70">{formatTime(timeRemaining)}</span>
          </div>
          <div className="flex justify-center mt-2">
            <EmotionIndicator variant="dark" />
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center p-8">
          {/* Animated breathing circle */}
          <div className="relative w-64 h-64 flex items-center justify-center mb-8">
            <div
              className="absolute w-full h-full rounded-full bg-white/20 transition-transform duration-1000 ease-in-out"
              style={{ transform: `scale(${breathingScale})` }}
            />
            <div
              className="absolute w-3/4 h-3/4 rounded-full bg-white/30 transition-transform duration-1000 ease-in-out"
              style={{ transform: `scale(${breathingScale})` }}
            />
            <div className="z-10 text-center">
              <p className="text-white text-2xl font-light mb-2">{currentBreathingPhase.instruction}</p>
              <p className="text-white/60 text-lg">{currentBreathingPhase.duration - breathingPhaseTime}s</p>
            </div>
          </div>

          <p className="text-white/70 text-center">Ciclo {breathingCycles + 1}</p>

          {/* Controls */}
          <div className="flex items-center gap-4 mt-8">
            <button
              onClick={() => setIsPaused(!isPaused)}
              className="p-4 bg-white hover:bg-white/90 rounded-full transition-colors"
            >
              {isPaused ? <Play className="w-6 h-6 text-blue-600 ml-0.5" /> : <Pause className="w-6 h-6 text-blue-600" />}
            </button>
            <button
              onClick={handleFinishEarly}
              className="p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
            >
              <Check className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Grounding 5-4-3-2-1
  if (intervention.type === "grounding_54321") {
    const currentStep = groundingSteps[groundingStepIndex]
    const isComplete = groundingStepIndex >= groundingSteps.length

    return (
      <div className={`fixed inset-0 bg-gradient-to-b ${currentStep?.color || "from-gray-600 to-gray-800"} z-50 flex flex-col transition-colors duration-500`}>
        <div className="flex flex-col p-4 text-white">
          <div className="flex items-center justify-between">
            <button onClick={() => onSkip("cancelled")} className="p-2 hover:bg-white/10 rounded-full">
              <X className="w-6 h-6" />
            </button>
            <span className="font-medium">Grounding 5-4-3-2-1</span>
            <span className="text-sm opacity-70">{formatTime(timeRemaining)}</span>
          </div>
          <div className="flex justify-center mt-2">
            <EmotionIndicator variant="dark" />
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center p-8">
          {!isComplete ? (
            <>
              <div className="text-9xl font-bold text-white/30 mb-4">{currentStep.count}</div>
              <p className="text-white text-xl text-center mb-8 max-w-xs">{currentStep.instruction}</p>
              
              <div className="w-full max-w-sm space-y-3">
                {Array.from({ length: currentStep.count }).map((_, i) => (
                  <input
                    key={i}
                    type="text"
                    placeholder={`${currentStep.sense} ${i + 1}...`}
                    value={groundingItems[groundingStepIndex * 5 + i] || ""}
                    onChange={(e) => {
                      const newItems = [...groundingItems]
                      newItems[groundingStepIndex * 5 + i] = e.target.value
                      setGroundingItems(newItems)
                    }}
                    className="w-full px-4 py-3 rounded-xl bg-white/20 text-white placeholder-white/50 border-0 focus:ring-2 focus:ring-white/50 focus:outline-none"
                  />
                ))}
              </div>

              <button
                onClick={() => setGroundingStepIndex(i => i + 1)}
                className="mt-8 px-8 py-3 bg-white text-gray-900 font-medium rounded-xl hover:bg-white/90 transition-colors"
              >
                {groundingStepIndex < groundingSteps.length - 1 ? "Siguiente" : "Finalizar"}
              </button>
            </>
          ) : (
            <div className="text-center">
              <div className="text-6xl mb-4">✓</div>
              <p className="text-white text-xl mb-8">¡Bien hecho! Has completado el ejercicio</p>
              <button
                onClick={handleFinishEarly}
                className="px-8 py-3 bg-white text-gray-900 font-medium rounded-xl hover:bg-white/90 transition-colors"
              >
                Continuar
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Journaling
  if (intervention.type === "journaling") {
    return (
      <div className="fixed inset-0 bg-gradient-to-b from-purple-600 to-purple-800 z-50 flex flex-col">
        <div className="flex flex-col p-4 text-white">
          <div className="flex items-center justify-between">
            <button onClick={() => onSkip("cancelled")} className="p-2 hover:bg-white/10 rounded-full">
              <X className="w-6 h-6" />
            </button>
            <span className="font-medium">Escritura expresiva</span>
            <span className="text-sm opacity-70">{formatTime(timeRemaining)}</span>
          </div>
          <div className="flex justify-center mt-2">
            <EmotionIndicator variant="dark" />
          </div>
        </div>

        <div className="flex-1 flex flex-col p-6 overflow-hidden">
          <div className="mb-4">
            <p className="text-white/80 text-sm mb-2">Pregunta guía:</p>
            <p className="text-white text-lg font-medium">{journalingPrompts[currentPromptIndex]}</p>
          </div>

          <textarea
            value={journalText}
            onChange={(e) => setJournalText(e.target.value)}
            placeholder="Escribe libremente aquí..."
            className="flex-1 w-full p-4 rounded-xl bg-white/10 text-white placeholder-white/40 border-0 focus:ring-2 focus:ring-white/30 focus:outline-none resize-none text-lg"
          />

          <div className="flex items-center justify-between mt-4">
            <button
              onClick={() => setCurrentPromptIndex(i => (i + 1) % journalingPrompts.length)}
              className="text-white/70 text-sm hover:text-white"
            >
              Otra pregunta →
            </button>
            <button
              onClick={handleFinishEarly}
              className="px-6 py-2 bg-white text-purple-700 font-medium rounded-xl hover:bg-white/90 transition-colors"
            >
              Finalizar
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Meditation
  if (intervention.type === "meditation") {
    const currentStep = meditationSteps[meditationStepIndex]

    return (
      <div className="fixed inset-0 bg-gradient-to-b from-indigo-900 to-purple-900 z-50 flex flex-col">
        <div className="flex flex-col p-4 text-white">
          <div className="flex items-center justify-between">
            <button onClick={() => onSkip("cancelled")} className="p-2 hover:bg-white/10 rounded-full">
              <X className="w-6 h-6" />
            </button>
            <span className="font-medium">Meditacion breve</span>
            <span className="text-sm opacity-70">{formatTime(timeRemaining)}</span>
          </div>
          <div className="flex justify-center mt-2">
            <EmotionIndicator variant="dark" />
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center p-8">
          {/* Pulsing circle */}
          <div className="relative w-48 h-48 flex items-center justify-center mb-8">
            <div className="absolute w-full h-full rounded-full bg-white/10 animate-ping" style={{ animationDuration: "3s" }} />
            <div className="absolute w-full h-full rounded-full bg-white/20 animate-pulse" style={{ animationDuration: "4s" }} />
            <div className="w-3/4 h-3/4 rounded-full bg-white/30" />
          </div>

          <p className="text-white text-xl text-center max-w-xs mb-4 transition-opacity duration-500">
            {currentStep?.instruction}
          </p>

          {/* Progress dots */}
          <div className="flex gap-2 mt-4">
            {meditationSteps.map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition-colors ${
                  i <= meditationStepIndex ? "bg-white" : "bg-white/30"
                }`}
              />
            ))}
          </div>

          <div className="flex items-center gap-4 mt-8">
            <button
              onClick={() => setIsPaused(!isPaused)}
              className="p-4 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
            >
              {isPaused ? <Play className="w-6 h-6 text-white ml-0.5" /> : <Pause className="w-6 h-6 text-white" />}
            </button>
            <button
              onClick={handleFinishEarly}
              className="p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
            >
              <Check className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Movement
  if (intervention.type === "movement") {
    const currentExercise = movementExercises[movementIndex]

    return (
      <div className="fixed inset-0 bg-gradient-to-b from-orange-500 to-red-600 z-50 flex flex-col">
        <div className="flex flex-col p-4 text-white">
          <div className="flex items-center justify-between">
            <button onClick={() => onSkip("cancelled")} className="p-2 hover:bg-white/10 rounded-full">
              <X className="w-6 h-6" />
            </button>
            <span className="font-medium">Movimiento consciente</span>
            <span className="text-sm opacity-70">{formatTime(timeRemaining)}</span>
          </div>
          <div className="flex justify-center mt-2">
            <EmotionIndicator variant="dark" />
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center p-8">
          <div className="text-6xl mb-6">🧘</div>
          <p className="text-white text-2xl font-medium text-center mb-2">{currentExercise?.name}</p>
          <p className="text-white/80 text-center max-w-xs mb-8">{currentExercise?.instruction}</p>

          {/* Progress bar */}
          <div className="w-full max-w-xs h-2 bg-white/20 rounded-full overflow-hidden mb-4">
            <div 
              className="h-full bg-white transition-all duration-1000"
              style={{ width: `${(movementTime / (currentExercise?.duration || 30)) * 100}%` }}
            />
          </div>

          <p className="text-white/60 text-sm">
            Ejercicio {movementIndex + 1} de {movementExercises.length}
          </p>

          <div className="flex items-center gap-4 mt-8">
            <button
              onClick={() => setMovementIndex(i => Math.min(i + 1, movementExercises.length - 1))}
              className="px-6 py-2 bg-white/20 hover:bg-white/30 text-white rounded-xl transition-colors"
            >
              Saltar
            </button>
            <button
              onClick={handleFinishEarly}
              className="px-6 py-2 bg-white text-orange-600 font-medium rounded-xl hover:bg-white/90 transition-colors"
            >
              Finalizar
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Reframing
  if (intervention.type === "reframing") {
    const currentQuestion = reframingQuestions[reframingIndex]

    return (
      <div className="fixed inset-0 bg-gradient-to-b from-teal-600 to-teal-800 z-50 flex flex-col">
        <div className="flex flex-col p-4 text-white">
          <div className="flex items-center justify-between">
            <button onClick={() => onSkip("cancelled")} className="p-2 hover:bg-white/10 rounded-full">
              <X className="w-6 h-6" />
            </button>
            <span className="font-medium">Reencuadre cognitivo</span>
            <span className="text-sm opacity-70">{formatTime(timeRemaining)}</span>
          </div>
          <div className="flex justify-center mt-2">
            <EmotionIndicator variant="dark" />
          </div>
        </div>

        <div className="flex-1 flex flex-col p-6 overflow-y-auto">
          {/* Progress */}
          <div className="flex gap-1 mb-6">
            {reframingQuestions.map((_, i) => (
              <div
                key={i}
                className={`flex-1 h-1 rounded-full ${
                  i <= reframingIndex ? "bg-white" : "bg-white/30"
                }`}
              />
            ))}
          </div>

          <p className="text-white text-xl font-medium mb-2">{currentQuestion?.question}</p>
          <p className="text-white/60 text-sm mb-4">{currentQuestion?.hint}</p>

          <textarea
            value={reframingAnswers[reframingIndex] || ""}
            onChange={(e) => {
              const newAnswers = [...reframingAnswers]
              newAnswers[reframingIndex] = e.target.value
              setReframingAnswers(newAnswers)
            }}
            placeholder="Tu respuesta..."
            className="flex-1 min-h-[150px] w-full p-4 rounded-xl bg-white/10 text-white placeholder-white/40 border-0 focus:ring-2 focus:ring-white/30 focus:outline-none resize-none"
          />

          <div className="flex items-center justify-between mt-4">
            {reframingIndex > 0 && (
              <button
                onClick={() => setReframingIndex(i => i - 1)}
                className="text-white/70 hover:text-white"
              >
                ← Anterior
              </button>
            )}
            <div className="flex-1" />
            {reframingIndex < reframingQuestions.length - 1 ? (
              <button
                onClick={() => setReframingIndex(i => i + 1)}
                className="px-6 py-2 bg-white text-teal-700 font-medium rounded-xl hover:bg-white/90 transition-colors"
              >
                Siguiente →
              </button>
            ) : (
              <button
                onClick={handleFinishEarly}
                className="px-6 py-2 bg-white text-teal-700 font-medium rounded-xl hover:bg-white/90 transition-colors"
              >
                Finalizar
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Social contact (simple timer with suggestions)
  if (intervention.type === "social_contact") {
    return (
      <div className="fixed inset-0 bg-gradient-to-b from-pink-500 to-rose-600 z-50 flex flex-col">
        <div className="flex flex-col p-4 text-white">
          <div className="flex items-center justify-between">
            <button onClick={() => onSkip("cancelled")} className="p-2 hover:bg-white/10 rounded-full">
              <X className="w-6 h-6" />
            </button>
            <span className="font-medium">Contacto social</span>
            <span className="text-sm opacity-70">{formatTime(timeRemaining)}</span>
          </div>
          <div className="flex justify-center mt-2">
            <EmotionIndicator variant="dark" />
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center p-8">
          <div className="text-6xl mb-6">💬</div>
          <p className="text-white text-2xl font-medium text-center mb-4">
            Conecta con alguien
          </p>
          <p className="text-white/80 text-center max-w-xs mb-8">
            Llama, envía un mensaje o habla con alguien de confianza. Compartir cómo te sientes puede ayudarte.
          </p>

          <div className="w-full max-w-sm space-y-3">
            <div className="p-4 bg-white/20 rounded-xl">
              <p className="text-white/90 text-sm">💡 Ideas para empezar:</p>
              <ul className="text-white/70 text-sm mt-2 space-y-1">
                <li>• "Hola, ¿cómo estás? Pensé en ti"</li>
                <li>• "¿Tienes un momento para hablar?"</li>
                <li>• "Quería contarte cómo me siento"</li>
              </ul>
            </div>
          </div>

          <button
            onClick={handleFinishEarly}
            className="mt-8 px-8 py-3 bg-white text-rose-600 font-medium rounded-xl hover:bg-white/90 transition-colors"
          >
            He terminado
          </button>
        </div>
      </div>
    )
  }

  // Default fallback
  return (
    <div className="fixed inset-0 bg-gradient-to-b from-gray-600 to-gray-800 z-50 flex flex-col items-center justify-center">
      <p className="text-white text-xl">{intervention.name}</p>
      <p className="text-white/70 mt-2">{formatTime(timeRemaining)}</p>
      <button
        onClick={handleFinishEarly}
        className="mt-8 px-8 py-3 bg-white text-gray-900 font-medium rounded-xl"
      >
        Finalizar
      </button>
    </div>
  )
}

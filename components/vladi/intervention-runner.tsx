"use client"

import { useState, useEffect, useCallback } from "react"
import { X, Play, Pause, RotateCcw, Check } from "lucide-react"
import type { InterventionDefinition } from "@/lib/types/telemetry"

interface InterventionRunnerProps {
  intervention: InterventionDefinition
  onComplete: (intensityAfter: number, perceivedUtility: number) => void
  onSkip: (reason: string) => void
  onClose: () => void
}

export function InterventionRunner({
  intervention,
  onComplete,
  onSkip,
  onClose,
}: InterventionRunnerProps) {
  const [phase, setPhase] = useState<"running" | "rating">("running")
  const [timeRemaining, setTimeRemaining] = useState(intervention.duration_seconds)
  const [isPaused, setIsPaused] = useState(false)
  const [intensityAfter, setIntensityAfter] = useState(5)
  const [perceivedUtility, setPerceivedUtility] = useState(3)

  // Timer logic
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

  // Breathing animation for breathing exercises
  const isBreathing = intervention.type.startsWith("breathing")

  if (phase === "rating") {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white w-full max-w-md rounded-2xl overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold text-gray-900">
              ¿Cómo te sientes ahora?
            </h2>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Intensity rating */}
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
                <span className="text-2xl font-semibold text-gray-900">
                  {intensityAfter}
                </span>
              </div>
            </div>

            {/* Utility rating */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                ¿Te ha sido útil esta intervención?
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

          {/* Footer */}
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

  return (
    <div className="fixed inset-0 bg-gradient-to-b from-blue-600 to-blue-800 z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 text-white">
        <button
          onClick={() => onSkip("cancelled")}
          className="p-2 hover:bg-white/10 rounded-full transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
        <span className="font-medium">{intervention.name}</span>
        <div className="w-10" />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        {/* Timer circle */}
        <div className="relative w-64 h-64 mb-8">
          {/* Background circle */}
          <svg className="w-full h-full -rotate-90">
            <circle
              cx="128"
              cy="128"
              r="120"
              stroke="rgba(255,255,255,0.2)"
              strokeWidth="8"
              fill="none"
            />
            <circle
              cx="128"
              cy="128"
              r="120"
              stroke="white"
              strokeWidth="8"
              fill="none"
              strokeDasharray={2 * Math.PI * 120}
              strokeDashoffset={2 * Math.PI * 120 * (1 - progress)}
              strokeLinecap="round"
              className="transition-all duration-1000"
            />
          </svg>

          {/* Breathing animation overlay */}
          {isBreathing && !isPaused && (
            <div
              className="absolute inset-8 rounded-full bg-white/20 animate-pulse"
              style={{
                animationDuration:
                  intervention.type === "breathing_478" ? "19s" : "16s",
              }}
            />
          )}

          {/* Timer text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-5xl font-light text-white">
              {formatTime(timeRemaining)}
            </span>
            {isPaused && (
              <span className="text-sm text-white/70 mt-2">En pausa</span>
            )}
          </div>
        </div>

        {/* Instructions */}
        <p className="text-white/80 text-center text-lg mb-8 max-w-xs">
          {intervention.description}
        </p>

        {/* Controls */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setTimeRemaining(intervention.duration_seconds)}
            className="p-4 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
          >
            <RotateCcw className="w-6 h-6 text-white" />
          </button>

          <button
            onClick={() => setIsPaused(!isPaused)}
            className="p-6 bg-white hover:bg-white/90 rounded-full transition-colors"
          >
            {isPaused ? (
              <Play className="w-8 h-8 text-blue-600 ml-1" />
            ) : (
              <Pause className="w-8 h-8 text-blue-600" />
            )}
          </button>

          <button
            onClick={handleFinishEarly}
            className="p-4 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
          >
            <Check className="w-6 h-6 text-white" />
          </button>
        </div>
      </div>

      {/* Footer hint */}
      <div className="p-6 text-center">
        <p className="text-white/50 text-sm">
          Toca el check para terminar antes
        </p>
      </div>
    </div>
  )
}

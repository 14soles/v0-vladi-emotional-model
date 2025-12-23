"use client"

import { useState, useEffect, useCallback } from "react"
import { motion } from "framer-motion"
import { Play, Pause, RotateCcw, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

interface BreathingExerciseProps {
  onComplete: () => void
  technique?: "4-7-8" | "box" | "calm"
}

type Phase = "inhale" | "hold" | "exhale" | "holdEmpty"

const TECHNIQUES = {
  "4-7-8": {
    name: "Técnica 4-7-8",
    description: "Ideal para calmar la ansiedad",
    phases: [
      { type: "inhale" as Phase, duration: 4, label: "Inhala" },
      { type: "hold" as Phase, duration: 7, label: "Mantén" },
      { type: "exhale" as Phase, duration: 8, label: "Exhala" },
    ],
    cycles: 4,
  },
  box: {
    name: "Respiración Cuadrada",
    description: "Equilibra tu sistema nervioso",
    phases: [
      { type: "inhale" as Phase, duration: 4, label: "Inhala" },
      { type: "hold" as Phase, duration: 4, label: "Mantén" },
      { type: "exhale" as Phase, duration: 4, label: "Exhala" },
      { type: "holdEmpty" as Phase, duration: 4, label: "Pausa" },
    ],
    cycles: 4,
  },
  calm: {
    name: "Respiración Calmante",
    description: "Suave y relajante",
    phases: [
      { type: "inhale" as Phase, duration: 4, label: "Inhala" },
      { type: "exhale" as Phase, duration: 6, label: "Exhala" },
    ],
    cycles: 6,
  },
}

export function BreathingExercise({ onComplete, technique = "4-7-8" }: BreathingExerciseProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0)
  const [currentCycle, setCurrentCycle] = useState(1)
  const [timeLeft, setTimeLeft] = useState(0)
  const [isComplete, setIsComplete] = useState(false)

  const config = TECHNIQUES[technique]
  const currentPhase = config.phases[currentPhaseIndex]

  const startExercise = () => {
    setIsPlaying(true)
    setCurrentPhaseIndex(0)
    setCurrentCycle(1)
    setTimeLeft(config.phases[0].duration)
    setIsComplete(false)
  }

  const resetExercise = () => {
    setIsPlaying(false)
    setCurrentPhaseIndex(0)
    setCurrentCycle(1)
    setTimeLeft(0)
    setIsComplete(false)
  }

  const nextPhase = useCallback(() => {
    const nextIndex = (currentPhaseIndex + 1) % config.phases.length
    if (nextIndex === 0) {
      if (currentCycle >= config.cycles) {
        setIsPlaying(false)
        setIsComplete(true)
        return
      }
      setCurrentCycle((c) => c + 1)
    }
    setCurrentPhaseIndex(nextIndex)
    setTimeLeft(config.phases[nextIndex].duration)
  }, [currentPhaseIndex, currentCycle, config.phases, config.cycles])

  useEffect(() => {
    if (!isPlaying) return

    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          nextPhase()
          return 0
        }
        return t - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [isPlaying, nextPhase])

  const getCircleScale = () => {
    if (!isPlaying && !isComplete) return 1
    switch (currentPhase?.type) {
      case "inhale":
        return 1.4
      case "hold":
        return 1.4
      case "exhale":
        return 1
      case "holdEmpty":
        return 1
      default:
        return 1
    }
  }

  const getCircleColor = () => {
    switch (currentPhase?.type) {
      case "inhale":
        return "bg-chart-2/30 border-chart-2"
      case "hold":
        return "bg-chart-4/30 border-chart-4"
      case "exhale":
        return "bg-chart-1/30 border-chart-1"
      case "holdEmpty":
        return "bg-chart-3/30 border-chart-3"
      default:
        return "bg-primary/20 border-primary"
    }
  }

  return (
    <Card className="border-0 shadow-lg">
      <CardContent className="p-8">
        <div className="text-center space-y-2 mb-8">
          <h3 className="text-xl font-semibold text-foreground">{config.name}</h3>
          <p className="text-sm text-muted-foreground">{config.description}</p>
        </div>

        {/* Breathing circle */}
        <div className="flex justify-center mb-8">
          <motion.div
            animate={{ scale: getCircleScale() }}
            transition={{ duration: currentPhase?.duration || 1, ease: "easeInOut" }}
            className={`w-48 h-48 rounded-full border-4 flex items-center justify-center ${getCircleColor()}`}
          >
            <div className="text-center">
              {isPlaying ? (
                <>
                  <p className="text-2xl font-bold text-foreground">{currentPhase?.label}</p>
                  <p className="text-4xl font-bold text-primary mt-2">{timeLeft}</p>
                </>
              ) : isComplete ? (
                <>
                  <Check className="h-12 w-12 text-green-500 mx-auto" />
                  <p className="text-lg font-medium text-foreground mt-2">Completado</p>
                </>
              ) : (
                <p className="text-lg text-muted-foreground">Presiona play</p>
              )}
            </div>
          </motion.div>
        </div>

        {/* Progress */}
        {isPlaying && (
          <div className="text-center mb-6">
            <p className="text-sm text-muted-foreground">
              Ciclo {currentCycle} de {config.cycles}
            </p>
            <div className="flex justify-center gap-2 mt-2">
              {Array.from({ length: config.cycles }).map((_, i) => (
                <div key={i} className={`h-2 w-8 rounded-full ${i < currentCycle ? "bg-primary" : "bg-secondary"}`} />
              ))}
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="flex justify-center gap-4">
          {!isPlaying && !isComplete && (
            <Button onClick={startExercise} size="lg" className="gap-2">
              <Play className="h-5 w-5" />
              Comenzar
            </Button>
          )}

          {isPlaying && (
            <>
              <Button variant="outline" onClick={() => setIsPlaying(false)} size="lg" className="gap-2">
                <Pause className="h-5 w-5" />
                Pausar
              </Button>
              <Button variant="ghost" onClick={resetExercise} size="lg">
                <RotateCcw className="h-5 w-5" />
              </Button>
            </>
          )}

          {isComplete && (
            <>
              <Button variant="outline" onClick={resetExercise} size="lg" className="gap-2 bg-transparent">
                <RotateCcw className="h-5 w-5" />
                Repetir
              </Button>
              <Button onClick={onComplete} size="lg" className="gap-2">
                <Check className="h-5 w-5" />
                Continuar
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

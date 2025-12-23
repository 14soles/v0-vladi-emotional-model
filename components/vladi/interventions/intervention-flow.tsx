"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeft, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { InterventionSelector } from "./intervention-selector"
import { BreathingExercise } from "./breathing-exercise"
import { GroundingExercise } from "./grounding-exercise"
import { ReframeExercise } from "./reframe-exercise"
import { GratitudeExercise } from "./gratitude-exercise"
import { IntensitySlider } from "../intensity-slider"
import type { Intervention } from "@/lib/vladi-types"
import { useVladiStore } from "@/lib/vladi-store"

interface InterventionFlowProps {
  initialIntensity: number
  emotionLabel: string
  onComplete: (deltaIntensity: number) => void
  onCancel: () => void
}

type Step = "select" | "exercise" | "measure"

export function InterventionFlow({ initialIntensity, emotionLabel, onComplete, onCancel }: InterventionFlowProps) {
  const [step, setStep] = useState<Step>("select")
  const [selectedIntervention, setSelectedIntervention] = useState<Intervention | null>(null)
  const [finalIntensity, setFinalIntensity] = useState(initialIntensity)

  const { updateCheckIn } = useVladiStore()

  const getRecommendedType = () => {
    if (initialIntensity >= 8) return "respiración"
    if (initialIntensity >= 6) return "grounding"
    return "gratitud"
  }

  const handleSelectIntervention = (intervention: Intervention) => {
    setSelectedIntervention(intervention)
    setStep("exercise")
  }

  const handleExerciseComplete = () => {
    setStep("measure")
  }

  const handleComplete = () => {
    const delta = initialIntensity - finalIntensity
    updateCheckIn({
      interventionId: selectedIntervention?.id,
      intensityAfter: finalIntensity,
    })
    onComplete(delta)
  }

  const renderExercise = () => {
    if (!selectedIntervention) return null

    switch (selectedIntervention.type) {
      case "respiración":
        return <BreathingExercise onComplete={handleExerciseComplete} />
      case "grounding":
        return <GroundingExercise onComplete={handleExerciseComplete} />
      case "reencuadre":
        return <ReframeExercise onComplete={handleExerciseComplete} />
      case "gratitud":
        return <GratitudeExercise onComplete={handleExerciseComplete} />
      case "mindfulness":
        return <BreathingExercise onComplete={handleExerciseComplete} technique="calm" />
      default:
        return <BreathingExercise onComplete={handleExerciseComplete} />
    }
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={step === "select" ? onCancel : () => setStep("select")}
            className="text-muted-foreground hover:text-foreground"
          >
            {step === "select" ? <X className="h-5 w-5" /> : <ArrowLeft className="h-5 w-5" />}
          </Button>
          <h2 className="text-lg font-semibold text-foreground">
            {step === "select"
              ? "Herramientas"
              : step === "exercise"
                ? selectedIntervention?.name
                : "¿Cómo te sientes ahora?"}
          </h2>
          <div className="w-10" />
        </div>

        <AnimatePresence mode="wait">
          {step === "select" && (
            <motion.div
              key="select"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <InterventionSelector onSelect={handleSelectIntervention} recommendedType={getRecommendedType()} />
            </motion.div>
          )}

          {step === "exercise" && (
            <motion.div
              key="exercise"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              {renderExercise()}
            </motion.div>
          )}

          {step === "measure" && (
            <motion.div
              key="measure"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <Card className="border-0 shadow-lg">
                <CardContent className="p-8 space-y-8">
                  <div className="text-center">
                    <h3 className="text-xl font-semibold text-foreground">¿Cómo te sientes ahora?</h3>
                    <p className="text-muted-foreground mt-2">
                      Antes sentías <span className="font-medium">{emotionLabel}</span> con intensidad{" "}
                      <span className="font-bold text-primary">{initialIntensity}/10</span>
                    </p>
                  </div>

                  <IntensitySlider value={finalIntensity} onChange={setFinalIntensity} label="Intensidad actual" />

                  {/* Delta feedback */}
                  <div
                    className={`p-4 rounded-xl text-center ${
                      finalIntensity < initialIntensity
                        ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                        : finalIntensity === initialIntensity
                          ? "bg-secondary text-muted-foreground"
                          : "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300"
                    }`}
                  >
                    {finalIntensity < initialIntensity ? (
                      <p>
                        Tu intensidad bajó <strong>{initialIntensity - finalIntensity} puntos</strong>. La intervención
                        te ayudó.
                      </p>
                    ) : finalIntensity === initialIntensity ? (
                      <p>Tu intensidad se mantiene igual. A veces el efecto tarda un poco más.</p>
                    ) : (
                      <p>Tu intensidad subió. Esto puede pasar al conectar con las emociones. Es parte del proceso.</p>
                    )}
                  </div>

                  <Button onClick={handleComplete} size="lg" className="w-full">
                    Guardar y continuar
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

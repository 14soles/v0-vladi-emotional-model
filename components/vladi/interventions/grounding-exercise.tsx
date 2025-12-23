"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Eye, Hand, Ear, Wind, Cookie, Check, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"

interface GroundingExerciseProps {
  onComplete: () => void
}

const SENSES = [
  { count: 5, sense: "ver", icon: Eye, color: "text-blue-500", prompt: "Nombra 5 cosas que puedes VER ahora mismo" },
  { count: 4, sense: "tocar", icon: Hand, color: "text-green-500", prompt: "Nombra 4 cosas que puedes TOCAR" },
  { count: 3, sense: "oír", icon: Ear, color: "text-purple-500", prompt: "Nombra 3 cosas que puedes OÍR" },
  { count: 2, sense: "oler", icon: Wind, color: "text-orange-500", prompt: "Nombra 2 cosas que puedes OLER" },
  { count: 1, sense: "saborear", icon: Cookie, color: "text-pink-500", prompt: "Nombra 1 cosa que puedes SABOREAR" },
]

export function GroundingExercise({ onComplete }: GroundingExerciseProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [responses, setResponses] = useState<string[]>(["", "", "", "", ""])
  const [isComplete, setIsComplete] = useState(false)

  const currentSense = SENSES[currentStep]
  const Icon = currentSense?.icon

  const handleNext = () => {
    if (currentStep < SENSES.length - 1) {
      setCurrentStep((s) => s + 1)
    } else {
      setIsComplete(true)
    }
  }

  const updateResponse = (value: string) => {
    const newResponses = [...responses]
    newResponses[currentStep] = value
    setResponses(newResponses)
  }

  if (isComplete) {
    return (
      <Card className="border-0 shadow-lg">
        <CardContent className="p-8 text-center space-y-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto"
          >
            <Check className="h-10 w-10 text-green-500" />
          </motion.div>

          <div>
            <h3 className="text-xl font-semibold text-foreground">Ejercicio completado</h3>
            <p className="text-muted-foreground mt-2">
              Ahora estás más conectado con el presente. Tus sentidos te anclan al aquí y ahora.
            </p>
          </div>

          <Button onClick={onComplete} size="lg" className="gap-2">
            <Check className="h-5 w-5" />
            Continuar
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-0 shadow-lg">
      <CardContent className="p-8">
        <div className="text-center mb-6">
          <h3 className="text-xl font-semibold text-foreground">Técnica 5-4-3-2-1</h3>
          <p className="text-sm text-muted-foreground mt-1">Conecta con tus sentidos para anclarte al presente</p>
        </div>

        {/* Progress */}
        <div className="flex justify-center gap-2 mb-8">
          {SENSES.map((s, i) => {
            const SenseIcon = s.icon
            return (
              <div
                key={i}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                  i < currentStep
                    ? "bg-green-100 dark:bg-green-900/30"
                    : i === currentStep
                      ? "bg-primary/20 ring-2 ring-primary"
                      : "bg-secondary"
                }`}
              >
                {i < currentStep ? (
                  <Check className="h-5 w-5 text-green-500" />
                ) : (
                  <SenseIcon className={`h-5 w-5 ${i === currentStep ? s.color : "text-muted-foreground"}`} />
                )}
              </div>
            )
          })}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            {/* Current sense */}
            <div className="text-center">
              <div
                className={`w-16 h-16 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4 ${currentSense.color}`}
              >
                <Icon className="h-8 w-8" />
              </div>
              <p className="text-lg font-medium text-foreground">{currentSense.prompt}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {currentSense.count} {currentSense.count === 1 ? "cosa" : "cosas"}
              </p>
            </div>

            {/* Input */}
            <Textarea
              value={responses[currentStep]}
              onChange={(e) => updateResponse(e.target.value)}
              placeholder={`Escribe lo que puedes ${currentSense.sense}...`}
              className="min-h-[100px] resize-none"
            />

            {/* Action */}
            <Button onClick={handleNext} className="w-full gap-2" size="lg">
              {currentStep < SENSES.length - 1 ? (
                <>
                  Siguiente
                  <ArrowRight className="h-5 w-5" />
                </>
              ) : (
                <>
                  Completar
                  <Check className="h-5 w-5" />
                </>
              )}
            </Button>
          </motion.div>
        </AnimatePresence>
      </CardContent>
    </Card>
  )
}

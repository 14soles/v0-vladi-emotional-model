"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { RefreshCw, Lightbulb, Check, ArrowRight, Brain } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"

interface ReframeExerciseProps {
  onComplete: () => void
  initialThought?: string
}

const REFRAME_QUESTIONS = [
  {
    question: "¿Cuál es el pensamiento que te preocupa?",
    placeholder: "Escribe el pensamiento o situación que te genera malestar...",
    tip: "Sé específico: en lugar de 'todo va mal', describe qué exactamente.",
  },
  {
    question: "¿Qué evidencia apoya este pensamiento?",
    placeholder: "¿Qué hechos concretos respaldan esta idea?",
    tip: "Distingue entre hechos objetivos y interpretaciones.",
  },
  {
    question: "¿Qué evidencia contradice este pensamiento?",
    placeholder: "¿Hay algo que sugiera que las cosas no son tan absolutas?",
    tip: "Piensa en excepciones, logros pasados o perspectivas de otros.",
  },
  {
    question: "¿Cómo lo vería un amigo que te quiere?",
    placeholder: "Si tu mejor amigo estuviera en esta situación, ¿qué le dirías?",
    tip: "Solemos ser más compasivos con otros que con nosotros mismos.",
  },
  {
    question: "¿Cuál es una perspectiva más equilibrada?",
    placeholder: "Reescribe el pensamiento de forma más realista y compasiva...",
    tip: "No se trata de ser positivo, sino de ser justo contigo mismo.",
  },
]

export function ReframeExercise({ onComplete, initialThought = "" }: ReframeExerciseProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [responses, setResponses] = useState<string[]>([initialThought, "", "", "", ""])
  const [isComplete, setIsComplete] = useState(false)

  const currentQuestion = REFRAME_QUESTIONS[currentStep]

  const handleNext = () => {
    if (currentStep < REFRAME_QUESTIONS.length - 1) {
      setCurrentStep((s) => s + 1)
    } else {
      setIsComplete(true)
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((s) => s - 1)
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
        <CardContent className="p-8 space-y-6">
          <div className="text-center">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4"
            >
              <Lightbulb className="h-10 w-10 text-primary" />
            </motion.div>
            <h3 className="text-xl font-semibold text-foreground">Reencuadre completado</h3>
            <p className="text-muted-foreground mt-2">Has transformado tu perspectiva</p>
          </div>

          {/* Summary */}
          <div className="space-y-4 bg-secondary/50 rounded-xl p-4">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Pensamiento original</p>
              <p className="text-sm text-foreground mt-1 italic">{responses[0]}</p>
            </div>
            <div className="flex justify-center">
              <RefreshCw className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Nueva perspectiva</p>
              <p className="text-sm text-foreground mt-1 font-medium">{responses[4]}</p>
            </div>
          </div>

          <Button onClick={onComplete} size="lg" className="w-full gap-2">
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
          <Brain className="h-8 w-8 text-primary mx-auto mb-2" />
          <h3 className="text-xl font-semibold text-foreground">Reencuadre Cognitivo</h3>
          <p className="text-sm text-muted-foreground mt-1">Cambia la forma de ver la situación</p>
        </div>

        {/* Progress */}
        <div className="flex justify-center gap-2 mb-8">
          {REFRAME_QUESTIONS.map((_, i) => (
            <div
              key={i}
              className={`h-2 flex-1 max-w-12 rounded-full transition-all ${
                i <= currentStep ? "bg-primary" : "bg-secondary"
              }`}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            <div>
              <p className="text-lg font-medium text-foreground">{currentQuestion.question}</p>
              <p className="text-sm text-muted-foreground mt-1">{currentQuestion.tip}</p>
            </div>

            <Textarea
              value={responses[currentStep]}
              onChange={(e) => updateResponse(e.target.value)}
              placeholder={currentQuestion.placeholder}
              className="min-h-[120px] resize-none"
            />

            <div className="flex gap-3">
              {currentStep > 0 && (
                <Button variant="outline" onClick={handleBack} className="flex-1 bg-transparent">
                  Atrás
                </Button>
              )}
              <Button onClick={handleNext} disabled={!responses[currentStep].trim()} className="flex-1 gap-2">
                {currentStep < REFRAME_QUESTIONS.length - 1 ? (
                  <>
                    Siguiente
                    <ArrowRight className="h-4 w-4" />
                  </>
                ) : (
                  <>
                    Completar
                    <Check className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        </AnimatePresence>
      </CardContent>
    </Card>
  )
}

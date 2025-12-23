"use client"

import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeft, ArrowRight, Check, X, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { EmotionPicker } from "./emotion-picker"
import { IntensitySlider } from "./intensity-slider"
import { ContextPicker } from "./context-picker"
import { InterventionFlow } from "./interventions/intervention-flow"
import { useCheckInFlow, type CheckInStep } from "@/lib/hooks"

interface CheckInFlowProps {
  onComplete: () => void
  onCancel: () => void
}

export function CheckInFlow({ onComplete, onCancel }: CheckInFlowProps) {
  const {
    step,
    state,
    steps,
    currentStepIndex,
    canProceed,
    setEmotion,
    setIntensity,
    setContext,
    setContextText,
    setInterventionDelta,
    nextStep,
    previousStep,
    goToStep,
  } = useCheckInFlow()

  const stepTitles: Record<CheckInStep, string> = {
    emotion: "¿Cómo te sientes?",
    intensity: "¿Qué tan intenso es?",
    context: "¿Qué lo provocó?",
    summary: "Tu check-in",
    intervention: "Herramientas",
    complete: "Completado",
  }

  // Show intervention flow
  if (step === "intervention") {
    return (
      <InterventionFlow
        initialIntensity={state.intensity}
        emotionLabel={state.selectedEmotion?.label || ""}
        onComplete={(delta) => {
          setInterventionDelta(delta)
          goToStep("complete")
        }}
        onCancel={() => goToStep("complete")}
      />
    )
  }

  // Completion screen
  if (step === "complete") {
    return <CompletionScreen delta={state.interventionDelta} onComplete={onComplete} />
  }

  return (
    <Card className="w-full max-w-lg mx-auto border-0 shadow-xl bg-card">
      <CardContent className="p-6">
        {/* Header */}
        <CheckInHeader
          currentStepIndex={currentStepIndex}
          steps={steps}
          onBack={currentStepIndex === 0 ? onCancel : previousStep}
          onCancel={onCancel}
        />

        {/* Title */}
        <motion.h2
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-xl font-semibold text-center mb-6 text-foreground"
        >
          {stepTitles[step]}
        </motion.h2>

        {/* Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.2 }}
            className="min-h-[300px]"
          >
            {step === "emotion" && <EmotionPicker selectedEmotion={state.selectedEmotion} onSelect={setEmotion} />}

            {step === "intensity" && (
              <div className="space-y-8 py-8">
                <div className="text-center">
                  <span className="text-6xl">{state.selectedEmotion?.icon}</span>
                  <p className="mt-4 text-lg capitalize font-medium text-foreground">{state.selectedEmotion?.label}</p>
                </div>
                <IntensitySlider value={state.intensity} onChange={setIntensity} />
              </div>
            )}

            {step === "context" && (
              <ContextPicker
                selectedContext={state.context}
                contextText={state.contextText}
                onContextSelect={setContext}
                onTextChange={setContextText}
              />
            )}

            {step === "summary" && <SummaryView state={state} />}
          </motion.div>
        </AnimatePresence>

        {/* Actions */}
        <div className="mt-6">
          <Button onClick={nextStep} disabled={!canProceed()} className="w-full h-12 text-base">
            {step === "summary" ? (
              <>
                <Check className="mr-2 h-5 w-5" />
                {state.intensity >= 6 && state.selectedEmotion?.valence === "negative"
                  ? "Continuar a herramientas"
                  : "Completar Check-in"}
              </>
            ) : (
              <>
                Continuar
                <ArrowRight className="ml-2 h-5 w-5" />
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function CheckInHeader({
  currentStepIndex,
  steps,
  onBack,
  onCancel,
}: {
  currentStepIndex: number
  steps: CheckInStep[]
  onBack: () => void
  onCancel: () => void
}) {
  return (
    <div className="flex items-center justify-between mb-6">
      <Button variant="ghost" size="icon" onClick={onBack} className="text-muted-foreground hover:text-foreground">
        {currentStepIndex === 0 ? <X className="h-5 w-5" /> : <ArrowLeft className="h-5 w-5" />}
      </Button>

      <div className="flex gap-2">
        {steps.map((s, i) => (
          <div
            key={s}
            className={`h-2 w-8 rounded-full transition-all ${i <= currentStepIndex ? "bg-primary" : "bg-secondary"}`}
          />
        ))}
      </div>

      <Button variant="ghost" size="icon" onClick={onCancel} className="text-muted-foreground hover:text-foreground">
        <X className="h-5 w-5" />
      </Button>
    </div>
  )
}

function SummaryView({ state }: { state: any }) {
  return (
    <div className="text-center space-y-6 py-4">
      <div className="p-6 rounded-2xl bg-primary/5 border border-primary/20">
        <span className="text-5xl">{state.selectedEmotion?.icon}</span>
        <p className="mt-4 text-xl capitalize font-semibold text-foreground">{state.selectedEmotion?.label}</p>
        <p className="text-muted-foreground mt-1">Intensidad: {state.intensity}/10</p>
        {state.context && <p className="text-sm text-muted-foreground mt-2">Contexto: {state.context}</p>}
      </div>

      {state.intensity >= 6 && state.selectedEmotion?.valence === "negative" && (
        <div className="p-4 rounded-xl bg-accent/20 text-accent-foreground">
          <p className="text-sm">
            <Sparkles className="h-4 w-4 inline mr-1" />
            Te ofreceremos una herramienta para ayudarte a regular esta emoción
          </p>
        </div>
      )}
    </div>
  )
}

function CompletionScreen({ delta, onComplete }: { delta: number | null; onComplete: () => void }) {
  return (
    <div className="min-h-screen bg-background p-4 flex items-center justify-center">
      <Card className="w-full max-w-lg border-0 shadow-xl">
        <CardContent className="p-8 text-center space-y-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto"
          >
            <Check className="h-10 w-10 text-primary" />
          </motion.div>

          <div>
            <h2 className="text-2xl font-bold text-foreground">Check-in completado</h2>
            <p className="text-muted-foreground mt-2">
              Has registrado cómo te sientes. Esto alimenta tu perfil DEAM EQ.
            </p>
          </div>

          {delta !== null && delta > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-xl bg-green-100 dark:bg-green-900/30"
            >
              <p className="text-green-700 dark:text-green-300">
                <Sparkles className="h-5 w-5 inline mr-2" />
                La intervención redujo tu intensidad en <strong>{delta} puntos</strong>
              </p>
            </motion.div>
          )}

          <Button onClick={onComplete} size="lg" className="w-full">
            Volver al inicio
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

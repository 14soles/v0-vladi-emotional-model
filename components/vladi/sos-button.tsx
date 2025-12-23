"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { AlertTriangle, Heart, Wind, X, Phone, MessageCircle, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

interface SOSButtonProps {
  onActivate?: () => void
}

type SOSPhase = "breathing" | "grounding" | "affirmations" | "resources"

const AFFIRMATIONS = [
  "Esto también pasará",
  "Estás a salvo en este momento",
  "Has superado momentos difíciles antes",
  "Tus emociones son válidas",
  "No estás solo en esto",
  "Un paso a la vez",
]

const GROUNDING_PROMPTS = [
  "Nombra 5 cosas que puedes ver",
  "Toca algo cerca de ti y siente su textura",
  "Escucha 3 sonidos diferentes",
  "Siente tus pies en el suelo",
  "Respira lentamente",
]

export function SOSButton({ onActivate }: SOSButtonProps) {
  const [isActive, setIsActive] = useState(false)
  const [phase, setPhase] = useState<SOSPhase>("breathing")
  const [breathPhase, setBreathPhase] = useState<"inhale" | "hold" | "exhale">("inhale")
  const [breathCount, setBreathCount] = useState(0)
  const [groundingStep, setGroundingStep] = useState(0)
  const [currentAffirmation, setCurrentAffirmation] = useState(0)

  const handleActivate = () => {
    setIsActive(true)
    setPhase("breathing")
    setBreathCount(0)
    setBreathPhase("inhale")
    setGroundingStep(0)
    setCurrentAffirmation(0)
    onActivate?.()
  }

  const handleClose = () => {
    setIsActive(false)
    setPhase("breathing")
    setBreathCount(0)
  }

  // Breathing exercise logic
  useEffect(() => {
    if (!isActive || phase !== "breathing") return

    const phases: ("inhale" | "hold" | "exhale")[] = ["inhale", "hold", "exhale"]
    let phaseIndex = 0

    const interval = setInterval(() => {
      phaseIndex = (phaseIndex + 1) % 3
      setBreathPhase(phases[phaseIndex])

      if (phaseIndex === 0) {
        setBreathCount((prev) => {
          if (prev >= 3) {
            clearInterval(interval)
            setTimeout(() => setPhase("grounding"), 1000)
            return prev
          }
          return prev + 1
        })
      }
    }, 4000)

    return () => clearInterval(interval)
  }, [isActive, phase])

  // Affirmation rotation
  useEffect(() => {
    if (!isActive || phase !== "affirmations") return

    const interval = setInterval(() => {
      setCurrentAffirmation((prev) => (prev + 1) % AFFIRMATIONS.length)
    }, 4000)

    return () => clearInterval(interval)
  }, [isActive, phase])

  const breathText = {
    inhale: "Inhala profundamente...",
    hold: "Mantén el aire...",
    exhale: "Exhala lentamente...",
  }

  const getBreathScale = () => {
    switch (breathPhase) {
      case "inhale":
        return 1.4
      case "hold":
        return 1.4
      case "exhale":
        return 1
      default:
        return 1
    }
  }

  return (
    <>
      {/* SOS Floating Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleActivate}
        className="fixed bottom-24 right-6 z-50 w-16 h-16 rounded-full bg-sos text-sos-foreground shadow-lg flex items-center justify-center"
        aria-label="Botón de emergencia SOS"
      >
        <AlertTriangle className="h-8 w-8" />
      </motion.button>

      {/* SOS Full Screen Modal */}
      <AnimatePresence>
        {isActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-background flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-2 text-sos">
                <AlertTriangle className="h-5 w-5" />
                <span className="font-semibold">Modo SOS</span>
              </div>
              <Button variant="ghost" size="icon" onClick={handleClose}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <AnimatePresence mode="wait">
                {/* Phase 1: Breathing */}
                {phase === "breathing" && (
                  <motion.div
                    key="breathing"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="flex flex-col items-center justify-center min-h-[60vh] text-center"
                  >
                    <p className="text-muted-foreground mb-8">Primero, vamos a calmar tu sistema nervioso</p>

                    <motion.div
                      animate={{ scale: getBreathScale() }}
                      transition={{ duration: 4, ease: "easeInOut" }}
                      className="w-40 h-40 rounded-full bg-primary/20 border-4 border-primary flex items-center justify-center mb-8"
                    >
                      <Wind className="h-16 w-16 text-primary" />
                    </motion.div>

                    <h2 className="text-2xl font-semibold text-foreground mb-2">{breathText[breathPhase]}</h2>
                    <p className="text-muted-foreground">Respiración {breathCount + 1} de 4</p>

                    <div className="flex gap-2 mt-6">
                      {[0, 1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className={`h-2 w-8 rounded-full transition-all ${
                            i <= breathCount ? "bg-primary" : "bg-secondary"
                          }`}
                        />
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Phase 2: Grounding */}
                {phase === "grounding" && (
                  <motion.div
                    key="grounding"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="flex flex-col items-center text-center"
                  >
                    <h2 className="text-xl font-semibold text-foreground mb-2">Conecta con el presente</h2>
                    <p className="text-muted-foreground mb-8">Ancla tu mente al aquí y ahora</p>

                    <Card className="w-full max-w-sm border-0 shadow-lg mb-6">
                      <CardContent className="p-6">
                        <AnimatePresence mode="wait">
                          <motion.p
                            key={groundingStep}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="text-lg text-foreground"
                          >
                            {GROUNDING_PROMPTS[groundingStep]}
                          </motion.p>
                        </AnimatePresence>
                      </CardContent>
                    </Card>

                    <div className="flex gap-2 mb-6">
                      {GROUNDING_PROMPTS.map((_, i) => (
                        <div
                          key={i}
                          className={`h-2 w-6 rounded-full transition-all ${
                            i <= groundingStep ? "bg-primary" : "bg-secondary"
                          }`}
                        />
                      ))}
                    </div>

                    <Button
                      onClick={() => {
                        if (groundingStep < GROUNDING_PROMPTS.length - 1) {
                          setGroundingStep((s) => s + 1)
                        } else {
                          setPhase("affirmations")
                        }
                      }}
                      className="gap-2"
                    >
                      {groundingStep < GROUNDING_PROMPTS.length - 1 ? "Siguiente" : "Continuar"}
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </motion.div>
                )}

                {/* Phase 3: Affirmations */}
                {phase === "affirmations" && (
                  <motion.div
                    key="affirmations"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="flex flex-col items-center justify-center min-h-[50vh] text-center"
                  >
                    <Heart className="h-12 w-12 text-pink-500 mb-6" />
                    <h2 className="text-lg text-muted-foreground mb-4">Recuerda...</h2>

                    <AnimatePresence mode="wait">
                      <motion.p
                        key={currentAffirmation}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="text-2xl font-semibold text-foreground max-w-xs"
                      >
                        {AFFIRMATIONS[currentAffirmation]}
                      </motion.p>
                    </AnimatePresence>

                    <div className="mt-12 space-y-3 w-full max-w-sm">
                      <Button
                        onClick={() => setPhase("resources")}
                        variant="outline"
                        className="w-full gap-2 bg-transparent"
                      >
                        Necesito más ayuda
                      </Button>
                      <Button onClick={handleClose} className="w-full gap-2">
                        <Heart className="h-4 w-4" />
                        Estoy mejor
                      </Button>
                    </div>
                  </motion.div>
                )}

                {/* Phase 4: Resources */}
                {phase === "resources" && (
                  <motion.div
                    key="resources"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="space-y-6"
                  >
                    <div className="text-center">
                      <h2 className="text-xl font-semibold text-foreground">Recursos de ayuda</h2>
                      <p className="text-muted-foreground mt-1">No estás solo. Hay personas que pueden ayudarte.</p>
                    </div>

                    <Card className="border-0 shadow-sm">
                      <CardContent className="p-4 space-y-4">
                        <div className="flex items-center gap-4 p-3 bg-secondary/50 rounded-lg">
                          <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                            <Phone className="h-5 w-5 text-green-500" />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-foreground">Teléfono de la Esperanza</p>
                            <p className="text-sm text-muted-foreground">717 003 717 (24h)</p>
                          </div>
                          <Button size="sm" variant="ghost" asChild>
                            <a href="tel:717003717">Llamar</a>
                          </Button>
                        </div>

                        <div className="flex items-center gap-4 p-3 bg-secondary/50 rounded-lg">
                          <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                            <MessageCircle className="h-5 w-5 text-blue-500" />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-foreground">ANAR (menores)</p>
                            <p className="text-sm text-muted-foreground">900 20 20 10</p>
                          </div>
                          <Button size="sm" variant="ghost" asChild>
                            <a href="tel:900202010">Llamar</a>
                          </Button>
                        </div>

                        <div className="flex items-center gap-4 p-3 bg-secondary/50 rounded-lg">
                          <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                            <AlertTriangle className="h-5 w-5 text-red-500" />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-foreground">Emergencias</p>
                            <p className="text-sm text-muted-foreground">112</p>
                          </div>
                          <Button size="sm" variant="ghost" asChild>
                            <a href="tel:112">Llamar</a>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>

                    <div className="p-4 bg-primary/5 rounded-xl text-center">
                      <p className="text-sm text-muted-foreground">
                        Si estás en peligro inmediato o tienes pensamientos de hacerte daño, por favor contacta con los
                        servicios de emergencia o acude a urgencias.
                      </p>
                    </div>

                    <Button onClick={handleClose} className="w-full">
                      Volver a la app
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

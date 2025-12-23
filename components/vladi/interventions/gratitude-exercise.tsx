"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Heart, Sparkles, Check, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

interface GratitudeExerciseProps {
  onComplete: () => void
}

export function GratitudeExercise({ onComplete }: GratitudeExerciseProps) {
  const [gratitudes, setGratitudes] = useState<string[]>(["", "", ""])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isComplete, setIsComplete] = useState(false)

  const handleAdd = () => {
    if (gratitudes[currentIndex].trim()) {
      if (currentIndex < 2) {
        setCurrentIndex((i) => i + 1)
      } else {
        setIsComplete(true)
      }
    }
  }

  const updateGratitude = (index: number, value: string) => {
    const newGratitudes = [...gratitudes]
    newGratitudes[index] = value
    setGratitudes(newGratitudes)
  }

  if (isComplete) {
    return (
      <Card className="border-0 shadow-lg">
        <CardContent className="p-8 text-center space-y-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-20 h-20 rounded-full bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center mx-auto"
          >
            <Sparkles className="h-10 w-10 text-pink-500" />
          </motion.div>

          <div>
            <h3 className="text-xl font-semibold text-foreground">Gracias por este momento</h3>
            <p className="text-muted-foreground mt-2">Has identificado tres cosas por las que estar agradecido</p>
          </div>

          <div className="space-y-3">
            {gratitudes.map((g, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.2 }}
                className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg"
              >
                <Heart className="h-5 w-5 text-pink-500 flex-shrink-0" />
                <p className="text-sm text-foreground text-left">{g}</p>
              </motion.div>
            ))}
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
          <Heart className="h-8 w-8 text-pink-500 mx-auto mb-2" />
          <h3 className="text-xl font-semibold text-foreground">Momento de Gratitud</h3>
          <p className="text-sm text-muted-foreground mt-1">Identifica 3 cosas por las que estás agradecido hoy</p>
        </div>

        {/* Progress hearts */}
        <div className="flex justify-center gap-4 mb-8">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{ scale: gratitudes[i].trim() ? 1.1 : 1 }}
              className={`w-12 h-12 rounded-full flex items-center justify-center ${
                gratitudes[i].trim()
                  ? "bg-pink-100 dark:bg-pink-900/30"
                  : i === currentIndex
                    ? "bg-primary/20 ring-2 ring-primary"
                    : "bg-secondary"
              }`}
            >
              <Heart
                className={`h-6 w-6 ${gratitudes[i].trim() ? "text-pink-500 fill-pink-500" : "text-muted-foreground"}`}
              />
            </motion.div>
          ))}
        </div>

        {/* Current gratitude input */}
        <div className="space-y-4">
          <p className="text-center text-muted-foreground">Gratitud {currentIndex + 1} de 3</p>

          <div className="space-y-3">
            {gratitudes.slice(0, currentIndex + 1).map((g, i) => (
              <div key={i} className="relative">
                <Input
                  value={g}
                  onChange={(e) => updateGratitude(i, e.target.value)}
                  placeholder={
                    i === 0
                      ? "Ej: Mi familia que me apoya"
                      : i === 1
                        ? "Ej: Un momento de paz esta mañana"
                        : "Ej: Mi salud"
                  }
                  className="pr-10"
                  disabled={i < currentIndex}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && i === currentIndex) {
                      handleAdd()
                    }
                  }}
                />
                {gratitudes[i].trim() && (
                  <Check className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-green-500" />
                )}
              </div>
            ))}
          </div>

          <Button onClick={handleAdd} disabled={!gratitudes[currentIndex].trim()} className="w-full gap-2" size="lg">
            {currentIndex < 2 ? (
              <>
                <Plus className="h-5 w-5" />
                Añadir siguiente
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5" />
                Completar
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

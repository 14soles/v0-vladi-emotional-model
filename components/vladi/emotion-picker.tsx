"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { EMOTIONS, type Emotion, type ValenceType } from "@/lib/vladi-types"

interface EmotionPickerProps {
  onSelect: (emotion: Emotion) => void
  selectedEmotion?: Emotion | null
}

export function EmotionPicker({ onSelect, selectedEmotion }: EmotionPickerProps) {
  const [activeValence, setActiveValence] = useState<ValenceType>("negative")

  const valenceOptions: { value: ValenceType; label: string; color: string }[] = [
    { value: "positive", label: "Positiva", color: "bg-green-500" },
    { value: "neutral", label: "Neutral", color: "bg-gray-400" },
    { value: "negative", label: "Negativa", color: "bg-orange-500" },
  ]

  const filteredEmotions = EMOTIONS.filter((e) => e.valence === activeValence)

  return (
    <div className="space-y-6">
      {/* Valence selector */}
      <div className="flex gap-2 justify-center">
        {valenceOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => setActiveValence(option.value)}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-medium transition-all",
              activeValence === option.value
                ? "bg-primary text-primary-foreground shadow-lg scale-105"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80",
            )}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* Emotion grid */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeValence}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="grid grid-cols-3 sm:grid-cols-4 gap-3"
        >
          {filteredEmotions.map((emotion, index) => (
            <motion.button
              key={emotion.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => onSelect(emotion)}
              className={cn(
                "flex flex-col items-center gap-2 p-4 rounded-xl transition-all",
                "border-2 hover:shadow-lg",
                selectedEmotion?.id === emotion.id
                  ? "border-primary bg-primary/10 shadow-lg scale-105"
                  : "border-transparent bg-card hover:border-primary/30",
              )}
            >
              <span className="text-3xl">{emotion.icon}</span>
              <span className="text-sm font-medium capitalize text-card-foreground">{emotion.label}</span>
            </motion.button>
          ))}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

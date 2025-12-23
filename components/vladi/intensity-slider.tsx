"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface IntensitySliderProps {
  value: number
  onChange: (value: number) => void
  label?: string
}

export function IntensitySlider({ value, onChange, label = "¿Qué tan intenso es?" }: IntensitySliderProps) {
  const [localValue, setLocalValue] = useState(value)

  useEffect(() => {
    setLocalValue(value)
  }, [value])

  const getIntensityLabel = (val: number) => {
    if (val <= 2) return "Muy leve"
    if (val <= 4) return "Leve"
    if (val <= 6) return "Moderado"
    if (val <= 8) return "Intenso"
    return "Muy intenso"
  }

  const getIntensityColor = (val: number) => {
    if (val <= 3) return "from-green-400 to-green-500"
    if (val <= 5) return "from-yellow-400 to-yellow-500"
    if (val <= 7) return "from-orange-400 to-orange-500"
    return "from-red-400 to-red-500"
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
        <span className="text-sm font-semibold text-foreground">{getIntensityLabel(localValue)}</span>
      </div>

      <div className="relative pt-2">
        {/* Track background */}
        <div className="h-3 bg-secondary rounded-full overflow-hidden">
          {/* Filled track */}
          <motion.div
            className={cn("h-full rounded-full bg-gradient-to-r", getIntensityColor(localValue))}
            initial={{ width: 0 }}
            animate={{ width: `${(localValue / 10) * 100}%` }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          />
        </div>

        {/* Slider input */}
        <input
          type="range"
          min="1"
          max="10"
          value={localValue}
          onChange={(e) => {
            const newVal = Number.parseInt(e.target.value)
            setLocalValue(newVal)
            onChange(newVal)
          }}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />

        {/* Value indicator */}
        <motion.div
          className={cn(
            "absolute top-0 -translate-x-1/2 w-8 h-8 rounded-full",
            "flex items-center justify-center text-sm font-bold text-white shadow-lg",
            "bg-gradient-to-br",
            getIntensityColor(localValue),
          )}
          style={{ left: `${(localValue / 10) * 100}%` }}
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 0.2 }}
        >
          {localValue}
        </motion.div>
      </div>

      {/* Scale markers */}
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>1</span>
        <span>5</span>
        <span>10</span>
      </div>
    </div>
  )
}

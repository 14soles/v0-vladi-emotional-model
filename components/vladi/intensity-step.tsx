"use client"

import React from "react"

import { useState, useCallback } from "react"
import { ArrowRight } from "lucide-react"

interface IntensityStepProps {
  emotion: string
  defaultValue?: number
  color: string
  onConfirm: (intensity: number) => void
  onBack: () => void
}

export function IntensityStep({ emotion, defaultValue = 6, color, onConfirm, onBack }: IntensityStepProps) {
  const [intensity, setIntensity] = useState(defaultValue)

  const handleSliderChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setIntensity(Number(e.target.value))
  }, [])

  const handleQuickSelect = useCallback((value: number) => {
    setIntensity(value)
  }, [])

  const getIntensityLabel = (value: number): string => {
    if (value <= 2) return "Muy leve"
    if (value <= 4) return "Leve"
    if (value <= 6) return "Moderado"
    if (value <= 8) return "Intenso"
    return "Muy intenso"
  }

  return (
    <div 
      className="fixed inset-0 z-[70] flex flex-col items-center justify-center px-6"
      style={{ backgroundColor: color }}
    >
      {/* Back button */}
      <button
        onClick={onBack}
        className="absolute top-4 left-4 p-2.5 text-white/80 hover:text-white touch-manipulation"
        style={{ top: "max(16px, env(safe-area-inset-top))" }}
      >
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
      </button>

      <div className="w-full max-w-md text-center">
        {/* Emotion label */}
        <div className="mb-2">
          <span className="text-white/70 text-sm font-medium uppercase tracking-wider">
            {emotion}
          </span>
        </div>

        {/* Main question */}
        <h2 className="text-white text-2xl font-light mb-8">
          Que tan intenso lo sientes?
        </h2>

        {/* Intensity value display */}
        <div className="mb-6">
          <span className="text-white text-6xl font-light">{intensity}</span>
          <span className="text-white/70 text-2xl font-light">/10</span>
        </div>

        {/* Intensity label */}
        <div className="mb-8">
          <span className="text-white/80 text-lg font-light">
            {getIntensityLabel(intensity)}
          </span>
        </div>

        {/* Slider */}
        <div className="mb-6 px-4">
          <input
            type="range"
            min="1"
            max="10"
            value={intensity}
            onChange={handleSliderChange}
            className="w-full h-2 rounded-full appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.9) ${(intensity - 1) * 11.11}%, rgba(255,255,255,0.3) ${(intensity - 1) * 11.11}%, rgba(255,255,255,0.3) 100%)`,
            }}
          />
          <div className="flex justify-between mt-2 text-white/60 text-xs">
            <span>1</span>
            <span>5</span>
            <span>10</span>
          </div>
        </div>

        {/* Quick select buttons */}
        <div className="flex justify-center gap-4 mb-10">
          {[3, 6, 9].map((value) => (
            <button
              key={value}
              onClick={() => handleQuickSelect(value)}
              className={`w-14 h-14 rounded-full font-medium text-lg transition-all ${
                intensity === value
                  ? "bg-white text-gray-800"
                  : "bg-white/20 text-white hover:bg-white/30"
              }`}
            >
              {value}
            </button>
          ))}
        </div>

        {/* Continue button */}
        <button
          onClick={() => onConfirm(intensity)}
          className="w-full max-w-xs mx-auto py-4 bg-white rounded-full text-gray-800 font-medium text-lg flex items-center justify-center gap-2 active:scale-[0.98] transition-transform touch-manipulation"
        >
          Continuar
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>

      {/* Subtle hint */}
      <p 
        className="absolute text-white/50 text-xs text-center px-8"
        style={{ bottom: "max(30px, env(safe-area-inset-bottom))" }}
      >
        Puedes continuar sin cambiar si no estas seguro
      </p>
    </div>
  )
}

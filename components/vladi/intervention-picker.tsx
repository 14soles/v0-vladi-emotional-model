"use client"

import React from "react"

import { useState } from "react"
import { Wind, Square, Hand, Pencil, Activity, Brain, RefreshCw, Users, X } from "lucide-react"
import { INTERVENTIONS, type InterventionDefinition, type InterventionType } from "@/lib/types/telemetry"

interface InterventionPickerProps {
  emotionFamily: string
  intensity: number
  onSelect: (intervention: InterventionDefinition) => void
  onSkip: () => void
  onClose: () => void
}

const iconMap: Record<string, React.ElementType> = {
  wind: Wind,
  square: Square,
  hand: Hand,
  pencil: Pencil,
  activity: Activity,
  brain: Brain,
  "refresh-cw": RefreshCw,
  users: Users,
}

export function InterventionPicker({
  emotionFamily,
  intensity,
  onSelect,
  onSkip,
  onClose,
}: InterventionPickerProps) {
  const [showAll, setShowAll] = useState(false)

  // Get recommended interventions based on emotion family
  const recommended = INTERVENTIONS.filter((i) =>
    i.recommended_for.includes(emotionFamily.toLowerCase())
  )
  const others = INTERVENTIONS.filter(
    (i) => !i.recommended_for.includes(emotionFamily.toLowerCase())
  )

  const interventionsToShow = showAll ? [...recommended, ...others] : recommended

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    return `${minutes} min`
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center">
      <div className="bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Momento de regularte
            </h2>
            <p className="text-sm text-gray-500">
              Intensidad detectada: {intensity}/10
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {recommended.length > 0 && (
            <p className="text-xs text-gray-500 mb-3 uppercase tracking-wide font-medium">
              Recomendadas para ti
            </p>
          )}

          <div className="space-y-3">
            {interventionsToShow.map((intervention) => {
              const Icon = iconMap[intervention.icon] || Activity
              const isRecommended = recommended.includes(intervention)

              return (
                <button
                  key={intervention.type}
                  onClick={() => onSelect(intervention)}
                  className={`w-full flex items-start gap-4 p-4 rounded-xl border transition-all text-left ${
                    isRecommended
                      ? "border-blue-200 bg-blue-50/50 hover:bg-blue-50"
                      : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <div
                    className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                      isRecommended ? "bg-blue-100" : "bg-gray-100"
                    }`}
                  >
                    <Icon
                      className={`w-5 h-5 ${
                        isRecommended ? "text-blue-600" : "text-gray-600"
                      }`}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">
                        {intervention.name}
                      </span>
                      <span className="text-xs text-gray-400">
                        {formatDuration(intervention.duration_seconds)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {intervention.description}
                    </p>
                  </div>
                </button>
              )
            })}
          </div>

          {!showAll && others.length > 0 && (
            <button
              onClick={() => setShowAll(true)}
              className="w-full mt-4 py-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Ver todas las intervenciones ({others.length} más)
            </button>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50">
          <button
            onClick={onSkip}
            className="w-full py-3 text-gray-500 hover:text-gray-700 text-sm font-medium transition-colors"
          >
            Ahora no, gracias
          </button>
        </div>
      </div>
    </div>
  )
}

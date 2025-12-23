"use client"

import { useState } from "react"
import { Info, ChevronDown } from "lucide-react"

interface EmotionCount {
  emotion: string
  count: number
}

interface GranularityData {
  score: number // 0-100
  deltaPercent: number
  trend: "up" | "down" | "stable"
  topEmotions: EmotionCount[]
  newEmotions: EmotionCount[] // Updated to include count
  totalEmotions: number
}

interface GranularityBlockProps {
  data: GranularityData
  onInfoClick?: () => void
}

export function GranularityBlock({ data, onInfoClick }: GranularityBlockProps) {
  const [selectedView, setSelectedView] = useState<"top" | "new">("top")
  const [showDropdown, setShowDropdown] = useState(false)

  const getTrendColor = () => {
    if (data.trend === "up") return "bg-green-100 text-green-700"
    if (data.trend === "down") return "bg-gray-100 text-gray-500"
    return "bg-gray-100 text-gray-500"
  }

  const getTrendIcon = () => {
    if (data.trend === "up") return "↑"
    if (data.trend === "down") return "↓"
    return "≈"
  }

  const cardShadowStyle = {
    boxShadow: "0px 4px 22.3px 0px rgba(0, 0, 0, 0.11)",
  }

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-6" style={cardShadowStyle}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-normal text-gray-900 leading-[18px]">Granularidad</h2>
          <button onClick={onInfoClick} className="text-gray-400 hover:text-gray-600 transition-colors">
            <Info className="w-5 h-5" />
          </button>
        </div>

        {/* Trend Badge */}
        <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full ${getTrendColor()}`}>
          <span className="text-[10px] font-medium leading-[14px]">
            {getTrendIcon()} {data.deltaPercent > 0 ? "+" : ""}
            {data.deltaPercent}% variedad emocional funcional
          </span>
        </div>
      </div>

      {/* Description */}
      <p className="text-xs text-gray-400 italic mb-6 leading-relaxed">
        Cada vez identificas mejor lo que sientes. Eso te da más adaptación y mejor regulación emocional.
      </p>

      {/* Dropdown Selector */}
      <div className="relative mb-4">
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="w-full flex items-center justify-between px-5 py-3 bg-gray-100 rounded-2xl hover:bg-gray-150 transition-colors"
        >
          <span className="text-xs text-gray-900 font-medium leading-relaxed">
            {selectedView === "top" ? "Emociones más registradas" : "Nuevas emociones diferenciadas"}
          </span>
          <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${showDropdown ? "rotate-180" : ""}`} />
        </button>

        {showDropdown && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-lg border border-gray-100 py-2 z-10">
            <button
              onClick={() => {
                setSelectedView("top")
                setShowDropdown(false)
              }}
              className={`w-full px-5 py-2.5 text-left hover:bg-gray-50 transition-colors text-xs leading-relaxed ${
                selectedView === "top" ? "text-gray-900 font-medium" : "text-gray-600"
              }`}
            >
              Emociones más registradas
            </button>
            <button
              onClick={() => {
                setSelectedView("new")
                setShowDropdown(false)
              }}
              className={`w-full px-5 py-2.5 text-left hover:bg-gray-50 transition-colors text-xs leading-relaxed ${
                selectedView === "new" ? "text-gray-900 font-medium" : "text-gray-600"
              }`}
            >
              Nuevas emociones diferenciadas
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="space-y-3">
        {selectedView === "top" ? (
          // Top Emotions View
          data.topEmotions.length > 0 ? (
            <div className="grid grid-cols-2 gap-4">
              {data.topEmotions.slice(0, 6).map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-900 leading-relaxed">{item.emotion}</span>
                  <span className="text-[10px] text-gray-500 leading-[14px]">{item.count} veces</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-400 italic text-center py-4 leading-relaxed">
              Aún no hay suficientes emociones registradas.
            </p>
          )
        ) : // New Emotions View
        data.newEmotions.length > 0 ? (
          <div className="grid grid-cols-2 gap-4">
            {data.newEmotions.slice(0, 6).map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-900 leading-relaxed">{item.emotion}</span>
                <span className="text-[10px] text-gray-500 leading-[14px]">{item.count} veces</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-gray-400 italic text-center py-4 leading-relaxed">
            No has añadido nuevas emociones en este periodo.
          </p>
        )}
      </div>
    </div>
  )
}

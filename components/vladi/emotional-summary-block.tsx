"use client"

import { Info, MessageCircle } from "lucide-react"

interface EmotionalSummaryBlockProps {
  aiSummary?: string
  loading?: boolean
  onInfoClick?: () => void
  onChatClick?: () => void
}

export function EmotionalSummaryBlock({ aiSummary, loading, onInfoClick, onChatClick }: EmotionalSummaryBlockProps) {
  const cardShadowStyle = {
    boxShadow: "0px 4px 22.3px 0px rgba(0, 0, 0, 0.11)",
  }

  const defaultText =
    "Cada vez identificas mejor lo que sientes. Eso te da más adaptación y mejor regulación emocional. Mejoras tu percepción emocional y avanzas hacia una gestión óptima de ti mismo."

  return (
    <div className="w-full bg-white rounded-3xl p-5 sm:p-6" style={cardShadowStyle}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center justify-center gap-2 flex-1">
          <h2 className="text-sm font-normal text-gray-900 leading-[18px]">Tu resumen emocional</h2>
          {onInfoClick && (
            <button onClick={onInfoClick} className="text-gray-400 hover:text-gray-600 transition-colors">
              <Info className="w-4 h-4" />
            </button>
          )}
        </div>

        {onChatClick && (
          <button
            onClick={onChatClick}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-900 text-white rounded-full hover:bg-gray-800 transition-colors text-[8px] leading-[10px] whitespace-nowrap"
          >
            <MessageCircle className="w-3 h-3" />
            <span>Iniciar chat con Vladi</span>
          </button>
        )}
      </div>

      <p className="text-xs text-gray-600 italic text-center leading-relaxed px-2">
        {loading ? "Generando tu resumen personalizado..." : aiSummary || defaultText}
      </p>
    </div>
  )
}

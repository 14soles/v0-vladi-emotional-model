"use client"

import { Info, TrendingUp, TrendingDown, Minus } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface EmotionalAwarenessData {
  ceScore: number
  deltaPoints: number
  trend: "up" | "down" | "stable"
  subscores: {
    CC: number
    CB: number
    CT: number
    MC: number
    CEe: number
  }
  insights: string[]
  interpretationText: string
  nCheckins: number
}

interface EmotionalAwarenessBlockProps {
  data: EmotionalAwarenessData
  aiInsight?: string // Added AI insight prop
}

export function EmotionalAwarenessBlock({ data, aiInsight }: EmotionalAwarenessBlockProps) {
  const formatTrend = () => {
    const absPoints = Math.abs(data.deltaPoints)
    if (data.trend === "up") return `↗ +${absPoints} vs antes`
    if (data.trend === "down") return `↘ ${data.deltaPoints} vs antes`
    return "→ Sin cambios"
  }

  const trendColor =
    data.trend === "up"
      ? "bg-green-100 text-green-700"
      : data.trend === "down"
        ? "bg-red-100 text-red-700"
        : "bg-gray-100 text-gray-600"

  const TrendIcon = data.trend === "up" ? TrendingUp : data.trend === "down" ? TrendingDown : Minus

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-6" style={{ boxShadow: "0px 4px 22.3px 0px rgba(0, 0, 0, 0.11)" }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900 leading-[18px]">Conciencia emocional</h3>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Info className="w-4 h-4 text-gray-400" />
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-[10px] leading-[14px] max-w-[200px]">
                Mide tu capacidad para situar una emoción en tiempo, cuerpo, contexto y certeza interna
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Interpretation text */}
      <p className="text-[10px] text-gray-400 italic mb-6 leading-[14px]">{aiInsight || data.interpretationText}</p>

      {/* Main content */}
      <div className="flex flex-col sm:flex-row items-start justify-between gap-6">
        {/* Subscores */}
        <div className="flex flex-col gap-3 flex-shrink-0 w-full sm:w-auto">
          <div className="flex items-center justify-between gap-4">
            <span className="text-xs text-gray-600 italic leading-[16px] font-normal">Contexto</span>
            <span className="text-xs font-medium text-gray-900 bg-gray-100 px-3 py-1.5 rounded-full leading-[16px] min-w-[44px] text-center">
              {data.subscores.CC}
            </span>
          </div>

          <div className="flex items-center justify-between gap-4">
            <span className="text-xs text-gray-600 italic leading-[16px] font-normal">Cuerpo</span>
            <span className="text-xs font-medium text-gray-900 bg-gray-100 px-3 py-1.5 rounded-full leading-[16px] min-w-[44px] text-center">
              {data.subscores.CB}
            </span>
          </div>

          <div className="flex items-center justify-between gap-4">
            <span className="text-xs text-gray-600 italic leading-[16px] font-normal">Tiempo</span>
            <span className="text-xs font-medium text-gray-900 bg-gray-100 px-3 py-1.5 rounded-full leading-[16px] min-w-[44px] text-center">
              {data.subscores.CT}
            </span>
          </div>

          <div className="flex items-center justify-between gap-4">
            <span className="text-xs text-gray-600 italic leading-[16px] font-normal">Seguridad</span>
            <span className="text-xs font-medium text-gray-900 bg-gray-100 px-3 py-1.5 rounded-full leading-[16px] min-w-[44px] text-center">
              {data.subscores.MC}
            </span>
          </div>
        </div>

        {/* Total score and trend */}
        <div className="flex flex-col items-end justify-center flex-shrink-0 w-full sm:w-auto">
          <div className="flex items-baseline gap-1 mb-3">
            <span className="text-2xl font-bold text-gray-900 leading-[28px]">{data.ceScore}</span>
            <span className="text-xs text-gray-400 leading-[16px]">/100</span>
          </div>

          <span
            className={`text-[10px] font-medium px-3 py-1.5 rounded-full ${trendColor} leading-[14px] flex items-center gap-1`}
          >
            <TrendIcon className="w-3 h-3" />
            {formatTrend()}
          </span>
        </div>
      </div>

      {/* Insights */}
      {data.insights.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          {data.insights.map((insight, idx) => (
            <p key={idx} className="text-[10px] text-gray-500 italic leading-[14px] mb-1">
              💡 {insight}
            </p>
          ))}
        </div>
      )}
    </div>
  )
}

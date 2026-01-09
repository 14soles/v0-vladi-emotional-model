"use client"
import { Info } from "lucide-react"

export interface ContextTrigger {
  label: string
  percentage: number
  type: "negative" | "positive"
  impact: string
}

interface ContextTriggersBlockProps {
  triggers: ContextTrigger[]
  insight?: string
  loading?: boolean
  onInfoClick?: () => void
}

export function ContextTriggersBlock({ triggers, insight, loading, onInfoClick }: ContextTriggersBlockProps) {
  const negativeTriggers = triggers.filter((t) => t.type === "negative")
  const positiveTriggers = triggers.filter((t) => t.type === "positive")

  const cardShadowStyle = {
    boxShadow: "0px 4px 22.3px 0px rgba(0, 0, 0, 0.11)",
  }

  return (
    <div className="w-full bg-white rounded-3xl p-5 sm:p-6" style={cardShadowStyle}>
      <div className="flex items-center gap-2 mb-2">
        <h2 className="text-sm font-normal text-gray-900 leading-[18px]">Contextos y disparadores emocionales</h2>
        {onInfoClick && (
          <button onClick={onInfoClick} className="text-gray-400 hover:text-gray-600 transition-colors">
            <Info className="w-4 h-4" />
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center gap-2 mb-4">
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
          <p className="text-xs text-gray-400 italic leading-relaxed">Analizando patrones...</p>
        </div>
      ) : (
        insight && <p className="text-xs text-gray-400 italic mb-4 leading-relaxed">{insight}</p>
      )}

      {/* Trigger Tags */}
      <div className="flex flex-wrap gap-2">
        {/* Negative triggers - Red/Pink */}
        {negativeTriggers.map((trigger, index) => (
          <div
            key={`neg-${index}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full"
            style={{
              backgroundColor: "rgba(239, 68, 68, 0.15)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
            }}
          >
            <span className="text-xs font-medium" style={{ color: "#991B1B" }}>
              {trigger.label} • {trigger.percentage}%
            </span>
          </div>
        ))}

        {/* Positive factors - Green */}
        {positiveTriggers.map((trigger, index) => (
          <div
            key={`pos-${index}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full"
            style={{
              backgroundColor: "rgba(34, 197, 94, 0.15)",
              border: "1px solid rgba(34, 197, 94, 0.3)",
            }}
          >
            <span className="text-xs font-medium" style={{ color: "#166534" }}>
              {trigger.label} • {trigger.impact}
            </span>
          </div>
        ))}
      </div>

      {!loading && triggers.length === 0 && (
        <p className="text-xs text-gray-400 italic text-center py-4">
          Aún no hay suficientes datos para identificar patrones de contexto.
        </p>
      )}
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import { Info, ChevronDown, TrendingUp, TrendingDown } from "lucide-react"
import { useIEQData } from "@/lib/hooks/use-ieq-data"
import { usePeriodSelector, type TimePeriod } from "@/lib/hooks/use-period-selector"
import { IntensityWellbeingWaveGraph } from "./intensity-wellbeing-wave-graph"
import { GranularityBlock } from "./granularity-block"
import { EmotionalAwarenessBlock } from "./emotional-awareness-block"
import { EmotionalSummaryBlock } from "./emotional-summary-block"
import { ConversationHistoryBlock } from "./conversation-history-block"

interface IEQPanelProps {
  userId?: string
  userProfile?: {
    username: string
    display_name?: string | null
    avatar_url?: string | null
  }
  onAvatarClick?: () => void
  onNotificationsClick?: () => void
  onStartChat?: () => void
}

export function IEQPanel({ userId, onStartChat }: IEQPanelProps) {
  const { period, showPeriodMenu, getPeriodLabel, formatDateRange, toggleMenu, selectPeriod } = usePeriodSelector("7d")

  const {
    emotionalState,
    deamScore,
    deamTrend,
    inertia,
    inertiaTrend,
    emotionalAwarenessData,
    currentEntries,
    previousEntries,
    emotionPoints,
    averageIntensity,
    averageWellbeing,
    granularityData,
    loading,
    error,
  } = useIEQData(userId, period)

  const [showInfoModal, setShowInfoModal] = useState<string | null>(null)
  const [aiInsights, setAiInsights] = useState<{
    emotionalState: string
    intensityWellbeing: string
    granularity: string
    emotionalAwareness: string
    emotionalSummary: string
  } | null>(null)
  const [loadingInsights, setLoadingInsights] = useState(false)

  useEffect(() => {
    async function fetchAIInsights() {
      if (!currentEntries || currentEntries.length === 0) {
        console.log("[v0] IEQ Panel - Skipping AI insights, no entries")
        return
      }

      console.log("[v0] IEQ Panel - Fetching AI insights with data:", {
        emotionalState,
        deamScore,
        checkIns: currentEntries.length,
        granularityScore: granularityData.score,
      })

      setLoadingInsights(true)
      try {
        const response = await fetch("/api/ai/ieq-insights", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            emotionalState,
            deamScore,
            deamTrend,
            checkIns: currentEntries.length,
            averageIntensity,
            averageWellbeing,
            granularityScore: granularityData.score,
            granularityTrend: granularityData.deltaPercent,
            emotionalAwareness: {
              ceScore: emotionalAwarenessData.ceScore,
              subscores: emotionalAwarenessData.subscores,
            },
            period: getPeriodLabel(),
            topEmotions: granularityData.topEmotions,
          }),
        })

        if (response.ok) {
          const data = await response.json()
          console.log("[v0] IEQ Panel - Received AI insights:", data.insights)
          setAiInsights(data.insights)
        } else {
          console.error("[v0] IEQ Panel - Failed to fetch insights:", response.status, response.statusText)
        }
      } catch (error) {
        console.error("[v0] IEQ Panel - Error fetching AI insights:", error)
      } finally {
        setLoadingInsights(false)
      }
    }

    fetchAIInsights()
  }, [
    emotionalState,
    deamScore,
    deamTrend,
    currentEntries,
    averageIntensity,
    averageWellbeing,
    granularityData,
    emotionalAwarenessData,
    period,
  ])

  const getEmotionalStateImage = (category: string) => {
    const categoryLower = category.toLowerCase()
    if (categoryLower.includes("calma")) {
      return "/images/circulo-verde-movimiento.png"
    } else if (categoryLower.includes("ánimo")) {
      return "/images/circulo-azul.png"
    } else if (categoryLower.includes("energía")) {
      return "/images/circulo-amarillo-movimiento.png"
    } else if (categoryLower.includes("tensión")) {
      return "/images/circulo-rojo-movimiento.png"
    }
    return "/images/circulo-verde-movimiento.png"
  }

  const infoTexts = {
    "estado-emocional": {
      title: "Estado emocional reciente",
      text: "Este bloque resume cómo te has sentido en conjunto durante el periodo seleccionado. No muestra una emoción concreta ni un diagnóstico, sino una tendencia basada en tus registros recientes, dando más peso a los más cercanos en el tiempo.",
    },
    "deam-ieq": {
      title: "DEAM IEQ",
      text: "DEAM EQ es una estimación de tu inteligencia emocional a lo largo del tiempo. Se calcula combinando cómo registras tus emociones, tu capacidad para diferenciarlas, mantener coherencia con el contexto, adaptarte a cambios y recuperarte de estados intensos. No mide si estás bien o mal, sino tu habilidad emocional global.",
    },
    "check-ins": {
      title: "Check-ins",
      text: "Este valor muestra cuántas emociones has registrado en el periodo seleccionado. Mantener un registro constante te ayuda a tener mejores insights sobre tu estado emocional.",
    },
    inercia: {
      title: "Inercia emocional",
      text: "Este valor muestra el tiempo medio que tardan tus emociones intensas en volver a un nivel más regulado. No indica si una emoción es buena o mala, sino cuánto se mantiene activa antes de disminuir.",
    },
    "conciencia-emocional": {
      title: "Conciencia emocional",
      text: "Este indicador muestra si sueles ubicar lo que sientes en contexto, cuerpo, tiempo y seguridad interna. No mide si estás bien o mal, sino cómo de claro y situado queda lo que registras.",
    },
    granularidad: {
      title: "Granularidad emocional",
      text: "La granularidad emocional refleja tu capacidad para identificar y diferenciar lo que sientes con precisión. Cuanto más específico es tu lenguaje emocional, mayor suele ser tu capacidad de adaptación y regulación.",
    },
    "intensidad-bienestar": {
      title: "Intensidad y bienestar",
      text: "Este gráfico muestra la distribución de tus emociones según su intensidad (energía) y bienestar. Cada color representa una familia emocional diferente, ayudándote a visualizar tus patrones emocionales.",
    },
    "resumen-emocional": {
      title: "Tu resumen emocional",
      text: "Este resumen integra todos tus datos del periodo para darte una visión general de tu situación emocional. Valida tus emociones y te ayuda a comprenderte mejor, destacando progresos y áreas de crecimiento en tu inteligencia emocional.",
    },
  }

  const cardShadowStyle = {
    boxShadow: "0px 4px 22.3px 0px rgba(0, 0, 0, 0.11)",
  }

  if (error) {
    return (
      <div className="flex-1 overflow-y-auto bg-white">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-red-500">Error al cargar los datos IEQ</p>
            <p className="text-sm text-gray-500 mt-2">{error.message}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto bg-white min-h-0">
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Header */}
        <div className="bg-white px-2 sm:px-4 py-4">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Tu Panel IEQ</h1>
              <p className="text-xs text-gray-400 mt-0.5">{formatDateRange()}</p>
            </div>
            <div className="relative">
              <button
                onClick={toggleMenu}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-full hover:bg-gray-50 transition-colors"
              >
                <span className="text-sm text-gray-700">{getPeriodLabel()}</span>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </button>
              {showPeriodMenu && (
                <div className="absolute right-0 mt-2 w-40 bg-white rounded-2xl shadow-lg border border-gray-100 py-2 z-10">
                  {(["today", "3d", "7d", "30d", "60d"] as TimePeriod[]).map((p) => (
                    <button
                      key={p}
                      onClick={() => selectPeriod(p)}
                      className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 ${
                        period === p ? "text-gray-900 font-medium" : "text-gray-600"
                      }`}
                    >
                      {p === "today"
                        ? "Hoy"
                        : p === "3d"
                          ? "3 días"
                          : p === "7d"
                            ? "7 días"
                            : p === "30d"
                              ? "30 días"
                              : "60 días"}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Emotional Summary Block */}
        {currentEntries.length > 0 && (
          <EmotionalSummaryBlock
            aiSummary={aiInsights?.emotionalSummary}
            loading={loadingInsights}
            onInfoClick={() => setShowInfoModal("resumen-emocional")}
            onChatClick={onStartChat}
          />
        )}

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column: Estado Emocional */}
          <div className="bg-white rounded-3xl p-5 sm:p-6" style={cardShadowStyle}>
            <div className="flex items-center justify-center gap-2 mb-2">
              <h2 className="text-sm font-normal text-gray-900 leading-[18px]">Estado emocional</h2>
              <button
                onClick={() => setShowInfoModal("estado-emocional")}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <Info className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-gray-400 italic text-center mb-4 leading-relaxed">
              {loadingInsights
                ? "Analizando..."
                : aiInsights?.emotionalState || emotionalState?.description || "Aún no hay suficientes registros."}
            </p>

            <div className="flex items-center justify-center mb-2">
              <div className="relative w-36 h-36 sm:w-44 sm:h-44">
                <img
                  src={
                    emotionalState
                      ? getEmotionalStateImage(emotionalState.category)
                      : "/images/circulo-verde-movimiento.png"
                  }
                  alt={emotionalState?.category || "Estado"}
                  className="w-full h-full object-contain"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-medium text-white relative z-10 leading-[28px]">
                    {emotionalState?.category || "En calma"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: DEAM IEQ + Check-ins */}
          <div className="flex flex-col gap-6">
            {/* DEAM IEQ */}
            <div className="bg-white rounded-3xl p-5 sm:p-6" style={cardShadowStyle}>
              <div className="flex items-center justify-center gap-2 mb-3">
                <h2 className="text-sm font-normal text-gray-900 leading-[18px]">DEAM IEQ</h2>
                <button
                  onClick={() => setShowInfoModal("deam-ieq")}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <Info className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-baseline justify-center gap-1 mb-3">
                <span className="text-2xl font-bold text-gray-900 leading-[28px]">{deamScore}</span>
                <span className="text-xs text-gray-400">/100</span>
              </div>

              <div className="flex justify-center">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-100 rounded-full">
                  {deamTrend > 0 ? (
                    <TrendingUp className="w-3 h-3 text-green-700" />
                  ) : (
                    <TrendingDown className="w-3 h-3 text-green-700" />
                  )}
                  <span className="text-[10px] text-green-700 leading-[14px]">
                    {deamTrend > 0 ? "+" : ""}
                    {deamTrend}% vs antes
                  </span>
                </div>
              </div>
            </div>

            {/* Check-ins */}
            <div className="bg-white rounded-3xl p-5 sm:p-6" style={cardShadowStyle}>
              <div className="flex items-center justify-center gap-2 mb-3">
                <h2 className="text-sm font-normal text-gray-900 leading-[18px]">Check-ins</h2>
                <button
                  onClick={() => setShowInfoModal("check-ins")}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <Info className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-baseline justify-center gap-1 mb-2">
                <span className="text-2xl font-bold text-gray-900 leading-[28px]">{currentEntries.length}</span>
              </div>

              <p className="text-xs text-gray-400 italic text-center mb-3 leading-relaxed">Emociones</p>

              <div className="flex justify-center">
                {(() => {
                  const prevCount = previousEntries.length
                  const currentCount = currentEntries.length
                  const percentChange = prevCount > 0 ? Math.round(((currentCount - prevCount) / prevCount) * 100) : 0
                  const isPositive = percentChange >= 0

                  return (
                    <div
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full ${
                        isPositive ? "bg-green-100" : "bg-gray-100"
                      }`}
                    >
                      {isPositive ? (
                        <TrendingUp className={`w-3 h-3 ${isPositive ? "text-green-700" : "text-gray-500"}`} />
                      ) : (
                        <TrendingDown className={`w-3 h-3 ${isPositive ? "text-green-700" : "text-gray-500"}`} />
                      )}
                      <span className={`text-[10px] leading-[14px] ${isPositive ? "text-green-700" : "text-gray-500"}`}>
                        {isPositive ? "+" : ""}
                        {percentChange}% vs antes
                      </span>
                    </div>
                  )
                })()}
              </div>
            </div>
          </div>
        </div>

        {/* Intensidad y bienestar - Full width */}
        {emotionPoints.length > 0 && (
          <div className="w-full">
            <IntensityWellbeingWaveGraph
              emotions={emotionPoints}
              averageIntensity={averageIntensity}
              averageWellbeing={averageWellbeing}
              aiInsight={loadingInsights ? "Analizando tus patrones..." : aiInsights?.intensityWellbeing}
              onEmotionClick={(emotion) => {
                // Emotion clicked
              }}
            />
          </div>
        )}

        {/* Granularidad - Full width */}
        {currentEntries.length > 0 && (
          <div className="w-full">
            <GranularityBlock
              data={granularityData}
              aiInsight={loadingInsights ? "Analizando..." : aiInsights?.granularity}
              onInfoClick={() => setShowInfoModal("granularidad")}
            />
          </div>
        )}

        {/* Conciencia emocional - Full width */}
        {emotionalAwarenessData && emotionalAwarenessData.nCheckins > 0 && (
          <div className="w-full">
            <EmotionalAwarenessBlock
              data={emotionalAwarenessData}
              aiInsight={loadingInsights ? "Analizando..." : aiInsights?.emotionalAwareness}
            />
          </div>
        )}

        {/* Inercia - Full width */}
        <div className="w-full bg-white rounded-3xl p-5 sm:p-6" style={cardShadowStyle}>
          <div className="flex items-center justify-center gap-2 mb-2">
            <h2 className="text-sm font-normal text-gray-900 leading-[18px]">Inercia</h2>
            <button
              onClick={() => setShowInfoModal("inercia")}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <Info className="w-4 h-4" />
            </button>
          </div>

          <p className="text-xs text-gray-400 italic text-center mb-4 leading-relaxed">Recup. Promedio</p>

          <div className="flex items-baseline justify-center gap-0.5 mb-4">
            <span className="text-2xl font-bold text-gray-900 leading-[28px]">{inertia.toFixed(1)}</span>
            <span className="text-xs text-gray-900">h</span>
          </div>

          <div className="flex justify-center mb-3">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-100 rounded-full">
              <TrendingDown className="w-3 h-3 text-green-700" />
              <span className="text-[10px] text-green-700 leading-[14px]">{inertiaTrend} vs antes</span>
            </div>
          </div>

          <div className="text-center">
            <p className="text-xs text-gray-400 italic mb-1 leading-relaxed">Última semana</p>
            <p className="text-2xl font-semibold text-gray-900 leading-[28px]">
              {inertia > 0 ? `${Math.floor(inertia)}h ${Math.round((inertia % 1) * 60)}min` : "N/A"}
            </p>
          </div>
        </div>

        <div className="w-full">
          <ConversationHistoryBlock
            userId={userId}
            onConversationClick={(sessionId) => {
              console.log("[v0] Opening conversation:", sessionId)
              // TODO: Implement conversation reopening
            }}
          />
        </div>
      </div>

      {/* Info Modal */}
      {showInfoModal && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
          onClick={() => setShowInfoModal(null)}
        >
          <div className="bg-white rounded-3xl p-8 max-w-md shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-semibold text-gray-900 mb-4" style={{ fontFamily: "DM Sans, sans-serif" }}>
              {infoTexts[showInfoModal as keyof typeof infoTexts].title}
            </h3>
            <p className="text-gray-600 leading-relaxed mb-6" style={{ fontFamily: "DM Sans, sans-serif" }}>
              {infoTexts[showInfoModal as keyof typeof infoTexts].text}
            </p>
            <button
              onClick={() => setShowInfoModal(null)}
              className="w-full py-3 bg-gray-900 text-white rounded-full hover:bg-gray-800 transition-colors"
              style={{ fontFamily: "DM Sans, sans-serif" }}
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

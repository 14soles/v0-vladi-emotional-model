"use client"

import { useState, useMemo } from "react"
import { ChevronDown, Info } from "lucide-react"
import { useVladiStore } from "@/lib/vladi-store"
import { calculateEmotionalState } from "@/lib/emotional-state-calculator"
import { CommonHeader } from "./common-header"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts"

type TimeRange = "7D" | "14D" | "30D"

interface IEQViewProps {
  userId?: string
  userProfile?: {
    username: string
    display_name: string | null
    avatar_url: string | null
  }
  onAvatarClick?: () => void
  onNotificationsClick?: () => void
  notificationCount?: number
}

const QUADRANT_COLORS = {
  calma: "#94B22E",
  energia: "#E6B04F",
  tension: "#E6584F",
  sin_animo: "#466D91",
}

const GRADIENT_COLORS = {
  calma: { from: "#8BB458", to: "#B4D987" },
  energia: { from: "#F39C12", to: "#FDD836" },
  tension: { from: "#F94A44", to: "#FF7A59" },
  sin_animo: { from: "#5A99D4", to: "#80B4E5" },
}

export function IEQView({
  userId,
  userProfile,
  onAvatarClick,
  onNotificationsClick,
  notificationCount = 0,
}: IEQViewProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>("30D")
  const [showInfoModal, setShowInfoModal] = useState<string | null>(null)

  const entries = useVladiStore((s) => s.entries)

  // Calcular estado emocional reciente
  const emotionalState = useMemo(() => {
    return calculateEmotionalState(entries, timeRange)
  }, [entries, timeRange])

  // Datos para el gráfico de intensidad y bienestar
  const intensityWellbeingData = useMemo(() => {
    const now = new Date()
    const rangeDays = timeRange === "7D" ? 7 : timeRange === "14D" ? 14 : 30
    const rangeMs = rangeDays * 24 * 60 * 60 * 1000

    const filtered = entries.filter((e) => now.getTime() - new Date(e.timestamp).getTime() <= rangeMs)

    // Agrupar por hora para crear el gráfico de montaña
    const hourlyData = new Map<number, { intensities: number[]; wellbeings: number[]; count: number }>()

    filtered.forEach((entry) => {
      // Normalizar wellbeing (0-100) basado en valence si no existe
      let wellbeing = entry.wellbeing || 50
      if (entry.valence !== undefined) {
        wellbeing = Math.round(((entry.valence + 1) / 2) * 100) // Convertir -1..1 a 0..100
      }

      const intensity = entry.intensity_before || 50
      const hour = Math.floor((now.getTime() - new Date(entry.timestamp).getTime()) / (1000 * 60 * 60))

      if (!hourlyData.has(hour)) {
        hourlyData.set(hour, { intensities: [], wellbeings: [], count: 0 })
      }

      const data = hourlyData.get(hour)!
      data.intensities.push(intensity)
      data.wellbeings.push(wellbeing)
      data.count++
    })

    // Convertir a array y calcular promedios
    return Array.from(hourlyData.entries())
      .map(([hour, data]) => ({
        hour,
        avgIntensity: Math.round(data.intensities.reduce((a, b) => a + b, 0) / data.count),
        avgWellbeing: Math.round(data.wellbeings.reduce((a, b) => a + b, 0) / data.count),
        count: data.count,
      }))
      .sort((a, b) => b.hour - a.hour)
      .slice(0, 100) // Últimas 100 horas
      .reverse()
  }, [entries, timeRange])

  const avgIntensity = useMemo(() => {
    if (intensityWellbeingData.length === 0) return 0
    return Math.round(
      intensityWellbeingData.reduce((sum, d) => sum + d.avgIntensity, 0) / intensityWellbeingData.length,
    )
  }, [intensityWellbeingData])

  const avgWellbeing = useMemo(() => {
    if (intensityWellbeingData.length === 0) return 0
    return Math.round(
      intensityWellbeingData.reduce((sum, d) => sum + d.avgWellbeing, 0) / intensityWellbeingData.length,
    )
  }, [intensityWellbeingData])

  const formatDate = (range: TimeRange) => {
    const now = new Date()
    const days = range === "7D" ? 7 : range === "14D" ? 14 : 30
    const past = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
    return `${past.toLocaleDateString("es-ES", { day: "2-digit", month: "short" })} - ${now.toLocaleDateString("es-ES", { day: "2-digit", month: "short" })}`
  }

  const gradientColors = GRADIENT_COLORS[emotionalState.category]

  return (
    <div className="flex-1 overflow-y-auto pb-24 bg-gray-50 min-h-0">
      {/* Header */}
      <div className="bg-white">
        <CommonHeader
          userProfile={userProfile}
          onAvatarClick={onAvatarClick}
          onNotificationsClick={onNotificationsClick}
          notificationCount={notificationCount}
        />
      </div>

      {/* Título y selector de rango */}
      <div className="bg-white px-5 pt-4 pb-5 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Tu Panel IEQ</h1>
            <p className="text-sm text-gray-500 mt-1">{formatDate(timeRange)}</p>
          </div>
          <button
            onClick={() => {
              const ranges: TimeRange[] = ["7D", "14D", "30D"]
              const currentIndex = ranges.indexOf(timeRange)
              setTimeRange(ranges[(currentIndex + 1) % ranges.length])
            }}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-full text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            {timeRange === "7D" ? "7 días" : timeRange === "14D" ? "14 días" : "30 días"}
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="p-5 space-y-4">
        {/* Bloque 1: Estado emocional reciente */}
        <div className="bg-white rounded-3xl p-6 shadow-sm">
          <div className="flex items-start justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Estado emocional</h2>
            <button
              onClick={() => setShowInfoModal("emotional_state")}
              className="w-5 h-5 rounded-full border border-gray-300 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:border-gray-400"
            >
              <Info className="w-3 h-3" />
            </button>
          </div>

          {!emotionalState.hasEnoughData ? (
            <div className="text-center py-8">
              <div className="w-48 h-48 mx-auto rounded-full bg-gray-100 flex items-center justify-center mb-4">
                <span className="text-gray-400 text-lg">Aún sin tendencia</span>
              </div>
              <p className="text-gray-600">{emotionalState.feedbackText}</p>
            </div>
          ) : (
            <>
              <p className="text-sm text-gray-500 italic mb-6">{emotionalState.feedbackText}</p>

              <div className="flex items-center justify-center">
                <div
                  className="w-64 h-64 rounded-full flex items-center justify-center relative overflow-hidden"
                  style={{
                    background: `linear-gradient(135deg, ${gradientColors.from} 0%, ${gradientColors.to} 100%)`,
                  }}
                >
                  <span className="text-white text-3xl font-medium z-10 relative">{emotionalState.categoryLabel}</span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Bloque 2: DEAM IEQ Score */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-3xl p-5 shadow-sm">
            <div className="flex items-start justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-900">DEAM IEQ</h3>
              <button
                onClick={() => setShowInfoModal("deam_ieq")}
                className="w-5 h-5 rounded-full border border-gray-300 flex items-center justify-center text-gray-400 hover:text-gray-600"
              >
                <Info className="w-3 h-3" />
              </button>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-gray-900">79</span>
              <span className="text-gray-500 text-lg">/100</span>
            </div>
            <div className="mt-3 inline-flex items-center gap-1 px-2 py-1 bg-green-100 rounded-full">
              <svg className="w-3 h-3 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
              <span className="text-xs font-medium text-green-700">+19% vs antes</span>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-5 shadow-sm">
            <div className="flex items-start justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-900">Inercia</h3>
              <button
                onClick={() => setShowInfoModal("inertia")}
                className="w-5 h-5 rounded-full border border-gray-300 flex items-center justify-center text-gray-400 hover:text-gray-600"
              >
                <Info className="w-3 h-3" />
              </button>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-gray-900">3.5h</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">Recup. Promedio</p>
            <div className="mt-3 inline-flex items-center gap-1 px-2 py-1 bg-green-100 rounded-full">
              <svg className="w-3 h-3 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
              <span className="text-xs font-medium text-green-700">-1.5h vs antes</span>
            </div>
          </div>
        </div>

        {/* Bloque 3: Intensidad y bienestar */}
        <div className="bg-white rounded-3xl p-5 shadow-sm">
          <div className="flex items-start justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Intensidad y bienestar</h2>
            <button
              onClick={() => setShowInfoModal("intensity_wellbeing")}
              className="w-5 h-5 rounded-full border border-gray-300 flex items-center justify-center text-gray-400 hover:text-gray-600"
            >
              <Info className="w-3 h-3" />
            </button>
          </div>

          {intensityWellbeingData.length > 0 ? (
            <>
              <div className="h-64 mb-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={intensityWellbeingData}>
                    <defs>
                      <linearGradient id="intensityGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#E6584F" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#E6584F" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="wellbeingGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#94B22E" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#94B22E" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="energyGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#E6B04F" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#E6B04F" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="blueGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#466D91" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#466D91" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                    <XAxis dataKey="hour" tick={{ fontSize: 10 }} hide />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null
                        return (
                          <div className="bg-white p-2 rounded-lg shadow-lg border text-xs">
                            <p className="font-medium">Intensidad: {payload[0].value}%</p>
                            <p className="font-medium">Bienestar: {payload[1]?.value}%</p>
                          </div>
                        )
                      }}
                    />
                    <ReferenceLine y={50} stroke="#e5e7eb" strokeDasharray="5 5" />
                    <Area
                      type="monotone"
                      dataKey="avgIntensity"
                      stroke="#E6584F"
                      fill="url(#intensityGradient)"
                      strokeWidth={2}
                    />
                    <Area
                      type="monotone"
                      dataKey="avgWellbeing"
                      stroke="#94B22E"
                      fill="url(#wellbeingGradient)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                <div>
                  <p className="text-2xl font-semibold text-gray-900">{avgIntensity}</p>
                  <p className="text-xs text-gray-500">Media intensidad</p>
                </div>
                <div>
                  <p className="text-2xl font-semibold text-gray-900">{avgWellbeing}</p>
                  <p className="text-xs text-gray-500">Media bienestar</p>
                </div>
              </div>

              <p className="text-xs text-gray-500 mt-4 italic">
                Tus emociones se mantiene estables en bienestar y con ligeros picos de intensidad.
              </p>
            </>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No hay suficientes datos para mostrar el gráfico</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal de información */}
      {showInfoModal && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setShowInfoModal(null)}
        >
          <div className="bg-white rounded-2xl p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              {showInfoModal === "emotional_state"
                ? "Estado emocional reciente"
                : showInfoModal === "deam_ieq"
                  ? "DEAM IEQ"
                  : showInfoModal === "inertia"
                    ? "Inercia Emocional"
                    : "Intensidad y Bienestar"}
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              {showInfoModal === "emotional_state"
                ? "Este bloque resume cómo te has sentido en conjunto durante el periodo seleccionado. No muestra una emoción puntual ni un diagnóstico: es una tendencia basada en tus check-ins recientes, dando más peso a los más cercanos en el tiempo."
                : showInfoModal === "deam_ieq"
                  ? "El índice DEAM EQ mide tu inteligencia emocional basándose en granularidad, percepción, conciencia contextual, adaptabilidad e inercia emocional."
                  : showInfoModal === "inertia"
                    ? "Tiempo promedio que tardas en recuperarte de estados emocionales negativos intensos. Un valor menor indica mejor capacidad de recuperación."
                    : "Muestra la evolución de la intensidad de tus emociones y tu nivel de bienestar a lo largo del tiempo."}
            </p>
            <button
              onClick={() => setShowInfoModal(null)}
              className="w-full py-2 bg-gray-900 text-white rounded-full font-medium hover:bg-gray-800"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

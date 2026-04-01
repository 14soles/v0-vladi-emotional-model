"use client"

import { useState, useMemo } from "react"
import { ChevronDown, Info } from "lucide-react"
import { useVladiStore } from "@/lib/vladi-store"
import { calculateEmotionalState } from "@/lib/emotional-state-calculator"
import { calculateDEAMMetrics, DATA_GATING_THRESHOLDS } from "@/lib/deam-engine"
import { CommonHeader } from "./common-header"
import { CalibrationOverlay, CalibrationIndicator } from "./calibration-indicator"
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

// Mapping de categoría a imagen y etiqueta
const EMOTIONAL_STATE_CONFIG = {
  calma: {
    image: "/images/circulo-verde-movimiento.png",
    label: "En calma",
    textColor: "#6B8E23", // Verde oliva
  },
  energia: {
    image: "/images/circulo-amarillo-movimiento.png",
    label: "Con energía",
    textColor: "#DAA520", // Dorado
  },
  tension: {
    image: "/images/circulo-rojo-movimiento.png",
    label: "En tensión",
    textColor: "#DC143C", // Rojo carmesí
  },
  sin_animo: {
    image: "/images/circulo-azul-movimiento.png",
    label: "Sin ánimo",
    textColor: "#4682B4", // Azul acero
  },
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

  // Calcular métricas DEAM EQ
  const deamMetrics = useMemo(() => {
    const rangeDays = timeRange === "7D" ? 7 : timeRange === "14D" ? 14 : 30
    const now = new Date()
    const rangeMs = rangeDays * 24 * 60 * 60 * 1000
    const prevRangeMs = rangeMs * 2

    const currentEntries = entries.filter(
      (e) => now.getTime() - new Date(e.timestamp).getTime() <= rangeMs
    )
    const previousEntries = entries.filter(
      (e) => {
        const age = now.getTime() - new Date(e.timestamp).getTime()
        return age > rangeMs && age <= prevRangeMs
      }
    )

    return calculateDEAMMetrics(currentEntries, previousEntries, rangeDays)
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

  // Obtener configuración del estado emocional basada en el cálculo
  const stateConfig = EMOTIONAL_STATE_CONFIG[emotionalState.category]

  return (
    <div className="flex-1 overflow-y-auto pb-24 bg-gray-50 min-h-0">
      {/* Header */}
      <div className="bg-white">
        <CommonHeader
          title="Tu Panel"
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
            <h1 className="text-2xl font-bold text-gray-900">Tu Panel</h1>
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
                <div className="w-64 h-64 flex items-center justify-center relative">
                  {/* Imagen del círculo según el cuadrante dominante */}
                  <img
                    src={stateConfig.image}
                    alt={stateConfig.label}
                    className="w-full h-full object-contain absolute inset-0"
                  />
                  {/* Etiqueta del estado emocional */}
                  <span 
                    className="text-2xl font-semibold z-10 relative drop-shadow-sm"
                    style={{ color: stateConfig.textColor }}
                  >
                    {stateConfig.label}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Bloque 2: DEAM IEQ Score */}
        <div className="grid grid-cols-2 gap-4">
          <CalibrationOverlay calibration={deamMetrics.calibration.deamEQ}>
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
                {deamMetrics.deamEQ !== null ? (
                  <>
                    <span className="text-4xl font-bold text-gray-900">{deamMetrics.deamEQ}</span>
                    <span className="text-gray-500 text-lg">/100</span>
                  </>
                ) : (
                  <span className="text-2xl font-medium text-gray-400">Calibrando...</span>
                )}
              </div>
              {deamMetrics.deamEQ !== null && deamMetrics.deamTrend !== 0 && (
                <div className={`mt-3 inline-flex items-center gap-1 px-2 py-1 rounded-full ${
                  deamMetrics.deamTrend > 0 ? "bg-green-100" : "bg-red-100"
                }`}>
                  <svg className={`w-3 h-3 ${deamMetrics.deamTrend > 0 ? "text-green-600" : "text-red-600"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={deamMetrics.deamTrend > 0 ? "M13 7l5 5m0 0l-5 5m5-5H6" : "M11 17l-5-5m0 0l5-5m-5 5h12"} />
                  </svg>
                  <span className={`text-xs font-medium ${deamMetrics.deamTrend > 0 ? "text-green-700" : "text-red-700"}`}>
                    {deamMetrics.deamTrend > 0 ? "+" : ""}{deamMetrics.deamTrend} vs antes
                  </span>
                </div>
              )}
            </div>
          </CalibrationOverlay>

          <CalibrationOverlay calibration={deamMetrics.calibration.inertia}>
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
                {deamMetrics.Ie !== null ? (
                  <span className="text-4xl font-bold text-gray-900">{deamMetrics.inertiaData.avgRecoveryTimeFormatted}</span>
                ) : (
                  <span className="text-2xl font-medium text-gray-400">Calibrando...</span>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {deamMetrics.Ie !== null ? "Recup. Promedio" : "Necesitas 1 episodio"}
                {deamMetrics.Ie !== null && !deamMetrics.Ie_reliable && (
                  <span className="ml-1 text-amber-500">(baja confianza)</span>
                )}
              </p>
              {deamMetrics.Ie !== null && deamMetrics.inertiaData.trendHoursDiff !== 0 && (
                <div className={`mt-3 inline-flex items-center gap-1 px-2 py-1 rounded-full ${
                  deamMetrics.inertiaData.trendHoursDiff < 0 ? "bg-green-100" : "bg-red-100"
                }`}>
                  <svg className={`w-3 h-3 ${deamMetrics.inertiaData.trendHoursDiff < 0 ? "text-green-600" : "text-red-600"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={deamMetrics.inertiaData.trendHoursDiff < 0 ? "M19 14l-7 7m0 0l-7-7m7 7V3" : "M5 10l7-7m0 0l7 7m-7-7v18"} />
                  </svg>
                  <span className={`text-xs font-medium ${deamMetrics.inertiaData.trendHoursDiff < 0 ? "text-green-700" : "text-red-700"}`}>
                    {deamMetrics.inertiaData.trendHoursDiff < 0 ? "" : "+"}{deamMetrics.inertiaData.trendHoursDiff.toFixed(1)}h vs antes
                  </span>
                </div>
              )}
            </div>
          </CalibrationOverlay>
        </div>

        {/* Bloque 2.5: Calibración general y métricas GPCA */}
        <div className="bg-white rounded-3xl p-5 shadow-sm">
          <div className="flex items-start justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900">Tu progreso de calibración</h3>
            <button
              onClick={() => setShowInfoModal("calibration")}
              className="w-5 h-5 rounded-full border border-gray-300 flex items-center justify-center text-gray-400 hover:text-gray-600"
            >
              <Info className="w-3 h-3" />
            </button>
          </div>
          
          {/* Barra de progreso general */}
          <div className="mb-4">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-500">
                {deamMetrics.calibration.overallState === "stable" 
                  ? "Calibrado" 
                  : deamMetrics.calibration.overallState === "calibrating"
                    ? "Calibrando..."
                    : "Recopilando datos"}
              </span>
              <span className="font-medium text-gray-700">{deamMetrics.calibration.overallProgress}%</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${
                  deamMetrics.calibration.overallState === "stable" 
                    ? "bg-green-500" 
                    : deamMetrics.calibration.overallState === "calibrating"
                      ? "bg-amber-500"
                      : "bg-gray-400"
                }`}
                style={{ width: `${deamMetrics.calibration.overallProgress}%` }}
              />
            </div>
          </div>

          {/* Métricas GHCA en mini grid (G, H, C, A) */}
          <div className="grid grid-cols-4 gap-2 text-center">
            <CalibrationIndicator calibration={deamMetrics.calibration.granularity} size="sm">
              <div className="p-2 rounded-xl bg-gray-50">
                {deamMetrics.G !== null ? (
                  <span className="text-lg font-bold text-gray-900">{Math.round(deamMetrics.G * 100)}</span>
                ) : (
                  <span className="text-sm text-gray-400">--</span>
                )}
                <p className="text-xs text-gray-500">G</p>
              </div>
            </CalibrationIndicator>
            <CalibrationIndicator calibration={deamMetrics.calibration.adherence} size="sm">
              <div className="p-2 rounded-xl bg-gray-50">
                {deamMetrics.H !== null ? (
                  <span className="text-lg font-bold text-gray-900">{Math.round(deamMetrics.H * 100)}</span>
                ) : (
                  <span className="text-sm text-gray-400">--</span>
                )}
                <p className="text-xs text-gray-500">H</p>
              </div>
            </CalibrationIndicator>
            <CalibrationIndicator calibration={deamMetrics.calibration.consciousness} size="sm">
              <div className="p-2 rounded-xl bg-gray-50">
                {deamMetrics.C !== null ? (
                  <span className="text-lg font-bold text-gray-900">{Math.round(deamMetrics.C * 100)}</span>
                ) : (
                  <span className="text-sm text-gray-400">--</span>
                )}
                <p className="text-xs text-gray-500">C</p>
              </div>
            </CalibrationIndicator>
            <CalibrationIndicator calibration={deamMetrics.calibration.adaptability} size="sm">
              <div className="p-2 rounded-xl bg-gray-50">
                {deamMetrics.A !== null ? (
                  <>
                    <span className="text-lg font-bold text-gray-900">{Math.round(deamMetrics.A * 100)}</span>
                    {deamMetrics.A_lowConfidence && (
                      <span className="text-xs text-amber-500 block">*</span>
                    )}
                  </>
                ) : (
                  <span className="text-sm text-gray-400">--</span>
                )}
                <p className="text-xs text-gray-500">A</p>
              </div>
            </CalibrationIndicator>
          </div>
          
          {/* Leyenda si hay confianza baja */}
          {deamMetrics.A !== null && deamMetrics.A_lowConfidence && (
            <p className="text-xs text-amber-600 mt-2">* Confianza baja (menos de 3 intervenciones)</p>
          )}
        </div>

        {/* Bloque 2.7: Ranking de intervenciones */}
        {deamMetrics.interventionStats.length > 0 && (
          <div className="bg-white rounded-3xl p-5 shadow-sm">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-900">Tus mejores herramientas</h3>
              <button
                onClick={() => setShowInfoModal("interventions")}
                className="w-5 h-5 rounded-full border border-gray-300 flex items-center justify-center text-gray-400 hover:text-gray-600"
              >
                <Info className="w-3 h-3" />
              </button>
            </div>
            
            <div className="space-y-3">
              {deamMetrics.interventionStats
                .sort((a, b) => b.avgDelta - a.avgDelta)
                .slice(0, 4)
                .map((stat, index) => (
                  <div key={stat.type} className="flex items-center gap-3">
                    <span className={`text-lg font-bold ${
                      index === 0 ? "text-amber-500" : 
                      index === 1 ? "text-gray-400" : 
                      index === 2 ? "text-amber-700" : "text-gray-500"
                    }`}>
                      {index + 1}
                    </span>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 capitalize">{stat.type}</p>
                      <p className="text-xs text-gray-500">{stat.uses} usos</p>
                    </div>
                    <div className="text-right">
                      <span className={`text-sm font-bold ${stat.avgDelta > 0 ? "text-green-600" : "text-gray-500"}`}>
                        {stat.avgDelta > 0 ? "-" : ""}{Math.abs(stat.avgDelta).toFixed(1)}
                      </span>
                      <p className="text-xs text-gray-500">puntos</p>
                    </div>
                  </div>
                ))}
            </div>
            
            {deamMetrics.interventionStats.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">
                Completa intervenciones para ver cuáles funcionan mejor para ti
              </p>
            )}
          </div>
        )}

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
                    : showInfoModal === "calibration"
                      ? "Calibración del sistema"
                      : showInfoModal === "interventions"
                        ? "Ranking de herramientas"
                        : "Intensidad y Bienestar"}
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              {showInfoModal === "emotional_state"
                ? "Este bloque resume como te has sentido en conjunto durante el periodo seleccionado. No muestra una emocion puntual ni un diagnostico: es una tendencia basada en tus check-ins recientes, dando mas peso a los mas cercanos en el tiempo."
                : showInfoModal === "deam_ieq"
                  ? "El indice DEAM EQ mide tu inteligencia emocional cuantificada. Se calcula con la formula: EQ = 100 * (0.20*G + 0.15*P + 0.25*C + 0.40*A) * (1 - Ie'), donde G=Granularidad, P=Percepcion/Adherencia, C=Conciencia Contextual, A=Adaptabilidad, e Ie=Inercia Emocional. Basado en el modelo de Mayer & Salovey de las 4 ramas de inteligencia emocional."
                  : showInfoModal === "inertia"
                    ? "La Inercia Emocional (Ie) mide cuanto tiempo tardan en disiparse tus estados negativos. Ahora usamos el tiempo de inicio (onset_bucket) que nos indicas en el check-in para calcular el tiempo real de la emoción, no solo desde el registro."
                    : showInfoModal === "calibration"
                      ? "El sistema necesita datos suficientes para calcular tus métricas con precisión. G (Granularidad): mínimo 7 registros. P (Percepción): 7 días de uso. C (Conciencia): 5 registros con contexto. A (Adaptabilidad): 3 intervenciones completadas. Cuando todas las métricas están calibradas, el DEAM EQ es confiable."
                      : showInfoModal === "interventions"
                        ? "Este ranking muestra qué herramientas han sido más efectivas para ti, medido por la reducción promedio de intensidad emocional después de usarlas. Cuanto mayor sea el número, más te ha ayudado esa técnica."
                        : "Muestra la evolucion de dos metricas clave: Intensidad (energia de tus emociones, escala 0-100) y Bienestar (derivado de la valencia o pleasantness, escala 0-100). El grafico te ayuda a identificar patrones temporales en tu experiencia emocional."}
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

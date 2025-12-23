"use client"

import { useState, useMemo, useRef, useEffect } from "react"
import {
  Sparkles,
  Clock,
  Brain,
  Target,
  Download,
  X,
  ChevronDown,
  ChevronUp,
  Zap,
  Lightbulb,
  Activity,
  TrendingUp,
  TrendingDown,
  Minus,
  Heart,
} from "lucide-react"
import { useVladiStore } from "@/lib/vladi-store"
import { calculateDEAMMetrics, generateInsights, generateRecommendations, DEAM_DEFINITIONS } from "@/lib/deam-engine"
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  ZAxis,
  ReferenceLine,
} from "recharts"
import { CommonHeader } from "./common-header"
import { supabase } from "@/lib/supabase/client"

type FilterType = "today" | "week" | "month" | "month2"

interface StatsViewProps {
  userId?: string
  userProfile?: {
    username: string
    display_name: string | null
    avatar_url: string | null
  }
  onAvatarClick?: () => void
  onNotificationsClick?: () => void
}

function TrendBadge({ value, inverted = false }: { value: number; inverted?: boolean }) {
  const actualValue = inverted ? -value : value
  const isPositive = actualValue > 0
  const isNegative = actualValue < 0

  const bgColor = isPositive ? "bg-green-100" : isNegative ? "bg-red-100" : "bg-amber-100"
  const textColor = isPositive ? "text-green-700" : isNegative ? "text-red-700" : "text-amber-700"
  const Icon = isPositive ? TrendingUp : isNegative ? TrendingDown : Minus

  if (value === 0) return null

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${bgColor} ${textColor}`}
    >
      <Icon className="w-3 h-3" />
      {isPositive ? "+" : ""}
      {value}%<span className="text-[10px] opacity-70">vs ant.</span>
    </span>
  )
}

function TimeTrendBadge({ hoursDiff }: { hoursDiff: number }) {
  if (hoursDiff === 0) return null

  const isImproved = hoursDiff < 0
  const bgColor = isImproved ? "bg-green-100" : "bg-red-100"
  const textColor = isImproved ? "text-green-700" : "text-red-700"
  const Icon = isImproved ? TrendingDown : TrendingUp

  const formattedDiff =
    Math.abs(hoursDiff) < 1
      ? `${Math.round(Math.abs(hoursDiff) * 60)} min`
      : `${Math.abs(hoursDiff).toFixed(1).replace(".", ",")} h`

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${bgColor} ${textColor}`}
    >
      <Icon className="w-3 h-3" />
      {isImproved ? "-" : "+"}
      {formattedDiff}
      <span className="text-[10px] opacity-70">vs ant.</span>
    </span>
  )
}

function InfoButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-5 h-5 rounded-full border border-gray-300 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:border-gray-400"
    >
      <span className="text-xs font-medium">i</span>
    </button>
  )
}

export function StatsView({ userId, userProfile, onAvatarClick, onNotificationsClick }: StatsViewProps) {
  const [filter, setFilter] = useState<FilterType>("week")
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    deam_eq: true,
    profile: true,
    inertia: true,
    intensity_wellbeing: true,
    climate: false,
    interventions: false,
    contexts: false,
    insights: true,
    recommendations: true,
    history: false,
  })
  const [infoModal, setInfoModal] = useState<string | null>(null)
  const [showReport, setShowReport] = useState(false)
  const [notificationCount, setNotificationCount] = useState(0)
  const reportRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!userId) return

    let mounted = true

    const loadNotifications = async () => {
      try {
        const { count, error } = await supabase
          .from("friend_requests")
          .select("*", { count: "exact", head: true })
          .eq("to_user_id", userId)
          .eq("status", "pending")

        if (error) throw error
        if (mounted) {
          setNotificationCount(count || 0)
        }
      } catch (error) {
        console.error("Error loading notifications:", error)
      }
    }

    loadNotifications()

    return () => {
      mounted = false
    }
  }, [userId])

  const now = new Date()
  const filterMs = {
    today: 24 * 60 * 60 * 1000,
    week: 7 * 24 * 60 * 60 * 1000,
    month: 30 * 24 * 60 * 60 * 1000,
    month2: 60 * 24 * 60 * 60 * 1000,
  }

  const periodDays = {
    today: 1,
    week: 7,
    month: 30,
    month2: 60,
  }

  const entries = useVladiStore((s) => s.entries)

  const currentEntries = entries.filter((e) => {
    const entryDate = new Date(e.timestamp)
    return now.getTime() - entryDate.getTime() <= filterMs[filter]
  })

  const previousEntries = entries.filter((e) => {
    const entryDate = new Date(e.timestamp)
    const diff = now.getTime() - entryDate.getTime()
    return diff > filterMs[filter] && diff <= filterMs[filter] * 2
  })

  const currentMetrics = useMemo(
    () => calculateDEAMMetrics(currentEntries, previousEntries, periodDays[filter]),
    [currentEntries, previousEntries, filter],
  )
  const previousMetrics = useMemo(
    () => calculateDEAMMetrics(previousEntries, [], periodDays[filter]),
    [previousEntries, filter],
  )

  const insights = useMemo(() => generateInsights(currentMetrics), [currentMetrics])
  const recommendations = useMemo(() => generateRecommendations(currentMetrics), [currentMetrics])

  const trends = useMemo(() => {
    if (!previousMetrics || previousMetrics.deamEQ === 0) {
      return { deamEQ: 0, granularity: 0, perception: 0, consciousness: 0, adaptability: 0, inertia: 0 }
    }
    return {
      deamEQ: Math.round(((currentMetrics.deamEQ - previousMetrics.deamEQ) / previousMetrics.deamEQ) * 100),
      granularity: Math.round(((currentMetrics.G - previousMetrics.G) / Math.max(previousMetrics.G, 0.01)) * 100),
      perception: Math.round(((currentMetrics.P - previousMetrics.P) / Math.max(previousMetrics.P, 0.01)) * 100),
      consciousness: Math.round(((currentMetrics.C - previousMetrics.C) / Math.max(previousMetrics.C, 0.01)) * 100),
      adaptability: Math.round(((currentMetrics.A - previousMetrics.A) / Math.max(previousMetrics.A, 0.01)) * 100),
      inertia: Math.round(((currentMetrics.Ie - previousMetrics.Ie) / Math.max(previousMetrics.Ie, 0.01)) * 100),
    }
  }, [currentMetrics, previousMetrics])

  const [xaiExplanation, setXaiExplanation] = useState<string | null>(null)

  useEffect(() => {
    const parts: string[] = []

    if (trends.deamEQ > 5) {
      if (trends.inertia < -10) parts.push("menor inercia emocional")
      if (trends.adaptability > 10) parts.push("mejor adaptabilidad")
      if (trends.granularity > 10) parts.push("mayor vocabulario emocional")
      if (trends.perception > 10) parts.push("mejor percepción")
    } else if (trends.deamEQ < -5) {
      if (trends.inertia > 10) parts.push("mayor tiempo de recuperación")
      if (trends.adaptability < -10) parts.push("menos uso de intervenciones")
    }

    if (parts.length > 0) {
      const action = trends.deamEQ > 0 ? "subió" : "bajó"
      setXaiExplanation(`Tu DEAM ${action} gracias a ${parts.join(" y ")}.`)
    } else {
      setXaiExplanation(null)
    }
  }, [trends.deamEQ, trends.inertia, trends.adaptability, trends.granularity, trends.perception])

  const radarData = [
    { metric: "G", value: Math.round(currentMetrics.G * 100), fullMark: 100 },
    { metric: "P", value: Math.round(currentMetrics.P * 100), fullMark: 100 },
    { metric: "C", value: Math.round(currentMetrics.C * 100), fullMark: 100 },
    { metric: "A", value: Math.round(currentMetrics.A * 100), fullMark: 100 },
    { metric: "Iₑ", value: Math.round((1 - currentMetrics.Ie) * 100), fullMark: 100 },
  ]

  const scatterData = currentEntries.map((e) => ({
    x: e.wellbeing,
    y: e.intensity,
    quadrant: e.quadrant,
    emotion: e.emotion,
    z: 100,
  }))

  const avgIntensity =
    currentEntries.length > 0 ? currentEntries.reduce((sum, e) => sum + e.intensity, 0) / currentEntries.length : 50
  const avgWellbeing =
    currentEntries.length > 0 ? currentEntries.reduce((sum, e) => sum + e.wellbeing, 0) / currentEntries.length : 50

  const climateCounts = { green: 0, yellow: 0, red: 0, blue: 0 }
  currentEntries.forEach((e) => {
    if (e.quadrant in climateCounts) climateCounts[e.quadrant as keyof typeof climateCounts]++
  })
  const climateData = [
    { name: "Calma", value: climateCounts.green, color: "#94B22E" },
    { name: "Energía", value: climateCounts.yellow, color: "#E6B04F" },
    { name: "Tensión", value: climateCounts.red, color: "#E6584F" },
    { name: "Bajo", value: climateCounts.blue, color: "#466D91" },
  ].filter((d) => d.value > 0)

  const climateDataForChart = climateData.length > 0 ? climateData : [{ name: "No data", value: 100, color: "#e5e7eb" }]

  const toggleSection = (key: string) => {
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const handleDownloadReport = () => {
    setShowReport(true)
  }

  return (
    <div className="flex-1 overflow-y-auto pb-24 bg-gray-50 min-h-0">
      <div className="bg-white">
        <CommonHeader
          userProfile={userProfile}
          onAvatarClick={onAvatarClick}
          onNotificationsClick={onNotificationsClick}
          notificationCount={notificationCount}
        />
      </div>

      <div className="bg-white px-5 pb-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Emociones</h2>
        <div className="flex gap-2">
          {[
            { key: "today", label: "Hoy" },
            { key: "week", label: "7 días" },
            { key: "month", label: "30 días" },
            { key: "month2", label: "60 días" },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key as FilterType)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                filter === f.key ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-5 space-y-4">
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <button onClick={() => toggleSection("deam_eq")} className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                <span className="font-semibold text-gray-900">Índice DEAM EQ</span>
                {expandedSections.deam_eq ? (
                  <ChevronUp className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                )}
              </button>
              <InfoButton onClick={() => setInfoModal("deam_eq")} />
            </div>

            {expandedSections.deam_eq && (
              <>
                <div className="flex items-baseline gap-3 mb-2">
                  <span className="text-5xl font-bold text-gray-900">{Math.round(currentMetrics.deamEQ)}</span>
                  <span className="text-gray-500">/100</span>
                  <TrendBadge value={trends.deamEQ} />
                </div>
                {xaiExplanation && <p className="text-sm text-gray-600 italic">{xaiExplanation}</p>}
              </>
            )}
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <button onClick={() => toggleSection("profile")} className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-purple-500" />
                <span className="font-semibold text-gray-900">Perfil DEAM EQ</span>
                {expandedSections.profile ? (
                  <ChevronUp className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                )}
              </button>
              <InfoButton onClick={() => setInfoModal("profile")} />
            </div>

            {expandedSections.profile && (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="#e5e7eb" />
                    <PolarAngleAxis dataKey="metric" tick={{ fontSize: 12 }} />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 10 }} />
                    <Radar name="Perfil" dataKey="value" stroke="#1f2937" fill="#1f2937" fillOpacity={0.3} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <button onClick={() => toggleSection("inertia")} className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-500" />
                <span className="font-semibold text-gray-900">Inercia Emocional</span>
                {expandedSections.inertia ? (
                  <ChevronUp className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                )}
              </button>
              <InfoButton onClick={() => setInfoModal("inertia")} />
            </div>

            {expandedSections.inertia && (
              <>
                <div className="flex items-baseline gap-3 mb-3">
                  <span className="text-4xl font-bold text-gray-900">
                    {currentMetrics.inertiaData.avgRecoveryTimeHours < 1
                      ? `${Math.round(currentMetrics.inertiaData.avgRecoveryTimeHours * 60)} min`
                      : `${currentMetrics.inertiaData.avgRecoveryTimeHours.toFixed(1).replace(".", ",")} h`}
                  </span>
                  <TimeTrendBadge hoursDiff={currentMetrics.inertiaData.trendHoursDiff || 0} />
                </div>
                <p className="text-sm text-gray-500 mb-4">Tiempo medio de recuperación</p>

                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-semibold text-gray-900">{Math.round(currentMetrics.Ie * 100)}%</p>
                    <p className="text-xs text-gray-500">Valor Iₑ</p>
                  </div>
                  <div>
                    <p className="text-2xl font-semibold text-gray-900">{currentMetrics.inertiaData.peakCount || 0}</p>
                    <p className="text-xs text-gray-500">Picos detectados</p>
                  </div>
                  <div>
                    <p className="text-2xl font-semibold text-gray-900">
                      {Math.round(currentMetrics.inertiaData.baselineIntensity * 10)}%
                    </p>
                    <p className="text-xs text-gray-500">Línea base</p>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <button onClick={() => toggleSection("intensity_wellbeing")} className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-pink-500" />
                <span className="font-semibold text-gray-900">Intensidad y Bienestar</span>
                {expandedSections.intensity_wellbeing ? (
                  <ChevronUp className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                )}
              </button>
              <InfoButton onClick={() => setInfoModal("intensity_wellbeing")} />
            </div>

            {expandedSections.intensity_wellbeing && (
              <>
                {scatterData.length > 0 ? (
                  <>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <ScatterChart margin={{ top: 10, right: 10, bottom: 30, left: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis
                            type="number"
                            dataKey="x"
                            name="Bienestar"
                            domain={[0, 100]}
                            tick={{ fontSize: 10 }}
                            label={{ value: "Bienestar →", position: "bottom", fontSize: 11 }}
                          />
                          <YAxis
                            type="number"
                            dataKey="y"
                            name="Intensidad"
                            domain={[0, 100]}
                            tick={{ fontSize: 10 }}
                            label={{ value: "Intensidad →", angle: -90, position: "insideLeft", fontSize: 11 }}
                          />
                          <ZAxis type="number" dataKey="z" range={[60, 60]} />
                          <ReferenceLine x={avgWellbeing} stroke="#1f2937" strokeDasharray="5 5" />
                          <ReferenceLine y={avgIntensity} stroke="#1f2937" strokeDasharray="5 5" />
                          <Tooltip
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                const data = payload[0].payload
                                return (
                                  <div className="bg-white p-2 rounded-lg shadow-lg border text-xs">
                                    <p className="font-medium">{data.emotion}</p>
                                    <p>Bienestar: {data.x}%</p>
                                    <p>Intensidad: {data.y}%</p>
                                  </div>
                                )
                              }
                              return null
                            }}
                          />
                          <Scatter
                            data={scatterData}
                            shape={(props: any) => {
                              const { cx, cy, payload } = props
                              return (
                                <circle
                                  cx={cx}
                                  cy={cy}
                                  r={8}
                                  fill={QUADRANT_COLORS[payload.quadrant] || "#9CA3AF"}
                                  fillOpacity={0.7}
                                  stroke={QUADRANT_COLORS[payload.quadrant] || "#9CA3AF"}
                                  strokeWidth={2}
                                />
                              )
                            }}
                          />
                        </ScatterChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-4 text-center">
                      <div>
                        <p className="text-xl font-semibold">{Math.round(avgIntensity)}%</p>
                        <p className="text-xs text-gray-500">Media intensidad</p>
                      </div>
                      <div>
                        <p className="text-xl font-semibold">{Math.round(avgWellbeing)}%</p>
                        <p className="text-xs text-gray-500">Media bienestar</p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-3 italic">
                      {avgWellbeing > 60 && avgIntensity < 60
                        ? "Tus emociones tienden a ser positivas y calmadas."
                        : avgWellbeing < 40 && avgIntensity > 60
                          ? "Registras emociones intensas de bajo bienestar. Considera usar intervenciones."
                          : "Tu distribución emocional es variada."}
                    </p>
                  </>
                ) : (
                  <p className="text-center text-gray-500 py-8">Registra emociones para ver la distribución.</p>
                )}
              </>
            )}
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <button onClick={() => toggleSection("climate")} className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-green-500" />
                <span className="font-semibold text-gray-900">Clima Emocional</span>
                {expandedSections.climate ? (
                  <ChevronUp className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                )}
              </button>
              <InfoButton onClick={() => setInfoModal("climate")} />
            </div>

            {expandedSections.climate && (
              <>
                {climateData.length > 0 ? (
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={climateData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          labelLine={false}
                        >
                          {climateData.map((entry, index) => (
                            <Cell key={index} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-8">Sin datos suficientes</p>
                )}
              </>
            )}
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <button onClick={() => toggleSection("insights")} className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-yellow-500" />
                <span className="font-semibold text-gray-900">Insights</span>
                {expandedSections.insights ? (
                  <ChevronUp className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                )}
              </button>
              <InfoButton onClick={() => setInfoModal("insights")} />
            </div>

            {expandedSections.insights && (
              <div className="space-y-2">
                {insights.length > 0 ? (
                  insights.map((insight, i) => (
                    <div key={i} className="flex items-start gap-2 p-3 bg-amber-50 rounded-lg">
                      <Zap className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-gray-700">{insight}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-gray-500 py-4">Registra más emociones para obtener insights.</p>
                )}
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <button onClick={() => toggleSection("recommendations")} className="flex items-center gap-2">
                <Target className="w-5 h-5 text-teal-500" />
                <span className="font-semibold text-gray-900">Recomendaciones</span>
                {expandedSections.recommendations ? (
                  <ChevronUp className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                )}
              </button>
              <InfoButton onClick={() => setInfoModal("recommendations")} />
            </div>

            {expandedSections.recommendations && (
              <div className="space-y-2">
                {recommendations.length > 0 ? (
                  recommendations.map((rec, i) => (
                    <div key={i} className="flex items-start gap-2 p-3 bg-teal-50 rounded-lg">
                      <Target className="w-4 h-4 text-teal-600 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-gray-700">{rec}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-gray-500 py-4">Sin recomendaciones disponibles.</p>
                )}
              </div>
            )}
          </div>

          <button
            onClick={() => setShowReport(true)}
            className="w-full py-4 bg-gray-900 text-white rounded-2xl font-medium flex items-center justify-center gap-2"
          >
            <Download className="w-5 h-5" />
            Generar Informe
          </button>
        </div>
      </div>

      {infoModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">{DEAM_DEFINITIONS[infoModal]?.name || "Información"}</h3>
              <button onClick={() => setInfoModal(null)} className="p-2 hover:bg-gray-100 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-gray-600 text-sm leading-relaxed">
              {DEAM_DEFINITIONS[infoModal]?.description || "Información no disponible."}
            </p>
          </div>
        </div>
      )}

      {showReport && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[80vh] overflow-y-auto">
            <div className="sticky top-0 bg-white p-4 border-b flex items-center justify-between">
              <h3 className="text-lg font-semibold">Informe DEAM EQ</h3>
              <button onClick={() => setShowReport(false)} className="p-2 hover:bg-gray-100 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <h4 className="font-medium mb-2">Resumen del Periodo</h4>
                <p className="text-sm text-gray-600">
                  DEAM EQ: {Math.round(currentMetrics.deamEQ)}/100
                  <br />
                  Registros: {currentEntries.length}
                  <br />
                  Tiempo de recuperación: {currentMetrics.recoveryTimeHours.toFixed(1)}h
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-2">Métricas</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>Granularidad: {currentMetrics.granularity}%</li>
                  <li>Percepción: {currentMetrics.perception}%</li>
                  <li>Conciencia: {currentMetrics.consciousness}%</li>
                  <li>Adaptabilidad: {currentMetrics.adaptability}%</li>
                  <li>Inercia: {currentMetrics.inertia}%</li>
                </ul>
              </div>
              <button className="w-full py-3 bg-gray-900 text-white rounded-xl font-medium">Descargar PDF</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const QUADRANT_COLORS: Record<string, string> = {
  green: "#94B22E",
  yellow: "#E6B04F",
  red: "#E6584F",
  blue: "#466D91",
}

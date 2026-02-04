"use client"

import { useState, useMemo, useCallback } from "react"
import { ArrowLeft, Settings, MapPin, Users, AlertCircle } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

// Types
type EmotionColor = "green" | "yellow" | "red" | "blue"

interface EmotionPing {
  id: string
  color: EmotionColor
  distanceKm: number
  minutesAgo: number
  // Pseudo-random but stable position (angle in degrees, radius factor 0-1)
  angle: number
  radiusFactor: number
}

interface EmotionalRadarViewProps {
  onClose: () => void
  userId?: string
}

// Color mapping
const COLOR_MAP: Record<EmotionColor, { bg: string; border: string; label: string; message: string }> = {
  green: {
    bg: "bg-emerald-500",
    border: "border-emerald-400",
    label: "En calma",
    message: "Ambiente tranquilo. Buen momento para conectar.",
  },
  yellow: {
    bg: "bg-amber-400",
    border: "border-amber-300",
    label: "Con energía",
    message: "Entorno activo y dinámico.",
  },
  red: {
    bg: "bg-red-500",
    border: "border-red-400",
    label: "En tensión",
    message: "Entorno tenso. Respira 30s antes de actuar.",
  },
  blue: {
    bg: "bg-blue-500",
    border: "border-blue-400",
    label: "Sin ánimo",
    message: "Ambiente melancólico. Un gesto amable puede ayudar.",
  },
}

// Generate stable mock data using seed
function generateMockPings(seed: number = 42): EmotionPing[] {
  const colors: EmotionColor[] = ["green", "yellow", "red", "blue"]
  const pings: EmotionPing[] = []
  
  // Simple seeded random
  let s = seed
  const random = () => {
    s = (s * 9301 + 49297) % 233280
    return s / 233280
  }

  for (let i = 0; i < 35; i++) {
    pings.push({
      id: `ping-${i}`,
      color: colors[Math.floor(random() * 4)],
      distanceKm: random() * 25, // 0-25km
      minutesAgo: Math.floor(random() * 120), // 0-120 minutes
      angle: random() * 360,
      radiusFactor: 0.15 + random() * 0.85, // 15%-100% from center
    })
  }
  
  return pings
}

// Radar range options
const RANGE_OPTIONS = [1, 5, 10, 20]

export function EmotionalRadarView({ onClose, userId }: EmotionalRadarViewProps) {
  // State
  const [isRadarActive, setIsRadarActive] = useState(false)
  const [isSharing, setIsSharing] = useState(false)
  const [locationPrecision, setLocationPrecision] = useState<"approximate" | "precise">("approximate")
  const [rangeKm, setRangeKm] = useState(5)
  const [hasLocationPermission, setHasLocationPermission] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedPing, setSelectedPing] = useState<EmotionPing | null>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)

  // Mock data - stable across renders
  const allPings = useMemo(() => generateMockPings(42), [])

  // Filter pings by range
  const visiblePings = useMemo(() => {
    if (!isRadarActive || hasLocationPermission === false) return []
    return allPings.filter((ping) => ping.distanceKm <= rangeKm)
  }, [allPings, rangeKm, isRadarActive, hasLocationPermission])

  // Calculate climate summary
  const climateSummary = useMemo(() => {
    if (visiblePings.length === 0) return null

    const counts = { green: 0, yellow: 0, red: 0, blue: 0 }
    visiblePings.forEach((ping) => counts[ping.color]++)

    const total = visiblePings.length
    const percentages = {
      green: Math.round((counts.green / total) * 100),
      yellow: Math.round((counts.yellow / total) * 100),
      red: Math.round((counts.red / total) * 100),
      blue: Math.round((counts.blue / total) * 100),
    }

    // Find dominant color
    const dominant = (Object.entries(counts) as [EmotionColor, number][]).reduce((a, b) =>
      a[1] > b[1] ? a : b
    )[0]

    return { counts, percentages, dominant, total }
  }, [visiblePings])

  // Handle radar activation
  const handleActivateRadar = useCallback(() => {
    if (hasLocationPermission === null) {
      // First time - show permission request
      return
    }
    
    setIsLoading(true)
    setTimeout(() => {
      setIsRadarActive(true)
      setIsLoading(false)
    }, 1500)
  }, [hasLocationPermission])

  // Handle permission grant
  const handleGrantPermission = useCallback(() => {
    setIsLoading(true)
    setTimeout(() => {
      setHasLocationPermission(true)
      setIsRadarActive(true)
      setIsLoading(false)
    }, 1500)
  }, [])

  // Handle permission deny
  const handleDenyPermission = useCallback(() => {
    setHasLocationPermission(false)
  }, [])

  // Handle ping click
  const handlePingClick = useCallback((ping: EmotionPing) => {
    setSelectedPing(ping)
    setTimeout(() => setSelectedPing(null), 3000)
  }, [])

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 pt-safe">
        <button
          onClick={onClose}
          className="w-10 h-10 flex items-center justify-center text-white/80 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        
        <div className="text-center">
          <h1 className="text-lg font-medium text-white">Radar emocional</h1>
          <p className="text-xs text-white/60">Clima emocional anónimo</p>
        </div>

        <Sheet open={settingsOpen} onOpenChange={setSettingsOpen}>
          <SheetTrigger asChild>
            <button className="w-10 h-10 flex items-center justify-center text-white/80 hover:text-white transition-colors">
              <Settings className="w-5 h-5" />
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="bg-slate-800 border-slate-700 rounded-t-3xl">
            <SheetHeader className="mb-4">
              <SheetTitle className="text-white">Configuración del radar</SheetTitle>
            </SheetHeader>
            
            <div className="space-y-6 pb-safe">
              {/* Share toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">Compartir mi estado</p>
                  <p className="text-sm text-white/60">Otros verán tu color (anónimo)</p>
                </div>
                <Switch
                  checked={isSharing}
                  onCheckedChange={setIsSharing}
                />
              </div>

              {/* Precision selector */}
              <div className="space-y-3">
                <p className="text-white font-medium">Precisión de ubicación</p>
                <div className="space-y-2">
                  <button
                    onClick={() => setLocationPrecision("approximate")}
                    className={`w-full p-3 rounded-xl flex items-center gap-3 transition-colors ${
                      locationPrecision === "approximate"
                        ? "bg-white/20 border border-white/30"
                        : "bg-white/5 border border-transparent"
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        locationPrecision === "approximate" ? "border-white" : "border-white/40"
                      }`}
                    >
                      {locationPrecision === "approximate" && (
                        <div className="w-2.5 h-2.5 rounded-full bg-white" />
                      )}
                    </div>
                    <div className="text-left">
                      <p className="text-white">Aproximada (recomendado)</p>
                      <p className="text-xs text-white/60">Mayor privacidad</p>
                    </div>
                  </button>

                  <button
                    onClick={() => setLocationPrecision("precise")}
                    className={`w-full p-3 rounded-xl flex items-center gap-3 transition-colors ${
                      locationPrecision === "precise"
                        ? "bg-white/20 border border-white/30"
                        : "bg-white/5 border border-transparent"
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        locationPrecision === "precise" ? "border-white" : "border-white/40"
                      }`}
                    >
                      {locationPrecision === "precise" && (
                        <div className="w-2.5 h-2.5 rounded-full bg-white" />
                      )}
                    </div>
                    <div className="text-left">
                      <p className="text-white">Precisa</p>
                      <p className="text-xs text-white/60">Resultados más exactos</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Privacy note */}
              <p className="text-xs text-white/50 text-center">
                No mostramos tu identidad ni tu ubicación exacta. Puedes desactivarlo cuando quieras.
              </p>
            </div>
          </SheetContent>
        </Sheet>
      </header>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 overflow-hidden">
        {/* Permission request state */}
        {hasLocationPermission === null && !isRadarActive && (
          <Card className="bg-white/10 border-white/20 p-6 mx-4 max-w-sm backdrop-blur-sm">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center">
                <MapPin className="w-8 h-8 text-white/80" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-white mb-1">Permite ubicación</h3>
                <p className="text-sm text-white/60">
                  Para ver el clima emocional cercano necesitamos acceso a tu ubicación aproximada.
                </p>
              </div>
              <div className="flex gap-3 w-full">
                <Button
                  variant="ghost"
                  onClick={handleDenyPermission}
                  className="flex-1 text-white/70 hover:text-white hover:bg-white/10"
                >
                  Ahora no
                </Button>
                <Button
                  onClick={handleGrantPermission}
                  className="flex-1 bg-white text-slate-900 hover:bg-white/90"
                  disabled={isLoading}
                >
                  {isLoading ? "Activando..." : "Permitir"}
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Permission denied state */}
        {hasLocationPermission === false && (
          <Card className="bg-white/10 border-white/20 p-6 mx-4 max-w-sm backdrop-blur-sm">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-white mb-1">Ubicación desactivada</h3>
                <p className="text-sm text-white/60">
                  Sin acceso a ubicación no podemos mostrar el radar emocional.
                </p>
              </div>
              <Button
                onClick={() => setHasLocationPermission(null)}
                className="bg-white text-slate-900 hover:bg-white/90"
              >
                Intentar de nuevo
              </Button>
            </div>
          </Card>
        )}

        {/* Loading state */}
        {isLoading && (
          <div className="flex flex-col items-center gap-4">
            <div className="w-48 h-48 rounded-full border-4 border-white/20 animate-pulse flex items-center justify-center">
              <div className="w-32 h-32 rounded-full border-4 border-white/30 animate-pulse flex items-center justify-center">
                <div className="w-16 h-16 rounded-full border-4 border-white/40 animate-pulse" />
              </div>
            </div>
            <p className="text-white/60">Escaneando área...</p>
          </div>
        )}

        {/* Active radar */}
        {isRadarActive && hasLocationPermission && !isLoading && (
          <>
            {/* Radar visualization */}
            <div className="relative w-full max-w-[320px] aspect-square">
              {/* SVG Radar */}
              <svg viewBox="0 0 300 300" className="w-full h-full">
                {/* Background glow */}
                <defs>
                  <radialGradient id="radarGlow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="rgba(255,255,255,0.1)" />
                    <stop offset="100%" stopColor="rgba(255,255,255,0)" />
                  </radialGradient>
                </defs>
                <circle cx="150" cy="150" r="145" fill="url(#radarGlow)" />

                {/* Concentric rings */}
                {[0.25, 0.5, 0.75, 1].map((factor, i) => (
                  <circle
                    key={i}
                    cx="150"
                    cy="150"
                    r={140 * factor}
                    fill="none"
                    stroke="rgba(255,255,255,0.15)"
                    strokeWidth="1"
                  />
                ))}

                {/* Cross lines */}
                <line x1="150" y1="10" x2="150" y2="290" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
                <line x1="10" y1="150" x2="290" y2="150" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
                <line x1="45" y1="45" x2="255" y2="255" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
                <line x1="255" y1="45" x2="45" y2="255" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />

                {/* Center point (user) */}
                <circle cx="150" cy="150" r="8" fill="white" />
                <circle cx="150" cy="150" r="12" fill="none" stroke="white" strokeWidth="2" opacity="0.5" />

                {/* Emotion pings */}
                {visiblePings.map((ping) => {
                  const maxRadius = 130
                  const normalizedDistance = ping.distanceKm / rangeKm
                  const radius = normalizedDistance * maxRadius * ping.radiusFactor
                  const angleRad = (ping.angle * Math.PI) / 180
                  const x = 150 + Math.cos(angleRad) * radius
                  const y = 150 + Math.sin(angleRad) * radius

                  const colorClasses: Record<EmotionColor, string> = {
                    green: "#10B981",
                    yellow: "#FBBF24",
                    red: "#EF4444",
                    blue: "#3B82F6",
                  }

                  return (
                    <g key={ping.id} onClick={() => handlePingClick(ping)} style={{ cursor: "pointer" }}>
                      <circle
                        cx={x}
                        cy={y}
                        r={selectedPing?.id === ping.id ? 10 : 6}
                        fill={colorClasses[ping.color]}
                        className="transition-all duration-200"
                      />
                      {selectedPing?.id === ping.id && (
                        <circle
                          cx={x}
                          cy={y}
                          r="14"
                          fill="none"
                          stroke={colorClasses[ping.color]}
                          strokeWidth="2"
                          opacity="0.5"
                        />
                      )}
                    </g>
                  )
                })}
              </svg>

              {/* Selected ping tooltip */}
              {selectedPing && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-sm text-white text-sm px-3 py-2 rounded-lg">
                  Aprox. {selectedPing.distanceKm.toFixed(1)} km · Hace {selectedPing.minutesAgo} min
                </div>
              )}
            </div>

            {/* Range slider */}
            <div className="w-full max-w-[320px] mt-6 px-2">
              <div className="flex items-center justify-between text-sm text-white/60 mb-2">
                <span>Alcance</span>
                <span className="font-medium text-white">{rangeKm} km</span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setRangeKm(Math.max(1, rangeKm - 1))}
                  className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
                >
                  -
                </button>
                <Slider
                  value={[rangeKm]}
                  onValueChange={([value]) => setRangeKm(value)}
                  min={1}
                  max={20}
                  step={1}
                  className="flex-1"
                />
                <button
                  onClick={() => setRangeKm(Math.min(20, rangeKm + 1))}
                  className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
                >
                  +
                </button>
              </div>
            </div>

            {/* People count */}
            <p className="text-white/70 text-sm mt-4">
              <Users className="w-4 h-4 inline mr-1" />
              {visiblePings.length} personas en los {rangeKm} km
            </p>
          </>
        )}
      </div>

      {/* Climate summary card */}
      {isRadarActive && hasLocationPermission && climateSummary && !isLoading && (
        <div className="px-4 pb-safe mb-4">
          <Card className="bg-white/10 border-white/20 p-4 backdrop-blur-sm">
            <h3 className="text-sm font-medium text-white/80 mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
              Clima cercano
            </h3>
            
            {/* Color bars */}
            <div className="flex gap-1 h-3 rounded-full overflow-hidden mb-3">
              {(["green", "yellow", "red", "blue"] as EmotionColor[]).map((color) => (
                <div
                  key={color}
                  className={`${COLOR_MAP[color].bg} transition-all duration-500`}
                  style={{ width: `${climateSummary.percentages[color]}%` }}
                />
              ))}
            </div>

            {/* Percentages */}
            <div className="flex justify-between text-xs text-white/60 mb-3">
              {(["green", "yellow", "red", "blue"] as EmotionColor[]).map((color) => (
                <div key={color} className="flex items-center gap-1">
                  <div className={`w-2 h-2 rounded-full ${COLOR_MAP[color].bg}`} />
                  <span>{climateSummary.percentages[color]}%</span>
                </div>
              ))}
            </div>

            {/* Contextual message */}
            <p className="text-sm text-white/80">
              {COLOR_MAP[climateSummary.dominant].message}
            </p>
          </Card>
        </div>
      )}

      {/* Activate radar CTA (when inactive) */}
      {!isRadarActive && hasLocationPermission && !isLoading && (
        <div className="px-4 pb-safe mb-4">
          <Button
            onClick={handleActivateRadar}
            className="w-full bg-white text-slate-900 hover:bg-white/90 h-12"
          >
            Activar radar
          </Button>
        </div>
      )}
    </div>
  )
}

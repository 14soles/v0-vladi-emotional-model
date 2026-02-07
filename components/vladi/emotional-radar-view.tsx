"use client"

import { useState, useMemo, useCallback, useEffect } from "react"
import { ArrowLeft, Settings, MapPin, Users, AlertCircle, RefreshCw } from "lucide-react"
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
import { supabase } from "@/lib/supabase/client"

// Types
type EmotionColor = "green" | "yellow" | "red" | "blue"

interface EmotionPing {
  id: string
  color: EmotionColor
  distanceKm: number
  minutesAgo: number
  latitude: number
  longitude: number
  emotion: string
  intensity: number
}

interface UserLocation {
  latitude: number
  longitude: number
  accuracy: number
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
    label: "Con energia",
    message: "Entorno activo y dinamico.",
  },
  red: {
    bg: "bg-red-500",
    border: "border-red-400",
    label: "En tension",
    message: "Entorno tenso. Respira 30s antes de actuar.",
  },
  blue: {
    bg: "bg-blue-500",
    border: "border-blue-400",
    label: "Sin animo",
    message: "Ambiente melancolico. Un gesto amable puede ayudar.",
  },
}

// Calculate distance between two coordinates using Haversine formula
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371 // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}

// Calculate angle from user to ping (for radar display)
function calculateAngle(userLat: number, userLon: number, pingLat: number, pingLon: number): number {
  const dLon = (pingLon - userLon) * Math.PI / 180
  const y = Math.sin(dLon) * Math.cos(pingLat * Math.PI / 180)
  const x = Math.cos(userLat * Math.PI / 180) * Math.sin(pingLat * Math.PI / 180) -
            Math.sin(userLat * Math.PI / 180) * Math.cos(pingLat * Math.PI / 180) * Math.cos(dLon)
  let angle = Math.atan2(y, x) * 180 / Math.PI
  return (angle + 360) % 360
}

export function EmotionalRadarView({ onClose, userId }: EmotionalRadarViewProps) {
  // State
  const [isRadarActive, setIsRadarActive] = useState(false)
  const [isSharing, setIsSharing] = useState(false)
  const [locationPrecision, setLocationPrecision] = useState<"approximate" | "precise">("approximate")
  const [rangeKm, setRangeKm] = useState(5)
  const [hasLocationPermission, setHasLocationPermission] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [selectedPing, setSelectedPing] = useState<EmotionPing | null>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null)
  const [pings, setPings] = useState<EmotionPing[]>([])
  const [error, setError] = useState<string | null>(null)

  // Load user radar settings from profile
  useEffect(() => {
    async function loadSettings() {
      if (!userId) return
      
      try {
        const { data } = await supabase
          .from("profiles")
          .select("radar_enabled, share_location, location_precision")
          .eq("id", userId)
          .single()
        
        if (data) {
          // Only load preferences, don't auto-activate radar
          // (radar_enabled just remembers preference for next time)
          setIsSharing(data.share_location || false)
          setLocationPrecision(data.location_precision || "approximate")
        }
      } catch (err) {
        console.error("Error loading radar settings:", err)
      }
    }
    loadSettings()
  }, [userId])

  // Save settings to profile when changed
  const saveSettings = useCallback(async (settings: {
    radar_enabled?: boolean
    share_location?: boolean
    location_precision?: string
  }) => {
    if (!userId) return
    
    await supabase
      .from("profiles")
      .update(settings)
      .eq("id", userId)
  }, [userId])

  // Get user's current location with automatic retries for transient failures
  const getCurrentLocation = useCallback((): Promise<UserLocation> => {
    const MAX_RETRIES = 3
    const RETRY_DELAY = 1500 // ms between retries

    function attempt(retriesLeft: number): Promise<UserLocation> {
      return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
          reject(new Error("Geolocation not supported"))
          return
        }

        const options: PositionOptions = {
          enableHighAccuracy: locationPrecision === "precise",
          timeout: 15000,
          maximumAge: locationPrecision === "precise" ? 0 : 60000
        }

        navigator.geolocation.getCurrentPosition(
          (position) => {
            let { latitude, longitude, accuracy } = position.coords
            
            // If approximate precision, round coordinates (about 1km precision)
            if (locationPrecision === "approximate") {
              latitude = Math.round(latitude * 100) / 100
              longitude = Math.round(longitude * 100) / 100
            }
            
            resolve({ latitude, longitude, accuracy })
          },
          (err) => {
            // Error code 2 = POSITION_UNAVAILABLE (transient, worth retrying)
            if (err.code === 2 && retriesLeft > 0) {
              setTimeout(() => {
                attempt(retriesLeft - 1).then(resolve, reject)
              }, RETRY_DELAY)
            } else {
              reject(err)
            }
          },
          options
        )
      })
    }

    return attempt(MAX_RETRIES)
  }, [locationPrecision])

  // Fetch nearby pings from Supabase
  const fetchNearbyPings = useCallback(async (location: UserLocation) => {
    setIsRefreshing(true)
    
    try {
      // Call the database function to get nearby pings
      const { data, error: fetchError } = await supabase
        .rpc("get_nearby_pings", {
          user_lat: location.latitude,
          user_lon: location.longitude,
          radius_km: rangeKm
        })
      
      if (fetchError) {
        console.error("Error fetching pings:", fetchError)
        // Don't set error - the RPC might not exist yet or RLS blocks, 
        // just show empty radar
        setPings([])
        return
      }
      
      if (data && data.length > 0) {
        const formattedPings: EmotionPing[] = data.map((ping: any) => ({
          id: ping.id,
          color: ping.quadrant as EmotionColor,
          distanceKm: ping.distance_km,
          minutesAgo: Math.round((Date.now() - new Date(ping.created_at).getTime()) / 60000),
          latitude: ping.latitude,
          longitude: ping.longitude,
          emotion: ping.emotion,
          intensity: ping.intensity
        }))
        setPings(formattedPings)
      } else {
        setPings([])
      }
    } catch (err) {
      console.error("Fetch error:", err)
      // Don't block the radar on fetch errors - show empty
      setPings([])
    } finally {
      setIsRefreshing(false)
    }
  }, [rangeKm])

  // Filter pings by range
  const visiblePings = useMemo(() => {
    if (!isRadarActive || hasLocationPermission === false || !userLocation) return []
    return pings.filter((ping) => ping.distanceKm <= rangeKm)
  }, [pings, rangeKm, isRadarActive, hasLocationPermission, userLocation])

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

  // Handle radar activation with real geolocation
  const handleActivateRadar = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const location = await getCurrentLocation()
      setUserLocation(location)
      setHasLocationPermission(true)
      
      // Save radar_enabled to profile (best effort, don't block)
      saveSettings({ radar_enabled: true }).catch(err => {
        console.error("Error saving settings:", err)
      })
      setIsRadarActive(true)
      
      // Fetch nearby pings
      await fetchNearbyPings(location)
    } catch (err: any) {
      console.error("Location error:", err)
      if (err.code === 1) { // PERMISSION_DENIED
        setHasLocationPermission(false)
      } else {
        setError("No se pudo obtener la ubicacion. Intenta de nuevo.")
        // Reset to allow retry
        setHasLocationPermission(null)
      }
    } finally {
      setIsLoading(false)
    }
  }, [getCurrentLocation, saveSettings, fetchNearbyPings])

  // Handle permission grant (request location)
  const handleGrantPermission = useCallback(async () => {
    await handleActivateRadar()
  }, [handleActivateRadar])

  // Handle permission deny
  const handleDenyPermission = useCallback(() => {
    setHasLocationPermission(false)
  }, [])

  // Handle sharing toggle
  const handleSharingChange = useCallback(async (enabled: boolean) => {
    setIsSharing(enabled)
    await saveSettings({ share_location: enabled })
  }, [saveSettings])

  // Handle precision change
  const handlePrecisionChange = useCallback(async (precision: "approximate" | "precise") => {
    setLocationPrecision(precision)
    await saveSettings({ location_precision: precision })
  }, [saveSettings])

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    if (!userLocation) return
    
    try {
      // Get fresh location
      const location = await getCurrentLocation()
      setUserLocation(location)
      await fetchNearbyPings(location)
    } catch (err) {
      console.error("Refresh error:", err)
    }
  }, [userLocation, getCurrentLocation, fetchNearbyPings])

  // Handle ping click
  const handlePingClick = useCallback((ping: EmotionPing) => {
    setSelectedPing(ping)
    setTimeout(() => setSelectedPing(null), 3000)
  }, [])

  // Auto-refresh pings every 30 seconds when active
  useEffect(() => {
    if (!isRadarActive || !userLocation) return
    
    const interval = setInterval(() => {
      fetchNearbyPings(userLocation)
    }, 30000)
    
    return () => clearInterval(interval)
  }, [isRadarActive, userLocation, fetchNearbyPings])

  // Refetch when range changes
  useEffect(() => {
    if (isRadarActive && userLocation) {
      fetchNearbyPings(userLocation)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rangeKm, isRadarActive, fetchNearbyPings])

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 pt-safe border-b border-gray-100">
        <button
          onClick={onClose}
          className="w-10 h-10 flex items-center justify-center text-gray-700 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        
        <div className="text-center">
          <h1 className="text-lg font-medium text-gray-900">Radar emocional</h1>
          <p className="text-xs text-gray-500">Clima emocional cercano</p>
        </div>

        <div className="flex items-center gap-1">
          {isRadarActive && (
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="w-10 h-10 flex items-center justify-center text-gray-500 hover:text-gray-900 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          )}
          
          <Sheet open={settingsOpen} onOpenChange={setSettingsOpen}>
            <SheetTrigger asChild>
              <button className="w-10 h-10 flex items-center justify-center text-gray-500 hover:text-gray-900 transition-colors">
                <Settings className="w-5 h-5" />
              </button>
            </SheetTrigger>
            <SheetContent side="bottom" className="bg-white border-gray-200 rounded-t-3xl">
              <SheetHeader className="mb-4">
                <SheetTitle className="text-gray-900">Configuracion del radar</SheetTitle>
              </SheetHeader>
              
              <div className="space-y-6 pb-safe">
                {/* Share toggle */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-900 font-medium">Compartir mi estado</p>
                    <p className="text-sm text-gray-500">Otros veran tu color (anonimo)</p>
                  </div>
                  <Switch
                    checked={isSharing}
                    onCheckedChange={handleSharingChange}
                  />
                </div>

                {/* Precision selector */}
                <div className="space-y-3">
                  <p className="text-gray-900 font-medium">Precision de ubicacion</p>
                  <div className="space-y-2">
                    <button
                      onClick={() => handlePrecisionChange("approximate")}
                      className={`w-full p-3 rounded-xl flex items-center gap-3 transition-colors ${
                        locationPrecision === "approximate"
                          ? "bg-gray-100 border border-gray-300"
                          : "bg-gray-50 border border-transparent"
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          locationPrecision === "approximate" ? "border-gray-900" : "border-gray-300"
                        }`}
                      >
                        {locationPrecision === "approximate" && (
                          <div className="w-2.5 h-2.5 rounded-full bg-gray-900" />
                        )}
                      </div>
                      <div className="text-left">
                        <p className="text-gray-900">Aproximada (recomendado)</p>
                        <p className="text-xs text-gray-500">Mayor privacidad (~1km)</p>
                      </div>
                    </button>

                    <button
                      onClick={() => handlePrecisionChange("precise")}
                      className={`w-full p-3 rounded-xl flex items-center gap-3 transition-colors ${
                        locationPrecision === "precise"
                          ? "bg-gray-100 border border-gray-300"
                          : "bg-gray-50 border border-transparent"
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          locationPrecision === "precise" ? "border-gray-900" : "border-gray-300"
                        }`}
                      >
                        {locationPrecision === "precise" && (
                          <div className="w-2.5 h-2.5 rounded-full bg-gray-900" />
                        )}
                      </div>
                      <div className="text-left">
                        <p className="text-gray-900">Precisa</p>
                        <p className="text-xs text-gray-500">Resultados mas exactos</p>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Privacy note */}
                <p className="text-xs text-gray-400 text-center">
                  No mostramos tu identidad ni tu ubicacion exacta. Los datos expiran en 15 minutos.
                </p>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 overflow-hidden">
        {/* Permission request state */}
        {hasLocationPermission === null && !isRadarActive && !isLoading && (
          <Card className="bg-gray-50 border-gray-200 p-6 mx-4 max-w-sm">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
                <MapPin className="w-8 h-8 text-gray-500" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-1">Permite ubicacion</h3>
                <p className="text-sm text-gray-500">
                  Para ver el clima emocional cercano necesitamos acceso a tu ubicacion aproximada.
                </p>
              </div>
              <div className="flex gap-3 w-full">
                <Button
                  variant="ghost"
                  onClick={handleDenyPermission}
                  className="flex-1 text-gray-500 hover:text-gray-900 hover:bg-gray-100"
                >
                  Ahora no
                </Button>
                <Button
                  onClick={handleGrantPermission}
                  className="flex-1 bg-gray-900 text-white hover:bg-gray-800"
                  disabled={isLoading}
                >
                  Permitir
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Permission denied state */}
        {hasLocationPermission === false && (
          <Card className="bg-red-50 border-red-200 p-6 mx-4 max-w-sm">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-red-500" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-1">Ubicacion desactivada</h3>
                <p className="text-sm text-gray-500">
                  Sin acceso a ubicacion no podemos mostrar el radar emocional. Activa la ubicacion en la configuracion de tu navegador.
                </p>
              </div>
              <Button
                onClick={() => setHasLocationPermission(null)}
                className="bg-gray-900 text-white hover:bg-gray-800"
              >
                Intentar de nuevo
              </Button>
            </div>
          </Card>
        )}

        {/* Error state */}
        {error && (
          <Card className="bg-red-50 border-red-200 p-4 mx-4 max-w-sm mb-4">
            <p className="text-red-600 text-sm text-center">{error}</p>
          </Card>
        )}

        {/* Loading state */}
        {isLoading && (
          <div className="flex flex-col items-center gap-4">
            <div className="w-48 h-48 rounded-full border-4 border-gray-200 animate-pulse flex items-center justify-center">
              <div className="w-32 h-32 rounded-full border-4 border-gray-300 animate-pulse flex items-center justify-center">
                <div className="w-16 h-16 rounded-full border-4 border-gray-400 animate-pulse" />
              </div>
            </div>
            <p className="text-gray-500">Obteniendo ubicacion...</p>
          </div>
        )}

        {/* Active radar */}
        {isRadarActive && hasLocationPermission && !isLoading && userLocation && (
          <>
            {/* Radar visualization */}
            <div className="relative w-full max-w-[320px] aspect-square">
              {/* SVG Radar */}
              <svg viewBox="0 0 300 300" className="w-full h-full">
                {/* Background */}
                <defs>
                  <radialGradient id="radarGlow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="rgba(243,244,246,0.8)" />
                    <stop offset="100%" stopColor="rgba(243,244,246,0)" />
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
                    stroke="rgba(209,213,219,0.6)"
                    strokeWidth="1"
                  />
                ))}

                {/* Cross lines */}
                <line x1="150" y1="10" x2="150" y2="290" stroke="rgba(209,213,219,0.4)" strokeWidth="1" />
                <line x1="10" y1="150" x2="290" y2="150" stroke="rgba(209,213,219,0.4)" strokeWidth="1" />
                <line x1="45" y1="45" x2="255" y2="255" stroke="rgba(209,213,219,0.3)" strokeWidth="1" />
                <line x1="255" y1="45" x2="45" y2="255" stroke="rgba(209,213,219,0.3)" strokeWidth="1" />

                {/* Center point (user) */}
                <circle cx="150" cy="150" r="8" fill="#1F2937" />
                <circle cx="150" cy="150" r="12" fill="none" stroke="#1F2937" strokeWidth="2" opacity="0.3" />

                {/* Emotion pings */}
                {visiblePings.map((ping) => {
                  const maxRadius = 130
                  const normalizedDistance = Math.min(ping.distanceKm / rangeKm, 1)
                  const radius = normalizedDistance * maxRadius
                  const angle = calculateAngle(
                    userLocation.latitude, 
                    userLocation.longitude, 
                    ping.latitude, 
                    ping.longitude
                  )
                  const angleRad = (angle - 90) * Math.PI / 180 // Adjust so 0 is up
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
                <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-sm px-3 py-2 rounded-lg shadow-lg">
                  {selectedPing.emotion} - {selectedPing.distanceKm.toFixed(1)} km - Hace {selectedPing.minutesAgo} min
                </div>
              )}
            </div>

            {/* Range slider */}
            <div className="w-full max-w-[320px] mt-6 px-2">
              <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
                <span>Alcance</span>
                <span className="font-medium text-gray-900">{rangeKm} km</span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setRangeKm(Math.max(1, rangeKm - 1))}
                  className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-700 hover:bg-gray-200 transition-colors"
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
                  className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-700 hover:bg-gray-200 transition-colors"
                >
                  +
                </button>
              </div>
            </div>

            {/* People count */}
            <p className="text-gray-600 text-sm mt-4">
              <Users className="w-4 h-4 inline mr-1" />
              {visiblePings.length} personas en los {rangeKm} km
            </p>
          </>
        )}
      </div>

      {/* Climate summary card */}
      {isRadarActive && hasLocationPermission && climateSummary && !isLoading && (
        <div className="px-4 pb-safe mb-4">
          <Card className="bg-gray-50 border-gray-200 p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-gray-900 animate-pulse" />
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
            <div className="flex justify-between text-xs text-gray-500 mb-3">
              {(["green", "yellow", "red", "blue"] as EmotionColor[]).map((color) => (
                <div key={color} className="flex items-center gap-1">
                  <div className={`w-2 h-2 rounded-full ${COLOR_MAP[color].bg}`} />
                  <span>{climateSummary.percentages[color]}%</span>
                </div>
              ))}
            </div>

            {/* Contextual message */}
            <p className="text-sm text-gray-700">
              {COLOR_MAP[climateSummary.dominant].message}
            </p>
          </Card>
        </div>
      )}

      {/* Empty state when radar is active but no pings */}
      {isRadarActive && hasLocationPermission && visiblePings.length === 0 && !isLoading && userLocation && (
        <div className="px-4 pb-safe mb-4">
          <Card className="bg-gray-50 border-gray-200 p-4 text-center">
            <p className="text-gray-500 text-sm">
              No hay registros emocionales cercanos en los ultimos 15 minutos.
              {!isSharing && " Activa 'Compartir mi estado' para contribuir al radar."}
            </p>
          </Card>
        </div>
      )}

      {/* Activate radar CTA (when inactive but has permission) */}
      {!isRadarActive && hasLocationPermission && !isLoading && (
        <div className="px-4 pb-safe mb-4">
          <Button
            onClick={handleActivateRadar}
            className="w-full bg-gray-900 text-white hover:bg-gray-800 h-12"
          >
            <MapPin className="w-5 h-5 mr-2" />
            Activar radar
          </Button>
        </div>
      )}
    </div>
  )
}

"use client"

import { useMemo } from "react"
import { getEmotionAxes } from "@/lib/emotion-mapping"

interface EmotionPoint {
  emotion: string
  intensity: number // 0-100
  wellbeing: number // 0-100
  color: string
}

interface IntensityWellbeingWaveChartProps {
  entries: Array<{
    emotion: string
    intensity: number // 0-1
    valence?: number
  }>
}

// Color mapping by quadrant
function getColorForQuadrant(intensity: number, wellbeing: number): string {
  const arousalThreshold = 50 // mid-point
  const valenceThreshold = 50 // mid-point

  if (intensity <= arousalThreshold && wellbeing >= valenceThreshold) {
    return "#94B22E" // green - calm
  } else if (intensity <= arousalThreshold && wellbeing < valenceThreshold) {
    return "#466D91" // blue - low mood
  } else if (intensity > arousalThreshold && wellbeing >= valenceThreshold) {
    return "#E6B04F" // yellow - energetic
  } else {
    return "#E6584F" // red - tense
  }
}

// Gaussian function
function gaussian(x: number, mean: number, sigma: number): number {
  return Math.exp(-Math.pow(x - mean, 2) / (2 * sigma * sigma))
}

export function IntensityWellbeingWaveChart({ entries }: IntensityWellbeingWaveChartProps) {
  const { points, meanIntensity, meanWellbeing } = useMemo(() => {
    if (!entries || entries.length === 0) {
      return { points: [], meanIntensity: 0, meanWellbeing: 50 }
    }

    // Transform entries to points
    const pts: EmotionPoint[] = entries.map((entry) => {
      const intensityScore = Math.round((entry.intensity || 0) * 100)
      let valence = entry.valence
      if (valence === undefined) {
        valence = getEmotionAxes(entry.emotion).valence
      }
      const wellbeingScore = Math.round((valence + 1) * 50)
      const color = getColorForQuadrant(intensityScore, wellbeingScore)

      return {
        emotion: entry.emotion,
        intensity: intensityScore,
        wellbeing: wellbeingScore,
        color,
      }
    })

    // Calculate means
    const meanInt = Math.round(pts.reduce((sum, p) => sum + p.intensity, 0) / pts.length)
    const meanWell = Math.round(pts.reduce((sum, p) => sum + p.wellbeing, 0) / pts.length)

    return { points: pts, meanIntensity: meanInt, meanWellbeing: meanWell }
  }, [entries])

  // Generate wave paths for each color group
  const wavePaths = useMemo(() => {
    if (points.length === 0) return []

    // Group points by color
    const colorGroups = new Map<string, EmotionPoint[]>()
    points.forEach((point) => {
      if (!colorGroups.has(point.color)) {
        colorGroups.set(point.color, [])
      }
      colorGroups.get(point.color)!.push(point)
    })

    // Generate wave for each color group
    const paths: Array<{ color: string; path: string }> = []

    colorGroups.forEach((groupPoints, color) => {
      const resolution = 100
      const sigma = 12

      const densityProfile: number[] = Array(resolution).fill(0)

      groupPoints.forEach((point) => {
        for (let x = 0; x < resolution; x++) {
          const xPos = (x / resolution) * 100
          const wellbeingContribution = gaussian(xPos, point.wellbeing, sigma)

          const heightFactor = point.intensity / 100
          densityProfile[x] += wellbeingContribution * heightFactor * 80
        }
      })

      const maxDensity = Math.max(...densityProfile, 0.1)
      const pathPoints: string[] = []

      pathPoints.push(`M 0 100`) // Start at bottom-left

      for (let x = 0; x < resolution; x++) {
        const svgX = (x / resolution) * 100
        const normalizedHeight = (densityProfile[x] / maxDensity) * 100
        const svgY = Math.max(0, Math.min(100, 100 - normalizedHeight))

        pathPoints.push(`L ${svgX.toFixed(2)} ${svgY.toFixed(2)}`)
      }

      pathPoints.push(`L 100 100`) // End at bottom-right
      pathPoints.push(`Z`) // Close path

      paths.push({
        color,
        path: pathPoints.join(" "),
      })
    })

    return paths
  }, [points])

  return (
    <div className="space-y-4">
      {/* Chart */}
      <div className="relative w-full aspect-[3/2]">
        <svg viewBox="0 0 115 115" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
          <text x="2" y="8" fontSize="4" fill="#9CA3AF" textAnchor="start">
            100
          </text>
          <text x="2" y="55" fontSize="4" fill="#9CA3AF" textAnchor="start">
            50
          </text>
          <text x="2" y="103" fontSize="4" fill="#9CA3AF" textAnchor="start">
            0
          </text>

          <line x1="10" y1="5" x2="10" y2="103" stroke="#E5E7EB" strokeWidth="0.5" />

          <line x1="10" y1="103" x2="110" y2="103" stroke="#E5E7EB" strokeWidth="0.5" />

          <text x="10" y="109" fontSize="3.5" fill="#9CA3AF" textAnchor="middle">
            0
          </text>
          <text x="35" y="109" fontSize="3.5" fill="#9CA3AF" textAnchor="middle">
            25
          </text>
          <text x="60" y="109" fontSize="3.5" fill="#9CA3AF" textAnchor="middle">
            50
          </text>
          <text x="85" y="109" fontSize="3.5" fill="#9CA3AF" textAnchor="middle">
            75
          </text>
          <text x="110" y="109" fontSize="3.5" fill="#9CA3AF" textAnchor="middle">
            100
          </text>

          <g transform="translate(10, 3) scale(1, 1)">
            <clipPath id="chartClip">
              <rect x="0" y="0" width="100" height="100" />
            </clipPath>
            {wavePaths.map((wave, idx) => (
              <path
                key={idx}
                d={wave.path}
                fill={wave.color}
                fillOpacity="0.5"
                stroke="none"
                clipPath="url(#chartClip)"
              />
            ))}
          </g>
        </svg>
      </div>

      {/* Means */}
      <div className="flex items-center justify-between px-4">
        <div className="flex items-baseline gap-2">
          <span className="text-xs text-gray-600">Media intensidad</span>
          <span className="text-3xl font-bold text-gray-900">{meanIntensity}</span>
          <span className="text-sm text-gray-400">/100</span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-xs text-gray-600">Media bienestar</span>
          <span className="text-3xl font-bold text-gray-900">{meanWellbeing}</span>
          <span className="text-sm text-gray-400">/100</span>
        </div>
      </div>

      {/* Interpretation text */}
      <p className="text-xs text-gray-400 italic text-center px-4">
        Tus emociones se mantienen estables en bienestar y con ligeros picos de intensidad.
      </p>
    </div>
  )
}

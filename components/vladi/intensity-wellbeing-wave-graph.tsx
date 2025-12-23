"use client"

import { useState } from "react"
import { Info } from "lucide-react"

// Emotion family colors based on quadrants
const QUADRANT_COLORS = {
  calm: "#7FBA7A", // Verde - En calma
  energy: "#FFD95A", // Amarillo - Con energía
  tension: "#FF6B82", // Rojo - En tensión
  down: "#7BA5DD", // Azul - Sin ánimo
}

interface EmotionPoint {
  emotion: string
  wellbeing: number // 0-100 (Eje X - Bienestar)
  intensity: number // 0-100 (Eje Y - ENERGÍA, no confundir con escala 1-10)
  color: string
  timestamp: string
}

interface IntensityWellbeingWaveGraphProps {
  emotions: EmotionPoint[]
  averageIntensity: number
  averageWellbeing: number
  aiInsight?: string
  onEmotionClick?: (emotion: EmotionPoint) => void
}

export function IntensityWellbeingWaveGraph({
  emotions,
  averageIntensity,
  averageWellbeing,
  aiInsight = "Tus emociones se mantiene estables en bienestar y con ligeros picos de intensidad.",
  onEmotionClick,
}: IntensityWellbeingWaveGraphProps) {
  const [selectedEmotion, setSelectedEmotion] = useState<EmotionPoint | null>(null)
  const [showInfo, setShowInfo] = useState(false)

  // SVG dimensions
  const width = 800
  const height = 400
  const padding = { top: 20, right: 20, bottom: 60, left: 60 }
  const graphWidth = width - padding.left - padding.right
  const graphHeight = height - padding.top - padding.bottom

  // Generate Gaussian wave for each emotion point
  const generateWave = (emotion: EmotionPoint) => {
    const centerX = (emotion.wellbeing / 100) * graphWidth + padding.left
    const peakY = padding.top + graphHeight - (emotion.intensity / 100) * graphHeight
    const bottomY = padding.top + graphHeight

    const points: [number, number][] = []
    const sigma = 40 // Width of the wave
    const samples = 100

    for (let i = 0; i < samples; i++) {
      const x = padding.left + (i / samples) * graphWidth
      const distance = Math.abs(x - centerX)
      const height = Math.exp(-Math.pow(distance, 2) / (2 * Math.pow(sigma, 2)))
      const y = bottomY - height * (bottomY - peakY)
      points.push([x, y])
    }

    // Close the path at the bottom
    points.push([padding.left + graphWidth, bottomY])
    points.push([padding.left, bottomY])

    return points.map((p) => p.join(",")).join(" ")
  }

  const handleEmotionClick = (emotion: EmotionPoint) => {
    setSelectedEmotion(emotion)
    onEmotionClick?.(emotion)
  }

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-6" style={{ boxShadow: "0px 4px 22.3px 0px rgba(0, 0, 0, 0.11)" }}>
      {/* Header */}
      <div className="flex items-center justify-center gap-2 mb-4">
        <h2 className="text-sm font-normal text-gray-900 leading-[18px]">Intensidad y bienestar</h2>
        <button onClick={() => setShowInfo(true)} className="text-gray-400 hover:text-gray-600 transition-colors">
          <Info className="w-4 h-4" />
        </button>
      </div>

      {/* Graph */}
      <div className="w-full mb-6">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto" style={{ maxHeight: "450px" }}>
          {/* Y-axis labels (Intensity) */}
          <text
            x={padding.left - 35}
            y={padding.top}
            className="text-[10px] sm:text-xs fill-gray-400"
            textAnchor="middle"
          >
            100
          </text>
          <text
            x={padding.left - 35}
            y={padding.top + graphHeight / 2}
            className="text-[10px] sm:text-xs fill-gray-400"
            textAnchor="middle"
          >
            50
          </text>
          <text
            x={padding.left - 35}
            y={padding.top + graphHeight}
            className="text-[10px] sm:text-xs fill-gray-400"
            textAnchor="middle"
          >
            0
          </text>

          {/* X-axis labels (Wellbeing) */}
          <text x={padding.left} y={height - 25} className="text-[10px] sm:text-xs fill-gray-400" textAnchor="middle">
            0
          </text>
          <text
            x={padding.left + graphWidth / 4}
            y={height - 25}
            className="text-[10px] sm:text-xs fill-gray-400"
            textAnchor="middle"
          >
            25
          </text>
          <text
            x={padding.left + graphWidth / 2}
            y={height - 25}
            className="text-[10px] sm:text-xs fill-gray-400"
            textAnchor="middle"
          >
            50
          </text>
          <text
            x={padding.left + (3 * graphWidth) / 4}
            y={height - 25}
            className="text-[10px] sm:text-xs fill-gray-400"
            textAnchor="middle"
          >
            75
          </text>
          <text
            x={padding.left + graphWidth}
            y={height - 25}
            className="text-[10px] sm:text-xs fill-gray-400"
            textAnchor="middle"
          >
            100
          </text>

          {/* Axes */}
          <line
            x1={padding.left}
            y1={padding.top}
            x2={padding.left}
            y2={padding.top + graphHeight}
            stroke="#E5E7EB"
            strokeWidth="2"
          />
          <line
            x1={padding.left}
            y1={padding.top + graphHeight}
            x2={padding.left + graphWidth}
            y2={padding.top + graphHeight}
            stroke="#1F2937"
            strokeWidth="2"
          />

          {/* Emotion waves */}
          {emotions.map((emotion, index) => (
            <g key={`wave-${index}`}>
              <defs>
                <linearGradient id={`gradient-${index}`} x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor={emotion.color} stopOpacity="0.6" />
                  <stop offset="100%" stopColor={emotion.color} stopOpacity="0.1" />
                </linearGradient>
              </defs>
              <polygon points={generateWave(emotion)} fill={`url(#gradient-${index})`} stroke="none" />
            </g>
          ))}

          {/* Emotion points */}
          {emotions.map((emotion, index) => {
            const x = (emotion.wellbeing / 100) * graphWidth + padding.left // Bienestar en eje X
            const y = padding.top + graphHeight - (emotion.intensity / 100) * graphHeight // Energía en eje Y
            return (
              <circle
                key={`point-${index}`}
                cx={x}
                cy={y}
                r="6"
                fill={emotion.color}
                stroke="white"
                strokeWidth="2"
                className="cursor-pointer hover:r-8 transition-all"
                onClick={() => handleEmotionClick(emotion)}
              />
            )
          })}

          {/* Selected emotion tooltip */}
          {selectedEmotion && (
            <g>
              <rect
                x={(selectedEmotion.wellbeing / 100) * graphWidth + padding.left - 60}
                y={padding.top + graphHeight - (selectedEmotion.intensity / 100) * graphHeight - 50}
                width="120"
                height="40"
                rx="8"
                fill="white"
                stroke={selectedEmotion.color}
                strokeWidth="2"
              />
              <text
                x={(selectedEmotion.wellbeing / 100) * graphWidth + padding.left}
                y={padding.top + graphHeight - (selectedEmotion.intensity / 100) * graphHeight - 35}
                className="text-xs font-medium fill-gray-900"
                textAnchor="middle"
              >
                {selectedEmotion.emotion}
              </text>
              <text
                x={(selectedEmotion.wellbeing / 100) * graphWidth + padding.left}
                y={padding.top + graphHeight - (selectedEmotion.intensity / 100) * graphHeight - 20}
                className="text-xs fill-gray-500"
                textAnchor="middle"
              >
                E:{selectedEmotion.intensity} B:{selectedEmotion.wellbeing}
              </text>
            </g>
          )}
        </svg>
      </div>

      {/* Averages */}
      <div className="flex items-center justify-center flex-row gap-6 sm:gap-8 mb-4">
        <div className="flex items-baseline gap-1">
          <span className="text-xs text-gray-900 leading-[16px]">Media energía</span>
          <span className="text-2xl font-bold text-gray-900 leading-[28px]">{averageIntensity}</span>
          <span className="text-xs text-gray-400">/100</span>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-xs text-gray-900 leading-[16px]">Media bienestar</span>
          <span className="text-2xl font-bold text-gray-900 leading-[28px]">{averageWellbeing}</span>
          <span className="text-xs text-gray-400">/100</span>
        </div>
      </div>

      {/* AI Insight */}
      <p className="text-xs text-gray-400 italic text-center leading-[16px]">{aiInsight}</p>

      {/* Info Modal */}
      {showInfo && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
          onClick={() => setShowInfo(false)}
        >
          <div className="bg-white rounded-3xl p-8 max-w-md shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Intensidad y bienestar</h3>
            <p className="text-gray-600 leading-relaxed mb-6">
              Este gráfico muestra todas las emociones que has registrado en el período seleccionado. El eje horizontal
              representa el bienestar (0-100), cuanto más a la derecha, mejor te sentiste. El eje vertical representa la
              energía (0-100), cuanto más arriba, más energía tenías. Cada color representa una familia emocional
              diferente: verde (en calma), amarillo (con energía), rojo (en tensión) y azul (sin ánimo).
            </p>
            <button
              onClick={() => setShowInfo(false)}
              className="w-full py-3 bg-gray-900 text-white rounded-full hover:bg-gray-800 transition-colors"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

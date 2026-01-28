"use client"

import { useMemo } from "react"
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from "recharts"
import type { DEAMMetrics } from "@/lib/vladi-types"
import { DEAM_DEFINITIONS } from "@/lib/deam-engine"

interface DEAMRadarProps {
  metrics: DEAMMetrics
}

// Mapeo de etiquetas cortas para el radar
const RADAR_LABELS = {
  G: "Granularidad",
  P: "Percepcion", 
  C: "Contexto",
  A: "Adaptabilidad",
  R: "Resiliencia", // Inverso de Inercia
}

export function DEAMRadar({ metrics }: DEAMRadarProps) {
  const data = useMemo(
    () => [
      { 
        metric: RADAR_LABELS.G, 
        shortLabel: "G",
        value: metrics.granularity, 
        fullMark: 100,
        description: DEAM_DEFINITIONS.g.description
      },
      { 
        metric: RADAR_LABELS.P, 
        shortLabel: "P",
        value: metrics.perception, 
        fullMark: 100,
        description: DEAM_DEFINITIONS.p.description
      },
      { 
        metric: RADAR_LABELS.C, 
        shortLabel: "C",
        value: metrics.consciousness, 
        fullMark: 100,
        description: DEAM_DEFINITIONS.c.description
      },
      { 
        metric: RADAR_LABELS.A, 
        shortLabel: "A",
        value: metrics.adaptability, 
        fullMark: 100,
        description: DEAM_DEFINITIONS.a.description
      },
      { 
        metric: RADAR_LABELS.R, 
        shortLabel: "R",
        // Resiliencia = inverso de inercia (100 - inercia normalizada)
        // Si inercia es baja (buena recuperacion), resiliencia es alta
        value: Math.max(0, 100 - metrics.emotionalInertia * 20), 
        fullMark: 100,
        description: "Capacidad de recuperacion rapida de estados negativos. Inverso de la inercia emocional."
      },
    ],
    [metrics],
  )

  return (
    <div className="w-full h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
          <PolarGrid stroke="var(--border)" />
          <PolarAngleAxis dataKey="metric" tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} />
          <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} />
          <Radar
            name="DEAM EQ"
            dataKey="value"
            stroke="var(--primary)"
            fill="var(--primary)"
            fillOpacity={0.3}
            strokeWidth={2}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
}

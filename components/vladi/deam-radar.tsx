"use client"

import { useMemo } from "react"
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from "recharts"
import type { DEAMMetrics } from "@/lib/vladi-types"

interface DEAMRadarProps {
  metrics: DEAMMetrics
}

export function DEAMRadar({ metrics }: DEAMRadarProps) {
  const data = useMemo(
    () => [
      { metric: "Granularidad", value: metrics.granularity, fullMark: 100 },
      { metric: "Percepción", value: metrics.perception, fullMark: 100 },
      { metric: "Conciencia", value: metrics.consciousness, fullMark: 100 },
      { metric: "Adaptabilidad", value: metrics.adaptability, fullMark: 100 },
      { metric: "Resiliencia", value: Math.max(0, 100 - metrics.emotionalInertia * 20), fullMark: 100 },
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

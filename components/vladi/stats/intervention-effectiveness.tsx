"use client"

import { useMemo } from "react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Zap, Award } from "lucide-react"
import type { CheckIn } from "@/lib/vladi-types"
import { INTERVENTIONS } from "@/lib/vladi-types"

interface InterventionEffectivenessProps {
  checkIns: CheckIn[]
}

export function InterventionEffectiveness({ checkIns }: InterventionEffectivenessProps) {
  const { data, bestIntervention } = useMemo(() => {
    const withIntervention = checkIns.filter((c) => c.interventionId && c.intensityAfter !== undefined)

    const interventionDeltas: Record<string, { deltas: number[]; name: string }> = {}

    withIntervention.forEach((c) => {
      if (!c.interventionId) return
      const intervention = INTERVENTIONS.find((i) => i.id === c.interventionId)
      if (!intervention) return

      if (!interventionDeltas[intervention.type]) {
        interventionDeltas[intervention.type] = { deltas: [], name: intervention.name }
      }

      const delta = (c.intensityBefore || 0) - (c.intensityAfter || 0)
      interventionDeltas[intervention.type].deltas.push(delta)
    })

    const chartData = Object.entries(interventionDeltas)
      .map(([type, { deltas, name }]) => ({
        type,
        name,
        avgDelta: Math.round((deltas.reduce((a, b) => a + b, 0) / deltas.length) * 10) / 10,
        uses: deltas.length,
      }))
      .sort((a, b) => b.avgDelta - a.avgDelta)

    const best = chartData.length > 0 ? chartData[0] : null

    return { data: chartData, bestIntervention: best }
  }, [checkIns])

  const getBarColor = (delta: number) => {
    if (delta >= 3) return "var(--chart-2)" // Green - very effective
    if (delta >= 1.5) return "var(--chart-1)" // Teal - effective
    if (delta > 0) return "var(--chart-5)" // Yellow - somewhat effective
    return "var(--muted)" // Gray - not effective
  }

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Zap className="h-5 w-5 text-primary" />
          Eficacia de intervenciones
        </CardTitle>
      </CardHeader>
      <CardContent>
        {bestIntervention && (
          <div className="mb-4 p-3 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center gap-3">
            <Award className="h-8 w-8 text-green-500" />
            <div>
              <p className="text-sm font-medium text-green-700 dark:text-green-300">Lo que más te funciona</p>
              <p className="text-sm text-green-600 dark:text-green-400">
                {bestIntervention.name} (Δ -{bestIntervention.avgDelta} puntos)
              </p>
            </div>
          </div>
        )}

        {data.length > 0 ? (
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} layout="vertical" margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                <XAxis
                  type="number"
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                  tickLine={false}
                  axisLine={false}
                  width={100}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                    color: "var(--foreground)",
                  }}
                  formatter={(value: number) => [`Δ -${value} puntos`, "Reducción media"]}
                />
                <Bar dataKey="avgDelta" radius={[0, 4, 4, 0]}>
                  {data.map((entry, index) => (
                    <Cell key={index} fill={getBarColor(entry.avgDelta)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-8">
            Usa intervenciones después de tus check-ins para ver cuáles te funcionan mejor
          </p>
        )}

        {data.length > 0 && (
          <p className="text-xs text-muted-foreground mt-2 text-center">Mayor reducción = más efectiva para ti</p>
        )}
      </CardContent>
    </Card>
  )
}

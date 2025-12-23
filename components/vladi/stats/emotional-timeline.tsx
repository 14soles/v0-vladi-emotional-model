"use client"

import { useMemo } from "react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { CheckIn } from "@/lib/vladi-types"

interface EmotionalTimelineProps {
  checkIns: CheckIn[]
  days?: number
}

export function EmotionalTimeline({ checkIns, days = 30 }: EmotionalTimelineProps) {
  const data = useMemo(() => {
    const now = new Date()
    const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)

    // Group by day
    const dailyData: Record<string, { scores: number[]; date: Date }> = {}

    checkIns
      .filter((c) => new Date(c.timestamp) >= cutoff)
      .forEach((c) => {
        const dateKey = new Date(c.timestamp).toISOString().split("T")[0]
        if (!dailyData[dateKey]) {
          dailyData[dateKey] = { scores: [], date: new Date(c.timestamp) }
        }
        const valenceMultiplier = c.valence === "positive" ? 1 : c.valence === "negative" ? -1 : 0
        dailyData[dateKey].scores.push(valenceMultiplier * (c.intensityBefore || 5))
      })

    // Convert to array and calculate daily averages
    return Object.entries(dailyData)
      .map(([dateKey, { scores, date }]) => ({
        date: dateKey,
        displayDate: date.toLocaleDateString("es-ES", { day: "numeric", month: "short" }),
        score: Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10,
        checkIns: scores.length,
      }))
      .sort((a, b) => a.date.localeCompare(b.date))
  }, [checkIns, days])

  if (data.length === 0) {
    return (
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Evolución emocional</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            Necesitas más check-ins para ver tu evolución
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="text-base">Evolución emocional ({days} días)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="displayDate" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} tickLine={false} />
              <YAxis
                domain={[-10, 10]}
                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: "8px",
                  color: "var(--foreground)",
                }}
                labelStyle={{ color: "var(--foreground)" }}
                formatter={(value: number) => [value.toFixed(1), "Índice"]}
              />
              <ReferenceLine y={0} stroke="var(--muted-foreground)" strokeDasharray="5 5" />
              <Line
                type="monotone"
                dataKey="score"
                stroke="var(--primary)"
                strokeWidth={2}
                dot={{ fill: "var(--primary)", r: 4 }}
                activeDot={{ r: 6, fill: "var(--primary)" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="flex justify-between text-xs text-muted-foreground mt-2">
          <span>Negativo</span>
          <span>Neutro</span>
          <span>Positivo</span>
        </div>
      </CardContent>
    </Card>
  )
}

"use client"

import { useMemo } from "react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Clock, TrendingDown, TrendingUp } from "lucide-react"
import type { CheckIn } from "@/lib/vladi-types"

interface InertiaChartProps {
  checkIns: CheckIn[]
  days?: number
}

export function InertiaChart({ checkIns, days = 30 }: InertiaChartProps) {
  const { weeklyData, averageInertia, trend } = useMemo(() => {
    const now = new Date()
    const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
    const relevant = checkIns.filter((c) => new Date(c.timestamp) >= cutoff)

    // Simplified inertia calculation: consecutive negative check-ins duration
    const negativeStreaks: number[] = []
    let currentStreak = 0

    relevant.forEach((c, i) => {
      if (c.valence === "negative" && c.intensityBefore && c.intensityBefore >= 6) {
        currentStreak++
      } else if (currentStreak > 0) {
        negativeStreaks.push(currentStreak)
        currentStreak = 0
      }
    })

    if (currentStreak > 0) negativeStreaks.push(currentStreak)

    // Group by week
    const weekData: Record<number, { recoveryTimes: number[] }> = {}
    relevant.forEach((c) => {
      const weekNum = Math.floor((now.getTime() - new Date(c.timestamp).getTime()) / (7 * 24 * 60 * 60 * 1000))
      if (!weekData[weekNum]) weekData[weekNum] = { recoveryTimes: [] }

      // Simulate recovery time based on intensity
      if (c.valence === "negative" && c.intensityBefore) {
        weekData[weekNum].recoveryTimes.push(c.intensityBefore * 0.5) // hours
      }
    })

    const weeklyData = Object.entries(weekData)
      .map(([week, data]) => ({
        week: `Sem ${4 - Number(week)}`,
        avgTime:
          data.recoveryTimes.length > 0
            ? Math.round((data.recoveryTimes.reduce((a, b) => a + b, 0) / data.recoveryTimes.length) * 10) / 10
            : 0,
        peaks: data.recoveryTimes.length,
      }))
      .reverse()
      .slice(-4)

    const avgInertia =
      negativeStreaks.length > 0 ? negativeStreaks.reduce((a, b) => a + b, 0) / negativeStreaks.length : 0

    // Calculate trend
    const firstHalf = weeklyData.slice(0, 2)
    const secondHalf = weeklyData.slice(2)
    const firstAvg =
      firstHalf.length > 0 ? firstHalf.reduce((sum, w) => sum + w.avgTime, 0) / firstHalf.length : avgInertia
    const secondAvg = secondHalf.length > 0 ? secondHalf.reduce((sum, w) => sum + w.avgTime, 0) / secondHalf.length : 0

    return {
      weeklyData,
      averageInertia: Math.round(avgInertia * 10) / 10,
      trend: secondAvg - firstAvg,
    }
  }, [checkIns, days])

  const getBarColor = (value: number) => {
    if (value <= 1.5) return "var(--chart-2)" // Green
    if (value <= 3) return "var(--chart-5)" // Yellow
    return "var(--destructive)" // Red
  }

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Inercia Emocional
          </CardTitle>
          <div className="flex items-center gap-1 text-sm">
            {trend < 0 ? (
              <TrendingDown className="h-4 w-4 text-green-500" />
            ) : trend > 0 ? (
              <TrendingUp className="h-4 w-4 text-red-500" />
            ) : null}
            <span className={trend < 0 ? "text-green-500" : trend > 0 ? "text-red-500" : "text-muted-foreground"}>
              {trend < 0 ? "Mejorando" : trend > 0 ? "Aumentando" : "Estable"}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4 p-3 bg-secondary/50 rounded-lg">
          <p className="text-sm text-muted-foreground">Tiempo promedio de recuperación</p>
          <p className="text-2xl font-bold text-foreground">
            {averageInertia > 0 ? `${averageInertia}h` : "Sin datos"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Tiempo que tardas en volver a tu línea base tras un pico emocional
          </p>
        </div>

        {weeklyData.length > 0 ? (
          <div className="h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="week" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} tickLine={false} />
                <YAxis
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                  tickLine={false}
                  axisLine={false}
                  unit="h"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                    color: "var(--foreground)",
                  }}
                  formatter={(value: number) => [`${value}h`, "Tiempo medio"]}
                />
                <Bar dataKey="avgTime" radius={[4, 4, 0, 0]}>
                  {weeklyData.map((entry, index) => (
                    <Cell key={index} fill={getBarColor(entry.avgTime)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-8">Necesitas más check-ins para ver tu inercia</p>
        )}
      </CardContent>
    </Card>
  )
}

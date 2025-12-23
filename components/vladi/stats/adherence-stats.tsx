"use client"

import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, Flame, Target } from "lucide-react"
import type { CheckIn } from "@/lib/vladi-types"

interface AdherenceStatsProps {
  checkIns: CheckIn[]
  streak: number
  days?: number
}

export function AdherenceStats({ checkIns, streak, days = 30 }: AdherenceStatsProps) {
  const { adherencePercent, daysWithCheckIn, totalDays, weeklyPattern } = useMemo(() => {
    const now = new Date()
    const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
    const relevant = checkIns.filter((c) => new Date(c.timestamp) >= cutoff)

    // Unique days with check-ins
    const uniqueDays = new Set(relevant.map((c) => new Date(c.timestamp).toDateString()))
    const daysCount = uniqueDays.size
    const adherence = Math.round((daysCount / days) * 100)

    // Weekly pattern (which days have most check-ins)
    const dayOfWeekCounts = [0, 0, 0, 0, 0, 0, 0]
    relevant.forEach((c) => {
      dayOfWeekCounts[new Date(c.timestamp).getDay()]++
    })

    const dayNames = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"]
    const maxCount = Math.max(...dayOfWeekCounts, 1)
    const pattern = dayOfWeekCounts.map((count, i) => ({
      day: dayNames[i],
      count,
      percentage: Math.round((count / maxCount) * 100),
    }))

    return {
      adherencePercent: adherence,
      daysWithCheckIn: daysCount,
      totalDays: days,
      weeklyPattern: pattern,
    }
  }, [checkIns, days])

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          Uso de VLADI
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="p-3 bg-secondary/50 rounded-lg">
            <Flame className="h-6 w-6 text-orange-500 mx-auto mb-1" />
            <p className="text-2xl font-bold text-foreground">{streak}</p>
            <p className="text-xs text-muted-foreground">Racha actual</p>
          </div>
          <div className="p-3 bg-secondary/50 rounded-lg">
            <Target className="h-6 w-6 text-primary mx-auto mb-1" />
            <p className="text-2xl font-bold text-foreground">{adherencePercent}%</p>
            <p className="text-xs text-muted-foreground">Adherencia</p>
          </div>
          <div className="p-3 bg-secondary/50 rounded-lg">
            <Calendar className="h-6 w-6 text-chart-2 mx-auto mb-1" />
            <p className="text-2xl font-bold text-foreground">{daysWithCheckIn}</p>
            <p className="text-xs text-muted-foreground">Días activos</p>
          </div>
        </div>

        {/* Weekly pattern */}
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Patrón semanal</p>
          <div className="flex justify-between gap-1">
            {weeklyPattern.map((day) => (
              <div key={day.day} className="flex-1 text-center">
                <div className="h-16 bg-secondary rounded-md overflow-hidden flex flex-col justify-end">
                  <div
                    className="bg-primary transition-all"
                    style={{ height: `${day.percentage}%`, minHeight: day.count > 0 ? "4px" : "0" }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">{day.day}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-muted-foreground text-center">
          {daysWithCheckIn}/{totalDays} días en los últimos {totalDays} días
        </p>
      </CardContent>
    </Card>
  )
}

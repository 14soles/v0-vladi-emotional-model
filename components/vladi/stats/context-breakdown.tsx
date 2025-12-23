"use client"

import { useMemo } from "react"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Target } from "lucide-react"
import type { CheckIn, ContextCategory } from "@/lib/vladi-types"
import { CONTEXTS } from "@/lib/vladi-types"

interface ContextBreakdownProps {
  checkIns: CheckIn[]
  filterNegative?: boolean
}

const COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--primary)",
  "var(--accent)",
  "var(--destructive)",
]

export function ContextBreakdown({ checkIns, filterNegative = true }: ContextBreakdownProps) {
  const data = useMemo(() => {
    const relevant = filterNegative ? checkIns.filter((c) => c.valence === "negative") : checkIns

    const counts: Record<ContextCategory, number> = {} as Record<ContextCategory, number>
    relevant.forEach((c) => {
      if (c.contextCategory) {
        counts[c.contextCategory] = (counts[c.contextCategory] || 0) + 1
      }
    })

    const total = Object.values(counts).reduce((a, b) => a + b, 0)

    return Object.entries(counts)
      .map(([context, count]) => {
        const contextInfo = CONTEXTS.find((c) => c.id === context)
        return {
          name: contextInfo?.label || context,
          value: count,
          percentage: total > 0 ? Math.round((count / total) * 100) : 0,
          icon: contextInfo?.icon || "📝",
        }
      })
      .sort((a, b) => b.value - a.value)
      .slice(0, 5)
  }, [checkIns, filterNegative])

  if (data.length === 0) {
    return (
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            {filterNegative ? "Triggers más frecuentes" : "Contextos"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            Necesitas más check-ins con contexto para ver tus patrones
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          {filterNegative ? "Triggers más frecuentes" : "Contextos"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          <div className="w-[140px] h-[140px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data} cx="50%" cy="50%" innerRadius={35} outerRadius={60} dataKey="value" strokeWidth={0}>
                  {data.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                    color: "var(--foreground)",
                  }}
                  formatter={(value: number, name: string) => [value, name]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="flex-1 space-y-2">
            {data.map((item, index) => (
              <div key={item.name} className="flex items-center gap-2 text-sm">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                <span className="text-foreground">{item.icon}</span>
                <span className="flex-1 text-muted-foreground">{item.name}</span>
                <span className="font-medium text-foreground">{item.percentage}%</span>
              </div>
            ))}
          </div>
        </div>

        {filterNegative && data.length > 0 && (
          <p className="text-xs text-muted-foreground mt-4 text-center">
            Las emociones negativas se concentran en: {data[0].name} ({data[0].percentage}%)
          </p>
        )}
      </CardContent>
    </Card>
  )
}

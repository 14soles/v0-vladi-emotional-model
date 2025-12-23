"use client"

import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Brain, Star } from "lucide-react"
import type { CheckIn } from "@/lib/vladi-types"
import { EMOTIONS } from "@/lib/vladi-types"

interface GranularityDisplayProps {
  checkIns: CheckIn[]
}

export function GranularityDisplay({ checkIns }: GranularityDisplayProps) {
  const { uniqueEmotions, granularityScore, recentLabels, level } = useMemo(() => {
    const labels = checkIns.map((c) => c.emotionLabelBefore).filter(Boolean)
    const unique = [...new Set(labels)]
    const score = Math.min(Math.round((unique.length / 20) * 100), 100)

    // Get recent unique labels with their icons
    const recent = unique.slice(-8).map((label) => {
      const emotion = EMOTIONS.find((e) => e.label === label)
      return { label, icon: emotion?.icon || "😐" }
    })

    let levelText = "Baja"
    if (score >= 70) levelText = "Alta"
    else if (score >= 40) levelText = "Media"

    return {
      uniqueEmotions: unique.length,
      granularityScore: score,
      recentLabels: recent,
      level: levelText,
    }
  }, [checkIns])

  const getLevelColor = () => {
    if (level === "Alta") return "text-green-500"
    if (level === "Media") return "text-yellow-500"
    return "text-red-500"
  }

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          Granularidad Emocional
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Tu vocabulario emocional</p>
            <p className="text-3xl font-bold text-foreground">{uniqueEmotions}</p>
            <p className="text-sm text-muted-foreground">emociones diferentes</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Nivel</p>
            <p className={`text-2xl font-bold ${getLevelColor()}`}>{level}</p>
            <p className="text-sm text-muted-foreground">{granularityScore}/100</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="space-y-2">
          <div className="h-3 bg-secondary rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                level === "Alta" ? "bg-green-500" : level === "Media" ? "bg-yellow-500" : "bg-red-500"
              }`}
              style={{ width: `${granularityScore}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>0</span>
            <span>20 emociones</span>
          </div>
        </div>

        {/* Recent emotions used */}
        {recentLabels.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Emociones que has usado:</p>
            <div className="flex flex-wrap gap-2">
              {recentLabels.map(({ label, icon }) => (
                <div key={label} className="inline-flex items-center gap-1 px-2 py-1 bg-secondary rounded-full text-sm">
                  <span>{icon}</span>
                  <span className="capitalize text-foreground">{label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="p-3 bg-primary/5 rounded-lg">
          <p className="text-xs text-muted-foreground">
            <Star className="h-3 w-3 inline mr-1" />
            Mayor granularidad = mejor comprensión y regulación emocional
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

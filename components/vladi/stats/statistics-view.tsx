"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { ArrowLeft, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { EmotionalTimeline } from "./emotional-timeline"
import { InertiaChart } from "./inertia-chart"
import { ContextBreakdown } from "./context-breakdown"
import { InterventionEffectiveness } from "./intervention-effectiveness"
import { GranularityDisplay } from "./granularity-display"
import { AdherenceStats } from "./adherence-stats"
import { DEAMRadar } from "../deam-radar"
import { MetricCard } from "../metric-card"
import { useVladiStore } from "@/lib/vladi-store"
import { Brain, Clock, Target, Zap } from "lucide-react"

interface StatisticsViewProps {
  onBack: () => void
}

export function StatisticsView({ onBack }: StatisticsViewProps) {
  const [period, setPeriod] = useState<"7" | "30" | "90">("30")
  const { checkIns, streak, calculateDEAMMetrics, getEmotionalTrend } = useVladiStore()

  const days = Number.parseInt(period)
  const metrics = calculateDEAMMetrics(days)
  const trend = getEmotionalTrend()

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="max-w-lg mx-auto p-4">
          <div className="flex items-center gap-4 mb-4">
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-bold text-foreground">Estadísticas</h1>
          </div>

          {/* Period selector */}
          <Tabs value={period} onValueChange={(v) => setPeriod(v as "7" | "30" | "90")}>
            <TabsList className="w-full grid grid-cols-3">
              <TabsTrigger value="7" className="gap-1">
                <Calendar className="h-4 w-4" />7 días
              </TabsTrigger>
              <TabsTrigger value="30" className="gap-1">
                <Calendar className="h-4 w-4" />
                30 días
              </TabsTrigger>
              <TabsTrigger value="90" className="gap-1">
                <Calendar className="h-4 w-4" />
                90 días
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-lg mx-auto p-4 space-y-6">
        {/* DEAM Score Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <p className="text-sm text-muted-foreground">Tu índice DEAM EQ</p>
          <p className="text-5xl font-bold text-primary">{metrics.deamScore}</p>
          <p className={`text-sm mt-1 ${trend.delta >= 0 ? "text-green-500" : "text-red-500"}`}>
            {trend.delta >= 0 ? "+" : ""}
            {trend.delta} vs periodo anterior
          </p>
        </motion.div>

        {/* Quick metrics */}
        <div className="grid grid-cols-2 gap-3">
          <MetricCard
            title="Inercia Emocional"
            value={metrics.emotionalInertia}
            unit="h"
            icon={<Clock className="h-5 w-5" />}
            color={metrics.emotionalInertia < 2 ? "success" : metrics.emotionalInertia < 4 ? "warning" : "danger"}
          />
          <MetricCard
            title="Adaptabilidad"
            value={metrics.adaptability}
            unit="/100"
            icon={<Zap className="h-5 w-5" />}
            color={metrics.adaptability > 70 ? "success" : metrics.adaptability > 40 ? "warning" : "danger"}
          />
          <MetricCard
            title="Granularidad"
            value={metrics.granularity}
            unit="/100"
            icon={<Brain className="h-5 w-5" />}
            color="primary"
          />
          <MetricCard
            title="Conciencia"
            value={metrics.consciousness}
            unit="/100"
            icon={<Target className="h-5 w-5" />}
            color="primary"
          />
        </div>

        {/* DEAM Radar */}
        <DEAMRadar metrics={metrics} />

        {/* Timeline */}
        <EmotionalTimeline checkIns={checkIns} days={days} />

        {/* Inertia */}
        <InertiaChart checkIns={checkIns} days={days} />

        {/* Context/Triggers */}
        <ContextBreakdown checkIns={checkIns} filterNegative={true} />

        {/* Intervention effectiveness */}
        <InterventionEffectiveness checkIns={checkIns} />

        {/* Granularity */}
        <GranularityDisplay checkIns={checkIns} />

        {/* Adherence */}
        <AdherenceStats checkIns={checkIns} streak={streak} days={days} />
      </main>
    </div>
  )
}

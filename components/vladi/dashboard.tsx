"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Plus, BarChart3, Brain, Zap, Clock, Target } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckInFlow } from "./check-in-flow"
import { SOSButton } from "./sos-button"
import { DEAMRadar } from "./deam-radar"
import { MetricCard } from "./metric-card"
import { StatisticsView } from "./stats/statistics-view"
import { useVladiStore } from "@/lib/vladi-store"
import { EMOTIONS } from "@/lib/vladi-types"

type ViewState = "dashboard" | "checkin" | "stats"

export function VladiDashboard() {
  const [view, setView] = useState<ViewState>("dashboard")
  const { streak, calculateDEAMMetrics, getEmotionalTrend, checkIns } = useVladiStore()

  const metrics = calculateDEAMMetrics(30)
  const trend = getEmotionalTrend()
  const todayCheckIns = checkIns.filter(
    (c) => new Date(c.timestamp).toDateString() === new Date().toDateString(),
  ).length

  if (view === "checkin") {
    return (
      <div className="min-h-screen bg-background p-4 flex items-center justify-center">
        <CheckInFlow onComplete={() => setView("dashboard")} onCancel={() => setView("dashboard")} />
      </div>
    )
  }

  if (view === "stats") {
    return <StatisticsView onBack={() => setView("dashboard")} />
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="bg-primary text-primary-foreground p-6 rounded-b-3xl">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold">VLADI</h1>
              <p className="text-primary-foreground/80 text-sm">Tu asistente emocional</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-primary-foreground/80">Racha</p>
              <p className="text-2xl font-bold">{streak} días</p>
            </div>
          </div>

          {/* DEAM Score */}
          <Card className="bg-white/10 border-0 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-primary-foreground/80">Tu DEAM EQ</p>
                  <p className="text-4xl font-bold">{metrics.deamScore}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-primary-foreground/80">Tendencia emocional</p>
                  <p className={`text-lg font-semibold ${trend.delta >= 0 ? "text-green-300" : "text-red-300"}`}>
                    {trend.delta >= 0 ? "+" : ""}
                    {trend.delta}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-lg mx-auto p-4 space-y-6">
        {/* Check-in CTA */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Button onClick={() => setView("checkin")} className="w-full h-16 text-lg gap-3 rounded-2xl shadow-lg">
            <Plus className="h-6 w-6" />
            Hacer Check-in Emocional
          </Button>
          <p className="text-center text-sm text-muted-foreground mt-2">
            {todayCheckIns === 0
              ? "Aún no has registrado cómo te sientes hoy"
              : `${todayCheckIns} check-in${todayCheckIns > 1 ? "s" : ""} hoy`}
          </p>
        </motion.div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-3">
          <MetricCard
            title="Inercia Emocional"
            value={metrics.emotionalInertia}
            unit="h"
            description="Tiempo de recuperación"
            icon={<Clock className="h-5 w-5" />}
            color={metrics.emotionalInertia < 2 ? "success" : metrics.emotionalInertia < 4 ? "warning" : "danger"}
          />
          <MetricCard
            title="Adaptabilidad"
            value={metrics.adaptability}
            unit="/100"
            description="Eficacia de regulación"
            icon={<Zap className="h-5 w-5" />}
            color={metrics.adaptability > 70 ? "success" : metrics.adaptability > 40 ? "warning" : "danger"}
          />
          <MetricCard
            title="Granularidad"
            value={metrics.granularity}
            unit="/100"
            description="Vocabulario emocional"
            icon={<Brain className="h-5 w-5" />}
            color="primary"
          />
          <MetricCard
            title="Conciencia"
            value={metrics.consciousness}
            unit="/100"
            description="Identificación de triggers"
            icon={<Target className="h-5 w-5" />}
            color="primary"
          />
        </div>

        {/* DEAM Radar */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Tu Perfil DEAM EQ
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DEAMRadar metrics={metrics} />
            <p className="text-sm text-muted-foreground text-center mt-2">Basado en tus últimos 30 días de actividad</p>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Actividad Reciente</CardTitle>
          </CardHeader>
          <CardContent>
            {checkIns.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Aún no tienes check-ins. ¡Empieza a registrar cómo te sientes!
              </p>
            ) : (
              <div className="space-y-3">
                {checkIns
                  .slice(-5)
                  .reverse()
                  .map((checkIn) => {
                    const emotion = EMOTIONS.find((e) => e.label === checkIn.emotionLabelBefore)
                    return (
                      <div
                        key={checkIn.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-secondary/50"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{emotion?.icon || "😐"}</span>
                          <div>
                            <p className="font-medium capitalize text-sm text-foreground">
                              {checkIn.emotionLabelBefore}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(checkIn.timestamp).toLocaleDateString("es-ES", {
                                weekday: "short",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-foreground">{checkIn.intensityBefore}/10</p>
                          <p className="text-xs text-muted-foreground capitalize">{checkIn.contextCategory}</p>
                        </div>
                      </div>
                    )
                  })}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* SOS Button */}
      <SOSButton />

      {/* Bottom Navigation - Added onClick handlers */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border p-2">
        <div className="max-w-lg mx-auto flex justify-around">
          <Button variant="ghost" className="flex-col h-auto py-2 gap-1" onClick={() => setView("dashboard")}>
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
            <span className="text-xs">Inicio</span>
          </Button>
          <Button variant="ghost" className="flex-col h-auto py-2 gap-1" onClick={() => setView("stats")}>
            <BarChart3 className="h-5 w-5" />
            <span className="text-xs">Estadísticas</span>
          </Button>
          <Button variant="ghost" className="flex-col h-auto py-2 gap-1">
            <Brain className="h-5 w-5" />
            <span className="text-xs">Entrenar</span>
          </Button>
          <Button variant="ghost" className="flex-col h-auto py-2 gap-1">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
            <span className="text-xs">Perfil</span>
          </Button>
        </div>
      </nav>
    </div>
  )
}

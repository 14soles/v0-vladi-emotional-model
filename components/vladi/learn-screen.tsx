"use client"

import React from "react"

import { useState, useEffect, useCallback } from "react"
import { Wind, Square, Hand, Pencil, Activity, Brain, RefreshCw, Users, ChevronRight, Sparkles, Clock, TrendingUp, AlertCircle, X } from "lucide-react"
import { CommonHeader } from "./common-header"
import { InterventionRunner } from "./intervention-runner"
import type { LinkedEmotionContext } from "./mirror-overlay"
import { INTERVENTIONS, type InterventionDefinition, type InterventionType } from "@/lib/types/telemetry"
import { supabase } from "@/lib/supabase/client"

interface LearnScreenProps {
  userId?: string
  userProfile?: {
    username?: string
    display_name?: string
    avatar_url?: string
  } | null
  onAvatarClick?: () => void
  onNotificationsClick?: () => void
}

const iconMap: Record<string, React.ElementType> = {
  wind: Wind,
  square: Square,
  hand: Hand,
  pencil: Pencil,
  activity: Activity,
  brain: Brain,
  "refresh-cw": RefreshCw,
  users: Users,
}

const categoryColors: Record<string, { bg: string; text: string; border: string }> = {
  breathing: { bg: "bg-blue-50", text: "text-blue-600", border: "border-blue-200" },
  grounding: { bg: "bg-green-50", text: "text-green-600", border: "border-green-200" },
  cognitive: { bg: "bg-purple-50", text: "text-purple-600", border: "border-purple-200" },
  physical: { bg: "bg-orange-50", text: "text-orange-600", border: "border-orange-200" },
  social: { bg: "bg-pink-50", text: "text-pink-600", border: "border-pink-200" },
}

const categoryLabels: Record<string, string> = {
  breathing: "Respiración",
  grounding: "Conexión",
  cognitive: "Mente",
  physical: "Movimiento",
  social: "Social",
}

interface RecommendedIntervention {
  intervention: InterventionDefinition
  reason: string
  priority: number
}

interface InterventionStats {
  type: InterventionType
  count: number
  avgEffectiveness: number
  avgUtility: number
}

export function LearnScreen({ 
  userId, 
  userProfile, 
  onAvatarClick, 
  onNotificationsClick 
}: LearnScreenProps) {
  const [activeIntervention, setActiveIntervention] = useState<InterventionDefinition | null>(null)
  const [recommended, setRecommended] = useState<RecommendedIntervention[]>([])
  const [stats, setStats] = useState<InterventionStats[]>([])
  const [recentEmotion, setRecentEmotion] = useState<{ family: string; intensity: number; emotion: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [linkedEmotion, setLinkedEmotion] = useState<LinkedEmotionContext | null>(null)
  const [showNoEmotionWarning, setShowNoEmotionWarning] = useState(false)
  const [pendingIntervention, setPendingIntervention] = useState<InterventionDefinition | null>(null)

  // Fetch user's recent emotional state and intervention stats
  useEffect(() => {
    if (!userId) {
      setLoading(false)
      return
    }

    async function fetchData() {
      try {
        // Get most recent emotion entry
        const { data: recentEntry } = await supabase
          .from("emotion_entries")
          .select("emotion, emotion_family, intensity, valence, created_at")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(1)
          .single()

        if (recentEntry) {
          setRecentEmotion({
            family: recentEntry.emotion_family || "calma",
            intensity: recentEntry.intensity || 50,
            emotion: recentEntry.emotion || "Neutro",
          })
          
          // Check if emotion is recent (within last 2 hours)
          const emotionTime = new Date(recentEntry.created_at).getTime()
          const now = Date.now()
          const twoHours = 2 * 60 * 60 * 1000
          
          if (now - emotionTime <= twoHours) {
            setLinkedEmotion({
              emotion: recentEntry.emotion || "Neutro",
              emotionFamily: recentEntry.emotion_family || "calma",
              intensity: recentEntry.intensity || 50,
              wellbeing: recentEntry.valence ? Math.round((recentEntry.valence + 1) * 50) : 50,
              timestamp: recentEntry.created_at,
            })
          }
        }

        // Get intervention stats
        const { data: interventionLogs } = await supabase
          .from("interventions_log")
          .select("*")
          .eq("user_id", userId)
          .eq("skipped", false)
          .not("completed_at", "is", null)

        if (interventionLogs && interventionLogs.length > 0) {
          const statsByType: Record<string, { count: number; totalEffectiveness: number; totalUtility: number }> = {}
          
          for (const log of interventionLogs) {
            if (!statsByType[log.intervention_type]) {
              statsByType[log.intervention_type] = { count: 0, totalEffectiveness: 0, totalUtility: 0 }
            }
            statsByType[log.intervention_type].count++
            if (log.intensity_before !== null && log.intensity_after !== null) {
              statsByType[log.intervention_type].totalEffectiveness += (log.intensity_before - log.intensity_after)
            }
            if (log.perceived_utility !== null) {
              statsByType[log.intervention_type].totalUtility += log.perceived_utility
            }
          }

          const statsArray: InterventionStats[] = Object.entries(statsByType).map(([type, data]) => ({
            type: type as InterventionType,
            count: data.count,
            avgEffectiveness: data.count > 0 ? data.totalEffectiveness / data.count : 0,
            avgUtility: data.count > 0 ? data.totalUtility / data.count : 0,
          }))

          setStats(statsArray)
        }
      } catch (error) {
        // Silent fail - non-critical data
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [userId])

  // Calculate recommended interventions based on emotional state
  useEffect(() => {
    const recommendations: RecommendedIntervention[] = []

    if (recentEmotion) {
      const familyMap: Record<string, string> = {
        "en tensión": "tension",
        "en calma": "calma",
        "con energía": "energia",
        "sin ánimo": "tristeza",
      }
      const normalizedFamily = familyMap[recentEmotion.family.toLowerCase()] || recentEmotion.family.toLowerCase()

      // Get interventions recommended for this emotion family
      const familyInterventions = INTERVENTIONS.filter(i => 
        i.recommended_for.includes(normalizedFamily)
      )

      for (const intervention of familyInterventions) {
        const stat = stats.find(s => s.type === intervention.type)
        let priority = 1

        // Boost priority based on past effectiveness
        if (stat && stat.avgEffectiveness > 2) {
          priority += 2
        }
        if (stat && stat.avgUtility > 3.5) {
          priority += 1
        }

        // Higher intensity = higher priority for calming interventions
        if (recentEmotion.intensity > 70 && intervention.category === "breathing") {
          priority += 2
        }

        let reason = ""
        if (normalizedFamily === "tension") {
          reason = "Recomendado para reducir la tensión"
        } else if (normalizedFamily === "tristeza") {
          reason = "Puede ayudarte a mejorar tu ánimo"
        } else if (normalizedFamily === "energia") {
          reason = "Para canalizar tu energía positivamente"
        } else {
          reason = "Para mantener tu bienestar"
        }

        if (stat && stat.count > 0) {
          reason += ` • Te ha funcionado bien antes`
        }

        recommendations.push({ intervention, reason, priority })
      }

      // Sort by priority
      recommendations.sort((a, b) => b.priority - a.priority)
    }

    setRecommended(recommendations.slice(0, 3))
  }, [recentEmotion, stats])

  const handleStartIntervention = useCallback((intervention: InterventionDefinition) => {
    // If no linked emotion, show warning first
    if (!linkedEmotion) {
      setPendingIntervention(intervention)
      setShowNoEmotionWarning(true)
      return
    }
    setActiveIntervention(intervention)
  }, [linkedEmotion])

  const handleContinueWithoutEmotion = useCallback(() => {
    if (pendingIntervention) {
      setActiveIntervention(pendingIntervention)
      setPendingIntervention(null)
    }
    setShowNoEmotionWarning(false)
  }, [pendingIntervention])

  const handleRegisterEmotionFirst = useCallback(() => {
    // Close warning and navigate to record view
    setShowNoEmotionWarning(false)
    setPendingIntervention(null)
    // This would need to be passed from parent to navigate to record view
    // For now we'll continue without emotion
  }, [])

  const handleCompleteIntervention = useCallback(async (intensityAfter: number, perceivedUtility: number) => {
    if (!activeIntervention || !userId) {
      setActiveIntervention(null)
      return
    }

    try {
      // Save to interventions_log
      // intensity values are now 1-10 scale (self-reported)
      const intensityBefore = linkedEmotion?.intensity || recentEmotion?.intensity || null
      
      await supabase.from("interventions_log").insert({
        user_id: userId,
        intervention: activeIntervention.type, // Column is 'intervention', not 'intervention_type'
        source: "tools_menu", // From learn screen / tools menu
        started_at: new Date(Date.now() - activeIntervention.duration_seconds * 1000).toISOString(),
        ended_at: new Date().toISOString(), // Column is 'ended_at', not 'completed_at'
        duration_planned_sec: activeIntervention.duration_seconds,
        duration_actual_sec: activeIntervention.duration_seconds,
        intensity_before: intensityBefore, // 1-10 scale
        intensity_after: intensityAfter, // 1-10 scale
        helpfulness: perceivedUtility, // 1-5 scale
      })

      // Update local stats (using 1-10 scale)
      const existingStat = stats.find(s => s.type === activeIntervention.type)
      const effectivenessDelta = intensityBefore ? intensityBefore - intensityAfter : 0
      
      if (existingStat) {
        setStats(prev => prev.map(s => 
          s.type === activeIntervention.type 
            ? { 
                ...s, 
                count: s.count + 1,
                avgEffectiveness: ((s.avgEffectiveness * s.count) + effectivenessDelta) / (s.count + 1),
                avgUtility: ((s.avgUtility * s.count) + perceivedUtility) / (s.count + 1),
              }
            : s
        ))
      } else {
        setStats(prev => [...prev, {
          type: activeIntervention.type,
          count: 1,
          avgEffectiveness: effectivenessDelta,
          avgUtility: perceivedUtility,
        }])
      }
    } catch (error) {
      // Silent fail
    }

    setActiveIntervention(null)
  }, [activeIntervention, userId, recentEmotion, stats])

  const handleSkipIntervention = useCallback(async (reason: string) => {
    if (!activeIntervention || !userId) {
      setActiveIntervention(null)
      return
    }

    try {
      // For cancelled/skipped interventions, log with notes
      await supabase.from("interventions_log").insert({
        user_id: userId,
        intervention: activeIntervention.type,
        source: "tools_menu",
        started_at: new Date().toISOString(),
        notes: `Cancelada: ${reason}`,
      })
    } catch (error) {
      // Silent fail
    }

    setActiveIntervention(null)
  }, [activeIntervention, userId])

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    return `${minutes} min`
  }

  const getStatForIntervention = (type: InterventionType) => {
    return stats.find(s => s.type === type)
  }

  const categories = [...new Set(INTERVENTIONS.map(i => i.category))]
  const filteredInterventions = activeCategory 
    ? INTERVENTIONS.filter(i => i.category === activeCategory)
    : INTERVENTIONS

  if (activeIntervention) {
    return (
      <InterventionRunner
        intervention={activeIntervention}
        linkedEmotion={linkedEmotion}
        onComplete={handleCompleteIntervention}
        onSkip={handleSkipIntervention}
        onClose={() => setActiveIntervention(null)}
      />
    )
  }

  // No emotion warning modal
  if (showNoEmotionWarning) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white w-full max-w-sm rounded-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          <div className="p-6 text-center">
            <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-7 h-7 text-amber-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Sin emocion vinculada
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              Registrar como te sientes antes de la actividad nos ayuda a medir si la tecnica te funciona.
            </p>
            
            <div className="space-y-3">
              <button
                onClick={handleContinueWithoutEmotion}
                className="w-full py-3 bg-gray-900 hover:bg-gray-800 text-white font-medium rounded-xl transition-colors"
              >
                Continuar sin vincular
              </button>
              <button
                onClick={() => setShowNoEmotionWarning(false)}
                className="w-full py-3 text-gray-600 hover:text-gray-900 font-medium transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-white">
      <CommonHeader
        title="Aprende"
        userProfile={userProfile}
        onAvatarClick={onAvatarClick}
        onNotificationsClick={onNotificationsClick}
      />

      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="p-4 space-y-6">
          {/* Recommended Section */}
          {recommended.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-5 h-5 text-amber-500" />
                <h2 className="text-lg font-semibold text-gray-900">Recomendado para ti</h2>
              </div>
              
              <div className="space-y-3">
                {recommended.map(({ intervention, reason }) => {
                  const Icon = iconMap[intervention.icon] || Activity
                  const colors = categoryColors[intervention.category]
                  const stat = getStatForIntervention(intervention.type)

                  return (
                    <button
                      key={intervention.type}
                      onClick={() => handleStartIntervention(intervention)}
                      className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 ${colors.border} ${colors.bg} transition-all text-left active:scale-[0.98]`}
                    >
                      <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center bg-white shadow-sm`}>
                        <Icon className={`w-6 h-6 ${colors.text}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-900">{intervention.name}</span>
                          <span className="text-xs text-gray-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDuration(intervention.duration_seconds)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-0.5">{reason}</p>
                        {stat && stat.count > 0 && (
                          <div className="flex items-center gap-2 mt-1">
                            <TrendingUp className="w-3 h-3 text-green-500" />
                            <span className="text-xs text-green-600">
                              {stat.count} {stat.count === 1 ? 'vez' : 'veces'} completada
                            </span>
                          </div>
                        )}
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    </button>
                  )
                })}
              </div>
            </section>
          )}

          {/* Categories Filter */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Todas las técnicas</h2>
            
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
              <button
                onClick={() => setActiveCategory(null)}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  activeCategory === null
                    ? "bg-gray-900 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                Todas
              </button>
              {categories.map(category => {
                const colors = categoryColors[category]
                const isActive = activeCategory === category
                return (
                  <button
                    key={category}
                    onClick={() => setActiveCategory(category)}
                    className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      isActive
                        ? `${colors.bg} ${colors.text} border ${colors.border}`
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {categoryLabels[category]}
                  </button>
                )
              })}
            </div>
          </section>

          {/* All Interventions Grid */}
          <section className="pb-4">
            <div className="grid grid-cols-2 gap-3">
              {filteredInterventions.map(intervention => {
                const Icon = iconMap[intervention.icon] || Activity
                const colors = categoryColors[intervention.category]
                const stat = getStatForIntervention(intervention.type)

                return (
                  <button
                    key={intervention.type}
                    onClick={() => handleStartIntervention(intervention)}
                    className="flex flex-col p-4 rounded-2xl border border-gray-200 bg-white hover:border-gray-300 transition-all text-left active:scale-[0.98]"
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colors.bg} mb-3`}>
                      <Icon className={`w-5 h-5 ${colors.text}`} />
                    </div>
                    <span className="font-medium text-gray-900 text-sm leading-tight">
                      {intervention.name}
                    </span>
                    <span className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDuration(intervention.duration_seconds)}
                    </span>
                    {stat && stat.count > 0 && (
                      <div className="flex items-center gap-1 mt-2">
                        <div className="h-1 flex-1 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-green-400 rounded-full"
                            style={{ width: `${Math.min((stat.avgUtility / 5) * 100, 100)}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-gray-400">{stat.count}x</span>
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

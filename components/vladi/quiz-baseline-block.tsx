"use client"

import { useState, useEffect } from "react"
import { Award, Brain, Heart, Lightbulb, ChevronDown, ChevronUp, Lock } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface QuizBaselineBlockProps {
  userId?: string
  onStartQuiz?: () => void
}

interface BaselineData {
  global_score_100: number
  recognition_score_100: number
  understanding_score_100: number
  management_score_100: number
  completed_at: string
  total_time_ms: number
}

function ProgressBar({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center">
        <span className="text-sm text-gray-600">{label}</span>
        <span className="text-sm font-medium text-gray-900">{value}/100</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div 
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{ width: `${value}%`, backgroundColor: color }}
        />
      </div>
    </div>
  )
}

export function QuizBaselineBlock({ userId, onStartQuiz }: QuizBaselineBlockProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [loading, setLoading] = useState(true)
  const [baselineData, setBaselineData] = useState<BaselineData | null>(null)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  useEffect(() => {
    if (!userId) {
      setLoading(false)
      return
    }

    const loadBaseline = async () => {
      try {
        // Get baseline data from profile_assessment_baseline joined with assessment_results
        const { data: baseline, error: baselineError } = await supabase
          .from("profile_assessment_baseline")
          .select(`
            baseline_result_id,
            assessment_results!inner (
              global_score_100,
              recognition_score_100,
              understanding_score_100,
              management_score_100,
              created_at
            ),
            assessment_sessions!inner (
              total_time_ms,
              completed_at
            )
          `)
          .eq("profile_id", userId)
          .single()

        if (baselineError) {
          if (baselineError.code === "PGRST116") {
            // No baseline found - quiz not completed
            setBaselineData(null)
          } else {
            throw baselineError
          }
        } else if (baseline) {
          const results = baseline.assessment_results as any
          const session = baseline.assessment_sessions as any
          setBaselineData({
            global_score_100: results.global_score_100,
            recognition_score_100: results.recognition_score_100,
            understanding_score_100: results.understanding_score_100,
            management_score_100: results.management_score_100,
            completed_at: session.completed_at || results.created_at,
            total_time_ms: session.total_time_ms || 0
          })
        }
      } catch (err) {
        console.error("Error loading baseline:", err)
        setError("Error al cargar los datos")
      } finally {
        setLoading(false)
      }
    }

    loadBaseline()
  }, [userId])

  // Loading state
  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-5 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <Award className="w-5 h-5 text-amber-500" />
          <span className="font-semibold text-gray-900">Tu punto de partida emocional</span>
        </div>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin w-6 h-6 border-2 border-gray-200 border-t-gray-600 rounded-full" />
        </div>
      </div>
    )
  }

  // Not completed state
  if (!baselineData) {
    return (
      <div className="bg-white rounded-2xl p-5 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="relative">
            <Award className="w-5 h-5 text-gray-300" />
            <Lock className="w-3 h-3 text-gray-400 absolute -bottom-1 -right-1" />
          </div>
          <span className="font-semibold text-gray-400">Tu punto de partida emocional</span>
        </div>
        
        <div className="text-center py-6">
          <div className="mb-4">
            <img
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/1-9dY9dM01JmyMGtHobbNfbL2wHOkutm.png"
              alt="Explorador Emocional"
              className="w-16 h-16 object-contain mx-auto opacity-50"
            />
          </div>
          <p className="text-sm text-gray-500 mb-4">
            Completa tu evaluación inicial para ver tu punto de partida emocional
          </p>
          {onStartQuiz && (
            <button
              onClick={onStartQuiz}
              className="px-6 py-2.5 bg-gray-900 text-white rounded-full text-sm font-medium hover:bg-gray-800 transition-colors"
            >
              Comenzar evaluación
            </button>
          )}
        </div>
      </div>
    )
  }

  // Format duration
  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  // Format date
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('es-ES', { 
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm">
      {/* Header */}
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between mb-4"
      >
        <div className="flex items-center gap-3">
          <Award className="w-5 h-5 text-amber-500" />
          <span className="font-semibold text-gray-900">Tu punto de partida emocional</span>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-gray-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-400" />
        )}
      </button>

      {isExpanded && (
        <>
          {/* Badge and date */}
          <div className="flex items-center gap-3 mb-5 pb-4 border-b border-gray-100">
            <img
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/1-9dY9dM01JmyMGtHobbNfbL2wHOkutm.png"
              alt="Explorador Emocional - Nivel 1"
              className="w-12 h-12 object-contain"
            />
            <div>
              <p className="text-sm font-medium text-gray-900">Nivel 1: Explorador emocional</p>
              <p className="text-xs text-gray-500">
                {formatDate(baselineData.completed_at)} · {formatDuration(baselineData.total_time_ms)}
              </p>
            </div>
          </div>

          {/* Global score */}
          <div className="text-center mb-6">
            <div className="inline-flex items-baseline gap-1">
              <span className="text-5xl font-bold text-gray-900">{baselineData.global_score_100}</span>
              <span className="text-xl text-gray-400">/100</span>
            </div>
            <p className="text-sm text-gray-500 mt-1">Resultado global</p>
          </div>

          {/* Domain scores */}
          <div className="space-y-4">
            <ProgressBar 
              label="Reconocimiento emocional" 
              value={baselineData.recognition_score_100} 
              color="#94B22E" 
            />
            <ProgressBar 
              label="Comprensión emocional" 
              value={baselineData.understanding_score_100} 
              color="#E6B04F" 
            />
            <ProgressBar 
              label="Regulación emocional" 
              value={baselineData.management_score_100} 
              color="#466D91" 
            />
          </div>

          {/* Description */}
          <p className="text-xs text-gray-400 mt-5 text-center leading-relaxed">
            Este es tu punto de partida. Conforme uses la app, podrás ver cómo evolucionas.
          </p>
        </>
      )}
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import { X, Brain, Play, MessageCircle } from "lucide-react"
import type { EmotionData } from "./emotion-screen"

interface MirrorOverlayProps {
  emotionData: EmotionData
  contextText: string
  contextTags: string[]
  bodySignals?: string[]
  timeReference?: string
  certainty?: string
  onClose: () => void
  onStartChat?: () => void
}

interface ActivitySuggestion {
  title: string
  type: string
  time: string
}

interface MirrorResult {
  text: string
  suggestion?: ActivitySuggestion
}

export function MirrorOverlay({
  emotionData,
  contextText,
  contextTags,
  bodySignals,
  timeReference,
  certainty,
  onClose,
  onStartChat,
}: MirrorOverlayProps) {
  const [loading, setLoading] = useState(true)
  const [result, setResult] = useState<MirrorResult | null>(null)

  useEffect(() => {
    const generateMirror = async () => {
      try {
        const emotionFamilyMap: Record<string, string> = {
          green: "en calma",
          yellow: "con energía",
          red: "en tensión",
          blue: "sin ánimo",
        }

        const activityTags = contextTags.filter(
          (t) => !t.startsWith("Compañía:") && !t.startsWith("Actividad:") && !t.startsWith("Con:"),
        )
        const companyTags = contextTags.filter((t) => t.startsWith("Con:")).map((t) => t.replace("Con:", "").trim())

        const [mirrorResponse, suggestionResponse] = await Promise.all([
          fetch("/api/ai/emotional-mirror", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              emotion: emotionData.emotion,
              intensity: emotionData.energy,
              wellbeing: emotionData.pleasantness,
              context: {
                notes: contextText,
                activityTags,
                companyTags,
                bodyLocation: bodySignals?.join(", "),
                whenOccurred: timeReference,
                certaintyBucket: certainty,
              },
            }),
          }),
          fetch("/api/ai/activity-suggestion", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              emotion: emotionData.emotion,
              intensity: emotionData.energy,
              wellbeing: emotionData.pleasantness,
              emotionFamily: emotionFamilyMap[emotionData.quadrant] || "desconocido",
            }),
          }),
        ])

        const mirrorData = await mirrorResponse.json()
        const suggestionData = await suggestionResponse.json()

        setResult({
          text: mirrorData.text,
          suggestion: {
            title: suggestionData.text,
            type: "DEAM EQ",
            time: "5-10 min",
          },
        })
      } catch (error) {
        console.error("[v0] Error generating mirror:", error)
        setResult({
          text: "Gracias por compartir tus emociones. Tu registro me ayuda a comprenderte mejor.",
          suggestion: {
            title: "Tómate un momento para reflexionar",
            type: "DEAM EQ",
            time: "5 min",
          },
        })
      } finally {
        setLoading(false)
      }
    }

    generateMirror()
  }, [emotionData, contextText, contextTags, bodySignals, timeReference, certainty])

  return (
    <div
      className="fixed inset-0 z-[200] bg-white flex flex-col items-center justify-center px-6 py-8 text-center animate-in fade-in duration-400"
      style={{ minHeight: "100dvh" }}
    >
      <button
        onClick={onClose}
        className="absolute top-4 left-4 text-3xl text-gray-800 p-2.5 leading-none font-light z-[210] touch-manipulation"
        style={{ top: "max(16px, env(safe-area-inset-top))" }}
      >
        <X className="w-8 h-8" strokeWidth={1} />
      </button>

      {loading ? (
        <div className="flex flex-col items-center justify-center">
          <Brain className="w-16 h-16 text-gray-900 pulse-icon mb-4" />
          <p className="text-gray-500 font-light">Analizando tu contexto...</p>
          <div className="flex gap-1 mt-2">
            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
          </div>
        </div>
      ) : (
        <div className="max-w-[400px] w-full flex flex-col items-center animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-black text-white rounded-full flex items-center justify-center mb-4 sm:mb-6">
            <Brain className="w-10 h-10 sm:w-12 sm:h-12" />
          </div>

          <h2 className="text-xl sm:text-2xl font-medium text-gray-900 mb-4 sm:mb-6 leading-snug">
            ¡Gracias por compartir tus emociones!
          </h2>

          <p className="text-sm sm:text-base text-gray-600 leading-relaxed mb-6 sm:mb-8 px-2">{result?.text}</p>

          {result?.suggestion && (
            <button className="bg-gray-100 border border-gray-200 rounded-full py-3 px-5 w-full max-w-xs flex items-center justify-between mb-4 hover:bg-gray-200 transition-colors active:scale-[0.98] touch-manipulation">
              <div className="flex flex-col items-start text-left">
                <span className="text-[9px] sm:text-[10px] uppercase text-gray-500 font-semibold tracking-wider mb-0.5">
                  Sugerencia - {result.suggestion.type}
                </span>
                <div className="flex items-center gap-2 font-bold text-gray-900 text-sm sm:text-base">
                  <Play className="w-4 h-4" />
                  <span>{result.suggestion.title}</span>
                </div>
              </div>
              <span className="text-xs sm:text-sm text-gray-500">{result.suggestion.time}</span>
            </button>
          )}

          {onStartChat && (
            <button
              onClick={onStartChat}
              className="bg-black text-white rounded-full py-3 px-6 w-full max-w-xs flex items-center justify-center gap-2 mb-6 sm:mb-8 hover:bg-gray-800 transition-colors active:scale-[0.98] touch-manipulation font-medium"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Iniciar Chat con Vladi</span>
            </button>
          )}

          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 font-medium transition-colors touch-manipulation py-2"
          >
            Cerrar
          </button>
        </div>
      )}
    </div>
  )
}

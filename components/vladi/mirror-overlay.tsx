"use client"

import { useState, useEffect } from "react"
import { X, Brain, Lightbulb } from "lucide-react"
import type { EmotionData } from "./emotion-screen"

interface MirrorOverlayProps {
  emotionData: EmotionData
  contextText: string
  contextTags: string[]
  bodySignals?: string[]
  timeReference?: string
  certainty?: string
  onClose: () => void
}

interface MirrorResult {
  text: string
  tip: string
}

export function MirrorOverlay({
  emotionData,
  contextText,
  contextTags,
  bodySignals,
  timeReference,
  certainty,
  onClose,
}: MirrorOverlayProps) {
  const [loading, setLoading] = useState(true)
  const [result, setResult] = useState<MirrorResult | null>(null)

  useEffect(() => {
    const generateMirror = async () => {
      try {
        const activityTags = contextTags.filter(
          (t) => !t.startsWith("Compañía:") && !t.startsWith("Actividad:") && !t.startsWith("Con:"),
        )
        const companyTags = contextTags.filter((t) => t.startsWith("Con:")).map((t) => t.replace("Con:", "").trim())

        const mirrorResponse = await fetch("/api/ai/emotional-mirror", {
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
        })

        const mirrorData = await mirrorResponse.json()

        setResult({
          text: mirrorData.text,
          tip: mirrorData.tip || "Reconocer y nombrar tus emociones es el primer paso hacia una mayor inteligencia emocional.",
        })
      } catch {
        setResult({
          text: "Gracias por compartir tus emociones. Tu registro me ayuda a comprenderte mejor.",
          tip: "Tómate un momento para respirar profundamente y conectar con tu cuerpo.",
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
          {/* Brain icon */}
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-foreground text-background rounded-full flex items-center justify-center mb-4 sm:mb-6">
            <Brain className="w-10 h-10 sm:w-12 sm:h-12" />
          </div>

          <h2 className="text-xl sm:text-2xl font-medium text-foreground mb-4 sm:mb-6 leading-snug">
            ¡Gracias por compartir tus emociones!
          </h2>

          {/* Validation text */}
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed px-2 mb-6">
            {result?.text}
          </p>

          {/* Tip section */}
          {result?.tip && (
            <div className="w-full bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3 items-start">
              <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Lightbulb className="w-4 h-4 text-amber-600" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-1">
                  Tip de inteligencia emocional
                </p>
                <p className="text-sm text-amber-900 leading-relaxed">
                  {result.tip}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import { X, Brain } from "lucide-react"
import type { EmotionData } from "./emotion-screen"

interface MirrorOverlayProps {
  emotionData: EmotionData
  contextText: string
  contextTags: string[]
  bodySignals?: string[]
  timeReference?: string
  certainty?: string
  company?: string
  photoUrl?: string
  onClose: () => void
}

interface MirrorResult {
  text: string
  generatedImageUrl?: string
}

export function MirrorOverlay({
  emotionData,
  contextText,
  contextTags,
  bodySignals,
  timeReference,
  certainty,
  company,
  photoUrl,
  onClose,
}: MirrorOverlayProps) {
  const [loading, setLoading] = useState(true)
  const [imageLoading, setImageLoading] = useState(true)
  const [result, setResult] = useState<MirrorResult | null>(null)

  useEffect(() => {
    const generateMirror = async () => {
      try {
        const activityTags = contextTags.filter(
          (t) => !t.startsWith("Compañía:") && !t.startsWith("Actividad:") && !t.startsWith("Con:"),
        )
        const companyTags = contextTags.filter((t) => t.startsWith("Con:")).map((t) => t.replace("Con:", "").trim())

        // Generate mirror text and image in parallel
        const [mirrorResponse, imageResponse] = await Promise.all([
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
          fetch("/api/ai/generate-emotion-image", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              emotion: emotionData.emotion,
              quadrant: emotionData.quadrant,
              company: company || companyTags.join(", "),
              bodySignals,
              timeReference,
              contextText,
              photoUrl,
            }),
          }),
        ])

        const mirrorData = await mirrorResponse.json()
        const imageData = await imageResponse.json()

        setResult({
          text: mirrorData.text,
          generatedImageUrl: imageData.success ? imageData.imageUrl : undefined,
        })
      } catch {
        setResult({
          text: "Gracias por compartir tus emociones. Tu registro me ayuda a comprenderte mejor.",
        })
      } finally {
        setLoading(false)
        setImageLoading(false)
      }
    }

    generateMirror()
  }, [emotionData, contextText, contextTags, bodySignals, timeReference, certainty, company, photoUrl])

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
          {/* Generated emotion image or brain icon fallback */}
          {result?.generatedImageUrl ? (
            <div className="w-48 h-48 sm:w-56 sm:h-56 rounded-3xl overflow-hidden mb-6 shadow-lg">
              <img 
                src={result.generatedImageUrl} 
                alt="Tu momento emocional" 
                className="w-full h-full object-cover"
              />
            </div>
          ) : imageLoading ? (
            <div className="w-48 h-48 sm:w-56 sm:h-56 rounded-3xl bg-gray-100 mb-6 flex items-center justify-center">
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin mb-2" />
                <p className="text-xs text-gray-400">Generando imagen...</p>
              </div>
            </div>
          ) : (
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-black text-white rounded-full flex items-center justify-center mb-4 sm:mb-6">
              <Brain className="w-10 h-10 sm:w-12 sm:h-12" />
            </div>
          )}

          <h2 className="text-xl sm:text-2xl font-medium text-gray-900 mb-4 sm:mb-6 leading-snug">
            ¡Gracias por compartir tus emociones!
          </h2>

          <p className="text-sm sm:text-base text-gray-600 leading-relaxed px-2">{result?.text}</p>
        </div>
      )}
    </div>
  )
}

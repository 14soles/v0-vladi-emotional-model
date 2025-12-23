"use client"

import { useState, useEffect } from "react"
import { X, Brain, Play } from "lucide-react"
import type { EmotionData } from "./emotion-screen"

interface MirrorOverlayProps {
  emotionData: EmotionData
  contextText: string
  contextTags: string[]
  onClose: () => void
}

interface MirrorResult {
  text: string
  suggestion?: {
    title: string
    type: string
    time: string
  }
}

export function MirrorOverlay({ emotionData, contextText, contextTags, onClose }: MirrorOverlayProps) {
  const [loading, setLoading] = useState(true)
  const [result, setResult] = useState<MirrorResult | null>(null)

  useEffect(() => {
    const generateMirror = async () => {
      await new Promise((resolve) => setTimeout(resolve, 2000))

      let text = ""
      let suggestion = { title: "Pausa consciente", type: "Relax", time: "2 min" }

      if (emotionData.valence === 1) {
        text = `Es genial que te sientas ${emotionData.emotion.toLowerCase()}. Aprovecha esta energía positiva para hacer algo que te importa.`
        suggestion = { title: "Gratitud", type: "Reflexión", time: "3 min" }
      } else if (emotionData.valence === -1) {
        if (emotionData.quadrant === "red") {
          text = `Entiendo que te sientes ${emotionData.emotion.toLowerCase()}. Tu cuerpo está en alerta. Una pausa de respiración puede ayudarte a recuperar el control.`
          suggestion = { title: "Respiración 4-7-8", type: "Calma", time: "4 min" }
        } else {
          text = `Gracias por compartir que te sientes ${emotionData.emotion.toLowerCase()}. Estos momentos también pasan. ¿Qué pequeña cosa podrías hacer por ti ahora?`
          suggestion = { title: "Grounding 5-4-3-2-1", type: "Presente", time: "5 min" }
        }
      }

      setResult({ text, suggestion })
      setLoading(false)
    }

    generateMirror()
  }, [emotionData])

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

          <p className="text-sm sm:text-base text-gray-600 leading-relaxed mb-6 sm:mb-10 px-2">{result?.text}</p>

          {result?.suggestion && (
            <button className="bg-gray-100 border border-gray-200 rounded-full py-3 px-5 w-full max-w-xs flex items-center justify-between mb-6 sm:mb-8 hover:bg-gray-200 transition-colors active:scale-[0.98] touch-manipulation">
              <div className="flex flex-col items-start text-left">
                <span className="text-[9px] sm:text-[10px] uppercase text-gray-500 font-semibold tracking-wider mb-0.5">
                  Sugerencia - DEAM EQ
                </span>
                <div className="flex items-center gap-2 font-bold text-gray-900 text-sm sm:text-base">
                  <Play className="w-4 h-4" />
                  <span>{result.suggestion.title}</span>
                </div>
              </div>
              <span className="text-xs sm:text-sm text-gray-500">{result.suggestion.time}</span>
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

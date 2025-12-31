"use client"

import { useEffect, useState } from "react"
import { Info, ChevronDown } from "lucide-react"
import { supabase } from "@/lib/supabase/client"

interface ConversationSummary {
  id: string
  session_id: string
  created_at: string
  topic: string | null
  key_insights: string[]
}

interface EmotionEntry {
  id: string
  created_at: string
  emotion: string
  context: string | null
  notes: string | null
  intensity: number
  wellbeing: number
}

interface ConversationHistoryBlockProps {
  userId?: string
  onConversationClick?: (sessionId: string) => void
}

type ViewMode = "conversations" | "emotions"

export function ConversationHistoryBlock({ userId, onConversationClick }: ConversationHistoryBlockProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("conversations")
  const [showDropdown, setShowDropdown] = useState(false)
  const [conversations, setConversations] = useState<ConversationSummary[]>([])
  const [emotions, setEmotions] = useState<EmotionEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) {
      setLoading(false)
      return
    }

    const loadData = async () => {
      setLoading(true)
      try {
        const [conversationsResult, emotionsResult] = await Promise.all([
          supabase
            .from("vladi_session_summaries")
            .select("id, session_id, created_at, topic, key_insights")
            .eq("user_id", userId)
            .order("created_at", { ascending: false })
            .limit(20),
          supabase
            .from("emotion_entries")
            .select("id, created_at, emotion, context, notes, intensity, wellbeing")
            .eq("user_id", userId)
            .order("created_at", { ascending: false })
            .limit(20),
        ])

        if (conversationsResult.error) throw conversationsResult.error
        if (emotionsResult.error) throw emotionsResult.error

        setConversations(conversationsResult.data || [])
        setEmotions(emotionsResult.data || [])
      } catch (error) {
        console.error("[v0] Error loading history:", error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [userId])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const day = date.getDate()
    const month = date.toLocaleDateString("es-ES", { month: "short" })
    const time = date.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", hour12: false })
    return `${day} ${month}. ${time}h`
  }

  const getPreviewText = (conv: ConversationSummary): string => {
    if (conv.key_insights && conv.key_insights.length > 0) {
      return conv.key_insights[0]
    }
    return conv.topic || "Conversación sin resumen"
  }

  const cardShadowStyle = {
    boxShadow: "0px 4px 22.3px 0px rgba(0, 0, 0, 0.11)",
  }

  if (loading) {
    return (
      <div className="bg-white rounded-3xl p-6" style={cardShadowStyle}>
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3" />
          <div className="h-10 bg-gray-100 rounded" />
          <div className="space-y-3">
            <div className="h-16 bg-gray-50 rounded-xl" />
            <div className="h-16 bg-gray-50 rounded-xl" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-3xl p-6" style={cardShadowStyle}>
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-sm font-normal text-gray-900">Historial</h2>
        <button className="text-gray-400 hover:text-gray-600 transition-colors">
          <Info className="w-4 h-4" />
        </button>
      </div>

      <div className="relative mb-4">
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="w-full bg-gray-50 rounded-full px-4 py-3 flex items-center justify-between hover:bg-gray-100 transition-colors"
        >
          <span className="text-sm text-gray-700">
            {viewMode === "conversations" ? "Conversaciones Vladi" : "Registro de emociones"}
          </span>
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showDropdown ? "rotate-180" : ""}`} />
        </button>

        {showDropdown && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-lg border border-gray-100 py-2 z-10">
            <button
              onClick={() => {
                setViewMode("conversations")
                setShowDropdown(false)
              }}
              className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 transition-colors ${
                viewMode === "conversations" ? "text-gray-900 font-medium" : "text-gray-600"
              }`}
            >
              Conversaciones Vladi
            </button>
            <button
              onClick={() => {
                setViewMode("emotions")
                setShowDropdown(false)
              }}
              className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 transition-colors ${
                viewMode === "emotions" ? "text-gray-900 font-medium" : "text-gray-600"
              }`}
            >
              Registro de emociones
            </button>
          </div>
        )}
      </div>

      <div className="max-h-[400px] overflow-y-auto space-y-2 pr-2">
        {viewMode === "conversations" ? (
          // Conversations view
          conversations.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">
              Aún no has tenido conversaciones con Vladi. Inicia un chat para comenzar.
            </p>
          ) : (
            conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => onConversationClick?.(conv.session_id)}
                className="w-full bg-gray-50 hover:bg-gray-100 rounded-xl p-4 transition-colors text-left"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-400 italic line-clamp-2 mb-1">{getPreviewText(conv)}</p>
                  </div>
                  <span className="text-[10px] text-gray-400 whitespace-nowrap">{formatDate(conv.created_at)}</span>
                </div>
              </button>
            ))
          )
        ) : // Emotions view
        emotions.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">
            Aún no has registrado emociones. Comienza a registrar tus emociones para verlas aquí.
          </p>
        ) : (
          emotions.map((emotion) => (
            <div key={emotion.id} className="w-full bg-gray-50 rounded-xl p-4 text-left">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 mb-1">{emotion.emotion}</p>
                  {emotion.context && <p className="text-xs text-gray-500 mb-1">Contexto: {emotion.context}</p>}
                  {emotion.notes && <p className="text-xs text-gray-400 italic line-clamp-2">"{emotion.notes}"</p>}
                </div>
                <span className="text-[10px] text-gray-400 whitespace-nowrap">{formatDate(emotion.created_at)}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

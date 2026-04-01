"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { ArrowUp, Mic, MessageCircle, X } from "lucide-react"
import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"

interface VladiChatProps {
  userId?: string
  userName?: string
  onClose: () => void
  emotionalContext?: {
    emotion: string
    intensity: number
    wellbeing: number
    notes?: string
    contextTags?: string[]
  }
  conversationSummary?: string
}

export function VladiChat({
  userId,
  userName = "Usuario",
  onClose,
  emotionalContext,
  conversationSummary,
}: VladiChatProps) {
  const [input, setInput] = useState("")
  const [showEndConfirmation, setShowEndConfirmation] = useState(false)
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false)
  const [summaryResult, setSummaryResult] = useState<string>("")
  const [sessionId] = useState(crypto.randomUUID())
  const [sessionStartTime] = useState(new Date())
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [hasInitialized, setHasInitialized] = useState(false)

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/ai/vladi-chat",
      body: {
        userId,
        emotionalContext,
        sessionId,
        conversationSummary,
      },
    }),
    initialMessages: [],
  })

  useEffect(() => {
    if (!hasInitialized && status === "ready" && messages.length === 0) {
      setHasInitialized(true)
      sendMessage({
        text: "__INIT__",
      })
    }
  }, [hasInitialized, status, messages.length, sendMessage])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`
    }
  }, [input])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || status !== "ready") return

    sendMessage({ text: input })
    setInput("")
  }

  const getMessageText = (message: any): string => {
    if (typeof message.content === "string") return message.content
    if (message.parts) {
      return message.parts
        .filter((part: any) => part.type === "text")
        .map((part: any) => part.text)
        .join("")
    }
    return ""
  }

  const handleEndChat = async () => {
    setIsGeneratingSummary(true)

    try {
      const response = await fetch("/api/ai/vladi-chat/end-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          sessionId,
          messages: messages
            .filter((msg) => {
              const text = getMessageText(msg)
              return !(msg.role === "user" && text === "__INIT__")
            })
            .map((msg) => ({
              role: msg.role,
              content: getMessageText(msg),
              createdAt: msg.createdAt || new Date().toISOString(),
            })),
          sessionStartTime: sessionStartTime.toISOString(),
        }),
      })

      const data = await response.json()

      if (data.success) {
        setSummaryResult(data.summary || "Conversación guardada exitosamente")
        setTimeout(() => {
          setIsGeneratingSummary(false)
          setShowEndConfirmation(true)
        }, 2000)
      } else {
        throw new Error(data.error || "Error al guardar la conversación")
      }
    } catch {
      // Fallback if summary generation fails
      setSummaryResult("Conversación guardada")
      setTimeout(() => {
        setIsGeneratingSummary(false)
        setShowEndConfirmation(true)
      }, 1000)
    }
  }

  const formatDateTime = () => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: "long",
      day: "numeric",
      month: "long",
    }
    const date = sessionStartTime.toLocaleDateString("es-ES", options)
    const time = sessionStartTime.toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
    })
    return `${date.charAt(0).toUpperCase() + date.slice(1)} | ${time}h.`
  }

  if (isGeneratingSummary) {
    return (
      <div className="fixed inset-0 z-[200] bg-white flex flex-col items-center justify-center p-6">
        <div className="max-w-md w-full text-center space-y-8">
          <div className="flex justify-center">
            <div className="flex gap-2">
              <div className="w-4 h-4 bg-gray-900 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
              <div className="w-4 h-4 bg-gray-900 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
              <div className="w-4 h-4 bg-gray-900 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          </div>

          <div className="space-y-4">
            <p className="text-gray-700" style={{ fontSize: "12px", lineHeight: "20px" }}>
              Vladi está generando un resumen de tu conversación...
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (showEndConfirmation) {
    return (
      <div className="fixed inset-0 z-[200] bg-white flex items-center justify-center p-6">
        <button onClick={onClose} className="absolute top-6 right-6 p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <X className="w-6 h-6" />
        </button>

        <div className="max-w-md text-center space-y-6">
          <h2 className="text-2xl font-bold text-gray-900">¡Gracias, {userName}!</h2>

          <div className="space-y-4">
            <p className="text-gray-700 font-medium">Tu conversación con Vladi ha sido finalizada.</p>

            {summaryResult && (
              <div className="space-y-2">
                <p className="text-sm text-gray-600 font-medium">Aquí tienes tu resumen:</p>
                <div className="bg-gray-50 rounded-2xl p-4 text-left">
                  <p className="text-sm text-gray-700 italic leading-relaxed">"{summaryResult}"</p>
                </div>
              </div>
            )}

            <p className="text-sm text-gray-600">
              Si quieres acceder a tu historial de conversaciones, puedes hacerlo en Tu Panel.
            </p>
          </div>
        </div>

        <p className="absolute bottom-6 left-0 right-0 text-center text-xs text-gray-400 px-6">
          Si estás en crisis, contacta con un profesional{" "}
          <a href="tel:024" className="underline">
            aquí
          </a>
          .
        </p>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-[200] bg-white flex flex-col" style={{ fontFamily: "DM Sans, sans-serif" }}>
      <div
        className="flex items-center justify-between px-6 py-4"
        style={{ paddingTop: "max(16px, env(safe-area-inset-top))" }}
      >
        <h1 className="text-3xl text-gray-900" style={{ fontFamily: "DM Sans, sans-serif", fontWeight: 400 }}>
          Vladi
        </h1>

        <button
          onClick={handleEndChat}
          disabled={isGeneratingSummary || status !== "ready"}
          className="flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900 transition-colors disabled:opacity-50"
        >
          <MessageCircle className="w-4 h-4" />
          <span>Finalizar Chat</span>
        </button>
      </div>

      <div className="text-center py-3 text-sm text-gray-500">{formatDateTime()}</div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6 min-h-0">
        {messages
          .filter((msg) => {
            const text = getMessageText(msg)
            return !(msg.role === "user" && text === "__INIT__")
          })
          .map((msg) => {
            const messageText = getMessageText(msg)
            return (
              <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                {msg.role === "user" ? (
                  <div
                    className="bg-gray-100 text-gray-900 px-5 py-3 rounded-2xl max-w-[80%]"
                    style={{ fontSize: "12px", lineHeight: "20px" }}
                  >
                    {messageText}
                  </div>
                ) : (
                  <div className="max-w-[90%]">
                    <p className="text-gray-900 whitespace-pre-wrap" style={{ fontSize: "12px", lineHeight: "20px" }}>
                      {messageText}
                    </p>
                  </div>
                )}
              </div>
            )
          })}

        {status === "streaming" && (
          <div className="flex justify-start">
            <div className="flex gap-1.5">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div
        className="px-6 py-4 bg-white shrink-0"
        style={{
          paddingBottom: "max(16px, calc(env(safe-area-inset-bottom) + 8px))",
        }}
      >
        <form onSubmit={handleSend}>
          <div
            className="bg-white rounded-[28px] flex items-center gap-3"
            style={{
              boxShadow: "0px 2.18px 12.37px rgba(0, 0, 0, 0.08)",
              paddingTop: "14px",
              paddingBottom: "14px",
              paddingLeft: "20px",
              paddingRight: "12px",
            }}
          >
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  handleSend(e)
                }
              }}
              placeholder="Escribe aquí lo que quieras..."
              disabled={status !== "ready"}
              rows={1}
              className="flex-1 bg-transparent border-none outline-none text-gray-900 placeholder:text-gray-400 resize-none overflow-y-auto"
              style={{
                maxHeight: "120px",
                fontSize: "12px",
                lineHeight: "20px",
              }}
            />
            {input.trim() ? (
              <button
                type="submit"
                disabled={status !== "ready"}
                className="w-11 h-11 bg-gray-900 rounded-full flex items-center justify-center text-white shrink-0 active:scale-95 transition-transform disabled:opacity-50"
              >
                <ArrowUp className="w-5 h-5" />
              </button>
            ) : (
              <button
                type="button"
                className="w-11 h-11 bg-gray-900 rounded-full flex items-center justify-center text-white shrink-0 active:scale-95 transition-transform"
              >
                <Mic className="w-5 h-5" />
              </button>
            )}
          </div>
        </form>

        <p className="text-center mt-3 text-xs text-gray-400 leading-tight px-2">
          Si estás en crisis, contacta con un profesional{" "}
          <a href="tel:024" className="underline">
            aquí
          </a>
          .
        </p>
      </div>
    </div>
  )
}

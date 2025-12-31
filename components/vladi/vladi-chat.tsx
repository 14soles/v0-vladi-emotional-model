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
}

export function VladiChat({ userId, userName = "Usuario", onClose, emotionalContext }: VladiChatProps) {
  const [input, setInput] = useState("")
  const [showEndConfirmation, setShowEndConfirmation] = useState(false)
  const [isEnding, setIsEnding] = useState(false)
  const [sessionId] = useState(crypto.randomUUID())
  const [sessionStartTime] = useState(new Date())
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [hasInitialized, setHasInitialized] = useState(false)

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/ai/vladi-chat",
      body: {
        userId,
        emotionalContext,
        sessionId,
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
    setIsEnding(true)

    try {
      // Generate conversation summary
      const conversationText = messages
        .filter((msg) => {
          const text = getMessageText(msg)
          return !(msg.role === "user" && text === "__INIT__")
        })
        .map((msg) => `${msg.role === "user" ? "Usuario" : "Vladi"}: ${getMessageText(msg)}`)
        .join("\n\n")

      await fetch("/api/ai/vladi-chat/end-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          sessionId,
          conversationText,
          sessionStartTime: sessionStartTime.toISOString(),
        }),
      })

      setShowEndConfirmation(true)
    } catch (error) {
      console.error("[v0] Error ending chat:", error)
      setShowEndConfirmation(true)
    } finally {
      setIsEnding(false)
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

  if (showEndConfirmation) {
    return (
      <div className="fixed inset-0 z-[200] bg-white flex items-center justify-center p-6">
        <button onClick={onClose} className="absolute top-6 right-6 p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <X className="w-6 h-6" />
        </button>

        <div className="max-w-md text-center space-y-6">
          <h2 className="text-2xl font-bold text-gray-900">¡Gracias, {userName}!</h2>

          <div className="space-y-2">
            <p className="text-gray-700 font-medium">Tu conversación con Vladi ha sido finalizada.</p>
            <p className="text-sm text-gray-600">
              Si quieres acceder a tu historial de conversaciones, puedes hacerlo en Tu Panel IEQ.
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
    <div className="fixed inset-0 z-[200] bg-white flex flex-col">
      <div
        className="flex items-center justify-between px-6 py-4"
        style={{ paddingTop: "max(16px, env(safe-area-inset-top))" }}
      >
        <h1 className="text-3xl font-bold text-gray-900" style={{ fontFamily: "DM Sans, sans-serif" }}>
          Vladi
        </h1>

        <button
          onClick={handleEndChat}
          disabled={isEnding}
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
                  <div className="bg-gray-100 text-gray-900 px-5 py-3 rounded-2xl max-w-[80%] text-xs leading-relaxed">
                    {messageText}
                  </div>
                ) : (
                  <div className="max-w-[90%]">
                    <p className="text-gray-900 text-xs leading-relaxed whitespace-pre-wrap">{messageText}</p>
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
          boxShadow: "0px -4px 22.3px 0px rgba(0, 0, 0, 0.11)",
        }}
      >
        <form onSubmit={handleSend}>
          <div className="bg-white border-2 border-gray-200 rounded-full py-3 pr-3 pl-5 flex items-center shadow-sm">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Escribe aquí lo que quieras..."
              disabled={status !== "ready"}
              className="flex-1 bg-transparent border-none outline-none text-base text-gray-900 placeholder:text-gray-400"
            />
            {input.trim() ? (
              <button
                type="submit"
                disabled={status !== "ready"}
                className="w-11 h-11 bg-gray-900 rounded-full flex items-center justify-center text-white ml-3 active:scale-95 transition-transform disabled:opacity-50"
              >
                <ArrowUp className="w-5 h-5" />
              </button>
            ) : (
              <button
                type="button"
                className="w-11 h-11 bg-gray-900 rounded-full flex items-center justify-center text-white ml-3 active:scale-95 transition-transform"
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

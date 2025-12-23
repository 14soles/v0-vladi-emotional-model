"use client"

import type React from "react"
import { useState, useRef, useCallback, useEffect } from "react"
import { QUADRANT_STATES, type QuadrantId } from "@/lib/vladi-data"

interface RecordViewProps {
  onStartCheckIn: (quadrant: QuadrantId) => void
  userName?: string
  userProfile?: {
    username?: string
    display_name?: string
    avatar_url?: string
  } | null
  onAvatarClick?: () => void
  onNotificationsClick?: () => void
  notificationCount?: number
}

export function RecordView({
  onStartCheckIn,
  userName = "Oscar",
  userProfile,
  onAvatarClick,
  onNotificationsClick,
  notificationCount = 0,
}: RecordViewProps) {
  const [currentIndex, setCurrentIndex] = useState(1)
  const [isExpanding, setIsExpanding] = useState(false)
  const [isPressed, setIsPressed] = useState(false)
  const pressTimerRef = useRef<NodeJS.Timeout | null>(null)
  const HOLD_DELAY = 200

  const currentState = QUADRANT_STATES[currentIndex]

  const gradientImages: Record<QuadrantId, string> = {
    yellow: "/images/circulo-amarillo.png",
    green: "/images/circulo-verde.png",
    red: "/images/circulo-rojo.png",
    blue: "/images/circulo-azul.png",
  }

  const now = new Date()
  const dateStr = `Hoy, ${now.getDate().toString().padStart(2, "0")} Dic ${now.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}`

  const handlePressStart = useCallback(
    (e: React.TouchEvent | React.MouseEvent) => {
      e.preventDefault()
      if (isExpanding) return

      setIsPressed(true)
      pressTimerRef.current = setTimeout(() => {
        setIsExpanding(true)
        setTimeout(() => {
          onStartCheckIn(currentState.id as QuadrantId)
          setIsExpanding(false)
          setIsPressed(false)
        }, 150)
      }, HOLD_DELAY)
    },
    [isExpanding, currentState.id, onStartCheckIn],
  )

  const handlePressEnd = useCallback(
    (e: React.TouchEvent | React.MouseEvent) => {
      e.preventDefault()
      if (pressTimerRef.current) {
        clearTimeout(pressTimerRef.current)
        pressTimerRef.current = null
      }

      if (!isExpanding && isPressed) {
        setCurrentIndex((prev) => (prev + 1) % QUADRANT_STATES.length)
      }
      setIsPressed(false)
    },
    [isExpanding, isPressed],
  )

  const handlePressCancel = useCallback(() => {
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current)
      pressTimerRef.current = null
    }
    setIsPressed(false)
  }, [])

  useEffect(() => {
    return () => {
      if (pressTimerRef.current) {
        clearTimeout(pressTimerRef.current)
      }
    }
  }, [])

  return (
    <div className="flex flex-col items-center flex-1 min-h-0 pt-safe">
      <header className="w-full max-w-md flex justify-between items-center px-6 py-5 shrink-0">
        <div className="text-3xl font-light text-gray-900">Vladi</div>
        <div className="flex items-center gap-3">
          {/* Notification Bell */}
          <button
            onClick={onNotificationsClick}
            className="relative w-10 h-10 flex items-center justify-center text-gray-900 hover:opacity-70 active:opacity-50"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
            {notificationCount > 0 && (
              <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-[10px] font-semibold rounded-full flex items-center justify-center">
                {notificationCount}
              </span>
            )}
          </button>
        </div>
      </header>

      <div className="w-full max-w-md text-center mt-6 mb-4 px-6 shrink-0">
        <p className="text-base text-gray-600 mb-2">
          <span className="font-light">Hola, </span>
          <span className="font-semibold">{userName}</span>
        </p>
        <h2 className="text-3xl font-light mb-3 text-gray-900">¿Cómo estás?</h2>
        <p className="text-sm text-gray-400 font-light">{dateStr}</p>
      </div>

      <div className="flex-1 flex items-center justify-center w-full px-6 min-h-0">
        <div
          className="relative aspect-square w-full max-w-[420px] rounded-full cursor-pointer touch-none select-none overflow-hidden"
          onMouseDown={handlePressStart}
          onMouseUp={handlePressEnd}
          onMouseLeave={handlePressCancel}
          onTouchStart={handlePressStart}
          onTouchEnd={handlePressEnd}
          onTouchCancel={handlePressCancel}
          style={{ WebkitTapHighlightColor: "transparent" }}
        >
          <div
            className={`absolute inset-0 rounded-full ${
              isExpanding ? "scale-[4]" : isPressed ? "scale-[0.98]" : "scale-100"
            }`}
            style={{
              backgroundImage: `url(${gradientImages[currentState.id as QuadrantId]})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              transition: isExpanding
                ? "transform 150ms cubic-bezier(0.4, 0, 0.2, 1)"
                : "transform 80ms cubic-bezier(0.4, 0, 0.6, 1)",
            }}
          />

          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
            <span
              className={`text-white text-3xl sm:text-4xl md:text-5xl font-light tracking-wide transition-opacity duration-100 ${isExpanding ? "opacity-0" : "opacity-100"}`}
            >
              {currentState.text}
            </span>
          </div>
        </div>
      </div>

      <p className="text-gray-500 font-light px-8 text-center text-sm py-6 pb-safe shrink-0">
        Toca el círculo en la pantalla
        <br />
        Mantén pulsado para continuar
      </p>
    </div>
  )
}

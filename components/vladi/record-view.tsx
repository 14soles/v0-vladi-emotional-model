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
          <button
            onClick={onNotificationsClick}
            className="relative w-10 h-10 flex items-center justify-center text-gray-900 hover:opacity-70 active:opacity-50"
          >
            <svg className="w-[18px] h-[18px]" viewBox="0 0 19 23" fill="none">
              <path
                d="M9.41408 0C12.8759 0 16.5228 2.52998 16.8864 6.40356L16.8875 6.41163C16.9203 6.80166 16.92 7.18758 16.9188 7.53407C16.9176 7.86925 16.9169 8.16752 16.9344 8.45809C17.0739 9.10296 17.3515 9.7062 17.7495 10.2208L17.9326 10.4411L18.0041 10.5345C18.4551 11.2213 18.713 12.022 18.7489 12.8486C18.7494 12.8609 18.75 12.8732 18.75 12.8856V13.2905C18.7291 14.3279 18.3617 15.328 17.7093 16.1271C17.6985 16.1404 17.6875 16.1538 17.6758 16.1664C16.7842 17.1274 15.5865 17.7224 14.3037 17.8437L14.3048 17.8448C11.0285 18.2082 7.72266 18.2073 4.44631 17.8448H4.44296C4.44039 17.8445 4.43772 17.8451 4.43515 17.8448C3.15484 17.719 1.96018 17.1243 1.06636 16.1687C1.05271 16.1541 1.03873 16.1393 1.02616 16.1237C0.385092 15.3284 0.0245205 14.3338 0 13.3032V12.8844C1.9143e-06 12.8705 0.000441016 12.8567 0.0011166 12.8429C0.0419216 12.0169 0.298594 11.2174 0.743658 10.5299L0.82182 10.4273C1.31377 9.8782 1.65416 9.20446 1.81336 8.4754C1.81346 7.81653 1.81581 7.11221 1.87478 6.41163V6.40702C2.22444 2.52995 5.87499 0 9.33592 0H9.41408ZM9.33592 1.65424C6.47705 1.65424 3.725 3.74507 3.46817 6.55468C3.41317 7.20814 3.41346 7.87775 3.41346 8.57806C3.41343 8.63466 3.40789 8.69109 3.39671 8.74649C3.19114 9.76418 2.72657 10.7049 2.05567 11.4782C1.78265 11.9108 1.62559 12.4109 1.60009 12.9271V13.1301C1.5864 13.8237 1.81253 14.4992 2.23544 15.037C2.8638 15.7002 3.69875 16.1125 4.59371 16.1987L4.60599 16.1998C7.77243 16.551 10.9675 16.551 14.134 16.1998L14.1485 16.1987C15.0414 16.1166 15.8743 15.7049 16.4989 15.0416C16.9354 14.4982 17.1658 13.819 17.1488 13.1243V12.9086C17.1245 12.4052 16.9688 11.9173 16.6977 11.4932C16.0274 10.7146 15.5639 9.76936 15.3555 8.7488C15.348 8.71215 15.3425 8.67425 15.3399 8.6369C15.3131 8.25257 15.3163 7.86948 15.3176 7.5283C15.3188 7.17846 15.318 6.86638 15.293 6.5639L15.2617 6.30204C14.8575 3.61911 12.1847 1.65424 9.41408 1.65424H9.33592Z"
                fill="currentColor"
              />
              <path
                d="M11.139 19.9587C11.416 19.6029 11.9201 19.5458 12.2646 19.8318C12.609 20.118 12.6633 20.6387 12.3863 20.9946C12.1909 21.2456 11.9651 21.4719 11.713 21.666L11.7119 21.6648C10.9032 22.3046 9.88537 22.5954 8.87345 22.4723C7.85734 22.3486 6.92807 21.818 6.28517 20.9957C6.00785 20.6405 6.06204 20.1197 6.40576 19.8329C6.74963 19.5464 7.25367 19.6024 7.5313 19.9575C7.91141 20.4434 8.46044 20.7565 9.06104 20.8296C9.66186 20.9027 10.2669 20.7302 10.746 20.3486L10.756 20.3393C10.8991 20.2293 11.0279 20.1013 11.139 19.9587Z"
                fill="currentColor"
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

      <div className="w-full max-w-md text-center mt-2 sm:mt-4 mb-3 sm:mb-4 px-6 shrink-0">
        <p className="text-base text-gray-600 mb-2">
          <span className="font-light">Hola, </span>
          <span className="font-semibold">{userName}</span>
        </p>
        <h2 className="text-3xl font-light mb-2 sm:mb-3 text-gray-900">¿Cómo estás?</h2>
        <p className="text-sm text-gray-400 font-light">{dateStr}</p>
      </div>

      <div className="flex-1 flex items-center justify-center w-full px-6 sm:px-8 min-h-0 py-4">
        <div
          className="relative aspect-square w-full max-w-[500px] lg:max-w-[350px] rounded-full cursor-pointer touch-none select-none overflow-hidden"
          onMouseDown={handlePressStart}
          onMouseUp={handlePressEnd}
          onMouseLeave={handlePressCancel}
          onTouchStart={handlePressStart}
          onTouchEnd={handlePressEnd}
          onTouchCancel={handlePressCancel}
          style={{ WebkitTapHighlightColor: "transparent" }}
        >
          <div
            className="absolute inset-0 rounded-full"
            style={{
              backgroundImage: `url(${gradientImages[currentState.id as QuadrantId]})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              transform: isExpanding ? "scale(4)" : "scale(1)",
              transition: isExpanding ? "transform 150ms cubic-bezier(0.4, 0, 0.2, 1)" : "none",
            }}
          />

          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
            <span
              className={`text-white text-2xl sm:text-3xl md:text-xl font-light tracking-wide`}
              style={{ transition: "opacity 100ms", opacity: isExpanding ? 0 : 1 }}
            >
              {currentState.text}
            </span>
          </div>
        </div>
      </div>

      <p className="text-gray-500 font-light px-8 text-center text-sm py-4 sm:py-6 pb-[calc(1rem+env(safe-area-inset-bottom))] shrink-0 mb-5">
        Toca el círculo en la pantalla
        <br />
        Mantén pulsado para continuar
      </p>
    </div>
  )
}

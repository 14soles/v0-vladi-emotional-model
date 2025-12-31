"use client"

import type React from "react"
import { X, Check } from "lucide-react"
import { EMOTION_DESCRIPTIONS, QUADRANT_STATES, type QuadrantId } from "@/lib/vladi-data"
import { useScreenSize, useEmotionSelector, type EmotionData } from "@/lib/hooks"

interface EmotionScreenProps {
  quadrant: QuadrantId
  onClose: () => void
  onConfirm: (data: EmotionData) => void
}

const QUADRANT_GRADIENTS: Record<QuadrantId, { top: string; bottom: string }> = {
  green: { top: "#B4D987", bottom: "#8BB458" },
  yellow: { top: "#FDD836", bottom: "#F39C12" },
  red: { top: "#FF7A59", bottom: "#F94A44" },
  blue: { top: "#80B4E5", bottom: "#5A99D4" },
}

export function EmotionScreen({ quadrant, onClose, onConfirm }: EmotionScreenProps) {
  const screenSize = useScreenSize()
  const descriptions = EMOTION_DESCRIPTIONS[quadrant] || {}
  const { isDragging, showCard, position, emotionData, startSelection, updateSelection, finishSelection } =
    useEmotionSelector(quadrant, descriptions, screenSize)

  const state = QUADRANT_STATES.find((s) => s.id === quadrant)!
  const gradient = QUADRANT_GRADIENTS[quadrant]

  const handlePointerDown = (e: React.PointerEvent) => {
    const target = e.target as HTMLElement
    if (target.closest("#back-button") || target.closest("#emotion-card-container")) return
    e.preventDefault()
    startSelection(e.clientX, e.clientY)
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return
    e.preventDefault()
    updateSelection(e.clientX, e.clientY)
  }

  const handlePointerUp = () => {
    finishSelection()
  }

  if (screenSize.width === 0) {
    return <div className="fixed inset-0 z-50" style={{ backgroundColor: state.color }} />
  }

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col touch-none select-none"
      style={{ background: `linear-gradient(to bottom, ${gradient.top} 0%, ${gradient.bottom} 100%)` }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {/* Back button */}
      <button
        id="back-button"
        onClick={onClose}
        className="absolute top-4 left-4 z-[60] p-2.5 text-white/80 hover:text-white touch-manipulation"
        style={{ top: "max(16px, env(safe-area-inset-top))" }}
      >
        <X className="w-8 h-8" strokeWidth={1} />
      </button>

      {/* Selection fill */}
      <div
        className="absolute bottom-0 left-0 bg-white/20 pointer-events-none transition-none"
        style={{ width: position.x, height: screenSize.height - position.y }}
      />

      {/* Crosshairs */}
      <div
        className="absolute w-px bg-white/50 pointer-events-none"
        style={{ left: position.x, top: 0, height: "100%" }}
      />
      <div
        className="absolute h-px bg-white/50 pointer-events-none"
        style={{ top: position.y, left: 0, width: "100%" }}
      />

      {/* Percentage displays */}
      <PercentageDisplay
        value={emotionData?.pleasantness}
        label="Bienestar"
        position={{ x: position.x, isHorizontal: true }}
      />
      <PercentageDisplay
        value={emotionData?.energy}
        label="Energía"
        position={{ y: position.y, isHorizontal: false }}
      />

      {/* Emotion name display */}
      <div className="relative w-full h-full flex items-center justify-center pointer-events-none px-4">
        <h1 className="text-3xl md:text-4xl font-light text-white tracking-wide transition-all duration-75">
          {emotionData?.emotion || ""}
        </h1>
      </div>

      {/* Instruction text */}
      <div
        className="absolute left-0 right-0 text-center text-white/80 font-light text-base px-10 pointer-events-none"
        style={{ bottom: "max(50px, env(safe-area-inset-bottom))" }}
      >
        Muévete por la pantalla y
        <br />
        selecciona una emoción.
      </div>

      {/* Emotion card */}
      {showCard && emotionData && (
        <EmotionCard emotion={emotionData} color={state.color} onConfirm={() => onConfirm(emotionData)} />
      )}
    </div>
  )
}

function PercentageDisplay({
  value,
  label,
  position,
}: {
  value?: number
  label: string
  position: { x?: number; y?: number; isHorizontal: boolean }
}) {
  if (position.isHorizontal && position.x !== undefined) {
    return (
      <>
        <div
          className="absolute z-10 text-white/90 text-sm font-bold pointer-events-none"
          style={{ left: position.x, top: "max(15px, env(safe-area-inset-top))", transform: "translateX(-50%)" }}
        >
          {value}%
        </div>
        <div
          className="absolute z-10 text-white/70 text-[10px] font-medium uppercase tracking-wider pointer-events-none"
          style={{
            left: position.x,
            top: "max(35px, calc(env(safe-area-inset-top) + 20px))",
            transform: "translateX(-50%)",
          }}
        >
          {label}
        </div>
      </>
    )
  }

  if (!position.isHorizontal && position.y !== undefined) {
    return (
      <>
        <div
          className="absolute z-10 text-white/90 text-sm font-bold pointer-events-none"
          style={{ right: 15, top: position.y, transform: "translateY(-50%)" }}
        >
          {value}%
        </div>
        <div
          className="absolute z-10 text-white/70 text-[10px] font-medium uppercase tracking-wider pointer-events-none"
          style={{ right: 15, top: position.y, transform: "translateY(calc(-50% + 15px))" }}
        >
          {label}
        </div>
      </>
    )
  }

  return null
}

function EmotionCard({
  emotion,
  color,
  onConfirm,
}: {
  emotion: EmotionData
  color: string
  onConfirm: () => void
}) {
  return (
    <div
      id="emotion-card-container"
      className="absolute left-1/2 -translate-x-1/2 z-[60] w-[90%] max-w-[400px] pointer-events-auto touch-manipulation"
      style={{ bottom: "max(40px, env(safe-area-inset-bottom))" }}
    >
      <div className="bg-white rounded-[50px] p-5 pr-20 flex items-center justify-between min-h-[90px] shadow-[0_10px_30px_rgba(0,0,0,0.15)] relative">
        <p className="text-gray-700 text-sm leading-relaxed pr-4">{emotion.description}</p>
        <button
          onClick={onConfirm}
          className="absolute right-4 top-1/2 -translate-y-1/2 w-[50px] h-[50px] rounded-full flex items-center justify-center active:scale-95 transition-transform touch-manipulation"
          style={{ backgroundColor: color }}
        >
          <Check className="w-6 h-6 text-white" />
        </button>
      </div>
    </div>
  )
}

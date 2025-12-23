// Hook for emotion selection logic
"use client"

import { useState, useCallback, useEffect } from "react"
import { EMOTION_MATRICES, type QuadrantId } from "@/lib/vladi-data"

export interface EmotionPosition {
  x: number
  y: number
}

export interface EmotionData {
  emotion: string
  quadrant: QuadrantId
  energy: number
  pleasantness: number
  description: string
  valence: 1 | -1 | 0
  intensity: number
}

export function useEmotionSelector(
  quadrant: QuadrantId,
  descriptions: Record<string, string>,
  screenSize: { width: number; height: number },
) {
  const [isDragging, setIsDragging] = useState(false)
  const [showCard, setShowCard] = useState(false)
  const [position, setPosition] = useState<EmotionPosition>({ x: 0, y: 0 })
  const [emotionData, setEmotionData] = useState<EmotionData | null>(null)

  const matrix = EMOTION_MATRICES[quadrant]

  const calculateEmotionFromPosition = useCallback(
    (x: number, y: number): EmotionData | null => {
      if (screenSize.width === 0 || screenSize.height === 0) return null

      const pctX = Math.max(0, Math.min(100, (x / screenSize.width) * 100))
      const pctY = Math.max(0, Math.min(100, 100 - (y / screenSize.height) * 100))

      let displayX: number, displayY: number
      if (quadrant === "green") {
        displayX = 50 + pctX * 0.5
        displayY = pctY * 0.5
      } else if (quadrant === "yellow") {
        displayX = 50 + pctX * 0.5
        displayY = 50 + pctY * 0.5
      } else if (quadrant === "red") {
        displayX = pctX * 0.5
        displayY = 50 + pctY * 0.5
      } else {
        displayX = pctX * 0.5
        displayY = pctY * 0.5
      }

      const idxX = Math.min(Math.floor(pctX / 20), 4)
      const idxY = Math.min(Math.floor(pctY / 20), 4)
      const emotion = matrix[idxY]?.[idxX] || matrix[0][0]
      const description = descriptions[emotion] || ""

      const valence: 1 | -1 | 0 = quadrant === "green" || quadrant === "yellow" ? 1 : -1
      const intensity = Math.round(Math.sqrt(Math.pow(pctX - 50, 2) + Math.pow(pctY - 50, 2)) / 7) + 1

      return {
        emotion,
        quadrant,
        energy: Math.round(displayY),
        pleasantness: Math.round(displayX),
        description,
        valence,
        intensity: Math.min(10, Math.max(1, intensity)),
      }
    },
    [quadrant, matrix, descriptions, screenSize],
  )

  const startSelection = useCallback(
    (x: number, y: number) => {
      setIsDragging(true)
      setShowCard(false)
      const data = calculateEmotionFromPosition(x, y)
      if (data) {
        setPosition({ x, y })
        setEmotionData(data)
      }
    },
    [calculateEmotionFromPosition],
  )

  const updateSelection = useCallback(
    (x: number, y: number) => {
      if (!isDragging) return
      const data = calculateEmotionFromPosition(x, y)
      if (data) {
        setPosition({ x, y })
        setEmotionData(data)
      }
    },
    [isDragging, calculateEmotionFromPosition],
  )

  const finishSelection = useCallback(() => {
    if (!isDragging) return
    setIsDragging(false)
    setShowCard(true)
  }, [isDragging])

  const cancelSelection = useCallback(() => {
    setIsDragging(false)
    setShowCard(false)
  }, [])

  // Initialize with center position
  useEffect(() => {
    if (screenSize.width > 0 && screenSize.height > 0 && !position.x) {
      const centerX = screenSize.width / 2
      const centerY = screenSize.height / 2
      const data = calculateEmotionFromPosition(centerX, centerY)
      if (data) {
        setPosition({ x: centerX, y: centerY })
        setEmotionData(data)
      }
    }
  }, [screenSize, position.x, calculateEmotionFromPosition])

  return {
    isDragging,
    showCard,
    position,
    emotionData,
    startSelection,
    updateSelection,
    finishSelection,
    cancelSelection,
  }
}

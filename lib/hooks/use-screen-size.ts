// Hook for responsive screen size tracking
"use client"

import { useState, useEffect } from "react"

export interface ScreenSize {
  width: number
  height: number
}

export function useScreenSize(): ScreenSize {
  const [screenSize, setScreenSize] = useState<ScreenSize>({ width: 0, height: 0 })

  useEffect(() => {
    const updateSize = () => {
      setScreenSize({ width: window.innerWidth, height: window.innerHeight })
    }

    updateSize()
    window.addEventListener("resize", updateSize)
    return () => window.removeEventListener("resize", updateSize)
  }, [])

  return screenSize
}

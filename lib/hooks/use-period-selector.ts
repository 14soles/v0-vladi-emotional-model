// Custom hook for period selection logic
"use client"

import { useState } from "react"

export type TimePeriod = "today" | "3d" | "7d" | "30d" | "60d"

export function usePeriodSelector(initialPeriod: TimePeriod = "7d") {
  const [period, setPeriod] = useState<TimePeriod>(initialPeriod)
  const [showPeriodMenu, setShowPeriodMenu] = useState(false)

  const getPeriodDays = () => {
    switch (period) {
      case "today":
        return 1
      case "3d":
        return 3
      case "7d":
        return 7
      case "30d":
        return 30
      case "60d":
        return 60
      default:
        return 7
    }
  }

  const getPeriodLabel = () => {
    switch (period) {
      case "today":
        return "Hoy"
      case "3d":
        return "3 días"
      case "7d":
        return "7 días"
      case "30d":
        return "30 días"
      case "60d":
        return "60 días"
      default:
        return "7 días"
    }
  }

  const formatDateRange = () => {
    const today = new Date()
    const periodDays = getPeriodDays()
    const startDate = new Date(today)
    startDate.setDate(startDate.getDate() - periodDays)

    const formatDate = (date: Date) => {
      const day = String(date.getDate()).padStart(2, "0")
      const month = date.toLocaleDateString("es-ES", { month: "short" })
      return `${day} ${month.charAt(0).toUpperCase() + month.slice(1)}`
    }

    return `${formatDate(startDate)} – ${formatDate(today)}`
  }

  const toggleMenu = () => setShowPeriodMenu(!showPeriodMenu)
  const closeMenu = () => setShowPeriodMenu(false)

  const selectPeriod = (newPeriod: TimePeriod) => {
    setPeriod(newPeriod)
    setShowPeriodMenu(false)
  }

  return {
    period,
    showPeriodMenu,
    getPeriodDays,
    getPeriodLabel,
    formatDateRange,
    toggleMenu,
    closeMenu,
    selectPeriod,
  }
}

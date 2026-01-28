"use client"

import { cn } from "@/lib/utils"
import type { CalibrationState, MetricCalibration } from "@/lib/deam-engine"

interface CalibrationIndicatorProps {
  calibration: MetricCalibration
  size?: "sm" | "md" | "lg"
  showProgress?: boolean
  showMessage?: boolean
  className?: string
}

const stateColors: Record<CalibrationState, { bg: string; text: string; border: string }> = {
  insufficient: {
    bg: "bg-gray-100",
    text: "text-gray-500",
    border: "border-gray-200"
  },
  calibrating: {
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200"
  },
  stable: {
    bg: "bg-green-50",
    text: "text-green-700", 
    border: "border-green-200"
  }
}

const stateLabels: Record<CalibrationState, string> = {
  insufficient: "Sin datos",
  calibrating: "Calibrando",
  stable: "Estable"
}

export function CalibrationIndicator({
  calibration,
  size = "sm",
  showProgress = false,
  showMessage = false,
  className
}: CalibrationIndicatorProps) {
  const colors = stateColors[calibration.state]
  
  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-3 py-1",
    lg: "text-base px-4 py-1.5"
  }

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <div className="flex items-center gap-2">
        <span className={cn(
          "inline-flex items-center rounded-full border font-medium",
          colors.bg,
          colors.text,
          colors.border,
          sizeClasses[size]
        )}>
          {stateLabels[calibration.state]}
        </span>
        
        {showProgress && calibration.state !== "stable" && (
          <span className="text-xs text-gray-500">
            {calibration.current}/{calibration.optimal}
          </span>
        )}
      </div>
      
      {showProgress && calibration.state !== "stable" && (
        <div className="w-full bg-gray-200 rounded-full h-1">
          <div 
            className={cn(
              "h-1 rounded-full transition-all",
              calibration.state === "insufficient" ? "bg-gray-400" : "bg-amber-500"
            )}
            style={{ width: `${calibration.progress}%` }}
          />
        </div>
      )}
      
      {showMessage && calibration.state !== "stable" && (
        <p className="text-xs text-gray-500 mt-1">{calibration.message}</p>
      )}
    </div>
  )
}

interface CalibrationOverlayProps {
  calibration: MetricCalibration
  children: React.ReactNode
}

export function CalibrationOverlay({ calibration, children }: CalibrationOverlayProps) {
  if (calibration.state === "stable") {
    return <>{children}</>
  }

  return (
    <div className="relative">
      {calibration.state === "insufficient" && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center rounded-2xl">
          <div className="text-center px-4">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <p className="text-sm text-gray-600 font-medium mb-1">Datos insuficientes</p>
            <p className="text-xs text-gray-500">{calibration.message}</p>
          </div>
        </div>
      )}
      
      {calibration.state === "calibrating" && (
        <div className="absolute top-2 right-2 z-10">
          <CalibrationIndicator calibration={calibration} showProgress />
        </div>
      )}
      
      <div className={cn(
        calibration.state === "calibrating" && "opacity-85"
      )}>
        {children}
      </div>
    </div>
  )
}

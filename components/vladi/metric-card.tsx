"use client"

import type React from "react"

import { motion } from "framer-motion"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface MetricCardProps {
  title: string
  value: number | string
  unit?: string
  description?: string
  trend?: "up" | "down" | "neutral"
  trendValue?: string
  icon?: React.ReactNode
  color?: "primary" | "success" | "warning" | "danger"
}

export function MetricCard({
  title,
  value,
  unit,
  description,
  trend,
  trendValue,
  icon,
  color = "primary",
}: MetricCardProps) {
  const colorClasses = {
    primary: "text-primary",
    success: "text-green-500",
    warning: "text-yellow-500",
    danger: "text-red-500",
  }

  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus

  return (
    <Card className="border-0 shadow-sm bg-card">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{title}</p>
            <div className="flex items-baseline gap-1">
              <motion.span
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn("text-3xl font-bold", colorClasses[color])}
              >
                {value}
              </motion.span>
              {unit && <span className="text-sm text-muted-foreground">{unit}</span>}
            </div>
            {description && <p className="text-xs text-muted-foreground">{description}</p>}
          </div>

          {icon && <div className={cn("p-2 rounded-lg bg-primary/10", colorClasses[color])}>{icon}</div>}
        </div>

        {trend && trendValue && (
          <div
            className={cn(
              "flex items-center gap-1 mt-3 text-sm",
              trend === "up" ? "text-green-500" : trend === "down" ? "text-red-500" : "text-muted-foreground",
            )}
          >
            <TrendIcon className="h-4 w-4" />
            <span>{trendValue}</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

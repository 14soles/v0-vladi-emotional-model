"use client"

import { Home, Grid2X2 } from "lucide-react"

interface PlaceholderViewProps {
  title: string
  icon: "home" | "eq"
}

export function PlaceholderView({ title, icon }: PlaceholderViewProps) {
  const Icon = icon === "home" ? Home : Grid2X2

  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-gray-50">
      <Icon className="w-10 h-10 text-gray-300 mb-2" />
      <h2 className="text-xl font-medium text-gray-900">{title}</h2>
      <p className="text-gray-400 font-light mt-1">Próximamente</p>
    </div>
  )
}

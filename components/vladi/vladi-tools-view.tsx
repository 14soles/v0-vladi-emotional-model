"use client"

import { useState } from "react"
import { CommonHeader } from "./common-header"
import { PutANameTool } from "./tools/put-a-name-tool"

interface VladiToolsViewProps {
  userId?: string
  userProfile?: {
    username?: string
    display_name?: string | null
    avatar_url?: string | null
  }
  onAvatarClick?: () => void
  onNotificationsClick?: () => void
  notificationCount?: number
}

type ActiveTool = "none" | "put-a-name" | "understand-others"

interface ToolCard {
  id: ActiveTool
  title: string
  subtitle: string
  bgColor: string
  textColor: string
  available: boolean
}

const TOOLS: ToolCard[] = [
  {
    id: "put-a-name",
    title: "Ponle nombre",
    subtitle: "Afina tu manera de reconocer emociones",
    bgColor: "bg-red-400",
    textColor: "text-white",
    available: true,
  },
  {
    id: "understand-others",
    title: "Entiende a los demás",
    subtitle: "Mejora tu empatía emocional",
    bgColor: "bg-green-400",
    textColor: "text-white",
    available: false, // Coming soon
  },
]

export function VladiToolsView({
  userId,
  userProfile,
  onAvatarClick,
  onNotificationsClick,
  notificationCount = 0,
}: VladiToolsViewProps) {
  const [activeTool, setActiveTool] = useState<ActiveTool>("none")

  const handleToolClick = (toolId: ActiveTool) => {
    if (TOOLS.find(t => t.id === toolId)?.available) {
      setActiveTool(toolId)
    }
  }

  const handleCloseTool = () => {
    setActiveTool("none")
  }

  // Show active tool if one is selected
  if (activeTool === "put-a-name") {
    return (
      <PutANameTool
        userId={userId}
        onClose={handleCloseTool}
      />
    )
  }

  return (
    <div className="flex flex-col h-full bg-background">
      <CommonHeader
        title="Vladi"
        showLogo
        userProfile={userProfile}
        onAvatarClick={onAvatarClick}
        onNotificationsClick={onNotificationsClick}
        notificationCount={notificationCount}
      />

      <div className="flex-1 overflow-y-auto px-4 py-6">
        {/* Tools Grid */}
        <div className="grid grid-cols-2 gap-4">
          {TOOLS.map((tool) => (
            <button
              key={tool.id}
              onClick={() => handleToolClick(tool.id)}
              disabled={!tool.available}
              className={`
                relative aspect-square rounded-3xl p-5 flex flex-col justify-end text-left
                transition-all duration-200 touch-manipulation
                ${tool.bgColor} ${tool.textColor}
                ${tool.available 
                  ? "active:scale-[0.98] hover:opacity-95" 
                  : "opacity-60 cursor-not-allowed"
                }
              `}
            >
              {/* Decorative face/icon placeholder - will be replaced with actual images */}
              <div className="absolute top-4 right-4 w-16 h-16 rounded-full bg-white/10 flex items-center justify-center">
                {tool.id === "put-a-name" && (
                  <svg className="w-10 h-10 opacity-60" viewBox="0 0 24 24" fill="currentColor">
                    <circle cx="12" cy="12" r="10" fillOpacity="0.2" />
                    <circle cx="8" cy="10" r="1.5" />
                    <circle cx="16" cy="10" r="1.5" />
                    <path d="M8 15c0 0 2 2 4 2s4-2 4-2" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                  </svg>
                )}
                {tool.id === "understand-others" && (
                  <svg className="w-10 h-10 opacity-60" viewBox="0 0 24 24" fill="currentColor">
                    <circle cx="12" cy="12" r="10" fillOpacity="0.2" />
                    <path d="M8 11c0-1 0.5-2 1-2s1 1 1 2" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                    <path d="M14 11c0-1 0.5-2 1-2s1 1 1 2" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                    <path d="M9 15.5c0 0 1.5 1 3 1s3-1 3-1" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                  </svg>
                )}
              </div>

              {/* Coming soon badge */}
              {!tool.available && (
                <div className="absolute top-3 left-3 bg-black/20 text-white text-[10px] font-medium px-2 py-1 rounded-full">
                  Próximamente
                </div>
              )}

              {/* Title */}
              <h3 className="text-lg font-semibold leading-tight">
                {tool.title}
              </h3>
            </button>
          ))}
        </div>

        {/* Info section */}
        <div className="mt-8 p-4 bg-muted/50 rounded-2xl">
          <h4 className="font-medium text-foreground mb-2">Entrena tu inteligencia emocional</h4>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Estas herramientas te ayudarán a mejorar tu capacidad de reconocer y 
            comprender emociones. Completa actividades regularmente para ver tu progreso.
          </p>
        </div>
      </div>
    </div>
  )
}

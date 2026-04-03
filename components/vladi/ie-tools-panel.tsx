"use client"

import { useState } from "react"
import { ArrowLeft, Heart, Clock } from "lucide-react"

// Tool categories and their tools
const TOOL_CATEGORIES = [
  {
    id: "favorites",
    title: "Tus favoritos",
    tools: [] as Tool[], // Will be populated from user data
  },
  {
    id: "emotions",
    title: "Emociones e inteligencia emocional",
    tools: [
      {
        id: "ponle-nombre",
        name: "Ponle nombre a lo que sientes",
        shortName: "Ponle nombre",
        description: "Mejora tu vocabulario emocional identificando emociones en rostros",
        icon: "face-neutral",
        color: "bg-teal-400",
        textColor: "text-white",
        duration: "3 min",
        category: "recognition",
        available: true,
      },
      {
        id: "afinar-emociones",
        name: "Afinar mis emociones",
        shortName: "Afinar emociones",
        description: "Distingue matices sutiles entre emociones similares",
        icon: "face-thinking",
        color: "bg-indigo-300",
        textColor: "text-white",
        duration: "4 min",
        category: "granularity",
        available: false,
      },
      {
        id: "se-amable",
        name: "Sé amable contigo",
        shortName: "Autocompasión",
        description: "Practica la autocompasión y el cuidado personal",
        icon: "face-smile",
        color: "bg-stone-400",
        textColor: "text-white",
        duration: "5 min",
        category: "self-compassion",
        available: false,
      },
    ],
  },
  {
    id: "wellness",
    title: "Bienestar emocional",
    tools: [
      {
        id: "saber-como-estoy",
        name: "Para saber cómo estoy",
        shortName: "Cómo estoy",
        description: "Evalúa tu estado emocional actual",
        icon: "face-meh",
        color: "bg-sky-400",
        textColor: "text-white",
        duration: "2 min",
        category: "assessment",
        available: false,
      },
      {
        id: "cuidar-energia",
        name: "Para cuidar mi energía",
        shortName: "Mi energía",
        description: "Gestiona tu energía emocional",
        icon: "face-happy",
        color: "bg-amber-400",
        textColor: "text-white",
        duration: "4 min",
        category: "energy",
        available: false,
      },
      {
        id: "recuperar-calma",
        name: "Para recuperar la calma",
        shortName: "Calma",
        description: "Técnicas para volver a un estado de calma",
        icon: "face-worried",
        color: "bg-rose-400",
        textColor: "text-white",
        duration: "5 min",
        category: "regulation",
        available: false,
      },
      {
        id: "entender-demas",
        name: "Para entender a los demás",
        shortName: "Empatía",
        description: "Desarrolla tu empatía y comprensión social",
        icon: "face-content",
        color: "bg-emerald-400",
        textColor: "text-white",
        duration: "4 min",
        category: "empathy",
        available: false,
      },
    ],
  },
]

interface Tool {
  id: string
  name: string
  shortName: string
  description: string
  icon: string
  color: string
  textColor: string
  duration: string
  category: string
  available: boolean
}

interface IEToolsPanelProps {
  onBack: () => void
  onSelectTool: (toolId: string) => void
  userFavorites?: string[]
}

// Simple face icons as SVG components
function FaceIcon({ type, className }: { type: string; className?: string }) {
  const baseClass = `w-12 h-12 ${className || ""}`
  
  switch (type) {
    case "face-neutral":
      return (
        <svg viewBox="0 0 48 48" className={baseClass} fill="currentColor">
          <circle cx="24" cy="24" r="20" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.3"/>
          <circle cx="16" cy="20" r="2.5"/>
          <circle cx="32" cy="20" r="2.5"/>
          <line x1="16" y1="32" x2="32" y2="32" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
        </svg>
      )
    case "face-thinking":
      return (
        <svg viewBox="0 0 48 48" className={baseClass} fill="currentColor">
          <circle cx="24" cy="24" r="20" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.3"/>
          <circle cx="16" cy="20" r="2.5"/>
          <circle cx="32" cy="20" r="2.5"/>
          <path d="M16 32 Q24 28 32 32" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
        </svg>
      )
    case "face-smile":
      return (
        <svg viewBox="0 0 48 48" className={baseClass} fill="currentColor">
          <circle cx="24" cy="24" r="20" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.3"/>
          <circle cx="16" cy="20" r="2.5"/>
          <circle cx="32" cy="20" r="2.5"/>
          <path d="M14 28 Q24 38 34 28" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
        </svg>
      )
    case "face-meh":
      return (
        <svg viewBox="0 0 48 48" className={baseClass} fill="currentColor">
          <circle cx="24" cy="24" r="20" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.3"/>
          <circle cx="16" cy="20" r="2.5"/>
          <circle cx="32" cy="20" r="2.5"/>
          <path d="M16 32 Q24 30 32 34" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
        </svg>
      )
    case "face-happy":
      return (
        <svg viewBox="0 0 48 48" className={baseClass} fill="currentColor">
          <circle cx="24" cy="24" r="20" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.3"/>
          <path d="M12 18 Q16 14 20 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <path d="M28 18 Q32 14 36 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <path d="M14 28 Q24 38 34 28" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
        </svg>
      )
    case "face-worried":
      return (
        <svg viewBox="0 0 48 48" className={baseClass} fill="currentColor">
          <circle cx="24" cy="24" r="20" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.3"/>
          <circle cx="16" cy="22" r="2.5"/>
          <circle cx="32" cy="22" r="2.5"/>
          <path d="M14 18 L20 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <path d="M34 18 L28 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <path d="M16 34 Q24 28 32 34" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
        </svg>
      )
    case "face-content":
      return (
        <svg viewBox="0 0 48 48" className={baseClass} fill="currentColor">
          <circle cx="24" cy="24" r="20" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.3"/>
          <path d="M12 20 Q16 18 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <path d="M28 20 Q32 18 36 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <path d="M16 30 Q24 36 32 30" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
        </svg>
      )
    default:
      return (
        <svg viewBox="0 0 48 48" className={baseClass} fill="currentColor">
          <circle cx="24" cy="24" r="20" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.3"/>
          <circle cx="16" cy="20" r="2.5"/>
          <circle cx="32" cy="20" r="2.5"/>
          <line x1="16" y1="32" x2="32" y2="32" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
        </svg>
      )
  }
}

export function IEToolsPanel({ onBack, onSelectTool, userFavorites = [] }: IEToolsPanelProps) {
  const [favorites] = useState<string[]>(userFavorites)

  // Get all tools flattened
  const allTools = TOOL_CATEGORIES.flatMap((cat) => cat.tools)
  const favoriteTools = allTools.filter((tool) => favorites.includes(tool.id))

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
        <button
          onClick={onBack}
          className="p-2 -ml-2 hover:bg-muted rounded-full transition-colors touch-manipulation"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-lg font-semibold text-foreground">Tu panel IE</h1>
        <div className="w-9" /> {/* Spacer for centering */}
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 py-6 space-y-8">
          {/* Favorites section */}
          {favoriteTools.length > 0 && (
            <section>
              <h2 className="text-base font-semibold text-foreground mb-3">Tus favoritos</h2>
              <div className="grid grid-cols-3 gap-3">
                {favoriteTools.map((tool) => (
                  <button
                    key={tool.id}
                    onClick={() => tool.available && onSelectTool(tool.id)}
                    disabled={!tool.available}
                    className={`${tool.color} ${tool.textColor} rounded-2xl p-3 aspect-square flex flex-col items-start justify-between relative overflow-hidden transition-transform active:scale-95 touch-manipulation ${!tool.available ? "opacity-50" : ""}`}
                  >
                    <Heart className="w-4 h-4 absolute top-2 right-2 fill-current" />
                    <div className="flex-1" />
                    <p className="text-xs font-medium text-left leading-tight">{tool.shortName}</p>
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* Main categories */}
          {TOOL_CATEGORIES.filter((cat) => cat.id !== "favorites" && cat.tools.length > 0).map((category) => (
            <section key={category.id}>
              <h2 className="text-base font-semibold text-foreground mb-3">{category.title}</h2>
              <div className="grid grid-cols-2 gap-3">
                {category.tools.map((tool) => (
                  <button
                    key={tool.id}
                    onClick={() => tool.available && onSelectTool(tool.id)}
                    disabled={!tool.available}
                    className={`${tool.color} ${tool.textColor} rounded-3xl p-4 aspect-[4/3] flex flex-col items-center justify-between relative overflow-hidden transition-transform active:scale-95 touch-manipulation ${!tool.available ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    {/* Duration badge */}
                    <div className="absolute top-3 right-3 flex items-center gap-1 bg-black/10 rounded-full px-2 py-0.5">
                      <Clock className="w-3 h-3" />
                      <span className="text-xs">{tool.duration}</span>
                    </div>
                    
                    {/* Tool name */}
                    <p className="text-sm font-semibold text-center leading-tight mt-2 max-w-[80%]">
                      {tool.name}
                    </p>
                    
                    {/* Face icon */}
                    <div className="flex-1 flex items-center justify-center">
                      <FaceIcon type={tool.icon} className="opacity-80" />
                    </div>
                    
                    {/* Coming soon badge for unavailable */}
                    {!tool.available && (
                      <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                        <span className="bg-black/40 text-white text-xs px-3 py-1 rounded-full">
                          Próximamente
                        </span>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  )
}

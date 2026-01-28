"use client"

import { motion } from "framer-motion"
import { Wind, Brain, Target, Heart, Sparkles, Clock, Footprints, PenLine } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { Intervention } from "@/lib/vladi-types"
import type { InterventionSuggestion } from "@/lib/intervention-suggestion-engine"

interface InterventionSelectorProps {
  onSelect: (intervention: Intervention) => void
  recommendedType?: string
  suggestions?: InterventionSuggestion[]
}

// Mapeo de tipos de intervención del engine a tipos del UI
const TYPE_MAPPING: Record<string, string> = {
  breathing: "respiración",
  grounding: "grounding",
  reframe: "reencuadre",
  gratitude: "gratitud",
  savoring: "savoring",
  writing: "escritura",
  movement: "movimiento",
  mindfulness: "mindfulness",
  // Reverse mapping
  respiración: "breathing",
  reencuadre: "reframe",
  gratitud: "gratitude",
  escritura: "writing",
  movimiento: "movement",
}

const INTERVENTIONS_DATA: (Intervention & { icon: typeof Wind; color: string; engineType: string })[] = [
  {
    id: "1",
    type: "respiración",
    engineType: "breathing",
    name: "Respiración Guiada",
    description: "Técnica 4-7-8 para calmar el sistema nervioso",
    duration: 120,
    icon: Wind,
    color: "text-blue-500 bg-blue-100 dark:bg-blue-900/30",
  },
  {
    id: "2",
    type: "reencuadre",
    engineType: "reframe",
    name: "Reencuadre Cognitivo",
    description: "Cambia la perspectiva sobre la situación",
    duration: 180,
    icon: Brain,
    color: "text-purple-500 bg-purple-100 dark:bg-purple-900/30",
  },
  {
    id: "3",
    type: "grounding",
    engineType: "grounding",
    name: "Técnica 5-4-3-2-1",
    description: "Conecta con tus sentidos para anclarte",
    duration: 150,
    icon: Target,
    color: "text-green-500 bg-green-100 dark:bg-green-900/30",
  },
  {
    id: "4",
    type: "gratitud",
    engineType: "gratitude",
    name: "Momento de Gratitud",
    description: "Identifica 3 cosas positivas de hoy",
    duration: 90,
    icon: Heart,
    color: "text-pink-500 bg-pink-100 dark:bg-pink-900/30",
  },
  {
    id: "5",
    type: "mindfulness",
    engineType: "mindfulness",
    name: "Mindfulness Express",
    description: "Meditación breve de atención plena",
    duration: 180,
    icon: Sparkles,
    color: "text-amber-500 bg-amber-100 dark:bg-amber-900/30",
  },
  {
    id: "6",
    type: "movimiento",
    engineType: "movement",
    name: "Movimiento Consciente",
    description: "Activa tu cuerpo con estiramientos suaves",
    duration: 120,
    icon: Footprints,
    color: "text-orange-500 bg-orange-100 dark:bg-orange-900/30",
  },
  {
    id: "7",
    type: "escritura",
    engineType: "writing",
    name: "Escritura Expresiva",
    description: "Escribe libremente sobre lo que sientes",
    duration: 180,
    icon: PenLine,
    color: "text-teal-500 bg-teal-100 dark:bg-teal-900/30",
  },
  {
    id: "8",
    type: "savoring",
    engineType: "savoring",
    name: "Saborear el Momento",
    description: "Aprecia conscientemente algo positivo",
    duration: 90,
    icon: Heart,
    color: "text-rose-500 bg-rose-100 dark:bg-rose-900/30",
  },
]

export function InterventionSelector({ onSelect, recommendedType, suggestions }: InterventionSelectorProps) {
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    return `${mins} min`
  }

  // Obtener sugerencia para una intervención
  const getSuggestionForType = (engineType: string) => {
    return suggestions?.find(s => s.type === engineType)
  }

  // Ordenar intervenciones: primero las sugeridas (por confianza), luego el resto
  const sortedInterventions = [...INTERVENTIONS_DATA].sort((a, b) => {
    const suggestionA = getSuggestionForType(a.engineType)
    const suggestionB = getSuggestionForType(b.engineType)
    
    if (suggestionA && !suggestionB) return -1
    if (!suggestionA && suggestionB) return 1
    if (suggestionA && suggestionB) {
      return suggestionB.confidence - suggestionA.confidence
    }
    return 0
  })

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="text-xl font-semibold text-foreground">Elige una herramienta</h3>
        <p className="text-sm text-muted-foreground mt-1">
          {suggestions && suggestions.length > 0
            ? "Te recomendamos las opciones destacadas basadas en tu estado"
            : recommendedType
              ? "Te recomendamos la opción destacada basada en tu estado"
              : "Selecciona la que mejor se adapte a ti ahora"}
        </p>
      </div>

      <div className="space-y-3">
        {sortedInterventions.map((intervention, index) => {
          const Icon = intervention.icon
          const suggestion = getSuggestionForType(intervention.engineType)
          const isRecommended = suggestion !== undefined || intervention.type === recommendedType || intervention.engineType === recommendedType
          const confidencePercent = suggestion ? Math.round(suggestion.confidence * 100) : 0

          return (
            <motion.div
              key={intervention.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card
                className={cn(
                  "cursor-pointer transition-all hover:shadow-md border-2",
                  isRecommended ? "border-primary bg-primary/5" : "border-transparent hover:border-primary/30",
                )}
                onClick={() => onSelect(intervention)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", intervention.color)}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-foreground">{intervention.name}</h4>
                        {isRecommended && (
                          <span className="text-xs px-2 py-0.5 bg-primary text-primary-foreground rounded-full">
                            {confidencePercent > 0 ? `${confidencePercent}% match` : "Recomendado"}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{intervention.description}</p>
                      {suggestion && suggestion.reasons.length > 0 && (
                        <p className="text-xs text-primary/70 mt-1">
                          {suggestion.reasons.slice(0, 2).join(" • ")}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span className="text-sm">{formatDuration(intervention.duration)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

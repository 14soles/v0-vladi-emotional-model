"use client"

import { motion } from "framer-motion"
import { Wind, Brain, Target, Heart, Sparkles, Clock } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { Intervention } from "@/lib/vladi-types"

interface InterventionSelectorProps {
  onSelect: (intervention: Intervention) => void
  recommendedType?: string
}

const INTERVENTIONS_DATA: (Intervention & { icon: typeof Wind; color: string })[] = [
  {
    id: "1",
    type: "respiración",
    name: "Respiración Guiada",
    description: "Técnica 4-7-8 para calmar el sistema nervioso",
    duration: 120,
    icon: Wind,
    color: "text-blue-500 bg-blue-100 dark:bg-blue-900/30",
  },
  {
    id: "2",
    type: "reencuadre",
    name: "Reencuadre Cognitivo",
    description: "Cambia la perspectiva sobre la situación",
    duration: 180,
    icon: Brain,
    color: "text-purple-500 bg-purple-100 dark:bg-purple-900/30",
  },
  {
    id: "3",
    type: "grounding",
    name: "Técnica 5-4-3-2-1",
    description: "Conecta con tus sentidos para anclarte",
    duration: 150,
    icon: Target,
    color: "text-green-500 bg-green-100 dark:bg-green-900/30",
  },
  {
    id: "4",
    type: "gratitud",
    name: "Momento de Gratitud",
    description: "Identifica 3 cosas positivas de hoy",
    duration: 90,
    icon: Heart,
    color: "text-pink-500 bg-pink-100 dark:bg-pink-900/30",
  },
  {
    id: "5",
    type: "mindfulness",
    name: "Mindfulness Express",
    description: "Meditación breve de atención plena",
    duration: 180,
    icon: Sparkles,
    color: "text-amber-500 bg-amber-100 dark:bg-amber-900/30",
  },
]

export function InterventionSelector({ onSelect, recommendedType }: InterventionSelectorProps) {
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    return `${mins} min`
  }

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="text-xl font-semibold text-foreground">Elige una herramienta</h3>
        <p className="text-sm text-muted-foreground mt-1">
          {recommendedType
            ? "Te recomendamos la opción destacada basada en tu estado"
            : "Selecciona la que mejor se adapte a ti ahora"}
        </p>
      </div>

      <div className="space-y-3">
        {INTERVENTIONS_DATA.map((intervention, index) => {
          const Icon = intervention.icon
          const isRecommended = intervention.type === recommendedType

          return (
            <motion.div
              key={intervention.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
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
                            Recomendado
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{intervention.description}</p>
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

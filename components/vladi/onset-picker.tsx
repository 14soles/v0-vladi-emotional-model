"use client"

import { motion } from "framer-motion"
import { Clock, AlertCircle, HelpCircle, Coffee, Moon, Utensils, Heart } from "lucide-react"
import { cn } from "@/lib/utils"
import type { OnsetBucket, PhysicalState } from "@/lib/hooks/use-check-in-flow"

interface OnsetPickerProps {
  selectedOnset: OnsetBucket | null
  selectedPhysical: PhysicalState | null
  onOnsetSelect: (onset: OnsetBucket) => void
  onPhysicalSelect: (state: PhysicalState) => void
  isNegativeEmotion?: boolean
}

const ONSET_OPTIONS: { value: OnsetBucket; label: string; sublabel: string }[] = [
  { value: "just_now", label: "Ahora mismo", sublabel: "Hace menos de 10 min" },
  { value: "10_30_min", label: "Hace un rato", sublabel: "10-30 minutos" },
  { value: "30_60_min", label: "Hace un tiempo", sublabel: "30-60 minutos" },
  { value: "1_3_hours", label: "Hace horas", sublabel: "1-3 horas" },
  { value: "3_plus_hours", label: "Mucho tiempo", sublabel: "Más de 3 horas" },
  { value: "unknown", label: "No estoy seguro/a", sublabel: "No sé cuándo empezó" },
]

const PHYSICAL_OPTIONS: { value: PhysicalState; label: string; icon: typeof Coffee }[] = [
  { value: "rested", label: "Descansado/a", icon: Heart },
  { value: "tired", label: "Cansado/a", icon: Moon },
  { value: "hungry", label: "Hambriento/a", icon: Utensils },
  { value: "sick", label: "Enfermo/a", icon: AlertCircle },
  { value: "none", label: "Normal", icon: Coffee },
]

export function OnsetPicker({
  selectedOnset,
  selectedPhysical,
  onOnsetSelect,
  onPhysicalSelect,
  isNegativeEmotion = false,
}: OnsetPickerProps) {
  return (
    <div className="space-y-6">
      {/* Sección de Onset - Solo para emociones negativas/intensas */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <h4 className="text-sm font-medium text-foreground">¿Desde cuándo te sientes así?</h4>
          <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
        </div>
        <p className="text-xs text-muted-foreground mb-4">
          Esto nos ayuda a entender mejor tu patrón emocional
        </p>
        
        <div className="grid grid-cols-2 gap-2">
          {ONSET_OPTIONS.map((option, index) => (
            <motion.button
              key={option.value}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => onOnsetSelect(option.value)}
              className={cn(
                "flex flex-col items-start p-3 rounded-xl border-2 transition-all text-left",
                selectedOnset === option.value
                  ? "border-primary bg-primary/10"
                  : "border-border hover:border-primary/50 bg-card"
              )}
            >
              <span className="text-sm font-medium text-foreground">{option.label}</span>
              <span className="text-xs text-muted-foreground">{option.sublabel}</span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Sección de Estado Físico */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Coffee className="h-4 w-4 text-muted-foreground" />
          <h4 className="text-sm font-medium text-foreground">¿Cómo está tu cuerpo ahora?</h4>
        </div>
        <p className="text-xs text-muted-foreground mb-4">
          El estado físico puede influir en cómo te sientes emocionalmente
        </p>
        
        <div className="flex flex-wrap gap-2">
          {PHYSICAL_OPTIONS.map((option, index) => {
            const Icon = option.icon
            return (
              <motion.button
                key={option.value}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => onPhysicalSelect(option.value)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 rounded-full border-2 transition-all",
                  selectedPhysical === option.value
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/50 bg-card"
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="text-sm font-medium">{option.label}</span>
              </motion.button>
            )
          })}
        </div>
      </div>

      {/* Nota informativa */}
      {isNegativeEmotion && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800"
        >
          <p className="text-xs text-amber-700 dark:text-amber-300">
            <AlertCircle className="h-3.5 w-3.5 inline mr-1.5" />
            Saber cuándo empezó tu emoción nos ayuda a calcular tu tiempo de recuperación y sugerir mejores herramientas.
          </p>
        </motion.div>
      )}
    </div>
  )
}

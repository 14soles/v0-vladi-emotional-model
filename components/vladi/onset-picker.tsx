"use client"

import { motion } from "framer-motion"
import { Clock, AlertCircle, HelpCircle, Coffee, Moon, Zap, Battery } from "lucide-react"
import { cn } from "@/lib/utils"
import type { OnsetBucket, PhysicalState, PhysicalFlag } from "@/lib/hooks/use-check-in-flow"

interface OnsetPickerProps {
  selectedOnset: OnsetBucket | null
  selectedPhysical: PhysicalState | null
  selectedFlags: PhysicalFlag[]
  onOnsetSelect: (onset: OnsetBucket) => void
  onPhysicalSelect: (state: PhysicalState) => void
  onFlagToggle: (flag: PhysicalFlag) => void
  isNegativeEmotion?: boolean
}

// Mapping EXACTO según documento:
// just_now → 0, 10_30min → 20, 30_60min → 45, 1_3h → 120, 3h_plus → 240
const ONSET_OPTIONS: { value: OnsetBucket; label: string; sublabel: string; minutes: number }[] = [
  { value: "just_now", label: "Ahora mismo", sublabel: "Acaba de empezar", minutes: 0 },
  { value: "10_30_min", label: "Hace un rato", sublabel: "10-30 minutos", minutes: 20 },
  { value: "30_60_min", label: "Hace un tiempo", sublabel: "30-60 minutos", minutes: 45 },
  { value: "1_3_hours", label: "Hace horas", sublabel: "1-3 horas", minutes: 120 },
  { value: "3_plus_hours", label: "Mucho tiempo", sublabel: "Más de 3 horas", minutes: 240 },
]

// Physical state simplificado: low | mid | high
const PHYSICAL_OPTIONS: { value: PhysicalState; label: string; icon: typeof Coffee }[] = [
  { value: "low", label: "Sin energía", icon: Battery },
  { value: "mid", label: "Normal", icon: Coffee },
  { value: "high", label: "Con energía", icon: Zap },
]

// Physical flags adicionales (no bloquean el enum principal)
const PHYSICAL_FLAGS: { value: PhysicalFlag; label: string }[] = [
  { value: "hungry", label: "Hambre" },
  { value: "sick", label: "Enfermo/a" },
]

export function OnsetPicker({
  selectedOnset,
  selectedPhysical,
  selectedFlags,
  onOnsetSelect,
  onPhysicalSelect,
  onFlagToggle,
  isNegativeEmotion = false,
}: OnsetPickerProps) {
  return (
    <div className="space-y-6">
      {/* Sección de Onset */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <h4 className="text-sm font-medium text-foreground">¿Desde cuándo te sientes así?</h4>
          <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
        </div>
        <p className="text-xs text-muted-foreground mb-4">
          Esto nos ayuda a medir tu tiempo de recuperación emocional
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

      {/* Sección de Estado Físico - 3 niveles: low | mid | high */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Coffee className="h-4 w-4 text-muted-foreground" />
          <h4 className="text-sm font-medium text-foreground">¿Cómo está tu nivel de energía?</h4>
        </div>
        
        <div className="flex gap-2 mb-4">
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
                  "flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 transition-all",
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

        {/* Physical flags adicionales */}
        <div className="flex gap-2">
          {PHYSICAL_FLAGS.map((flag) => (
            <button
              key={flag.value}
              onClick={() => onFlagToggle(flag.value)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
                selectedFlags.includes(flag.value)
                  ? "border-amber-500 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
                  : "border-border bg-card text-muted-foreground hover:border-amber-300"
              )}
            >
              {flag.label}
            </button>
          ))}
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
            Saber cuándo empezó tu emoción nos ayuda a calcular tu inercia emocional y sugerir mejores herramientas.
          </p>
        </motion.div>
      )}
    </div>
  )
}

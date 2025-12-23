"use client"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { CONTEXTS, type ContextCategory } from "@/lib/vladi-types"
import { Textarea } from "@/components/ui/textarea"

interface ContextPickerProps {
  selectedContext: ContextCategory | null
  contextText: string
  onContextSelect: (context: ContextCategory) => void
  onTextChange: (text: string) => void
}

export function ContextPicker({ selectedContext, contextText, onContextSelect, onTextChange }: ContextPickerProps) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-medium text-foreground">¿Qué está relacionado con esta emoción?</h3>
        <p className="text-sm text-muted-foreground mt-1">Identificar el contexto te ayuda a entender tus patrones</p>
      </div>

      {/* Context grid */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {CONTEXTS.map((context, index) => (
          <motion.button
            key={context.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => onContextSelect(context.id)}
            className={cn(
              "flex flex-col items-center gap-2 p-3 rounded-xl transition-all",
              "border-2 hover:shadow-md",
              selectedContext === context.id
                ? "border-primary bg-primary/10 shadow-md"
                : "border-transparent bg-card hover:border-primary/30",
            )}
          >
            <span className="text-2xl">{context.icon}</span>
            <span className="text-xs font-medium text-card-foreground">{context.label}</span>
          </motion.button>
        ))}
      </div>

      {/* Optional text */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-muted-foreground">Cuéntanos más (opcional)</label>
        <Textarea
          value={contextText}
          onChange={(e) => onTextChange(e.target.value)}
          placeholder="¿Qué sucedió? Escribir te ayuda a procesar..."
          className="min-h-[80px] resize-none bg-card"
        />
      </div>
    </div>
  )
}

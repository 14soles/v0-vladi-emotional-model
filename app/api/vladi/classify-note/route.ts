import { generateText, Output } from 'ai'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

// ============================================
// SCHEMA COMPLETO para ai_features JSON
// Especificado en el documento DEAM EQ v2
// ============================================

// Schema para la clasificación de notas emocionales
const noteClassificationSchema = z.object({
  // Resumen y clasificación básica
  note_summary: z.string().describe('Resumen de 1 frase neutra y sin juicios de la nota'),
  
  // Triggers estructurados
  trigger_categories: z.array(z.enum([
    'trabajo', 'pareja', 'familia', 'amigos', 'salud', 'dinero', 
    'hogar', 'estudios', 'ocio', 'desconocido'
  ])).describe('Categorías de triggers identificados'),
  detected_topics: z.array(z.string()).describe('Temas específicos detectados: limite, cansancio, conflicto, logro, pérdida, etc.'),
  
  // Patrones cognitivos
  cognitive_patterns: z.array(z.enum([
    'rumiacion', 'catastrofismo', 'generalizacion', 'pensamiento_dicotomico',
    'lectura_mental', 'personalizacion', 'filtro_mental', 'ninguno'
  ])).describe('Patrones cognitivos problemáticos detectados'),
  
  // Necesidades inferidas
  needs: z.array(z.enum([
    'descanso', 'claridad', 'conexion', 'validacion', 'autonomia',
    'seguridad', 'expresion', 'movimiento', 'silencio', 'distraccion'
  ])).describe('Necesidades inferidas de la nota'),
  
  // Evaluación de riesgo
  risk_level: z.enum(['none', 'low', 'medium', 'high']).describe('Nivel de riesgo emocional'),
  
  // Sugerencia de intervención
  suggested_intervention_type: z.enum([
    'breathing', 'grounding', 'reframe', 'gratitude', 'savoring', 'writing', 'movement', 'none'
  ]).describe('Tipo de intervención sugerida'),
  intervention_confidence: z.number().min(0).max(1).describe('Confianza en la sugerencia de intervención (0-1)'),
  
  // XAI - Explicabilidad
  xai_reason_codes: z.array(z.string()).describe('Códigos de razón para explicabilidad: high_arousal, low_pleasantness, rumination_detected, etc.'),
  xai_explanation: z.string().describe('Explicación en lenguaje natural de por qué se sugiere esta intervención'),
  
  // Análisis emocional inferido
  inferred_emotions: z.array(z.object({
    emotion: z.string().describe('Emoción detectada'),
    confidence: z.number().min(0).max(1).describe('Confianza en la detección'),
  })).describe('Emociones adicionales inferidas del texto además de la seleccionada'),
  
  // Contexto temporal
  temporal_context: z.object({
    is_recurring: z.boolean().describe('¿Parece un patrón recurrente?'),
    urgency: z.enum(['none', 'low', 'moderate', 'high']).describe('Urgencia percibida'),
    future_oriented: z.boolean().describe('¿Hay preocupación por el futuro?'),
    past_focused: z.boolean().describe('¿Hay rumiación sobre el pasado?'),
  }).describe('Análisis del contexto temporal de la emoción'),
  
  // Estado físico inferido
  physical_indicators: z.array(z.enum([
    'fatigue', 'tension', 'restlessness', 'hunger', 'pain', 'insomnia', 'none'
  ])).describe('Indicadores físicos mencionados o inferidos'),
  
  // Contexto social
  social_context: z.object({
    involves_others: z.boolean().describe('¿Involucra a otras personas?'),
    relationship_type: z.enum(['romantic', 'family', 'friends', 'work', 'strangers', 'none']).nullable().describe('Tipo de relación involucrada'),
    conflict_present: z.boolean().describe('¿Hay conflicto interpersonal?'),
  }).describe('Contexto social de la situación'),
})

export type NoteClassification = z.infer<typeof noteClassificationSchema>

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return Response.json({ error: 'No autenticado' }, { status: 401 })
  }

  const { note_raw, quadrant, pleasantness, energy, emotion } = await req.json()

  if (!note_raw || note_raw.trim().length < 5) {
    return Response.json({ error: 'Nota demasiado corta para clasificar' }, { status: 400 })
  }

  const contextInfo = `
Contexto emocional:
- Emoción seleccionada: ${emotion || 'no especificada'}
- Cuadrante: ${quadrant || 'no especificado'}
- Pleasantness (0-100): ${pleasantness ?? 'no especificado'}
- Energy (0-100): ${energy ?? 'no especificado'}
`

  try {
    const { output } = await generateText({
      model: 'openai/gpt-4o-mini',
      output: Output.object({
        schema: noteClassificationSchema,
      }),
      messages: [
        {
          role: 'system',
          content: `Eres un asistente especializado en análisis de notas emocionales para VLADI, una app de bienestar emocional basada en el modelo DEAM EQ.
Tu objetivo es clasificar la nota del usuario de forma empática, útil, precisa y sin juicios.

REGLAS PARA LA CLASIFICACIÓN:

1. RESUMEN (note_summary):
   - NEUTRO y en tercera persona ("El usuario expresa...")
   - Máximo 1 frase concisa
   - Sin juicios de valor

2. TRIGGERS (trigger_categories, detected_topics):
   - Solo triggers CLARAMENTE mencionados o fuertemente implícitos
   - detected_topics: usa términos específicos como "deadline", "discusión", "rechazo", "logro", etc.

3. PATRONES COGNITIVOS (cognitive_patterns):
   - Solo marca si hay EVIDENCIA CLARA en el texto
   - rumiacion: pensamientos repetitivos sobre el pasado
   - catastrofismo: anticipar lo peor sin evidencia
   - generalizacion: "siempre", "nunca", "todo", "nada"
   - pensamiento_dicotomico: blanco/negro sin matices
   - lectura_mental: asumir lo que otros piensan
   - personalizacion: culparse de todo
   - filtro_mental: enfocarse solo en lo negativo

4. NECESIDADES (needs):
   - Inferencias CONSERVADORAS basadas en el contexto
   - Prioriza las más evidentes

5. NIVEL DE RIESGO (risk_level):
   - "none": expresión normal de emociones cotidianas
   - "low": malestar moderado pero manejable sin intervención urgente
   - "medium": angustia significativa que se beneficiaría de herramientas
   - "high": indicadores de crisis, autolesión, o riesgo (requiere alerta)

6. INTERVENCIÓN SUGERIDA:
   - breathing: alta activación, necesidad de calma inmediata
   - grounding: desconexión, disociación, ansiedad flotante
   - reframe: patrones cognitivos identificados, perspectiva distorsionada
   - gratitude: bajo ánimo sin ansiedad alta, necesidad de perspectiva positiva
   - savoring: emoción positiva que puede amplificarse
   - writing: necesidad de procesar, claridad, expresión
   - movement: tensión física, energía estancada
   - none: no se requiere intervención o la emoción es positiva estable

7. EXPLICABILIDAD (xai_reason_codes, xai_explanation):
   - Códigos: high_arousal, low_arousal, high_pleasantness, low_pleasantness, 
     rumination_detected, catastrophizing_detected, needs_grounding, 
     physical_tension, social_conflict, etc.
   - La explicación debe ser comprensible para el usuario

8. ANÁLISIS TEMPORAL Y SOCIAL:
   - Identifica si es patrón recurrente
   - Detecta orientación temporal (pasado vs futuro)
   - Analiza contexto social si está presente

IMPORTANTE: 
- Responde SIEMPRE en español
- Sé conservador en las inferencias
- Prioriza la utilidad para el usuario sobre la exhaustividad`,
        },
        {
          role: 'user',
          content: `Analiza esta nota emocional y completa TODOS los campos del schema:

"${note_raw}"

${contextInfo}

Proporciona una clasificación completa y útil.`,
        },
      ],
    })

    if (!output) {
      return Response.json({ error: 'Error al clasificar la nota' }, { status: 500 })
    }

    return Response.json({ 
      classification: output,
      success: true 
    })

  } catch (error) {
    console.error('Error classifying note:', error)
    return Response.json({ 
      error: 'Error interno al procesar la clasificación',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

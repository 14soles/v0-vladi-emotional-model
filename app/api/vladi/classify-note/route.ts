import { generateText, Output } from 'ai'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

// Schema para la clasificación de notas emocionales
const noteClassificationSchema = z.object({
  note_summary: z.string().describe('Resumen de 1 frase neutra y sin juicios de la nota'),
  trigger_categories: z.array(z.enum([
    'trabajo', 'pareja', 'familia', 'amigos', 'salud', 'dinero', 
    'hogar', 'estudios', 'ocio', 'desconocido'
  ])).describe('Categorías de triggers identificados'),
  detected_topics: z.array(z.string()).describe('Temas específicos detectados: limite, cansancio, conflicto, logro, pérdida, etc.'),
  cognitive_patterns: z.array(z.enum([
    'rumiacion', 'catastrofismo', 'generalizacion', 'pensamiento_dicotomico',
    'lectura_mental', 'personalizacion', 'filtro_mental', 'ninguno'
  ])).describe('Patrones cognitivos problemáticos detectados'),
  needs: z.array(z.enum([
    'descanso', 'claridad', 'conexion', 'validacion', 'autonomia',
    'seguridad', 'expresion', 'movimiento', 'silencio', 'distraccion'
  ])).describe('Necesidades inferidas de la nota'),
  risk_level: z.enum(['none', 'low', 'medium', 'high']).describe('Nivel de riesgo emocional'),
  suggested_intervention_type: z.enum([
    'breathing', 'grounding', 'reframe', 'gratitude', 'savoring', 'writing', 'movement', 'none'
  ]).describe('Tipo de intervención sugerida'),
  xai_reason_codes: z.array(z.string()).describe('Códigos de razón para explicabilidad: high_arousal, low_pleasantness, etc.'),
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
          content: `Eres un asistente especializado en análisis de notas emocionales para una app de bienestar emocional.
Tu objetivo es clasificar la nota del usuario de forma empática, útil y sin juicios.

REGLAS:
1. El resumen debe ser NEUTRO y en tercera persona ("El usuario expresa...")
2. Detecta triggers de forma conservadora - solo los claramente mencionados
3. Los patrones cognitivos solo se marcan si hay evidencia clara en el texto
4. Las necesidades son inferencias - sé conservador
5. El nivel de riesgo: 
   - "none": expresión normal de emociones
   - "low": malestar moderado pero manejable
   - "medium": angustia significativa que necesita atención
   - "high": indicadores de crisis o riesgo (requiere intervención profesional)
6. La intervención sugerida debe ser apropiada para el contexto emocional dado
7. xai_reason_codes explica POR QUÉ sugieres esa intervención

IMPORTANTE: Responde SIEMPRE en español.`,
        },
        {
          role: 'user',
          content: `Analiza esta nota emocional:

"${note_raw}"

${contextInfo}

Clasifica la nota según el schema proporcionado.`,
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

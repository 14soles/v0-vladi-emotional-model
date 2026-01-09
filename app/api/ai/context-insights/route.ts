import { generateText } from "ai"

export const runtime = "edge"
export const dynamic = "force-dynamic"

export async function POST(req: Request) {
  try {
    const { patterns } = await req.json()

    if (!patterns || patterns.length === 0) {
      return Response.json({
        insight: "Continúa registrando tus emociones para identificar patrones y disparadores.",
      })
    }

    const patternsText = patterns
      .map(
        (p: any) =>
          `- ${p.label}: aparece en ${p.percentage}% de registros (${p.type === "negative" ? "aumenta tensión" : "promueve bienestar"})`,
      )
      .join("\n")

    const { text } = await generateText({
      model: "google/gemini-2.5-flash-image",
      prompt: `Eres un asistente de inteligencia emocional que analiza patrones de contexto emocional.

El usuario tiene estos patrones identificados en sus registros emocionales:
${patternsText}

Genera un insight breve (máximo 2 frases, 30 palabras) en español que:
1. Identifique qué contextos aparecen más frecuentemente cuando sube su intensidad emocional o aumenta su inercia
2. Sea específico y directo, sin introducción
3. Use un tono empático pero conciso

Ejemplo: "El trabajo y las tareas pendientes aparecen con más frecuencia cuando aumenta tu tensión emocional. El tiempo al aire libre y la actividad física suelen promover tu bienestar."

No uses emojis. Sé breve y directo.`,
    })

    return Response.json({ insight: text.trim() })
  } catch (error) {
    console.error("[v0] Error generating context insights:", error)
    return Response.json(
      {
        insight: "Estos factores aparecen con más frecuencia cuando sube tu intensidad o aumenta tu inercia.",
      },
      { status: 500 },
    )
  }
}

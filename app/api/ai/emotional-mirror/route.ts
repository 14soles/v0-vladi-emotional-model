import { generateText } from "ai"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { emotion, intensity, wellbeing, context } = body

    const prompt = `Eres Vladi, una IA especializada en inteligencia emocional. Un usuario acaba de registrar su estado emocional:
    
Emoción: ${emotion}
Intensidad: ${intensity}/100
Bienestar: ${wellbeing}/100
${context.notes ? `Comentario: ${context.notes}` : ""}
${context.activityTags?.length ? `Actividad: ${context.activityTags.join(", ")}` : ""}
${context.companyTags?.length ? `Con: ${context.companyTags.join(", ")}` : ""}
${context.bodyLocation ? `Sensación corporal: ${context.bodyLocation}` : ""}
${context.certaintyBucket ? `Certeza: ${context.certaintyBucket}` : ""}

Genera un breve texto de validación emocional (máximo 2-3 líneas) que:
1. Valide lo que está sintiendo de manera empática
2. Refleje su experiencia emocional
3. Sea cálido y personalizado
4. Use un lenguaje natural y cercano

No uses frases genéricas. Sé específico basándote en los datos proporcionados.`

    const { text } = await generateText({
      model: "google/gemini-2.5-flash-image",
      prompt,
      maxOutputTokens: 150,
      temperature: 0.8,
    })

    return NextResponse.json({ text })
  } catch (error) {
    console.error("[v0] Error generating emotional mirror:", error)
    return NextResponse.json({ error: "Error al generar el espejo emocional" }, { status: 500 })
  }
}

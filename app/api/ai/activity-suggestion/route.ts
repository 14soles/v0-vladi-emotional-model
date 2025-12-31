import { generateText } from "ai"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { emotion, intensity, wellbeing, emotionFamily } = body

    const prompt = `Eres Vladi, una IA de inteligencia emocional. Basándote en:
    
Emoción: ${emotion}
Intensidad: ${intensity}/100
Bienestar: ${wellbeing}/100
Familia emocional: ${emotionFamily}

Sugiere UNA actividad específica y práctica (máximo 1 línea) que pueda ayudar a esta persona en este momento. La actividad debe ser:
- Concreta y accionable
- Apropiada para el estado emocional
- Realista de hacer hoy

Formato: Solo el nombre de la actividad, sin explicaciones adicionales.
Ejemplo: "Dar un paseo de 10 minutos al aire libre"`

    const { text } = await generateText({
      model: "google/gemini-2.5-flash-image",
      prompt,
      maxOutputTokens: 50,
      temperature: 0.7,
    })

    return NextResponse.json({ text: text.trim() })
  } catch (error) {
    console.error("[v0] Error generating activity suggestion:", error)
    return NextResponse.json({ error: "Error al generar sugerencia de actividad" }, { status: 500 })
  }
}

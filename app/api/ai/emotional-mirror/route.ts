import { generateText } from "ai"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { emotion, intensity, wellbeing, context } = body

    const prompt = `Eres Vladi, una IA especializada en inteligencia emocional y bienestar. Un usuario acaba de registrar su estado emocional:
    
Emoción: ${emotion}
Intensidad: ${intensity}/100
Bienestar: ${wellbeing}/100
${context.notes ? `Comentario: ${context.notes}` : ""}
${context.activityTags?.length ? `Actividad: ${context.activityTags.join(", ")}` : ""}
${context.companyTags?.length ? `Con: ${context.companyTags.join(", ")}` : ""}
${context.bodyLocation ? `Sensación corporal: ${context.bodyLocation}` : ""}
${context.whenOccurred ? `Cuándo: ${context.whenOccurred}` : ""}
${context.certaintyBucket ? `Certeza: ${context.certaintyBucket}` : ""}

Genera una respuesta en formato JSON con dos campos:

1. "validation": Un texto de validación emocional (3-4 líneas) que:
   - Valide y nombre lo que está sintiendo de manera empática y específica
   - Refleje su experiencia emocional conectando con el contexto (actividad, compañía, sensación corporal)
   - Sea cálido, cercano y personalizado
   - Haga que el usuario se sienta verdaderamente comprendido y escuchado
   - NO uses frases genéricas como "es normal sentirse así"

2. "tip": Un consejo práctico y breve (1-2 líneas) para mejorar su inteligencia emocional que:
   - Sea específico y relevante para la emoción registrada
   - Ofrezca una acción concreta o reflexión que pueda aplicar
   - Esté relacionado con el contexto cuando sea posible
   - Ayude a desarrollar autoconciencia o regulación emocional

Responde SOLO con el JSON válido, sin texto adicional ni markdown:
{"validation": "...", "tip": "..."}`

    const { text } = await generateText({
      model: "google/gemini-2.5-flash-preview-05-20",
      prompt,
      maxOutputTokens: 300,
      temperature: 0.7,
    })

    // Parse the JSON response
    try {
      const cleanedText = text.replace(/```json\n?|\n?```/g, "").trim()
      const parsed = JSON.parse(cleanedText)
      return NextResponse.json({ 
        text: parsed.validation,
        tip: parsed.tip,
      })
    } catch {
      // Fallback if JSON parsing fails
      return NextResponse.json({ 
        text: text,
        tip: "Reconocer y nombrar tus emociones es el primer paso hacia una mayor inteligencia emocional.",
      })
    }
  } catch (error) {
    console.error("[VLADI] Error generating emotional mirror:", error)
    return NextResponse.json({ 
      text: "Gracias por compartir cómo te sientes. Tu registro me ayuda a comprenderte mejor.",
      tip: "Tómate un momento para respirar profundamente y conectar con tu cuerpo.",
    }, { status: 200 })
  }
}

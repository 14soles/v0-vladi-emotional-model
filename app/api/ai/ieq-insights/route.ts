import { generateText } from "ai"
import { NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

interface IEQInsightsRequest {
  emotionalState: {
    category: string
    description: string
  } | null
  deamScore: number
  deamTrend: number
  checkIns: number
  averageIntensity: number
  averageWellbeing: number
  granularityScore: number
  granularityTrend: number
  emotionalAwareness: {
    ceScore: number
    subscores: {
      CC: number
      CB: number
      CT: number
      MC: number
    }
  }
  period: string
  topEmotions: Array<{ emotion: string; count: number }>
}

export async function POST(request: Request) {
  try {
    const data: IEQInsightsRequest = await request.json()

    console.log("[v0] IEQ Insights API - Received data:", {
      emotionalState: data.emotionalState,
      deamScore: data.deamScore,
      checkIns: data.checkIns,
    })

    const { text } = await generateText({
      model: "google/gemini-2.5-flash-image",
      temperature: 0.7,
      maxTokens: 1000,
      prompt: `Eres Vladi, un asistente de inteligencia emocional empático y preciso. Analiza estos datos emocionales del usuario y genera insights breves y personalizados.

DATOS DEL PERIODO (${data.period}):
- Estado emocional: ${data.emotionalState?.category || "Sin datos"} (${data.emotionalState?.description || ""})
- DEAM Score: ${data.deamScore}/100 (tendencia: ${data.deamTrend > 0 ? "+" : ""}${data.deamTrend}%)
- Check-ins: ${data.checkIns} emociones registradas
- Intensidad media (energía): ${data.averageIntensity}/100
- Bienestar medio: ${data.averageWellbeing}/100
- Granularidad: ${data.granularityScore}% (tendencia: ${data.granularityTrend > 0 ? "+" : ""}${data.granularityTrend}%)
- Conciencia emocional total: ${data.emotionalAwareness.ceScore}/100
  * Contexto (CC): ${data.emotionalAwareness.subscores.CC}
  * Cuerpo (CB): ${data.emotionalAwareness.subscores.CB}
  * Tiempo (CT): ${data.emotionalAwareness.subscores.CT}
  * Seguridad (MC): ${data.emotionalAwareness.subscores.MC}
- Top 3 emociones: ${data.topEmotions
        .slice(0, 3)
        .map((e) => `${e.emotion} (${e.count})`)
        .join(", ")}

IMPORTANTE: Responde ÚNICAMENTE con un objeto JSON válido, sin texto adicional antes o después.

Genera 5 insights personalizados siguiendo estas pautas:

1. emotionalState (máx 15 palabras): Describe cómo se ha sentido mayormente en este periodo
2. intensityWellbeing (máx 15 palabras): Comenta sobre patrones de energía y bienestar
3. granularity (máx 15 palabras): Feedback sobre capacidad de diferenciar emociones
4. emotionalAwareness (máx 15 palabras): Análisis de los subscores y sugerencia específica
5. emotionalSummary (máx 50 palabras): Resumen general que integre TODOS los datos del panel. Valida las emociones del usuario, destaca progresos en inteligencia emocional, y ofrece una visión comprensiva y empática de su situación emocional actual.

Formato de respuesta (SOLO JSON, sin markdown):
{
  "emotionalState": "texto aquí",
  "intensityWellbeing": "texto aquí",
  "granularity": "texto aquí",
  "emotionalAwareness": "texto aquí",
  "emotionalSummary": "texto aquí"
}`,
    })

    console.log("[v0] IEQ Insights API - Raw AI response:", text)

    // Try to extract JSON if it's wrapped in markdown
    let cleanedText = text.trim()
    if (cleanedText.startsWith("```json")) {
      cleanedText = cleanedText
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim()
    } else if (cleanedText.startsWith("```")) {
      cleanedText = cleanedText.replace(/```\n?/g, "").trim()
    }

    let insights
    try {
      insights = JSON.parse(cleanedText)
      console.log("[v0] IEQ Insights API - Parsed insights:", insights)
    } catch (parseError) {
      console.error("[v0] IEQ Insights API - Failed to parse JSON:", parseError)
      console.error("[v0] IEQ Insights API - Cleaned text was:", cleanedText)

      // Fallback with personalized insights based on data
      insights = {
        emotionalState: data.emotionalState?.description || "Aún no hay suficientes registros para analizar.",
        intensityWellbeing: `Tu energía media es ${data.averageIntensity}% y bienestar ${data.averageWellbeing}%. ${data.averageWellbeing > 60 ? "Mantienen buen equilibrio" : "Hay espacio para mejorar"}.`,
        granularity: `Tu granularidad es ${data.granularityScore}%. ${data.granularityScore > 60 ? "Diferencias bien tus emociones" : "Puedes ser más específico con lo que sientes"}.`,
        emotionalAwareness: `Conciencia emocional: ${data.emotionalAwareness.ceScore}/100. ${data.emotionalAwareness.subscores.CB < 50 ? "Intenta notar más las sensaciones corporales" : "Registras bien el contexto emocional"}.`,
        emotionalSummary: `Has registrado ${data.checkIns} emociones este periodo, mostrando compromiso con tu autoconocimiento. Tu DEAM score de ${data.deamScore}/100 refleja tu nivel de inteligencia emocional. Continúa identificando y validando tus emociones para seguir creciendo en tu gestión emocional.`,
      }
    }

    return NextResponse.json({ insights })
  } catch (error: unknown) {
    console.error("[v0] IEQ Insights API - Error:", error)
    return NextResponse.json(
      {
        error: "Failed to generate insights",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

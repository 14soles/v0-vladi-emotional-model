import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { generateText } from "ai"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(req: NextRequest) {
  try {
    const { userId, sessionId, conversationText, sessionStartTime } = await req.json()

    if (!userId || !sessionId || !conversationText) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const summaryPrompt = `Eres Vladi, un asistente de inteligencia emocional. Analiza esta conversación y genera un resumen estructurado en formato JSON.

Conversación:
${conversationText}

Genera un objeto JSON con:
{
  "mode": "EMOCIONAL" | "DATOS" | "ACCION" | "REVISION" | "ALERTA",
  "primary_emotion": "emoción principal detectada",
  "topic": "tema principal en 5-10 palabras",
  "key_insights": ["insight 1", "insight 2", "insight 3"],
  "summary": "Resumen en 2-3 frases de la conversación"
}

Responde SOLO con el JSON, sin texto adicional.`

    const { text: summaryJson } = await generateText({
      model: "google/gemini-2.5-flash-lite",
      prompt: summaryPrompt,
      maxTokens: 500,
    })

    let summaryData
    try {
      summaryData = JSON.parse(summaryJson)
    } catch {
      summaryData = {
        mode: "EMOCIONAL",
        primary_emotion: "mixta",
        topic: "Conversación sobre emociones",
        key_insights: ["El usuario compartió sus emociones"],
        summary: "Conversación sobre el estado emocional del usuario.",
      }
    }

    const { error: insertError } = await supabase.from("vladi_session_summaries").insert({
      user_id: userId,
      session_id: sessionId,
      created_at: sessionStartTime,
      mode: summaryData.mode || "EMOCIONAL",
      primary_emotion: summaryData.primary_emotion || null,
      topic: summaryData.topic || "Conversación general",
      key_insights: summaryData.key_insights || [],
      hypotheses: [],
      used_snapshot: false,
      used_metrics_7d: false,
      used_metrics_30d: false,
      used_memory: false,
    })

    if (insertError) {
      console.error("[v0] Error saving session summary:", insertError)
      throw insertError
    }

    return NextResponse.json({
      success: true,
      summary: summaryData.summary,
    })
  } catch (error: any) {
    console.error("[v0] Error in end-session:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}

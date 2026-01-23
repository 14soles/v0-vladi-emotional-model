import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { generateText } from "ai"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(req: NextRequest) {
  try {
    const { userId, sessionId, messages, sessionStartTime } = await req.json()

    if (!userId || !sessionId || !messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const messagesToSave = messages
      .filter((msg: any) => {
        const content = typeof msg.content === "string" ? msg.content : msg.content?.text || ""
        return content !== "__INIT__"
      })
      .map((msg: any) => ({
        user_id: userId,
        session_id: sessionId,
        role: msg.role,
        content: typeof msg.content === "string" ? msg.content : msg.content?.text || "",
        created_at: msg.createdAt || new Date().toISOString(),
      }))

    if (messagesToSave.length > 0) {
      const { error: messagesError } = await supabase.from("vladi_conversation_messages").insert(messagesToSave)

      // Silently handle error - messages save is non-critical
    }

    const conversationText = messages
      .filter((msg: any) => {
        const content = typeof msg.content === "string" ? msg.content : msg.content?.text || ""
        return content !== "__INIT__"
      })
      .map((msg: any) => {
        const content = typeof msg.content === "string" ? msg.content : msg.content?.text || ""
        return `${msg.role === "user" ? "Usuario" : "Vladi"}: ${content}`
      })
      .join("\n\n")

    const summaryPrompt = `Eres Vladi, un asistente de inteligencia emocional. Acabas de terminar una conversación con un usuario y necesitas crear un resumen breve y significativo.

Conversación completa:
${conversationText}

Tu tarea es generar un resumen conciso en segunda persona (dirigido al usuario) que capture la esencia de lo que se habló.

Requisitos del resumen:
- Exactamente 2 frases cortas (máximo 150 caracteres en total)
- En segunda persona: "Te has sentido...", "Hablamos sobre...", "Compartiste que..."
- Específico sobre el tema/emoción discutida, no genérico
- Empático y validador, sin juicios
- NO uses frases genéricas como "compartiste tus emociones" o "hablamos de tu día"
- Sé concreto sobre QUÉ emoción, QUÉ situación, o QUÉ tema se trató

Ejemplos buenos:
"Te has sentido cansado porque gastaste energía en tareas que no consideras importantes. Hablamos sobre cómo priorizar mejor tu tiempo y energía."
"Expresaste frustración por la falta de comunicación en tu equipo. Exploramos formas de abordar conversaciones difíciles con asertividad."

Genera un objeto JSON con SOLO estos campos:
{
  "summary": "tu resumen de exactamente 2 frases aquí",
  "primary_emotion": "emoción principal en español",
  "topic": "título del tema (máximo 6 palabras)"
}

Responde ÚNICAMENTE con el JSON, sin texto adicional ni explicaciones.`

    let summaryData
    try {
      const { text: summaryJson } = await generateText({
        model: "google/gemini-2.5-flash-lite",
        prompt: summaryPrompt,
        maxTokens: 400,
        temperature: 0.7,
      })

      const parsed = JSON.parse(
        summaryJson
          .replace(/```json\n?/g, "")
          .replace(/```\n?/g, "")
          .trim(),
      )

      summaryData = {
        mode: "EMOCIONAL",
        primary_emotion: parsed.primary_emotion || "mixta",
        topic: parsed.topic || "Conversación con Vladi",
        summary: parsed.summary || "Conversación sobre emociones.",
        key_insights: [parsed.summary || "Conversación guardada"],
      }
    } catch {
      // Fallback summary if AI parsing fails
      const userMessages = messages.filter((msg: any) => msg.role === "user")
      const firstUserMessage =
        userMessages.length > 0
          ? typeof userMessages[0].content === "string"
            ? userMessages[0].content
            : userMessages[0].content?.text || ""
          : ""

      summaryData = {
        mode: "EMOCIONAL",
        primary_emotion: "mixta",
        topic: "Conversación con Vladi",
        summary: firstUserMessage
          ? `Hablamos sobre lo que compartiste: "${firstUserMessage.slice(0, 100)}..."`
          : "Tuvimos una conversación sobre tu estado emocional actual.",
        key_insights: [
          firstUserMessage
            ? `Hablamos sobre lo que compartiste: "${firstUserMessage.slice(0, 100)}..."`
            : "Tuvimos una conversación sobre tu estado emocional actual.",
        ],
      }
    }

    const { error: insertError } = await supabase.from("vladi_session_summaries").insert({
      user_id: userId,
      session_id: sessionId,
      created_at: sessionStartTime,
      mode: summaryData.mode,
      primary_emotion: summaryData.primary_emotion,
      topic: summaryData.topic,
      key_insights: summaryData.key_insights,
      hypotheses: [],
      used_snapshot: false,
      used_metrics_7d: false,
      used_metrics_30d: false,
      used_memory: false,
    })

    if (insertError) {
      throw insertError
    }

    return NextResponse.json({
      success: true,
      summary: summaryData.summary,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

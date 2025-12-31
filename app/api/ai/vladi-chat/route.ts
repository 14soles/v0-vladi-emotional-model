import { streamText, convertToCoreMessages } from "ai"
import { createClient } from "@supabase/supabase-js"

export const maxDuration = 60

// Simplified system prompt without tool-calling complexity
const SYSTEM_PROMPT = `Eres VLADI, un asistente de inteligencia emocional basado en datos dentro de una app. Tu función es ayudar al usuario a:
1) Entender sus registros emocionales y patrones
2) Validar lo que siente sin juzgar
3) Proponer actividades seguras y prácticas
4) Ofrecer perspectivas basadas en sus datos

REGLAS IMPORTANTES:
- NO eres psicólogo/terapeuta. NO diagnosticas. NO prescribes medicación.
- Si detectas crisis (autolesión, suicidio, violencia): recomienda ayuda profesional inmediata:
  * 112 para emergencias
  * 024 para atención a la conducta suicida (línea gratuita 24/7 en España)
- Nunca inventes datos. Solo usa información que el usuario haya compartido o que esté en el contexto.
- Sé empático, directo y claro. Evita jerga clínica.
- Haz preguntas cortas y ofrece acciones concretas.

ESTILO:
- Responde en español de forma natural y cercana
- Valida las emociones del usuario
- Ofrece perspectivas útiles basadas en patrones
- Sugiere actividades concretas cuando sea apropiado
- Mantén las respuestas enfocadas y prácticas`

function classifyMode(message: string): string {
  const lower = message.toLowerCase()

  if (/suicid|matarme|acabar con|autolesión|hacerme daño|no quiero vivir|quiero morir/i.test(message)) {
    return "ALERTA"
  }

  if (/métrica|estadística|panel|tendencia|datos|gráfico|progreso|resumen/i.test(message)) {
    return "DATOS"
  }

  if (/qué hago|recomienda|ejercicio|actividad|herramienta|ayuda práctica/i.test(message)) {
    return "ACCION"
  }

  if (/semana|semanal|mes|mensual|últimos días/i.test(message)) {
    return "REVISION"
  }

  return "EMOCIONAL"
}

export async function POST(req: Request) {
  try {
    const { messages, userId, emotionalContext } = await req.json()

    if (!userId) {
      return new Response(JSON.stringify({ error: "Usuario no autenticado" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      })
    }

    // Using service role key for server-side Supabase access
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    const extractMessageText = (msg: any): string => {
      if (typeof msg.content === "string") return msg.content
      if (Array.isArray(msg.parts)) return msg.parts.map((p: any) => (p.type === "text" ? p.text : "")).join(" ")
      if (msg.content?.text) return msg.content.text
      return ""
    }

    const userMessages = messages.filter((m: any) => m.role === "user")
    const lastUserMsg = userMessages[userMessages.length - 1]
    const messageText = lastUserMsg ? extractMessageText(lastUserMsg) : ""
    const isInitialGreeting = messageText === "__INIT__"

    const mode = messageText && !isInitialGreeting ? classifyMode(messageText) : "EMOCIONAL"

    // Building context string with available user data
    let contextString = `\n\nCONTEXTO DEL USUARIO:\n\n`

    if (emotionalContext) {
      contextString += `EMOCIÓN ACTUAL (recién registrada):\n`
      contextString += `- Emoción: ${emotionalContext.emotion}\n`
      contextString += `- Energía: ${emotionalContext.intensity}/100\n`
      contextString += `- Bienestar: ${emotionalContext.wellbeing}/100\n`
      if (emotionalContext.notes) contextString += `- Notas: ${emotionalContext.notes}\n`
      contextString += `\n`
    }

    // Fetch recent emotions from database
    const { data: recentEmotions } = await supabase
      .from("emotion_entries")
      .select("emotion, intensity, wellbeing, context, activity_tags, company_tags, created_at")
      .eq("user_id", userId)
      .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .order("created_at", { ascending: false })
      .limit(10)

    if (recentEmotions && recentEmotions.length > 0) {
      contextString += `EMOCIONES RECIENTES (últimos 7 días):\n`
      recentEmotions.slice(0, 5).forEach((e: any, i: number) => {
        const date = new Date(e.created_at).toLocaleDateString("es-ES", { month: "short", day: "numeric" })
        contextString += `${i + 1}. ${e.emotion} - Energía: ${e.intensity}, Bienestar: ${e.wellbeing} (${date})\n`
        if (e.context) contextString += `   Contexto: ${e.context}\n`
      })
      contextString += `\n`
    } else {
      contextString += `(No hay emociones registradas en los últimos 7 días)\n\n`
    }

    contextString += `MODO DE CONVERSACIÓN: ${mode}\n`

    if (isInitialGreeting) {
      contextString += `\nINSTRUCCIÓN ESPECIAL: Este es el inicio de la conversación. Genera un saludo personalizado y natural basándote en los datos del usuario. Menciona algún patrón interesante que hayas notado en sus emociones recientes, o pregunta sobre su emoción actual si acaba de registrarla. Sé cálido y empático, e invita a compartir más. Máximo 2-3 frases.\n`
    }

    const fullSystemPrompt = `${SYSTEM_PROMPT}${contextString}`

    // Convert messages to core format and call AI without tools
    const coreMessages = convertToCoreMessages(messages)

    const result = streamText({
      model: "google/gemini-2.5-flash-lite",
      system: fullSystemPrompt,
      messages: coreMessages,
      temperature: 0.7,
      maxTokens: 1000,
    })

    return result.toUIMessageStreamResponse()
  } catch (error: any) {
    console.error("[v0] Error in Vladi chat:", error)
    return new Response(JSON.stringify({ error: "Error al procesar el chat", details: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}

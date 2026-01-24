import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

// Use service role for reliable session ending
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      session_id,
      user_id,
      screens_visited,
      emotions_registered,
      chat_interactions,
      interventions_completed,
    } = body

    if (!session_id || !user_id) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Get session start time
    const { data: session } = await supabase
      .from("app_sessions")
      .select("started_at")
      .eq("id", session_id)
      .single()

    const duration = session
      ? Math.floor((Date.now() - new Date(session.started_at).getTime()) / 1000)
      : null

    // Update session
    await supabase
      .from("app_sessions")
      .update({
        ended_at: new Date().toISOString(),
        duration_seconds: duration,
        screens_visited: screens_visited || [],
        emotions_registered: emotions_registered || 0,
        chat_interactions: chat_interactions || 0,
        interventions_completed: interventions_completed || 0,
      })
      .eq("id", session_id)

    // Log app_close event
    await supabase.from("user_events").insert({
      user_id,
      session_id,
      event_type: "app_close",
      event_data: { duration_seconds: duration },
      timestamp: new Date().toISOString(),
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

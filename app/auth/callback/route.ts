import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const next = searchParams.get("next") ?? "/app"

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // Check if user has a profile, if not redirect to onboarding
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("id")
          .eq("id", user.id)
          .maybeSingle()
        
        if (!profile) {
          // User needs to complete onboarding
          return NextResponse.redirect(`${origin}/app/onboarding`)
        }
      }
      
      // Redirect to the app (or next URL if provided)
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Return to login page if something went wrong
  return NextResponse.redirect(`${origin}/auth/login?error=auth_callback_error`)
}

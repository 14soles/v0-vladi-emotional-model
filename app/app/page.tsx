import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import VladiApp from "@/components/vladi/vladi-app"

export default async function AppPage() {
  try {
    const supabase = await createClient()

    let user = null
    let userError = null

    try {
      const result = await supabase.auth.getUser()
      user = result.data?.user || null
      userError = result.error
    } catch (e) {
      console.error("[v0] Auth error:", e)
      userError = e as Error
    }

    if (userError || !user) {
      redirect("/auth/login")
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle()

    if (profileError) {
      console.error("[v0] Profile error:", profileError)
    }

    if (!profile) {
      redirect("/app/onboarding")
    }

    const userProfile = {
      id: profile.id,
      username: profile.username,
      email: profile.email,
      phone: profile.phone || "",
      display_name: profile.display_name || profile.username,
      avatar_url: profile.avatar_url || undefined,
    }

    return <VladiApp userId={user.id} userProfile={userProfile} />
  } catch (error) {
    console.error("[v0] Page error:", error)
    // If there's an error, redirect to login instead of crashing
    redirect("/auth/login")
  }
}

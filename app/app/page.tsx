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

    // Profile error is non-critical, user will be redirected to onboarding if needed

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
  } catch {
    // If there's an error, redirect to login instead of crashing
    redirect("/auth/login")
  }
}

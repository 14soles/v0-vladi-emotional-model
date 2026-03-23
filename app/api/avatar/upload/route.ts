import { put, del } from "@vercel/blob"
import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File
    const userId = formData.get("userId") as string

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    if (!userId) {
      return NextResponse.json({ error: "No user ID provided" }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"]
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Tipo de archivo no permitido. Usa JPG, PNG, WebP o GIF." },
        { status: 400 }
      )
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "El archivo es demasiado grande. Maximo 5MB." },
        { status: 400 }
      )
    }

    // Get current avatar to delete later
    const { data: currentProfile } = await supabaseAdmin
      .from("profiles")
      .select("avatar_url")
      .eq("id", userId)
      .single()

    // Generate unique filename
    const ext = file.name.split(".").pop() || "jpg"
    const filename = `avatars/${userId}-${Date.now()}.${ext}`

    // Upload to Vercel Blob (public access for avatars)
    const blob = await put(filename, file, {
      access: "public",
    })

    // Update user profile with new avatar URL
    const { error: updateError } = await supabaseAdmin
      .from("profiles")
      .update({
        avatar_url: blob.url,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)

    if (updateError) {
      // If profile update fails, delete the uploaded blob
      await del(blob.url)
      throw updateError
    }

    // Delete old avatar if it exists and is a Vercel Blob URL
    if (currentProfile?.avatar_url?.includes("blob.vercel-storage.com")) {
      try {
        await del(currentProfile.avatar_url)
      } catch {
        // Ignore deletion errors for old avatar
      }
    }

    return NextResponse.json({ url: blob.url })
  } catch (error) {
    console.error("Avatar upload error:", error)
    return NextResponse.json({ error: "Error al subir la imagen" }, { status: 500 })
  }
}

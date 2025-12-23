"use client"

import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase/client"
import { useEffect, useState } from "react"

export default function LandingPage() {
  const router = useRouter()
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        router.push("/app")
      } else {
        setIsChecking(false)
      }
    }
    checkAuth()
  }, [router])

  if (isChecking) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{
          backgroundImage: "url('/images/portada4.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-between px-8 py-16 pt-safe pb-safe relative overflow-hidden"
      style={{
        backgroundImage: "url('/images/portada4.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="flex-1 flex flex-col items-center justify-center text-center w-full max-w-lg space-y-3">
        <h1 className="font-sans text-8xl md:text-9xl font-normal tracking-tight text-white">Vladi</h1>
        <p className="text-white text-xl font-light tracking-wide">Conecta con tus emociones.</p>
      </div>

      <div className="w-full max-w-lg space-y-4 mb-6">
        <Button
          asChild
          className="w-full h-16 rounded-full bg-white hover:bg-gray-50 text-black text-lg font-normal shadow-none active:scale-[0.98] transition-transform"
        >
          <Link href="/auth/login">Iniciar Sesión</Link>
        </Button>
        <Button
          asChild
          variant="outline"
          className="w-full h-16 rounded-full bg-transparent border-2 border-white hover:bg-white/10 text-white text-lg font-normal shadow-none active:scale-[0.98] transition-transform"
        >
          <Link href="/auth/sign-up">Registrarse</Link>
        </Button>
      </div>

      <div className="w-full max-w-lg">
        <p className="text-white text-xs text-center font-light">
          Si estás en crisis, contacta con un profesional{" "}
          <a href="#" className="font-semibold underline underline-offset-2">
            aquí
          </a>
          .
        </p>
      </div>
    </div>
  )
}

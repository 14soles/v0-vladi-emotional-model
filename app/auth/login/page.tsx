"use client"

import type React from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { ArrowRight, ChevronLeft, Eye, EyeOff } from "lucide-react"

export default function LoginPage() {
  const [method, setMethod] = useState<"email" | "phone">("email")
  const [step, setStep] = useState(1) // 1: method selection, 2: password/code
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [countryCode, setCountryCode] = useState("+34")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const supabase = createClient()

  const handleMethodStep = () => {
    if (method === "email" && (!email.trim() || !email.includes("@"))) {
      setError("Por favor introduce un email válido")
      return
    }
    if (method === "phone" && !phone.trim()) {
      setError("Por favor introduce tu teléfono")
      return
    }
    setError(null)
    setStep(2)
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      if (method === "email") {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          phone: `${countryCode}${phone}`,
          password,
        })
        if (error) throw error
      }
      router.push("/app")
      router.refresh()
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Error al iniciar sesión"
      if (message.includes("Invalid login credentials")) {
        setError("Credenciales incorrectas")
      } else {
        setError(message)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setIsLoading(true)
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${window.location.origin}/app`,
        },
      })
      if (error) throw error
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Error con Google")
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-between px-6 py-8">
      <div className="w-full max-w-sm">
        <button
          onClick={() => (step === 2 ? setStep(1) : router.push("/"))}
          className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-100 active:scale-95 transition-all"
        >
          <ChevronLeft className="w-6 h-6 text-gray-800" />
        </button>
      </div>

      <div className="w-full max-w-sm flex flex-col items-center flex-1 justify-center">
        <div className="mb-8 relative w-full">
          <img
            src="/images/emociones-app-conlogo.png"
            alt="Vladi Mascots"
            className="w-full h-auto object-contain"
            style={{ maxHeight: "200px" }}
          />
        </div>

        <div className="w-full space-y-6">
          {step === 1 && (
            <>
              <div className="flex gap-2 p-1 bg-gray-100 rounded-full">
                <button
                  onClick={() => setMethod("email")}
                  className={`flex-1 py-3 text-base rounded-full transition-all active:scale-95 font-normal ${
                    method === "email" ? "bg-white text-black shadow-sm" : "text-gray-500"
                  }`}
                >
                  Email
                </button>
                <button
                  onClick={() => setMethod("phone")}
                  className={`flex-1 py-3 text-base rounded-full transition-all active:scale-95 font-normal ${
                    method === "phone" ? "bg-white text-black shadow-sm" : "text-gray-500"
                  }`}
                >
                  Teléfono
                </button>
              </div>

              <div className="relative">
                {method === "email" ? (
                  <input
                    type="email"
                    placeholder="email@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full h-14 px-6 pr-16 text-base rounded-full border border-gray-300 focus:outline-none focus:border-gray-400 placeholder:text-gray-300"
                    autoFocus
                  />
                ) : (
                  <div className="flex w-full h-14 border border-gray-300 rounded-full overflow-hidden">
                    <select
                      value={countryCode}
                      onChange={(e) => setCountryCode(e.target.value)}
                      className="pl-4 pr-2 text-base focus:outline-none border-r border-gray-300"
                    >
                      <option value="+34">+34</option>
                      <option value="+1">+1</option>
                      <option value="+44">+44</option>
                      <option value="+33">+33</option>
                    </select>
                    <input
                      type="tel"
                      placeholder="659080825"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                      className="flex-1 px-4 text-base focus:outline-none placeholder:text-gray-300"
                      autoFocus
                    />
                  </div>
                )}
                {((method === "email" && email) || (method === "phone" && phone)) && (
                  <button
                    onClick={handleMethodStep}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-black rounded-full flex items-center justify-center active:scale-95 transition-transform"
                  >
                    <ArrowRight className="w-5 h-5 text-white" />
                  </button>
                )}
              </div>

              <p className="text-center text-sm text-gray-500">o continúa con</p>

              <Button
                type="button"
                onClick={handleGoogleLogin}
                className="w-full h-14 rounded-full bg-white border border-gray-300 hover:bg-gray-50 text-black text-base active:scale-[0.98] transition-transform shadow-none"
                disabled={isLoading}
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Google
              </Button>
            </>
          )}

          {step === 2 && (
            <>
              <p className="text-center text-base text-black mb-4">Introduce tu contraseña</p>
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Contraseña"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full h-14 px-6 pr-24 text-base rounded-full border border-gray-300 focus:outline-none focus:border-gray-400 placeholder:text-gray-300"
                    autoFocus
                  />
                  {password && (
                    <>
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-14 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-black rounded-full flex items-center justify-center active:scale-95 transition-transform disabled:opacity-50"
                      >
                        <ArrowRight className="w-5 h-5 text-white" />
                      </button>
                    </>
                  )}
                </div>
              </form>
              <button
                onClick={() => setStep(1)}
                className="text-sm text-gray-500 underline underline-offset-2 mx-auto block"
              >
                Cambiar método
              </button>
            </>
          )}

          {error && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-xl">
              <p className="text-sm text-red-600 text-center">{error}</p>
            </div>
          )}
        </div>
      </div>

      <p className="text-center text-sm text-black mt-8">
        ¿No tienes cuenta?{" "}
        <Link href="/auth/sign-up" className="underline underline-offset-2">
          Regístrate
        </Link>
      </p>
    </div>
  )
}

"use client"

import { useState, useEffect, useCallback } from "react"
import { MapPin, X, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase/client"

interface LocationPermissionPromptProps {
  userId?: string
  onDismiss: () => void
}

export function LocationPermissionPrompt({ userId, onDismiss }: LocationPermissionPromptProps) {
  const [visible, setVisible] = useState(false)
  const [requesting, setRequesting] = useState(false)

  // Check if we should show the prompt
  useEffect(() => {
    if (!userId) return

    let cancelled = false

    async function check() {
      try {
        const { data } = await supabase
          .from("profiles")
          .select("location_asked, share_location")
          .eq("id", userId)
          .single()

        if (cancelled) return

        // If user was never asked and hasn't already granted permission, show prompt
        if (data && !data.location_asked && !data.share_location) {
          setVisible(true)
        }
      } catch {
        // Silently fail -- don't block the app
      }
    }

    check()
    return () => { cancelled = true }
  }, [userId])

  const handleAllow = useCallback(async () => {
    if (!userId) return
    setRequesting(true)

    try {
      // Request browser geolocation to trigger the native permission dialog
      const granted = await new Promise<boolean>((resolve) => {
        if (!navigator.geolocation) {
          resolve(false)
          return
        }

        navigator.geolocation.getCurrentPosition(
          () => resolve(true),
          () => resolve(false),
          { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
        )
      })

      // Save the user's choice to the profile
      await supabase
        .from("profiles")
        .update({
          location_asked: true,
          share_location: granted,
          radar_enabled: granted,
        })
        .eq("id", userId)

      setVisible(false)
      onDismiss()
    } catch {
      setVisible(false)
      onDismiss()
    } finally {
      setRequesting(false)
    }
  }, [userId, onDismiss])

  const handleDeny = useCallback(async () => {
    if (!userId) return

    // Mark as asked but not sharing
    await supabase
      .from("profiles")
      .update({ location_asked: true, share_location: false })
      .eq("id", userId)
      .catch(() => {})

    setVisible(false)
    onDismiss()
  }, [userId, onDismiss])

  if (!visible) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-sm mx-4 mb-safe bg-white rounded-2xl shadow-xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
        {/* Close button */}
        <div className="flex justify-end p-3 pb-0">
          <button
            onClick={handleDeny}
            className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors rounded-full hover:bg-gray-100"
            aria-label="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 pb-6 pt-1 flex flex-col items-center text-center gap-4">
          {/* Icon */}
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
            <MapPin className="w-8 h-8 text-gray-600" />
          </div>

          {/* Text */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-gray-900 text-balance">
              Comparte tu clima emocional
            </h3>
            <p className="text-sm text-gray-500 leading-relaxed text-pretty">
              Permite compartir tu ubicacion aproximada para ver y aparecer en el radar emocional de personas cercanas. Tu identidad siempre es anonima.
            </p>
          </div>

          {/* Privacy note */}
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <Shield className="w-3.5 h-3.5 shrink-0" />
            <span>Puedes desactivarlo en cualquier momento desde el radar</span>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 w-full pt-1">
            <Button
              variant="ghost"
              onClick={handleDeny}
              className="flex-1 text-gray-500 hover:text-gray-900 hover:bg-gray-100 h-11"
              disabled={requesting}
            >
              Ahora no
            </Button>
            <Button
              onClick={handleAllow}
              className="flex-1 bg-gray-900 text-white hover:bg-gray-800 h-11"
              disabled={requesting}
            >
              {requesting ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                "Permitir"
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

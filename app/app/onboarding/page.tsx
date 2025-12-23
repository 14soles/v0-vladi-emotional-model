"use client"

import { supabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { Check, Users } from "lucide-react"

interface Contact {
  name: string
  phone: string
  isVladiUser: boolean
  selected: boolean
}

export default function OnboardingPage() {
  const [step, setStep] = useState(1)
  const [contacts, setContacts] = useState<Contact[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [hasContactsPermission, setHasContactsPermission] = useState(false)
  const [isCheckingUser, setIsCheckingUser] = useState(true)
  const router = useRouter()

  // Check if user is logged in and create profile if needed
  useEffect(() => {
    const checkUser = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          router.push("/auth/login")
          return
        }

        // Check if profile exists
        const { data: profile } = await supabase.from("profiles").select("id").eq("id", user.id).maybeSingle()

        if (!profile) {
          // Create profile from user metadata
          await supabase.from("profiles").upsert({
            id: user.id,
            username: user.user_metadata?.username || user.email?.split("@")[0] || "usuario",
            email: user.email || "",
            phone: user.user_metadata?.phone || "",
            display_name: user.user_metadata?.display_name || user.user_metadata?.username || user.email?.split("@")[0],
          })
        }
      } catch (error) {
        console.error("Error checking user:", error)
      } finally {
        setIsCheckingUser(false)
      }
    }

    checkUser()
  }, [router])

  const requestContactsAccess = async () => {
    setIsLoading(true)
    // In production, this would use the Contact Picker API
    // For now, we'll just show a success message
    await new Promise((resolve) => setTimeout(resolve, 800))
    setContacts([])
    setHasContactsPermission(true)
    setIsLoading(false)
    setStep(2)
  }

  const toggleContact = (index: number) => {
    setContacts((prev) => prev.map((c, i) => (i === index ? { ...c, selected: !c.selected } : c)))
  }

  const selectAll = () => {
    setContacts((prev) => prev.map((c) => ({ ...c, selected: true })))
  }

  const handleContinue = async () => {
    setIsLoading(true)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.push("/auth/login")
        return
      }

      // Add selected contacts if any
      const selectedContacts = contacts.filter((c) => c.selected)
      if (selectedContacts.length > 0) {
        const contactsToInsert = selectedContacts.map((c) => ({
          user_id: user.id,
          contact_name: c.name,
          contact_phone: c.phone,
          is_vladi_user: c.isVladiUser,
          friendship_status: c.isVladiUser ? "pending_sent" : "none",
        }))

        await supabase.from("contacts").insert(contactsToInsert)
      }

      router.push("/app")
      router.refresh()
    } catch (error) {
      console.error("Error:", error)
      router.push("/app")
    } finally {
      setIsLoading(false)
    }
  }

  const skipOnboarding = async () => {
    setIsLoading(true)
    router.push("/app")
    router.refresh()
  }

  if (isCheckingUser) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center">
        <div className="text-center">
          <h1 className="font-sans text-2xl font-medium mb-2">Vladi</h1>
          <p className="text-gray-500 text-sm">Preparando tu cuenta...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex justify-between items-center">
          <h1 className="font-sans text-2xl font-medium">Vladi</h1>
          <button onClick={skipOnboarding} className="text-sm text-gray-500 active:text-gray-700" disabled={isLoading}>
            Saltar
          </button>
        </div>
        {/* Progress */}
        <div className="flex gap-2 mt-4">
          {[1, 2].map((s) => (
            <div
              key={s}
              className={`flex-1 h-1 rounded-full transition-colors ${s <= step ? "bg-black" : "bg-gray-200"}`}
            />
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6 overflow-y-auto">
        {step === 1 && (
          <div className="text-center py-8">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Users className="w-10 h-10 text-gray-600" />
            </div>

            <h2 className="text-xl font-medium mb-3">Conecta con tu círculo</h2>
            <p className="text-gray-500 mb-8 max-w-xs mx-auto">
              Añade contactos para compartir tu bienestar emocional con las personas que te importan
            </p>

            <Button
              onClick={requestContactsAccess}
              className="w-full max-w-xs h-12 rounded-xl bg-black hover:bg-gray-800 active:scale-[0.98] transition-transform"
              disabled={isLoading}
            >
              {isLoading ? "Cargando..." : "Acceder a contactos"}
            </Button>

            <p className="text-xs text-gray-400 mt-4 max-w-xs mx-auto">
              Puedes añadir contactos más tarde desde la pestaña Chats
            </p>
          </div>
        )}

        {step === 2 && (
          <div>
            {contacts.length > 0 ? (
              <>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-medium">Selecciona contactos</h2>
                  <button onClick={selectAll} className="text-sm text-black font-medium active:opacity-70">
                    Seleccionar todos
                  </button>
                </div>

                {/* Vladi users */}
                {contacts.filter((c) => c.isVladiUser).length > 0 && (
                  <div className="mb-6">
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-3">Ya están en Vladi</p>
                    <div className="space-y-2">
                      {contacts
                        .filter((c) => c.isVladiUser)
                        .map((contact) => {
                          const originalIndex = contacts.findIndex((c) => c.phone === contact.phone)
                          return (
                            <button
                              key={contact.phone}
                              onClick={() => toggleContact(originalIndex)}
                              className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all active:scale-[0.98] ${
                                contact.selected ? "bg-green-50 border border-green-200" : "bg-gray-50"
                              }`}
                            >
                              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                                <span className="text-green-700 font-medium">{contact.name.charAt(0)}</span>
                              </div>
                              <div className="flex-1 text-left">
                                <p className="font-medium text-sm">{contact.name}</p>
                                <p className="text-xs text-green-600">Usuario de Vladi</p>
                              </div>
                              <div
                                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                                  contact.selected ? "bg-green-500 border-green-500" : "border-gray-300"
                                }`}
                              >
                                {contact.selected && <Check className="w-4 h-4 text-white" />}
                              </div>
                            </button>
                          )
                        })}
                    </div>
                  </div>
                )}

                {/* Invite to Vladi */}
                {contacts.filter((c) => !c.isVladiUser).length > 0 && (
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-3">Invitar a Vladi</p>
                    <div className="space-y-2">
                      {contacts
                        .filter((c) => !c.isVladiUser)
                        .map((contact) => {
                          const originalIndex = contacts.findIndex((c) => c.phone === contact.phone)
                          return (
                            <button
                              key={contact.phone}
                              onClick={() => toggleContact(originalIndex)}
                              className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all active:scale-[0.98] ${
                                contact.selected ? "bg-blue-50 border border-blue-200" : "bg-gray-50"
                              }`}
                            >
                              <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                                <span className="text-gray-600 font-medium">{contact.name.charAt(0)}</span>
                              </div>
                              <div className="flex-1 text-left">
                                <p className="font-medium text-sm">{contact.name}</p>
                                <p className="text-xs text-gray-500">Enviar invitación</p>
                              </div>
                              <div
                                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                                  contact.selected ? "bg-blue-500 border-blue-500" : "border-gray-300"
                                }`}
                              >
                                {contact.selected && <Check className="w-4 h-4 text-white" />}
                              </div>
                            </button>
                          )
                        })}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-lg font-medium mb-2">¡Todo listo!</h2>
                <p className="text-gray-500 text-sm max-w-xs mx-auto">
                  Puedes añadir contactos en cualquier momento desde la pestaña Chats → Grupos y personas
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-6 border-t border-gray-100">
        <Button
          onClick={handleContinue}
          className="w-full h-12 rounded-xl bg-black hover:bg-gray-800 active:scale-[0.98] transition-transform"
          disabled={isLoading}
        >
          {isLoading ? "Guardando..." : "Comenzar a usar Vladi"}
        </Button>
      </div>
    </div>
  )
}

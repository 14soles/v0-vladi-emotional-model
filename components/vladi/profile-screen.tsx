"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import {
  ChevronLeft,
  ChevronRight,
  User,
  Mail,
  Phone,
  LogOut,
  Shield,
  Bell,
  HelpCircle,
  FileText,
  Trash2,
  Check,
  X,
  Loader2,
  Camera,
  Image as ImageIcon,
} from "lucide-react"
import { supabase } from "@/lib/supabase/client"

interface FriendRequest {
  id: string
  from_user_id: string
  created_at: string
  from_username?: string
  from_display_name?: string
  from_avatar_url?: string
}

interface ProfileScreenProps {
  userProfile?: {
    id?: string
    username: string
    display_name?: string | null
    email: string
    phone?: string | null
    avatar_url?: string | null
  } | null
  onClose: () => void
  onProfileUpdate?: () => void // Callback to refresh profile
}

export function ProfileScreen({ userProfile, onClose, onProfileUpdate }: ProfileScreenProps) {
  const router = useRouter()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [showEditProfile, setShowEditProfile] = useState(false) // Edit profile state
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([])
  const [loadingRequests, setLoadingRequests] = useState(false)
  const [processingRequest, setProcessingRequest] = useState<string | null>(null)

  const [editUsername, setEditUsername] = useState(userProfile?.username || "")
  const [editDisplayName, setEditDisplayName] = useState(userProfile?.display_name || "")
  const [editPhone, setEditPhone] = useState(userProfile?.phone || "")
  const [isSaving, setIsSaving] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)
  
  // Avatar upload state
  const [showAvatarOptions, setShowAvatarOptions] = useState(false)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [previewAvatar, setPreviewAvatar] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (userProfile?.id) {
      loadFriendRequests()
    }
  }, [userProfile?.id])

  useEffect(() => {
    setEditUsername(userProfile?.username || "")
    setEditDisplayName(userProfile?.display_name || "")
    setEditPhone(userProfile?.phone || "")
    setPreviewAvatar(null) // Reset preview when profile changes
  }, [userProfile])

  const handleAvatarSelect = async (file: File) => {
    if (!userProfile?.id) return
    
    // Show preview immediately
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreviewAvatar(e.target?.result as string)
    }
    reader.readAsDataURL(file)
    
    setIsUploadingAvatar(true)
    setShowAvatarOptions(false)
    setEditError(null)
    
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("userId", userProfile.id)
      
      const response = await fetch("/api/avatar/upload", {
        method: "POST",
        body: formData,
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || "Error al subir la imagen")
      }
      
      // Refresh profile to get updated avatar
      if (onProfileUpdate) {
        onProfileUpdate()
      }
    } catch (error) {
      console.error("Avatar upload error:", error)
      setEditError(error instanceof Error ? error.message : "Error al subir la imagen")
      setPreviewAvatar(null) // Revert preview on error
    }
    setIsUploadingAvatar(false)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleAvatarSelect(file)
    }
    // Reset input so the same file can be selected again
    e.target.value = ""
  }

  const loadFriendRequests = async () => {
    if (!userProfile?.id) return
    setLoadingRequests(true)

    try {
      const { data: requests, error: reqError } = await supabase
        .from("friend_requests")
        .select("id, from_user_id, created_at")
        .eq("to_user_id", userProfile.id)
        .eq("status", "pending")
        .order("created_at", { ascending: false })

      if (reqError) {
        console.error("Error fetching requests:", reqError)
        setLoadingRequests(false)
        return
      }

      if (!requests || requests.length === 0) {
        setFriendRequests([])
        setLoadingRequests(false)
        return
      }

      const fromUserIds = requests.map((r) => r.from_user_id)
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, username, display_name, avatar_url")
        .in("id", fromUserIds)

      const profileMap = new Map(profiles?.map((p) => [p.id, p]) || [])

      const enrichedRequests: FriendRequest[] = requests.map((r) => {
        const profile = profileMap.get(r.from_user_id)
        return {
          id: r.id,
          from_user_id: r.from_user_id,
          created_at: r.created_at,
          from_username: profile?.username || "Usuario",
          from_display_name: profile?.display_name,
          from_avatar_url: profile?.avatar_url,
        }
      })

      setFriendRequests(enrichedRequests)
    } catch (error) {
      console.error("Error loading friend requests:", error)
    }
    setLoadingRequests(false)
  }

  const acceptRequest = async (request: FriendRequest) => {
    if (!userProfile?.id) return
    setProcessingRequest(request.id)

    try {
      await supabase.from("friend_requests").update({ status: "accepted" }).eq("id", request.id)

      await supabase.from("contacts").upsert({
        user_id: userProfile.id,
        contact_user_id: request.from_user_id,
        contact_name: request.from_username || "Usuario",
        friendship_status: "accepted",
      })

      await supabase.from("contacts").upsert({
        user_id: request.from_user_id,
        contact_user_id: userProfile.id,
        contact_name: userProfile.username,
        friendship_status: "accepted",
      })

      setFriendRequests((prev) => prev.filter((r) => r.id !== request.id))
    } catch (error) {
      console.error("Error accepting request:", error)
    }
    setProcessingRequest(null)
  }

  const rejectRequest = async (request: FriendRequest) => {
    setProcessingRequest(request.id)

    try {
      await supabase.from("friend_requests").update({ status: "rejected" }).eq("id", request.id)

      setFriendRequests((prev) => prev.filter((r) => r.id !== request.id))
    } catch (error) {
      console.error("Error rejecting request:", error)
    }
    setProcessingRequest(null)
  }

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      await supabase.auth.signOut()
      router.push("/auth/login")
    } catch (error) {
      console.error("Error signing out:", error)
      setIsLoggingOut(false)
    }
  }

  const handleSaveProfile = async () => {
    if (!userProfile?.id) return

    // Validate username
    const cleanUsername = editUsername
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, "")
    if (cleanUsername.length < 3) {
      setEditError("El nombre de usuario debe tener al menos 3 caracteres")
      return
    }

    setIsSaving(true)
    setEditError(null)

    try {
      // Check if username is already taken (if changed)
      if (cleanUsername !== userProfile.username) {
        const { data: existingUser } = await supabase
          .from("profiles")
          .select("id")
          .eq("username", cleanUsername)
          .neq("id", userProfile.id)
          .single()

        if (existingUser) {
          setEditError("Este nombre de usuario ya está en uso")
          setIsSaving(false)
          return
        }
      }

      // Update profile
      const { error } = await supabase
        .from("profiles")
        .update({
          username: cleanUsername,
          display_name: editDisplayName.trim() || null,
          phone: editPhone.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userProfile.id)

      if (error) throw error

      // Callback to refresh profile in parent
      if (onProfileUpdate) {
        onProfileUpdate()
      }

      setShowEditProfile(false)
    } catch (error) {
      console.error("Error saving profile:", error)
      setEditError("Error al guardar los cambios")
    }
    setIsSaving(false)
  }

  const menuItems = [
    {
      icon: User,
      label: "Editar perfil",
      onClick: () => setShowEditProfile(true), // Open edit profile
    },
    {
      icon: Bell,
      label: "Notificaciones",
      badge: friendRequests.length > 0 ? friendRequests.length : undefined,
      onClick: () => setShowNotifications(true),
    },
    {
      icon: Shield,
      label: "Privacidad y seguridad",
      onClick: () => {},
    },
    {
      icon: HelpCircle,
      label: "Ayuda y soporte",
      onClick: () => {},
    },
    {
      icon: FileText,
      label: "Términos y condiciones",
      onClick: () => {},
    },
  ]

  if (showEditProfile) {
    return (
      <div className="fixed inset-0 bg-white z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-[max(16px,env(safe-area-inset-top))] pb-4 border-b border-gray-100">
          <button onClick={() => setShowEditProfile(false)} className="p-2 -ml-2 rounded-full hover:bg-gray-100">
            <ChevronLeft className="w-6 h-6 text-gray-700" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900">Editar perfil</h1>
          <button
            onClick={handleSaveProfile}
            disabled={isSaving}
            className="p-2 -mr-2 text-blue-600 font-medium disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : "Guardar"}
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto px-6 py-6">
          {/* Avatar */}
          <div className="flex flex-col items-center mb-8">
            <button
              onClick={() => setShowAvatarOptions(true)}
              disabled={isUploadingAvatar}
              className="relative w-24 h-24 rounded-full bg-gray-900 text-white flex items-center justify-center text-3xl font-medium overflow-hidden mb-3 group"
            >
              {previewAvatar || userProfile?.avatar_url ? (
                <img 
                  src={previewAvatar || userProfile?.avatar_url || "/placeholder.svg"} 
                  alt="" 
                  className="w-full h-full object-cover" 
                />
              ) : (
                editDisplayName?.[0]?.toUpperCase() || editUsername?.[0]?.toUpperCase() || "U"
              )}
              {/* Overlay on hover */}
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="w-8 h-8 text-white" />
              </div>
              {/* Loading spinner */}
              {isUploadingAvatar && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-white animate-spin" />
                </div>
              )}
            </button>
            <button 
              onClick={() => setShowAvatarOptions(true)}
              disabled={isUploadingAvatar}
              className="text-sm text-blue-600 disabled:opacity-50"
            >
              {isUploadingAvatar ? "Subiendo..." : "Cambiar foto"}
            </button>
            
            {/* Hidden file inputs */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={handleFileChange}
              className="hidden"
            />
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="user"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
          
          {/* Avatar options modal */}
          {showAvatarOptions && (
            <div className="fixed inset-0 bg-black/50 z-[60] flex items-end justify-center" onClick={() => setShowAvatarOptions(false)}>
              <div 
                className="bg-white rounded-t-2xl w-full max-w-md p-6 pb-safe animate-in slide-in-from-bottom duration-300"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-6" />
                <h3 className="text-lg font-semibold text-gray-900 text-center mb-6">Cambiar foto de perfil</h3>
                
                <div className="space-y-3">
                  <button
                    onClick={() => {
                      cameraInputRef.current?.click()
                    }}
                    className="w-full flex items-center gap-4 px-4 py-4 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-full bg-gray-900 flex items-center justify-center">
                      <Camera className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-gray-900 font-medium">Hacer una foto</span>
                  </button>
                  
                  <button
                    onClick={() => {
                      fileInputRef.current?.click()
                    }}
                    className="w-full flex items-center gap-4 px-4 py-4 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-full bg-gray-900 flex items-center justify-center">
                      <ImageIcon className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-gray-900 font-medium">Elegir de la galeria</span>
                  </button>
                </div>
                
                <button
                  onClick={() => setShowAvatarOptions(false)}
                  className="w-full mt-6 py-3 text-gray-500 font-medium"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {/* Form fields */}
          <div className="space-y-6">
            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-2">Nombre de usuario</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">@</span>
                <input
                  type="text"
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                  placeholder="tunombre"
                  className="w-full h-12 pl-8 pr-4 text-base rounded-xl border border-gray-200 focus:outline-none focus:border-gray-400"
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">Este es el nombre que otros usuarios usarán para encontrarte</p>
            </div>

            {/* Display name */}
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-2">Nombre para mostrar</label>
              <input
                type="text"
                value={editDisplayName}
                onChange={(e) => setEditDisplayName(e.target.value)}
                placeholder="Tu nombre"
                className="w-full h-12 px-4 text-base rounded-xl border border-gray-200 focus:outline-none focus:border-gray-400"
              />
            </div>

            {/* Email (read only) */}
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-2">Correo electrónico</label>
              <input
                type="email"
                value={userProfile?.email || ""}
                disabled
                className="w-full h-12 px-4 text-base rounded-xl border border-gray-200 bg-gray-50 text-gray-500"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-2">Teléfono</label>
              <input
                type="tel"
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                placeholder="+34 600 000 000"
                className="w-full h-12 px-4 text-base rounded-xl border border-gray-200 focus:outline-none focus:border-gray-400"
              />
            </div>

            {editError && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-xl">
                <p className="text-sm text-red-600 text-center">{editError}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (showNotifications) {
    return (
      <div className="fixed inset-0 bg-white z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-[max(16px,env(safe-area-inset-top))] pb-4 border-b border-gray-100">
          <button onClick={() => setShowNotifications(false)} className="p-2 -ml-2 rounded-full hover:bg-gray-100">
            <ChevronLeft className="w-6 h-6 text-gray-700" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900">Notificaciones</h1>
          <div className="w-10" />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          {loadingRequests ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
            </div>
          ) : friendRequests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-6">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                <Bell className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500 text-center">No tienes notificaciones pendientes</p>
            </div>
          ) : (
            <div className="py-2">
              <h3 className="px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide">
                Solicitudes de amistad ({friendRequests.length})
              </h3>
              {friendRequests.map((request) => (
                <div key={request.id} className="px-6 py-4 border-b border-gray-100 flex items-center gap-4">
                  {/* Avatar */}
                  <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                    {request.from_avatar_url ? (
                      <img
                        src={request.from_avatar_url || "/placeholder.svg"}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-500 text-lg font-medium">
                        {(request.from_username || "U")[0].toUpperCase()}
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">
                      {request.from_display_name || request.from_username}
                    </p>
                    <p className="text-sm text-gray-500">@{request.from_username} quiere añadirte</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(request.created_at).toLocaleDateString("es-ES", {
                        day: "numeric",
                        month: "short",
                      })}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {processingRequest === request.id ? (
                      <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
                    ) : (
                      <>
                        <button
                          onClick={() => rejectRequest(request)}
                          className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50"
                        >
                          <X className="w-5 h-5 text-gray-500" />
                        </button>
                        <button
                          onClick={() => acceptRequest(request)}
                          className="w-10 h-10 rounded-full bg-gray-900 flex items-center justify-center hover:bg-gray-800"
                        >
                          <Check className="w-5 h-5 text-white" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-[max(16px,env(safe-area-inset-top))] pb-4 border-b border-gray-100">
        <button onClick={onClose} className="p-2 -ml-2 rounded-full hover:bg-gray-100">
          <ChevronLeft className="w-6 h-6 text-gray-700" />
        </button>
        <h1 className="text-lg font-semibold text-gray-900">Mi perfil</h1>
        <div className="w-10" />
      </div>

      {/* Profile info */}
      <div className="flex flex-col items-center py-8 px-6 border-b border-gray-100">
        <button
          onClick={() => setShowEditProfile(true)}
          className="relative w-24 h-24 rounded-full bg-gray-900 text-white flex items-center justify-center text-3xl font-medium overflow-hidden mb-4 group"
        >
          {userProfile?.avatar_url ? (
            <img src={userProfile.avatar_url || "/placeholder.svg"} alt="" className="w-full h-full object-cover" />
          ) : (
            userProfile?.username?.[0]?.toUpperCase() || "U"
          )}
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Camera className="w-6 h-6 text-white" />
          </div>
        </button>
        <h2 className="text-xl font-semibold text-gray-900">
          {userProfile?.display_name || userProfile?.username || "Usuario"}
        </h2>
        <p className="text-gray-500 text-sm">@{userProfile?.username || "usuario"}</p>

        {/* Contact info */}
        <div className="flex flex-col gap-2 mt-4 w-full max-w-xs">
          {userProfile?.email && (
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <Mail className="w-4 h-4 text-gray-400" />
              <span>{userProfile.email}</span>
            </div>
          )}
          {userProfile?.phone && (
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <Phone className="w-4 h-4 text-gray-400" />
              <span>{userProfile.phone}</span>
            </div>
          )}
        </div>
      </div>

      {/* Menu items */}
      <div className="flex-1 overflow-auto">
        <div className="py-2">
          {menuItems.map((item, index) => (
            <button
              key={index}
              onClick={item.onClick}
              className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 active:bg-gray-100"
            >
              <div className="flex items-center gap-4">
                <item.icon className="w-5 h-5 text-gray-500" />
                <span className="text-gray-900">{item.label}</span>
                {item.badge && (
                  <span className="bg-red-500 text-white text-xs font-medium px-2 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                )}
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
          ))}
        </div>

        {/* Logout button */}
        <div className="border-t border-gray-100 py-2">
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="w-full flex items-center gap-4 px-6 py-4 hover:bg-gray-50 active:bg-gray-100 disabled:opacity-50"
          >
            <LogOut className="w-5 h-5 text-red-500" />
            <span className="text-red-500 font-medium">{isLoggingOut ? "Cerrando sesión..." : "Cerrar sesión"}</span>
          </button>
        </div>

        {/* Delete account */}
        <div className="border-t border-gray-100 py-2">
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="w-full flex items-center gap-4 px-6 py-4 hover:bg-gray-50 active:bg-gray-100"
          >
            <Trash2 className="w-5 h-5 text-gray-400" />
            <span className="text-gray-400 text-sm">Eliminar cuenta</span>
          </button>
        </div>
      </div>

      {/* App version */}
      <div className="py-4 text-center text-xs text-gray-400 pb-safe">VLADI v26.6</div>

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-6">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">¿Eliminar tu cuenta?</h3>
            <p className="text-gray-500 text-sm mb-6">
              Esta acción es irreversible. Se eliminarán todos tus datos, registros emocionales y conexiones.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-3 rounded-full border border-gray-200 text-gray-700 font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  /* Implementar eliminación */
                }}
                className="flex-1 py-3 rounded-full bg-red-500 text-white font-medium"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

"use client"

import { useState, useEffect, useCallback } from "react"
import { X, UserPlus, Users, Check, XIcon, Bell } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import Image from "next/image"

interface NotificationsViewProps {
  onClose: () => void
  userId?: string
  userProfile?: {
    username?: string
    display_name?: string
    avatar_url?: string
  }
}

interface FriendRequest {
  id: string
  from_user_id: string
  status: string
  created_at: string
  from_user: {
    id: string
    display_name: string | null
    username: string | null
    avatar_url: string | null
  } | null
}

interface GroupInvitation {
  id: string
  group_id: string
  inviter_id: string
  status: string
  created_at: string
  group: {
    id: string
    name: string
  } | null
  inviter: {
    id: string
    display_name: string | null
    username: string | null
    avatar_url: string | null
  } | null
}

export function NotificationsView({ onClose, userId }: NotificationsViewProps) {
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([])
  const [groupInvitations, setGroupInvitations] = useState<GroupInvitation[]>([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)

  // Load notifications
  useEffect(() => {
    if (!userId) {
      setLoading(false)
      return
    }

    const loadNotifications = async () => {
      setLoading(true)
      try {
        // Load pending friend requests
        const { data: requests, error: requestsError } = await supabase
          .from("friend_requests")
          .select(`
            id,
            from_user_id,
            status,
            created_at,
            from_user:profiles!friend_requests_from_user_id_fkey(
              id,
              display_name,
              username,
              avatar_url
            )
          `)
          .eq("to_user_id", userId)
          .eq("status", "pending")
          .order("created_at", { ascending: false })

        if (requestsError) {
          console.error("[v0] Error loading friend requests:", requestsError)
        } else {
          const transformedRequests = (requests || []).map(r => ({
            ...r,
            from_user: Array.isArray(r.from_user) ? r.from_user[0] : r.from_user
          }))
          setFriendRequests(transformedRequests)
        }

        // Load pending group invitations
        const { data: invitations, error: invitationsError } = await supabase
          .from("group_invitations")
          .select(`
            id,
            group_id,
            inviter_id,
            status,
            created_at,
            group:privacy_groups(id, name),
            inviter:profiles!group_invitations_inviter_id_fkey(
              id,
              display_name,
              username,
              avatar_url
            )
          `)
          .eq("invited_user_id", userId)
          .eq("status", "pending")
          .order("created_at", { ascending: false })

        if (invitationsError) {
          console.error("[v0] Error loading group invitations:", invitationsError)
        } else {
          const transformedInvitations = (invitations || []).map(i => ({
            ...i,
            group: Array.isArray(i.group) ? i.group[0] : i.group,
            inviter: Array.isArray(i.inviter) ? i.inviter[0] : i.inviter
          }))
          setGroupInvitations(transformedInvitations)
        }
      } catch (error) {
        console.error("[v0] Error loading notifications:", error)
      } finally {
        setLoading(false)
      }
    }

    loadNotifications()
  }, [userId])

  // Accept friend request
  const handleAcceptFriendRequest = useCallback(async (request: FriendRequest) => {
    if (!userId) return
    setProcessingId(request.id)
    try {
      // 1. Update friend request status to accepted
      const { error: updateError } = await supabase
        .from("friend_requests")
        .update({ status: "accepted" })
        .eq("id", request.id)

      if (updateError) throw updateError

      // 2. Create contacts for both users
      await supabase
        .from("contacts")
        .upsert({
          owner_id: userId,
          contact_user_id: request.from_user_id,
        }, { onConflict: "owner_id,contact_user_id" })

      await supabase
        .from("contacts")
        .upsert({
          owner_id: request.from_user_id,
          contact_user_id: userId,
        }, { onConflict: "owner_id,contact_user_id" })

      // 3. Add to "Todos" group for the requester
      const { data: requesterTodosGroup } = await supabase
        .from("privacy_groups")
        .select("id")
        .eq("user_id", request.from_user_id)
        .eq("name", "Todos")
        .single()

      if (requesterTodosGroup) {
        await supabase
          .from("group_members")
          .upsert({
            group_id: requesterTodosGroup.id,
            member_user_id: userId,
          }, { onConflict: "group_id,member_user_id" })
      }

      // 4. Add to "Todos" group for current user
      const { data: myTodosGroup } = await supabase
        .from("privacy_groups")
        .select("id")
        .eq("user_id", userId)
        .eq("name", "Todos")
        .single()

      if (myTodosGroup) {
        await supabase
          .from("group_members")
          .upsert({
            group_id: myTodosGroup.id,
            member_user_id: request.from_user_id,
          }, { onConflict: "group_id,member_user_id" })
      }

      // Remove from list
      setFriendRequests(prev => prev.filter(r => r.id !== request.id))
    } catch (error) {
      console.error("[v0] Error accepting friend request:", error)
    } finally {
      setProcessingId(null)
    }
  }, [userId])

  // Reject friend request
  const handleRejectFriendRequest = useCallback(async (requestId: string) => {
    setProcessingId(requestId)
    try {
      const { error } = await supabase
        .from("friend_requests")
        .update({ status: "rejected" })
        .eq("id", requestId)

      if (error) throw error
      setFriendRequests(prev => prev.filter(r => r.id !== requestId))
    } catch (error) {
      console.error("[v0] Error rejecting friend request:", error)
    } finally {
      setProcessingId(null)
    }
  }, [])

  // Accept group invitation
  const handleAcceptGroupInvitation = useCallback(async (invitation: GroupInvitation) => {
    if (!userId) return
    setProcessingId(invitation.id)
    try {
      // 1. Update invitation status
      const { error: updateError } = await supabase
        .from("group_invitations")
        .update({ status: "accepted" })
        .eq("id", invitation.id)

      if (updateError) throw updateError

      // 2. Add user to the group
      await supabase
        .from("group_members")
        .upsert({
          group_id: invitation.group_id,
          member_user_id: userId,
        }, { onConflict: "group_id,member_user_id" })

      // Remove from list
      setGroupInvitations(prev => prev.filter(i => i.id !== invitation.id))
    } catch (error) {
      console.error("[v0] Error accepting group invitation:", error)
    } finally {
      setProcessingId(null)
    }
  }, [userId])

  // Reject group invitation
  const handleRejectGroupInvitation = useCallback(async (invitationId: string) => {
    setProcessingId(invitationId)
    try {
      const { error } = await supabase
        .from("group_invitations")
        .update({ status: "rejected" })
        .eq("id", invitationId)

      if (error) throw error
      setGroupInvitations(prev => prev.filter(i => i.id !== invitationId))
    } catch (error) {
      console.error("[v0] Error rejecting group invitation:", error)
    } finally {
      setProcessingId(null)
    }
  }, [])

  // Format relative time
  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return "Ahora"
    if (diffMins < 60) return `Hace ${diffMins} min`
    if (diffHours < 24) return `Hace ${diffHours}h`
    if (diffDays < 7) return `Hace ${diffDays}d`
    return date.toLocaleDateString("es-ES", { day: "numeric", month: "short" })
  }

  const hasNotifications = friendRequests.length > 0 || groupInvitations.length > 0

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <header className="w-full flex justify-between items-center px-6 py-5 border-b border-gray-100 shrink-0">
        <h1 className="text-2xl font-light text-gray-900">Notificaciones</h1>
        <button
          onClick={onClose}
          className="w-10 h-10 flex items-center justify-center text-gray-900 hover:opacity-70 active:opacity-50"
        >
          <X className="w-6 h-6" />
        </button>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-8 h-8 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin" />
          </div>
        ) : !hasNotifications ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-6">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Bell className="w-8 h-8 text-gray-400" />
            </div>
            <h2 className="text-lg font-medium text-gray-900 mb-2">Sin notificaciones</h2>
            <p className="text-sm text-gray-500">
              Cuando alguien te envie una solicitud de amistad o te invite a un grupo, aparecera aqui.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {/* Friend Requests */}
            {friendRequests.map(request => (
              <div key={request.id} className="p-4">
                <div className="flex items-start gap-3">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 shrink-0">
                      {request.from_user?.avatar_url ? (
                        <Image
                          src={request.from_user.avatar_url || "/placeholder.svg"}
                          alt={request.from_user.display_name || "Usuario"}
                          width={48}
                          height={48}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-500 font-medium text-lg">
                          {(request.from_user?.display_name || request.from_user?.username || "U")[0].toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                      <UserPlus className="w-3 h-3 text-white" />
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">
                      <span className="font-semibold">
                        {request.from_user?.display_name || request.from_user?.username || "Usuario"}
                      </span>
                      {" "}te ha enviado una solicitud de amistad
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      @{request.from_user?.username || "usuario"} · {formatRelativeTime(request.created_at)}
                    </p>
                    
                    {/* Action buttons */}
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => handleAcceptFriendRequest(request)}
                        disabled={processingId === request.id}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-gray-900 hover:bg-gray-800 disabled:bg-gray-400 text-white text-sm font-medium rounded-lg transition-colors"
                      >
                        <Check className="w-4 h-4" />
                        <span>Aceptar</span>
                      </button>
                      <button
                        onClick={() => handleRejectFriendRequest(request.id)}
                        disabled={processingId === request.id}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 text-gray-700 text-sm font-medium rounded-lg transition-colors"
                      >
                        <XIcon className="w-4 h-4" />
                        <span>Rechazar</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Group Invitations */}
            {groupInvitations.map(invitation => (
              <div key={invitation.id} className="p-4">
                <div className="flex items-start gap-3">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 shrink-0">
                      {invitation.inviter?.avatar_url ? (
                        <Image
                          src={invitation.inviter.avatar_url || "/placeholder.svg"}
                          alt={invitation.inviter.display_name || "Usuario"}
                          width={48}
                          height={48}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-500 font-medium text-lg">
                          {(invitation.inviter?.display_name || invitation.inviter?.username || "U")[0].toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center">
                      <Users className="w-3 h-3 text-white" />
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">
                      <span className="font-semibold">
                        {invitation.inviter?.display_name || invitation.inviter?.username || "Usuario"}
                      </span>
                      {" "}quiere anadirte a su grupo{" "}
                      <span className="font-semibold">"{invitation.group?.name || "Grupo"}"</span>
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      @{invitation.inviter?.username || "usuario"} · {formatRelativeTime(invitation.created_at)}
                    </p>
                    
                    {/* Action buttons */}
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => handleAcceptGroupInvitation(invitation)}
                        disabled={processingId === invitation.id}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-gray-900 hover:bg-gray-800 disabled:bg-gray-400 text-white text-sm font-medium rounded-lg transition-colors"
                      >
                        <Check className="w-4 h-4" />
                        <span>Aceptar</span>
                      </button>
                      <button
                        onClick={() => handleRejectGroupInvitation(invitation.id)}
                        disabled={processingId === invitation.id}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 text-gray-700 text-sm font-medium rounded-lg transition-colors"
                      >
                        <XIcon className="w-4 h-4" />
                        <span>Rechazar</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

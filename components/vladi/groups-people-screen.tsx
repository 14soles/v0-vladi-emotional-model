"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { ChevronLeft, ChevronRight, Search, UserPlus, Check, Loader2, X, MoreHorizontal, Plus, Trash2 } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { handleError } from "@/lib/error-handler"

interface GroupsPeopleScreenProps {
  onClose: () => void
  userId?: string
}

interface Group {
  id: string
  name: string
  is_system: boolean
  memberCount?: number
}

interface SearchResult {
  id: string
  username: string
  display_name: string | null
  avatar_url: string | null
  isFriend: boolean
  isPending: boolean
}

interface Contact {
  id: string
  contact_user_id: string | null
  contact_name: string
  friendship_status: string
  username?: string
  display_name?: string | null
  avatar_url?: string | null
}

interface PendingRequest {
  id: string
  from_user_id: string
  username: string
  display_name: string | null
  avatar_url: string | null
  created_at: string
}

interface GroupMember {
  id: string
  contact_id: string
  member_user_id?: string
  contact_name: string
  username?: string
  avatar_url?: string | null
  isAdmin?: boolean
}

interface PendingGroupInvitation {
  id: string
  to_user_id: string
  username?: string
  display_name?: string | null
  avatar_url?: string | null
  created_at: string
}

type ViewState = "main" | "group-detail" | "add-members"

export function GroupsPeopleScreen({ onClose, userId }: GroupsPeopleScreenProps) {
  const [viewState, setViewState] = useState<ViewState>("main")
  const [searchQuery, setSearchQuery] = useState("")
  const [groups, setGroups] = useState<Group[]>([])
  const [contacts, setContacts] = useState<Contact[]>([])
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([])
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [sendingRequest, setSendingRequest] = useState<string | null>(null)
  const [processingRequest, setProcessingRequest] = useState<string | null>(null)
  const [removingContact, setRemovingContact] = useState<string | null>(null)
  
  // Group detail state
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null)
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([])
  const [pendingInvitations, setPendingInvitations] = useState<PendingGroupInvitation[]>([])
  const [loadingMembers, setLoadingMembers] = useState(false)
  const [cancellingInvitation, setCancellingInvitation] = useState<string | null>(null)
  
  // Add members state
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set())
  const [addingMembers, setAddingMembers] = useState(false)
  
  // Dropdown state for contact actions
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  
  // Delete group confirmation
  const [showDeleteGroupConfirm, setShowDeleteGroupConfirm] = useState(false)
  const [deletingGroup, setDeletingGroup] = useState(false)

  // Load data on mount
  useEffect(() => {
    if (userId) {
      loadData()
    } else {
      setIsLoading(false)
    }
  }, [userId])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdownId(null)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Search users when query changes
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.length >= 2 && userId && viewState === "main") {
        searchUsers()
      } else if (viewState === "main") {
        setSearchResults([])
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery, userId, viewState])

  const loadData = async () => {
    if (!userId) return
    setIsLoading(true)
    try {
      // Load groups
      const { data: groupsData } = await supabase
        .from("privacy_groups")
        .select("id, name, is_system")
        .eq("user_id", userId)
        .order("is_system", { ascending: false })
        .order("name", { ascending: true })

      if (groupsData) {
        // Get member counts for each group
        const groupsWithCounts = await Promise.all(
          groupsData.map(async (g) => {
            const { count } = await supabase
              .from("group_members")
              .select("*", { count: "exact", head: true })
              .eq("group_id", g.id)
            return { ...g, memberCount: count || 0 }
          })
        )
        setGroups(groupsWithCounts)
      }

      // Load accepted contacts
      const { data: contactsData } = await supabase
        .from("contacts")
        .select("id, contact_user_id, contact_name, friendship_status")
        .eq("user_id", userId)
        .eq("friendship_status", "accepted")

      if (contactsData && contactsData.length > 0) {
        const contactUserIds = contactsData.filter((c) => c.contact_user_id).map((c) => c.contact_user_id)

        let profileMap = new Map()
        if (contactUserIds.length > 0) {
          const { data: profiles } = await supabase
            .from("profiles")
            .select("id, username, display_name, avatar_url")
            .in("id", contactUserIds)

          profileMap = new Map(profiles?.map((p) => [p.id, p]) || [])
        }

        setContacts(
          contactsData.map((c) => {
            const profile = c.contact_user_id ? profileMap.get(c.contact_user_id) : null
            return {
              id: c.id,
              contact_user_id: c.contact_user_id,
              contact_name: c.contact_name,
              friendship_status: c.friendship_status,
              username: profile?.username,
              display_name: profile?.display_name,
              avatar_url: profile?.avatar_url,
            }
          })
        )
      }

      // Load pending friend requests (received)
      const { data: requestsData } = await supabase
        .from("friend_requests")
        .select("id, from_user_id, created_at")
        .eq("to_user_id", userId)
        .eq("status", "pending")

      if (requestsData && requestsData.length > 0) {
        const fromUserIds = requestsData.map((r) => r.from_user_id)
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, username, display_name, avatar_url")
          .in("id", fromUserIds)

        const profileMap = new Map(profiles?.map((p) => [p.id, p]) || [])

        setPendingRequests(
          requestsData.map((r) => {
            const profile = profileMap.get(r.from_user_id)
            return {
              id: r.id,
              from_user_id: r.from_user_id,
              username: profile?.username || "Usuario",
              display_name: profile?.display_name,
              avatar_url: profile?.avatar_url,
              created_at: r.created_at,
            }
          })
        )
      }
    } catch (error) {
      handleError(error, "error", {
        userId,
        action: "load_contacts_groups",
        component: "GroupsPeopleScreen",
      })
    }
    setIsLoading(false)
  }

  const searchUsers = async () => {
    if (!userId || searchQuery.length < 2) return

    setIsSearching(true)
    try {
      const { data: users, error } = await supabase
        .from("profiles")
        .select("id, username, display_name, avatar_url")
        .or(`username.ilike.%${searchQuery}%,display_name.ilike.%${searchQuery}%`)
        .neq("id", userId)
        .limit(20)

      if (error) throw error

      const { data: friendships } = await supabase
        .from("contacts")
        .select("contact_user_id, friendship_status")
        .eq("user_id", userId)

      const friendMap = new Map(friendships?.map((f) => [f.contact_user_id, f.friendship_status]) || [])

      const { data: sentRequests } = await supabase
        .from("friend_requests")
        .select("to_user_id")
        .eq("from_user_id", userId)
        .eq("status", "pending")

      const pendingSet = new Set(sentRequests?.map((r) => r.to_user_id) || [])

      const results: SearchResult[] = (users || []).map((u) => ({
        id: u.id,
        username: u.username,
        display_name: u.display_name,
        avatar_url: u.avatar_url,
        isFriend: friendMap.get(u.id) === "accepted",
        isPending: pendingSet.has(u.id),
      }))

      setSearchResults(results)
    } catch (error) {
      handleError(error, "error", {
        userId,
        action: "search_users",
        component: "GroupsPeopleScreen",
      })
    }
    setIsSearching(false)
  }

  const sendFriendRequest = async (targetUserId: string, targetUsername: string) => {
    if (!userId) {
      return
    }

    setSendingRequest(targetUserId)
    try {
      // Check if there's already an active contact/friendship
      const { data: activeContact } = await supabase
        .from("contacts")
        .select("id")
        .eq("user_id", userId)
        .eq("contact_user_id", targetUserId)
        .eq("friendship_status", "accepted")
        .maybeSingle()
      
      if (activeContact) {
        // They're already friends - update UI
        setSearchResults((prev) => prev.map((r) => (r.id === targetUserId ? { ...r, isFriend: true, isPending: false } : r)))
        setSendingRequest(null)
        return
      }

      // Check if there's already a pending request FROM this user TO the target
      const { data: existingRequest } = await supabase
        .from("friend_requests")
        .select("id, status")
        .eq("from_user_id", userId)
        .eq("to_user_id", targetUserId)
        .maybeSingle()

      if (existingRequest) {
        if (existingRequest.status === "pending") {
          // Already pending - just update UI
          setSearchResults((prev) => prev.map((r) => (r.id === targetUserId ? { ...r, isPending: true } : r)))
          setSendingRequest(null)
          return
        }
        // If rejected or accepted but no active contact, update the existing request to pending
        const { error: updateError } = await supabase
          .from("friend_requests")
          .update({ status: "pending", created_at: new Date().toISOString() })
          .eq("id", existingRequest.id)
        
        if (updateError) throw updateError
      } else {
        // No existing request from this user - create new one
        const { error: requestError } = await supabase.from("friend_requests").insert({
          from_user_id: userId,
          to_user_id: targetUserId,
          status: "pending",
        })

        if (requestError) throw requestError
      }

      // Create/update a contact entry to track this relationship
      await supabase.from("contacts").upsert(
        {
          user_id: userId,
          contact_user_id: targetUserId,
          contact_name: targetUsername,
          friendship_status: "pending_sent",
        },
        { onConflict: "user_id,contact_user_id" }
      )

      // Update UI to show as pending
      setSearchResults((prev) => prev.map((r) => (r.id === targetUserId ? { ...r, isPending: true } : r)))
    } catch (error) {
      console.error("[v0] sendFriendRequest: Error caught", error)
      handleError(error, "error", {
        userId,
        action: "send_friend_request",
        component: "GroupsPeopleScreen",
      })
    } finally {
      setSendingRequest(null)
    }
  }

  const acceptFriendRequest = async (request: PendingRequest) => {
    if (!userId) return

    setProcessingRequest(request.id)
    try {
      // Update request status
      await supabase
        .from("friend_requests")
        .update({ status: "accepted" })
        .eq("id", request.id)

      // Create/update contact for me
      await supabase.from("contacts").upsert(
        {
          user_id: userId,
          contact_user_id: request.from_user_id,
          contact_name: request.display_name || request.username,
          friendship_status: "accepted",
        },
        { onConflict: "user_id,contact_user_id" }
      )

      // Create/update contact for them
      const { data: myProfile } = await supabase
        .from("profiles")
        .select("display_name, username")
        .eq("id", userId)
        .single()

      await supabase.from("contacts").upsert(
        {
          user_id: request.from_user_id,
          contact_user_id: userId,
          contact_name: myProfile?.display_name || myProfile?.username || "Usuario",
          friendship_status: "accepted",
        },
        { onConflict: "user_id,contact_user_id" }
      )

      // Reload data
      await loadData()
    } catch (error) {
      handleError(error, "error", {
        userId,
        action: "accept_friend_request",
        component: "GroupsPeopleScreen",
      })
    }
    setProcessingRequest(null)
  }

  const rejectFriendRequest = async (request: PendingRequest) => {
    if (!userId) return

    setProcessingRequest(request.id)
    try {
      await supabase
        .from("friend_requests")
        .update({ status: "rejected" })
        .eq("id", request.id)

      setPendingRequests((prev) => prev.filter((r) => r.id !== request.id))
    } catch (error) {
      handleError(error, "error", {
        userId,
        action: "reject_friend_request",
        component: "GroupsPeopleScreen",
      })
    }
    setProcessingRequest(null)
  }

  const removeContact = async (contact: Contact) => {
    if (!userId || !contact.contact_user_id) return

    setRemovingContact(contact.id)
    try {
      // 1. Remove from all groups where this contact is a member (my groups)
      await supabase.from("group_members").delete().eq("contact_id", contact.id)
      
      // 2. Find and remove from the other user's groups
      const { data: theirContact } = await supabase
        .from("contacts")
        .select("id")
        .eq("user_id", contact.contact_user_id)
        .eq("contact_user_id", userId)
        .single()
      
      if (theirContact) {
        await supabase.from("group_members").delete().eq("contact_id", theirContact.id)
      }
      
      // 3. Delete my contact entry
      await supabase.from("contacts").delete().eq("id", contact.id)
      
      // 4. Delete their contact entry (mutual removal)
      await supabase.from("contacts").delete().eq("user_id", contact.contact_user_id).eq("contact_user_id", userId)
      
      // 5. Delete the friend request so they can add each other again
      await supabase.from("friend_requests").delete()
        .or(`and(from_user_id.eq.${userId},to_user_id.eq.${contact.contact_user_id}),and(from_user_id.eq.${contact.contact_user_id},to_user_id.eq.${userId})`)
      
      setContacts((prev) => prev.filter((c) => c.id !== contact.id))
    } catch (error) {
      handleError(error, "error", {
        userId,
        action: "remove_contact",
        component: "GroupsPeopleScreen",
      })
    }
    setRemovingContact(null)
  }

  const handleCreateGroup = async () => {
    const newGroupName = prompt("Nombre del nuevo grupo:")
    if (newGroupName && newGroupName.trim() && userId) {
      try {
        const { data, error } = await supabase
          .from("privacy_groups")
          .insert({
            user_id: userId,
            name: newGroupName.trim(),
            is_system: false,
          })
          .select()
          .single()

        if (!error && data) {
          setGroups((prev) => [...prev, { ...data, memberCount: 0 }])
        }
      } catch (error) {
        handleError(error, "error", {
          userId,
          action: "create_group",
          component: "GroupsPeopleScreen",
        })
      }
    }
  }

  const openGroupDetail = async (group: Group) => {
    setSelectedGroup(group)
    setViewState("group-detail")
    setLoadingMembers(true)
    setPendingInvitations([])

    try {
      // Load group members
      const { data: membersData } = await supabase
        .from("group_members")
        .select("id, contact_id")
        .eq("group_id", group.id)

      if (membersData && membersData.length > 0) {
        const contactIds = membersData.map((m) => m.contact_id)
        const { data: contactsData } = await supabase
          .from("contacts")
          .select("id, contact_user_id, contact_name")
          .in("id", contactIds)

        const contactUserIds = contactsData?.filter((c) => c.contact_user_id).map((c) => c.contact_user_id) || []
        
        let profileMap = new Map()
        if (contactUserIds.length > 0) {
          const { data: profiles } = await supabase
            .from("profiles")
            .select("id, username, avatar_url")
            .in("id", contactUserIds)
          profileMap = new Map(profiles?.map((p) => [p.id, p]) || [])
        }

        const members: GroupMember[] = membersData.map((m) => {
          const contact = contactsData?.find((c) => c.id === m.contact_id)
          const profile = contact?.contact_user_id ? profileMap.get(contact.contact_user_id) : null
          return {
            id: m.id,
            contact_id: m.contact_id,
            contact_name: contact?.contact_name || "Usuario",
            username: profile?.username,
            avatar_url: profile?.avatar_url,
          }
        })

        setGroupMembers(members)
      } else {
        setGroupMembers([])
      }

      // Load pending invitations for this group (sent by current user)
      const { data: invitationsData } = await supabase
        .from("group_invitations")
        .select("id, to_user_id, created_at")
        .eq("group_id", group.id)
        .eq("from_user_id", userId)
        .eq("status", "pending")

      if (invitationsData && invitationsData.length > 0) {
        const toUserIds = invitationsData.map((i) => i.to_user_id)
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, username, display_name, avatar_url")
          .in("id", toUserIds)
        
        const profileMap = new Map(profiles?.map((p) => [p.id, p]) || [])
        
        const pendingInvites: PendingGroupInvitation[] = invitationsData.map((inv) => {
          const profile = profileMap.get(inv.to_user_id)
          return {
            id: inv.id,
            to_user_id: inv.to_user_id,
            username: profile?.username,
            display_name: profile?.display_name,
            avatar_url: profile?.avatar_url,
            created_at: inv.created_at,
          }
        })
        setPendingInvitations(pendingInvites)
      } else {
        setPendingInvitations([])
      }
    } catch (error) {
      handleError(error, "error", {
        userId,
        action: "load_group_members",
        component: "GroupsPeopleScreen",
      })
    }
    setLoadingMembers(false)
  }

  const openAddMembers = () => {
    setSelectedContacts(new Set())
    setSearchQuery("")
    setViewState("add-members")
  }

  const toggleContactSelection = (contactId: string) => {
    setSelectedContacts((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(contactId)) {
        newSet.delete(contactId)
      } else {
        newSet.add(contactId)
      }
      return newSet
    })
  }

  const addSelectedMembers = async () => {
    if (!selectedGroup || selectedContacts.size === 0) return
    
    setAddingMembers(true)
    try {
      // Get the contact_user_id for each selected contact
      const selectedContactsList = contacts.filter(c => selectedContacts.has(c.id))
      
      // Send group invitations instead of adding directly
      const invitationsToSend = selectedContactsList
        .filter(c => c.contact_user_id) // Only contacts with user accounts
        .map((contact) => ({
          group_id: selectedGroup.id,
          from_user_id: userId,
          to_user_id: contact.contact_user_id,
          status: "pending",
        }))
      
      if (invitationsToSend.length > 0) {
        // Insert invitations one by one to handle conflicts properly
        for (const invitation of invitationsToSend) {
          // First check if invitation already exists
          const { data: existing } = await supabase
            .from("group_invitations")
            .select("id, status")
            .eq("group_id", invitation.group_id)
            .eq("to_user_id", invitation.to_user_id)
            .maybeSingle()
          
          if (!existing) {
            // Insert new invitation
            const { error: insertError } = await supabase
              .from("group_invitations")
              .insert(invitation)
            
            if (insertError) {
              console.error("[v0] Error inserting invitation:", insertError)
            }
          } else if (existing.status === "rejected") {
            // Re-invite if previously rejected
            const { error: updateError } = await supabase
              .from("group_invitations")
              .update({ status: "pending", created_at: new Date().toISOString(), responded_at: null })
              .eq("id", existing.id)
            
            if (updateError) {
              console.error("[v0] Error updating invitation:", updateError)
            }
          }
          // If pending or accepted, do nothing
        }
      }
      
      // Go back to group detail and reload data
      setSelectedContacts(new Set())
      await openGroupDetail(selectedGroup)
    } catch (error) {
      handleError(error, "error", {
        userId,
        action: "send_group_invitations",
        component: "GroupsPeopleScreen",
      })
    }
    setAddingMembers(false)
  }

  const cancelGroupInvitation = async (invitationId: string) => {
    setCancellingInvitation(invitationId)
    try {
      await supabase.from("group_invitations").delete().eq("id", invitationId)
      setPendingInvitations((prev) => prev.filter((i) => i.id !== invitationId))
    } catch (error) {
      handleError(error, "error", {
        userId,
        action: "cancel_group_invitation",
        component: "GroupsPeopleScreen",
      })
    }
    setCancellingInvitation(null)
  }

  const removeMemberFromGroup = async (member: GroupMember) => {
    if (!selectedGroup) return

    try {
      await supabase.from("group_members").delete().eq("id", member.id)
      setGroupMembers((prev) => prev.filter((m) => m.id !== member.id))
      setGroups((prev) =>
        prev.map((g) =>
          g.id === selectedGroup.id
            ? { ...g, memberCount: Math.max(0, (g.memberCount || 0) - 1) }
            : g
        )
      )
    } catch (error) {
      handleError(error, "error", {
        userId,
        action: "remove_group_member",
        component: "GroupsPeopleScreen",
      })
    }
  }

  const deleteGroup = async () => {
    if (!selectedGroup || selectedGroup.is_system) return

    setDeletingGroup(true)
    try {
      // First delete all group members
      await supabase.from("group_members").delete().eq("group_id", selectedGroup.id)
      
      // Delete any pending invitations
      await supabase.from("group_invitations").delete().eq("group_id", selectedGroup.id)
      
      // Delete the group
      await supabase.from("privacy_groups").delete().eq("id", selectedGroup.id)
      
      // Update local state
      setGroups((prev) => prev.filter((g) => g.id !== selectedGroup.id))
      setShowDeleteGroupConfirm(false)
      setSelectedGroup(null)
      setViewState("main")
    } catch (error) {
      handleError(error, "error", {
        userId,
        action: "delete_group",
        component: "GroupsPeopleScreen",
      })
    }
    setDeletingGroup(false)
  }

  // Filter contacts not already in group and not already with pending invitations for add members view
  const pendingInvitedUserIds = new Set(pendingInvitations.map((i) => i.to_user_id))
  const availableContacts = contacts.filter(
    (c) => !groupMembers.some((m) => m.contact_id === c.id) && 
           !pendingInvitedUserIds.has(c.contact_user_id || "")
  )

  const filteredAvailableContacts = availableContacts.filter(
    (c) =>
      c.contact_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.username?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // =====================
  // ADD MEMBERS VIEW
  // =====================
  if (viewState === "add-members" && selectedGroup) {
    return (
      <div className="fixed inset-0 z-[200] bg-white flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-[max(16px,env(safe-area-inset-top))] pb-3 border-b border-gray-100">
          <button
            onClick={() => setViewState("group-detail")}
            className="text-base text-gray-600 hover:text-gray-900"
          >
            Cancelar
          </button>
          <div className="text-center">
            <h2 className="text-base font-semibold text-gray-900">Agregar al grupo</h2>
            <p className="text-xs text-gray-500">{selectedContacts.size} seleccionados</p>
          </div>
          <button
            onClick={addSelectedMembers}
            disabled={selectedContacts.size === 0 || addingMembers}
            className="text-base font-medium text-gray-900 disabled:text-gray-300"
          >
            {addingMembers ? <Loader2 className="w-5 h-5 animate-spin" /> : "Agregar"}
          </button>
        </div>

        {/* Search bar */}
        <div className="px-4 py-3 bg-gray-50">
          <div className="bg-gray-100 rounded-lg px-3 py-2 flex items-center gap-2">
            <Search className="w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar un nombre o usuario"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent border-none outline-none text-sm text-gray-900 placeholder:text-gray-500"
            />
          </div>
        </div>

        {/* Contacts list */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-4 py-2">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
              Contactos frecuentes
            </p>
          </div>

          {filteredAvailableContacts.length === 0 ? (
            <div className="text-center py-12 px-4">
              <p className="text-gray-500">No hay contactos disponibles para anadir</p>
            </div>
          ) : (
            filteredAvailableContacts.map((contact) => (
              <button
                key={contact.id}
                onClick={() => toggleContactSelection(contact.id)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
              >
                <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                  {contact.avatar_url ? (
                    <img
                      src={contact.avatar_url || "/placeholder.svg"}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-500 text-lg font-medium">
                      {contact.contact_name[0].toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium text-gray-900">
                    {contact.display_name || contact.username || contact.contact_name}
                  </p>
                  {contact.username && (
                    <p className="text-sm text-gray-500">@{contact.username}</p>
                  )}
                </div>
                <div
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                    selectedContacts.has(contact.id)
                      ? "bg-green-500 border-green-500"
                      : "border-gray-300"
                  }`}
                >
                  {selectedContacts.has(contact.id) && (
                    <Check className="w-4 h-4 text-white" />
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    )
  }

  // =====================
  // GROUP DETAIL VIEW
  // =====================
  if (viewState === "group-detail" && selectedGroup) {
    return (
      <div className="fixed inset-0 z-[200] bg-white flex flex-col">
        {/* Delete Group Confirmation Modal */}
        {showDeleteGroupConfirm && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-xl p-6 mx-4 max-w-sm w-full shadow-xl">
              <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
                Desea eliminar grupo?
              </h3>
              <p className="text-sm text-gray-500 text-center mb-6">
                Esta accion no se puede deshacer. Se eliminaran todos los miembros del grupo.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteGroupConfirm(false)}
                  disabled={deletingGroup}
                  className="flex-1 py-2.5 px-4 rounded-lg border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={deleteGroup}
                  disabled={deletingGroup}
                  className="flex-1 py-2.5 px-4 rounded-lg bg-red-500 text-white font-medium hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {deletingGroup ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Aceptar"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-[max(16px,env(safe-area-inset-top))] pb-3 border-b border-gray-100">
          <button onClick={() => setViewState("main")} className="p-2 -ml-2">
            <ChevronLeft className="w-6 h-6 text-gray-800" />
          </button>
          <h2 className="text-lg font-semibold text-gray-900">{selectedGroup.name}</h2>
          {!selectedGroup.is_system ? (
            <button 
              onClick={() => setShowDeleteGroupConfirm(true)}
              className="p-2 -mr-2 text-gray-500 hover:text-red-500 transition-colors"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          ) : (
            <div className="w-10" />
          )}
        </div>

        {/* Member count and search */}
        <div className="px-4 py-3 flex items-center justify-between border-b border-gray-100">
          <p className="text-sm font-medium text-gray-900">
            {groupMembers.length} miembro{groupMembers.length !== 1 ? "s" : ""}
            {pendingInvitations.length > 0 && (
              <span className="text-gray-500"> ({pendingInvitations.length} pendiente{pendingInvitations.length !== 1 ? "s" : ""})</span>
            )}
          </p>
          <button className="p-2 -mr-2">
            <Search className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Add members button */}
          <button
            onClick={openAddMembers}
            className="w-full flex items-center gap-3 px-4 py-4 hover:bg-gray-50 transition-colors border-b border-gray-100"
          >
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
              <Plus className="w-5 h-5 text-gray-600" />
            </div>
            <span className="font-medium text-gray-900">Agregar personas</span>
          </button>

          {/* Pending invitations section */}
          {pendingInvitations.length > 0 && (
            <div className="border-b border-gray-100">
              <div className="px-4 py-2 bg-gray-50">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Invitaciones pendientes
                </p>
              </div>
              {pendingInvitations.map((invitation) => (
                <div
                  key={invitation.id}
                  className="flex items-center gap-3 px-4 py-3 bg-amber-50/50 border-b border-gray-100"
                >
                  <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden">
                    {invitation.avatar_url ? (
                      <img
                        src={invitation.avatar_url || "/placeholder.svg"}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-500 text-lg font-medium">
                        {(invitation.display_name || invitation.username || "U")[0].toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">
                      {invitation.display_name || invitation.username || "Usuario"}
                    </p>
                    {invitation.username && (
                      <p className="text-xs text-gray-500">@{invitation.username}</p>
                    )}
                    <p className="text-xs text-amber-600 mt-0.5">Pendiente de aceptar</p>
                  </div>
                  <button
                    onClick={() => cancelGroupInvitation(invitation.id)}
                    disabled={cancellingInvitation === invitation.id}
                    className="p-2 hover:bg-gray-100 rounded-full"
                  >
                    {cancellingInvitation === invitation.id ? (
                      <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
                    ) : (
                      <X className="w-5 h-5 text-gray-400" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Members list */}
          {loadingMembers ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
            </div>
          ) : groupMembers.length === 0 && pendingInvitations.length === 0 ? (
            <div className="text-center py-12 px-4">
              <p className="text-gray-500">Este grupo no tiene miembros</p>
              <p className="text-sm text-gray-400 mt-1">Anade personas de tus contactos</p>
            </div>
          ) : (
            <>
              {groupMembers.length > 0 && (
                <div className="px-4 py-2 bg-gray-50">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Miembros
                  </p>
                </div>
              )}
              {groupMembers.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center gap-3 px-4 py-3 border-b border-gray-100"
                >
                  <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden">
                    {member.avatar_url ? (
                      <img
                        src={member.avatar_url || "/placeholder.svg"}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-500 text-lg font-medium">
                        {member.contact_name[0].toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">
                      {member.username || member.contact_name}
                    </p>
                  </div>
                  <button
                    onClick={() => removeMemberFromGroup(member)}
                    className="px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    Quitar del grupo
                  </button>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    )
  }

  // =====================
  // MAIN VIEW
  // =====================
  return (
    <div className="fixed inset-0 z-[200] bg-white flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-[max(16px,env(safe-area-inset-top))] pb-3 border-b border-gray-100">
        <button onClick={onClose} className="p-2 -ml-2">
          <ChevronLeft className="w-6 h-6 text-gray-800" />
        </button>
        <h2 className="text-lg font-semibold text-gray-900">Personas y grupos</h2>
        <button className="p-2 -mr-2">
          <UserPlus className="w-5 h-5 text-gray-800" />
        </button>
      </div>

      {/* Search bar */}
      <div className="px-4 py-3">
        <div className="bg-gray-100 rounded-full px-4 py-2.5 flex items-center gap-3">
          <Search className="w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Busca o anade por nombre o usuario"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent border-none outline-none text-base text-gray-900 placeholder:text-gray-500"
          />
          {isSearching && <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 pb-32">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
          </div>
        ) : (
          <>
            {/* Search Results */}
            {searchQuery.length >= 2 && searchResults.length > 0 && (
              <div className="mb-6">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
                  Usuarios en VLADI
                </p>
                {searchResults.map((user) => (
                  <div key={user.id} className="flex items-center justify-between py-3 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
                        {user.avatar_url ? (
                          <img src={user.avatar_url || "/placeholder.svg"} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-500 font-medium">
                            {user.username[0].toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{user.display_name || user.username}</p>
                        <p className="text-sm text-gray-500">@{user.username}</p>
                      </div>
                    </div>

                    {user.isFriend ? (
                      <span className="text-sm text-green-600 flex items-center gap-1">
                        <Check className="w-4 h-4" /> Anadido
                      </span>
                    ) : user.isPending ? (
                      <span className="text-sm text-gray-400">Pendiente</span>
                    ) : (
                      <button
                        onClick={() => sendFriendRequest(user.id, user.username)}
                        disabled={sendingRequest === user.id}
                        className="p-2 rounded-full bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-50"
                      >
                        {sendingRequest === user.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <UserPlus className="w-4 h-4" />
                        )}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Pending requests */}
            {pendingRequests.length > 0 && (
              <div className="mb-6">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
                  Solicitudes pendientes ({pendingRequests.length})
                </p>
                {pendingRequests.map((request) => (
                  <div key={request.id} className="flex items-center justify-between py-3 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
                        {request.avatar_url ? (
                          <img src={request.avatar_url || "/placeholder.svg"} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-500 font-medium">
                            {request.username[0].toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{request.display_name || request.username}</p>
                        <p className="text-sm text-gray-500">@{request.username}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {processingRequest === request.id ? (
                        <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
                      ) : (
                        <>
                          <button
                            onClick={() => acceptFriendRequest(request)}
                            className="p-2 rounded-full bg-green-500 text-white hover:bg-green-600"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => rejectFriendRequest(request)}
                            className="p-2 rounded-full bg-gray-200 text-gray-600 hover:bg-gray-300"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Personas section */}
            <div className="mb-6">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
                Personas
              </p>
              {contacts.length === 0 ? (
                <p className="text-sm text-gray-400 py-2">Aun no tienes personas anadidas</p>
              ) : (
                contacts.map((contact) => (
                  <div key={contact.id} className="flex items-center justify-between py-3 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
                        {contact.avatar_url ? (
                          <img src={contact.avatar_url || "/placeholder.svg"} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-500 font-medium">
                            {contact.contact_name[0].toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {contact.display_name || contact.username || contact.contact_name}
                        </p>
                        {contact.username && (
                          <p className="text-sm text-gray-500">@{contact.username}</p>
                        )}
                      </div>
                    </div>
                    <div className="relative" ref={openDropdownId === contact.id ? dropdownRef : null}>
                      <button
                        onClick={() => setOpenDropdownId(openDropdownId === contact.id ? null : contact.id)}
                        disabled={removingContact === contact.id}
                        className="p-2 hover:bg-gray-100 rounded-full"
                      >
                        {removingContact === contact.id ? (
                          <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
                        ) : (
                          <MoreHorizontal className="w-5 h-5 text-gray-400" />
                        )}
                      </button>
                      
                      {/* Dropdown menu */}
                      {openDropdownId === contact.id && (
                        <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-1 z-50">
                          <button
                            onClick={() => {
                              removeContact(contact)
                              setOpenDropdownId(null)
                            }}
                            className="w-full flex items-center gap-3 px-4 py-3 text-left text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span className="text-sm font-medium">Quitar persona</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Grupos section */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Grupos
                </p>
                <button
                  onClick={handleCreateGroup}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  + Crear nuevo grupo
                </button>
              </div>

              {groups.length === 0 ? (
                <p className="text-sm text-gray-400 py-2">No tienes grupos creados</p>
              ) : (
                <div className="space-y-2">
                  {groups.map((group) => (
                    <button
                      key={group.id}
                      onClick={() => openGroupDetail(group)}
                      className="w-full flex items-center justify-between px-4 py-3 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                    >
                      <span className="font-medium text-gray-900">{group.name}</span>
                      <ChevronRight className="w-5 h-5 text-gray-300" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Empty state for search */}
            {searchQuery.length >= 2 && searchResults.length === 0 && !isSearching && (
              <div className="text-center py-8">
                <p className="text-gray-500">No se encontraron usuarios con "{searchQuery}"</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

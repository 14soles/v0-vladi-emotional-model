"use client"

import { useState, useEffect, useCallback } from "react"
import { ChevronLeft, ChevronRight, Search, UserPlus, Check, Loader2, X, MoreHorizontal, Plus } from "lucide-react"
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
  const [loadingMembers, setLoadingMembers] = useState(false)
  
  // Add members state
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set())
  const [addingMembers, setAddingMembers] = useState(false)

  // Load data on mount
  useEffect(() => {
    if (userId) {
      loadData()
    } else {
      setIsLoading(false)
    }
  }, [userId])

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
    if (!userId) return

    setSendingRequest(targetUserId)
    try {
      const { error: requestError } = await supabase.from("friend_requests").insert({
        from_user_id: userId,
        to_user_id: targetUserId,
        status: "pending",
      })

      if (requestError) throw requestError

      await supabase.from("contacts").upsert({
        user_id: userId,
        contact_user_id: targetUserId,
        contact_name: targetUsername,
        friendship_status: "pending_sent",
      })

      setSearchResults((prev) => prev.map((r) => (r.id === targetUserId ? { ...r, isPending: true } : r)))
    } catch (error) {
      handleError(error, "error", {
        userId,
        action: "send_friend_request",
        component: "GroupsPeopleScreen",
      })
    }
    setSendingRequest(null)
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
      await supabase.from("contacts").upsert({
        user_id: userId,
        contact_user_id: request.from_user_id,
        contact_name: request.display_name || request.username,
        friendship_status: "accepted",
      })

      // Create/update contact for them
      const { data: myProfile } = await supabase
        .from("profiles")
        .select("display_name, username")
        .eq("id", userId)
        .single()

      await supabase.from("contacts").upsert({
        user_id: request.from_user_id,
        contact_user_id: userId,
        contact_name: myProfile?.display_name || myProfile?.username || "Usuario",
        friendship_status: "accepted",
      })

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
      await supabase.from("contacts").delete().eq("id", contact.id)
      await supabase.from("contacts").delete().eq("user_id", contact.contact_user_id).eq("contact_user_id", userId)
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

    try {
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
      const invitations = selectedContactsList
        .filter(c => c.contact_user_id) // Only contacts with user accounts
        .map((contact) => ({
          group_id: selectedGroup.id,
          inviter_id: userId,
          invited_user_id: contact.contact_user_id,
          status: "pending",
        }))

      if (invitations.length > 0) {
        // Insert invitations (ignore conflicts if already invited)
        const { error } = await supabase.from("group_invitations").upsert(
          invitations,
          { onConflict: "group_id,invited_user_id", ignoreDuplicates: true }
        )
        
        if (error) throw error
      }

      // Go back to group detail
      setViewState("group-detail")
      setSelectedContacts(new Set())
    } catch (error) {
      handleError(error, "error", {
        userId,
        action: "send_group_invitations",
        component: "GroupsPeopleScreen",
      })
    }
    setAddingMembers(false)
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

  // Filter contacts not already in group for add members view
  const availableContacts = contacts.filter(
    (c) => !groupMembers.some((m) => m.contact_id === c.id)
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
            <h2 className="text-base font-semibold text-gray-900">Invitar al grupo</h2>
            <p className="text-xs text-gray-500">{selectedContacts.size} seleccionados</p>
          </div>
          <button
            onClick={addSelectedMembers}
            disabled={selectedContacts.size === 0 || addingMembers}
            className="text-base font-medium text-gray-900 disabled:text-gray-300"
          >
            {addingMembers ? <Loader2 className="w-5 h-5 animate-spin" /> : "Invitar"}
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
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-[max(16px,env(safe-area-inset-top))] pb-3 border-b border-gray-100">
          <button onClick={() => setViewState("main")} className="p-2 -ml-2">
            <ChevronLeft className="w-6 h-6 text-gray-800" />
          </button>
          <h2 className="text-lg font-semibold text-gray-900">{selectedGroup.name}</h2>
          <div className="w-10" />
        </div>

        {/* Member count and search */}
        <div className="px-4 py-3 flex items-center justify-between border-b border-gray-100">
          <p className="text-sm font-medium text-gray-900">
            {groupMembers.length} miembro{groupMembers.length !== 1 ? "s" : ""}
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
            <span className="font-medium text-gray-900">Anadir miembros</span>
          </button>

          {/* Members list */}
          {loadingMembers ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
            </div>
          ) : groupMembers.length === 0 ? (
            <div className="text-center py-12 px-4">
              <p className="text-gray-500">Este grupo no tiene miembros</p>
              <p className="text-sm text-gray-400 mt-1">Anade personas de tus contactos</p>
            </div>
          ) : (
            groupMembers.map((member) => (
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
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>
            ))
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
                    <button
                      onClick={() => removeContact(contact)}
                      disabled={removingContact === contact.id}
                      className="p-2 hover:bg-gray-100 rounded-full"
                    >
                      {removingContact === contact.id ? (
                        <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
                      ) : (
                        <MoreHorizontal className="w-5 h-5 text-gray-400" />
                      )}
                    </button>
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

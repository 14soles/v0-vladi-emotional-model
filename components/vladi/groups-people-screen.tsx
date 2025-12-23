"use client"

import { useState, useEffect } from "react"
import { ChevronLeft, ChevronRight, Search, UserPlus, Check, Loader2, X } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { handleError } from "@/lib/error-handler"

interface GroupsPeopleScreenProps {
  onClose: () => void
  userId?: string
}

interface Group {
  id: string
  name: string
  subtitle: string
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
  avatar_url?: string | null
}

export function GroupsPeopleScreen({ onClose, userId }: GroupsPeopleScreenProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [groups, setGroups] = useState<Group[]>([
    { id: "todos", name: "Todos", subtitle: "Añadir o quitar nuevas personas" },
    { id: "amigos", name: "Amigos/as", subtitle: "Editar grupo de personas" },
    { id: "familia", name: "Familia", subtitle: "Editar grupo de personas" },
    { id: "psicologo", name: "Psicólogo", subtitle: "Editar grupo de personas" },
  ])
  const [contacts, setContacts] = useState<Contact[]>([])
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [sendingRequest, setSendingRequest] = useState<string | null>(null)
  const [showAllContacts, setShowAllContacts] = useState(false)
  const [removingContact, setRemovingContact] = useState<string | null>(null)

  // Cargar grupos y contactos al montar
  useEffect(() => {
    if (userId) {
      loadData()
    } else {
      setIsLoading(false)
    }
  }, [userId])

  // Buscar usuarios cuando cambia la query
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.length >= 2 && userId) {
        searchUsers()
      } else {
        setSearchResults([])
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery, userId])

  const loadData = async () => {
    if (!userId) return
    setIsLoading(true)
    try {
      // Cargar grupos personalizados
      const { data: groupsData } = await supabase
        .from("privacy_groups")
        .select("id, name, is_system")
        .eq("user_id", userId)
        .order("is_system", { ascending: false })

      if (groupsData && groupsData.length > 0) {
        setGroups(
          groupsData.map((g) => ({
            id: g.id,
            name: g.name,
            subtitle: g.is_system ? "Añadir o quitar nuevas personas" : "Editar grupo de personas",
          })),
        )
      }

      const { data: contactsData } = await supabase
        .from("contacts")
        .select("id, contact_user_id, contact_name, friendship_status")
        .eq("user_id", userId)
        .eq("friendship_status", "accepted")

      if (contactsData && contactsData.length > 0) {
        // Fetch profiles for contacts
        const contactUserIds = contactsData.filter((c) => c.contact_user_id).map((c) => c.contact_user_id)

        let profileMap = new Map()
        if (contactUserIds.length > 0) {
          const { data: profiles } = await supabase
            .from("profiles")
            .select("id, username, avatar_url")
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
              avatar_url: profile?.avatar_url,
            }
          }),
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
      // Buscar usuarios por username o display_name
      const { data: users, error } = await supabase
        .from("profiles")
        .select("id, username, display_name, avatar_url")
        .or(`username.ilike.%${searchQuery}%,display_name.ilike.%${searchQuery}%`)
        .neq("id", userId)
        .limit(20)

      if (error) throw error

      // Verificar estado de amistad con cada usuario
      const { data: friendships } = await supabase
        .from("contacts")
        .select("contact_user_id, friendship_status")
        .eq("user_id", userId)

      const friendMap = new Map(friendships?.map((f) => [f.contact_user_id, f.friendship_status]) || [])

      // Verificar solicitudes pendientes enviadas
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
        metadata: { query: searchQuery },
      })
    }
    setIsSearching(false)
  }

  const sendFriendRequest = async (targetUserId: string, targetUsername: string) => {
    if (!userId) return

    setSendingRequest(targetUserId)
    try {
      // Crear solicitud de amistad
      const { error: requestError } = await supabase.from("friend_requests").insert({
        from_user_id: userId,
        to_user_id: targetUserId,
        status: "pending",
      })

      if (requestError) throw requestError

      // Crear contacto con estado pending_sent
      await supabase.from("contacts").upsert({
        user_id: userId,
        contact_user_id: targetUserId,
        contact_name: targetUsername,
        friendship_status: "pending_sent",
      })

      // Actualizar resultados de búsqueda
      setSearchResults((prev) => prev.map((r) => (r.id === targetUserId ? { ...r, isPending: true } : r)))
    } catch (error) {
      handleError(error, "error", {
        userId,
        action: "send_friend_request",
        component: "GroupsPeopleScreen",
        metadata: { targetUserId },
      })
    }
    setSendingRequest(null)
  }

  const removeContact = async (contact: Contact) => {
    if (!userId || !contact.contact_user_id) return

    setRemovingContact(contact.id)
    try {
      // Eliminar contacto de mi lista
      await supabase.from("contacts").delete().eq("id", contact.id)

      // Eliminar de la lista del otro usuario también
      await supabase.from("contacts").delete().eq("user_id", contact.contact_user_id).eq("contact_user_id", userId)

      // Actualizar estado local
      setContacts((prev) => prev.filter((c) => c.id !== contact.id))
    } catch (error) {
      handleError(error, "error", {
        userId,
        action: "remove_contact",
        component: "GroupsPeopleScreen",
        metadata: { contactId: contact.id },
      })
    }
    setRemovingContact(null)
  }

  const handleCreateGroup = async () => {
    const newGroupName = prompt("Nombre del nuevo grupo:")
    if (newGroupName && newGroupName.trim()) {
      try {
        const { data, error } = await supabase
          .from("privacy_groups")
          .insert({
            user_id: userId,
            name: newGroupName,
            is_system: false,
          })
          .select()
          .single()

        if (!error && data) {
          setGroups((prev) => [
            ...prev,
            {
              id: data.id,
              name: data.name,
              subtitle: "Editar grupo de personas",
            },
          ])
        }
      } catch (error) {
        handleError(error, "error", {
          userId,
          action: "create_group",
          component: "GroupsPeopleScreen",
          metadata: { groupName: newGroupName },
        })
      }
    }
  }

  const handleGroupClick = (group: Group) => {
    if (group.name === "Todos") {
      setShowAllContacts(true)
    }
  }

  const filteredGroups = groups.filter((g) => g.name.toLowerCase().includes(searchQuery.toLowerCase()))

  const filteredContacts = contacts.filter(
    (c) =>
      c.contact_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.username?.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  // Vista de todos los contactos
  if (showAllContacts) {
    return (
      <div className="fixed inset-0 z-[200] bg-white flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-[max(16px,env(safe-area-inset-top))] pb-4 border-b border-gray-100">
          <button onClick={() => setShowAllContacts(false)} className="p-2 -ml-2">
            <ChevronLeft className="w-6 h-6 text-gray-800" />
          </button>
          <h2 className="text-lg font-semibold text-gray-900">Todos</h2>
          <div className="w-10" />
        </div>

        {/* Search bar */}
        <div className="px-5 py-4">
          <div className="bg-gray-100 rounded-full px-4 py-3 flex items-center gap-3">
            <Search className="w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Busca personas"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent border-none outline-none text-base text-gray-900 placeholder:text-gray-500"
            />
            {isSearching && <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 pb-32">
          {/* Search Results - añadir nuevas personas */}
          {searchQuery.length >= 2 && searchResults.length > 0 && (
            <div className="mb-6">
              <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">Añadir personas</h3>
              {searchResults.map((user) => (
                <div key={user.id} className="flex items-center justify-between py-4 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden">
                      {user.avatar_url ? (
                        <img
                          src={user.avatar_url || "/placeholder.svg"}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-500 text-lg font-medium">
                          {user.username[0].toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{user.username}</p>
                      {user.display_name && <p className="text-sm text-gray-500">{user.display_name}</p>}
                    </div>
                  </div>

                  {user.isFriend ? (
                    <span className="text-sm text-green-600 flex items-center gap-1">
                      <Check className="w-4 h-4" /> Añadido
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
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <UserPlus className="w-5 h-5" />
                      )}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Lista de contactos confirmados */}
          <div>
            <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">
              Tus personas ({filteredContacts.length})
            </h3>
            {filteredContacts.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">Aún no tienes personas añadidas</p>
                <p className="text-sm text-gray-400 mt-1">Busca por nombre o usuario para añadir</p>
              </div>
            ) : (
              filteredContacts.map((contact) => (
                <div key={contact.id} className="flex items-center py-4 border-b border-gray-100">
                  <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden">
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
                  <div className="ml-4 flex-1">
                    <p className="font-medium text-gray-900">{contact.username || contact.contact_name}</p>
                  </div>
                  {/* Botón eliminar */}
                  <button
                    onClick={() => removeContact(contact)}
                    disabled={removingContact === contact.id}
                    className="p-2 rounded-full hover:bg-gray-100"
                  >
                    {removingContact === contact.id ? (
                      <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
                    ) : (
                      <X className="w-5 h-5 text-gray-400" />
                    )}
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-[200] bg-white flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-[max(16px,env(safe-area-inset-top))] pb-4 border-b border-gray-100">
        <button onClick={onClose} className="p-2 -ml-2">
          <ChevronLeft className="w-6 h-6 text-gray-800" />
        </button>
        <h2 className="text-lg font-semibold text-gray-900">Grupos y personas</h2>
        <button className="p-2 -mr-2">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="10" cy="8" r="4" />
            <path d="M10 14c-4 0-7 2-7 4v2h14v-2c0-2-3-4-7-4z" />
            <path d="M19 8v6M16 11h6" />
          </svg>
        </button>
      </div>

      {/* Search bar */}
      <div className="px-5 py-4">
        <div className="bg-gray-100 rounded-full px-4 py-3 flex items-center gap-3">
          <Search className="w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Busca por nombre o usuario"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent border-none outline-none text-base text-gray-900 placeholder:text-gray-500"
          />
          {isSearching && <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 pb-32">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
          </div>
        ) : (
          <>
            {/* Search Results - mostrar cuando hay búsqueda activa */}
            {searchQuery.length >= 2 && searchResults.length > 0 && (
              <div className="mb-6">
                <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">Usuarios en VLADI</h3>
                {searchResults.map((user) => (
                  <div key={user.id} className="flex items-center justify-between py-4 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden">
                        {user.avatar_url ? (
                          <img
                            src={user.avatar_url || "/placeholder.svg"}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-500 text-lg font-medium">
                            {user.username[0].toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{user.username}</p>
                        {user.display_name && <p className="text-sm text-gray-500">{user.display_name}</p>}
                      </div>
                    </div>

                    {user.isFriend ? (
                      <span className="text-sm text-green-600 flex items-center gap-1">
                        <Check className="w-4 h-4" /> Amigo
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
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <UserPlus className="w-5 h-5" />
                        )}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Groups list */}
            {(!searchQuery || filteredGroups.length > 0) && (
              <>
                {filteredGroups.map((group) => (
                  <button
                    key={group.id}
                    onClick={() => handleGroupClick(group)}
                    className="w-full flex items-center justify-between py-5 border-b border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    <div className="text-left">
                      <span className="text-xl font-normal text-gray-900">{group.name}</span>
                      <p className="text-sm text-gray-400">{group.subtitle}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-300" />
                  </button>
                ))}

                <button
                  onClick={handleCreateGroup}
                  className="w-full flex items-center gap-2 py-5 text-gray-700 hover:text-gray-900 transition-colors"
                >
                  <span className="text-lg">+</span>
                  <span className="text-base">Crear nuevo grupo de personas</span>
                </button>

                {/* Separador y listado de contactos */}
                {contacts.length > 0 && (
                  <>
                    <div className="border-t border-gray-200 my-4" />
                    <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">
                      Tus personas ({contacts.length})
                    </h3>
                    {contacts.slice(0, 5).map((contact) => (
                      <div key={contact.id} className="flex items-center py-3 border-b border-gray-100">
                        <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
                          {contact.avatar_url ? (
                            <img
                              src={contact.avatar_url || "/placeholder.svg"}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-500 font-medium">
                              {contact.contact_name[0].toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="ml-3 flex-1">
                          <p className="font-medium text-gray-900 text-sm">
                            {contact.username || contact.contact_name}
                          </p>
                        </div>
                      </div>
                    ))}
                    {contacts.length > 5 && (
                      <button
                        onClick={() => setShowAllContacts(true)}
                        className="w-full py-3 text-sm text-gray-500 hover:text-gray-700"
                      >
                        Ver todos ({contacts.length})
                      </button>
                    )}
                  </>
                )}
              </>
            )}

            {/* Empty state for search */}
            {searchQuery.length >= 2 && searchResults.length === 0 && !isSearching && (
              <div className="text-center py-12">
                <p className="text-gray-500">No se encontraron usuarios con "{searchQuery}"</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

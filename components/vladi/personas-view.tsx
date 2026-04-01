"use client"

import { useState, useEffect, useCallback } from "react"
import { Search, MoreHorizontal, CheckCheck, MessageCircle, UserPlus } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { CommonHeader } from "./common-header"

interface PersonasViewProps {
  userId?: string
  userProfile?: {
    username: string
    display_name: string | null
    avatar_url: string | null
  }
  onAvatarClick?: () => void
  onNotificationsClick?: () => void
  notificationCount?: number
  onPersonasClick?: () => void
}

interface PersonaEntry {
  id: string
  user_id: string
  username: string
  display_name: string | null
  avatar_url: string | null
  emotion: string
  quadrant: string
  created_at: string
  views_count: number
  comments_count: number
}

const QUADRANT_BORDER_COLORS: Record<string, string> = {
  green: "#94B22E",
  yellow: "#E6B04F",
  red: "#E6584F",
  blue: "#466D91",
}

const QUADRANT_DOT_COLORS: Record<string, string> = {
  green: "#94B22E",
  yellow: "#E6B04F",
  red: "#E6584F",
  blue: "#466D91",
}

function timeAgo(dateStr: string): string {
  const now = new Date()
  const date = new Date(dateStr)
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMin < 1) return "Ahora"
  if (diffMin < 60) return `Hace ${diffMin} min`
  if (diffHours < 24) return `Hace ${diffHours} h`
  if (diffDays === 1) return "Ayer"
  return `Hace ${diffDays} d`
}

// Demo groups for testing
const DEMO_GROUPS = [
  { id: "demo-familia", name: "Familia" },
  { id: "demo-amigos", name: "Amigos" },
  { id: "demo-trabajo", name: "Trabajo" },
]

// Demo data for testing the UI when no real contacts exist
const DEMO_PERSONAS: PersonaEntry[] = [
  {
    id: "demo-1",
    user_id: "demo-1",
    username: "angelaferris",
    display_name: "Angela Ferris",
    avatar_url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face",
    emotion: "satisfecha",
    quadrant: "green",
    created_at: new Date(Date.now() - 5 * 60000).toISOString(),
    views_count: 346,
    comments_count: 12,
  },
  {
    id: "demo-2",
    user_id: "demo-2",
    username: "javito0858",
    display_name: "Javier Lopez",
    avatar_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
    emotion: "aburrido",
    quadrant: "blue",
    created_at: new Date(Date.now() - 60 * 60000).toISOString(),
    views_count: 13,
    comments_count: 3,
  },
  {
    id: "demo-3",
    user_id: "demo-3",
    username: "sergiomugy",
    display_name: "Sergio Muguruza",
    avatar_url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face",
    emotion: "tranquilo",
    quadrant: "green",
    created_at: new Date(Date.now() - 2 * 3600000).toISOString(),
    views_count: 50,
    comments_count: 6,
  },
  {
    id: "demo-4",
    user_id: "demo-4",
    username: "nataliaagarcia",
    display_name: "Natalia Garcia",
    avatar_url: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
    emotion: "enfadada",
    quadrant: "red",
    created_at: new Date(Date.now() - 6 * 3600000).toISOString(),
    views_count: 25,
    comments_count: 78,
  },
  {
    id: "demo-5",
    user_id: "demo-5",
    username: "sergiowash",
    display_name: "Sergio Washington",
    avatar_url: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
    emotion: "triste",
    quadrant: "blue",
    created_at: new Date(Date.now() - 12 * 3600000).toISOString(),
    views_count: 29,
    comments_count: 33,
  },
  {
    id: "demo-6",
    user_id: "demo-6",
    username: "elviraanchel",
    display_name: "Elvira Anchel",
    avatar_url: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face",
    emotion: "preocupada",
    quadrant: "red",
    created_at: new Date(Date.now() - 13 * 3600000).toISOString(),
    views_count: 54,
    comments_count: 32,
  },
]

export function PersonasView({
  userId,
  userProfile,
  onAvatarClick,
  onNotificationsClick,
  notificationCount = 0,
  onPersonasClick,
}: PersonasViewProps) {
  const [personas, setPersonas] = useState<PersonaEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedFilter, setSelectedFilter] = useState("todos")
  const [groups, setGroups] = useState<{ id: string; name: string }[]>([])

  // Load user's groups
  useEffect(() => {
    if (!userId) return

    const loadGroups = async () => {
      const { data } = await supabase
        .from("group_members")
        .select("group:groups(id, name)")
        .eq("user_id", userId)

      if (data) {
        const groupList = data
          .map((item) => item.group)
          .filter((g): g is { id: string; name: string } => g !== null)
        setGroups(groupList.length > 0 ? groupList : DEMO_GROUPS)
      } else {
        setGroups(DEMO_GROUPS)
      }
    }
    loadGroups()
  }, [userId])

  // Load personas (contacts with their latest emotion)
  const loadPersonas = useCallback(async () => {
    if (!userId) {
      // Show demo data when not logged in
      setPersonas(DEMO_PERSONAS)
      setIsLoading(false)
      return
    }

    try {
      // Get all accepted contacts
      const { data: contactsData } = await supabase
        .from("contacts")
        .select("user_id, contact_user_id")
        .or(`user_id.eq.${userId},contact_user_id.eq.${userId}`)
        .eq("friendship_status", "accepted")

      const contactIds = new Set<string>()
      contactsData?.forEach((c) => {
        if (c.user_id === userId) {
          contactIds.add(c.contact_user_id)
        } else {
          contactIds.add(c.user_id)
        }
      })

      // If filtering by group, get group members
      if (selectedFilter !== "todos" && selectedFilter !== "solo_yo") {
        const { data: groupMembers } = await supabase
          .from("group_members")
          .select("user_id")
          .eq("group_id", selectedFilter)

        if (groupMembers) {
          const groupMemberIds = new Set(groupMembers.map((m) => m.user_id))
          // Intersect with contacts
          for (const id of contactIds) {
            if (!groupMemberIds.has(id)) {
              contactIds.delete(id)
            }
          }
        }
      }

      if (selectedFilter === "solo_yo") {
        contactIds.clear()
        contactIds.add(userId)
      }

      if (contactIds.size === 0) {
        setPersonas([])
        setIsLoading(false)
        return
      }

      // Get latest emotion entry for each contact
      const { data: entriesData } = await supabase
        .from("emotion_entries")
        .select(`
          id,
          user_id,
          emotion,
          quadrant,
          created_at,
          views_count,
          profile:profiles!emotion_entries_user_id_fkey(
            username,
            display_name,
            avatar_url
          )
        `)
        .in("user_id", Array.from(contactIds))
        .order("created_at", { ascending: false })

      // Group by user and take latest
      const latestByUser = new Map<string, PersonaEntry>()
      
      entriesData?.forEach((entry) => {
        if (!latestByUser.has(entry.user_id)) {
          const profile = Array.isArray(entry.profile) ? entry.profile[0] : entry.profile
          latestByUser.set(entry.user_id, {
            id: entry.id,
            user_id: entry.user_id,
            username: profile?.username || "Usuario",
            display_name: profile?.display_name || null,
            avatar_url: profile?.avatar_url || null,
            emotion: entry.emotion,
            quadrant: entry.quadrant,
            created_at: entry.created_at,
            views_count: entry.views_count || 0,
            comments_count: 0, // Will be loaded separately if needed
          })
        }
      })

      // Load comments count for each entry
      const entryIds = Array.from(latestByUser.values()).map((p) => p.id)
      if (entryIds.length > 0) {
        const { data: commentsData } = await supabase
          .from("emotion_comments")
          .select("emotion_entry_id")
          .in("emotion_entry_id", entryIds)

        if (commentsData) {
          const commentCounts = new Map<string, number>()
          commentsData.forEach((c) => {
            commentCounts.set(c.emotion_entry_id, (commentCounts.get(c.emotion_entry_id) || 0) + 1)
          })
          latestByUser.forEach((persona) => {
            persona.comments_count = commentCounts.get(persona.id) || 0
          })
        }
      }

      const realPersonas = Array.from(latestByUser.values())
      // Use demo data if no real contacts exist
      setPersonas(realPersonas.length > 0 ? realPersonas : DEMO_PERSONAS)
    } catch (error) {
      console.error("Error loading personas:", error)
      // Fallback to demo data on error
      setPersonas(DEMO_PERSONAS)
    } finally {
      setIsLoading(false)
    }
  }, [userId, selectedFilter])

  useEffect(() => {
    loadPersonas()
  }, [loadPersonas])

  // Filter personas by search query
  const filteredPersonas = personas.filter((p) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      p.username.toLowerCase().includes(query) ||
      (p.display_name && p.display_name.toLowerCase().includes(query))
    )
  })

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <CommonHeader
        title="Personas"
        userProfile={userProfile}
        onAvatarClick={onAvatarClick}
        onNotificationsClick={onNotificationsClick}
        notificationCount={notificationCount}
      />

      {/* Search bar */}
      <div className="px-4 pb-3">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Busca por nombre o usuario"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-gray-100 rounded-full text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200"
          />
        </div>
      </div>

      {/* Filter pills */}
      <div className="px-4 pb-4">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setSelectedFilter("todos")}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors flex-shrink-0 border ${
              selectedFilter === "todos"
                ? "bg-gray-900 text-white border-gray-900"
                : "bg-white text-gray-900 border-gray-300 hover:bg-gray-50"
            }`}
          >
            Todos
          </button>

          {groups.map((group) => (
            <button
              key={group.id}
              onClick={() => setSelectedFilter(group.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors flex-shrink-0 border ${
                selectedFilter === group.id
                  ? "bg-gray-900 text-white border-gray-900"
                  : "bg-white text-gray-900 border-gray-300 hover:bg-gray-50"
              }`}
            >
              {group.name}
            </button>
          ))}

          {/* Add person button */}
          <button
            onClick={onPersonasClick}
            className="p-2 rounded-full bg-white border border-gray-300 text-gray-900 hover:bg-gray-50 transition-colors flex-shrink-0"
            aria-label="Agregar persona"
          >
            <UserPlus className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Personas grid */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
          </div>
        ) : filteredPersonas.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p className="text-sm">No hay personas para mostrar</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filteredPersonas.map((persona) => (
              <div
                key={persona.id}
                className="bg-white rounded-2xl p-4 relative overflow-hidden"
                style={{
                  backgroundColor: "#F8F8F8",
                  borderLeft: `4px solid ${QUADRANT_BORDER_COLORS[persona.quadrant] || "#94B22E"}`,
                }}
              >
                {/* Menu button */}
                <button className="absolute top-3 right-3 text-gray-400 hover:text-gray-600">
                  <MoreHorizontal className="w-5 h-5" />
                </button>

                {/* Avatar */}
                <div className="flex justify-center mb-3">
                  <div className="w-14 h-14 rounded-full bg-gray-200 overflow-hidden">
                    {persona.avatar_url ? (
                      <img
                        src={persona.avatar_url}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-500 text-lg font-medium">
                        {persona.username[0].toUpperCase()}
                      </div>
                    )}
                  </div>
                </div>

                {/* Username */}
                <p className="text-sm font-semibold text-gray-900 text-center truncate">
                  {persona.display_name || persona.username}
                </p>

                {/* Time ago */}
                <p className="text-xs text-gray-400 text-center mb-2">
                  {timeAgo(persona.created_at)}
                </p>

                {/* Emotion */}
                <div className="flex items-center justify-center gap-1.5 mb-3">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: QUADRANT_DOT_COLORS[persona.quadrant] || "#94B22E" }}
                  />
                  <span className="text-sm text-gray-700">{persona.emotion}</span>
                </div>

                {/* Stats */}
                <div className="flex items-center justify-center gap-4 text-gray-500">
                  <div className="flex items-center gap-1">
                    <CheckCheck className="w-4 h-4" />
                    <span className="text-xs">{persona.views_count}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MessageCircle className="w-4 h-4" />
                    <span className="text-xs">{persona.comments_count}</span>
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

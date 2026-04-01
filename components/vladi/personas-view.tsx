"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Search, MoreHorizontal, CheckCheck, MessageCircle, UserPlus, X, Trash2, UserMinus, Send, Reply } from "lucide-react"
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
  has_viewed?: boolean
  is_read?: boolean
}

interface Comment {
  id: string
  content: string
  author_id: string
  created_at: string
  parent_id: string | null
  author: {
    username: string
    avatar_url: string | null
  }
  replies?: Comment[]
}

// Gradient colors for unread entries (based on quadrant)
const QUADRANT_GRADIENTS: Record<string, string> = {
  green: "linear-gradient(180deg, #94B22E 0%, #C4D88E 100%)",
  yellow: "linear-gradient(180deg, #E6B04F 0%, #F5D89A 100%)",
  red: "linear-gradient(180deg, #E6584F 0%, #F5A39D 100%)",
  blue: "linear-gradient(180deg, #466D91 0%, #8FAFC9 100%)",
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

function formatTimeAgo(dateStr: string): string {
  const now = new Date()
  const date = new Date(dateStr)
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return "ahora"
  if (diffMin < 60) return `${diffMin}m`
  const diffHours = Math.floor(diffMs / 3600000)
  if (diffHours < 24) return `${diffHours}h`
  const diffDays = Math.floor(diffMs / 86400000)
  return `${diffDays}d`
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
    is_read: false,
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
    is_read: false,
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
    is_read: false,
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
    is_read: false,
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
    is_read: true,
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
    is_read: true,
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
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null)
  const [commentsModalId, setCommentsModalId] = useState<string | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [loadingComments, setLoadingComments] = useState(false)
  const [newComment, setNewComment] = useState("")
  const [replyingTo, setReplyingTo] = useState<Comment | null>(null)
  const [sendingComment, setSendingComment] = useState(false)
  const commentInputRef = useRef<HTMLInputElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpenId(null)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Load user's groups
  useEffect(() => {
    if (!userId) {
      setGroups(DEMO_GROUPS)
      return
    }

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
        setPersonas(DEMO_PERSONAS)
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

      // Check which entries the user has viewed
      const entryIds = entriesData?.map((e) => e.id) || []
      let viewedEntries = new Set<string>()
      if (entryIds.length > 0) {
        const { data: viewsData } = await supabase
          .from("emotion_views")
          .select("entry_id")
          .eq("viewer_id", userId)
          .in("entry_id", entryIds)
        
        viewedEntries = new Set(viewsData?.map((v) => v.entry_id) || [])
      }

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
            comments_count: 0,
            has_viewed: viewedEntries.has(entry.id),
            is_read: viewedEntries.has(entry.id),
          })
        }
      })

      // Load comments count for each entry
      const uniqueEntryIds = Array.from(latestByUser.values()).map((p) => p.id)
      if (uniqueEntryIds.length > 0) {
        const { data: commentsData } = await supabase
          .from("emotion_comments")
          .select("entry_id")
          .in("entry_id", uniqueEntryIds)

        if (commentsData) {
          const commentCounts = new Map<string, number>()
          commentsData.forEach((c) => {
            commentCounts.set(c.entry_id, (commentCounts.get(c.entry_id) || 0) + 1)
          })
          latestByUser.forEach((persona) => {
            persona.comments_count = commentCounts.get(persona.id) || 0
          })
        }
      }

      const realPersonas = Array.from(latestByUser.values())
      // Sort by created_at descending (most recent first)
      realPersonas.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      setPersonas(realPersonas.length > 0 ? realPersonas : DEMO_PERSONAS)
    } catch (error) {
      console.error("Error loading personas:", error)
      setPersonas(DEMO_PERSONAS)
    } finally {
      setIsLoading(false)
    }
  }, [userId, selectedFilter])

  useEffect(() => {
    loadPersonas()
  }, [loadPersonas])

  // Toggle view (mark as seen)
  const toggleView = async (entryId: string, hasViewed: boolean) => {
    if (!userId) return

    // Optimistic update
    setPersonas((prev) =>
      prev.map((p) =>
        p.id === entryId
          ? {
              ...p,
              has_viewed: !hasViewed,
              is_read: !hasViewed || p.is_read,
              views_count: hasViewed ? Math.max(0, p.views_count - 1) : p.views_count + 1,
            }
          : p
      )
    )

    try {
      if (hasViewed) {
        await supabase.from("emotion_views").delete().eq("entry_id", entryId).eq("viewer_id", userId)
      } else {
        await supabase.from("emotion_views").upsert(
          { entry_id: entryId, viewer_id: userId },
          { onConflict: "entry_id,viewer_id" }
        )
      }
    } catch (error) {
      console.error("Error toggling view:", error)
      // Revert optimistic update on error
      setPersonas((prev) =>
        prev.map((p) =>
          p.id === entryId
            ? {
                ...p,
                has_viewed: hasViewed,
                views_count: hasViewed ? p.views_count + 1 : Math.max(0, p.views_count - 1),
              }
            : p
        )
      )
    }
  }

  // Mark as read when clicking the card
  const markAsRead = async (persona: PersonaEntry) => {
    if (!userId || persona.is_read || persona.has_viewed) return
    
    setPersonas((prev) =>
      prev.map((p) =>
        p.id === persona.id ? { ...p, is_read: true, has_viewed: true, views_count: p.views_count + 1 } : p
      )
    )
    
    try {
      await supabase.from("emotion_views").upsert(
        { entry_id: persona.id, viewer_id: userId },
        { onConflict: "entry_id,viewer_id" }
      )
    } catch (error) {
      console.error("Error marking as read:", error)
    }
  }

  // Remove contact
  const removeContact = async (contactUserId: string) => {
    if (!userId) return
    setMenuOpenId(null)

    try {
      await supabase
        .from("contacts")
        .delete()
        .or(`and(user_id.eq.${userId},contact_user_id.eq.${contactUserId}),and(user_id.eq.${contactUserId},contact_user_id.eq.${userId})`)

      setPersonas((prev) => prev.filter((p) => p.user_id !== contactUserId))
    } catch (error) {
      console.error("Error removing contact:", error)
    }
  }

  // Open comments modal
  const openComments = async (entryId: string) => {
    setCommentsModalId(entryId)
    setLoadingComments(true)
    setReplyingTo(null)
    setNewComment("")

    try {
      const { data } = await supabase
        .from("emotion_comments")
        .select(`
          id,
          content,
          author_id,
          created_at,
          parent_comment_id
        `)
        .eq("entry_id", entryId)
        .order("created_at", { ascending: true })

      if (data && data.length > 0) {
        // Get author profiles
        const authorIds = [...new Set(data.map((c) => c.author_id))]
        const { data: authorsData } = await supabase
          .from("profiles")
          .select("id, username, avatar_url")
          .in("id", authorIds)

        const authorsMap = new Map(authorsData?.map((a) => [a.id, a]) || [])

        const commentsMap = new Map<string, Comment>()
        const rootComments: Comment[] = []

        data.forEach((c) => {
          const author = authorsMap.get(c.author_id)
          const comment: Comment = {
            id: c.id,
            content: c.content,
            author_id: c.author_id,
            created_at: c.created_at,
            parent_id: c.parent_comment_id,
            author: {
              username: author?.username || "Usuario",
              avatar_url: author?.avatar_url || null,
            },
            replies: [],
          }
          commentsMap.set(c.id, comment)
        })

        commentsMap.forEach((comment) => {
          if (comment.parent_id && commentsMap.has(comment.parent_id)) {
            commentsMap.get(comment.parent_id)!.replies!.push(comment)
          } else if (!comment.parent_id) {
            rootComments.push(comment)
          }
        })

        setComments(rootComments)
      } else {
        setComments([])
      }
    } catch (error) {
      console.error("Error loading comments:", error)
    } finally {
      setLoadingComments(false)
    }
  }

  // Submit comment
  const submitComment = async () => {
    if (!userId || !commentsModalId || !newComment.trim() || sendingComment) return

    setSendingComment(true)
    try {
      const { data, error } = await supabase
        .from("emotion_comments")
        .insert({
          entry_id: commentsModalId,
          author_id: userId,
          content: newComment.trim(),
          parent_comment_id: replyingTo?.id || null,
        })
        .select("id, content, author_id, created_at, parent_comment_id")
        .single()

      if (error) throw error

      if (data) {
        const newCommentObj: Comment = {
          id: data.id,
          content: data.content,
          author_id: data.author_id,
          created_at: data.created_at,
          parent_id: data.parent_comment_id,
          author: {
            username: userProfile?.username || "Usuario",
            avatar_url: userProfile?.avatar_url || null,
          },
          replies: [],
        }

        if (replyingTo) {
          setComments((prev) =>
            prev.map((c) =>
              c.id === replyingTo.id ? { ...c, replies: [...(c.replies || []), newCommentObj] } : c
            )
          )
        } else {
          setComments((prev) => [...prev, newCommentObj])
        }

        setPersonas((prev) =>
          prev.map((p) => (p.id === commentsModalId ? { ...p, comments_count: p.comments_count + 1 } : p))
        )
      }

      setNewComment("")
      setReplyingTo(null)
    } catch (error) {
      console.error("Error submitting comment:", error)
    } finally {
      setSendingComment(false)
    }
  }

  // Start reply to a comment
  const startReply = (comment: Comment) => {
    setReplyingTo(comment)
    setNewComment(`@${comment.author.username} `)
    commentInputRef.current?.focus()
  }

  // Cancel reply
  const cancelReply = () => {
    setReplyingTo(null)
    setNewComment("")
  }

  // Delete comment
  const deleteComment = async (commentId: string) => {
    try {
      await supabase.from("emotion_comments").delete().eq("id", commentId)
      setComments((prev) => {
        const removeComment = (comments: Comment[]): Comment[] => {
          return comments
            .filter((c) => c.id !== commentId)
            .map((c) => ({ ...c, replies: removeComment(c.replies || []) }))
        }
        return removeComment(prev)
      })
      if (commentsModalId) {
        setPersonas((prev) =>
          prev.map((p) =>
            p.id === commentsModalId ? { ...p, comments_count: Math.max(0, p.comments_count - 1) } : p
          )
        )
      }
    } catch (error) {
      console.error("Error deleting comment:", error)
    }
  }

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
            {filteredPersonas.map((persona) => {
              const isUnread = !persona.is_read && !persona.has_viewed
              
              return (
                <div
                  key={persona.id}
                  onClick={() => markAsRead(persona)}
                  className="relative rounded-2xl overflow-hidden cursor-pointer"
                  style={{
                    background: isUnread 
                      ? QUADRANT_GRADIENTS[persona.quadrant] || QUADRANT_GRADIENTS.green
                      : "#E8E8E8",
                    padding: "3px",
                  }}
                >
                  <div
                    className="bg-white rounded-[14px] p-4 relative h-full"
                    style={{ backgroundColor: "#F8F8F8" }}
                  >
                    {/* Menu button */}
                    <div className="absolute top-3 right-3">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation()
                          setMenuOpenId(menuOpenId === persona.id ? null : persona.id)
                        }}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <MoreHorizontal className="w-5 h-5" />
                      </button>

                      {/* Dropdown menu */}
                      {menuOpenId === persona.id && (
                        <div className="absolute right-0 top-6 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-10 min-w-[160px]">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              removeContact(persona.user_id)
                            }}
                            className="w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                          >
                            <UserMinus className="w-4 h-4" />
                            Quitar de personas
                          </button>
                        </div>
                      )}
                    </div>

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
                      {persona.username}
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
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleView(persona.id, persona.has_viewed || false)
                        }}
                        className={`flex items-center gap-1 transition-colors ${
                          persona.has_viewed ? "text-[#84CACA]" : "text-gray-400 hover:text-gray-600"
                        }`}
                      >
                        <CheckCheck className="w-4 h-4" />
                        <span className="text-xs">{persona.views_count}</span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          openComments(persona.id)
                        }}
                        className="flex items-center gap-1 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <MessageCircle className="w-4 h-4" />
                        <span className="text-xs">{persona.comments_count}</span>
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Close menu when clicking outside */}
      {menuOpenId && (
        <div className="fixed inset-0 z-[5]" onClick={() => setMenuOpenId(null)} />
      )}

      {/* Comments Modal */}
      {commentsModalId && (
        <div
          className="fixed inset-0 bg-black/50 z-[100] flex items-end sm:items-center justify-center"
          onClick={() => {
            setCommentsModalId(null)
            setReplyingTo(null)
            setNewComment("")
          }}
        >
          <div
            className="bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl flex flex-col"
            style={{ maxHeight: "70vh", marginBottom: "env(safe-area-inset-bottom)" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">Comentarios</h3>
              <button
                onClick={() => {
                  setCommentsModalId(null)
                  setReplyingTo(null)
                  setNewComment("")
                }}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Comments list */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              {loadingComments ? (
                <div className="text-center text-gray-400 py-8">Cargando...</div>
              ) : comments.length === 0 ? (
                <div className="text-center text-gray-400 py-8">No hay comentarios aun</div>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="space-y-3">
                    {/* Main comment */}
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                        {comment.author.avatar_url ? (
                          <img src={comment.author.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs font-medium">
                            {comment.author.username.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm text-gray-900">{comment.author.username}</span>
                          <span className="text-xs text-gray-400">{formatTimeAgo(comment.created_at)}</span>
                          {comment.author_id === userId && (
                            <button onClick={() => deleteComment(comment.id)} className="text-red-500 hover:text-red-600 ml-auto">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                        <p className="text-sm text-gray-700 mt-0.5">{comment.content}</p>
                        <button
                          onClick={() => startReply(comment)}
                          className="text-xs text-gray-500 hover:text-gray-700 mt-1"
                        >
                          Responder
                        </button>
                      </div>
                    </div>

                    {/* Replies */}
                    {comment.replies && comment.replies.length > 0 && (
                      <div className="ml-11 space-y-3">
                        {comment.replies.map((reply) => (
                          <div key={reply.id} className="flex gap-3">
                            <div className="w-6 h-6 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                              {reply.author.avatar_url ? (
                                <img src={reply.author.avatar_url} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-500 text-[10px] font-medium">
                                  {reply.author.username.charAt(0).toUpperCase()}
                                </div>
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-xs text-gray-900">{reply.author.username}</span>
                                <span className="text-[10px] text-gray-400">{formatTimeAgo(reply.created_at)}</span>
                                {reply.author_id === userId && (
                                  <button onClick={() => deleteComment(reply.id)} className="text-red-500 hover:text-red-600 ml-auto">
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                              <p className="text-xs text-gray-700 mt-0.5">{reply.content}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Comment input */}
            <div className="px-5 py-4 border-t border-gray-100 bg-white shrink-0">
              {replyingTo && (
                <div className="flex items-center justify-between mb-2 px-2">
                  <span className="text-xs text-gray-500">
                    Respondiendo a <span className="font-medium">@{replyingTo.author.username}</span>
                  </span>
                  <button onClick={cancelReply} className="text-xs text-gray-400 hover:text-gray-600">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
              <div className="flex gap-2">
                <input
                  ref={commentInputRef}
                  type="text"
                  placeholder={replyingTo ? "Escribe una respuesta..." : "Escribe un comentario..."}
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && submitComment()}
                  className="flex-1 px-4 py-2.5 bg-gray-100 rounded-full text-sm outline-none focus:ring-2 focus:ring-gray-200"
                  autoComplete="off"
                />
                <button
                  onClick={submitComment}
                  disabled={!newComment.trim() || sendingComment}
                  className="p-2.5 bg-gray-900 text-white rounded-full disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { MessageCircle, Play, MoreHorizontal, CheckCheck, X, Send, UserMinus, Trash2 } from "lucide-react"
import { supabase } from "@/lib/supabase/client"

interface SocialFeedProps {
  userId?: string
}

interface FeedEntry {
  id: string
  user_id: string
  emotion: string
  quadrant: string
  intensity: number
  wellbeing: number
  notes: string | null
  views_count: number
  created_at: string
  intervention_used: string | null
  profile: {
    username: string
    display_name: string | null
    avatar_url: string | null
  }
  comments_count: number
  is_public: boolean
  has_viewed: boolean
  is_own: boolean
}

interface Comment {
  id: string
  content: string
  created_at: string
  author_id: string
  author: {
    username: string
    avatar_url: string | null
  }
}

const QUADRANT_COLORS: Record<string, string> = {
  green: "bg-[#94B22E]",
  yellow: "bg-[#E6B04F]",
  red: "bg-[#E6584F]",
  blue: "bg-[#466D91]",
}

const INTERVENTION_NAMES: Record<string, string> = {
  breathing: "Respiración guiada",
  grounding: "Grounding 5-4-3-2-1",
  reframe: "Reencuadre cognitivo",
  gratitude: "Práctica de gratitud",
  meditation: "Meditación",
  journaling: "Escritura terapéutica",
}

export function SocialFeed({ userId }: SocialFeedProps) {
  const [entries, setEntries] = useState<FeedEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [commentsModalId, setCommentsModalId] = useState<string | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState("")
  const [loadingComments, setLoadingComments] = useState(false)
  const [sendingComment, setSendingComment] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const loadFeed = useCallback(async () => {
    if (!userId) {
      setIsLoading(false)
      return
    }

    try {
      // Get accepted contacts (bidirectional)
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

      // Include own user to see own posts
      contactIds.add(userId)

      if (contactIds.size === 0) {
        setEntries([])
        setIsLoading(false)
        return
      }

      // Get public emotions from contacts
      const { data: entriesData } = await supabase
        .from("emotion_entries")
        .select("*")
        .in("user_id", Array.from(contactIds))
        .eq("is_public", true)
        .order("created_at", { ascending: false })
        .limit(50)

      if (!entriesData || entriesData.length === 0) {
        setEntries([])
        setIsLoading(false)
        return
      }

      // Get profiles for entries
      const userIds = [...new Set(entriesData.map((e) => e.user_id))]
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, username, display_name, avatar_url")
        .in("id", userIds)

      const profilesMap = new Map(profilesData?.map((p) => [p.id, p]) || [])

      // Get views by current user
      const entryIds = entriesData.map((e) => e.id)
      const { data: viewsData } = await supabase
        .from("emotion_views")
        .select("entry_id")
        .eq("viewer_id", userId)
        .in("entry_id", entryIds)

      const viewedSet = new Set(viewsData?.map((v) => v.entry_id) || [])

      // Get comment counts
      const { data: commentsData } = await supabase.from("emotion_comments").select("entry_id").in("entry_id", entryIds)

      const commentCounts = new Map<string, number>()
      commentsData?.forEach((c) => {
        commentCounts.set(c.entry_id, (commentCounts.get(c.entry_id) || 0) + 1)
      })

      // Build feed entries
      const feedEntries: FeedEntry[] = entriesData.map((entry) => {
        const profile = profilesMap.get(entry.user_id)
        return {
          id: entry.id,
          user_id: entry.user_id,
          emotion: entry.emotion,
          quadrant: entry.quadrant || "green",
          intensity: entry.intensity || 5,
          wellbeing: entry.wellbeing || 5,
          notes: entry.notes,
          views_count: entry.views_count || 0,
          created_at: entry.created_at,
          intervention_used: entry.intervention_used,
          profile: {
            username: profile?.username || "usuario",
            display_name: profile?.display_name || null,
            avatar_url: profile?.avatar_url || null,
          },
          comments_count: commentCounts.get(entry.id) || 0,
          is_public: entry.is_public,
          has_viewed: viewedSet.has(entry.id),
          is_own: entry.user_id === userId,
        }
      })

      setEntries(feedEntries)
    } catch (error) {
      console.error("Error loading feed:", error)
    } finally {
      setIsLoading(false)
    }
  }, [userId])

  useEffect(() => {
    loadFeed()
  }, [loadFeed])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuId(null)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const toggleView = async (entryId: string, currentlyViewed: boolean) => {
    if (!userId) return

    setEntries((prev) =>
      prev.map((e) =>
        e.id === entryId
          ? {
              ...e,
              has_viewed: !currentlyViewed,
              views_count: currentlyViewed ? Math.max(0, e.views_count - 1) : e.views_count + 1,
            }
          : e,
      ),
    )

    try {
      if (currentlyViewed) {
        await supabase.from("emotion_views").delete().eq("entry_id", entryId).eq("viewer_id", userId)
      } else {
        await supabase.from("emotion_views").insert({
          entry_id: entryId,
          viewer_id: userId,
        })

        // Update views count
        const entry = entries.find((e) => e.id === entryId)
        if (entry && entry.user_id !== userId) {
          await supabase
            .from("emotion_entries")
            .update({ views_count: (entry.views_count || 0) + 1 })
            .eq("id", entryId)
        }
      }
    } catch (error) {
      console.error("Error toggling view:", error)
    }
  }

  const loadComments = async (entryId: string) => {
    setLoadingComments(true)
    try {
      const { data: commentsData } = await supabase
        .from("emotion_comments")
        .select("id, content, created_at, author_id")
        .eq("entry_id", entryId)
        .order("created_at", { ascending: true })

      if (commentsData && commentsData.length > 0) {
        const authorIds = [...new Set(commentsData.map((c) => c.author_id))]
        const { data: authorsData } = await supabase
          .from("profiles")
          .select("id, username, avatar_url")
          .in("id", authorIds)

        const authorsMap = new Map(authorsData?.map((a) => [a.id, a]) || [])

        const commentsWithAuthors: Comment[] = commentsData.map((c) => ({
          id: c.id,
          content: c.content,
          created_at: c.created_at,
          author_id: c.author_id,
          author: {
            username: authorsMap.get(c.author_id)?.username || "usuario",
            avatar_url: authorsMap.get(c.author_id)?.avatar_url || null,
          },
        }))

        setComments(commentsWithAuthors)
      } else {
        setComments([])
      }
    } catch (error) {
      console.error("Error loading comments:", error)
    } finally {
      setLoadingComments(false)
    }
  }

  const openComments = (entryId: string) => {
    setCommentsModalId(entryId)
    loadComments(entryId)
  }

  const sendComment = async () => {
    if (!newComment.trim() || !commentsModalId || !userId) return

    setSendingComment(true)
    try {
      const { data, error } = await supabase
        .from("emotion_comments")
        .insert({
          entry_id: commentsModalId,
          author_id: userId,
          content: newComment.trim(),
        })
        .select()
        .single()

      if (error) throw error

      // Reload comments
      await loadComments(commentsModalId)

      // Update comment count in entries
      setEntries((prev) =>
        prev.map((e) => (e.id === commentsModalId ? { ...e, comments_count: e.comments_count + 1 } : e)),
      )

      setNewComment("")
    } catch (error) {
      console.error("Error sending comment:", error)
    } finally {
      setSendingComment(false)
    }
  }

  const deleteComment = async (commentId: string) => {
    if (!commentsModalId) return

    try {
      await supabase.from("emotion_comments").delete().eq("id", commentId)

      setComments((prev) => prev.filter((c) => c.id !== commentId))
      setEntries((prev) =>
        prev.map((e) => (e.id === commentsModalId ? { ...e, comments_count: Math.max(0, e.comments_count - 1) } : e)),
      )
    } catch (error) {
      console.error("Error deleting comment:", error)
    }
  }

  const removeContact = async (contactUserId: string) => {
    if (!userId) return

    try {
      await supabase
        .from("contacts")
        .delete()
        .or(
          `and(user_id.eq.${userId},contact_user_id.eq.${contactUserId}),and(user_id.eq.${contactUserId},contact_user_id.eq.${userId})`,
        )

      // Remove entries from that user
      setEntries((prev) => prev.filter((e) => e.user_id !== contactUserId))
      setOpenMenuId(null)
    } catch (error) {
      console.error("Error removing contact:", error)
    }
  }

  const deleteEntry = async (entryId: string) => {
    try {
      await supabase.from("emotion_entries").delete().eq("id", entryId)
      setEntries((prev) => prev.filter((e) => e.id !== entryId))
      setOpenMenuId(null)
    } catch (error) {
      console.error("Error deleting entry:", error)
    }
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)

    if (diffMins < 1) return "Ahora"
    if (diffMins < 60) return `Hace ${diffMins} min`
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `Hace ${diffHours}h`
    const diffDays = Math.floor(diffHours / 24)
    return `Hace ${diffDays}d`
  }

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-gray-400">Cargando actividad...</div>
      </div>
    )
  }

  if (entries.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
          <MessageCircle className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Sin actividad</h3>
        <p className="text-sm text-gray-500">
          Cuando tus contactos compartan emociones, aparecerán aquí. Añade contactos desde la pestaña Chats.
        </p>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {entries.map((entry) => (
        <div key={entry.id} className="px-5 py-4 border-b border-gray-100">
          {/* Header */}
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                {entry.profile.avatar_url ? (
                  <img
                    src={entry.profile.avatar_url || "/placeholder.svg"}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-500 text-sm font-medium">
                    {entry.profile.username.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900">{entry.profile.username}</span>
                  <span className="text-gray-500 text-sm">se siente</span>
                  <span className={`w-2.5 h-2.5 rounded-full ${QUADRANT_COLORS[entry.quadrant]}`} />
                  <span className="font-medium text-gray-900">{entry.emotion}</span>
                </div>
                <div className="text-xs text-gray-400">{formatTimeAgo(entry.created_at)}</div>
              </div>
            </div>

            {/* Menu */}
            <div className="relative" ref={openMenuId === entry.id ? menuRef : null}>
              <button
                onClick={() => setOpenMenuId(openMenuId === entry.id ? null : entry.id)}
                className="p-1 -mr-1 text-gray-400 hover:text-gray-600"
              >
                <MoreHorizontal className="w-5 h-5" />
              </button>

              {openMenuId === entry.id && (
                <div className="absolute right-0 top-8 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50 min-w-[180px]">
                  {entry.is_own ? (
                    <button
                      onClick={() => deleteEntry(entry.id)}
                      className="w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Eliminar publicación
                    </button>
                  ) : (
                    <button
                      onClick={() => removeContact(entry.user_id)}
                      className="w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                    >
                      <UserMinus className="w-4 h-4" />
                      Quitar de personas
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          {entry.notes && <p className="text-gray-700 mb-3 text-[15px] leading-relaxed">{entry.notes}</p>}

          {/* Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Views */}
              <button
                onClick={() => toggleView(entry.id, entry.has_viewed)}
                className={`flex items-center gap-1.5 transition-colors ${entry.has_viewed ? "text-[#84CACA]" : "text-gray-400 hover:text-gray-600"}`}
              >
                <CheckCheck className="w-5 h-5" />
                <span className="text-sm text-gray-600">{entry.views_count}</span>
              </button>

              {/* Comments */}
              <button
                onClick={() => openComments(entry.id)}
                className="flex items-center gap-1.5 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <MessageCircle className="w-5 h-5" />
                <span className="text-sm text-gray-600">{entry.comments_count}</span>
              </button>
            </div>

            {/* Intervention button */}
            {entry.intervention_used && (
              <button className="flex items-center gap-2 px-3 py-1.5 bg-gray-900 text-white rounded-full text-xs">
                <Play className="w-3 h-3 fill-current" />
                <span>DEAM EQ · {INTERVENTION_NAMES[entry.intervention_used] || "Actividad"}</span>
              </button>
            )}
          </div>
        </div>
      ))}

      {/* Comments Modal */}
      {commentsModalId && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center"
          onClick={() => setCommentsModalId(null)}
        >
          <div
            className="bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl max-h-[80vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">Comentarios</h3>
              <button onClick={() => setCommentsModalId(null)} className="p-1 text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Comments list */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              {loadingComments ? (
                <div className="text-center text-gray-400 py-8">Cargando...</div>
              ) : comments.length === 0 ? (
                <div className="text-center text-gray-400 py-8">No hay comentarios aún</div>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                      {comment.author.avatar_url ? (
                        <img
                          src={comment.author.avatar_url || "/placeholder.svg"}
                          alt=""
                          className="w-full h-full object-cover"
                        />
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
                          <button
                            onClick={() => deleteComment(comment.id)}
                            className="text-red-500 hover:text-red-600 ml-auto"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      <p className="text-sm text-gray-700 mt-0.5">{comment.content}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Input */}
            <div className="px-5 py-4 border-t border-gray-100">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Escribe un comentario..."
                  className="flex-1 px-4 py-2.5 bg-gray-100 rounded-full text-sm outline-none focus:ring-2 focus:ring-gray-200"
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendComment()}
                />
                <button
                  onClick={sendComment}
                  disabled={!newComment.trim() || sendingComment}
                  className="p-2.5 bg-gray-900 text-white rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
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

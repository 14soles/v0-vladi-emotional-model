"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { MessageCircle, Play, MoreHorizontal, CheckCheck, X, Send, UserMinus, Trash2, Reply } from "lucide-react"
import { supabase } from "@/lib/supabase/client"

interface SocialFeedProps {
  userId?: string
  filterGroupId?: string // Added filterGroupId prop to filter feed by group
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
  parent_comment_id: string | null
  author: {
    username: string
    avatar_url: string | null
  }
  replies?: Comment[]
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

export function SocialFeed({ userId, filterGroupId }: SocialFeedProps) {
  const [entries, setEntries] = useState<FeedEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [commentsModalId, setCommentsModalId] = useState<string | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState("")
  const [loadingComments, setLoadingComments] = useState(false)
  const [sendingComment, setSendingComment] = useState(false)
  const [replyingTo, setReplyingTo] = useState<{ id: string; username: string } | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const commentInputRef = useRef<HTMLInputElement>(null)

  const loadFeed = useCallback(async () => {
    if (!userId) {
      setIsLoading(false)
      return
    }

    try {
      const contactIds = new Set<string>()

      // If filterGroupId is "todos" or undefined, show all contacts
      if (!filterGroupId || filterGroupId === "todos") {
        // Get accepted contacts (bidirectional)
        const { data: contactsData } = await supabase
          .from("contacts")
          .select("user_id, contact_user_id")
          .or(`user_id.eq.${userId},contact_user_id.eq.${userId}`)
          .eq("friendship_status", "accepted")

        contactsData?.forEach((c) => {
          if (c.user_id === userId) {
            contactIds.add(c.contact_user_id)
          } else {
            contactIds.add(c.user_id)
          }
        })
      } else {
        // Filter by specific group
        // First, get the group members
        const { data: groupMembers } = await supabase
          .from("group_members")
          .select("contact_id")
          .eq("group_id", filterGroupId)

        if (groupMembers && groupMembers.length > 0) {
          // Get the contact user IDs from the contact_ids
          const contactIdsArray = groupMembers.map((m) => m.contact_id)
          const { data: contacts } = await supabase
            .from("contacts")
            .select("contact_user_id")
            .in("id", contactIdsArray)
            .eq("user_id", userId)

          contacts?.forEach((c) => {
            if (c.contact_user_id) {
              contactIds.add(c.contact_user_id)
            }
          })
        }
      }

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
      const { data: allViewsData } = await supabase
        .from("emotion_views")
        .select("entry_id, viewer_id")
        .in("entry_id", entryIds)

      // Count views per entry and check if current user has viewed
      const viewCountsMap = new Map<string, number>()
      const userViewedSet = new Set<string>()

      allViewsData?.forEach((v) => {
        viewCountsMap.set(v.entry_id, (viewCountsMap.get(v.entry_id) || 0) + 1)
        if (v.viewer_id === userId) {
          userViewedSet.add(v.entry_id)
        }
      })

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
          views_count: viewCountsMap.get(entry.id) || 0,
          created_at: entry.created_at,
          intervention_used: entry.intervention_used,
          profile: {
            username: profile?.username || "usuario",
            display_name: profile?.display_name || null,
            avatar_url: profile?.avatar_url || null,
          },
          comments_count: commentCounts.get(entry.id) || 0,
          is_public: entry.is_public,
          has_viewed: userViewedSet.has(entry.id),
          is_own: entry.user_id === userId,
        }
      })

      setEntries(feedEntries)
    } catch (error) {
      console.error("Error loading feed:", error)
    } finally {
      setIsLoading(false)
    }
  }, [userId, filterGroupId])

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

    // Find the entry to get owner info
    const entry = entries.find(e => e.id === entryId)
    if (!entry) return

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
        // Remove the view
        await supabase.from("emotion_views").delete().eq("entry_id", entryId).eq("viewer_id", userId)
        
        // Also remove the notification (if it exists)
        await supabase
          .from("social_notifications")
          .delete()
          .eq("entry_id", entryId)
          .eq("from_user_id", userId)
          .eq("notification_type", "view")
      } else {
        // Add the view
        await supabase.from("emotion_views").upsert(
          {
            entry_id: entryId,
            viewer_id: userId,
          },
          {
            onConflict: "entry_id,viewer_id",
          },
        )
        
        // Create notification for the entry owner (only if not own entry)
        if (entry.user_id !== userId) {
          await supabase.from("social_notifications").upsert(
            {
              notification_type: "view",
              from_user_id: userId,
              to_user_id: entry.user_id,
              entry_id: entryId,
              emotion_name: entry.emotion,
            },
            {
              onConflict: "entry_id,from_user_id,notification_type",
            },
          )
        }
      }
    } catch (error) {
      console.error("Error toggling view:", error)
      setEntries((prev) =>
        prev.map((e) =>
          e.id === entryId
            ? {
                ...e,
                has_viewed: currentlyViewed,
                views_count: currentlyViewed ? e.views_count + 1 : Math.max(0, e.views_count - 1),
              }
            : e,
        ),
      )
    }
  }

  const loadComments = async (entryId: string) => {
    setLoadingComments(true)
    setReplyingTo(null)
    try {
      const { data: commentsData } = await supabase
        .from("emotion_comments")
        .select("id, content, created_at, author_id, parent_comment_id")
        .eq("entry_id", entryId)
        .order("created_at", { ascending: true })

      if (commentsData && commentsData.length > 0) {
        const authorIds = [...new Set(commentsData.map((c) => c.author_id))]
        const { data: authorsData } = await supabase
          .from("profiles")
          .select("id, username, avatar_url")
          .in("id", authorIds)

        const authorsMap = new Map(authorsData?.map((a) => [a.id, a]) || [])

        // Separate root comments and replies
        const rootComments: Comment[] = []
        const repliesMap = new Map<string, Comment[]>()

        commentsData.forEach((c) => {
          const comment: Comment = {
            id: c.id,
            content: c.content,
            created_at: c.created_at,
            author_id: c.author_id,
            parent_comment_id: c.parent_comment_id,
            author: {
              username: authorsMap.get(c.author_id)?.username || "usuario",
              avatar_url: authorsMap.get(c.author_id)?.avatar_url || null,
            },
          }

          if (c.parent_comment_id) {
            const replies = repliesMap.get(c.parent_comment_id) || []
            replies.push(comment)
            repliesMap.set(c.parent_comment_id, replies)
          } else {
            rootComments.push(comment)
          }
        })

        // Attach replies to their parent comments
        const commentsWithReplies = rootComments.map((c) => ({
          ...c,
          replies: repliesMap.get(c.id) || [],
        }))

        setComments(commentsWithReplies)
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

    // Find the entry to get owner info
    const entry = entries.find(e => e.id === commentsModalId)
    if (!entry) return

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
        .select()
        .single()

      if (error) throw error

      // Create notification for the entry owner or reply target
      if (replyingTo) {
        // This is a reply - notify the comment author we're replying to
        const parentComment = comments.find(c => c.id === replyingTo.id) || 
                             comments.flatMap(c => c.replies || []).find(r => r.id === replyingTo.id)
        
        if (parentComment && parentComment.author_id !== userId) {
          await supabase.from("social_notifications").insert({
            notification_type: "comment_reply",
            from_user_id: userId,
            to_user_id: parentComment.author_id,
            entry_id: commentsModalId,
            comment_id: data.id,
            emotion_name: entry.emotion,
          })
        }
      } else {
        // This is a new comment - notify the entry owner
        if (entry.user_id !== userId) {
          await supabase.from("social_notifications").insert({
            notification_type: "comment",
            from_user_id: userId,
            to_user_id: entry.user_id,
            entry_id: commentsModalId,
            comment_id: data.id,
            emotion_name: entry.emotion,
          })
        }
      }

      // Reload comments
      await loadComments(commentsModalId)

      // Update comment count in entries
      setEntries((prev) =>
        prev.map((e) => (e.id === commentsModalId ? { ...e, comments_count: e.comments_count + 1 } : e)),
      )

      setNewComment("")
      setReplyingTo(null)
    } catch (error) {
      console.error("Error sending comment:", error)
    } finally {
      setSendingComment(false)
    }
  }

  const startReply = (comment: Comment) => {
    setReplyingTo({ id: comment.id, username: comment.author.username })
    setNewComment(`@${comment.author.username} `)
    commentInputRef.current?.focus()
  }

  const cancelReply = () => {
    setReplyingTo(null)
    setNewComment("")
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
          className="fixed inset-0 bg-black/50 z-[100] flex items-end sm:items-center justify-center"
          onClick={() => { setCommentsModalId(null); setReplyingTo(null); setNewComment(""); }}
        >
          <div
            className="bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl flex flex-col"
            style={{ maxHeight: "70vh", marginBottom: "env(safe-area-inset-bottom)" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">Comentarios</h3>
              <button onClick={() => { setCommentsModalId(null); setReplyingTo(null); setNewComment(""); }} className="p-1 text-gray-400 hover:text-gray-600">
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
                  <div key={comment.id} className="space-y-3">
                    {/* Main comment */}
                    <div className="flex gap-3">
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
                                <img
                                  src={reply.author.avatar_url || "/placeholder.svg"}
                                  alt=""
                                  className="w-full h-full object-cover"
                                />
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
                                  <button
                                    onClick={() => deleteComment(reply.id)}
                                    className="text-red-500 hover:text-red-600 ml-auto"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                              <p className="text-xs text-gray-700 mt-0.5">{reply.content}</p>
                              <button
                                onClick={() => startReply(reply)}
                                className="text-[10px] text-gray-500 hover:text-gray-700 mt-1"
                              >
                                Responder
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Input - Always visible at bottom */}
            <div className="px-5 py-4 border-t border-gray-100 bg-white shrink-0">
              {replyingTo && (
                <div className="flex items-center justify-between mb-2 px-2">
                  <span className="text-xs text-gray-500">
                    Respondiendo a <span className="font-medium">@{replyingTo.username}</span>
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
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder={replyingTo ? "Escribe una respuesta..." : "Escribe un comentario..."}
                  className="flex-1 px-4 py-2.5 bg-gray-100 rounded-full text-sm outline-none focus:ring-2 focus:ring-gray-200"
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendComment()}
                  autoComplete="off"
                />
                <button
                  onClick={sendComment}
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

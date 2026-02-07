"use client"

import { useState, useEffect, useCallback } from "react"
import { User, MapPin } from "lucide-react"
import { SocialFeed } from "./social-feed"
import { CommonHeader } from "./common-header"
import { supabase } from "@/lib/supabase/client"

interface HomeViewProps {
  userId?: string
  userProfile?: {
    username: string
    display_name: string | null
    avatar_url: string | null
  }
  onAvatarClick?: () => void
  onNotificationsClick?: () => void
  onPersonasClick?: () => void
  onRadarClick?: () => void
}

interface Group {
  id: string
  name: string
  is_system: boolean
}

export function HomeView({ userId, userProfile, onAvatarClick, onNotificationsClick, onPersonasClick, onRadarClick }: HomeViewProps) {
  const [selectedGroup, setSelectedGroup] = useState<string>("todos")
  const [groups, setGroups] = useState<Group[]>([])
  const [notificationCount, setNotificationCount] = useState(0)

  const loadNotificationCount = useCallback(async () => {
    if (!userId) return
    try {
      const { count } = await supabase
        .from("friend_requests")
        .select("*", { count: "exact", head: true })
        .eq("to_user_id", userId)
        .eq("status", "pending")

      setNotificationCount(count || 0)
    } catch (error) {
      console.error("Error loading notification count:", error)
    }
  }, [userId])

  const loadGroups = useCallback(async () => {
    if (!userId) return
    try {
      const { data, error } = await supabase
        .from("privacy_groups")
        .select("id, name, is_system")
        .eq("user_id", userId)
        .eq("is_system", false)
        .order("name", { ascending: true })

      if (!error && data) {
        setGroups(data)
      }
    } catch (error) {
      console.error("Error loading groups:", error)
    }
  }, [userId])

  useEffect(() => {
    loadNotificationCount()
    loadGroups()

    const channel = supabase
      .channel("groups_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "privacy_groups",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          loadGroups()
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [loadNotificationCount, loadGroups, userId])

  return (
    <div className="flex-1 overflow-y-auto bg-white min-h-0">
      <div className="w-full max-w-6xl mx-auto">
        <div className="sticky top-0 z-20 bg-white">
          <CommonHeader
            userProfile={userProfile}
            onAvatarClick={onAvatarClick}
            onNotificationsClick={onNotificationsClick}
            notificationCount={notificationCount}
          />
        </div>

        <div className="sticky top-[60px] z-10 bg-white px-5 pb-3 pt-2 border-b border-gray-100">
          <div
            className="flex items-center gap-2 overflow-x-auto"
            style={{
              scrollbarWidth: "none",
              msOverflowStyle: "none",
              WebkitOverflowScrolling: "touch",
            }}
          >
            <style jsx>{`
              div::-webkit-scrollbar {
                display: none;
              }
            `}</style>

            <button
              onClick={() => setSelectedGroup("todos")}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors flex-shrink-0 ${
                selectedGroup === "todos" ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Todos
            </button>

            <button
              onClick={() => setSelectedGroup("solo_yo")}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors flex-shrink-0 ${
                selectedGroup === "solo_yo" ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Solo yo
            </button>

            {groups.map((group) => (
              <button
                key={group.id}
                onClick={() => setSelectedGroup(group.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors flex-shrink-0 ${
                  selectedGroup === group.id ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {group.name}
              </button>
            ))}

            <button
              onClick={() => {
                if (onPersonasClick) {
                  onPersonasClick()
                }
              }}
              className="p-2 rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors flex-shrink-0 ml-1"
              aria-label="Configurar grupos"
              type="button"
            >
              <User className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Radar emocional banner */}
        <button
          onClick={onRadarClick}
          className="w-full px-5 py-3 border-b border-gray-100 flex items-center gap-3 hover:bg-gray-50 active:bg-gray-100 transition-colors"
        >
          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="12" r="10" />
              <circle cx="12" cy="12" r="6" />
              <circle cx="12" cy="12" r="2" />
              <line x1="12" y1="2" x2="12" y2="6" />
              <line x1="12" y1="18" x2="12" y2="22" />
              <line x1="2" y1="12" x2="6" y2="12" />
              <line x1="18" y1="12" x2="22" y2="12" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-gray-500" />
              <span className="text-sm text-gray-700 font-medium">Radar emocional</span>
            </div>
          </div>
          <svg className="w-4 h-4 text-gray-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>

        <SocialFeed userId={userId} filterGroupId={selectedGroup} />
      </div>
    </div>
  )
}

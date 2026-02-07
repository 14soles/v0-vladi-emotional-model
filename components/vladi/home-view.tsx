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
        <div className="px-4 py-3">
          <button
            onClick={onRadarClick}
            className="relative w-full rounded-2xl overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.08)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.12)] active:shadow-[0_1px_6px_rgba(0,0,0,0.06)] transition-shadow"
          >
            {/* Map background image */}
            <div className="absolute inset-0">
              <img
                src="/images/radar-map-bg.jpg"
                alt=""
                className="w-full h-full object-cover opacity-40"
                crossOrigin="anonymous"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-white/70 via-white/30 to-white/70" />
            </div>

            {/* Content */}
            <div className="relative flex items-center justify-between px-5 py-5">
              {/* Radar icon (concentric circles) */}
              <div className="flex-shrink-0">
                <svg className="w-12 h-12 text-gray-800" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <circle cx="24" cy="24" r="20" />
                  <circle cx="24" cy="24" r="13" />
                  <circle cx="24" cy="24" r="6" />
                  <circle cx="24" cy="24" r="2" fill="currentColor" />
                </svg>
              </div>

              {/* Location info */}
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-gray-700" />
                <span className="text-base text-gray-800 font-medium">30 personas &middot; 10km</span>
              </div>
            </div>
          </button>
        </div>

        <SocialFeed userId={userId} filterGroupId={selectedGroup} />
      </div>
    </div>
  )
}

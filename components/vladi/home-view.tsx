"use client"

import { useState, useEffect, useCallback } from "react"
import { ChevronDown } from "lucide-react"
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
}

export function HomeView({ userId, userProfile, onAvatarClick, onNotificationsClick }: HomeViewProps) {
  const [filter, setFilter] = useState<"para_ti" | "todos">("para_ti")
  const [showFilterMenu, setShowFilterMenu] = useState(false)
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

  useEffect(() => {
    loadNotificationCount()
  }, [loadNotificationCount])

  return (
    <div className="flex-1 flex flex-col bg-white">
      <CommonHeader
        userProfile={userProfile}
        onAvatarClick={onAvatarClick}
        onNotificationsClick={onNotificationsClick}
        notificationCount={notificationCount}
      />

      {/* Filter dropdown */}
      <div className="px-5 pb-3 border-b border-gray-100">
        <div className="relative inline-block">
          <button
            onClick={() => setShowFilterMenu(!showFilterMenu)}
            className="flex items-center gap-1 text-sm font-medium text-gray-700 hover:text-gray-900 active:scale-95 transition-transform"
          >
            {filter === "para_ti" ? "Para ti" : "Todos"}
            <ChevronDown className="w-4 h-4" />
          </button>

          {showFilterMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowFilterMenu(false)} />
              <div className="absolute left-0 top-8 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50 min-w-[120px]">
                <button
                  onClick={() => {
                    setFilter("para_ti")
                    setShowFilterMenu(false)
                  }}
                  className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 ${
                    filter === "para_ti" ? "font-medium text-gray-900" : "text-gray-600"
                  }`}
                >
                  Para ti
                </button>
                <button
                  onClick={() => {
                    setFilter("todos")
                    setShowFilterMenu(false)
                  }}
                  className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 ${
                    filter === "todos" ? "font-medium text-gray-900" : "text-gray-600"
                  }`}
                >
                  Todos
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <SocialFeed userId={userId} />
    </div>
  )
}

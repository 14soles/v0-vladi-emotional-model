"use client"

import { useState, useCallback, useEffect } from "react"
import { BottomNavbar } from "./bottom-navbar"
import { RecordView } from "./record-view"
import { EmotionScreen, type EmotionData } from "./emotion-screen"
import { ContextSheet } from "./context-sheet"
import { MirrorOverlay } from "./mirror-overlay"
import { ChatsView } from "./chats-view"
import { PlaceholderView } from "./placeholder-view"
import { HomeView } from "./home-view"
import { ProfileScreen } from "./profile-screen"
import { VladiChat } from "./vladi-chat" // Imported VladiChat component
import { NotificationsView } from "./notifications-view" // Imported NotificationsView component
import { useVladiStore, type MoodEntry } from "@/lib/vladi-store"
import type { QuadrantId } from "@/lib/vladi-data"
import { supabase } from "@/lib/supabase/client"
import { IEQPanel } from "./ieq-panel"
import { handleError } from "@/lib/error-handler"

interface VladiAppProps {
  userId?: string
  userProfile?: {
    id: string
    username: string
    display_name?: string
    email: string
    phone?: string
    avatar_url?: string
  } | null
}

export default function VladiApp({ userId, userProfile }: VladiAppProps) {
  const [activeTab, setActiveTab] = useState("record")
  const [currentScreen, setCurrentScreen] = useState<
    "main" | "emotion" | "context" | "mirror" | "vladi-chat" | "notifications"
  >("main")
  const [selectedQuadrant, setSelectedQuadrant] = useState<QuadrantId>("green")
  const [emotionData, setEmotionData] = useState<EmotionData | null>(null)
  const [contextData, setContextData] = useState<{ text: string; tags: string[] } | null>(null)
  const [showProfile, setShowProfile] = useState(false)
  const [notificationCount, setNotificationCount] = useState(0)
  const [vladiChatContext, setVladiChatContext] = useState<{
    emotion: string
    intensity: number
    wellbeing: number
    notes?: string
    contextTags?: string[]
  } | null>(null)

  const { addEntry } = useVladiStore()

  const userName = userProfile?.display_name || userProfile?.username || "Usuario"

  useEffect(() => {
    if (!userId) return

    let mounted = true

    const loadNotifications = async () => {
      try {
        const { count, error } = await supabase
          .from("friend_requests")
          .select("*", { count: "exact", head: true })
          .eq("to_user_id", userId)
          .eq("status", "pending")

        if (error) throw error
        if (mounted) {
          setNotificationCount(count || 0)
        }
      } catch (error) {
        handleError(error, "warning", {
          userId,
          action: "load_notifications",
          component: "VladiApp",
        })
      }
    }

    loadNotifications()

    return () => {
      mounted = false
    }
  }, [userId]) // Only depend on userId

  const handleStartCheckIn = useCallback((quadrant: QuadrantId) => {
    setSelectedQuadrant(quadrant)
    setCurrentScreen("emotion")
  }, [])

  const handleEmotionConfirm = useCallback((data: EmotionData) => {
    setEmotionData(data)
    setCurrentScreen("context")
  }, [])

  const handlePublish = useCallback(
    async (
      text: string,
      tags: string[],
      privacy: string,
      bodySignals?: string[],
      timeReference?: string,
      certainty?: string,
    ) => {
      if (!emotionData) return

      const entryId = crypto.randomUUID()

      const entry: MoodEntry = {
        id: entryId,
        timestamp: new Date().toISOString(),
        emotion: emotionData.emotion,
        quadrant: emotionData.quadrant,
        valence: emotionData.valence,
        energy: emotionData.energy,
        pleasantness: emotionData.pleasantness,
        intensity_before: emotionData.intensity,
        intensity_after: null,
        text,
        contextTags: tags,
        privacy,
      }

      addEntry(entry)

      if (userId) {
        const isPublic = privacy !== "Solo yo"

        const activityTags = tags.filter(
          (t) => !t.startsWith("Compañía:") && !t.startsWith("Actividad:") && !t.startsWith("custom:"),
        )
        const customActivity = tags.find((t) => t.startsWith("Actividad:"))?.replace("Actividad: ", "") || null
        const customCompany = tags.find((t) => t.startsWith("Compañía:"))?.replace("Compañía: ", "") || null
        const companyTags = tags.filter((t) => t.startsWith("Con:")).map((t) => t.replace("Con:", "").trim())

        const emotionFamilyMap: Record<string, { family: string; color: string }> = {
          green: { family: "en calma", color: "#94B22E" },
          yellow: { family: "con energía", color: "#E6B04F" },
          red: { family: "en tensión", color: "#E6584F" },
          blue: { family: "sin ánimo", color: "#466D91" },
        }

        const { family, color } = emotionFamilyMap[emotionData.quadrant] || {
          family: "desconocido",
          color: "#666666",
        }

        try {
          await supabase.from("emotion_entries").insert({
            id: entryId,
            user_id: userId,
            emotion: emotionData.emotion,
            quadrant: emotionData.quadrant,
            emotion_family: family,
            color: color,
            intensity: emotionData.energy, // Energy (0-100) saved as intensity
            wellbeing: emotionData.pleasantness,
            arousal: emotionData.energy / 100, // Normalized to 0-1
            valence: emotionData.valence,
            notes: text || null,
            context: tags.length > 0 ? tags.join(", ") : null,
            activity_tags: activityTags.length > 0 ? activityTags : null,
            company_tags: companyTags.length > 0 ? companyTags : null,
            custom_activity: customActivity,
            custom_company: customCompany,
            body_location: bodySignals && bodySignals.length > 0 ? bodySignals : null, // Save body locations
            when_occurred: timeReference || null, // Save time reference
            certainty_bucket: certainty || null, // Save certainty
            is_public: isPublic,
            created_at: new Date().toISOString(),
          })
        } catch (error) {
          handleError(error, "error", {
            userId,
            action: "save_emotion",
            component: "VladiApp",
            metadata: { emotionId: entryId },
          })
        }
      }

      setContextData({ text, tags })
      setCurrentScreen("mirror")
    },
    [emotionData, addEntry, userId],
  )

  const handleCloseMirror = useCallback(() => {
    setCurrentScreen("main")
    setEmotionData(null)
    setContextData(null)
  }, [])

  const handleStartChatFromMirror = useCallback(() => {
    if (emotionData && contextData) {
      setVladiChatContext({
        emotion: emotionData.emotion,
        intensity: emotionData.energy,
        wellbeing: emotionData.pleasantness,
        notes: contextData.text,
        contextTags: contextData.tags,
      })
    }
    setCurrentScreen("vladi-chat")
  }, [emotionData, contextData])

  const handleCloseEmotion = useCallback(() => {
    setCurrentScreen("main")
  }, [])

  const handleCloseContext = useCallback(() => {
    setCurrentScreen("emotion")
  }, [])

  const handleTabChange = useCallback((tab: string) => {
    if (tab === "home") {
      setCurrentScreen("main")
    } else if (tab === "stats") {
      setCurrentScreen("main")
    } else if (tab === "record") {
      setCurrentScreen("main")
    } else if (tab === "perfil") {
      setShowProfile(true)
      return // Don't change activeTab, stay on current view
    } else if (tab === "aprende") {
      // Placeholder for future "Aprende" section
      setCurrentScreen("main")
    }
    setActiveTab(tab)
  }, [])

  const handleOpenProfile = useCallback(() => {
    setShowProfile(true)
  }, [])

  const handleCloseProfile = useCallback(() => {
    setShowProfile(false)
    if (userId) {
      supabase
        .from("friend_requests")
        .select("*", { count: "exact", head: true })
        .eq("to_user_id", userId)
        .eq("status", "pending")
        .then(({ count, error }) => {
          if (!error) {
            setNotificationCount(count || 0)
          }
        })
        .catch((error) =>
          handleError(error, "warning", {
            userId,
            action: "reload_notifications",
            component: "VladiApp",
          }),
        )
    }
  }, [userId])

  const handleStartChatFromIEQ = useCallback(() => {
    setVladiChatContext(null)
    setCurrentScreen("vladi-chat")
  }, [])

  const handleCloseVladiChat = useCallback(() => {
    setCurrentScreen("main")
    setVladiChatContext(null)
    setEmotionData(null)
    setContextData(null)
  }, [])

  const handleNotificationsClick = useCallback(() => {
    setCurrentScreen("notifications")
  }, [])

  const profileForViews = userProfile
    ? {
        username: userProfile.username,
        display_name: userProfile.display_name || null,
        avatar_url: userProfile.avatar_url || null,
      }
    : undefined

  const renderMainView = () => {
    if (currentScreen === "notifications") {
      return (
        <NotificationsView onClose={() => setCurrentScreen("main")} userId={userId} userProfile={profileForViews} />
      )
    }

    switch (activeTab) {
      case "home":
        return (
          <HomeView
            userId={userId}
            userProfile={profileForViews}
            onAvatarClick={handleOpenProfile}
            onNotificationsClick={handleNotificationsClick}
          />
        )
      case "stats":
        return (
          <IEQPanel
            userId={userId}
            userProfile={profileForViews}
            onAvatarClick={handleOpenProfile}
            onNotificationsClick={handleNotificationsClick}
            onStartChat={handleStartChatFromIEQ}
          />
        )
      case "record":
        return (
          <RecordView
            onStartCheckIn={handleStartCheckIn}
            userName={userName}
            userProfile={userProfile}
            onAvatarClick={handleOpenProfile}
            onNotificationsClick={handleNotificationsClick}
            notificationCount={notificationCount}
          />
        )
      case "aprende":
        return <PlaceholderView title="Aprende" icon="brain" />
      case "chats":
        return (
          <ChatsView
            userId={userId}
            userProfile={profileForViews}
            onAvatarClick={handleOpenProfile}
            onNotificationsClick={handleNotificationsClick}
            notificationCount={notificationCount}
          />
        )
      case "eq":
        return <PlaceholderView title="EQ" icon="eq" />
      default:
        return (
          <RecordView
            onStartCheckIn={handleStartCheckIn}
            userName={userName}
            userProfile={userProfile}
            onAvatarClick={handleOpenProfile}
            onNotificationsClick={handleNotificationsClick}
            notificationCount={notificationCount}
          />
        )
    }
  }

  return (
    <div className="relative h-[100dvh] flex flex-col bg-white overflow-hidden">
      <div className="flex-1 flex flex-col overflow-hidden min-h-0">{renderMainView()}</div>

      {currentScreen === "main" && (
        <BottomNavbar activeTab={activeTab} onTabChange={handleTabChange} userProfile={userProfile} />
      )}

      {(currentScreen === "emotion" || currentScreen === "context") && (
        <EmotionScreen quadrant={selectedQuadrant} onClose={handleCloseEmotion} onConfirm={handleEmotionConfirm} />
      )}

      {currentScreen === "context" && emotionData && (
        <ContextSheet
          emotionData={emotionData}
          onClose={handleCloseContext}
          onPublish={handlePublish}
          userId={userId}
        />
      )}

      {currentScreen === "mirror" && emotionData && contextData && (
        <MirrorOverlay
          emotionData={emotionData}
          contextText={contextData.text}
          contextTags={contextData.tags}
          onClose={handleCloseMirror}
          onStartChat={handleStartChatFromMirror}
        />
      )}

      {currentScreen === "vladi-chat" && (
        <VladiChat
          userId={userId}
          userName={userName}
          onClose={handleCloseVladiChat}
          emotionalContext={vladiChatContext || undefined}
        />
      )}

      {showProfile && <ProfileScreen userProfile={userProfile} onClose={handleCloseProfile} />}
    </div>
  )
}

export { VladiApp }

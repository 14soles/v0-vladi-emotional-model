"use client"

import { useState, useCallback, useEffect } from "react"
import { BottomNavbar } from "./bottom-navbar"
import { RecordView } from "./record-view"
import { EmotionScreen, type EmotionData } from "./emotion-screen"
import { ContextSheet } from "./context-sheet"
import { MirrorOverlay, type LinkedEmotionContext } from "./mirror-overlay"
import { InterventionRunner } from "./intervention-runner"
import { INTERVENTIONS, type InterventionType } from "@/lib/types/telemetry"
import { QUADRANT_STATES } from "@/lib/vladi-data"
import { ChatsView } from "./chats-view"
import { PlaceholderView } from "./placeholder-view"
import { LearnScreen } from "./learn-screen"
import { HomeView } from "./home-view"
import { PersonasView } from "./personas-view"
import { ProfileScreen } from "./profile-screen"
import { VladiChat } from "./vladi-chat" // Imported VladiChat component
import { NotificationsView } from "./notifications-view" // Imported NotificationsView component
import { GroupsPeopleScreen } from "./groups-people-screen" // Imported GroupsPeopleScreen component
import { InitialQuiz } from "./initial-quiz" // Imported InitialQuiz component
// EmotionalRadarView hidden for now
import { useVladiStore, type MoodEntry } from "@/lib/vladi-store"
import type { QuadrantId } from "@/lib/vladi-data"
import { supabase } from "@/lib/supabase/client"
import { IEQPanel } from "./ieq-panel"
import { LocationPermissionPrompt } from "./location-permission-prompt"
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

export default function VladiApp({ userId, userProfile: initialUserProfile }: VladiAppProps) {
  const [activeTab, setActiveTab] = useState("vladi")
  const [currentScreen, setCurrentScreen] = useState<
    "main" | "emotion" | "context" | "mirror" | "vladi-chat" | "notifications" | "personas"
  >("main")
  const [selectedQuadrant, setSelectedQuadrant] = useState<QuadrantId>("green")
  const [emotionData, setEmotionData] = useState<EmotionData | null>(null)
  const [contextData, setContextData] = useState<{ text: string; tags: string[] } | null>(null)
  const [showProfile, setShowProfile] = useState(false)
  const [notificationCount, setNotificationCount] = useState(0)
  // Mutable profile state that can be refreshed after edits
  const [userProfile, setUserProfile] = useState(initialUserProfile)
  const [vladiChatContext, setVladiChatContext] = useState<{
    emotion: string
    intensity: number
    wellbeing: number
    notes?: string
    contextTags?: string[]
  } | null>(null)
  const [conversationSummary, setConversationSummary] = useState<string | undefined>(undefined)
  const [activeIntervention, setActiveIntervention] = useState<{
    type: InterventionType
    linkedEmotion: LinkedEmotionContext
  } | null>(null)

  const { addEntry } = useVladiStore()

  const userName = userProfile?.display_name || userProfile?.username || "Usuario"
  const [showLocationPrompt, setShowLocationPrompt] = useState(true)
  const [showInitialQuiz, setShowInitialQuiz] = useState(false)
  const [initialQuizCompleted, setInitialQuizCompleted] = useState<boolean | null>(null)

  const handleNotificationsClick = useCallback(() => {
    setCurrentScreen("notifications")
  }, [])

  const handleNotificationCountChange = useCallback((count: number) => {
    setNotificationCount(count)
  }, [])

  // Check if initial quiz is completed (only on mount)
  useEffect(() => {
    if (!userId) return
    
    const checkQuizStatus = async () => {
      try {
        const { data } = await supabase
          .from("profiles")
          .select("initial_quiz_completed")
          .eq("id", userId)
          .single()
        
        const completed = data?.initial_quiz_completed || false
        setInitialQuizCompleted(completed)
        // Don't auto-show quiz here - only show when user clicks vladi tab
      } catch (error) {
        console.error("Error checking quiz status:", error)
        setInitialQuizCompleted(false)
      }
    }
    
    checkQuizStatus()
  }, [userId])

  useEffect(() => {
    if (!userId) return

    let mounted = true

    const loadNotifications = async () => {
      try {
        // Count friend requests
        const { count: friendRequestCount, error: friendError } = await supabase
          .from("friend_requests")
          .select("*", { count: "exact", head: true })
          .eq("to_user_id", userId)
          .eq("status", "pending")

        if (friendError) throw friendError

        // Count group invitations
        const { count: groupInvitationCount, error: groupError } = await supabase
          .from("group_invitations")
          .select("*", { count: "exact", head: true })
          .eq("to_user_id", userId)
          .eq("status", "pending")

        if (groupError) throw groupError

        if (mounted) {
          setNotificationCount((friendRequestCount || 0) + (groupInvitationCount || 0))
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
  }, [userId])

  const handleStartCheckIn = useCallback((quadrant: QuadrantId) => {
    setSelectedQuadrant(quadrant)
    setCurrentScreen("emotion")
  }, [])

  const handleEmotionConfirm = useCallback((data: EmotionData) => {
    // Skip intensity step - go directly to context
    // The energy value from emotion selection will be used as intensity (0-100 scale)
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
            visibility: isPublic ? "friends" : "private",
            anonymous_in_feed: false,
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

  // Handle starting an intervention from the mirror overlay
  const handleStartInterventionFromMirror = useCallback((interventionType: InterventionType, linkedEmotion: LinkedEmotionContext) => {
    setActiveIntervention({ type: interventionType, linkedEmotion })
    // Close the mirror but keep emotion data
    setCurrentScreen("main")
  }, [])

  // Handle completing an intervention
  const handleCompleteIntervention = useCallback(async (intensityAfter: number, perceivedUtility: number) => {
    if (!activeIntervention || !userId) {
      setActiveIntervention(null)
      return
    }

    const intervention = INTERVENTIONS.find(i => i.type === activeIntervention.type)
    if (!intervention) {
      setActiveIntervention(null)
      return
    }

    try {
      await supabase.from("interventions_log").insert({
        user_id: userId,
        intervention: activeIntervention.type, // Column is 'intervention', not 'intervention_type'
        source: "post_entry", // From mirror overlay after emotion entry
        started_at: new Date(Date.now() - intervention.duration_seconds * 1000).toISOString(),
        ended_at: new Date().toISOString(), // Column is 'ended_at', not 'completed_at'
        duration_planned_sec: intervention.duration_seconds,
        duration_actual_sec: intervention.duration_seconds,
        intensity_before: activeIntervention.linkedEmotion.intensity, // 1-10 scale
        intensity_after: intensityAfter, // 1-10 scale
        helpfulness: perceivedUtility, // 1-5 scale
      })
    } catch (error) {
      handleError(error, "warning", {
        userId,
        action: "save_intervention",
        component: "VladiApp",
      })
    }

    setActiveIntervention(null)
    setEmotionData(null)
    setContextData(null)
  }, [activeIntervention, userId])

  // Handle skipping an intervention
  const handleSkipIntervention = useCallback(async (reason: string) => {
    if (!activeIntervention || !userId) {
      setActiveIntervention(null)
      return
    }

    try {
      // For cancelled/skipped interventions, we still log them with notes
      await supabase.from("interventions_log").insert({
        user_id: userId,
        intervention: activeIntervention.type,
        source: "post_entry",
        started_at: new Date().toISOString(),
        notes: `Cancelada: ${reason}`,
      })
    } catch (error) {
      handleError(error, "warning", {
        userId,
        action: "skip_intervention",
        component: "VladiApp",
      })
    }

    setActiveIntervention(null)
  }, [activeIntervention, userId])

  const handleCloseEmotion = useCallback(() => {
    setCurrentScreen("main")
  }, [])

  const handleCloseContext = useCallback(() => {
    setCurrentScreen("emotion")
  }, [])

  const handleTabChange = useCallback((tab: string) => {
    if (tab === "perfil") {
      setShowProfile(true)
      return // Don't change activeTab, stay on current view
    }
    
    // Close quiz if open when switching to a different tab
    if (showInitialQuiz && tab !== "vladi") {
      setShowInitialQuiz(false)
    }
    
    // If clicking vladi tab and quiz not completed, show quiz
    if (tab === "vladi" && initialQuizCompleted === false) {
      setActiveTab(tab)
      setCurrentScreen("main")
      setShowInitialQuiz(true)
      return
    }
    
    setCurrentScreen("main")
    setActiveTab(tab)
  }, [initialQuizCompleted, showInitialQuiz])

  const handleOpenProfile = useCallback(() => {
    setShowProfile(true)
  }, [])

  // Handle initial quiz completion
  const handleQuizComplete = useCallback((showResults?: boolean) => {
    setInitialQuizCompleted(true)
    setShowInitialQuiz(false)
    if (showResults) {
      // Navigate to stats page to show results
      setActiveTab("stats")
    } else {
      setActiveTab("vladi")
    }
    setCurrentScreen("main")
  }, [])

  // Handle closing quiz without completing (stay on vladi tab showing RecordView)
  const handleQuizClose = useCallback(() => {
    setShowInitialQuiz(false)
    // Stay on vladi tab - user will see RecordView (registro de emoción)
  }, [])

  const handleCloseProfile = useCallback(async () => {
    setShowProfile(false)
    if (userId) {
      try {
        const [friendResult, groupResult] = await Promise.all([
          supabase
            .from("friend_requests")
            .select("*", { count: "exact", head: true })
            .eq("to_user_id", userId)
            .eq("status", "pending"),
          supabase
            .from("group_invitations")
            .select("*", { count: "exact", head: true })
            .eq("to_user_id", userId)
            .eq("status", "pending")
        ])
        
        if (!friendResult.error && !groupResult.error) {
          setNotificationCount((friendResult.count || 0) + (groupResult.count || 0))
        }
      } catch (error) {
        handleError(error, "warning", {
          userId,
          action: "reload_notifications",
          component: "VladiApp",
        })
      }
    }
  }, [userId])

  const handleOpenGroupsPeople = useCallback(() => {
    setCurrentScreen("personas")
  }, [])



  const handleCloseGroupsPeople = useCallback(() => {
    setCurrentScreen("main")
  }, [])

  const handleStartChatFromIEQ = useCallback((summary?: string) => {
    setVladiChatContext(null)
    setConversationSummary(summary)
    setCurrentScreen("vladi-chat")
  }, [])

  const handleCloseVladiChat = useCallback(() => {
    setCurrentScreen("main")
    setVladiChatContext(null)
    setConversationSummary(undefined)
    setEmotionData(null)
    setContextData(null)
  }, [])

  const profileForViews = userProfile
    ? {
        username: userProfile.username,
        display_name: userProfile.display_name || null,
        avatar_url: userProfile.avatar_url || null,
      }
    : undefined

  const renderMainView = () => {
    if (currentScreen === "personas") {
      return <GroupsPeopleScreen onClose={handleCloseGroupsPeople} userId={userId} />
    }



    if (currentScreen === "notifications") {
      return (
        <NotificationsView 
          onClose={() => setCurrentScreen("main")} 
          userId={userId} 
          userProfile={profileForViews}
          onNotificationCountChange={handleNotificationCountChange}
        />
      )
    }

    switch (activeTab) {
      case "personas":
        return (
          <PersonasView
            userId={userId}
            userProfile={profileForViews}
            onAvatarClick={handleOpenProfile}
            onNotificationsClick={handleNotificationsClick}
            notificationCount={notificationCount}
            onPersonasClick={handleOpenGroupsPeople}
          />
        )
      case "vladi":
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
      case "home":
        return (
          <HomeView
            userId={userId}
            userProfile={profileForViews}
            onAvatarClick={handleOpenProfile}
            onNotificationsClick={handleNotificationsClick}
            onPersonasClick={handleOpenGroupsPeople}
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
      default:
        return (
          <PersonasView
            userId={userId}
            userProfile={profileForViews}
            onAvatarClick={handleOpenProfile}
            onNotificationsClick={handleNotificationsClick}
            notificationCount={notificationCount}
            onPersonasClick={handleOpenGroupsPeople}
          />
        )
    }
  }

  return (
    <div className="relative h-[100dvh] flex flex-col bg-white overflow-hidden">
      <div className="flex-1 flex flex-col overflow-hidden min-h-0">{renderMainView()}</div>

      {currentScreen === "main" && !showInitialQuiz && (
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
          onStartIntervention={handleStartInterventionFromMirror}
        />
      )}

      {activeIntervention && (
        <InterventionRunner
          intervention={INTERVENTIONS.find(i => i.type === activeIntervention.type)!}
          linkedEmotion={activeIntervention.linkedEmotion}
          onComplete={handleCompleteIntervention}
          onSkip={handleSkipIntervention}
          onClose={() => setActiveIntervention(null)}
        />
      )}

      {currentScreen === "vladi-chat" && (
        <VladiChat
          userId={userId}
          userName={userName}
          onClose={handleCloseVladiChat}
          emotionalContext={vladiChatContext || undefined}
          conversationSummary={conversationSummary}
        />
      )}

      {showLocationPrompt && currentScreen === "main" && (
        <LocationPermissionPrompt
          userId={userId}
          onDismiss={() => setShowLocationPrompt(false)}
        />
      )}

      {showInitialQuiz && userId && (
        <div className="fixed inset-0 z-[60] bg-background">
          <InitialQuiz userId={userId} onComplete={handleQuizComplete} onClose={handleQuizClose} />
        </div>
      )}

      {showProfile && (
        <ProfileScreen 
          userProfile={userProfile} 
          onClose={handleCloseProfile}
          onProfileUpdate={async () => {
            // Refresh profile data from database
            if (!userId) return
            try {
              const { data: updatedProfile } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", userId)
                .single()
              
              if (updatedProfile) {
                setUserProfile({
                  id: updatedProfile.id,
                  username: updatedProfile.username,
                  email: updatedProfile.email,
                  phone: updatedProfile.phone || "",
                  display_name: updatedProfile.display_name || updatedProfile.username,
                  avatar_url: updatedProfile.avatar_url || undefined,
                })
              }
            } catch {
              // Profile refresh failed silently
            }
          }}
        />
      )}
    </div>
  )
}

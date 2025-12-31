"use client"

import { useState, useRef, useEffect } from "react"
import { Pin, ArrowUp, MoreHorizontal, MoreVertical, Check, CheckCheck, ArrowLeft } from "lucide-react"
import { useVladiStore } from "@/lib/vladi-store"
import { GroupsPeopleScreen } from "./groups-people-screen"
import { VladiChat } from "./vladi-chat"

interface ChatsViewProps {
  userId?: string
  userProfile?: {
    username: string
    display_name: string | null
    avatar_url: string | null
  }
  onAvatarClick?: () => void
  onNotificationsClick?: () => void
  notificationCount?: number
}

interface Chat {
  id: string
  name: string
  avatar: string | null
  avatarBg?: string
  tag?: string
  tagColor?: string
  lastMessage: string
  timestamp: string
  unreadCount: number
  isPinned: boolean
  isRead: boolean
  isFromMe?: boolean
  messages: Array<{
    role: "user" | "ai" | "contact"
    text: string
    timestamp: string
  }>
}

const initialChats: Chat[] = [
  {
    id: "vladi",
    name: "vladi",
    avatar: null,
    avatarBg: "bg-black",
    lastMessage: "¿Cómo te encuentras justo ahora? Si quieres, pod...",
    timestamp: "Hace 1 min",
    unreadCount: 1,
    isPinned: true,
    isRead: false,
    messages: [
      {
        role: "ai",
        text: "Hoy me he peleado con mi madre en casa mientras trabajaba.",
        timestamp: "10:25",
      },
      {
        role: "ai",
        text: "¡Qué bonito, te sientes así Oscar! A veces esas sorpresas inesperadas nos dejan una huella especial.. ¿Quieres contarme cómo fue ese momento y qué fue lo que más te sorprendió?",
        timestamp: "10:26",
      },
    ],
  },
  {
    id: "angela",
    name: "angelaferris",
    avatar: "/woman-mother-portrait.jpg",
    tag: "Madre",
    tagColor: "bg-gray-100",
    lastMessage: "Graciass!! Que vaya bien el día. Te quiero ❤️",
    timestamp: "Hace 5 min",
    unreadCount: 0,
    isPinned: false,
    isRead: true,
    messages: [
      { role: "contact", text: "Buenos días hijo! Como estás?", timestamp: "09:15" },
      { role: "user", text: "Bien mamá, trabajando un poco", timestamp: "09:20" },
      { role: "contact", text: "Graciass!! Que vaya bien el día. Te quiero ❤️", timestamp: "09:25" },
    ],
  },
  {
    id: "javito",
    name: "javito0858",
    avatar: "/man-father-portrait-smile.jpg",
    tag: "Padre",
    tagColor: "bg-gray-100",
    lastMessage: "Estoy trabajando.",
    timestamp: "Hace 49 min",
    unreadCount: 3,
    isPinned: false,
    isRead: false,
    messages: [
      { role: "contact", text: "Hijo, cómo va todo?", timestamp: "08:30" },
      { role: "contact", text: "Llámame cuando puedas", timestamp: "08:45" },
      { role: "contact", text: "Estoy trabajando.", timestamp: "09:00" },
    ],
  },
  {
    id: "sergio",
    name: "sergiomugy",
    avatar: "/young-man-friend-casual.jpg",
    tag: "Amigos",
    tagColor: "bg-gray-100",
    lastMessage: "Vale colega, ánimo que tu puedes!!",
    timestamp: "Ayer",
    unreadCount: 0,
    isPinned: false,
    isRead: true,
    isFromMe: false,
    messages: [
      { role: "user", text: "Tío estoy agotado con el proyecto", timestamp: "Ayer 18:30" },
      { role: "contact", text: "Vale colega, ánimo que tu puedes!!", timestamp: "Ayer 18:35" },
    ],
  },
]

export function ChatsView({
  userId,
  userProfile,
  onAvatarClick,
  onNotificationsClick,
  notificationCount = 0,
}: ChatsViewProps) {
  const [selectedChat, setSelectedChat] = useState<string | null>(null)
  const [message, setMessage] = useState("")
  const [chats, setChats] = useState<Chat[]>(initialChats)
  const [activeMenu, setActiveMenu] = useState<string | null>(null)
  const [activeFilter, setActiveFilter] = useState("Todos")
  const [showGroupsScreen, setShowGroupsScreen] = useState(false)
  const [showVladiChat, setShowVladiChat] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { chatHistory, addChatMessage, entries } = useVladiStore()

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenu(null)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [chats, selectedChat])

  const handlePinChat = (chatId: string) => {
    setChats((prev) => prev.map((chat) => (chat.id === chatId ? { ...chat, isPinned: !chat.isPinned } : chat)))
    setActiveMenu(null)
  }

  const handleMarkAsUnread = (chatId: string) => {
    setChats((prev) =>
      prev.map((chat) =>
        chat.id === chatId
          ? { ...chat, isRead: false, unreadCount: chat.unreadCount === 0 ? 1 : chat.unreadCount }
          : chat,
      ),
    )
    setActiveMenu(null)
  }

  const handleMarkAsRead = (chatId: string) => {
    setChats((prev) => prev.map((chat) => (chat.id === chatId ? { ...chat, isRead: true, unreadCount: 0 } : chat)))
    setActiveMenu(null)
  }

  const handleOpenChat = (chatId: string) => {
    setChats((prev) => prev.map((chat) => (chat.id === chatId ? { ...chat, isRead: true, unreadCount: 0 } : chat)))

    if (chatId === "vladi") {
      setShowVladiChat(true)
    } else {
      setSelectedChat(chatId)
    }
  }

  const handleSendMessage = async () => {
    if (!message.trim()) return

    const currentChat = chats.find((c) => c.id === selectedChat)
    if (!currentChat) return

    const newMessage = {
      role: "user" as const,
      text: message,
      timestamp: new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }),
    }

    setChats((prev) =>
      prev.map((chat) =>
        chat.id === selectedChat
          ? { ...chat, messages: [...chat.messages, newMessage], lastMessage: message, timestamp: "Ahora" }
          : chat,
      ),
    )

    if (selectedChat === "vladi") {
      addChatMessage({ role: "user", text: message, timestamp: new Date().toISOString() })
    }

    const userMsg = message
    setMessage("")

    if (selectedChat === "vladi") {
      setTimeout(() => {
        const recentEmotions = entries
          .slice(0, 5)
          .map((e) => e.emotion)
          .join(", ")
        let response = "Gracias por compartir. ¿Cómo te sientes ahora mismo?"

        if (userMsg.toLowerCase().includes("no se") || userMsg.toLowerCase().includes("dudas")) {
          response =
            "Me contabas que estabas en casa y recibiste un regalo. ¿Quieres contarme cómo fue ese momento y qué fue lo que más te sorprendió?"
        } else if (recentEmotions) {
          response = `He visto que últimamente has sentido ${recentEmotions}. ¿Hay algo específico de lo que quieras hablar?`
        }

        const aiMessage = {
          role: "ai" as const,
          text: response,
          timestamp: new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }),
        }

        setChats((prev) =>
          prev.map((chat) =>
            chat.id === "vladi"
              ? { ...chat, messages: [...chat.messages, aiMessage], lastMessage: response.slice(0, 40) + "..." }
              : chat,
          ),
        )

        addChatMessage({ role: "ai", text: response, timestamp: new Date().toISOString() })
      }, 1500)
    }
  }

  const sortedChats = [...chats].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1
    if (!a.isPinned && b.isPinned) return 1
    return 0
  })

  const filteredChats = sortedChats.filter((chat) => {
    if (activeFilter === "Todos") return true
    if (activeFilter === "Familia") return chat.tag === "Madre" || chat.tag === "Padre"
    if (activeFilter === "Amigos") return chat.tag === "Amigos"
    if (activeFilter === "Grupos") return false
    return true
  })

  const currentChat = chats.find((c) => c.id === selectedChat)

  if (showVladiChat) {
    return <VladiChat onClose={() => setShowVladiChat(false)} />
  }

  if (showGroupsScreen) {
    return <GroupsPeopleScreen onClose={() => setShowGroupsScreen(false)} userId={userId} />
  }

  // Individual chat view
  if (selectedChat && currentChat) {
    const now = new Date()
    const dateStr = `${now.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })} | ${now.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}h.`

    return (
      <div className="fixed inset-0 z-50 bg-white flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 pt-safe">
          <button onClick={() => setSelectedChat(null)} className="p-2 -ml-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <img src="/images/logo.png" alt="Vladi" className="h-7" />
          <button className="p-2 -mr-2 hover:bg-gray-100 rounded-lg">
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 min-h-0">
          <div className="text-center text-xs sm:text-sm text-gray-400 font-medium capitalize border-t border-gray-100 pt-4">
            {dateStr}
          </div>

          {currentChat.messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              {msg.role === "user" ? (
                <div className="bg-gray-100 text-gray-900 px-4 sm:px-5 py-3 sm:py-4 rounded-3xl rounded-br-md max-w-[85%] text-sm sm:text-base">
                  {msg.text}
                </div>
              ) : (
                <div className="max-w-[90%]">
                  <p className="text-gray-900 text-sm sm:text-base leading-relaxed">{msg.text}</p>
                </div>
              )}
            </div>
          ))}

          {selectedChat === "vladi" && message === "" && currentChat.messages.length > 0 && (
            <div className="flex justify-start">
              <span className="text-gray-400 text-2xl tracking-widest">...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div
          className="p-4 sm:p-5 bg-white border-t border-gray-50 shrink-0"
          style={{ paddingBottom: "max(16px, calc(env(safe-area-inset-bottom) + 8px))" }}
        >
          <div className="bg-gray-100 rounded-full py-2.5 sm:py-3 pr-2.5 sm:pr-3 pl-4 sm:pl-5 flex items-center">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Escribe aquí lo que quieras..."
              className="flex-1 bg-transparent border-none outline-none text-sm sm:text-base text-gray-900 placeholder:text-gray-400"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  handleSendMessage()
                }
              }}
            />
            <button
              onClick={handleSendMessage}
              className="w-9 h-9 sm:w-10 sm:h-10 bg-gray-900 rounded-full flex items-center justify-center text-white ml-2 active:scale-95 transition-transform touch-manipulation"
            >
              <ArrowUp className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
          <p className="text-center mt-2 sm:mt-3 text-[9px] sm:text-[10px] text-gray-400">
            Vladi puede cometer errores. Si necesitas ayuda profesional haz click{" "}
            <a href="#" className="underline">
              aquí
            </a>
            .
          </p>
        </div>
      </div>
    )
  }

  // Chat list view with updated header
  return (
    <div className="flex-1 overflow-y-auto bg-white min-h-0">
      <div
        className="flex justify-between items-center px-5 py-4"
        style={{ paddingTop: "max(12px, env(safe-area-inset-top))" }}
      >
        <img src="/images/logo.png" alt="Vladi" className="h-5" />
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <button
            onClick={onAvatarClick}
            className="w-9 h-9 bg-black text-white rounded-full flex items-center justify-center text-sm font-medium overflow-hidden hover:opacity-80 active:opacity-70"
          >
            {userProfile?.avatar_url ? (
              <img src={userProfile.avatar_url || "/placeholder.svg"} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-[10px] font-bold leading-tight text-center">
                {userProfile?.username?.slice(0, 5) || "oscar"}
                <br />
                {!userProfile?.username && "ferris."}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 px-5 pb-2.5 overflow-x-auto hide-scrollbar">
        {["Todos", "Familia", "Amigos", "Grupos"].map((filter) => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className={`px-4 sm:px-5 py-2 rounded-full text-xs sm:text-sm whitespace-nowrap transition-colors touch-manipulation ${
              activeFilter === filter
                ? "bg-gray-900 text-white"
                : "border border-gray-200 text-gray-700 hover:bg-gray-50"
            }`}
          >
            {filter}
          </button>
        ))}
        <button
          onClick={() => setShowGroupsScreen(true)}
          className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center flex-shrink-0 text-gray-600 hover:bg-gray-50 touch-manipulation"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="10" cy="8" r="4" />
            <path d="M10 14c-4 0-7 2-7 4v2h14v-2c0-2-3-4-7-4z" />
            <path d="M19 8v6M16 11h6" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* Chat list */}
      <div className="mt-2 pb-24">
        {filteredChats.map((chat) => (
          <div
            key={chat.id}
            className={`relative border-b border-gray-100 ${chat.isPinned ? "bg-gray-50/70" : "bg-white"}`}
          >
            <button
              onClick={() => handleOpenChat(chat.id)}
              className="w-full flex items-start px-5 py-3 sm:py-4 hover:bg-gray-50/50 transition-colors text-left touch-manipulation"
            >
              {/* Avatar */}
              {chat.avatar ? (
                <img
                  src={chat.avatar || "/placeholder.svg"}
                  alt={chat.name}
                  className="w-11 h-11 sm:w-[50px] sm:h-[50px] rounded-full object-cover flex-shrink-0"
                />
              ) : (
                <div
                  className={`w-11 h-11 sm:w-[50px] sm:h-[50px] rounded-full ${chat.avatarBg || "bg-gray-300"} text-white flex items-center justify-center text-lg sm:text-xl font-bold flex-shrink-0`}
                >
                  {chat.name === "vladi" ? "Vladi" : chat.name.charAt(0).toUpperCase()}
                </div>
              )}

              <div className="flex-1 ml-3 sm:ml-4 overflow-hidden min-w-0">
                <div className="flex items-center gap-1.5 sm:gap-2 mb-0.5 flex-wrap">
                  <span className="font-bold text-gray-900 text-sm sm:text-base truncate">{chat.name}</span>
                  {chat.isPinned && <Pin className="w-3 h-3 text-gray-400 fill-gray-400 rotate-45 shrink-0" />}
                  {chat.tag && (
                    <span
                      className={`text-[10px] sm:text-xs px-2 sm:px-2.5 py-0.5 rounded-full ${chat.tagColor || "bg-gray-100"} text-gray-600 shrink-0`}
                    >
                      {chat.tag}
                    </span>
                  )}
                </div>
                <div className="text-[10px] sm:text-xs text-gray-400 mb-1">{chat.timestamp}</div>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs sm:text-sm text-gray-500 truncate flex items-center gap-1 min-w-0">
                    {chat.isRead && chat.isFromMe !== false && chat.messages.length > 0 && (
                      <CheckCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-500 flex-shrink-0" />
                    )}
                    <span className="truncate">{chat.lastMessage}</span>
                  </p>
                  {chat.unreadCount > 0 && (
                    <span className="bg-gray-900 text-white text-[10px] sm:text-[11px] font-bold min-w-[18px] sm:min-w-[20px] h-[18px] sm:h-[20px] px-1 sm:px-1.5 rounded-full flex items-center justify-center shrink-0">
                      {chat.unreadCount}
                    </span>
                  )}
                  {!chat.isRead && chat.unreadCount === 0 && (
                    <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-gray-900 rounded-full shrink-0" />
                  )}
                </div>
              </div>

              {/* Menu button */}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setActiveMenu(activeMenu === chat.id ? null : chat.id)
                }}
                className="p-2 -mr-2 text-gray-400 hover:text-gray-600 touch-manipulation"
              >
                <MoreHorizontal className="w-5 h-5" />
              </button>
            </button>

            {/* Dropdown menu */}
            {activeMenu === chat.id && (
              <div
                ref={menuRef}
                className="absolute right-5 top-14 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50 min-w-[180px]"
              >
                <button
                  onClick={() => handlePinChat(chat.id)}
                  className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 touch-manipulation"
                >
                  <Pin className={`w-4 h-4 ${chat.isPinned ? "fill-gray-400" : ""}`} />
                  {chat.isPinned ? "Desfijar chat" : "Fijar chat"}
                </button>
                {chat.isRead ? (
                  <button
                    onClick={() => handleMarkAsUnread(chat.id)}
                    className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 touch-manipulation"
                  >
                    <div className="w-4 h-4 border-2 border-gray-400 rounded-full" />
                    Marcar como no leído
                  </button>
                ) : (
                  <button
                    onClick={() => handleMarkAsRead(chat.id)}
                    className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 touch-manipulation"
                  >
                    <Check className="w-4 h-4" />
                    Marcar como leído
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Footer disclaimer */}
      <p className="text-center py-4 text-[10px] text-gray-400 px-6">
        Vladi puede cometer errores. Si necesitas ayuda profesional haz click{" "}
        <a href="#" className="underline">
          aquí
        </a>
        .
      </p>
    </div>
  )
}

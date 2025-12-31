"use client"

import { X } from "lucide-react"

interface NotificationsViewProps {
  onClose: () => void
  userId?: string
  userProfile?: {
    username?: string
    display_name?: string
    avatar_url?: string
  }
}

export function NotificationsView({ onClose, userId, userProfile }: NotificationsViewProps) {
  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <header className="w-full flex justify-between items-center px-6 py-5 border-b border-gray-100 shrink-0">
        <h1 className="text-2xl font-light text-gray-900">Notificaciones</h1>
        <button
          onClick={onClose}
          className="w-10 h-10 flex items-center justify-center text-gray-900 hover:opacity-70 active:opacity-50"
        >
          <X className="w-6 h-6" />
        </button>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="text-center py-12">
          <p className="text-gray-500">No tienes notificaciones nuevas</p>
        </div>
      </div>
    </div>
  )
}

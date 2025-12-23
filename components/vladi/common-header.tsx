"use client"

interface CommonHeaderProps {
  userId?: string
  userProfile?: {
    username: string
    display_name: string | null
    avatar_url: string | null
  }
  onAvatarClick?: () => void
  onNotificationsClick?: () => void
  notificationCount?: number
  showFilter?: boolean
  filterValue?: string
  onFilterChange?: (value: string) => void
}

export function CommonHeader({ userProfile, onAvatarClick }: CommonHeaderProps) {
  return (
    <div className="px-6 pt-[max(16px,env(safe-area-inset-top))] pb-4 flex items-center justify-between">
      <div className="text-3xl font-light text-gray-900">Vladi</div>

      {/* Right side: Filter + Notifications + Avatar */}
      <div className="flex items-center gap-3">
        {/* Avatar */}
        <button
          onClick={onAvatarClick}
          className="w-10 h-10 rounded-full bg-gray-900 text-white flex items-center justify-center text-sm font-medium overflow-hidden hover:opacity-80 active:opacity-70"
        >
          {userProfile?.avatar_url ? (
            <img src={userProfile.avatar_url || "/placeholder.svg"} alt="" className="w-full h-full object-cover" />
          ) : (
            userProfile?.username?.[0]?.toUpperCase() || "U"
          )}
        </button>
      </div>
    </div>
  )
}

"use client"

interface BottomNavbarProps {
  activeTab: string
  onTabChange: (tab: string) => void
  userProfile?: {
    username?: string
    display_name?: string
    avatar_url?: string
  } | null
}

export function BottomNavbar({ activeTab, onTabChange, userProfile }: BottomNavbarProps) {
  const tabs = [
    { id: "personas", label: "Personas" },
    { id: "vladi", label: "Vladi" },
    { id: "record", label: "", isCenter: true },
    { id: "stats", label: "Tu Panel" },
    { id: "perfil", label: "Perfil" },
  ]

  const getUserInitials = () => {
    if (!userProfile) return "U"
    const name = userProfile.display_name || userProfile.username || ""
    return name.charAt(0).toUpperCase()
  }

  return (
    <nav
      className="sticky bottom-0 left-0 right-0 bg-white flex justify-around items-center z-[90] shrink-0 pb-[calc(env(safe-area-inset-bottom)+5px)] pt-3"
      style={{ minHeight: "80px" }}
    >
      <div className="absolute top-0 left-5 right-5 h-px bg-gray-100" />

      {tabs.map((tab) => {
        const isActive = activeTab === tab.id

        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex flex-col items-center justify-center flex-1 py-2 transition-colors touch-manipulation ${
              tab.isCenter ? "" : isActive ? "text-gray-900" : "text-gray-400"
            }`}
          >
            {tab.isCenter ? (
              <div className="w-[51px] h-[51px] bg-gray-900 text-white rounded-full flex items-center justify-center active:scale-95 transition-transform">
                <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
            ) : (
              <>
                {/* Personas icon - head silhouette */}
                {tab.id === "personas" && (
                  <svg className="w-[22px] h-[22px] mb-1" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C9.243 2 7 4.243 7 7v2c0 2.757 2.243 5 5 5s5-2.243 5-5V7c0-2.757-2.243-5-5-5z" fillOpacity={isActive ? 1 : 0.6} />
                    <path d="M4 21v-1c0-3.866 3.134-7 7-7h2c3.866 0 7 3.134 7 7v1H4z" fillOpacity={isActive ? 1 : 0.6} />
                  </svg>
                )}

                {/* Vladi icon - colorful star/spark */}
                {tab.id === "vladi" && (
                  <svg className="w-[22px] h-[22px] mb-1" viewBox="0 0 24 24" fill="none">
                    {isActive ? (
                      <>
                        <path d="M12 2L14 10L22 12L14 14L12 22L10 14L2 12L10 10L12 2Z" fill="#E6584F" />
                        <path d="M12 2L14 10L22 12L14 14L12 22" fill="#E6B04F" />
                        <path d="M12 22L10 14L2 12L10 10L12 2" fill="#94B22E" />
                        <path d="M12 12L14 10L12 2L10 10L12 12Z" fill="#466D91" />
                      </>
                    ) : (
                      <path 
                        d="M12 2L14 10L22 12L14 14L12 22L10 14L2 12L10 10L12 2Z" 
                        stroke="currentColor" 
                        strokeWidth="1.5" 
                        fill="none"
                      />
                    )}
                  </svg>
                )}

                {/* Tu Panel icon - bar chart */}
                {tab.id === "stats" && (
                  isActive ? (
                    <svg className="w-[20px] h-[20px] mb-1" viewBox="0 0 24 24" fill="currentColor">
                      <rect x="3" y="12" width="4" height="9" rx="1" />
                      <rect x="10" y="5" width="4" height="16" rx="1" />
                      <rect x="17" y="8" width="4" height="13" rx="1" />
                    </svg>
                  ) : (
                    <svg className="w-[20px] h-[20px] mb-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <rect x="3" y="12" width="4" height="9" rx="1" />
                      <rect x="10" y="5" width="4" height="16" rx="1" />
                      <rect x="17" y="8" width="4" height="13" rx="1" />
                    </svg>
                  )
                )}

                {/* Perfil icon - user avatar */}
                {tab.id === "perfil" && (
                  <div
                    className={`w-[22px] h-[22px] mb-1 rounded-full flex items-center justify-center overflow-hidden ${
                      isActive ? "ring-2 ring-gray-900" : ""
                    }`}
                    style={{ backgroundColor: userProfile?.avatar_url ? "transparent" : "#1a1a1a" }}
                  >
                    {userProfile?.avatar_url ? (
                      <img
                        src={userProfile.avatar_url}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-white text-[8px] font-bold">{getUserInitials()}</span>
                    )}
                  </div>
                )}

                <span className="text-[11px] font-normal">{tab.label}</span>
              </>
            )}
          </button>
        )
      })}
    </nav>
  )
}

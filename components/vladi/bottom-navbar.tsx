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
    { id: "home", icon: "casa", label: "Inicio" },
    { id: "stats", icon: "estadistico", label: "IEQ" },
    { id: "record", icon: "plus", label: "", isCenter: true },
    { id: "aprende", icon: "mente-humana", label: "Aprende" },
    { id: "perfil", icon: "perfil", label: "Perfil" },
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
                {tab.icon === "casa" &&
                  (isActive ? (
                    <svg className="w-[18px] h-[18px] mb-1" viewBox="0 0 29 29" fill="currentColor">
                      <path d="M12.5627 0.772029C13.6534 -0.257343 15.3573 -0.257343 16.448 0.772029L28.1117 11.7796C28.6786 12.3146 29 13.0599 29 13.8396L28.9893 26.1679C28.9893 27.732 27.7218 28.9999 26.1583 28.9999H18.1183V21.0703C18.1183 20.1318 17.3578 19.371 16.4197 19.371H12.5696C11.6315 19.371 10.871 20.1318 10.871 21.0703V28.9999H2.83099C1.26748 28.9999 0 27.732 0 26.1679L0.0106991 13.8396Z" />
                    </svg>
                  ) : (
                    <svg className="w-[18px] h-[18px] mb-1" viewBox="0 0 29 29" fill="none" stroke="currentColor">
                      <path
                        d="M12.9062 1.13574C13.8043 0.288408 15.2065 0.288396 16.1045 1.13574L27.7686 12.1436C28.1769 12.5291 28.4303 13.047 28.4873 13.6006L28.5 13.8398L28.4893 26.167V26.168C28.4892 27.4561 27.4454 28.5 26.1582 28.5H18.6182V21.0703C18.6182 19.856 17.6342 18.8712 16.4199 18.8711H12.5693C11.355 18.8712 10.3711 19.856 10.3711 21.0703V28.9999H2.83105C1.54388 28.9999 0.500031 27.456 0.5 26.168L0.510742 13.8398L0.523438 13.6006C0.572307 13.1259 0.765569 12.6777 1.07715 12.3164L1.24219 12.1436L12.9062 1.13574Z"
                        strokeWidth="1"
                      />
                    </svg>
                  ))}
                {tab.icon === "estadistico" &&
                  (isActive ? (
                    <svg className="w-[18px] h-[18px] mb-1" viewBox="0 0 512 512" fill="currentColor">
                      <path d="M124.52,239.304H16.696C7.475,239.304,0,246.78,0,256v215.647c0,9.22,7.475,16.696,16.696,16.696H124.52c9.22,0,16.696-7.475,16.696-16.696V256C141.215,246.78,133.74,239.304,124.52,239.304z" />
                      <path d="M309.912,23.658H202.089c-9.22,0-16.696,7.475-16.696,16.696v431.293c0,9.22,7.475,16.696,16.696,16.696h107.824c9.22,0,16.696-7.474,16.696-16.695V40.353C326.608,31.133,319.133,23.658,309.912,23.658z" />
                      <path d="M495.304,131.48H387.481c-9.22,0-16.696,7.475-16.696,16.696v323.47c0,9.22,7.475,16.696,16.696,16.696h107.824c9.22,0,16.696-7.475,16.696-16.696v-323.47C512,138.956,504.525,131.48,495.304,131.48z" />
                    </svg>
                  ) : (
                    <svg className="w-[18px] h-[18px] mb-1" viewBox="0 0 27 27" fill="none" stroke="currentColor">
                      <path
                        d="M0.880859 13.02H6.56641C6.83166 13.02 7.04685 13.2351 7.04688 13.5005V24.8726C7.04662 25.1377 6.83156 25.353 6.56641 25.353H0.880859C0.61568 25.353 0.400643 25.1377 0.400391 24.8726V13.5005C0.400391 13.2352 0.615525 13.02 0.880859 13.02Z"
                        strokeWidth="0.8"
                      />
                      <path
                        d="M10.6543 1.64795H16.3398C16.6052 1.64795 16.8203 1.8631 16.8203 2.12842V24.8716C16.8203 25.1369 16.6052 25.3521 16.3398 25.3521H10.6543C10.389 25.3521 10.1738 25.1369 10.1738 24.8716V2.12842C10.1738 1.86308 10.389 1.64795 10.6543 1.64795Z"
                        strokeWidth="0.8"
                      />
                      <path
                        d="M20.4355 7.33398H26.1211C26.3864 7.33398 26.6015 7.5491 26.6016 7.81445V24.8721C26.6015 25.1374 26.3864 25.3525 26.1211 25.3525H20.4355C20.1702 25.3525 19.9551 25.1374 19.9551 24.8721V7.81445C19.9551 7.54912 20.1702 7.33398 20.4355 7.33398Z"
                        strokeWidth="0.8"
                      />
                    </svg>
                  ))}
                {tab.icon === "mente-humana" &&
                  (isActive ? (
                    <svg className="w-[18px] h-[18px] mb-1" viewBox="0 0 26 26" fill="none">
                      <g clipPath="url(#clip0_2942_2296)">
                        <path
                          d="M22.92 11.29C22.86 8.27 21.67 5.47 19.57 3.37C17.42 1.2 14.54 0 11.48 0C8.44 0 5.59 1.19 3.42 3.36C1.22 5.56 0 8.48 0 11.56V25.44C0 25.75 0.25 25.99 0.55 25.99H13.52C13.83 25.99 14.07 25.74 14.07 25.44V22.94H17.78C20.24 22.94 22.37 21.18 22.83 18.76L22.91 18.35H25.39C25.58 18.35 25.75 18.26 25.86 18.09C25.96 17.93 25.97 17.73 25.89 17.55L22.92 11.28V11.29Z"
                          fill="black"
                        />
                        <path
                          d="M11.4784 3.8601H11.4684C8.41845 3.8601 5.66845 5.7201 4.45845 8.5901C4.38845 8.7601 4.39845 8.9501 4.50845 9.1101C4.60845 9.2701 4.77845 9.3601 4.96845 9.3601H18.0084C18.1984 9.3601 18.3684 9.2701 18.4684 9.1101C18.5684 8.9501 18.5884 8.7601 18.5184 8.5901C17.3384 5.7201 14.5784 3.8601 11.4884 3.8501L11.4784 3.8601Z"
                          fill="white"
                        />
                      </g>
                      <defs>
                        <clipPath id="clip0_2942_2296">
                          <rect width="25.95" height="26" fill="white" />
                        </clipPath>
                      </defs>
                    </svg>
                  ) : (
                    <svg className="w-[18px] h-[18px] mb-1" viewBox="0 0 26 26" fill="none">
                      <g clipPath="url(#clip0_2941_2292)">
                        <path
                          d="M11.4784 3.8601H11.4684C8.41845 3.8601 5.66845 5.7201 4.45845 8.5901C4.38845 8.7601 4.39845 8.9501 4.50845 9.1101C4.60845 9.2701 4.77845 9.3601 4.96845 9.3601H18.0084C18.1984 9.3601 18.3684 9.2701 18.4684 9.1101C18.5684 8.9501 18.5884 8.7601 18.5184 8.5901C17.3384 5.7201 14.5784 3.8601 11.4884 3.8501L11.4784 3.8601ZM5.76845 8.2501L6.41845 7.4401C7.67845 5.8701 9.51845 4.9701 11.4584 4.9701C13.4684 4.9701 15.3284 5.8801 16.5584 7.4501L17.1985 8.2601H5.76845V8.2501Z"
                          fill="currentColor"
                        />
                        <path
                          d="M22.92 11.29C22.86 8.27 21.67 5.47 19.57 3.37C17.42 1.2 14.54 0 11.48 0C8.44 0 5.59 1.19 3.42 3.36C1.22 5.56 0 8.48 0 11.56V25.44C0 25.75 0.25 25.99 0.55 25.99H13.52C13.83 25.99 14.07 25.74 14.07 25.44V22.94H17.78C20.24 22.94 22.37 21.18 22.83 18.76L22.91 18.35H25.39C25.58 18.35 25.75 18.26 25.86 18.09C25.96 17.93 25.97 17.73 25.89 17.55L22.92 11.28V11.29ZM22.37 17.25C22.06 17.25 21.82 17.5 21.82 17.8C21.82 20.02 20.01 21.83 17.79 21.83H13.53C13.22 21.83 12.98 22.08 12.98 22.38V24.88H1.11V11.55C1.11 8.76 2.21 6.12 4.21 4.13C6.17 2.17 8.75 1.1 11.47 1.1C14.25 1.1 16.85 2.18 18.8 4.14C20.75 6.1 21.83 8.7 21.83 11.46C21.83 11.54 21.85 11.62 21.88 11.7L24.52 17.24H22.38L22.37 17.25Z"
                          fill="currentColor"
                        />
                      </g>
                    </svg>
                  ))}
                {tab.icon === "perfil" && (
                  <div
                    className={`w-[18px] h-[18px] mb-1 bg-black rounded-full flex items-center justify-center text-white text-[6px] font-bold overflow-hidden border ${
                      isActive ? "border-gray-900" : "border-gray-400"
                    }`}
                  >
                    {userProfile?.avatar_url ? (
                      <img
                        src={userProfile.avatar_url || "/placeholder.svg"}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-white text-[6px] font-bold">{getUserInitials()}</span>
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

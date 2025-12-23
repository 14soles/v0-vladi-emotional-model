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

  return (
    <nav
      className="sticky bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex justify-around items-center z-[90] shrink-0 pb-[env(safe-area-inset-bottom)] pt-3"
      style={{ minHeight: "80px" }}
    >
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
              <div className="w-14 h-14 bg-gray-900 text-white rounded-full flex items-center justify-center shadow-lg -translate-y-4 active:scale-95 transition-transform">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
            ) : (
              <>
                {tab.icon === "casa" &&
                  (isActive ? (
                    <svg className="w-7 h-7 mb-1" viewBox="0 0 29 29" fill="currentColor">
                      <path d="M0.0106991 13.8396C0.0106991 13.0599 0.332052 12.3146 0.899006 11.7796L12.5627 0.772029C13.6534 -0.257343 15.3573 -0.257343 16.448 0.772029L28.1117 11.7796C28.6786 12.3146 29 13.0599 29 13.8396L28.9893 26.1679C28.9893 27.732 27.7218 28.9999 26.1583 28.9999H18.1183V21.0703C18.1183 20.1318 17.3578 19.371 16.4197 19.371H12.5696C11.6315 19.371 10.871 20.1318 10.871 21.0703V28.9999H2.83099C1.26748 28.9999 0 27.732 0 26.1679L0.0106991 13.8396Z" />
                    </svg>
                  ) : (
                    <svg className="w-7 h-7 mb-1" viewBox="0 0 29 29" fill="none" stroke="currentColor">
                      <path
                        d="M12.9062 1.13574C13.8043 0.288408 15.2065 0.288396 16.1045 1.13574L27.7686 12.1436C28.1769 12.5291 28.4303 13.047 28.4873 13.6006L28.5 13.8398L28.4893 26.167V26.168C28.4892 27.4561 27.4454 28.5 26.1582 28.5H18.6182V21.0703C18.6182 19.856 17.6342 18.8712 16.4199 18.8711H12.5693C11.355 18.8712 10.3711 19.856 10.3711 21.0703V28.9999H2.83105C1.54388 28.9999 0.500031 27.456 0.5 26.168L0.510742 13.8398L0.523438 13.6006C0.572307 13.1259 0.765569 12.6777 1.07715 12.3164L1.24219 12.1436L12.9062 1.13574Z"
                        strokeWidth="1"
                      />
                    </svg>
                  ))}
                {tab.icon === "estadistico" &&
                  (isActive ? (
                    <svg className="w-7 h-7 mb-1" viewBox="0 0 512 512" fill="currentColor">
                      <path d="M124.52,239.304H16.696C7.475,239.304,0,246.78,0,256v215.647c0,9.22,7.475,16.696,16.696,16.696H124.52c9.22,0,16.696-7.475,16.696-16.696V256C141.215,246.78,133.74,239.304,124.52,239.304z" />
                      <path d="M309.912,23.658H202.089c-9.22,0-16.696,7.475-16.696,16.696v431.293c0,9.22,7.475,16.696,16.696,16.696h107.824c9.22,0,16.696-7.474,16.696-16.695V40.353C326.608,31.133,319.133,23.658,309.912,23.658z" />
                      <path d="M495.304,131.48H387.481c-9.22,0-16.696,7.475-16.696,16.696v323.47c0,9.22,7.475,16.696,16.696,16.696h107.824c9.22,0,16.696-7.475,16.696-16.696v-323.47C512,138.956,504.525,131.48,495.304,131.48z" />
                    </svg>
                  ) : (
                    <svg className="w-7 h-7 mb-1" viewBox="0 0 27 27" fill="none" stroke="currentColor">
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
                    <svg className="w-7 h-7 mb-1" viewBox="0 0 27 27" fill="currentColor">
                      <g clipPath="url(#clip0_2886_1784)">
                        <path d="M26.8981 17.8481L23.9776 11.7274C23.916 8.62516 22.6808 5.71632 20.4837 3.51384C18.2291 1.25347 15.2302 0.00576782 12.0392 0C12.0318 0 12.0252 0 12.0178 0C8.86833 0 5.8874 1.2442 3.62332 3.50416C1.35142 5.77235 0.0546875 8.83733 0.0546875 12.0646V25.9453C0.0546875 26.5279 0.526825 27 1.10938 27H14.0787C14.6611 27 15.1334 26.5279 15.1334 25.9453V23.9424H18.3436C21.0916 23.9424 23.3864 21.9649 23.8814 19.3572H25.9462C26.7208 19.357 27.2316 18.5477 26.8981 17.8481ZM12.0312 3.8595H12.0293H12.0167C8.6679 3.8595 5.77657 5.97093 4.54308 8.89851C4.25119 9.59127 4.75876 10.3627 5.51496 10.3627H18.5504C19.2996 10.3627 19.8103 9.60157 19.5264 8.90861C18.3006 5.91367 15.3732 3.86547 12.0312 3.8595Z" />
                        <path
                          d="M19 9H4C5.5 6.27273 6.90098 4.00006 12 4C17 3.99994 18.3333 7.63636 19 9Z"
                          fill="white"
                        />
                      </g>
                    </svg>
                  ) : (
                    <svg className="w-7 h-7 mb-1" viewBox="0 0 25.95 26" fill="none" stroke="currentColor">
                      <g>
                        <path
                          d="M11.46,3.86c-3.05,0-5.8,1.86-7.01,4.73-.07.17-.06.36.05.52.1.16.27.25.46.25h13.04c.19,0,.35-.09.46-.25.1-.16.12-.35.05-.52-1.18-2.87-3.94-4.73-7.03-4.74M11.47,4.97c2,0,3.86.91,5.09,2.48l.64.81H5.77l.65-.81c1.26-1.57,3.1-2.47,5.04-2.47h.01Z"
                          strokeWidth="0.8"
                        />
                        <path
                          d="M11.46,0c-3.02,0-5.87,1.19-8.04,3.36C1.22,5.56,0,8.47,0,11.56v13.88c0,.31.25.55.55.55h12.97c.31,0,.55-.25.55-.55v-2.5h3.71c2.46,0,4.59-1.76,5.05-4.18l.08-.41h2.48c.19,0,.36-.09.47-.26.1-.16.12-.36.03-.53l-2.97-6.27c-.06-3.02-1.25-5.82-3.35-7.92C17.41,1.2,14.54,0,11.48,0M11.48,1.11c2.76,0,5.36,1.08,7.31,3.04,1.95,1.96,3.03,4.56,3.03,7.32,0,.08.02.16.05.24l2.64,5.54h-2.14c-.31,0-.55.25-.55.55,0,2.22-1.81,4.03-4.03,4.03h-4.26c-.31,0-.55.25-.55.55v2.5H1.11v-13.33c0-2.79,1.10-5.43,3.10-7.42,1.96-1.96,4.54-3.03,7.26-3.03h.02Z"
                          strokeWidth="0.8"
                        />
                      </g>
                    </svg>
                  ))}
                {tab.icon === "perfil" && (
                  <div
                    className={`w-7 h-7 mb-1 rounded-full flex items-center justify-center text-[10px] font-medium overflow-hidden border-2 ${
                      isActive ? "bg-gray-900 text-white border-gray-900" : "bg-transparent border-gray-400"
                    }`}
                  >
                    {userProfile?.avatar_url ? (
                      <img
                        src={userProfile.avatar_url || "/placeholder.svg"}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className={`text-[8px] font-bold ${isActive ? "text-white" : "text-gray-400"}`}>
                        {userProfile?.username?.slice(0, 2).toUpperCase() || "U"}
                      </span>
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

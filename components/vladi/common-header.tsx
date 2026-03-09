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
  onRadarClick?: () => void
}

export function CommonHeader({ onNotificationsClick, notificationCount = 0, onRadarClick }: CommonHeaderProps) {
  return (
    <div className="px-5 pt-[max(16px,env(safe-area-inset-top))] pb-3 flex items-center justify-between">
      <div className="text-2xl font-semibold text-gray-900 tracking-tight">Actividad</div>

      <div className="flex items-center gap-1">
        {/* Radar icon */}
        <button
          onClick={onRadarClick}
          className="relative w-10 h-10 flex items-center justify-center text-gray-900 hover:opacity-70 active:opacity-50"
          aria-label="Radar emocional"
        >
          <svg className="w-[22px] h-[22px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <circle cx="12" cy="12" r="6" />
            <circle cx="12" cy="12" r="2" />
            <line x1="12" y1="2" x2="12" y2="4" />
            <line x1="12" y1="20" x2="12" y2="22" />
            <line x1="2" y1="12" x2="4" y2="12" />
            <line x1="20" y1="12" x2="22" y2="12" />
          </svg>
        </button>

        {/* Notifications icon */}
        <button
          onClick={onNotificationsClick}
          className="relative w-10 h-10 flex items-center justify-center text-gray-900 hover:opacity-70 active:opacity-50"
          aria-label="Notificaciones"
        >
          <svg className="w-[20px] h-[20px]" viewBox="0 0 19 23" fill="none">
            <path
              d="M9.41408 0C12.8759 0 16.5228 2.52998 16.8864 6.40356L16.8875 6.41163C16.9203 6.80166 16.92 7.18758 16.9188 7.53407C16.9176 7.86925 16.9169 8.16752 16.9344 8.45809C17.0739 9.10296 17.3515 9.7062 17.7495 10.2208L17.9326 10.4411L18.0041 10.5345C18.4551 11.2213 18.713 12.022 18.7489 12.8486C18.7494 12.8609 18.75 12.8732 18.75 12.8856V13.2905C18.7291 14.3279 18.3617 15.328 17.7093 16.1271C17.6985 16.1404 17.6875 16.1538 17.6758 16.1664C16.7842 17.1274 15.5865 17.7224 14.3037 17.8437L14.3048 17.8448C11.0285 18.2082 7.72266 18.2073 4.44631 17.8448H4.44296C4.44039 17.8445 4.43772 17.8451 4.43515 17.8448C3.15484 17.719 1.96018 17.1243 1.06636 16.1687C1.05271 16.1541 1.03873 16.1393 1.02616 16.1237C0.385092 15.3284 0.0245205 14.3338 0 13.3032V12.8844C1.9143e-06 12.8705 0.000441016 12.8567 0.0011166 12.8429C0.0419216 12.0169 0.298594 11.2174 0.743658 10.5299L0.82182 10.4273C1.31377 9.8782 1.65416 9.20446 1.81336 8.4754C1.81346 7.81653 1.81581 7.11221 1.87478 6.41163V6.40702C2.22444 2.52995 5.87499 0 9.33592 0H9.41408ZM9.33592 1.65424C6.47705 1.65424 3.725 3.74507 3.46817 6.55468C3.41317 7.20814 3.41346 7.87775 3.41346 8.57806C3.41343 8.63466 3.40789 8.69109 3.39671 8.74649C3.19114 9.76418 2.72657 10.7049 2.05567 11.4782C1.78265 11.9108 1.62559 12.4109 1.60009 12.9271V13.1301C1.5864 13.8237 1.81253 14.4992 2.23544 15.037C2.8638 15.7002 3.69875 16.1125 4.59371 16.1987L4.60599 16.1998C7.77243 16.551 10.9675 16.551 14.134 16.1998L14.1485 16.1987C15.0414 16.1166 15.8743 15.7049 16.4989 15.0416C16.9354 14.4982 17.1658 13.819 17.1488 13.1243V12.9086C17.1245 12.4052 16.9688 11.9173 16.6977 11.4932C16.0274 10.7146 15.5639 9.76936 15.3555 8.7488C15.348 8.71215 15.3425 8.67425 15.3399 8.6369C15.3131 8.25257 15.3163 7.86948 15.3176 7.5283C15.3188 7.17846 15.318 6.86638 15.293 6.5639L15.2617 6.30204C14.8575 3.61911 12.1847 1.65424 9.41408 1.65424H9.33592Z"
              fill="currentColor"
            />
            <path
              d="M11.139 19.9587C11.416 19.6029 11.9201 19.5458 12.2646 19.8318C12.609 20.118 12.6633 20.6387 12.3863 20.9946C12.1909 21.2456 11.9651 21.4719 11.713 21.666L11.7119 21.6648C10.9032 22.3046 9.88537 22.5954 8.87345 22.4723C7.85734 22.3486 6.92807 21.818 6.28517 20.9957C6.00785 20.6405 6.06204 20.1197 6.40576 19.8329C6.74963 19.5464 7.25367 19.6024 7.5313 19.9575C7.91141 20.4434 8.46044 20.7565 9.06104 20.8296C9.66186 20.9027 10.2669 20.7302 10.746 20.3486L10.756 20.3393C10.8991 20.2293 11.0279 20.1013 11.139 19.9587Z"
              fill="currentColor"
            />
          </svg>
          {notificationCount > 0 && (
            <span className="absolute top-1 right-1 min-w-[16px] h-4 px-0.5 bg-red-500 text-white text-[9px] font-semibold rounded-full flex items-center justify-center">
              {notificationCount > 99 ? "99+" : notificationCount}
            </span>
          )}
        </button>
      </div>
    </div>
  )
}

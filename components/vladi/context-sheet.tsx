"use client"

import type React from "react"
import { useState, useEffect, useRef, useCallback } from "react"
import { X, Plus, Eye, ChevronRight, Check } from "lucide-react"
import { useVladiStore } from "@/lib/vladi-store"
import type { EmotionData } from "./emotion-screen"
import { GroupsPeopleScreen } from "./groups-people-screen"

// Custom SVG icons as components
const PersonIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 505.189 505.189" fill="currentColor">
    <path d="m448.908 34.691c-5.362-.529-10.707 1.149-14.806 4.646l-109.638 93.003c-39.899 29.17-81.065 33.226-122.793 12.522-11.536-5.987-22.305-13.347-32.073-21.92l-98.481-83.612c-8.728-7.015-21.466-5.749-28.644 2.846-6.772 8.534-5.455 20.921 2.96 27.84l130.199 108.065c1.829 1.52 2.888 3.775 2.889 6.154v311.83c14.321 7.37 31.32 7.37 45.641 0v-156.779c0-4.413 3.577-7.99 7.99-7.99h40.917c4.413-.004 7.993 3.57 7.997 7.983v.007 156.779c14.321 7.37 31.32 7.37 45.641 0v-311.844c.001-2.379 1.059-4.634 2.889-6.154l130.197-108.066c4.62-3.786 7.291-9.451 7.271-15.425.022-10.334-7.862-18.969-18.156-19.885z"/>
    <circle cx="252.594" cy="55" r="55"/>
  </svg>
)

const PeopleIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 101 100" fill="currentColor">
    <path d="m56.9199 31.25c0 3.4531-2.7969 6.25-6.25 6.25s-6.25-2.7969-6.25-6.25 2.7969-6.25 6.25-6.25 6.25 2.7969 6.25 6.25z"/>
    <path d="m34.002 37.5c0 3.4531-2.7969 6.25-6.25 6.25-3.4492 0-6.25-2.7969-6.25-6.25s2.8008-6.25 6.25-6.25c3.4531 0 6.25 2.7969 6.25 6.25z"/>
    <path d="m79.8381 37.5c0 3.4531-2.8008 6.25-6.25 6.25-3.4531 0-6.25-2.7969-6.25-6.25s2.7969-6.25 6.25-6.25c3.4492 0 6.25 2.7969 6.25 6.25z"/>
    <path d="m73.588 47.918c-1.875 0-3.543.625-5.207 1.457l-17.707 10.418-17.707-10.418c-1.6719-.8321-3.3398-1.457-5.2148-1.457-5.832 0-10.418 4.582-10.418 10.418v16.668h20.832v-12.918l10.418 6.25c.418.207.625.4179 1.043.4179s.625.2071 1.043.2071.625 0 1.043-.2071c.418 0 .625-.207 1.043-.4179l10.418-6.25-.0039 12.914h20.832v-16.668c0-5.832-4.582-10.414-10.414-10.414z"/>
    <path d="m50.6699 55 10-5.832c-1.25-4.168-5.207-7.293-10-7.293s-8.543 3.125-10 7.293z"/>
  </svg>
)

const ClockIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 32 32" fill="currentColor">
    <path d="m16 31a15 15 0 1 1 15-15 15 15 0 0 1 -15 15zm0-28a13 13 0 1 0 13 13 13 13 0 0 0 -13-13zm-4.29 18.71 5-5a1 1 0 0 0 .29-.71v-6a1 1 0 0 0 -2 0v5.59l-4.71 4.7a1 1 0 0 0 0 1.42 1 1 0 0 0 1.42 0z"/>
  </svg>
)

const BodyMindIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 60 54" fill="currentColor">
    <path d="m58.217 23.667c.007-.008.009-.019.016-.028 2.559-2.874 2.309-7.277-.558-9.843l-.008-.011-.01-.008c.224-.323.422-.664.592-1.019.088-.169.165-.342.232-.52.331-.875.507-1.802.519-2.738-.004-4.14-3.36-7.496-7.5-7.5-.18 0-.371.011-.562.022-.175.013-.339.035-.488.057-.414.054-.822.145-1.22.27l-.013-.016s-.01-.006-.014-.011c-2.288-2.563-6.105-3.07-8.982-1.192-.029.016-.061.018-.089.037s-.066.052-.1.076c-.009.006-.019.01-.027.016-.339-.239-.699-.446-1.077-.617-1.831-.843-3.937-.856-5.779-.035-1.841.821-3.24 2.396-3.836 4.322-3.238-3.195-7.616-4.969-12.165-4.928-4.549.041-8.894 1.893-12.074 5.146-6.758 6.876-6.758 17.9 0 24.777l23.375 23.644c.373.367.911.513 1.419.385s.912-.512 1.066-1.013c.01.007.018.016.028.024 1.509 1.161 3.546 1.363 5.253.521s2.787-2.581 2.785-4.485c3.864-.005 6.995-3.136 7-7 3.864-.005 6.995-3.136 7-7v-.071c.023 0 .046-.01.069-.013s.052 0 .08-.007.033-.015.052-.019c3.349-.586 5.794-3.491 5.799-6.89 0-.228-.012-.455-.035-.682-.072-.736-.26-1.457-.556-2.135-.174-.381-.373-.75-.595-1.105.106-.1.2-.209.3-.315.033-.034.072-.063.103-.096z"/>
  </svg>
)

const CameraIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 420.8 420.8" fill="currentColor">
    <path d="M406.8,96.4c-8.4-8.8-20-14-33.2-14h-66.4v-0.8c0-10-4-19.6-10.8-26c-6.8-6.8-16-10.8-26-10.8h-120 c-10.4,0-19.6,4-26.4,10.8c-6.8,6.8-10.8,16-10.8,26v0.8h-66c-13.2,0-24.8,5.2-33.2,14c-8.4,8.4-14,20.4-14,33.2v199.2 C0,342,5.2,353.6,14,362c8.4,8.4,20.4,14,33.2,14h326.4c13.2,0,24.8-5.2,33.2-14c8.4-8.4,14-20.4,14-33.2V129.6 C420.8,116.4,415.6,104.8,406.8,96.4z M400,328.8h-0.4c0,7.2-2.8,13.6-7.6,18.4s-11.2,7.6-18.4,7.6H47.2 c-7.2,0-13.6-2.8-18.4-7.6c-4.8-4.8-7.6-11.2-7.6-18.4V129.6c0-7.2,2.8-13.6,7.6-18.4s11.2-7.6,18.4-7.6h77.2 c6,0,10.8-4.8,10.8-10.8V81.2c0-4.4,1.6-8.4,4.4-11.2s6.8-4.4,11.2-4.4h119.6c4.4,0,8.4,1.6,11.2,4.4c2.8,2.8,4.4,6.8,4.4,11.2 v11.6c0,6,4.8,10.8,10.8,10.8H374c7.2,0,13.6,2.8,18.4,7.6s7.6,11.2,7.6,18.4V328.8z"/>
    <path d="M210.4,130.8c-27.2,0-52,11.2-69.6,28.8c-18,18-28.8,42.4-28.8,69.6s11.2,52,28.8,69.6c18,18,42.4,28.8,69.6,28.8 s52-11.2,69.6-28.8c18-18,28.8-42.4,28.8-69.6s-11.2-52-28.8-69.6C262.4,142,237.6,130.8,210.4,130.8z M264.8,284 c-14,13.6-33.2,22.4-54.4,22.4S170,297.6,156,284c-14-14-22.4-33.2-22.4-54.4c0-21.2,8.8-40.4,22.4-54.4 c14-14,33.2-22.4,54.4-22.4s40.4,8.8,54.4,22.4c14,14,22.4,33.2,22.4,54.4C287.6,250.8,278.8,270,264.8,284z"/>
    <circle cx="352.8" cy="150" r="19.6"/>
  </svg>
)

// Context question types
type ContextQuestionType = "photo" | "activity" | "company" | "time" | "body"

interface ContextSheetProps {
  emotionData: EmotionData
  onClose: () => void
  onPublish: (
    text: string,
    tags: string[],
    privacy: string,
    bodySignals?: string[],
    timeReference?: string,
    certainty?: string,
    photoUrl?: string,
  ) => void
  userId?: string
}

interface PrivacyGroup {
  id: string
  name: string
}

const defaultGroups: PrivacyGroup[] = [
  { id: "all", name: "Todos" },
  { id: "me", name: "Solo yo" },
  { id: "family", name: "Familia" },
  { id: "friends", name: "Amigos cercanos" },
]

export function ContextSheet({ emotionData, onClose, onPublish, userId }: ContextSheetProps) {
  const [text, setText] = useState("")
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set())
  const [selectedPersonaId, setSelectedPersonaId] = useState("all")
  const [groups, setGroups] = useState<PrivacyGroup[]>(defaultGroups)
  const [showPersonas, setShowPersonas] = useState(false)
  const [showPlaceholder, setShowPlaceholder] = useState(true)
  const [typedPlaceholder, setTypedPlaceholder] = useState("")
  const [showGroupsPeople, setShowGroupsPeople] = useState(false)
  const [activityText, setActivityText] = useState("")
  const [companyText, setCompanyText] = useState("")
  const [bodySignals, setBodySignals] = useState<Set<string>>(new Set())
  const [timeReference, setTimeReference] = useState<string>("")
  const [certainty, setCertainty] = useState<string>("")
  const [keyboardVisible, setKeyboardVisible] = useState(false)
  const [photoUrl, setPhotoUrl] = useState<string>("")
  const [activeQuestion, setActiveQuestion] = useState<ContextQuestionType | null>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const sheetRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { activities, company, addActivity, addCompany } = useVladiStore()

  // Track visual viewport offset so the sheet stays above the keyboard
  const [vpOffset, setVpOffset] = useState(0)

  useEffect(() => {
    const vv = typeof window !== "undefined" ? window.visualViewport : null
    if (!vv) return

    const sync = () => {
      // offsetTop = how far the viewport has been pushed down by the keyboard
      setVpOffset(window.innerHeight - vv.height)
      setKeyboardVisible(vv.height < window.innerHeight * 0.75)
    }
    vv.addEventListener("resize", sync)
    vv.addEventListener("scroll", sync)
    return () => {
      vv.removeEventListener("resize", sync)
      vv.removeEventListener("scroll", sync)
    }
  }, [])

  const now = new Date()
  const dateStr = `Hoy, ${now.getDate()} ${now.toLocaleString("es-ES", { month: "short" })} ${now.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}`

  const quadrantColors: Record<string, string> = {
    green: "#94B22E",
    yellow: "#E6B04F",
    red: "#E6584F",
    blue: "#466D91",
  }

  const currentPrivacy = groups.find((g) => g.id === selectedPersonaId)?.name || "Todos"
  const isAllSelected = selectedPersonaId === "all"

  useEffect(() => {
    const placeholder = "Escribe algo..."
    let i = 0
    const interval = setInterval(() => {
      setTypedPlaceholder(placeholder.slice(0, i + 1))
      i++
      if (i >= placeholder.length) clearInterval(interval)
    }, 60)
    return () => clearInterval(interval)
  }, [])

  const toggleTag = (tag: string) => {
    const newTags = new Set(selectedTags)
    if (newTags.has(tag)) {
      newTags.delete(tag)
    } else {
      newTags.add(tag)
    }
    setSelectedTags(newTags)
  }

  const resetPrivacy = (e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedPersonaId("all")
  }

  const handlePublish = () => {
    const allTags = Array.from(selectedTags)
    if (activityText.trim()) {
      allTags.push(`Actividad: ${activityText.trim()}`)
    }
    if (companyText.trim()) {
      allTags.push(`Compañía: ${companyText.trim()}`)
    }

    onPublish(text, allTags, currentPrivacy, Array.from(bodySignals), timeReference, certainty, photoUrl)
  }

  // Handle photo upload
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setPhotoUrl(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  if (showGroupsPeople) {
    return <GroupsPeopleScreen onClose={() => setShowGroupsPeople(false)} userId={userId} />
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-[100] transition-opacity" onClick={onClose} />

      {/* Sheet - compact, grows with content, keyboard-aware */}
      <div
        ref={sheetRef}
        className="fixed inset-x-0 z-[101] animate-in slide-in-from-bottom duration-500"
        style={{
          bottom: vpOffset > 0 ? `${vpOffset}px` : "0px",
          maxHeight: keyboardVisible ? `calc(100dvh - ${vpOffset}px)` : "70dvh",
          transition: "bottom 0.15s ease-out, max-height 0.15s ease-out",
        }}
      >
        <div className="bg-white w-full rounded-t-[32px] px-6 sm:px-10 pt-4 pb-6 sm:pb-8 flex flex-col items-center shadow-[0_-10px_40px_rgba(0,0,0,0.15)] overflow-y-auto max-h-[inherit]">
          {/* Handle */}
          <div className="w-12 h-1 bg-gray-300 rounded-full mb-3 opacity-50 shrink-0" />

          {/* Header */}
          <div className="text-center w-full mb-1 shrink-0">
            <p className="text-gray-400 text-xs font-light mb-1">{dateStr}</p>
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="text-gray-500 font-light text-base sm:text-lg">Te sientes</span>
              <span
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: quadrantColors[emotionData.quadrant] }}
              />
              <span className="text-gray-900 font-medium text-base sm:text-lg">{emotionData.emotion}</span>
            </div>

            {/* Privacy selector */}
            <div className="bg-gray-100 rounded-full inline-flex items-center transition-colors hover:bg-gray-200">
              <button
                onClick={() => setShowPersonas(true)}
                className="pl-3 sm:pl-4 py-1.5 flex items-center gap-1.5 sm:gap-2 touch-manipulation"
              >
                <Eye className="w-4 h-4 text-gray-700" />
                <span className="text-xs sm:text-sm font-medium text-gray-800">{currentPrivacy}</span>
              </button>
              {isAllSelected ? (
                <button
                  onClick={() => setShowPersonas(true)}
                  className="pr-3 sm:pr-4 py-1.5 flex items-center touch-manipulation"
                >
                  <ChevronRight className="w-3 h-3 text-gray-400" />
                </button>
              ) : (
                <button
                  onClick={resetPrivacy}
                  className="pr-2 sm:pr-3 pl-1 py-1.5 flex items-center border-l border-gray-200 ml-1 touch-manipulation"
                >
                  <X className="w-3 h-3 text-gray-500" />
                </button>
              )}
            </div>
          </div>

          {/* Context question icons row */}
          <div className="flex items-center justify-center gap-3 mt-4">
            {/* Photo icon */}
            <button
              onClick={() => setActiveQuestion("photo")}
              className={`w-11 h-11 rounded-full flex items-center justify-center transition-all touch-manipulation relative ${
                photoUrl 
                  ? "bg-foreground" 
                  : "bg-transparent border border-gray-300 hover:border-gray-400"
              }`}
            >
              <CameraIcon className={`w-5 h-5 ${photoUrl ? "text-background" : "text-gray-600"}`} />
              {photoUrl && (
                <div className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-foreground rounded-full flex items-center justify-center border-2 border-background">
                  <Check className="w-2.5 h-2.5 text-background" strokeWidth={3} />
                </div>
              )}
            </button>

            {/* Activity icon - What were you doing */}
            <button
              onClick={() => setActiveQuestion("activity")}
              className={`w-11 h-11 rounded-full flex items-center justify-center transition-all touch-manipulation relative ${
                activityText || selectedTags.size > 0
                  ? "bg-foreground" 
                  : "bg-transparent border border-gray-300 hover:border-gray-400"
              }`}
            >
              <PersonIcon className={`w-5 h-5 ${activityText || selectedTags.size > 0 ? "text-background" : "text-gray-600"}`} />
              {(activityText || selectedTags.size > 0) && (
                <div className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-foreground rounded-full flex items-center justify-center border-2 border-background">
                  <Check className="w-2.5 h-2.5 text-background" strokeWidth={3} />
                </div>
              )}
            </button>

            {/* Company icon - Who were you with */}
            <button
              onClick={() => setActiveQuestion("company")}
              className={`w-11 h-11 rounded-full flex items-center justify-center transition-all touch-manipulation relative ${
                companyText
                  ? "bg-foreground" 
                  : "bg-transparent border border-gray-300 hover:border-gray-400"
              }`}
            >
              <PeopleIcon className={`w-5 h-5 ${companyText ? "text-background" : "text-gray-600"}`} />
              {companyText && (
                <div className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-foreground rounded-full flex items-center justify-center border-2 border-background">
                  <Check className="w-2.5 h-2.5 text-background" strokeWidth={3} />
                </div>
              )}
            </button>

            {/* Time icon - When was it */}
            <button
              onClick={() => setActiveQuestion("time")}
              className={`w-11 h-11 rounded-full flex items-center justify-center transition-all touch-manipulation relative ${
                timeReference
                  ? "bg-foreground" 
                  : "bg-transparent border border-gray-300 hover:border-gray-400"
              }`}
            >
              <ClockIcon className={`w-5 h-5 ${timeReference ? "text-background" : "text-gray-600"}`} />
              {timeReference && (
                <div className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-foreground rounded-full flex items-center justify-center border-2 border-background">
                  <Check className="w-2.5 h-2.5 text-background" strokeWidth={3} />
                </div>
              )}
            </button>

            {/* Body icon - Where do you feel it */}
            <button
              onClick={() => setActiveQuestion("body")}
              className={`w-11 h-11 rounded-full flex items-center justify-center transition-all touch-manipulation relative ${
                bodySignals.size > 0
                  ? "bg-foreground" 
                  : "bg-transparent border border-gray-300 hover:border-gray-400"
              }`}
            >
              <BodyMindIcon className={`w-5 h-5 ${bodySignals.size > 0 ? "text-background" : "text-gray-600"}`} />
              {bodySignals.size > 0 && (
                <div className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-foreground rounded-full flex items-center justify-center border-2 border-background">
                  <Check className="w-2.5 h-2.5 text-background" strokeWidth={3} />
                </div>
              )}
            </button>
          </div>

          {/* Selected context chips - shows what's been filled */}
          {(selectedTags.size > 0 || activityText || companyText || timeReference || bodySignals.size > 0) && (
            <div className="w-full flex flex-wrap justify-center gap-2 mt-3 px-2 shrink-0">
              {Array.from(selectedTags).map((tag) => (
                <div
                  key={tag}
                  className="bg-gray-100 px-3 py-1.5 rounded-full flex items-center gap-1.5 text-xs sm:text-sm text-gray-700 font-medium"
                >
                  {tag}
                  <button
                    onClick={() => toggleTag(tag)}
                    className="text-gray-400 hover:text-gray-600 touch-manipulation"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              {activityText && !selectedTags.has(activityText) && (
                <div className="bg-gray-100 px-3 py-1.5 rounded-full flex items-center gap-1.5 text-xs sm:text-sm text-gray-700 font-medium">
                  {activityText}
                  <button
                    onClick={() => setActivityText("")}
                    className="text-gray-400 hover:text-gray-600 touch-manipulation"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
              {companyText && (
                <div className="bg-gray-100 px-3 py-1.5 rounded-full flex items-center gap-1.5 text-xs sm:text-sm text-gray-700 font-medium">
                  {companyText}
                  <button
                    onClick={() => setCompanyText("")}
                    className="text-gray-400 hover:text-gray-600 touch-manipulation"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
              {timeReference && (
                <div className="bg-gray-100 px-3 py-1.5 rounded-full flex items-center gap-1.5 text-xs sm:text-sm text-gray-700 font-medium">
                  {timeReference}
                  <button
                    onClick={() => setTimeReference("")}
                    className="text-gray-400 hover:text-gray-600 touch-manipulation"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
              {bodySignals.size > 0 && (
                <div className="bg-gray-100 px-3 py-1.5 rounded-full flex items-center gap-1.5 text-xs sm:text-sm text-gray-700 font-medium">
                  {Array.from(bodySignals).join(", ")}
                  <button
                    onClick={() => setBodySignals(new Set())}
                    className="text-gray-400 hover:text-gray-600 touch-manipulation"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Input area - compact, auto-grows, no scroll jump */}
          <div className="w-full relative mt-2 mb-4">
            <textarea
              ref={inputRef}
              value={text}
              onChange={(e) => {
                setText(e.target.value)
                // Auto-grow: reset height then set to scrollHeight
                e.target.style.height = "auto"
                e.target.style.height = `${Math.min(e.target.scrollHeight, 200)}px`
              }}
              onFocus={() => setShowPlaceholder(false)}
              onBlur={() => !text && setShowPlaceholder(true)}
              rows={1}
              className="w-full border-none outline-none font-sans font-light text-xl sm:text-2xl text-gray-900 text-center resize-none bg-transparent leading-relaxed relative z-10 py-3 px-2"
              style={{ caretColor: "#111", minHeight: "48px", maxHeight: "200px", overflow: "auto" }}
              placeholder=""
            />
            {showPlaceholder && !text && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-[5]">
                <span className="font-light text-xl sm:text-2xl text-gray-400 whitespace-pre">{typedPlaceholder}</span>
                <span className="blinking-cursor" />
              </div>
            )}
          </div>

          {/* Publish button */}
          <button
            onClick={handlePublish}
            className="w-full bg-gray-900 text-white rounded-full py-3.5 sm:py-4 text-base font-normal flex items-center justify-center shadow-[0_10px_25px_rgba(0,0,0,0.15)] active:scale-[0.98] transition-transform shrink-0 touch-manipulation"
            style={{ paddingBottom: keyboardVisible ? "14px" : "max(14px, env(safe-area-inset-bottom))" }}
          >
            Publicar
          </button>
        </div>
      </div>

      {showPersonas && (
        <div className="fixed inset-0 z-[150] bg-white flex flex-col animate-in slide-in-from-bottom duration-400">
          <div
            className="flex justify-between items-center px-4 sm:px-6 pt-8 sm:pt-12 pb-4"
            style={{ paddingTop: "max(32px, env(safe-area-inset-top))" }}
          >
            <button onClick={() => setShowPersonas(false)} className="p-2 -ml-2 touch-manipulation">
              <ChevronRight className="w-6 h-6 text-gray-800 rotate-180" />
            </button>
            <h2 className="text-lg font-bold text-gray-800">Personas</h2>
            <button
              onClick={() => setShowPersonas(false)}
              className="text-base sm:text-lg font-medium text-gray-900 touch-manipulation"
            >
              Listo
            </button>
          </div>

          <div className="px-6 sm:px-8 mt-4 sm:mt-6 overflow-y-auto flex-grow pb-10">
            <h1 className="text-lg sm:text-xl font-normal text-gray-900 mb-2">Elige quién puede ver esta emoción</h1>
            <p className="text-xs sm:text-sm text-gray-500 font-light leading-relaxed mb-6 sm:mb-8">
              Tus emociones se compartirán en tu perfil privado pero solo se mostrarán a las personas que elijas.
            </p>

            {/* Personas list */}
            <div className="space-y-2 mb-6 sm:mb-8">
              {groups.map((group) => {
                const isSelected = group.id === selectedPersonaId
                return (
                  <button
                    key={group.id}
                    onClick={() => setSelectedPersonaId(group.id)}
                    className={`w-full flex items-center justify-between px-4 sm:px-5 py-3 sm:py-4 rounded-2xl border-2 transition-all touch-manipulation ${
                      isSelected ? "border-gray-900 bg-gray-50" : "border-gray-100 bg-white hover:border-gray-200"
                    }`}
                  >
                    <span
                      className={`text-sm sm:text-base ${isSelected ? "font-medium text-gray-900" : "font-normal text-gray-700"}`}
                    >
                      {group.name}
                    </span>
                    <div
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                        isSelected ? "border-gray-900 bg-gray-900" : "border-gray-300 bg-white"
                      }`}
                    >
                      {isSelected && <Check className="w-4 h-4 text-white" strokeWidth={3} />}
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Manage groups link */}
            <div className="border-t border-gray-100 pt-4">
              <button
                onClick={() => {
                  setShowPersonas(false)
                  setShowGroupsPeople(true)
                }}
                className="text-gray-600 font-medium text-sm flex items-center justify-between w-full hover:text-gray-900 transition-colors touch-manipulation py-2"
              >
                <span>Gestiona tus grupos y personas</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden file input for photo */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handlePhotoUpload}
      />

      {/* Photo Modal */}
      {activeQuestion === "photo" && (
        <div className="fixed inset-0 z-[150] bg-white flex flex-col animate-in slide-in-from-bottom duration-400">
          <div
            className="flex justify-between items-center px-4 sm:px-6 pt-8 sm:pt-12 pb-4"
            style={{ paddingTop: "max(32px, env(safe-area-inset-top))" }}
          >
            <button onClick={() => setActiveQuestion(null)} className="p-2 -ml-2 touch-manipulation">
              <ChevronRight className="w-6 h-6 text-gray-800 rotate-180" />
            </button>
            <h2 className="text-lg font-bold text-gray-800">Añadir foto</h2>
            <button
              onClick={() => setActiveQuestion(null)}
              className="text-base sm:text-lg font-medium text-gray-900 touch-manipulation"
            >
              Listo
            </button>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center px-6 pb-8">
            {photoUrl ? (
              <div className="relative w-full max-w-sm">
                <img src={photoUrl} alt="Foto adjunta" className="w-full rounded-2xl shadow-lg" />
                <button
                  onClick={() => setPhotoUrl("")}
                  className="absolute top-3 right-3 w-8 h-8 bg-black/50 rounded-full flex items-center justify-center"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>
            ) : (
              <div className="text-center">
                <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-6">
                  <CameraIcon className="w-12 h-12 text-gray-400" />
                </div>
                <p className="text-gray-500 mb-6">Adjunta una foto a este registro emocional</p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-8 py-3 bg-foreground text-background rounded-full text-base font-medium active:scale-[0.98] transition-transform"
                >
                  Seleccionar foto
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Activity Modal - What were you doing */}
      {activeQuestion === "activity" && (
        <div className="fixed inset-0 z-[150] bg-white flex flex-col animate-in slide-in-from-bottom duration-400">
          <div
            className="flex justify-between items-center px-4 sm:px-6 pt-8 sm:pt-12 pb-4"
            style={{ paddingTop: "max(32px, env(safe-area-inset-top))" }}
          >
            <button onClick={() => setActiveQuestion(null)} className="p-2 -ml-2 touch-manipulation">
              <ChevronRight className="w-6 h-6 text-gray-800 rotate-180" />
            </button>
            <h2 className="text-lg font-bold text-gray-800">Actividad</h2>
            <button
              onClick={() => setActiveQuestion(null)}
              className="text-base sm:text-lg font-medium text-gray-900 touch-manipulation"
            >
              Listo
            </button>
          </div>

          <div className="px-6 mt-4 overflow-y-auto flex-grow pb-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">¿Qué estabas haciendo?</h3>
            <div className="flex flex-wrap gap-3 mb-6">
              {activities.map((activity) => (
                <button
                  key={activity}
                  onClick={() => toggleTag(activity)}
                  className={`px-5 py-3 rounded-full border text-[0.95rem] font-medium transition-all touch-manipulation ${
                    selectedTags.has(activity)
                      ? "bg-gray-900 text-white border-gray-900 shadow-lg"
                      : "bg-white text-gray-700 border-gray-200 hover:border-gray-300"
                  }`}
                >
                  {activity}
                </button>
              ))}
              <button
                onClick={() => {
                  const newActivity = prompt("Nueva actividad:")
                  if (newActivity) addActivity(newActivity)
                }}
                className="w-11 h-11 rounded-full border border-dashed border-gray-400 text-gray-500 flex items-center justify-center hover:border-gray-600 hover:text-gray-700 transition-colors touch-manipulation"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>

            <input
              type="text"
              value={activityText}
              onChange={(e) => setActivityText(e.target.value)}
              placeholder="Escribe algo más..."
              className="w-full border-b border-gray-200 px-0 py-3 text-base text-gray-900 placeholder:text-gray-400 font-light focus:outline-none focus:border-gray-400 transition-colors bg-transparent"
            />
          </div>
        </div>
      )}

      {/* Company Modal - Who were you with */}
      {activeQuestion === "company" && (
        <div className="fixed inset-0 z-[150] bg-white flex flex-col animate-in slide-in-from-bottom duration-400">
          <div
            className="flex justify-between items-center px-4 sm:px-6 pt-8 sm:pt-12 pb-4"
            style={{ paddingTop: "max(32px, env(safe-area-inset-top))" }}
          >
            <button onClick={() => setActiveQuestion(null)} className="p-2 -ml-2 touch-manipulation">
              <ChevronRight className="w-6 h-6 text-gray-800 rotate-180" />
            </button>
            <h2 className="text-lg font-bold text-gray-800">Compañía</h2>
            <button
              onClick={() => setActiveQuestion(null)}
              className="text-base sm:text-lg font-medium text-gray-900 touch-manipulation"
            >
              Listo
            </button>
          </div>

          <div className="px-6 mt-4 overflow-y-auto flex-grow pb-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">¿Con quién estabas?</h3>
            <div className="flex flex-wrap gap-3 mb-6">
              {company.map((person) => (
                <button
                  key={person}
                  onClick={() => {
                    if (companyText === person) {
                      setCompanyText("")
                    } else {
                      setCompanyText(person)
                    }
                  }}
                  className={`px-5 py-3 rounded-full border text-[0.95rem] font-medium transition-all touch-manipulation ${
                    companyText === person
                      ? "bg-gray-900 text-white border-gray-900 shadow-lg"
                      : "bg-white text-gray-700 border-gray-200 hover:border-gray-300"
                  }`}
                >
                  {person}
                </button>
              ))}
              <button
                onClick={() => {
                  const newPerson = prompt("Nueva persona:")
                  if (newPerson) addCompany(newPerson)
                }}
                className="w-11 h-11 rounded-full border border-dashed border-gray-400 text-gray-500 flex items-center justify-center hover:border-gray-600 hover:text-gray-700 transition-colors touch-manipulation"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>

            <input
              type="text"
              value={companyText}
              onChange={(e) => setCompanyText(e.target.value)}
              placeholder="Escribe algo más..."
              className="w-full border-b border-gray-200 px-0 py-3 text-base text-gray-900 placeholder:text-gray-400 font-light focus:outline-none focus:border-gray-400 transition-colors bg-transparent"
            />
          </div>
        </div>
      )}

      {/* Time Modal - When was it */}
      {activeQuestion === "time" && (
        <div className="fixed inset-0 z-[150] bg-white flex flex-col animate-in slide-in-from-bottom duration-400">
          <div
            className="flex justify-between items-center px-4 sm:px-6 pt-8 sm:pt-12 pb-4"
            style={{ paddingTop: "max(32px, env(safe-area-inset-top))" }}
          >
            <button onClick={() => setActiveQuestion(null)} className="p-2 -ml-2 touch-manipulation">
              <ChevronRight className="w-6 h-6 text-gray-800 rotate-180" />
            </button>
            <h2 className="text-lg font-bold text-gray-800">Momento</h2>
            <button
              onClick={() => setActiveQuestion(null)}
              className="text-base sm:text-lg font-medium text-gray-900 touch-manipulation"
            >
              Listo
            </button>
          </div>

          <div className="px-6 mt-4 overflow-y-auto flex-grow pb-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">¿Cuándo ha sido?</h3>
            <div className="flex flex-wrap gap-3 mb-8">
              {["Ahora mismo", "Por la mañana", "Por la tarde", "Por la noche", "Ayer", "Hace unos días"].map((time) => (
                <button
                  key={time}
                  onClick={() => setTimeReference(time)}
                  className={`px-5 py-3 rounded-full border text-[0.95rem] font-medium transition-all touch-manipulation ${
                    timeReference === time
                      ? "bg-gray-900 text-white border-gray-900 shadow-lg"
                      : "bg-white text-gray-700 border-gray-200 hover:border-gray-300"
                  }`}
                >
                  {time}
                </button>
              ))}
            </div>

            <input
              type="text"
              value={timeReference}
              onChange={(e) => setTimeReference(e.target.value)}
              placeholder="O escribe cuándo fue..."
              className="w-full border-b border-gray-200 px-0 py-3 text-base text-gray-900 placeholder:text-gray-400 font-light focus:outline-none focus:border-gray-400 transition-colors bg-transparent"
            />
          </div>
        </div>
      )}

      {/* Body Modal - Where do you feel it */}
      {activeQuestion === "body" && (
        <div className="fixed inset-0 z-[150] bg-white flex flex-col animate-in slide-in-from-bottom duration-400">
          <div
            className="flex justify-between items-center px-4 sm:px-6 pt-8 sm:pt-12 pb-4"
            style={{ paddingTop: "max(32px, env(safe-area-inset-top))" }}
          >
            <button onClick={() => setActiveQuestion(null)} className="p-2 -ml-2 touch-manipulation">
              <ChevronRight className="w-6 h-6 text-gray-800 rotate-180" />
            </button>
            <h2 className="text-lg font-bold text-gray-800">Cuerpo</h2>
            <button
              onClick={() => setActiveQuestion(null)}
              className="text-base sm:text-lg font-medium text-gray-900 touch-manipulation"
            >
              Listo
            </button>
          </div>

          <div className="px-6 mt-4 overflow-y-auto flex-grow pb-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">¿Dónde lo notas en el cuerpo?</h3>
            <div className="flex flex-wrap gap-3 mb-6">
              {["Cabeza", "Cuello", "Pecho", "Corazón", "Estómago", "Brazos", "Manos", "Piernas", "Espalda", "Todo el cuerpo"].map((bodyPart) => (
                <button
                  key={bodyPart}
                  onClick={() => {
                    const newBodySignals = new Set(bodySignals)
                    if (newBodySignals.has(bodyPart)) {
                      newBodySignals.delete(bodyPart)
                    } else {
                      newBodySignals.add(bodyPart)
                    }
                    setBodySignals(newBodySignals)
                  }}
                  className={`px-5 py-3 rounded-full border text-[0.95rem] font-medium transition-all touch-manipulation ${
                    bodySignals.has(bodyPart)
                      ? "bg-gray-900 text-white border-gray-900 shadow-lg"
                      : "bg-white text-gray-700 border-gray-200 hover:border-gray-300"
                  }`}
                >
                  {bodyPart}
                </button>
              ))}
            </div>

            {bodySignals.size > 0 && (
              <p className="text-sm text-gray-500 mt-4">
                Seleccionado: {Array.from(bodySignals).join(", ")}
              </p>
            )}
          </div>
        </div>
      )}
    </>
  )
}

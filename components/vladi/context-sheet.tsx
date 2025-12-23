"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { X, Plus, Eye, ChevronRight, Check } from "lucide-react"
import { useVladiStore } from "@/lib/vladi-store"
import type { EmotionData } from "./emotion-screen"
import { GroupsPeopleScreen } from "./groups-people-screen"

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
  const [showDetails, setShowDetails] = useState(false)
  const [showPlaceholder, setShowPlaceholder] = useState(true)
  const [typedPlaceholder, setTypedPlaceholder] = useState("")
  const [showGroupsPeople, setShowGroupsPeople] = useState(false)
  const [activityText, setActivityText] = useState("")
  const [companyText, setCompanyText] = useState("")
  const [bodySignals, setBodySignals] = useState<Set<string>>(new Set())
  const [timeReference, setTimeReference] = useState<string>("")
  const [certainty, setCertainty] = useState<string>("")
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const { activities, company, addActivity, addCompany } = useVladiStore()

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

    onPublish(text, allTags, currentPrivacy, Array.from(bodySignals), timeReference, certainty)
  }

  if (showGroupsPeople) {
    return <GroupsPeopleScreen onClose={() => setShowGroupsPeople(false)} userId={userId} />
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-[100] transition-opacity" onClick={onClose} />

      {/* Sheet - Better mobile height handling */}
      <div
        className="fixed bottom-0 left-0 right-0 z-[101] animate-in slide-in-from-bottom duration-500"
        style={{ height: "75dvh", maxHeight: "650px" }}
      >
        <div className="bg-white w-full h-full rounded-t-[40px] px-6 sm:px-10 py-6 sm:py-8 flex flex-col items-center shadow-[0_-10px_40px_rgba(0,0,0,0.2)] overflow-hidden">
          {/* Handle */}
          <div className="w-16 h-1 bg-gray-300 rounded-full mb-4 sm:mb-6 opacity-50 shrink-0" />

          {/* Header */}
          <div className="text-center w-full mb-2 shrink-0">
            <p className="text-gray-400 text-xs sm:text-sm font-light mb-2">{dateStr}</p>
            <div className="flex items-center justify-center gap-2 mb-3 sm:mb-4">
              <span className="text-gray-500 font-light text-base sm:text-lg">Te sientes</span>
              <span
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: quadrantColors[emotionData.quadrant] }}
              />
              <span className="text-gray-900 font-medium text-base sm:text-lg">{emotionData.emotion}</span>
            </div>

            <div className="flex items-center justify-center gap-2 sm:gap-3">
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
              <button
                onClick={() => setShowDetails(true)}
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors touch-manipulation"
              >
                <Plus className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>

          {/* Selected tags */}
          {selectedTags.size > 0 && (
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
            </div>
          )}

          {/* Input area - Aumentado tamaño del texto */}
          <div className="w-full flex-1 flex flex-col justify-start relative mt-2 mb-4 min-h-0 overflow-hidden">
            <textarea
              ref={inputRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onFocus={() => setShowPlaceholder(false)}
              onBlur={() => !text && setShowPlaceholder(true)}
              className="w-full h-full border-none outline-none font-sans font-light text-2xl sm:text-3xl text-gray-900 text-center resize-none bg-transparent leading-relaxed relative z-10 p-2 overflow-y-auto"
              style={{ caretColor: "#111" }}
            />
            {showPlaceholder && !text && (
              <div className="absolute top-2 left-0 right-0 flex items-start justify-center pointer-events-none z-[5]">
                <span className="font-light text-2xl sm:text-3xl text-gray-400 whitespace-pre">{typedPlaceholder}</span>
                <span className="blinking-cursor" />
              </div>
            )}
          </div>

          {/* Publish button */}
          <button
            onClick={handlePublish}
            className="w-full bg-gray-900 text-white rounded-full py-4 sm:py-5 text-base sm:text-lg font-normal flex items-center justify-center shadow-[0_10px_25px_rgba(0,0,0,0.15)] active:scale-[0.98] transition-transform shrink-0 touch-manipulation"
            style={{ marginBottom: "env(safe-area-inset-bottom)" }}
          >
            Guardar
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

      {/* Details overlay */}
      {showDetails && (
        <div className="fixed inset-0 z-[150] bg-white flex flex-col animate-in slide-in-from-bottom duration-400">
          <div
            className="flex justify-between items-center px-4 sm:px-6 pt-8 sm:pt-12 pb-4"
            style={{ paddingTop: "max(32px, env(safe-area-inset-top))" }}
          >
            <button onClick={() => setShowDetails(false)} className="p-2 -ml-2 touch-manipulation">
              <ChevronRight className="w-6 h-6 text-gray-800 rotate-180" />
            </button>
            <h2 className="text-lg font-bold text-gray-800">Más</h2>
            <button
              onClick={() => setShowDetails(false)}
              className="text-base sm:text-lg font-medium text-gray-900 touch-manipulation"
            >
              Listo
            </button>
          </div>

          <div
            className="px-4 mt-4 overflow-y-auto flex-grow pb-24"
            style={{ paddingBottom: "max(96px, calc(env(safe-area-inset-bottom) + 60px))" }}
          >
            {/* Sección: ¿Qué estabas haciendo? */}
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 sm:mb-6 text-left">
              ¿Qué estabas haciendo?
            </h3>
            <div className="flex flex-wrap gap-2 sm:gap-3 mb-4">
              {activities.map((activity) => (
                <button
                  key={activity}
                  onClick={() => toggleTag(activity)}
                  className={`px-4 sm:px-5 py-2.5 sm:py-3 rounded-full border text-sm sm:text-[0.95rem] font-medium transition-all touch-manipulation ${
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
                className="w-10 h-10 sm:w-11 sm:h-11 rounded-full border border-dashed border-gray-400 text-gray-500 flex items-center justify-center hover:border-gray-600 hover:text-gray-700 transition-colors touch-manipulation"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-8 sm:mb-10">
              <input
                type="text"
                value={activityText}
                onChange={(e) => setActivityText(e.target.value)}
                placeholder="Escribe algo..."
                className="w-full border-b border-gray-200 px-0 py-2 text-base text-gray-900 placeholder:text-gray-400 font-light focus:outline-none focus:border-gray-400 transition-colors bg-transparent"
                onBlur={(e) => {
                  if (e.target.value.trim()) {
                    const newTags = new Set(selectedTags)
                    newTags.add(`Actividad: ${e.target.value.trim()}`)
                    setSelectedTags(newTags)
                    e.target.value = ""
                  }
                }}
              />
            </div>

            {/* Sección: ¿Con quién estabas? */}
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 sm:mb-6 text-left mt-6 sm:mt-8">
              ¿Con quién estabas?
            </h3>
            <div className="flex flex-wrap gap-2 sm:gap-3 mb-4">
              {company.map((person) => (
                <button
                  key={person}
                  onClick={() => toggleTag(person)}
                  className={`px-4 sm:px-5 py-2.5 sm:py-3 rounded-full border text-sm sm:text-[0.95rem] font-medium transition-all touch-manipulation ${
                    selectedTags.has(person)
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
                className="w-10 h-10 sm:w-11 sm:h-11 rounded-full border border-dashed border-gray-400 text-gray-500 flex items-center justify-center hover:border-gray-600 hover:text-gray-700 transition-colors touch-manipulation"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-8 sm:mb-10">
              <input
                type="text"
                value={companyText}
                onChange={(e) => setCompanyText(e.target.value)}
                placeholder="Escribe algo..."
                className="w-full border-b border-gray-200 px-0 py-2 text-base text-gray-900 placeholder:text-gray-400 font-light focus:outline-none focus:border-gray-400 transition-colors bg-transparent"
                onBlur={(e) => {
                  if (e.target.value.trim()) {
                    const newTags = new Set(selectedTags)
                    newTags.add(`Compañía: ${e.target.value.trim()}`)
                    setSelectedTags(newTags)
                    e.target.value = ""
                  }
                }}
              />
            </div>

            {/* Sección: ¿Dónde lo notas en el cuerpo? */}
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 sm:mb-6 text-left mt-6 sm:mt-8">
              ¿Dónde lo notas en el cuerpo?
            </h3>
            <div className="flex flex-wrap gap-2 sm:gap-3 mb-4">
              {["Cabeza", "Cuello", "Brazos", "Piernas", "Corazón", "Estómago"].map((bodyPart) => (
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
                  className={`px-4 sm:px-5 py-2.5 sm:py-3 rounded-full border text-sm sm:text-[0.95rem] font-medium transition-all touch-manipulation ${
                    bodySignals.has(bodyPart)
                      ? "bg-gray-900 text-white border-gray-900 shadow-lg"
                      : "bg-white text-gray-700 border-gray-200 hover:border-gray-300"
                  }`}
                >
                  {bodyPart}
                </button>
              ))}
            </div>

            <div className="mb-8 sm:mb-10">
              <input
                type="text"
                placeholder="Escribe algo..."
                className="w-full border-b border-gray-200 px-0 py-2 text-base text-gray-900 placeholder:text-gray-400 font-light focus:outline-none focus:border-gray-400 transition-colors bg-transparent"
                onBlur={(e) => {
                  if (e.target.value.trim()) {
                    const newBodySignals = new Set(bodySignals)
                    newBodySignals.add(e.target.value.trim())
                    setBodySignals(newBodySignals)
                    e.target.value = ""
                  }
                }}
              />
            </div>

            {/* Sección: ¿Cuándo ha sido? */}
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 sm:mb-6 text-left mt-6 sm:mt-8">
              ¿Cuándo ha sido?
            </h3>
            <div className="flex flex-wrap gap-2 sm:gap-3 mb-4">
              {["Ahora mismo", "Hace 1-2h", "Hace 24h", "Hace +3 días", "Hace +1 mes", "No ha pasado"].map((time) => (
                <button
                  key={time}
                  onClick={() => setTimeReference(time)}
                  className={`px-4 sm:px-5 py-2.5 sm:py-3 rounded-full border text-sm sm:text-[0.95rem] font-medium transition-all touch-manipulation ${
                    timeReference === time
                      ? "bg-gray-900 text-white border-gray-900 shadow-lg"
                      : "bg-white text-gray-700 border-gray-200 hover:border-gray-300"
                  }`}
                >
                  {time}
                </button>
              ))}
            </div>

            <div className="mb-8 sm:mb-10">
              <input
                type="text"
                placeholder="Escribe algo..."
                className="w-full border-b border-gray-200 px-0 py-2 text-base text-gray-900 placeholder:text-gray-400 font-light focus:outline-none focus:border-gray-400 transition-colors bg-transparent"
                onBlur={(e) => {
                  if (e.target.value.trim()) {
                    setTimeReference(e.target.value.trim())
                    e.target.value = ""
                  }
                }}
              />
            </div>

            {/* Sección: ¿Qué tan seguro estoy de lo que siento? */}
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 sm:mb-6 text-left mt-6 sm:mt-8">
              ¿Qué tan seguro estoy de lo que siento?
            </h3>
            <div className="flex flex-wrap gap-2 sm:gap-3 mb-4">
              {["0-5%", "5-20%", "20-50%", "50-70%", "70-100%", "No lo sé"].map((cert) => (
                <button
                  key={cert}
                  onClick={() => setCertainty(cert)}
                  className={`px-4 sm:px-5 py-2.5 sm:py-3 rounded-full border text-sm sm:text-[0.95rem] font-medium transition-all touch-manipulation ${
                    certainty === cert
                      ? "bg-gray-900 text-white border-gray-900 shadow-lg"
                      : "bg-white text-gray-700 border-gray-200 hover:border-gray-300"
                  }`}
                >
                  {cert}
                </button>
              ))}
            </div>

            <div>
              <input
                type="text"
                placeholder="Escribe algo..."
                className="w-full border-b border-gray-200 px-0 py-2 text-base text-gray-900 placeholder:text-gray-400 font-light focus:outline-none focus:border-gray-400 transition-colors bg-transparent"
                onBlur={(e) => {
                  if (e.target.value.trim()) {
                    setCertainty(e.target.value.trim())
                    e.target.value = ""
                  }
                }}
              />
            </div>
          </div>
        </div>
      )}
    </>
  )
}

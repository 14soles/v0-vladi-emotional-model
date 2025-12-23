"use client"

import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import type { QuadrantId } from "./vladi-data"

export interface MoodEntry {
  id: string
  timestamp: string
  emotion: string
  quadrant: QuadrantId
  valence: 1 | -1 | 0
  energy: number
  pleasantness: number
  intensity_before: number
  intensity_after: number | null
  text: string
  contextTags: string[]
  privacy: string
  context?: string
  intervention?: {
    type: string
    completed: boolean
  }
}

export interface ChatMessage {
  role: "user" | "ai"
  text: string
  timestamp: string
}

interface VladiState {
  // Data
  entries: MoodEntry[]
  chatHistory: ChatMessage[]
  activities: string[]
  company: string[]
  groups: { id: string; name: string }[]

  // Current session
  currentEntry: Partial<MoodEntry> | null

  // Actions
  addEntry: (entry: MoodEntry) => void
  updateCurrentEntry: (data: Partial<MoodEntry>) => void
  clearCurrentEntry: () => void
  addChatMessage: (msg: ChatMessage) => void
  addActivity: (activity: string) => void
  addCompany: (person: string) => void
  addGroup: (name: string) => void
  removeActivity: (activity: string) => void
  removeCompany: (person: string) => void

  // Computed
  getFilteredEntries: (
    filter: "today" | "week" | "month" | "month2",
    customStart?: Date,
    customEnd?: Date,
  ) => MoodEntry[]
  calculateMetrics: (entries: MoodEntry[]) => MetricsResult
}

export interface MetricsResult {
  graphData: { date: string; score: number }[]
  inertia: string
  adaptabilityScore: number
  bestIntervention: string
  granularityCount: number
  granularityLevel: string
  negContexts: { tag: string; count: number; pct: number }[]
  adherence: number
  totalCheckins: number
  climate: { green: number; yellow: number; red: number; blue: number }
  topEmotions: string[]
  vulnerableHour: string
  activeHour: string
  lastScore: number
}

const DEFAULT_ACTIVITIES = [
  "Trabajando",
  "Descansando",
  "Haciendo ejercicio",
  "Comiendo",
  "Socializando",
  "Estudiando",
  "De ocio",
  "En casa",
]

const DEFAULT_COMPANY = ["Solo/a", "Familia", "Amigos", "Pareja", "Compañeros", "Desconocidos"]

const generateDemoEntries = (): MoodEntry[] => {
  const now = new Date()
  const entries: MoodEntry[] = []

  const demoData = [
    {
      daysAgo: 0,
      hour: 9,
      emotion: "Motivado",
      quadrant: "yellow" as QuadrantId,
      valence: 1,
      intensity: 7,
      context: "Trabajo",
    },
    {
      daysAgo: 0,
      hour: 14,
      emotion: "Estresado",
      quadrant: "red" as QuadrantId,
      valence: -1,
      intensity: 8,
      context: "Trabajo",
      intervention: { type: "Respiración", completed: true },
      intensityAfter: 5,
    },
    {
      daysAgo: 1,
      hour: 8,
      emotion: "Sereno",
      quadrant: "green" as QuadrantId,
      valence: 1,
      intensity: 5,
      context: "Casa",
    },
    {
      daysAgo: 1,
      hour: 18,
      emotion: "Contento",
      quadrant: "green" as QuadrantId,
      valence: 1,
      intensity: 6,
      context: "Familia",
    },
    {
      daysAgo: 2,
      hour: 10,
      emotion: "Ansioso",
      quadrant: "red" as QuadrantId,
      valence: -1,
      intensity: 7,
      context: "Trabajo",
      intervention: { type: "Grounding", completed: true },
      intensityAfter: 4,
    },
    {
      daysAgo: 2,
      hour: 20,
      emotion: "Relajado",
      quadrant: "green" as QuadrantId,
      valence: 1,
      intensity: 4,
      context: "Ocio",
    },
    {
      daysAgo: 3,
      hour: 7,
      emotion: "Cansado",
      quadrant: "blue" as QuadrantId,
      valence: -1,
      intensity: 6,
      context: "Sueño",
    },
    {
      daysAgo: 3,
      hour: 12,
      emotion: "Entusiasmado",
      quadrant: "yellow" as QuadrantId,
      valence: 1,
      intensity: 8,
      context: "Amigos",
    },
    {
      daysAgo: 4,
      hour: 9,
      emotion: "Frustrado",
      quadrant: "red" as QuadrantId,
      valence: -1,
      intensity: 7,
      context: "Trabajo",
    },
    {
      daysAgo: 4,
      hour: 15,
      emotion: "Tranquilo",
      quadrant: "green" as QuadrantId,
      valence: 1,
      intensity: 5,
      context: "Casa",
    },
    {
      daysAgo: 5,
      hour: 11,
      emotion: "Alegre",
      quadrant: "yellow" as QuadrantId,
      valence: 1,
      intensity: 7,
      context: "Familia",
    },
    {
      daysAgo: 5,
      hour: 22,
      emotion: "Melancólico",
      quadrant: "blue" as QuadrantId,
      valence: -1,
      intensity: 5,
      context: "Solo",
    },
    {
      daysAgo: 6,
      hour: 8,
      emotion: "Esperanzado",
      quadrant: "green" as QuadrantId,
      valence: 1,
      intensity: 6,
      context: "Trabajo",
    },
    {
      daysAgo: 6,
      hour: 19,
      emotion: "Agotado",
      quadrant: "blue" as QuadrantId,
      valence: -1,
      intensity: 7,
      context: "Trabajo",
      intervention: { type: "Respiración", completed: true },
      intensityAfter: 4,
    },
  ]

  demoData.forEach((data, index) => {
    const date = new Date(now)
    date.setDate(date.getDate() - data.daysAgo)
    date.setHours(data.hour, Math.floor(Math.random() * 60), 0, 0)

    entries.push({
      id: `demo-${index}`,
      timestamp: date.toISOString(),
      emotion: data.emotion,
      quadrant: data.quadrant,
      valence: data.valence as 1 | -1 | 0,
      energy: data.quadrant === "yellow" || data.quadrant === "red" ? 70 : 30,
      pleasantness: data.valence === 1 ? 70 : 30,
      intensity_before: data.intensity,
      intensity_after: data.intensityAfter ?? null,
      text: "",
      contextTags: [data.context],
      context: data.context,
      privacy: "all",
      intervention: data.intervention,
    })
  })

  return entries
}

export const useVladiStore = create<VladiState>()(
  persist(
    (set, get) => ({
      entries: generateDemoEntries(),
      chatHistory: [],
      activities: DEFAULT_ACTIVITIES,
      company: DEFAULT_COMPANY,
      groups: [{ id: "all", name: "Todos" }],
      currentEntry: null,

      addEntry: (entry) => {
        set((state) => ({
          entries: [entry, ...state.entries],
          currentEntry: null,
        }))
      },

      updateCurrentEntry: (data) => {
        set((state) => ({
          currentEntry: state.currentEntry ? { ...state.currentEntry, ...data } : data,
        }))
      },

      clearCurrentEntry: () => {
        set({ currentEntry: null })
      },

      addChatMessage: (msg) => {
        set((state) => ({
          chatHistory: [...state.chatHistory, msg],
        }))
      },

      addActivity: (activity) => {
        set((state) => ({
          activities: state.activities.includes(activity) ? state.activities : [...state.activities, activity],
        }))
      },

      addCompany: (person) => {
        set((state) => ({
          company: state.company.includes(person) ? state.company : [...state.company, person],
        }))
      },

      addGroup: (name) => {
        set((state) => ({
          groups: [...state.groups, { id: `g-${Date.now()}`, name }],
        }))
      },

      removeActivity: (activity) => {
        set((state) => ({
          activities: state.activities.filter((a) => a !== activity),
        }))
      },

      removeCompany: (person) => {
        set((state) => ({
          company: state.company.filter((c) => c !== person),
        }))
      },

      getFilteredEntries: (filter, customStart, customEnd) => {
        const entries = get().entries
        const now = new Date()
        const cutoff = new Date()

        if (filter === "today") {
          cutoff.setHours(0, 0, 0, 0)
        } else if (filter === "week") {
          cutoff.setDate(now.getDate() - 7)
        } else if (filter === "month") {
          cutoff.setDate(now.getDate() - 30)
        } else if (filter === "month2") {
          cutoff.setDate(now.getDate() - 60)
        }

        if (customStart && customEnd) {
          return entries.filter((e) => {
            const t = new Date(e.timestamp)
            return t >= customStart && t <= customEnd
          })
        }

        return entries.filter((e) => new Date(e.timestamp) >= cutoff)
      },

      calculateMetrics: (sortedData) => {
        // Graph data by day
        const dailyMap: Record<string, number[]> = {}
        sortedData.forEach((d) => {
          const dayKey = new Date(d.timestamp).toLocaleDateString("es-ES", { day: "numeric", month: "short" })
          if (!dailyMap[dayKey]) dailyMap[dayKey] = []
          dailyMap[dayKey].push(d.valence * d.intensity_before)
        })

        const graphData = Object.entries(dailyMap).map(([date, scores]) => ({
          date,
          score: scores.reduce((a, b) => a + b, 0) / scores.length,
        }))

        // Inertia calculation
        const recoveryTimes: number[] = []
        for (let i = 0; i < sortedData.length; i++) {
          const entry = sortedData[i]
          if (entry.valence === -1 && entry.intensity_before >= 7) {
            for (let j = i + 1; j < sortedData.length; j++) {
              const nextEntry = sortedData[j]
              if (nextEntry.intensity_before <= 4 || nextEntry.valence === 1) {
                const diffMs = new Date(nextEntry.timestamp).getTime() - new Date(entry.timestamp).getTime()
                const hours = diffMs / (1000 * 60 * 60)
                if (hours < 24) recoveryTimes.push(hours)
                break
              }
            }
          }
        }

        const avgInertia =
          recoveryTimes.length > 0
            ? (recoveryTimes.reduce((a, b) => a + b, 0) / recoveryTimes.length).toFixed(1)
            : "0.0"

        // Adaptability
        const interventions = sortedData.filter((d) => d.intervention && d.intensity_after !== null)
        let adaptabilityScore = 0
        const topInterventions: Record<string, number[]> = {}

        if (interventions.length > 0) {
          const deltas = interventions.map((d) => {
            const delta = Math.max(0, d.intensity_before - (d.intensity_after || 0))
            const type = d.intervention?.type || "otro"
            if (!topInterventions[type]) topInterventions[type] = []
            topInterventions[type].push(delta)
            return delta
          })
          const avgDelta = deltas.reduce((a, b) => a + b, 0) / deltas.length
          adaptabilityScore = Math.min(100, Math.round((avgDelta / 4) * 100))
        }

        let bestIntervention = "--"
        let bestInterventionScore = 0
        Object.entries(topInterventions).forEach(([key, vals]) => {
          const avg = vals.reduce((a, b) => a + b, 0) / vals.length
          if (avg > bestInterventionScore) {
            bestInterventionScore = avg
            bestIntervention = key
          }
        })

        // Granularity
        const uniqueEmotions = new Set(sortedData.map((d) => d.emotion))
        const granularityCount = uniqueEmotions.size
        let granularityLevel = "Baja"
        if (granularityCount > 8) granularityLevel = "Media"
        if (granularityCount > 15) granularityLevel = "Alta"

        // Negative contexts
        const negContexts: Record<string, number> = {}
        sortedData
          .filter((d) => d.valence === -1)
          .forEach((d) => {
            d.contextTags.forEach((tag) => {
              negContexts[tag] = (negContexts[tag] || 0) + 1
            })
          })

        const negTotal = sortedData.filter((x) => x.valence === -1).length || 1
        const sortedContexts = Object.entries(negContexts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([tag, count]) => ({
            tag,
            count,
            pct: Math.round((count / negTotal) * 100),
          }))

        // Adherence
        const uniqueDays = new Set(sortedData.map((d) => new Date(d.timestamp).toDateString())).size
        const rangeDays = 7
        const adherence = Math.min(100, Math.round((uniqueDays / rangeDays) * 100))

        // Climate
        const climate = { green: 0, yellow: 0, red: 0, blue: 0 }
        sortedData.forEach((d) => {
          if (climate[d.quadrant] !== undefined) climate[d.quadrant]++
        })

        // Top emotions
        const emotionCounts: Record<string, number> = {}
        sortedData.forEach((d) => {
          emotionCounts[d.emotion] = (emotionCounts[d.emotion] || 0) + 1
        })
        const topEmotions = Object.entries(emotionCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map((e) => e[0])

        // Hour patterns
        const hourMap: Record<number, { valSum: number; intSum: number; count: number }> = {}
        sortedData.forEach((d) => {
          const h = new Date(d.timestamp).getHours()
          if (!hourMap[h]) hourMap[h] = { valSum: 0, intSum: 0, count: 0 }
          hourMap[h].valSum += d.valence
          hourMap[h].intSum += d.intensity_before
          hourMap[h].count++
        })

        let vulnerableHour = "--"
        let minVal = 999
        let activeHour = "--"
        let maxInt = -1

        Object.entries(hourMap).forEach(([h, data]) => {
          const avgVal = data.valSum / data.count
          const avgInt = data.intSum / data.count
          if (avgVal < minVal) {
            minVal = avgVal
            vulnerableHour = `${h}:00`
          }
          if (avgInt > maxInt) {
            maxInt = avgInt
            activeHour = `${h}:00`
          }
        })

        return {
          graphData,
          inertia: avgInertia,
          adaptabilityScore,
          bestIntervention,
          granularityCount,
          granularityLevel,
          negContexts: sortedContexts,
          adherence,
          totalCheckins: sortedData.length,
          climate,
          topEmotions,
          vulnerableHour,
          activeHour,
          lastScore: graphData.length > 0 ? graphData[graphData.length - 1].score : 0,
        }
      },
    }),
    {
      name: "vladi-v27-data",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        entries: state.entries,
        activities: state.activities,
        company: state.company,
        groups: state.groups,
      }),
    },
  ),
)

export const useVladiEntries = () => useVladiStore((state) => state.entries)
export const useVladiChatHistory = () => useVladiStore((state) => state.chatHistory)
export const useVladiActivities = () => useVladiStore((state) => state.activities)
export const useVladiCompany = () => useVladiStore((state) => state.company)
export const useVladiGroups = () => useVladiStore((state) => state.groups)
export const useVladiCurrentEntry = () => useVladiStore((state) => state.currentEntry)

export const useVladiActions = () =>
  useVladiStore((state) => ({
    addEntry: state.addEntry,
    updateCurrentEntry: state.updateCurrentEntry,
    clearCurrentEntry: state.clearCurrentEntry,
    addChatMessage: state.addChatMessage,
    addActivity: state.addActivity,
    addCompany: state.addCompany,
    addGroup: state.addGroup,
    removeActivity: state.removeActivity,
    removeCompany: state.removeCompany,
  }))

export const useVladiMetrics = (filter: "today" | "week" | "month" | "month2") => {
  const getFilteredEntries = useVladiStore((state) => state.getFilteredEntries)
  const calculateMetrics = useVladiStore((state) => state.calculateMetrics)

  const filteredEntries = getFilteredEntries(filter)
  return calculateMetrics(filteredEntries)
}

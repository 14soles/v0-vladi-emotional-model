// Emotion Episode Grouping Service
// Groups emotion entries into coherent episodes based on temporal proximity and emotional similarity

import { createClient } from "@/lib/supabase/client"
import { getEmotionAxes } from "@/lib/emotion-mapping"

// Configuration
const EPISODE_GAP_HOURS = 4 // Max hours between entries to be in same episode
const MIN_ENTRIES_FOR_EPISODE = 2 // Minimum entries to form an episode

interface EmotionEntry {
  id: string
  user_id: string
  emotion: string
  emotion_family: string
  intensity: number
  valence: number
  arousal: number
  created_at: string
}

interface Episode {
  id?: string
  user_id: string
  started_at: string
  ended_at: string | null
  dominant_emotion: string | null
  dominant_family: string | null
  entry_count: number
  avg_intensity: number | null
  avg_valence: number | null
  recovery_time_minutes: number | null
  interventions_used: number
  entries: EmotionEntry[]
}

// Group entries into episodes based on temporal proximity
export function groupEntriesIntoEpisodes(entries: EmotionEntry[]): Episode[] {
  if (entries.length < MIN_ENTRIES_FOR_EPISODE) {
    return []
  }

  // Sort by creation time
  const sorted = [...entries].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  )

  const episodes: Episode[] = []
  let currentEpisode: EmotionEntry[] = [sorted[0]]

  for (let i = 1; i < sorted.length; i++) {
    const currentEntry = sorted[i]
    const lastEntry = currentEpisode[currentEpisode.length - 1]

    const timeDiffHours =
      (new Date(currentEntry.created_at).getTime() - new Date(lastEntry.created_at).getTime()) /
      (1000 * 60 * 60)

    if (timeDiffHours <= EPISODE_GAP_HOURS) {
      // Continue current episode
      currentEpisode.push(currentEntry)
    } else {
      // Close current episode and start new one
      if (currentEpisode.length >= MIN_ENTRIES_FOR_EPISODE) {
        episodes.push(createEpisodeFromEntries(currentEpisode))
      }
      currentEpisode = [currentEntry]
    }
  }

  // Don't forget the last episode
  if (currentEpisode.length >= MIN_ENTRIES_FOR_EPISODE) {
    episodes.push(createEpisodeFromEntries(currentEpisode))
  }

  return episodes
}

// Create an episode object from a group of entries
function createEpisodeFromEntries(entries: EmotionEntry[]): Episode {
  const userId = entries[0].user_id
  const startedAt = entries[0].created_at
  const endedAt = entries[entries.length - 1].created_at

  // Calculate dominant emotion (most frequent)
  const emotionCounts = new Map<string, number>()
  entries.forEach((e) => {
    emotionCounts.set(e.emotion, (emotionCounts.get(e.emotion) || 0) + 1)
  })
  let dominantEmotion: string | null = null
  let maxCount = 0
  emotionCounts.forEach((count, emotion) => {
    if (count > maxCount) {
      maxCount = count
      dominantEmotion = emotion
    }
  })

  // Calculate dominant family
  const familyCounts = new Map<string, number>()
  entries.forEach((e) => {
    familyCounts.set(e.emotion_family, (familyCounts.get(e.emotion_family) || 0) + 1)
  })
  let dominantFamily: string | null = null
  maxCount = 0
  familyCounts.forEach((count, family) => {
    if (count > maxCount) {
      maxCount = count
      dominantFamily = family
    }
  })

  // Calculate averages
  const avgIntensity = entries.reduce((sum, e) => sum + e.intensity, 0) / entries.length
  const avgValence = entries.reduce((sum, e) => sum + (e.valence || 0), 0) / entries.length

  // Calculate recovery time (if applicable)
  // Find first negative entry and last positive entry
  let recoveryTimeMinutes: number | null = null
  const firstNegative = entries.find((e) => (e.valence || 0) < -0.3)
  if (firstNegative) {
    const lastPositive = [...entries]
      .reverse()
      .find((e) => (e.valence || 0) > 0.3 && new Date(e.created_at) > new Date(firstNegative.created_at))

    if (lastPositive) {
      recoveryTimeMinutes = Math.round(
        (new Date(lastPositive.created_at).getTime() - new Date(firstNegative.created_at).getTime()) /
          (1000 * 60)
      )
    }
  }

  return {
    user_id: userId,
    started_at: startedAt,
    ended_at: endedAt,
    dominant_emotion: dominantEmotion,
    dominant_family: dominantFamily,
    entry_count: entries.length,
    avg_intensity: Math.round(avgIntensity * 10) / 10,
    avg_valence: Math.round(avgValence * 100) / 100,
    recovery_time_minutes: recoveryTimeMinutes,
    interventions_used: 0, // Will be updated separately
    entries,
  }
}

// Save episodes to database
export async function saveEpisodesToDatabase(episodes: Episode[]): Promise<void> {
  const supabase = createClient()

  for (const episode of episodes) {
    // Insert episode
    const { data: episodeData, error: episodeError } = await supabase
      .from("emotion_episodes")
      .insert({
        user_id: episode.user_id,
        started_at: episode.started_at,
        ended_at: episode.ended_at,
        dominant_emotion: episode.dominant_emotion,
        dominant_family: episode.dominant_family,
        entry_count: episode.entry_count,
        avg_intensity: episode.avg_intensity,
        avg_valence: episode.avg_valence,
        recovery_time_minutes: episode.recovery_time_minutes,
        interventions_used: episode.interventions_used,
      })
      .select("id")
      .single()

    if (episodeError || !episodeData) {
      continue
    }

    // Insert episode-entry relationships
    const entryRelations = episode.entries.map((entry, index) => ({
      episode_id: episodeData.id,
      emotion_entry_id: entry.id,
      sequence_order: index + 1,
    }))

    await supabase.from("emotion_episode_entries").insert(entryRelations)
  }
}

// Process new emotion entry and update episodes
export async function processNewEmotionEntry(
  userId: string,
  newEntryId: string
): Promise<Episode | null> {
  const supabase = createClient()

  // Get recent entries (last 24 hours)
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  const { data: recentEntries, error } = await supabase
    .from("emotion_entries")
    .select("id, user_id, emotion, emotion_family, intensity, valence, arousal, created_at")
    .eq("user_id", userId)
    .gte("created_at", twentyFourHoursAgo)
    .order("created_at", { ascending: true })

  if (error || !recentEntries || recentEntries.length < MIN_ENTRIES_FOR_EPISODE) {
    return null
  }

  // Check if the new entry can be part of an existing open episode
  const { data: openEpisodes } = await supabase
    .from("emotion_episodes")
    .select("*, emotion_episode_entries(emotion_entry_id)")
    .eq("user_id", userId)
    .is("ended_at", null)
    .order("started_at", { ascending: false })
    .limit(1)

  const newEntry = recentEntries.find((e) => e.id === newEntryId)
  if (!newEntry) return null

  if (openEpisodes && openEpisodes.length > 0) {
    const openEpisode = openEpisodes[0]

    // Check if new entry is within time window
    const lastEpisodeEntry = recentEntries
      .filter((e) =>
        openEpisode.emotion_episode_entries.some(
          (ee: { emotion_entry_id: string }) => ee.emotion_entry_id === e.id
        )
      )
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]

    if (lastEpisodeEntry) {
      const timeDiffHours =
        (new Date(newEntry.created_at).getTime() - new Date(lastEpisodeEntry.created_at).getTime()) /
        (1000 * 60 * 60)

      if (timeDiffHours <= EPISODE_GAP_HOURS) {
        // Add to existing episode
        await supabase.from("emotion_episode_entries").insert({
          episode_id: openEpisode.id,
          emotion_entry_id: newEntryId,
          sequence_order: openEpisode.entry_count + 1,
        })

        // Update episode stats
        const episodeEntries = recentEntries.filter(
          (e) =>
            openEpisode.emotion_episode_entries.some(
              (ee: { emotion_entry_id: string }) => ee.emotion_entry_id === e.id
            ) || e.id === newEntryId
        )

        const avgIntensity = episodeEntries.reduce((sum, e) => sum + e.intensity, 0) / episodeEntries.length
        const avgValence =
          episodeEntries.reduce((sum, e) => sum + (e.valence || 0), 0) / episodeEntries.length

        await supabase
          .from("emotion_episodes")
          .update({
            entry_count: openEpisode.entry_count + 1,
            avg_intensity: Math.round(avgIntensity * 10) / 10,
            avg_valence: Math.round(avgValence * 100) / 100,
          })
          .eq("id", openEpisode.id)

        return {
          ...openEpisode,
          entry_count: openEpisode.entry_count + 1,
          entries: episodeEntries as EmotionEntry[],
        }
      } else {
        // Close the existing episode
        await supabase
          .from("emotion_episodes")
          .update({ ended_at: lastEpisodeEntry.created_at })
          .eq("id", openEpisode.id)
      }
    }
  }

  // Check if we should start a new episode
  // Look for the previous entry
  const entriesBeforeNew = recentEntries.filter(
    (e) => new Date(e.created_at) < new Date(newEntry.created_at)
  )

  if (entriesBeforeNew.length > 0) {
    const previousEntry = entriesBeforeNew[entriesBeforeNew.length - 1]
    const timeDiffHours =
      (new Date(newEntry.created_at).getTime() - new Date(previousEntry.created_at).getTime()) /
      (1000 * 60 * 60)

    if (timeDiffHours <= EPISODE_GAP_HOURS) {
      // Start a new episode with these two entries
      const episodeEntries = [previousEntry, newEntry] as EmotionEntry[]
      const episode = createEpisodeFromEntries(episodeEntries)

      const { data: newEpisode } = await supabase
        .from("emotion_episodes")
        .insert({
          user_id: episode.user_id,
          started_at: episode.started_at,
          ended_at: null, // Keep open
          dominant_emotion: episode.dominant_emotion,
          dominant_family: episode.dominant_family,
          entry_count: episode.entry_count,
          avg_intensity: episode.avg_intensity,
          avg_valence: episode.avg_valence,
          recovery_time_minutes: episode.recovery_time_minutes,
          interventions_used: 0,
        })
        .select("id")
        .single()

      if (newEpisode) {
        await supabase.from("emotion_episode_entries").insert([
          { episode_id: newEpisode.id, emotion_entry_id: previousEntry.id, sequence_order: 1 },
          { episode_id: newEpisode.id, emotion_entry_id: newEntry.id, sequence_order: 2 },
        ])

        return {
          id: newEpisode.id,
          ...episode,
        }
      }
    }
  }

  return null
}

// Get user's recent episodes
export async function getUserEpisodes(
  userId: string,
  limit = 10
): Promise<Episode[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("emotion_episodes")
    .select(
      `
      *,
      emotion_episode_entries(
        emotion_entry_id,
        sequence_order
      )
    `
    )
    .eq("user_id", userId)
    .order("started_at", { ascending: false })
    .limit(limit)

  if (error || !data) {
    return []
  }

  return data.map((ep) => ({
    id: ep.id,
    user_id: ep.user_id,
    started_at: ep.started_at,
    ended_at: ep.ended_at,
    dominant_emotion: ep.dominant_emotion,
    dominant_family: ep.dominant_family,
    entry_count: ep.entry_count,
    avg_intensity: ep.avg_intensity,
    avg_valence: ep.avg_valence,
    recovery_time_minutes: ep.recovery_time_minutes,
    interventions_used: ep.interventions_used,
    entries: [],
  }))
}

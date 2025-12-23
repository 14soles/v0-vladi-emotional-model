// Hook for context form state management
"use client"

import { useState, useCallback } from "react"

export function useContextForm() {
  const [text, setText] = useState("")
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set())
  const [activityText, setActivityText] = useState("")
  const [companyText, setCompanyText] = useState("")
  const [bodySignals, setBodySignals] = useState<Set<string>>(new Set())
  const [timeReference, setTimeReference] = useState("")
  const [certainty, setCertainty] = useState("")

  const toggleTag = useCallback((tag: string) => {
    setSelectedTags((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(tag)) {
        newSet.delete(tag)
      } else {
        newSet.add(tag)
      }
      return newSet
    })
  }, [])

  const toggleBodySignal = useCallback((signal: string) => {
    setBodySignals((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(signal)) {
        newSet.delete(signal)
      } else {
        newSet.add(signal)
      }
      return newSet
    })
  }, [])

  const reset = useCallback(() => {
    setText("")
    setSelectedTags(new Set())
    setActivityText("")
    setCompanyText("")
    setBodySignals(new Set())
    setTimeReference("")
    setCertainty("")
  }, [])

  const getData = useCallback(() => {
    return {
      text,
      tags: Array.from(selectedTags),
      activityText,
      companyText,
      bodySignals: Array.from(bodySignals),
      timeReference,
      certainty,
    }
  }, [text, selectedTags, activityText, companyText, bodySignals, timeReference, certainty])

  return {
    text,
    setText,
    selectedTags,
    toggleTag,
    activityText,
    setActivityText,
    companyText,
    setCompanyText,
    bodySignals,
    toggleBodySignal,
    timeReference,
    setTimeReference,
    certainty,
    setCertainty,
    reset,
    getData,
  }
}

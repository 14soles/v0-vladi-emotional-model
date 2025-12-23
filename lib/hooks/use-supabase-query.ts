// Generic hook for Supabase queries with loading/error states
"use client"

import { useState, useEffect, useCallback } from "react"

export interface QueryState<T> {
  data: T | null
  loading: boolean
  error: Error | null
}

export function useSupabaseQuery<T>(query: () => Promise<{ data: T | null; error: any }>, dependencies: any[] = []) {
  const [state, setState] = useState<QueryState<T>>({
    data: null,
    loading: true,
    error: null,
  })

  const refetch = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }))
    try {
      const { data, error } = await query()
      if (error) throw error
      setState({ data, loading: false, error: null })
    } catch (err) {
      setState({ data: null, loading: false, error: err instanceof Error ? err : new Error("Unknown error") })
    }
  }, [query])

  useEffect(() => {
    refetch()
  }, dependencies)

  return { ...state, refetch }
}

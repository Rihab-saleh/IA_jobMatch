"use client"

import { useState, useEffect, useCallback } from "react"

export function useApi(endpoint, options = {}) {
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch(endpoint, options)
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }
      const result = await response.json()
      setData(result)
      setError(null)
    } catch (err) {
      setError(err.message || "An error occurred")
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [endpoint, options])

  useEffect(() => {
    if (options.fetchOnMount !== false) {
      fetchData()
    }
  }, [fetchData, options.fetchOnMount])

  const mutate = useCallback(
    async (newData) => {
      setLoading(true)
      try {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(newData),
          ...options,
        })
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`)
        }
        const result = await response.json()
        setData(result)
        setError(null)
        return result
      } catch (err) {
        setError(err.message || "An error occurred")
        throw err
      } finally {
        setLoading(false)
      }
    },
    [endpoint, options],
  )

  return { data, error, loading, refetch: fetchData, mutate }
}


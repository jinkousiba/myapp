import { useState, useCallback } from 'react'
import { callClaude } from '../utils/claudeClient'

export function useAI() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const ask = useCallback(async ({ system, prompt, maxTokens = 1000 }) => {
    setLoading(true)
    setError(null)
    try {
      return await callClaude({ system, prompt, maxTokens })
    } catch (e) {
      setError(e.message)
      throw e
    } finally {
      setLoading(false)
    }
  }, [])

  return { ask, loading, error }
}

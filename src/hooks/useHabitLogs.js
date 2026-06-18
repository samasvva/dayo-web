import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useHabitLogs(person, year, month) {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)

  const startDate = `${year}-${String(month).padStart(2, '0')}-01`
  const endDate = `${year}-${String(month).padStart(2, '0')}-31`

  const fetch = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('habit_logs')
      .select('*')
      .eq('person', person)
      .gte('date', startDate)
      .lte('date', endDate)
    if (!error) setLogs(data || [])
    setLoading(false)
  }, [person, year, month])

  useEffect(() => { fetch() }, [fetch])

  const toggleLog = async (habitId, date, currentDone) => {
    const newDone = !currentDone
    // Optimistic update
    setLogs(prev => {
      const existing = prev.find(l => l.habit_id === habitId && l.date === date)
      if (existing) {
        return prev.map(l => l.habit_id === habitId && l.date === date ? { ...l, done: newDone } : l)
      }
      return [...prev, { habit_id: habitId, person, date, done: newDone, id: `temp-${Date.now()}` }]
    })

    const { error } = await supabase
      .from('habit_logs')
      .upsert({ habit_id: habitId, person, date, done: newDone }, { onConflict: 'habit_id,date' })

    if (error) {
      // Revert on error
      setLogs(prev => {
        const existing = prev.find(l => l.habit_id === habitId && l.date === date)
        if (existing && existing.id?.startsWith('temp-')) {
          return prev.filter(l => !(l.habit_id === habitId && l.date === date))
        }
        return prev.map(l => l.habit_id === habitId && l.date === date ? { ...l, done: currentDone } : l)
      })
    } else {
      fetch()
    }
  }

  const getLog = (habitId, date) => logs.find(l => l.habit_id === habitId && l.date === date)

  return { logs, loading, toggleLog, getLog, refetch: fetch }
}

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

  // Real-time sync — picks up changes from other devices
  useEffect(() => {
    const channel = supabase
      .channel(`habit_logs_${person}_${year}_${month}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'habit_logs',
        filter: `person=eq.${person}`,
      }, () => { fetch() })
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [person, year, month, fetch])

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

    const existingRow = logs.find(l => l.habit_id === habitId && l.date === date)
    let error

    if (existingRow && !String(existingRow.id).startsWith('temp-')) {
      const result = await supabase
        .from('habit_logs')
        .update({ done: newDone })
        .eq('id', existingRow.id)
      error = result.error
    } else {
      const result = await supabase
        .from('habit_logs')
        .insert({ habit_id: habitId, person, date, done: newDone })
      error = result.error
    }

    if (error) {
      console.error('habit_logs write failed:', error)
      setLogs(prev => {
        const existing = prev.find(l => l.habit_id === habitId && l.date === date)
        if (existing && String(existing.id).startsWith('temp-')) {
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

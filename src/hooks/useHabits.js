import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useHabits(person) {
  const [habits, setHabits] = useState([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('habits')
      .select('*')
      .eq('person', person)
      .order('created_at', { ascending: true })
    if (!error) setHabits(data || [])
    setLoading(false)
  }, [person])

  useEffect(() => { fetch() }, [fetch])

  const addHabit = async (name, category) => {
    const { data, error } = await supabase
      .from('habits')
      .insert({ person, name, category })
      .select()
      .single()
    if (!error && data) setHabits(prev => [...prev, data])
    return { data, error }
  }

  const deleteHabit = async (id) => {
    await supabase.from('habit_logs').delete().eq('habit_id', id)
    const { error } = await supabase.from('habits').delete().eq('id', id)
    if (!error) setHabits(prev => prev.filter(h => h.id !== id))
    return { error }
  }

  return { habits, loading, refetch: fetch, addHabit, deleteHabit }
}

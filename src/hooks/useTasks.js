import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useTasks(person, startDate, endDate) {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('person', person)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('created_at', { ascending: true })
    if (!error) setTasks(data || [])
    setLoading(false)
  }, [person, startDate, endDate])

  useEffect(() => { fetch() }, [fetch])

  const addTask = async (title, date) => {
    const optimisticId = `temp-${Date.now()}`
    const optimistic = { id: optimisticId, person, title, date, done: false, created_at: new Date().toISOString() }
    setTasks(prev => [...prev, optimistic])

    const { data, error } = await supabase
      .from('tasks')
      .insert({ person, title, date, done: false })
      .select()
      .single()

    if (!error && data) {
      setTasks(prev => prev.map(t => t.id === optimisticId ? data : t))
    } else {
      setTasks(prev => prev.filter(t => t.id !== optimisticId))
    }
    return { data, error }
  }

  const toggleTask = async (id, currentDone) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, done: !currentDone } : t))
    const { error } = await supabase.from('tasks').update({ done: !currentDone }).eq('id', id)
    if (error) {
      setTasks(prev => prev.map(t => t.id === id ? { ...t, done: currentDone } : t))
    }
  }

  const deleteTask = async (id) => {
    setTasks(prev => prev.filter(t => t.id !== id))
    await supabase.from('tasks').delete().eq('id', id)
  }

  return { tasks, loading, addTask, toggleTask, deleteTask, refetch: fetch }
}

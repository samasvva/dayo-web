import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import DonutChart from '../components/DonutChart'
import Spinner from '../components/Spinner'
import { getDaysInMonth, formatDate, getMonthName } from '../lib/dateUtils'

const PERSON_A_COLOR = '#3D5A80'
const PERSON_B_COLOR = '#7C4A3A'

export default function HomePage() {
  const navigate = useNavigate()
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  const today = formatDate(now)

  const [dataA, setDataA] = useState(null)
  const [dataB, setDataB] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showAddHabit, setShowAddHabit] = useState(false)
  const [showAddTask, setShowAddTask] = useState(false)
  const [addPerson, setAddPerson] = useState('A')
  const [habitName, setHabitName] = useState('')
  const [habitCat, setHabitCat] = useState('Health')
  const [taskTitle, setTaskTitle] = useState('')
  const [saving, setSaving] = useState(false)

  const fetchPersonData = async (person) => {
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`
    const endDate = `${year}-${String(month).padStart(2, '0')}-31`
    const daysInMonth = getDaysInMonth(year, month)
    const dayOfMonth = now.getDate()

    const { data: habits } = await supabase.from('habits').select('id').eq('person', person)
    const habitIds = (habits || []).map(h => h.id)

    let habitPct = 0
    if (habitIds.length > 0) {
      const { data: logs } = await supabase
        .from('habit_logs')
        .select('done')
        .in('habit_id', habitIds)
        .gte('date', startDate)
        .lte('date', endDate)
        .eq('done', true)
      const total = habitIds.length * dayOfMonth
      const done = (logs || []).length
      habitPct = total > 0 ? Math.round((done / total) * 100) : 0
    }

    const { data: todayTasks } = await supabase
      .from('tasks')
      .select('done')
      .eq('person', person)
      .eq('date', today)

    const todayDone = (todayTasks || []).filter(t => t.done).length
    const todayTotal = (todayTasks || []).length

    // Streak: fetch all logs for this month in one query
    let streak = 0
    if (habitIds.length > 0) {
      const { data: allLogs } = await supabase
        .from('habit_logs')
        .select('date, done')
        .in('habit_id', habitIds)
        .gte('date', startDate)
        .lte('date', endDate)
        .eq('done', true)

      const doneCounts = {}
      for (const l of allLogs || []) {
        doneCounts[l.date] = (doneCounts[l.date] || 0) + 1
      }

      for (let d = dayOfMonth; d >= 1; d--) {
        const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`
        const pct = ((doneCounts[dateStr] || 0) / habitIds.length) * 100
        if (pct > 50) streak++
        else break
      }
    }

    return { habitPct, todayDone, todayTotal, streak }
  }

  const loadData = useCallback(async () => {
    setLoading(true)
    const [a, b] = await Promise.all([fetchPersonData('A'), fetchPersonData('B')])
    setDataA(a)
    setDataB(b)
    setLoading(false)
  }, [year, month, today])

  useEffect(() => { loadData() }, [loadData])

  // Real-time sync — refresh when habit_logs or tasks change on any device
  useEffect(() => {
    const habitChannel = supabase
      .channel('home_habit_logs')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'habit_logs' }, () => { loadData() })
      .subscribe()
    const taskChannel = supabase
      .channel('home_tasks')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => { loadData() })
      .subscribe()
    return () => {
      supabase.removeChannel(habitChannel)
      supabase.removeChannel(taskChannel)
    }
  }, [loadData])

  const handleAddHabit = async () => {
    if (!habitName.trim()) return
    setSaving(true)
    await supabase.from('habits').insert({ person: addPerson, name: habitName, category: habitCat })
    setSaving(false)
    setHabitName('')
    setShowAddHabit(false)
    loadData()
  }

  const handleAddTask = async () => {
    if (!taskTitle.trim()) return
    setSaving(true)
    await supabase.from('tasks').insert({ person: addPerson, title: taskTitle, date: today, done: false })
    setSaving(false)
    setTaskTitle('')
    setShowAddTask(false)
    loadData()
  }

  return (
    <div className="p-4 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text1">Dayo</h1>
          <p className="text-text2 text-sm">{getMonthName(month)} {year}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { setAddPerson('A'); setShowAddHabit(true) }}
            className="text-xs bg-personA text-white px-3 py-1.5 rounded-btn font-medium"
          >
            + Habit
          </button>
          <button
            onClick={() => { setAddPerson('A'); setShowAddTask(true) }}
            className="text-xs bg-card border border-gray-200 text-text1 px-3 py-1.5 rounded-btn font-medium"
          >
            + Task
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { person: 'A', data: dataA, color: PERSON_A_COLOR, label: 'Person A' },
            { person: 'B', data: dataB, color: PERSON_B_COLOR, label: 'Person B' },
          ].map(({ person, data, color, label }) => (
            <div key={person} className="bg-card rounded-card p-5 shadow-sm border border-gray-50">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm" style={{ backgroundColor: color }}>
                  {person}
                </div>
                <span className="font-semibold text-text1">{label}</span>
              </div>
              <div className="flex items-center gap-6">
                <DonutChart pct={data?.habitPct || 0} color={color} size={100} label="habits" />
                <div className="flex flex-col gap-3">
                  <div>
                    <p className="text-xs text-text2 mb-0.5">Tasks Today</p>
                    <p className="font-semibold text-text1">
                      {data?.todayDone}/{data?.todayTotal}
                      <span className="text-text2 font-normal text-sm"> done</span>
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-text2 mb-0.5">Current Streak</p>
                    <p className="font-semibold text-text1">
                      {data?.streak}
                      <span className="text-text2 font-normal text-sm"> days</span>
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => { setAddPerson(person); setShowAddHabit(true) }}
                  className="flex-1 text-xs py-2 rounded-btn border font-medium transition-colors"
                  style={{ borderColor: color, color }}
                >
                  + Add Habit
                </button>
                <button
                  onClick={() => { setAddPerson(person); setShowAddTask(true) }}
                  className="flex-1 text-xs py-2 rounded-btn border border-gray-200 text-text1 font-medium"
                >
                  + Add Task
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Habit Modal */}
      {showAddHabit && (
        <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-card rounded-card p-6 w-full max-w-sm shadow-xl">
            <h3 className="font-semibold text-text1 mb-4">Add Habit — Person {addPerson}</h3>
            <input
              autoFocus
              value={habitName}
              onChange={e => setHabitName(e.target.value)}
              placeholder="Habit name"
              className="w-full border border-gray-200 rounded-btn px-3 py-2.5 text-sm mb-3 outline-none focus:border-personA"
            />
            <select
              value={habitCat}
              onChange={e => setHabitCat(e.target.value)}
              className="w-full border border-gray-200 rounded-btn px-3 py-2.5 text-sm mb-4 outline-none"
            >
              {['Morning','Health','Spiritual','Productivity','Mindset','Growth','Discipline','Recovery'].map(c => (
                <option key={c}>{c}</option>
              ))}
            </select>
            <div className="flex gap-2">
              <button onClick={() => setShowAddHabit(false)} className="flex-1 py-2.5 rounded-btn border border-gray-200 text-sm font-medium text-text2">Cancel</button>
              <button onClick={handleAddHabit} disabled={saving} className="flex-1 py-2.5 rounded-btn bg-personA text-white text-sm font-medium">
                {saving ? 'Saving…' : 'Add Habit'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Task Modal */}
      {showAddTask && (
        <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-card rounded-card p-6 w-full max-w-sm shadow-xl">
            <h3 className="font-semibold text-text1 mb-4">Add Task — Person {addPerson}</h3>
            <input
              autoFocus
              value={taskTitle}
              onChange={e => setTaskTitle(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddTask()}
              placeholder="Task title"
              className="w-full border border-gray-200 rounded-btn px-3 py-2.5 text-sm mb-4 outline-none focus:border-personA"
            />
            <div className="flex gap-2">
              <button onClick={() => setShowAddTask(false)} className="flex-1 py-2.5 rounded-btn border border-gray-200 text-sm font-medium text-text2">Cancel</button>
              <button onClick={handleAddTask} disabled={saving} className="flex-1 py-2.5 rounded-btn bg-personA text-white text-sm font-medium">
                {saving ? 'Saving…' : 'Add Task'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

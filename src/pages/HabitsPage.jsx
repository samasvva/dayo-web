import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useHabits } from '../hooks/useHabits'
import { useHabitLogs } from '../hooks/useHabitLogs'
import PersonTabs from '../components/PersonTabs'
import Spinner from '../components/Spinner'
import { getDaysInMonth, getMonthName } from '../lib/dateUtils'
import { DEFAULT_HABITS } from '../lib/defaults'

export default function HabitsPage() {
  const [person, setPerson] = useState('A')
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [showAddModal, setShowAddModal] = useState(false)
  const [newHabitName, setNewHabitName] = useState('')
  const [newHabitCat, setNewHabitCat] = useState('Health')
  const [saving, setSaving] = useState(false)
  const [seeding, setSeeding] = useState(false)

  const { habits, loading: habitsLoading, addHabit, deleteHabit } = useHabits(person)
  const { logs, loading: logsLoading, toggleLog, getLog } = useHabitLogs(person, year, month)

  const daysInMonth = getDaysInMonth(year, month)
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)

  const accentColor = person === 'A' ? '#3D5A80' : '#7C4A3A'

  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear(y => y - 1) }
    else setMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (month === 12) { setMonth(1); setYear(y => y + 1) }
    else setMonth(m => m + 1)
  }

  const getDateStr = (day) => `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`

  const getRowPct = (habitId) => {
    const done = days.filter(d => getLog(habitId, getDateStr(d))?.done).length
    return daysInMonth > 0 ? Math.round((done / daysInMonth) * 100) : 0
  }

  const getDayPct = (day) => {
    if (habits.length === 0) return 0
    const dateStr = getDateStr(day)
    const done = habits.filter(h => getLog(h.id, dateStr)?.done).length
    return Math.round((done / habits.length) * 100)
  }

  const handleAddHabit = async () => {
    if (!newHabitName.trim()) return
    setSaving(true)
    await addHabit(newHabitName, newHabitCat)
    setSaving(false)
    setNewHabitName('')
    setShowAddModal(false)
  }

  const handleSeedDefaults = async () => {
    setSeeding(true)
    for (const h of DEFAULT_HABITS) {
      await supabase.from('habits').insert({ person, name: h.name, category: h.category })
    }
    setSeeding(false)
    window.location.reload()
  }

  const loading = habitsLoading || logsLoading

  return (
    <div className="p-4 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-bold text-text1">Habits</h2>
        <button
          onClick={() => setShowAddModal(true)}
          className="text-xs px-3 py-1.5 rounded-btn font-medium text-white"
          style={{ backgroundColor: accentColor }}
        >
          + Add Habit
        </button>
      </div>

      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <PersonTabs active={person} onChange={setPerson} />
        {/* Month Navigator */}
        <div className="flex items-center gap-3">
          <button onClick={prevMonth} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 text-text2">&#8249;</button>
          <span className="text-sm font-medium text-text1 min-w-[110px] text-center">{getMonthName(month)} {year}</span>
          <button onClick={nextMonth} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 text-text2">&#8250;</button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : habits.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-text2 mb-4">No habits yet for Person {person}</p>
          <button
            onClick={handleSeedDefaults}
            disabled={seeding}
            className="text-sm px-5 py-2.5 rounded-btn font-medium text-white"
            style={{ backgroundColor: accentColor }}
          >
            {seeding ? 'Loading defaults…' : 'Load Default Habits'}
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto -mx-4 px-4">
          <div style={{ minWidth: Math.max(600, 200 + daysInMonth * 28) }}>
            {/* Column headers */}
            <div className="flex mb-1" style={{ paddingLeft: 180 }}>
              {days.map(d => (
                <div key={d} className="text-center text-xs text-text2 font-medium" style={{ width: 28, minWidth: 28 }}>
                  {d}
                </div>
              ))}
              <div className="text-xs text-text2 font-medium text-center" style={{ width: 50, minWidth: 50 }}>%</div>
            </div>

            {/* Habit rows */}
            {habits.map(habit => (
              <div key={habit.id} className="flex items-center mb-1.5 group">
                <div className="flex items-center gap-2" style={{ width: 180, minWidth: 180 }}>
                  <button
                    onClick={() => deleteHabit(habit.id)}
                    className="opacity-0 group-hover:opacity-100 text-red-300 hover:text-red-500 transition-opacity text-xs w-4"
                  >&#x2715;</button>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-text1 truncate">{habit.name}</p>
                    <p className="text-xs text-text2 truncate">{habit.category}</p>
                  </div>
                </div>
                {days.map(d => {
                  const dateStr = getDateStr(d)
                  const log = getLog(habit.id, dateStr)
                  const done = log?.done || false
                  return (
                    <div key={d} className="flex items-center justify-center" style={{ width: 28, minWidth: 28 }}>
                      <button
                        onClick={() => toggleLog(habit.id, dateStr, done)}
                        className="w-5 h-5 rounded flex items-center justify-center border transition-all"
                        style={{
                          backgroundColor: done ? accentColor : 'transparent',
                          borderColor: done ? accentColor : '#D0D0CE',
                        }}
                      >
                        {done && <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><polyline points="2,5 4.5,7.5 8,3" stroke="white" strokeWidth="1.5" strokeLinecap="round"/></svg>}
                      </button>
                    </div>
                  )
                })}
                <div className="text-xs font-medium text-center" style={{ width: 50, minWidth: 50, color: accentColor }}>
                  {getRowPct(habit.id)}%
                </div>
              </div>
            ))}

            {/* Daily % row */}
            <div className="flex items-center mt-2 border-t border-gray-100 pt-2">
              <div className="text-xs font-medium text-text2" style={{ width: 180, minWidth: 180, paddingLeft: 24 }}>Daily %</div>
              {days.map(d => {
                const pct = getDayPct(d)
                return (
                  <div key={d} className="text-center" style={{ width: 28, minWidth: 28 }}>
                    <span className="text-xs" style={{ color: pct >= 70 ? '#4CAF50' : pct >= 40 ? '#FF9800' : '#E0E0E0' }}>
                      {pct}
                    </span>
                  </div>
                )
              })}
              <div style={{ width: 50 }} />
            </div>
          </div>
        </div>
      )}

      {/* Add Habit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-card rounded-card p-6 w-full max-w-sm shadow-xl">
            <h3 className="font-semibold text-text1 mb-4">Add Habit — Person {person}</h3>
            <input
              autoFocus
              value={newHabitName}
              onChange={e => setNewHabitName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddHabit()}
              placeholder="Habit name (e.g. Morning run)"
              className="w-full border border-gray-200 rounded-btn px-3 py-2.5 text-sm mb-3 outline-none focus:border-personA"
            />
            <select
              value={newHabitCat}
              onChange={e => setNewHabitCat(e.target.value)}
              className="w-full border border-gray-200 rounded-btn px-3 py-2.5 text-sm mb-4 outline-none"
            >
              {['Morning','Health','Spiritual','Productivity','Mindset','Growth','Discipline','Recovery'].map(c => (
                <option key={c}>{c}</option>
              ))}
            </select>
            <div className="flex gap-2">
              <button onClick={() => setShowAddModal(false)} className="flex-1 py-2.5 rounded-btn border border-gray-200 text-sm font-medium text-text2">Cancel</button>
              <button
                onClick={handleAddHabit}
                disabled={saving}
                className="flex-1 py-2.5 rounded-btn text-white text-sm font-medium"
                style={{ backgroundColor: accentColor }}
              >
                {saving ? 'Saving…' : 'Add'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

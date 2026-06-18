import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import PersonTabs from '../components/PersonTabs'
import DonutChart from '../components/DonutChart'
import Spinner from '../components/Spinner'
import { getDaysInMonth, getMonthName, formatDate } from '../lib/dateUtils'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  LineChart, Line, CartesianGrid,
} from 'recharts'

export default function AnalyticsPage() {
  const [person, setPerson] = useState('A')
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  const accentColor = person === 'A' ? '#3D5A80' : '#7C4A3A'
  const daysInMonth = getDaysInMonth(year, month)
  const dayOfMonth = year === now.getFullYear() && month === now.getMonth() + 1 ? now.getDate() : daysInMonth

  const prevMonth = () => { if (month === 1) { setMonth(12); setYear(y => y - 1) } else setMonth(m => m - 1) }
  const nextMonth = () => { if (month === 12) { setMonth(1); setYear(y => y + 1) } else setMonth(m => m + 1) }

  const loadAnalytics = async () => {
    setLoading(true)
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`
    const endDate = `${year}-${String(month).padStart(2, '0')}-31`

    const { data: habits } = await supabase.from('habits').select('*').eq('person', person)
    const habitList = habits || []
    const habitIds = habitList.map(h => h.id)

    let logs = []
    if (habitIds.length > 0) {
      const { data: logData } = await supabase
        .from('habit_logs').select('*').in('habit_id', habitIds).gte('date', startDate).lte('date', endDate)
      logs = logData || []
    }

    // Overall pct
    const totalPossible = habitIds.length * dayOfMonth
    const totalDone = logs.filter(l => l.done).length
    const overallPct = totalPossible > 0 ? Math.round((totalDone / totalPossible) * 100) : 0

    // Per habit breakdown
    const habitBreakdown = habitList.map(h => {
      const habitLogs = logs.filter(l => l.habit_id === h.id && l.done)
      const count = habitLogs.length
      const pct = dayOfMonth > 0 ? Math.round((count / dayOfMonth) * 100) : 0
      return { name: h.name, count, pct, total: dayOfMonth }
    }).sort((a, b) => b.pct - a.pct)

    // Daily progress curve
    const dailyCurve = Array.from({ length: dayOfMonth }, (_, i) => {
      const day = i + 1
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      const dayDone = logs.filter(l => l.date === dateStr && l.done).length
      const pct = habitIds.length > 0 ? Math.round((dayDone / habitIds.length) * 100) : 0
      return { day, pct }
    })

    // Task completion by week
    const { data: taskData } = await supabase
      .from('tasks').select('*').eq('person', person).gte('date', startDate).lte('date', endDate)
    const taskList = taskData || []

    const weeklyTasks = [1, 2, 3, 4, 5].map(w => {
      const weekStart = (w - 1) * 7 + 1
      const weekEnd = Math.min(w * 7, daysInMonth)
      const weekTasksAll = taskList.filter(t => {
        const d = parseInt(t.date.split('-')[2])
        return d >= weekStart && d <= weekEnd
      })
      const done = weekTasksAll.filter(t => t.done).length
      const pct = weekTasksAll.length > 0 ? Math.round((done / weekTasksAll.length) * 100) : 0
      return { week: `Wk ${w}`, total: weekTasksAll.length, done, pct }
    })

    const totalTasksMonth = taskList.length
    const doneTasksMonth = taskList.filter(t => t.done).length

    setData({ overallPct, totalDone, totalPossible, habitBreakdown, dailyCurve, weeklyTasks, totalTasksMonth, doneTasksMonth })
    setLoading(false)
  }

  useEffect(() => { loadAnalytics() }, [person, year, month])

  const handleExport = async () => {
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`
    const endDate = `${year}-${String(month).padStart(2, '0')}-31`
    const [{ data: habits }, { data: logs }, { data: tasks }] = await Promise.all([
      supabase.from('habits').select('*').eq('person', person),
      supabase.from('habit_logs').select('*').eq('person', person).gte('date', startDate).lte('date', endDate),
      supabase.from('tasks').select('*').eq('person', person).gte('date', startDate).lte('date', endDate),
    ])
    const blob = new Blob([JSON.stringify({ habits, logs, tasks }, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `dayo-person${person}-${year}-${month}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="p-4 pt-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-bold text-text1">Analytics</h2>
        <button onClick={handleExport} className="text-xs px-3 py-1.5 rounded-btn border border-gray-200 text-text2 font-medium hover:border-gray-300">
          Export JSON
        </button>
      </div>

      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <PersonTabs active={person} onChange={setPerson} />
        <div className="flex items-center gap-3">
          <button onClick={prevMonth} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 text-text2">&#8249;</button>
          <span className="text-sm font-medium text-text1 min-w-[110px] text-center">{getMonthName(month)} {year}</span>
          <button onClick={nextMonth} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 text-text2">&#8250;</button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : !data ? null : (
        <div className="flex flex-col gap-5">
          {/* Section 1: Monthly Overview */}
          <div className="bg-card rounded-card p-5 shadow-sm border border-gray-50">
            <h3 className="font-semibold text-text1 mb-4">Monthly Overview</h3>
            <div className="flex items-center gap-6">
              <DonutChart pct={data.overallPct} color={accentColor} size={130} label="habits" />
              <div>
                <p className="text-sm text-text2 mb-1">Habit completions</p>
                <p className="text-2xl font-bold" style={{ color: accentColor }}>{data.totalDone}<span className="text-text2 text-base font-normal">/{data.totalPossible}</span></p>
                <p className="text-xs text-text2 mt-2">Out of possible check-ins this month</p>
              </div>
            </div>
          </div>

          {/* Section 2: Per Habit Breakdown */}
          {data.habitBreakdown.length > 0 && (
            <div className="bg-card rounded-card p-5 shadow-sm border border-gray-50">
              <h3 className="font-semibold text-text1 mb-4">Per Habit Breakdown</h3>
              <div className="flex flex-col gap-3">
                {data.habitBreakdown.map((h, i) => (
                  <div key={h.name}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-text1 flex-1 mr-2">{h.name}</span>
                      <span className="text-xs text-text2 flex-shrink-0">{h.count}/{h.total}</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div
                        className="h-2 rounded-full transition-all"
                        style={{ width: `${h.pct}%`, backgroundColor: i === 0 ? accentColor : '#B0B0AE' }}
                      />
                    </div>
                    <span className="text-xs text-text2">{h.pct}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section 3: Daily Progress Curve */}
          <div className="bg-card rounded-card p-5 shadow-sm border border-gray-50">
            <h3 className="font-semibold text-text1 mb-4">Daily Progress</h3>
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.dailyCurve}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F0F0EE" />
                  <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#9E9E9E' }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#9E9E9E' }} axisLine={false} tickLine={false} width={28} />
                  <Tooltip formatter={(v) => [`${v}%`, 'Completion']} />
                  <Line type="monotone" dataKey="pct" stroke={accentColor} strokeWidth={2} dot={false} activeDot={{ r: 4, fill: accentColor }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Section 4: Task Completion */}
          <div className="bg-card rounded-card p-5 shadow-sm border border-gray-50">
            <h3 className="font-semibold text-text1 mb-2">Task Completion</h3>
            <p className="text-xs text-text2 mb-4">
              {data.doneTasksMonth} done out of {data.totalTasksMonth} tasks this month
            </p>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.weeklyTasks} barSize={30}>
                  <XAxis dataKey="week" tick={{ fontSize: 11, fill: '#9E9E9E' }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#9E9E9E' }} axisLine={false} tickLine={false} width={28} />
                  <Tooltip formatter={(v, name) => name === 'pct' ? [`${v}%`, 'Completion'] : [v, name]} />
                  <Bar dataKey="pct" radius={[4, 4, 0, 0]}>
                    {data.weeklyTasks.map((entry, i) => (
                      <Cell key={i} fill={entry.pct >= 70 ? accentColor : '#E8E8E6'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

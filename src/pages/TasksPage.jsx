import { useState, useRef } from 'react'
import { useTasks } from '../hooks/useTasks'
import PersonTabs from '../components/PersonTabs'
import Spinner from '../components/Spinner'
import { getWeekDates, formatDate } from '../lib/dateUtils'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export default function TasksPage() {
  const [person, setPerson] = useState('A')
  const [weekOffset, setWeekOffset] = useState(0)
  const [newTask, setNewTask] = useState({})
  const inputRefs = useRef({})

  const weekDates = getWeekDates(weekOffset)
  const startDate = formatDate(weekDates[0])
  const endDate = formatDate(weekDates[6])

  const { tasks, loading, addTask, toggleTask, deleteTask } = useTasks(person, startDate, endDate)

  const accentColor = person === 'A' ? '#3D5A80' : '#7C4A3A'

  const getTasksForDay = (date) => tasks.filter(t => t.date === formatDate(date))

  const getDayPct = (date) => {
    const dayTasks = getTasksForDay(date)
    if (!dayTasks.length) return 0
    return Math.round((dayTasks.filter(t => t.done).length / dayTasks.length) * 100)
  }

  const weeklyTotal = tasks.length
  const weeklyDone = tasks.filter(t => t.done).length
  const weeklyPct = weeklyTotal > 0 ? Math.round((weeklyDone / weeklyTotal) * 100) : 0

  const chartData = weekDates.map((d, i) => ({
    name: DAY_LABELS[i],
    pct: getDayPct(d),
  }))

  const handleAddTask = async (date) => {
    const dateStr = formatDate(date)
    const title = (newTask[dateStr] || '').trim()
    if (!title) return
    await addTask(title, dateStr)
    setNewTask(prev => ({ ...prev, [dateStr]: '' }))
  }

  const weekLabel = () => {
    const d = weekDates[0]
    return `Week of ${d.toLocaleDateString('default', { month: 'short', day: 'numeric' })}`
  }

  return (
    <div className="p-4 pt-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-bold text-text1">Tasks</h2>
      </div>

      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <PersonTabs active={person} onChange={setPerson} />
        <div className="flex items-center gap-3">
          <button onClick={() => setWeekOffset(w => w - 1)} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 text-text2">&#8249;</button>
          <span className="text-sm font-medium text-text1 min-w-[140px] text-center">{weekLabel()}</span>
          <button onClick={() => setWeekOffset(w => w + 1)} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 text-text2">&#8250;</button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : (
        <>
          {/* Day columns — horizontal scroll on mobile */}
          <div className="overflow-x-auto -mx-4 px-4">
            <div className="flex gap-3" style={{ minWidth: 700 }}>
              {weekDates.map((date, i) => {
                const dateStr = formatDate(date)
                const dayTasks = getTasksForDay(date)
                const pct = getDayPct(date)
                const isToday = dateStr === formatDate(new Date())

                return (
                  <div key={dateStr} className="flex-1 min-w-[90px]">
                    <div className={`text-center mb-2 pb-1 border-b ${isToday ? 'border-b-2' : 'border-gray-100'}`}
                      style={{ borderBottomColor: isToday ? accentColor : undefined }}>
                      <p className="text-xs text-text2 font-medium">{DAY_LABELS[i]}</p>
                      <p className={`text-sm font-semibold ${isToday ? '' : 'text-text1'}`} style={{ color: isToday ? accentColor : undefined }}>
                        {date.getDate()}
                      </p>
                    </div>

                    <div className="flex flex-col gap-1.5 min-h-[120px]">
                      {dayTasks.map(task => (
                        <div key={task.id} className="flex items-start gap-1.5 group">
                          <button
                            onClick={() => toggleTask(task.id, task.done)}
                            className="mt-0.5 w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-all"
                            style={{
                              backgroundColor: task.done ? accentColor : 'transparent',
                              borderColor: task.done ? accentColor : '#D0D0CE',
                            }}
                          >
                            {task.done && <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><polyline points="1.5,4 3.5,6 6.5,2" stroke="white" strokeWidth="1.5" strokeLinecap="round"/></svg>}
                          </button>
                          <span className={`text-xs flex-1 leading-tight ${task.done ? 'line-through text-text2' : 'text-text1'}`}>
                            {task.title}
                          </span>
                          <button
                            onClick={() => deleteTask(task.id)}
                            className="opacity-0 group-hover:opacity-100 text-text2 hover:text-red-400 text-xs flex-shrink-0"
                          >&#x2715;</button>
                        </div>
                      ))}
                    </div>

                    {/* Add task input */}
                    <div className="mt-2">
                      <input
                        ref={el => inputRefs.current[dateStr] = el}
                        value={newTask[dateStr] || ''}
                        onChange={e => setNewTask(prev => ({ ...prev, [dateStr]: e.target.value }))}
                        onKeyDown={e => e.key === 'Enter' && handleAddTask(date)}
                        onBlur={() => handleAddTask(date)}
                        placeholder="+ task"
                        className="w-full text-xs px-1.5 py-1 border-b border-transparent focus:border-gray-200 outline-none bg-transparent text-text2 placeholder:text-gray-300"
                      />
                    </div>

                    {/* Day completion % */}
                    <div className="mt-2 text-center">
                      <span className="text-xs font-medium" style={{ color: pct >= 70 ? '#4CAF50' : pct >= 40 ? '#FF9800' : '#D0D0CE' }}>
                        {dayTasks.length > 0 ? `${pct}%` : '—'}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Weekly Summary */}
          <div className="mt-6 bg-card rounded-card p-4 border border-gray-50 shadow-sm">
            <h3 className="font-semibold text-text1 mb-4">Weekly Summary</h3>
            <div className="flex gap-4 mb-4">
              <div>
                <p className="text-xs text-text2">Total Added</p>
                <p className="text-lg font-bold text-text1">{weeklyTotal}</p>
              </div>
              <div>
                <p className="text-xs text-text2">Completed</p>
                <p className="text-lg font-bold" style={{ color: accentColor }}>{weeklyDone}</p>
              </div>
              <div>
                <p className="text-xs text-text2">Completion</p>
                <p className="text-lg font-bold text-text1">{weeklyPct}%</p>
              </div>
            </div>
            <div className="h-32">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} barSize={20}>
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9E9E9E' }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#9E9E9E' }} axisLine={false} tickLine={false} width={25} />
                  <Tooltip formatter={(v) => [`${v}%`, 'Completion']} />
                  <Bar dataKey="pct" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, i) => (
                      <Cell key={i} fill={entry.pct >= 70 ? accentColor : '#E8E8E6'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export function formatDate(date) {
  return date.toISOString().split('T')[0]
}

export function getDaysInMonth(year, month) {
  return new Date(year, month, 0).getDate()
}

export function getWeekDates(weekOffset = 0) {
  const now = new Date()
  const day = now.getDay()
  const monday = new Date(now)
  monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1) + weekOffset * 7)
  monday.setHours(0, 0, 0, 0)
  const days = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    days.push(d)
  }
  return days
}

export function getMonthName(month) {
  return new Date(2024, month - 1, 1).toLocaleString('default', { month: 'long' })
}

export function formatShortDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('default', { weekday: 'short', month: 'short', day: 'numeric' })
}

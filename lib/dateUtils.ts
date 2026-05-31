// Week calendar utilities
export const getWeekStart = (date: Date) => {
  const d = new Date(date)
  d.setDate(d.getDate() - d.getDay()) // Sunday of the week
  d.setHours(0, 0, 0, 0)
  return d
}

export const getWeekDates = (startDate: Date) => {
  const dates = []
  for (let i = 0; i < 7; i++) {
    const date = new Date(startDate)
    date.setDate(date.getDate() + i)
    date.setHours(0, 0, 0, 0)
    dates.push(date)
  }
  return dates
}

export const isDateDisabled = (date: Date) => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return date < today
}

export const formatDateForDisplay = (date: Date) => {
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  })
}

export const formatDateISO = (date: Date) => {
  return date.toISOString().split('T')[0]
}

export const createSlot = (date: Date, time: string) => {
  return {
    date: formatDateForDisplay(date),
    time,
    iso: formatDateISO(date),
  }
}

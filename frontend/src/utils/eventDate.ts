function parseDate(value: string): Date | null {
  const [year, month, day] = value.split('-').map(Number)
  if (!year || !month || !day) return null
  return new Date(year, month - 1, day)
}

const fmt = (date: Date, options: Intl.DateTimeFormatOptions) =>
  date.toLocaleDateString('en-IN', options)

/** Whole days from today until a YYYY-MM-DD date (0 = today), or null when there is no valid date. */
export function daysUntil(value: string | null | undefined): number | null {
  const date = value ? parseDate(value) : null
  if (!date) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.round((date.getTime() - today.getTime()) / 86_400_000)
}

export function formatEventDateRange(
  start: string | null | undefined,
  end?: string | null,
): string {
  if (!start) return ''
  const from = parseDate(start)
  if (!from) return start
  const to = end && end !== start ? parseDate(end) : null
  const full: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' }

  if (!to) return fmt(from, full)

  if (from.getFullYear() !== to.getFullYear()) {
    return `${fmt(from, full)} – ${fmt(to, full)}`
  }
  if (from.getMonth() !== to.getMonth()) {
    return `${fmt(from, { day: 'numeric', month: 'short' })} – ${fmt(to, full)}`
  }
  return `${from.getDate()}–${fmt(to, full)}`
}

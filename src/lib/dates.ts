const frenchDays = [
  "dimanche",
  "lundi",
  "mardi",
  "mercredi",
  "jeudi",
  "vendredi",
  "samedi",
]

const shortDays = ["dim", "lun", "mar", "mer", "jeu", "ven", "sam"]

export function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1)
}

export function dayName(date: Date): string {
  return frenchDays[date.getDay()]
}

export function shortDayName(date: Date): string {
  return shortDays[date.getDay()]
}

function monthName(date: Date): string {
  return date.toLocaleDateString("fr", { month: "long" })
}

export function monthLabel(date: Date): string {
  return capitalize(
    date.toLocaleDateString("fr", { month: "long", year: "numeric" })
  )
}

export function fullDateLabel(date: Date): string {
  return capitalize(`${dayName(date)} ${date.getDate()} ${monthName(date)}`)
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

export function toDayKey(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${date.getFullYear()}-${month}-${day}`
}

export function parseDateKey(key: string | null): Date | null {
  if (!key) return null
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key)
  if (!match) return null
  const [, year, month, day] = match
  const date = new Date(Number(year), Number(month) - 1, Number(day))
  return Number.isNaN(date.getTime()) ? null : date
}

export function addDays(date: Date, amount: number): Date {
  const next = new Date(date)
  next.setDate(next.getDate() + amount)
  return next
}

export function daysUntil(date: Date, now = new Date()): number {
  const diff = startOfDay(date).getTime() - startOfDay(now).getTime()
  return Math.round(diff / 86_400_000)
}

export function weekOf(date: Date): Date[] {
  const monday = addDays(startOfDay(date), -((date.getDay() + 6) % 7))
  return Array.from({ length: 7 }, (_, index) => addDays(monday, index))
}

export function isoWeekNumber(date: Date): number {
  const target = startOfDay(date)
  target.setDate(target.getDate() - ((target.getDay() + 6) % 7) + 3)
  const firstThursday = new Date(target.getFullYear(), 0, 4)
  firstThursday.setDate(
    firstThursday.getDate() - ((firstThursday.getDay() + 6) % 7) + 3
  )
  return (
    1 +
    Math.round((target.getTime() - firstThursday.getTime()) / (7 * 86_400_000))
  )
}

export function formatTime(date: Date | null): string {
  if (!date) return ""
  return date.toLocaleTimeString("fr", { hour: "2-digit", minute: "2-digit" })
}

export function minutesOfDay(date: Date | null): number {
  if (!date) return 0
  return date.getHours() * 60 + date.getMinutes()
}

export function hoursLabel(minutes: number): string {
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return rest === 0
    ? `${hours} h`
    : `${hours} h ${String(rest).padStart(2, "0")}`
}

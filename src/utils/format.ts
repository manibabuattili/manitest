const inr = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
})

const inrPrecise = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 2,
})

export function formatINR(value: number, precise = false): string {
  return (precise ? inrPrecise : inr).format(value)
}

export function formatNumber(value: number, digits = 0): string {
  return new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(value)
}

export function formatHours(hours: number): string {
  return `${formatNumber(hours, 1)} hrs`
}

export function formatMinutes(minutes: number): string {
  return `${formatNumber(minutes, 1)} min`
}

export function formatPercent(value: number | null): string {
  if (value === null || Number.isNaN(value)) return 'N/A'
  return `${formatNumber(value, 1)}%`
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

export function formatDateShort(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
  })
}

export function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('')
}

export function workDaysFromHours(hours: number): string {
  return formatNumber(hours / 8, 1)
}

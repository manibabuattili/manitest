import type { ButtonHTMLAttributes, ReactNode } from 'react'

export function FiltersBar({ children }: { children: ReactNode }) {
  return (
    <div className="mb-4 flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-3 md:flex-row md:flex-wrap md:items-end">
      {children}
    </div>
  )
}

export function Field({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <label className="flex min-w-[160px] flex-1 flex-col gap-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
      {label}
      {children}
    </label>
  )
}

export function inputClass() {
  return 'rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-normal normal-case tracking-normal text-slate-800 outline-none focus:border-[#17A2B8] focus:ring-2 focus:ring-[#17A2B8]/20'
}

export function PrimaryButton({
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`rounded-md bg-[#17A2B8] px-4 py-2 text-sm font-medium text-white hover:bg-[#138496] disabled:cursor-not-allowed disabled:opacity-50 ${props.className ?? ''}`}
    >
      {children}
    </button>
  )
}

export function GhostButton({
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 ${props.className ?? ''}`}
    >
      {children}
    </button>
  )
}

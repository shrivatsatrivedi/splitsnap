import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

export const PERSON_COLORS = [
  '#7c3aed', '#06b6d4', '#f59e0b', '#ec4899', '#10b981',
  '#ef4444', '#3b82f6', '#8b5cf6', '#14b8a6', '#f97316',
]

export function Button({
  children, onClick, variant = 'primary', disabled, className = '', type,
}: {
  children: ReactNode
  onClick?: () => void
  variant?: 'primary' | 'ghost' | 'soft'
  disabled?: boolean
  className?: string
  type?: 'button' | 'submit'
}) {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 font-semibold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed'
  const styles = {
    primary:
      'bg-gradient-to-r from-violet-600 to-cyan-500 text-white shadow-lg shadow-violet-900/40 hover:shadow-violet-700/50 hover:-translate-y-0.5',
    ghost: 'text-white/70 hover:text-white hover:bg-white/5',
    soft: 'glass text-white hover:bg-white/10',
  }[variant]
  return (
    <motion.button
      whileTap={{ scale: 0.96 }}
      type={type || 'button'}
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${styles} ${className}`}
    >
      {children}
    </motion.button>
  )
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className={`glass rounded-3xl p-6 sm:p-8 ${className}`}
    >
      {children}
    </motion.div>
  )
}

export function Stepper({ step, labels }: { step: number; labels: string[] }) {
  return (
    <div className="flex items-center justify-center gap-2 sm:gap-3 mb-8 flex-wrap">
      {labels.map((label, i) => {
        const active = i === step
        const done = i < step
        return (
          <div key={label} className="flex items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-2">
              <motion.div
                animate={{ scale: active ? 1.1 : 1 }}
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold border transition-colors ${
                  active
                    ? 'bg-gradient-to-r from-violet-600 to-cyan-500 border-transparent text-white'
                    : done
                    ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-300'
                    : 'border-white/15 text-white/40'
                }`}
              >
                {done ? '✓' : i + 1}
              </motion.div>
              <span className={`hidden sm:block text-sm ${active ? 'text-white font-semibold' : 'text-white/40'}`}>
                {label}
              </span>
            </div>
            {i < labels.length - 1 && <div className="h-px w-4 sm:w-8 bg-white/10" />}
          </div>
        )
      })}
    </div>
  )
}

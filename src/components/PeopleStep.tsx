import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { uid } from '../lib/id'
import type { Person } from '../types'
import { Button, PERSON_COLORS } from './ui'

export default function PeopleStep({
  people, setPeople, onNext, onBack,
}: {
  people: Person[]
  setPeople: (p: Person[]) => void
  onNext: () => void
  onBack: () => void
}) {
  const [name, setName] = useState('')

  const add = () => {
    const n = name.trim()
    if (!n) return
    setPeople([...people, { id: uid(), name: n, color: PERSON_COLORS[people.length % PERSON_COLORS.length] }])
    setName('')
  }
  const remove = (id: string) => setPeople(people.filter((p) => p.id !== id))

  return (
    <div>
      <h2 className="text-2xl font-bold">Who's splitting?</h2>
      <p className="text-white/50 text-sm mt-1 mb-5">Add everyone at the table.</p>

      <div className="flex gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && add()}
          placeholder="Enter a name…"
          className="flex-1 glass rounded-xl px-4 py-3 outline-none focus:ring-1 ring-cyan-400 placeholder:text-white/30"
        />
        <Button onClick={add} disabled={!name.trim()}>Add</Button>
      </div>

      <div className="mt-5 flex flex-wrap gap-2 min-h-[3rem]">
        <AnimatePresence>
          {people.map((p) => (
            <motion.div
              key={p.id}
              layout
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex items-center gap-2 rounded-full pl-2 pr-3 py-2 text-sm font-semibold"
              style={{ background: p.color + '22', border: `1px solid ${p.color}55` }}
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-full text-xs" style={{ background: p.color }}>
                {p.name.charAt(0).toUpperCase()}
              </span>
              {p.name}
              <button onClick={() => remove(p.id)} className="text-white/40 hover:text-white ml-1">×</button>
            </motion.div>
          ))}
        </AnimatePresence>
        {people.length === 0 && <p className="text-white/30 text-sm self-center">No one added yet.</p>}
      </div>

      <div className="mt-8 flex justify-between">
        <Button variant="ghost" onClick={onBack}>← Back</Button>
        <Button onClick={onNext} disabled={people.length === 0}>Next: Assign →</Button>
      </div>
    </div>
  )
}

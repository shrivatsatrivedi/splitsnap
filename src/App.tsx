import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { BillItem, Person, Assignments, Charges } from './types'
import { computeSplit, money } from './lib/split'
import { getHistory, saveSplit, clearHistory, type HistoryEntry } from './lib/storage'
import { Card, Stepper } from './components/ui'
import Uploader from './components/Uploader'
import ItemsStep from './components/ItemsStep'
import PeopleStep from './components/PeopleStep'
import AssignStep from './components/AssignStep'
import ResultsStep from './components/ResultsStep'

const STEPS = ['Scan', 'Items', 'People', 'Assign', 'Split']

export default function App() {
  const [step, setStep] = useState(0)
  const [items, setItems] = useState<BillItem[]>([])
  const [people, setPeople] = useState<Person[]>([])
  const [assignments, setAssignments] = useState<Assignments>({})
  const [charges, setCharges] = useState<Charges>({
    gstPercent: 5, serviceChargePercent: 0, discount: 0, discountType: 'flat', taxOnService: true,
  })
  const [history, setHistory] = useState<HistoryEntry[]>(() => getHistory())

  const reset = () => {
    setItems([]); setPeople([]); setAssignments({})
    setCharges({ gstPercent: 5, serviceChargePercent: 0, discount: 0, discountType: 'flat', taxOnService: true })
    setStep(0)
  }

  // Assign every currently-unassigned item equally to everyone.
  const splitRemainingEqually = () => {
    const next: Assignments = { ...assignments }
    for (const it of items) {
      const w = next[it.id] || {}
      const total = people.reduce((s, p) => s + (w[p.id] || 0), 0)
      if (total <= 0) {
        next[it.id] = {}
        people.forEach((p) => (next[it.id][p.id] = 1))
      }
    }
    setAssignments(next)
  }

  const goToResults = () => {
    saveSplit(computeSplit(items, people, assignments, charges), items.length)
    setHistory(getHistory())
    setStep(4)
  }

  return (
    <div className="relative min-h-screen">
      <div className="aurora" />
      <div className="relative z-10 mx-auto max-w-2xl px-4 py-8 sm:py-12">
        <header className="text-center mb-8">
          <motion.h1
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="text-3xl sm:text-4xl font-extrabold bg-gradient-to-r from-violet-400 via-fuchsia-300 to-cyan-300 bg-clip-text text-transparent"
          >
            SplitSnap
          </motion.h1>
          <p className="text-white/50 text-sm mt-1">Scan a bill · split it fairly · GST included</p>
        </header>

        <Stepper step={step} labels={STEPS} />

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.3 }}
          >
            <Card>
              {step === 0 && (
                <Uploader onDone={(i) => { setItems(i); setStep(1) }} />
              )}
              {step === 1 && (
                <ItemsStep
                  items={items} setItems={setItems} charges={charges} setCharges={setCharges}
                  onNext={() => setStep(2)} onBack={() => setStep(0)}
                />
              )}
              {step === 2 && (
                <PeopleStep people={people} setPeople={setPeople} onNext={() => setStep(3)} onBack={() => setStep(1)} />
              )}
              {step === 3 && (
                <AssignStep
                  items={items} people={people} assignments={assignments} setAssignments={setAssignments}
                  onNext={goToResults} onBack={() => setStep(2)}
                />
              )}
              {step === 4 && (
                <ResultsStep
                  items={items} people={people} assignments={assignments} charges={charges}
                  onBack={() => setStep(3)} onReset={reset} onFixUnassigned={splitRemainingEqually}
                />
              )}
            </Card>
          </motion.div>
        </AnimatePresence>

        {step === 0 && history.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="mt-6"
          >
            <div className="flex items-center justify-between mb-2 px-1">
              <h3 className="text-sm font-semibold text-white/60">Recent splits</h3>
              <button
                onClick={() => { clearHistory(); setHistory([]) }}
                className="text-xs text-white/30 hover:text-red-400"
              >
                Clear
              </button>
            </div>
            <div className="space-y-2">
              {history.map((h) => (
                <div key={h.id} className="glass rounded-2xl px-4 py-3 flex items-center justify-between">
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">
                      {h.names.slice(0, 3).join(', ')}{h.names.length > 3 ? ` +${h.names.length - 3}` : ''}
                    </div>
                    <div className="text-xs text-white/40">
                      {new Date(h.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })} · {h.peopleCount} people · {h.itemCount} items
                    </div>
                  </div>
                  <div className="font-bold text-cyan-300 shrink-0 ml-3">{money(h.grandTotal)}</div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        <p className="text-center text-white/25 text-xs mt-6">Runs entirely in your browser — your bill never leaves your device.</p>
      </div>
    </div>
  )
}

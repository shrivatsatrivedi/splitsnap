import { useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Tesseract from 'tesseract.js'
import { parseItems } from '../lib/parse'
import type { BillItem } from '../types'
import { Button } from './ui'

// Map Tesseract's phases onto a single 0–100 bar so the loader keeps moving
// through the (otherwise silent) download + init phases, not just recognition.
function phaseProgress(status: string, p: number): { pct: number; label: string } | null {
  const prog = isFinite(p) ? p : 0
  if (status.includes('loading tesseract core'))
    return { pct: 5 + prog * 20, label: 'Downloading the scanner…' }
  if (status.includes('loading language'))
    return { pct: 25 + prog * 30, label: 'Loading the text reader…' }
  if (status.includes('initializing'))
    return { pct: 55 + prog * 10, label: 'Getting ready…' }
  if (status.includes('recognizing text'))
    return { pct: 65 + prog * 35, label: 'Reading your bill…' }
  return null
}

function CircularProgress({ pct }: { pct: number }) {
  const r = 52
  const c = 2 * Math.PI * r
  const clamped = Math.max(0, Math.min(100, pct))
  return (
    <div className="relative mx-auto h-32 w-32">
      <svg className="h-32 w-32 -rotate-90" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
        <motion.circle
          cx="60" cy="60" r={r} fill="none"
          stroke="url(#grad)" strokeWidth="8" strokeLinecap="round"
          strokeDasharray={c}
          animate={{ strokeDashoffset: c - (c * clamped) / 100 }}
          transition={{ ease: 'easeOut', duration: 0.4 }}
        />
        <defs>
          <linearGradient id="grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#7c3aed" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-extrabold">{Math.round(clamped)}%</span>
        <span className="text-[10px] uppercase tracking-wider text-white/40">scanning</span>
      </div>
    </div>
  )
}

export default function Uploader({ onDone }: { onDone: (items: BillItem[]) => void }) {
  const [preview, setPreview] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState<string>('')
  const [scanning, setScanning] = useState(false)
  const [drag, setDrag] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) return
    const url = URL.createObjectURL(file)
    setPreview(url)
    setScanning(true)
    setProgress(3)
    setStatus('Image uploaded · starting scan…')
    try {
      const { data } = await Tesseract.recognize(file, 'eng', {
        logger: (m) => {
          const mapped = phaseProgress(m.status || '', m.progress)
          if (mapped) {
            // never let the bar go backwards between phases
            setProgress((prev) => Math.max(prev, Math.round(mapped.pct)))
            setStatus(mapped.label)
          }
        },
      })
      const items = parseItems(data.text)
      setProgress(100)
      setStatus(`Done! Found ${items.length} item${items.length === 1 ? '' : 's'}.`)
      setTimeout(() => onDone(items), 500)
    } catch {
      setStatus('Could not read that — you can add items manually.')
      setTimeout(() => onDone([]), 900)
    }
  }, [onDone])

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
      />
      <AnimatePresence mode="wait">
        {!scanning ? (
          <motion.div
            key="drop"
            exit={{ opacity: 0 }}
            onDragOver={(e) => { e.preventDefault(); setDrag(true) }}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => {
              e.preventDefault(); setDrag(false)
              e.dataTransfer.files?.[0] && handleFile(e.dataTransfer.files[0])
            }}
            onClick={() => inputRef.current?.click()}
            className={`cursor-pointer rounded-3xl border-2 border-dashed p-12 text-center transition-all ${
              drag ? 'border-cyan-400 bg-cyan-400/5 scale-[1.01]' : 'border-white/15 hover:border-violet-400/60 hover:bg-white/[0.02]'
            }`}
          >
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
              className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-cyan-500 text-3xl shadow-xl shadow-violet-900/40"
            >
              🧾
            </motion.div>
            <h3 className="text-xl font-bold">Drop your bill here</h3>
            <p className="mt-1 text-white/50 text-sm">browse files, pick from your gallery, or snap a photo</p>
            <div className="mt-5">
              <Button onClick={() => inputRef.current?.click()}>Choose image</Button>
            </div>
            <p className="mt-4 text-xs text-white/30">
              ✨ First scan downloads a small reader (~3 MB) — it may take a few seconds. Instant after that.
            </p>
          </motion.div>
        ) : (
          <motion.div key="scan" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
            {/* Uploaded image preview with live scan beam */}
            <div className="relative mx-auto mb-6 w-40 overflow-hidden rounded-2xl border border-white/10 shadow-lg">
              {preview && <img src={preview} alt="your bill" className="h-44 w-full object-cover opacity-80" />}
              <motion.div
                className="absolute inset-x-0 h-1/3"
                style={{ background: 'linear-gradient(to bottom, rgba(6,182,212,0), rgba(6,182,212,0.35), rgba(6,182,212,0))' }}
                animate={{ top: ['-33%', '100%'] }}
                transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
              />
              <div className="absolute left-2 top-2 flex items-center gap-1.5 rounded-full bg-black/50 px-2 py-1 backdrop-blur-sm">
                <motion.span
                  className="h-1.5 w-1.5 rounded-full bg-cyan-400"
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                />
                <span className="text-[10px] font-medium text-white/80">Processing</span>
              </div>
            </div>

            <CircularProgress pct={progress} />

            <p className="mt-4 text-white/80 text-sm font-medium">{status}</p>
            <p className="mt-1 text-xs text-white/35">Keeping everything on your device — nothing is uploaded.</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

import { useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Tesseract from 'tesseract.js'
import { parseItems } from '../lib/parse'
import type { BillItem } from '../types'
import { Button } from './ui'

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
    setProgress(0)
    setStatus('Warming up the scanner…')
    try {
      const { data } = await Tesseract.recognize(file, 'eng', {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            setProgress(Math.round(m.progress * 100))
            setStatus('Reading your bill…')
          } else if (m.status) {
            setStatus(m.status.replace(/^\w/, (c) => c.toUpperCase()) + '…')
          }
        },
      })
      const items = parseItems(data.text)
      setStatus('Done!')
      setTimeout(() => onDone(items), 350)
    } catch {
      setStatus('Could not read that — you can add items manually.')
      setTimeout(() => onDone([]), 800)
    }
  }, [onDone])

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
      />
      <AnimatePresence mode="wait">
        {!scanning ? (
          <motion.div
            key="drop"
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
            <p className="mt-1 text-white/50 text-sm">or click to browse · snap a photo on mobile</p>
            <div className="mt-5">
              <Button onClick={() => inputRef.current?.click()}>Choose image</Button>
            </div>
            <p className="mt-4 text-xs text-white/30">
              ✨ First scan downloads a small reader (~3 MB) — it may take a few seconds. Instant after that.
            </p>
          </motion.div>
        ) : (
          <motion.div key="scan" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
            <div className="relative mx-auto mb-6 w-full max-w-xs overflow-hidden rounded-2xl border border-white/10">
              {preview && <img src={preview} alt="bill" className="w-full object-cover opacity-80" />}
              <motion.div
                className="absolute inset-x-0 h-1/3 bg-gradient-to-b from-cyan-400/0 via-cyan-400/30 to-cyan-400/0"
                animate={{ top: ['-33%', '100%'] }}
                transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
                style={{ position: 'absolute' }}
              />
            </div>
            <p className="text-white/70 text-sm mb-3">{status}</p>
            <div className="mx-auto h-2 max-w-xs overflow-hidden rounded-full bg-white/10">
              <motion.div
                className="h-full bg-gradient-to-r from-violet-500 to-cyan-400"
                animate={{ width: `${progress}%` }}
                transition={{ ease: 'easeOut' }}
              />
            </div>
            <p className="mt-2 text-xs text-white/40">{progress}%</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

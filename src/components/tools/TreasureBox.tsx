import { useState } from 'react'
import { motion } from 'framer-motion'
import { Image as ImageIcon, Trash2, Plus } from 'lucide-react'
import { addToolEntry, deleteToolEntry } from '../../lib/db/toolEntries'
import { useToolEntries } from '../../lib/hooks/useToolEntries'
import { useToast } from '../ui/Toast'

const MAX_IMAGE_BYTES = 250_000
const MAX_TOTAL_BASE64 = 350_000

export function TreasureBox() {
  const [text, setText] = useState('')
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const toast = useToast()
  const { entries } = useToolEntries({ toolKey: 'treasure' })

  async function handleFile(file: File) {
    if (file.size > MAX_IMAGE_BYTES) {
      toast.show({
        variant: 'error',
        message: 'Bild zu groß (max. 250 KB).',
      })
      return
    }
    try {
      const dataUrl = await readAsDataUrl(file)
      if (dataUrl.length > MAX_TOTAL_BASE64) {
        toast.show({
          variant: 'error',
          message: 'Bild zu groß nach Kodierung.',
        })
        return
      }
      setImageDataUrl(dataUrl)
    } catch {
      toast.show({
        variant: 'error',
        message: 'Konnte das Bild nicht lesen.',
      })
    }
  }

  async function submit() {
    const value = text.trim()
    if (!value && !imageDataUrl) return
    await addToolEntry({
      toolKey: 'treasure',
      loggedAt: Date.now(),
      text: value || undefined,
      imageDataUrl: imageDataUrl ?? undefined,
    })
    setText('')
    setImageDataUrl(null)
    setAdding(false)
    toast.show({ variant: 'success', message: 'Schatz gespeichert.' })
  }

  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Sammle schöne Momente — kleine Erinnerungen für graue Tage.
      </p>

      {!adding ? (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="inline-flex items-center justify-center gap-2 rounded-md bg-pink-600 px-4 py-2 text-sm font-medium text-white hover:bg-pink-700"
        >
          <Plus size={16} /> Neuer Schatz
        </button>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault()
            void submit()
          }}
          className="flex flex-col gap-3 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
        >
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={500}
            rows={3}
            placeholder="Was war heute schön?"
            className="resize-none rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
          />
          {imageDataUrl ? (
            <div className="relative">
              <img
                src={imageDataUrl}
                alt="Vorschau"
                className="max-h-48 rounded-md object-cover"
              />
              <button
                type="button"
                onClick={() => setImageDataUrl(null)}
                className="absolute right-2 top-2 rounded bg-zinc-900/80 px-2 py-1 text-xs text-white"
              >
                Entfernen
              </button>
            </div>
          ) : (
            <label className="inline-flex w-fit cursor-pointer items-center gap-2 rounded-md border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800">
              <ImageIcon size={14} />
              Bild hinzufügen (optional, max. 250 KB)
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) void handleFile(file)
                }}
              />
            </label>
          )}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setAdding(false)
                setText('')
                setImageDataUrl(null)
              }}
              className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={!text.trim() && !imageDataUrl}
              className="rounded-md bg-pink-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-pink-700 disabled:opacity-50"
            >
              Speichern
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {entries.map((e) => (
          <motion.article
            key={e.id}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col gap-2 rounded-lg border border-zinc-200 bg-gradient-to-br from-pink-50 to-amber-50 p-3 dark:border-zinc-800 dark:from-pink-950/30 dark:to-amber-950/20"
          >
            {e.imageDataUrl && (
              <img
                src={e.imageDataUrl}
                alt=""
                className="max-h-40 w-full rounded-md object-cover"
              />
            )}
            {e.text && <p className="text-sm">{e.text}</p>}
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                {new Date(e.loggedAt).toLocaleDateString('de-DE')}
              </span>
              <button
                type="button"
                onClick={() => void deleteToolEntry(e.id)}
                className="rounded p-1 text-zinc-400 hover:bg-white hover:text-rose-600 dark:hover:bg-zinc-900"
                aria-label="Schatz löschen"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </motion.article>
        ))}
        {entries.length === 0 && !adding && (
          <p className="col-span-full rounded-lg border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
            Noch keine Schätze.
          </p>
        )}
      </div>
    </div>
  )
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

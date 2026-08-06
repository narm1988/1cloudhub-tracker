import { useEffect, useState } from 'react'
import { Tags } from 'lucide-react'
import { api } from '../../lib/api'
import Button from '../ui/Button'

const LABEL_COLORS = ['#5B5FEF', '#1E9E6B', '#C6820F', '#E5484D', '#3B82F6', '#8B5CF6', '#EC4899', '#14B8A6']

export default function LabelsField({
  parentId,
  kind,
}: {
  parentId: string
  kind: 'story' | 'issue'
}) {

  const [labels, setLabels] = useState<{ id: string; name: string; color: string }[]>([])
  const [allLabels, setAllLabels] = useState<{ id: string; name: string; color: string }[]>([])
  const [showAdd, setShowAdd] = useState(false)
  const [newLabelName, setNewLabelName] = useState('')
  const [newLabelColor, setNewLabelColor] = useState(LABEL_COLORS[0])

  useEffect(() => {
    fetchLabels()
    fetchAllLabels()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parentId])

  async function fetchLabels() {
    try {
      const data = await api.listAttachedLabels(parentId, kind)
      setLabels(data)
    } catch {}
  }

  async function fetchAllLabels() {
    try {
      const data = await api.listLabels()
      setAllLabels(data)
    } catch {}
  }

  async function createAndAttachLabel() {
    if (!newLabelName.trim()) return
    try {
      const label = await api.createLabel(newLabelName.trim(), newLabelColor, null)
      await api.attachLabel(parentId, kind, label.id)
    } catch {}
    setNewLabelName('')
    setShowAdd(false)
    fetchLabels()
    fetchAllLabels()
  }

  async function attachExistingLabel(labelId: string) {
    try {
      await api.attachLabel(parentId, kind, labelId)
    } catch {}
    fetchLabels()
  }

  async function removeLabel(labelId: string) {
    try {
      await api.detachLabel(parentId, kind, labelId)
    } catch {}
    fetchLabels()
  }

  const unattachedLabels = allLabels.filter((l) => !labels.find((sl) => sl.id === l.id))

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[13px] text-gray-500 flex items-center gap-1">
          <Tags size={12} /> Labels
        </span>
        <button
          onClick={() => setShowAdd((s) => !s)}
          className="text-[12px] text-brand hover:text-brand-deep font-medium"
        >
          + Add
        </button>
      </div>

      <div className="flex flex-wrap gap-1.5 justify-end">
        {labels.map((label) => (
          <span
            key={label.id}
            className="flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full text-white group"
            style={{ backgroundColor: label.color }}
          >
            {label.name}
            <button
              onClick={() => removeLabel(label.id)}
              className="opacity-0 group-hover:opacity-100 ml-0.5 hover:text-red-200"
            >
              ×
            </button>
          </span>
        ))}
        {labels.length === 0 && !showAdd && (
          <span className="text-[13px] text-gray-400">None</span>
        )}
      </div>

      {showAdd && (
        <div className="border border-gray-200 rounded-lg p-2.5 mt-2 space-y-2.5">
          {unattachedLabels.length > 0 && (
            <div>
              <label className="block text-[12px] font-medium text-gray-500 mb-1.5">Existing labels</label>
              <div className="flex flex-wrap gap-1.5">
                {unattachedLabels.map((label) => (
                  <button
                    key={label.id}
                    onClick={() => attachExistingLabel(label.id)}
                    className="text-[11px] font-medium px-2 py-0.5 rounded-full text-white hover:opacity-80 transition-opacity"
                    style={{ backgroundColor: label.color }}
                  >
                    + {label.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="block text-[12px] font-medium text-gray-500 mb-1.5">Create new label</label>
            <div className="flex items-center gap-1.5">
              <input
                className="flex-1 min-w-0 px-2 py-1.5 rounded-lg border border-gray-200 text-xs outline-none focus:border-brand"
                placeholder="Label name..."
                value={newLabelName}
                onChange={(e) => setNewLabelName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') createAndAttachLabel() }}
              />
              <div className="flex gap-1 shrink-0">
                {LABEL_COLORS.slice(0, 4).map((c) => (
                  <button
                    key={c}
                    onClick={() => setNewLabelColor(c)}
                    className={`w-4 h-4 rounded-full border-2 ${newLabelColor === c ? 'border-ink' : 'border-transparent'}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
            <Button size="sm" className="w-full mt-1.5" onClick={createAndAttachLabel} disabled={!newLabelName.trim()}>
              Create
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

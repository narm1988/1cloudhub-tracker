import { useEffect, useState } from 'react'
import { Tags } from 'lucide-react'
import { supabase } from '../../lib/supabase'

const LABEL_COLORS = ['#5B5FEF', '#1E9E6B', '#C6820F', '#E5484D', '#3B82F6', '#8B5CF6', '#EC4899', '#14B8A6']

export default function LabelsField({
  parentId,
  kind,
}: {
  parentId: string
  kind: 'story' | 'issue'
}) {
  const junctionTable = kind === 'story' ? 'story_labels' : 'issue_labels'
  const junctionColumn = kind === 'story' ? 'story_id' : 'issue_id'
  const junctionFk = kind === 'story' ? 'story_labels_label_id_fkey' : 'issue_labels_label_id_fkey'

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
    const { data } = await supabase
      .from(junctionTable)
      .select(`label_id, labels:labels!${junctionFk}(id, name, color)`)
      .eq(junctionColumn, parentId)
    if (data) {
      const mapped = data.map((d: any) => d.labels).filter(Boolean)
      setLabels(mapped)
    }
  }

  async function fetchAllLabels() {
    const { data } = await supabase.from('labels').select('*').order('name')
    if (data) setAllLabels(data)
  }

  async function createAndAttachLabel() {
    if (!newLabelName.trim()) return
    const { data } = await supabase.from('labels').insert({
      name: newLabelName.trim(),
      color: newLabelColor,
      project_id: null,
    }).select().single()

    if (data) {
      await supabase.from(junctionTable).insert({
        [junctionColumn]: parentId,
        label_id: data.id,
      })
    }
    setNewLabelName('')
    setShowAdd(false)
    fetchLabels()
    fetchAllLabels()
  }

  async function attachExistingLabel(labelId: string) {
    await supabase.from(junctionTable).insert({
      [junctionColumn]: parentId,
      label_id: labelId,
    })
    fetchLabels()
  }

  async function removeLabel(labelId: string) {
    await supabase.from(junctionTable).delete()
      .eq(junctionColumn, parentId)
      .eq('label_id', labelId)
    fetchLabels()
  }

  const unattachedLabels = allLabels.filter((l) => !labels.find((sl) => sl.id === l.id))

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[12px] text-gray-500 flex items-center gap-1">
          <Tags size={12} /> Labels
        </span>
        <button
          onClick={() => setShowAdd((s) => !s)}
          className="text-[11px] text-brand hover:text-brand-deep font-medium"
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
          <span className="text-[12px] text-gray-400">None</span>
        )}
      </div>

      {showAdd && (
        <div className="border border-gray-200 rounded-lg p-2.5 mt-2 space-y-2.5">
          {unattachedLabels.length > 0 && (
            <div>
              <label className="block text-[10.5px] font-semibold text-gray-500 mb-1.5">Existing labels</label>
              <div className="flex flex-wrap gap-1.5">
                {unattachedLabels.map((label) => (
                  <button
                    key={label.id}
                    onClick={() => attachExistingLabel(label.id)}
                    className="text-[10.5px] font-medium px-2 py-0.5 rounded-full text-white hover:opacity-80 transition-opacity"
                    style={{ backgroundColor: label.color }}
                  >
                    + {label.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="block text-[10.5px] font-semibold text-gray-500 mb-1.5">Create new label</label>
            <div className="flex items-center gap-1.5">
              <input
                className="flex-1 min-w-0 px-2 py-1.5 rounded-lg border border-gray-200 text-[11.5px] outline-none focus:border-brand"
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
            <button
              onClick={createAndAttachLabel}
              disabled={!newLabelName.trim()}
              className="w-full mt-1.5 text-[11px] font-semibold px-3 py-1.5 bg-brand text-white rounded-lg disabled:opacity-50"
            >
              Create
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

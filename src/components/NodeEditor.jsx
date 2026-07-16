import { useEffect, useState } from 'react'

const TYPES = [
  ['trigger', 'Trigger — starts the run'],
  ['action', 'Action — does the work'],
  ['decision', 'Decision — branches yes / no'],
  ['yes', 'Yes branch'],
  ['no', 'No branch'],
  ['mail', 'Email send'],
]

export default function NodeEditor({ node, onSave, onClose }) {
  const [form, setForm] = useState(node)
  useEffect(() => setForm(node), [node])

  useEffect(() => {
    const esc = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', esc)
    return () => window.removeEventListener('keydown', esc)
  }, [onClose])

  if (!form) return null
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  return (
    <div className="mask" onMouseDown={(e) => e.target.classList.contains('mask') && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-label="Edit node">
        <h3>Edit <span className="t">node.</span></h3>
        <p className="sub">Changes apply to this workflow immediately.</p>

        <div className="fld">
          <label className="kicker" htmlFor="f-label">Label</label>
          <textarea id="f-label" rows="2" value={form.label} onChange={set('label')} autoFocus />
        </div>

        <div className="fld">
          <label className="kicker" htmlFor="f-type">Node type</label>
          <select id="f-type" value={form.type} onChange={set('type')}>
            {TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>

        <div className="fld">
          <label className="kicker" htmlFor="f-note">Note — shown on hover</label>
          <input id="f-note" value={form.note || ''} onChange={set('note')} />
        </div>

        <div className="modal-f">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn pri" onClick={() => onSave(form)}>Save node</button>
        </div>
      </div>
    </div>
  )
}

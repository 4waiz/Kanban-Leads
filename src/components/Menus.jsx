import { useEffect, useRef } from 'react'

/** Closes on outside click or Escape. */
export function Pop({ children, onClose, className = '' }) {
  const ref = useRef(null)
  useEffect(() => {
    const away = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose() }
    const esc = (e) => e.key === 'Escape' && onClose()
    // defer so the click that opened this doesn't immediately close it
    const t = setTimeout(() => document.addEventListener('mousedown', away))
    window.addEventListener('keydown', esc)
    return () => { clearTimeout(t); document.removeEventListener('mousedown', away); window.removeEventListener('keydown', esc) }
  }, [onClose])
  return <div className={`pop ${className}`} ref={ref}>{children}</div>
}

export function NotificationsMenu({ items, onRead, onReadAll, onClose, onGo }) {
  const unread = items.filter((n) => n.unread).length
  return (
    <Pop onClose={onClose} className="pop-r">
      <div className="pop-h">
        <b>Notifications</b>
        <button className="link" onClick={onReadAll} disabled={!unread}>Mark all read</button>
      </div>
      <div className="pop-list">
        {items.length === 0 && <div className="empty">You're all caught up.</div>}
        {items.map((n) => (
          <button className={`pop-item${n.unread ? ' unread' : ''}`} key={n.id} onClick={() => onRead(n.id)}>
            <i className={`dotk k-${n.kind}`} />
            <div>
              <div className="pi-t">{n.title}</div>
              <div className="pi-s">{n.body}</div>
            </div>
            <span className="pi-time">{n.time}</span>
          </button>
        ))}
      </div>
      <div className="pop-f">
        <button className="link" onClick={() => { onGo('history'); onClose() }}>Open run history</button>
      </div>
    </Pop>
  )
}

export function InboxMenu({ items, onOpen, onClose, onGo }) {
  return (
    <Pop onClose={onClose} className="pop-r">
      <div className="pop-h"><b>Inbox</b><span className="kicker">{items.filter((m) => m.unread).length} unread</span></div>
      <div className="pop-list">
        {items.map((m) => (
          <button className={`pop-item${m.unread ? ' unread' : ''}`} key={m.id} onClick={() => onOpen(m)}>
            <div className="av-sm">{m.from.split(' ').map((w) => w[0]).slice(0, 2).join('')}</div>
            <div>
              <div className="pi-t">{m.from}</div>
              <div className="pi-s">{m.subject}</div>
              <div className="pi-s dim">{m.preview}</div>
            </div>
            <span className="pi-time">{m.time}</span>
          </button>
        ))}
      </div>
      <div className="pop-f">
        <button className="link" onClick={() => { onGo('outreach'); onClose() }}>Open outreach log</button>
      </div>
    </Pop>
  )
}

export function ProfileMenu({ onClose, onGo, say }) {
  const act = (label, fn) => (
    <button className="pop-row" onClick={() => { fn(); onClose() }}>{label}</button>
  )
  return (
    <Pop onClose={onClose} className="pop-r pop-sm">
      <div className="pop-user">
        <div className="avatar" style={{ width: 40, height: 40 }}>AA</div>
        <div>
          <div className="pi-t">Awaiz Ahmed</div>
          <div className="pi-s">awaiz.ahmed@kanbanstudios.com</div>
        </div>
      </div>
      <div className="pop-list">
        {act('Agent settings', () => onGo('settings'))}
        {act('Run history', () => onGo('history'))}
        {act('Billing & usage', () => say('Billing — 12,480 of 25,000 credits used'))}
        {act('Sign out', () => say('Signed out (demo)'))}
      </div>
    </Pop>
  )
}

export function WorkflowMenu({ workflows, current, onPick, onClose }) {
  return (
    <Pop onClose={onClose} className="pop-l pop-sm">
      <div className="pop-h"><b>Workflows</b></div>
      <div className="pop-list">
        {Object.entries(workflows).map(([k, w]) => (
          <button className={`pop-row${k === current ? ' on' : ''}`} key={k} onClick={() => onPick(k)}>
            <span>{w.name}</span>
            <span className="kicker">{w.nodes.length} nodes</span>
          </button>
        ))}
      </div>
    </Pop>
  )
}

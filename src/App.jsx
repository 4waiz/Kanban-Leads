import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import FlowCanvas from './components/FlowCanvas'
import NodeEditor from './components/NodeEditor'
import Confetti from './components/Confetti'
import { RevenueChart, BarChart, Donut } from './components/Charts'
import { InboxMenu, NotificationsMenu, ProfileMenu, WorkflowMenu } from './components/Menus'
import {
  EmailPage, HomePage, HistoryPage, LeadsPage, MetricsPage,
  OutreachPage, PipelinePage, SettingsPage,
} from './components/Pages'
import {
  ACTIVITY, EMAIL_BARS, LEADS, MESSAGES, METRICS, NOTIFICATIONS,
  REVENUE, SETTINGS, SOURCES, STAGES, TICKER, WORKFLOWS,
} from './data/seed'
import logo from './assets/ks-logo.png'

const money = (n) => {
  if (n >= 1e9) return '$' + +(n / 1e9).toFixed(1) + 'B'
  if (n >= 1e6) return '$' + +(n / 1e6).toFixed(0) + 'M'
  if (n >= 1e3) return '$' + Math.round(n / 1e3) + 'K'
  return '$' + n
}
const scoreClass = (s) => (s >= 80 ? 'hi' : s >= 70 ? 'md' : 'lo')

/* One icon set, drawn to a single spec: 24px grid, 4px padding, 1.7 stroke,
   round caps/joins, no fills. Consistency here is what makes a rail look built
   rather than assembled. */
function Icon({ name }) {
  const p = {
    home: <><path d="M4 10.5 12 4l8 6.5V19a1 1 0 0 1-1 1h-4.5v-5.5h-5V20H5a1 1 0 0 1-1-1z" /></>,
    grid: <><rect x="4" y="4" width="6.5" height="6.5" rx="1.5" /><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5" /><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5" /><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5" /></>,
    metrics: <><path d="M4 19.5h16" /><path d="M7.5 19.5V13" /><path d="M12 19.5V5.5" /><path d="M16.5 19.5V9.5" /></>,
    // two stacked chevron bars — the pipeline's own vernacular
    pipeline: <><path d="M4 4.5h11l3.5 3.5L15 11.5H4z" /><path d="M4 13h7.5l3.5 3.5L11.5 20H4z" /></>,
    email: <><rect x="4" y="5.5" width="16" height="13" rx="2" /><path d="m4.6 7 7.4 5.5L19.4 7" /></>,
    leads: <><circle cx="10" cy="8" r="3.5" /><path d="M4 19.5a6 6 0 0 1 12 0" /><path d="M17 11.5a3 3 0 0 0 0-5" /><path d="M19 19.5a5 5 0 0 0-2.5-4" /></>,
    history: <><circle cx="12" cy="12" r="8" /><path d="M12 7.5V12l3 2" /></>,
    outreach: <><path d="M4.5 11.5 20 5l-4 15-4-6.5z" /><path d="m12 13.5 8-8.5" /></>,
    // A real cog: toothed body + hub. The spoke-only version reads as a sun.
    // Drawn at 24 and scaled to sit inside the same 4→20 box as the rest.
    settings: (
      <g transform="translate(12 11.6) scale(.84) translate(-12 -12)" strokeWidth={1.7 / 0.84}>
        <path d="M12 3.6l1.9.9.9 2.1 2.2.5 1.6-1.6 1.9 1.9-1.6 1.6.5 2.2 2.1.9v2.6l-2.1.9-.5 2.2 1.6 1.6-1.9 1.9-1.6-1.6-2.2.5-.9 2.1h-2.6l-.9-2.1-2.2-.5-1.6 1.6-1.9-1.9 1.6-1.6-.5-2.2-2.1-.9v-2.6l2.1-.9.5-2.2L3.4 6.9 5.3 5l1.6 1.6 2.2-.5.9-2.1z" />
        <circle cx="12" cy="12" r="3.1" />
      </g>
    ),
    help: <><circle cx="12" cy="12" r="8" /><path d="M9.7 9.5a2.4 2.4 0 0 1 4.6.8c0 1.6-2.3 2.4-2.3 2.4" /><path d="M12 16.5h.01" /></>,
    out: <><path d="M9.5 20H5.5a1.5 1.5 0 0 1-1.5-1.5v-13A1.5 1.5 0 0 1 5.5 4h4" /><path d="m15.5 8.5 3.5 3.5-3.5 3.5" /><path d="M19 12H9.5" /></>,
    bell: <><path d="M17.5 9a5.5 5.5 0 1 0-11 0c0 5.5-2.5 7.5-2.5 7.5h16S17.5 14.5 17.5 9" /><path d="M13.7 20a2 2 0 0 1-3.4 0" /></>,
    expand: <><path d="M14.5 4H20v5.5" /><path d="M9.5 20H4v-5.5" /><path d="M20 4l-6.5 6.5" /><path d="M4 20l6.5-6.5" /></>,
    collapse: <><path d="M4 9.5h5.5V4" /><path d="M20 14.5h-5.5V20" /><path d="M9.5 9.5 4 4" /><path d="m14.5 14.5 5.5 5.5" /></>,
  }[name]
  return <svg viewBox="0 0 24 24">{p}</svg>
}

// '-' renders a divider: overview | the dashboard's panels | records
const RAIL = [
  ['home', 'Home'], ['grid', 'Dashboard'], '-',
  ['metrics', 'Metrics'], ['pipeline', 'Pipeline'], ['email', 'Email stats'], '-',
  ['leads', 'Leads'], ['history', 'History'], ['outreach', 'Outreach'], ['settings', 'Settings'],
]
const TITLES = {
  home: 'Home', grid: 'Kanban AI Leads', metrics: 'Metrics', pipeline: 'Pipeline',
  email: 'Email Stats', leads: 'Leads', history: 'History',
  outreach: 'Outreach', settings: 'Settings',
}

export default function App() {
  const [wfKey, setWfKey] = useState('scout')
  const [wf, setWf] = useState(() => structuredClone(WORKFLOWS))
  const [selected, setSelected] = useState(null)
  const [editing, setEditing] = useState(null)
  const [running, setRunning] = useState({ nodes: new Set(), edges: new Set(), done: new Set(), active: false })
  const [isRunning, setIsRunning] = useState(false)

  const [metrics, setMetrics] = useState(METRICS)
  const [stages, setStages] = useState(STAGES)
  const [sources, setSources] = useState(SOURCES)
  const [revenue, setRevenue] = useState(REVENUE)
  const [feed, setFeed] = useState(ACTIVITY)
  const [openRate, setOpenRate] = useState(47.2)
  const [query, setQuery] = useState('')
  const [activeStage, setActiveStage] = useState(null)
  const [sortKey, setSortKey] = useState('score')
  const [sortDir, setSortDir] = useState(-1)
  const [nav, setNav] = useState('grid')
  const [toast, setToast] = useState('')

  const [notes, setNotes] = useState(NOTIFICATIONS)
  const [mail, setMail] = useState(MESSAGES)
  const [menu, setMenu] = useState(null) // 'notes' | 'mail' | 'profile' | 'wf'
  const [zoomed, setZoomed] = useState(false)
  const flowRef = useRef(null)

  // run choreography: which panel is flashing, and the lead being processed
  const [flash, setFlash] = useState({})
  const [runLead, setRunLead] = useState(null)
  const runIdx = useRef(0)
  const [settings, setSettings] = useState(SETTINGS)
  const [confetti, setConfetti] = useState(null) // {key, origin} — fires the burst
  const [runStep, setRunStep] = useState(0)
  const [runDone, setRunDone] = useState(null)   // the completion card

  const toastTimer = useRef(null)
  const say = useCallback((m) => {
    setToast(m)
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(''), 2100)
  }, [])
  useEffect(() => () => clearTimeout(toastTimer.current), [])

  const go = useCallback((k) => { setNav(k); setMenu(null) }, [])

  /* Fullscreen the workflow card. Uses the real Fullscreen API where allowed and
     falls back to a fixed overlay, so it still works if the browser refuses. */
  const toggleZoom = useCallback(() => {
    const el = flowRef.current
    setMenu(null)
    if (!document.fullscreenElement) {
      setZoomed(true)
      el?.requestFullscreen?.().catch(() => {}) // overlay covers us if this fails
    } else {
      document.exitFullscreen?.().catch(() => {})
      setZoomed(false)
    }
  }, [])

  // Escape / F11 / the browser's own exit must not leave us stuck in the overlay.
  useEffect(() => {
    const sync = () => { if (!document.fullscreenElement) setZoomed(false) }
    document.addEventListener('fullscreenchange', sync)
    return () => document.removeEventListener('fullscreenchange', sync)
  }, [])

  useEffect(() => {
    if (!zoomed) return
    const esc = (e) => {
      if (e.key !== 'Escape') return
      // Native fullscreen consumes Escape itself; this covers the fallback overlay.
      setZoomed(false)
      if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {})
    }
    window.addEventListener('keydown', esc)
    return () => window.removeEventListener('keydown', esc)
  }, [zoomed])

  // The canvas auto-fits on resize; nudge it after the box changes size.
  useEffect(() => {
    const t = setTimeout(() => window.dispatchEvent(new Event('resize')), 90)
    return () => clearTimeout(t)
  }, [zoomed])

  const current = wf[wfKey]
  const nodes = current.nodes
  const edges = current.edges

  const patch = useCallback((fn) => {
    setWf((prev) => {
      const next = { ...prev, [wfKey]: { ...prev[wfKey] } }
      fn(next[wfKey])
      return next
    })
  }, [wfKey])

  /* ---------- node ops ---------- */
  const moveNode = useCallback((id, x, y) => {
    patch((w) => { w.nodes = w.nodes.map((n) => (n.id === id ? { ...n, x, y } : n)) })
  }, [patch])

  const connect = useCallback((pair) => {
    patch((w) => {
      if (w.edges.some(([a, b]) => a === pair[0] && b === pair[1])) return
      w.edges = [...w.edges, pair]
    })
    say('Nodes connected')
  }, [patch, say])

  const disconnect = useCallback((i) => {
    patch((w) => { w.edges = w.edges.filter((_, j) => j !== i) })
    say('Connection removed')
  }, [patch, say])

  const addNode = () => {
    const id = 'x' + Math.random().toString(36).slice(2, 8)
    patch((w) => {
      w.nodes = [...w.nodes, { id, type: 'action', x: 120 + Math.random() * 70, y: 60 + Math.random() * 70, label: 'New Step', note: '' }]
    })
    setSelected(id)
    setEditing(id)
  }

  const duplicate = () => {
    if (!selected) return say('Select a node first')
    const n = nodes.find((x) => x.id === selected)
    const id = 'x' + Math.random().toString(36).slice(2, 8)
    patch((w) => { w.nodes = [...w.nodes, { ...n, id, x: n.x + 30, y: n.y + 30 }] })
    setSelected(id)
    say('Node duplicated')
  }

  const removeNode = useCallback(() => {
    if (!selected) return say('Select a node first')
    patch((w) => {
      w.nodes = w.nodes.filter((n) => n.id !== selected)
      w.edges = w.edges.filter(([a, b]) => a !== selected && b !== selected)
    })
    setSelected(null)
    say('Node deleted')
  }, [selected, patch, say])

  const saveNode = (form) => {
    patch((w) => { w.nodes = w.nodes.map((n) => (n.id === form.id ? form : n)) })
    setEditing(null)
    say('Node saved')
  }

  useEffect(() => {
    const onKey = (e) => {
      if (/INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return
      if ((e.key === 'Delete' || e.key === 'Backspace') && selected && nav === 'grid') { e.preventDefault(); removeNode() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selected, removeNode, nav])

  /* ---------- run ---------- */
  const bumpMetrics = () => {
    setMetrics((m) => m.map((x) =>
      x.id === 'leads' ? { ...x, value: x.value + 2 + Math.floor(Math.random() * 6) }
        : x.id === 'conv' ? { ...x, value: x.value + Math.floor(Math.random() * 3) }
          : { ...x, value: x.value + Math.floor(Math.random() * 9000) }))
  }

  /* Each node type reports what it did, so a run reads like the agent working:
     the canvas walks, and every panel reacts as its step lands. */
  const STEP_FX = {
    trigger: (lead) => ({
      feed: { head: `${lead.company} — award detected`, sub: lead.project, color: '#FBBF24' },
      flash: 'metrics', metric: { id: 'leads', by: 1 }, stage: 0,
    }),
    action: (lead, label) => {
      const l = (label || '').toLowerCase()
      if (l.includes('extract')) return { feed: { head: 'Entities extracted', sub: `${money(lead.value)} · ${lead.staff} staff · ${lead.start}`, color: '#38BDF8' }, flash: 'metrics' }
      if (l.includes('cv') || l.includes('intro')) return {
        feed: { head: `CVs sent to ${lead.company}`, sub: `${settings.cvsPerEmail} vetted profiles attached`, color: '#34D399' },
        // our pipeline value is the staffing fee, not the client's contract value
        flash: 'email', metric: { id: 'pipe', by: lead.staff * 1800 }, stage: 2, rate: +1.4,
      }
      if (l.includes('nurture') || l.includes('watchlist')) return { feed: { head: `${lead.company} added to watchlist`, sub: 'Re-check in 30 days', color: '#C084FC' }, flash: 'pipe', stage: 1 }
      return { feed: { head: label, sub: lead.company, color: '#38BDF8' }, flash: 'metrics' }
    },
    decision: (lead) => ({
      feed: { head: `Scored ${lead.score} — ${lead.score >= 70 ? 'qualified' : 'below threshold'}`, sub: `${lead.company} · threshold ${settings.scoreThreshold}`, color: lead.score >= 70 ? '#34D399' : '#F87171' },
      flash: 'metrics', metric: lead.score >= 70 ? { id: 'conv', by: 1 } : null, stage: 1,
    }),
    yes: () => ({ flash: 'pipe', stage: 2 }),
    no: () => ({ flash: 'pipe' }),
    mail: (lead) => ({
      feed: { head: `Logged to CRM — ${lead.company}`, sub: 'Follow-up task created', color: '#E5326B' },
      flash: 'email', stage: 4, rate: +0.6,
    }),
  }

  const runFlow = async () => {
    if (isRunning) return
    setIsRunning(true)
    setRunLead(null)
    setRunDone(null)
    setRunStep(0)

    // pick a fresh lead for this run so the numbers tell a story
    const lead = LEADS[runIdx.current++ % LEADS.length]
    setRunLead(lead)
    say(`Scouting — ${lead.company}`)

    const starts = nodes.filter((n) => !edges.some(([, b]) => b === n.id)).map((n) => n.id)
    const seen = new Set()
    let layer = starts
    let step = 0

    while (layer.length) {
      const liveEdges = new Set()
      layer.forEach((id) => {
        seen.add(id)
        edges.filter(([a]) => a === id).forEach(([a, b]) => liveEdges.add(`${a}>${b}`))
      })
      setRunning({ nodes: new Set(layer), edges: liveEdges, done: new Set(seen), active: true })
      setRunStep(++step)

      // fire this layer's side effects across the dashboard
      layer.forEach((id) => {
        const n = nodes.find((x) => x.id === id)
        if (!n) return
        const fx = STEP_FX[n.type]?.(lead, n.label)
        if (!fx) return
        if (fx.feed) setFeed((f) => [{ ...fx.feed, time: 'just now' }, ...f].slice(0, 14))
        if (fx.flash) setFlash((s) => ({ ...s, [fx.flash]: true }))
        if (fx.metric) {
          setMetrics((m) => m.map((x) => (x.id === fx.metric.id ? { ...x, value: Math.round(x.value + fx.metric.by) } : x)))
        }
        if (fx.stage != null) {
          // money stages grow by the staffing fee; count stages by one lead
          const fee = lead.staff * 1800
          setStages((all) => all.map((s, i) => (i === fx.stage ? { ...s, value: s.value + (s.money ? fee : 1) } : s)))
          setActiveStage(fx.stage)
        }
        if (fx.rate) setOpenRate((r) => Math.min(99, +(r + fx.rate).toFixed(1)))
        if (fx.flash) setTimeout(() => setFlash((s) => ({ ...s, [fx.flash]: false })), 620)
      })

      // revenue creeps up as the run progresses
      setRevenue((r) => r.map((v, i) => (i === r.length - 1 ? Math.min(99, v + 1.2) : v)))

      await new Promise((res) => setTimeout(res, 620))
      const next = [...new Set(edges.filter(([a]) => layer.includes(a)).map(([, b]) => b))].filter((id) => !seen.has(id))

      // The last layer is the payoff: burst confetti from the final node itself.
      if (!next.length) {
        const last = layer[layer.length - 1]
        const el = document.querySelector(`.node[data-id="${last}"]`)
        if (el) {
          const r = el.getBoundingClientRect()
          setConfetti({ key: Date.now(), origin: { x: r.left + r.width / 2, y: r.top + r.height / 2 } })
        }
      }
      layer = next
    }

    setRunning({ nodes: new Set(), edges: new Set(), done: new Set(), active: false })
    setIsRunning(false)
    setFeed((f) => [{ head: `Run complete — ${current.name}`, sub: `${seen.size} steps · ${lead.company} · 0 errors`, time: 'just now', color: '#34D399' }, ...f].slice(0, 14))

    // a short-lived summary card, so the run ends on a result rather than silence
    setRunDone({
      company: lead.company,
      steps: seen.size,
      fee: lead.staff * 1800,
      staff: lead.staff,
      qualified: lead.score >= settings.scoreThreshold,
      score: lead.score,
    })
    setTimeout(() => { setActiveStage(null); setRunLead(null); setRunStep(0) }, 2400)
    setTimeout(() => setRunDone(null), 5200)
  }

  /* ---------- live ticker ---------- */
  const tick = useRef(0)
  useEffect(() => {
    const t = setInterval(() => {
      if (query) return
      const item = TICKER[tick.current++ % TICKER.length]
      setFeed((f) => [{ ...item, time: 'just now' }, ...f].slice(0, 14))
      bumpMetrics()
    }, 9000)
    return () => clearInterval(t)
  }, [query])

  /* ---------- edit values ---------- */
  const editMetric = (m) => {
    const v = prompt(`${m.label} — new value`, m.value)
    if (v !== null && v.trim() !== '' && !isNaN(+v)) {
      setMetrics((all) => all.map((x) => (x.id === m.id ? { ...x, value: +v } : x)))
      say(`${m.label} updated`)
    }
  }
  const editStage = (i) => {
    setActiveStage(i)
    const s = stages[i]
    const v = prompt(`${s.name} — ${s.label}`, s.value)
    if (v !== null && v.trim() !== '' && !isNaN(+v)) {
      setStages((all) => all.map((x, j) => (j === i ? { ...x, value: +v } : x)))
      say(`${s.name} updated`)
    }
  }
  const addStage = () => {
    const n = prompt('New pipeline stage name')
    if (!n) return
    setStages((all) => [...all.slice(0, -1), { name: n, color: '#0EA5E9', value: 0, label: 'New Stage' }, all.at(-1)])
    say('Stage added')
  }
  const editOpenRate = () => {
    const v = prompt('Open rate (%)', openRate)
    if (v !== null && v.trim() !== '' && !isNaN(+v)) { setOpenRate(+v); say('Open rate updated') }
  }
  const shuffleRevenue = () => {
    setRevenue((r) => r.map((v) => Math.max(12, Math.min(96, Math.round(v + (Math.random() * 30 - 13))))))
    say('Revenue data refreshed')
  }
  const renameWorkflow = () => {
    const v = prompt('Workflow title', current.title)
    if (v) { patch((w) => { w.title = v }); say('Renamed') }
  }

  /* ---------- derived ---------- */
  const shownFeed = useMemo(() => {
    if (!query) return feed
    const q = query.toLowerCase()
    return feed.filter((f) => (f.head + ' ' + (f.sub || '')).toLowerCase().includes(q))
  }, [feed, query])

  const shownLeads = useMemo(() => {
    const q = query.toLowerCase()
    const rows = q ? LEADS.filter((l) => (l.company + ' ' + l.project + ' ' + l.status).toLowerCase().includes(q)) : LEADS
    return [...rows].sort((a, b) => {
      const x = a[sortKey], y = b[sortKey]
      return (typeof x === 'number' ? x - y : String(x).localeCompare(String(y))) * sortDir
    })
  }, [query, sortKey, sortDir])

  const sortBy = (k) => {
    if (k === sortKey) setSortDir((d) => -d)
    else { setSortKey(k); setSortDir(-1) }
  }

  const editingNode = editing ? nodes.find((n) => n.id === editing) : null
  const unread = notes.filter((n) => n.unread).length
  const unreadMail = mail.filter((m) => m.unread).length

  return (
    <div className="shell">
      <nav className="rail">
        <img className="rail-logo" src={logo} alt="Kanban Studios" />
        {RAIL.map((item, i) => (
          item === '-'
            ? <span className="rail-div" key={`d${i}`} />
            : (
              <button key={item[0]} className={`ico${nav === item[0] ? ' on' : ''}`}
                data-tip={item[1]} onClick={() => go(item[0])} aria-label={item[1]}>
                <Icon name={item[0]} />
              </button>
            )
        ))}
        <div className="rail-sp" />
        <button className="ico" data-tip="Help" onClick={() => say('Docs — help@kanbanstudios.com')} aria-label="Help"><Icon name="help" /></button>
        <button className="ico" data-tip="Sign out" onClick={() => say('Signed out (demo)')} aria-label="Sign out"><Icon name="out" /></button>
      </nav>

      <main className="main">
        <header className="top">
          <div className="brand">
            {nav === 'grid'
              ? <>Kanban AI <span className="t">Leads</span></>
              : <>{TITLES[nav]}</>}
            <span className="kicker sub">Kanban Studios · Award Scout</span>
          </div>

          <div className="search">
            <svg className="mag" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search leads, projects, companies…" aria-label="Search" />
          </div>

          <div className="tools">
            <div className="anchor">
              <button className={`ico bell${menu === 'notes' ? ' on' : ''}`} data-tip="Notifications"
                onClick={() => setMenu(menu === 'notes' ? null : 'notes')} aria-label="Notifications">
                <Icon name="bell" />
                {unread > 0 && <span className="dot tnum">{unread}</span>}
              </button>
              {menu === 'notes' && (
                <NotificationsMenu
                  items={notes} onGo={go} onClose={() => setMenu(null)}
                  onRead={(id) => { setNotes((n) => n.map((x) => (x.id === id ? { ...x, unread: false } : x))); say('Marked read') }}
                  onReadAll={() => { setNotes((n) => n.map((x) => ({ ...x, unread: false }))); say('All notifications read') }}
                />
              )}
            </div>

            <div className="anchor">
              <button className={`ico${menu === 'mail' ? ' on' : ''}`} data-tip="Inbox"
                onClick={() => setMenu(menu === 'mail' ? null : 'mail')} aria-label="Inbox">
                <Icon name="email" />
                {unreadMail > 0 && <span className="dot tnum">{unreadMail}</span>}
              </button>
              {menu === 'mail' && (
                <InboxMenu items={mail} onGo={go} onClose={() => setMenu(null)}
                  onOpen={(m) => { setMail((all) => all.map((x) => (x.id === m.id ? { ...x, unread: false } : x))); say(`Opened — ${m.from}`) }}
                />
              )}
            </div>

            <div className="anchor">
              <div className="avatar" title="Awaiz Ahmed" role="button" tabIndex={0}
                onClick={() => setMenu(menu === 'profile' ? null : 'profile')}
                onKeyDown={(e) => e.key === 'Enter' && setMenu(menu === 'profile' ? null : 'profile')}>AA</div>
              {menu === 'profile' && <ProfileMenu onClose={() => setMenu(null)} onGo={go} say={say} />}
            </div>
          </div>
        </header>

        {nav === 'home' && <HomePage metrics={metrics} onGo={go} say={say} />}
        {nav === 'metrics' && <MetricsPage metrics={metrics} onChange={setMetrics} revenue={revenue} onRevenue={setRevenue} say={say} />}
        {nav === 'pipeline' && <PipelinePage stages={stages} onChange={setStages} say={say} />}
        {nav === 'email' && <EmailPage sources={sources} onSources={setSources} openRate={openRate} onOpenRate={setOpenRate} say={say} />}
        {nav === 'leads' && <LeadsPage say={say} />}
        {nav === 'history' && <HistoryPage say={say} />}
        {nav === 'outreach' && <OutreachPage say={say} />}
        {nav === 'settings' && <SettingsPage say={say} settings={settings} onChange={setSettings} />}

        {nav === 'grid' && (
          <div className="grid">
            {/* ---- workflow ---- */}
            <section className={`card flow-wrap${zoomed ? ' zoomed' : ''}`} ref={flowRef}>
              <div className="card-h">
                <h2 className="card-t" onDoubleClick={renameWorkflow} title="Double-click to rename">
                  {current.title.split(' ').slice(0, -1).join(' ')}{' '}
                  <span className="t">{current.title.split(' ').slice(-1)}</span>
                  {runLead && (
                    <span className="run-badge">
                      <i />
                      Scouting {runLead.company}
                      {isRunning && <b className="tnum">step {runStep}</b>}
                    </span>
                  )}
                </h2>
                <div className="hdr-tools">
                  <div className="anchor">
                    <button className="chip" onClick={() => setMenu(menu === 'wf' ? null : 'wf')}>
                      {current.name} ▾
                    </button>
                    {menu === 'wf' && (
                      <WorkflowMenu workflows={wf} current={wfKey} onClose={() => setMenu(null)}
                        onPick={(k) => { setWfKey(k); setSelected(null); setMenu(null); say('Loaded: ' + wf[k].name) }} />
                    )}
                  </div>
                  <button className="icon-btn" onClick={toggleZoom}
                    title={zoomed ? 'Exit fullscreen (Esc)' : 'Fullscreen'}
                    aria-label={zoomed ? 'Exit fullscreen' : 'Fullscreen'}>
                    <Icon name={zoomed ? 'collapse' : 'expand'} />
                  </button>
                </div>
              </div>
              <div className="card-rule" />
              <FlowCanvas
                nodes={nodes} edges={edges} selected={selected} running={running}
                onSelect={setSelected} onMove={moveNode} onConnect={connect}
                onDisconnect={disconnect} onEdit={setEditing}
              />
              <div className="flow-bar">
                <button className="btn pri" onClick={runFlow} disabled={isRunning}>{isRunning ? '● Running…' : '▶ Run'}</button>
                <button className="btn" onClick={addNode}>+ Node</button>
                <button className="btn" onClick={duplicate}>Duplicate</button>
                <button className="btn dz" onClick={removeNode}>Delete</button>
                <button className="btn" onClick={() => { window.dispatchEvent(new Event('flow:reset')); say('View reset') }}>Reset view</button>
                <span className="hint">Drag to move · drag a teal port to connect · double-click to edit · click a wire to cut</span>
              </div>
            </section>

            {/* ---- metrics ---- */}
            <section className={`card metrics-card${flash.metrics ? ' lit' : ''}`}>
              <div className="card-h"><h2 className="card-t">Leads <span className="t">Metrics</span></h2></div>
              <div className="card-rule" />
              <div className="metrics">
                {metrics.map((m) => (
                  <div key={m.id} className="metric" onClick={() => editMetric(m)} title="Click to edit">
                    <b className="tnum">{m.money ? money(m.value) : m.value.toLocaleString()}</b>
                    <span className="lab">{m.label}</span>
                    <div className={`trend${m.delta < 0 ? ' dn' : ''}`}>{m.delta < 0 ? '▼' : '▲'} {Math.abs(m.delta)}%</div>
                  </div>
                ))}
              </div>
            </section>

            {/* ---- right stack ---- */}
            <div className="side-stack">
              <section className="card">
                <div className="card-h">
                  <h2 className="card-t">Revenue <span className="t">Q3</span></h2>
                  <button className="dots" onClick={shuffleRevenue} title="Refresh data">•••</button>
                </div>
                <div className="card-rule" />
                <div className="chart-box"><RevenueChart data={revenue} /></div>
              </section>

              <section className="card">
                <div className="card-h">
                  <div className="act-hd">
                    <div className="av">AF</div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700 }}>Activity Feed</div>
                      <div className="kicker">Live · agent scouting</div>
                    </div>
                  </div>
                  <button className="dots" onClick={() => { setFeed([]); say('Feed cleared') }} title="Clear feed">•••</button>
                </div>
                <div className="card-rule" />
                <div className="feed">
                  {shownFeed.length === 0
                    ? <div className="empty">{query ? `No activity matches “${query}”.` : 'No activity yet.'}</div>
                    : shownFeed.map((f, i) => (
                      <div className="act" key={i}>
                        <i style={{ background: f.color }} />
                        <div>
                          <div>{f.head}</div>
                          {f.sub && <div className="sub">{f.sub}</div>}
                        </div>
                        <div className="t-ago">{f.time}</div>
                      </div>
                    ))}
                </div>
              </section>
            </div>

            {/* ---- pipeline + awards ---- */}
            <section className={`card pipe-card${flash.pipe ? ' lit' : ''}`}>
              <div className="card-h">
                <h2 className="card-t">Sales <span className="t">Pipeline</span></h2>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span className="kicker">{shownLeads.length} / {LEADS.length} awards</span>
                  <button className="chip" onClick={addStage}>+ Stage</button>
                </div>
              </div>
              <div className="card-rule" />
              <div className="pipe">
                {stages.map((s, i) => (
                  <div key={s.name + i}
                    className={`stage${activeStage === i ? ' on' : ''}${isRunning && activeStage === i ? ' hot' : ''}`}
                    style={{ background: `linear-gradient(135deg, ${s.color}, ${s.color}bb)` }}
                    onClick={() => editStage(i)}>{s.name}</div>
                ))}
              </div>
              <div className="stats" style={{ gridTemplateColumns: `repeat(${stages.length}, 1fr)` }}>
                {stages.map((s, i) => (
                  <div className="st" key={s.name + i}>
                    <b className="tnum">{s.money ? money(s.value) : s.value.toLocaleString()}</b>
                    <span className="kicker">{s.label}</span>
                  </div>
                ))}
              </div>
              <div className="card-rule" />
              <div className="tbl-wrap">
                <table>
                  <thead>
                    <tr>
                      {[['company', 'Client'], ['project', 'Project'], ['value', 'Contract'], ['staff', 'Staff'], ['score', 'Score'], ['start', 'Start'], ['status', 'Status']]
                        .map(([k, l]) => <th key={k} onClick={() => sortBy(k)}>{l}{sortKey === k ? (sortDir > 0 ? ' ↑' : ' ↓') : ''}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {shownLeads.map((l) => (
                      <tr key={l.company + l.project}>
                        <td className="co">{l.company}</td>
                        <td className="pr">{l.project}</td>
                        <td className="tnum">{money(l.value)}</td>
                        <td className="tnum">{l.staff}</td>
                        <td><span className={`score ${scoreClass(l.score)}`}>{l.score}</span></td>
                        <td className="tnum">{l.start}</td>
                        <td><span className="pill">{l.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {shownLeads.length === 0 && <div className="empty">No awards match “{query}”.</div>}
              </div>
            </section>

            {/* ---- email ---- */}
            <section className={`card email-card${flash.email ? ' lit' : ''}`}>
              <div className="card-h">
                <h2 className="card-t">Email <span className="t">Stats</span></h2>
                <button className="dots" onClick={editOpenRate} title="Edit open rate">•••</button>
              </div>
              <div className="card-rule" />
              <div style={{ fontSize: 12, color: 'var(--ink-2)', marginBottom: 6, flex: 'none' }}>
                Open Rate: <b className="tnum">{openRate.toFixed(1)}%</b>
              </div>
              <div className="chart-box"><BarChart data={EMAIL_BARS} /></div>
              <div className="card-rule" />
              <div className="donut-row">
                <Donut sources={sources} />
                <div className="legend">
                  {sources.map((s, i) => (
                    <div key={s.name} className={`lg${s.on ? '' : ' off'}`} title={`${s.name} — click to toggle`}
                      onClick={() => {
                        setSources((all) => all.map((x, j) => (j === i ? { ...x, on: !x.on } : x)))
                        say(`${s.name} ${s.on ? 'hidden' : 'shown'}`)
                      }}>
                      <i style={{ background: s.color }} />
                      <span className="nm">{s.name}</span>
                      <b className="tnum">{s.value}%</b>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </div>
        )}
      </main>

      {editingNode && <NodeEditor node={editingNode} onSave={saveNode} onClose={() => setEditing(null)} />}

      <Confetti key={confetti?.key} fire={!!confetti} origin={confetti?.origin} />

      {runDone && (
        <div className="done-card" role="status">
          <span className="done-tick">✓</span>
          <div className="done-txt">
            <b>{runDone.company} {runDone.qualified ? 'qualified' : 'watchlisted'}</b>
            <span>
              {runDone.steps} steps · scored {runDone.score} · {runDone.staff} roles
              {runDone.qualified && <> · <b className="t">{money(runDone.fee)}</b> in fees</>}
            </span>
          </div>
          <button className="done-x" onClick={() => setRunDone(null)} aria-label="Dismiss">×</button>
        </div>
      )}

      <div className={`toast${toast ? ' on' : ''}`}>{toast}</div>
    </div>
  )
}

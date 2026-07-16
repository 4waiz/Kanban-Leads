import { useState } from 'react'
import { RevenueChart, BarChart, Donut } from './Charts'
import { EMAIL_BARS, LEADS, MONTHS, OUTREACH, RUN_HISTORY, SECTORS, SETTINGS } from '../data/seed'

const money = (n) => {
  if (n >= 1e9) return '$' + +(n / 1e9).toFixed(1) + 'B'
  if (n >= 1e6) return '$' + +(n / 1e6).toFixed(0) + 'M'
  if (n >= 1e3) return '$' + Math.round(n / 1e3) + 'K'
  return '$' + n
}
const scoreClass = (s) => (s >= 80 ? 'hi' : s >= 70 ? 'md' : 'lo')

/* Placement fee per head — the number this business actually earns,
   as opposed to the client's contract value. */
const FEE_PER_HEAD = 1800
const STATUS_MARK = { success: '✓', partial: '!', failed: '✕' }

// Two letters always: initials of the first two words, or the first two
// letters when the name is a single word ("ADNOC" -> "AD", not "A").
const initials = (s) => {
  const w = s.replace(/[^A-Za-z ]/g, '').split(' ').filter(Boolean)
  return (w.length > 1 ? w[0][0] + w[1][0] : (w[0] || '?').slice(0, 2)).toUpperCase()
}
// A stable hue per client, so the same company always wears the same colour.
const hueOf = (s) => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) % 360, 7)

function ScoreRing({ score }) {
  const R = 17
  const C = 2 * Math.PI * R
  const pct = Math.min(100, score) / 100
  const tone = score >= 80 ? 'var(--good)' : score >= 70 ? 'var(--warn)' : 'var(--crit)'
  return (
    <div className="ring" title={`Score ${score}`}>
      <svg viewBox="0 0 44 44">
        <circle cx="22" cy="22" r={R} className="ring-bg" />
        <circle cx="22" cy="22" r={R} className="ring-fg"
          style={{ stroke: tone, strokeDasharray: C, strokeDashoffset: C * (1 - pct) }} />
      </svg>
      <b className="tnum" style={{ color: tone }}>{score}</b>
    </div>
  )
}

/* ---------------- Home ---------------- */
function Spark({ data }) {
  const w = 132, h = 34
  const max = Math.max(...data) || 1
  const pts = data.map((v, i) => [
    (i / (data.length - 1)) * (w - 4) + 2,
    h - 3 - (v / max) * (h - 8),
  ])
  const d = pts.map(([x, y], i) => (i ? `L${x},${y}` : `M${x},${y}`)).join(' ')
  const end = pts.at(-1)
  return (
    <svg className="spark" viewBox={`0 0 ${w} ${h}`}>
      <path d={`${d} L${w - 2},${h} L2,${h} Z`} className="spark-fill" />
      <path d={d} className="spark-line" />
      <circle cx={end[0]} cy={end[1]} r="2.6" className="spark-dot" />
    </svg>
  )
}

export function HomePage({ metrics, onGo, say }) {
  const hot = [...LEADS].sort((a, b) => b.score - a.score).slice(0, 4)
  const heads = LEADS.reduce((a, b) => a + b.staff, 0)

  return (
    <div className="page">
      <section className="card hero">
        {/* a live status line makes the agent feel present, not archival */}
        <div className="hero-live">
          <span className="pulse-dot" />
          <span className="kicker">Agent running · last sweep 6 minutes ago</span>
        </div>

        <div className="hero-grid">
          <div>
            <p className="hero-greet">Good morning, <span className="t">Awaiz Ahmed</span></p>
            <h2 className="hero-h">Your agent found <span className="t">12 new awards.</span></h2>
            <p className="hero-p">
              Overnight the scout swept news feeds and tender portals across the UAE.
              Five leads cleared the threshold and are queued for outreach — worth
              roughly <b className="t">{money(heads * FEE_PER_HEAD)}</b> in placement fees.
            </p>
            <div className="hero-btns">
              <button className="btn pri" onClick={() => onGo('grid')}>Open dashboard</button>
              <button className="btn" onClick={() => onGo('leads')}>Review leads</button>
              <button className="btn" onClick={() => say('Digest sent to awaiz.ahmed@kanbanstudios.com')}>Email the digest</button>
            </div>
          </div>

          <div className="hero-side">
            {metrics.map((m) => (
              <button className="hs-row" key={m.id} onClick={() => onGo('metrics')}>
                <div className="hs-txt">
                  <span className="kicker">{m.label}</span>
                  <b className="tnum">{m.money ? money(m.value) : m.value.toLocaleString()}</b>
                </div>
                <Spark data={m.id === 'leads' ? [12, 18, 15, 24, 21, 30] : m.id === 'conv' ? [4, 7, 6, 9, 12, 14] : [20, 28, 25, 38, 44, 52]} />
                <span className={`trend${m.delta < 0 ? ' dn' : ''}`}>{m.delta < 0 ? '▼' : '▲'} {Math.abs(m.delta)}%</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="card grow snug">
        <div className="card-h">
          <h3 className="card-t">Today's <span className="t">best leads</span></h3>
          <button className="chip" onClick={() => onGo('leads')}>View all {LEADS.length}</button>
        </div>
        <div className="card-rule" />
        <div className="hot-grid">
          {hot.map((l, i) => {
            const hue = hueOf(l.company)
            return (
              <button className="hot-card" key={l.company} onClick={() => onGo('leads')}
                style={{ animationDelay: `${i * 55}ms` }}>
                <div className="hc-top">
                  <div className="lead-mark sm" style={{ background: `linear-gradient(150deg, hsl(${hue} 70% 58%), hsl(${(hue + 40) % 360} 65% 42%))` }}>
                    {initials(l.company)}
                  </div>
                  <ScoreRing score={l.score} />
                </div>
                <b className="hc-co">{l.company}</b>
                <span className="hc-pr">{l.project}</span>
                <div className="hc-foot">
                  <div><span className="kicker">Staff</span><b className="tnum">{l.staff}</b></div>
                  <div><span className="kicker">Fee</span><b className="tnum t">{money(l.staff * FEE_PER_HEAD)}</b></div>
                </div>
              </button>
            )
          })}
        </div>
      </section>

      <div className="duo grow">
        <section className="card">
          <div className="card-h">
            <h3 className="card-t">Today's <span className="t">runs</span></h3>
            <button className="chip" onClick={() => onGo('history')}>Full history</button>
          </div>
          <div className="card-rule" />
          <div className="run-strip">
            {RUN_HISTORY.slice(0, 3).map((r) => (
              <button className="rs" key={r.id} onClick={() => onGo('history')}>
                <span className={`tl-node s-${r.status}`}>{STATUS_MARK[r.status]}</span>
                <div className="rs-txt">
                  <b>{r.workflow}</b>
                  <span>{r.started} · {r.found} found · {r.outreach} contacted</span>
                </div>
                <span className="rs-dur tnum">{(r.ms / 1000).toFixed(1)}s</span>
              </button>
            ))}
          </div>
        </section>

        <section className="card">
          <div className="card-h">
            <h3 className="card-t">Awaiting <span className="t">your reply</span></h3>
            <button className="chip" onClick={() => onGo('outreach')}>Open inbox</button>
          </div>
          <div className="card-rule" />
          <div className="run-strip">
            {OUTREACH.filter((o) => o.replies > 0).map((o) => (
              <button className="rs" key={o.id} onClick={() => onGo('outreach')}>
                <div className="th-av sm" style={{ background: `linear-gradient(150deg, hsl(${hueOf(o.client)} 68% 56%), hsl(${(hueOf(o.client) + 40) % 360} 62% 40%))` }}>
                  {initials(o.client)}
                </div>
                <div className="rs-txt">
                  <b>{o.contact}</b>
                  <span>{o.client} · replied {o.sent}</span>
                </div>
                <span className="rep">↩ {o.replies}</span>
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}

/* ---------------- Leads ---------------- */
const SORTS = [
  ['score', 'Score'],
  ['value', 'Contract'],
  ['staff', 'Headcount'],
]

export function LeadsPage({ say }) {
  const [sector, setSector] = useState('all')
  const [min, setMin] = useState(0)
  const [sort, setSort] = useState('score')
  const [sent, setSent] = useState({})

  const rows = LEADS
    .filter((l) => (sector === 'all' || l.sector === sector) && l.score >= min)
    .sort((a, b) => b[sort] - a[sort])

  const qualified = rows.filter((l) => l.score >= 70).length
  const heads = rows.reduce((a, b) => a + b.staff, 0)
  const fees = heads * FEE_PER_HEAD

  return (
    <div className="page">
      {/* what the filtered set is worth */}
      <div className="quad">
        <div className="card mini-stat">
          <span className="kicker">Leads shown</span>
          <b className="tnum">{rows.length}</b>
          <span className="ms-sub">of {LEADS.length} detected</span>
        </div>
        <div className="card mini-stat">
          <span className="kicker">Qualified</span>
          <b className="tnum t">{qualified}</b>
          <span className="ms-sub">scored 70 or above</span>
        </div>
        <div className="card mini-stat">
          <span className="kicker">Headcount</span>
          <b className="tnum">{heads.toLocaleString()}</b>
          <span className="ms-sub">roles implied</span>
        </div>
        <div className="card mini-stat">
          <span className="kicker">Fee potential</span>
          <b className="tnum">{money(fees)}</b>
          <span className="ms-sub">at ${FEE_PER_HEAD.toLocaleString()} per head</span>
        </div>
      </div>

      <section className="card grow">
        <div className="card-h">
          <h3 className="card-t">All <span className="t">leads</span></h3>
          <div className="filters">
            <div className="seg" role="group" aria-label="Minimum score">
              {[[0, 'Any'], [70, '70+'], [80, '80+'], [90, '90+']].map(([v, l]) => (
                <button key={v} className={min === v ? 'on' : ''} onClick={() => setMin(v)}>{l}</button>
              ))}
            </div>
            <div className="seg" role="group" aria-label="Sort by">
              {SORTS.map(([k, l]) => (
                <button key={k} className={sort === k ? 'on' : ''} onClick={() => setSort(k)}>{l}</button>
              ))}
            </div>
          </div>
        </div>

        <div className="chip-row">
          <button className={`fchip${sector === 'all' ? ' on' : ''}`} onClick={() => setSector('all')}>
            All sectors
          </button>
          {SECTORS.map((s) => {
            const n = LEADS.filter((l) => l.sector === s.id).length
            return (
              <button key={s.id} className={`fchip${sector === s.id ? ' on' : ''}`} onClick={() => setSector(s.id)}>
                {s.name.split(' ')[0]} <b>{n}</b>
              </button>
            )
          })}
        </div>

        <div className="lead-list">
          {rows.map((l, i) => {
            const hue = hueOf(l.company)
            const done = sent[l.company]
            return (
              <article className={`lead${l.score >= 80 ? ' hot' : ''}`} key={l.company + l.project}
                style={{ animationDelay: `${Math.min(i, 8) * 45}ms` }}>
                <div className="lead-mark" style={{ background: `linear-gradient(150deg, hsl(${hue} 70% 58%), hsl(${(hue + 40) % 360} 65% 42%))` }}>
                  {initials(l.company)}
                </div>

                <div className="lead-id">
                  <div className="lead-co">
                    {l.company}
                    {l.score >= 80 && <span className="tag-hot">Hot</span>}
                  </div>
                  <div className="lead-pr">{l.project}</div>
                  <div className="lead-meta">
                    <span className="sect" style={{ '--h': hue }}>{SECTORS.find((s) => s.id === l.sector)?.name}</span>
                    <span className="dot-sep">·</span>
                    <span>Starts {l.start}</span>
                  </div>
                </div>

                <div className="lead-num">
                  <span className="kicker">Contract</span>
                  <b className="tnum">{money(l.value)}</b>
                </div>
                <div className="lead-num">
                  <span className="kicker">Staff</span>
                  <b className="tnum">{l.staff}</b>
                </div>
                <div className="lead-num">
                  <span className="kicker">Fee</span>
                  <b className="tnum t">{money(l.staff * FEE_PER_HEAD)}</b>
                </div>

                <ScoreRing score={l.score} />

                <div className="lead-act">
                  <span className={`pill st-${l.status.split(' ')[0].toLowerCase()}`}>{l.status}</span>
                  <button className={`mini${done ? ' done' : ''}`} disabled={done}
                    onClick={() => { setSent((s) => ({ ...s, [l.company]: true })); say(`CVs sent to ${l.company}`) }}>
                    {done ? '✓ Sent' : 'Send CVs'}
                  </button>
                </div>
              </article>
            )
          })}
          {rows.length === 0 && (
            <div className="empty-state">
              <b>No leads match these filters.</b>
              <span>Try a lower score or a different sector.</span>
              <button className="btn" onClick={() => { setSector('all'); setMin(0) }}>Clear filters</button>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

/* ---------------- History ---------------- */
export function HistoryPage({ say }) {
  const [filter, setFilter] = useState('all')
  const [open, setOpen] = useState(RUN_HISTORY[0]?.id ?? null)

  const runs = RUN_HISTORY.filter((r) => filter === 'all' || r.status === filter)
  const ok = RUN_HISTORY.filter((r) => r.status === 'success').length
  const rate = Math.round((ok / RUN_HISTORY.length) * 100)
  const found = RUN_HISTORY.reduce((a, b) => a + b.found, 0)
  const sent = RUN_HISTORY.reduce((a, b) => a + b.outreach, 0)
  const avg = (RUN_HISTORY.reduce((a, b) => a + b.ms, 0) / RUN_HISTORY.length / 1000).toFixed(1)
  const peak = Math.max(...RUN_HISTORY.map((r) => r.found)) || 1

  return (
    <div className="page">
      <div className="quad">
        <div className="card mini-stat">
          <span className="kicker">Success rate</span>
          <b className="tnum">{rate}%</b>
          <div className="bar"><i style={{ width: `${rate}%`, background: 'var(--good)' }} /></div>
        </div>
        <div className="card mini-stat">
          <span className="kicker">Awards found</span>
          <b className="tnum">{found}</b>
          <span className="ms-sub">across {RUN_HISTORY.length} runs</span>
        </div>
        <div className="card mini-stat">
          <span className="kicker">Outreach sent</span>
          <b className="tnum t">{sent}</b>
          <span className="ms-sub">{Math.round((sent / found) * 100)}% of finds</span>
        </div>
        <div className="card mini-stat">
          <span className="kicker">Avg duration</span>
          <b className="tnum">{avg}s</b>
          <span className="ms-sub">per run</span>
        </div>
      </div>

      <section className="card grow">
        <div className="card-h">
          <h3 className="card-t">Run <span className="t">history</span></h3>
          <div className="filters">
            <div className="seg" role="group" aria-label="Filter by status">
              {[['all', 'All'], ['success', 'Success'], ['partial', 'Partial'], ['failed', 'Failed']].map(([k, l]) => (
                <button key={k} className={filter === k ? 'on' : ''} onClick={() => setFilter(k)}>{l}</button>
              ))}
            </div>
            <button className="chip" onClick={() => say(`${runs.length} runs exported to CSV`)}>Export CSV</button>
          </div>
        </div>
        <div className="card-rule" />

        {/* a chronology reads better as a timeline than as rows */}
        <div className="tl">
          {runs.map((r, i) => (
            <article className={`tl-item s-${r.status}${open === r.id ? ' open' : ''}`} key={r.id}
              style={{ animationDelay: `${Math.min(i, 8) * 45}ms` }}>
              <div className="tl-rail">
                <span className={`tl-node s-${r.status}`}>{STATUS_MARK[r.status]}</span>
              </div>

              {/* a div, not a button — it contains buttons, and nesting them is invalid */}
              <div className="tl-body">
                <div className="tl-top" role="button" tabIndex={0} aria-expanded={open === r.id}
                  onClick={() => setOpen(open === r.id ? null : r.id)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpen(open === r.id ? null : r.id) } }}>
                  <b className="tl-wf">{r.workflow}</b>
                  <span className={`pill ${r.status}`}>{r.status}</span>
                  <span className="tl-when">{r.started}</span>
                  <span className={`caret${open === r.id ? ' up' : ''}`}>⌄</span>
                </div>

                <div className="tl-mid">
                  {/* how much of what it found became outreach */}
                  <div className="yield" title={`${r.found} found · ${r.outreach} contacted`}>
                    <i className="y-found" style={{ width: `${(r.found / peak) * 100}%` }} />
                    <i className="y-sent" style={{ width: `${(r.outreach / peak) * 100}%` }} />
                  </div>
                  <span className="tl-figs tnum">
                    <b>{r.found}</b> found <span className="dot-sep">·</span> <b className="t">{r.outreach}</b> contacted
                    <span className="dot-sep">·</span> {(r.ms / 1000).toFixed(1)}s
                  </span>
                </div>

                {open === r.id && (
                  <div className="tl-more">
                    <div className="kv"><span className="kicker">Steps run</span><b className="tnum">{r.steps} / 8</b></div>
                    <div className="kv"><span className="kicker">Awards found</span><b className="tnum">{r.found}</b></div>
                    <div className="kv"><span className="kicker">Outreach sent</span><b className="tnum">{r.outreach}</b></div>
                    <div className="kv"><span className="kicker">Duration</span><b className="tnum">{(r.ms / 1000).toFixed(1)}s</b></div>
                    {/* ~220 roles per contacted lead is this demo's working average */}
                    <div className="kv"><span className="kicker">Fee potential</span><b className="tnum t">{money(r.outreach * 220 * FEE_PER_HEAD)}</b></div>
                    <div className="tl-acts">
                      <button className="mini" onClick={() => say(`Re-running ${r.workflow}…`)}>Re-run</button>
                      <button className="mini" onClick={() => say('Log opened')}>View log</button>
                    </div>
                  </div>
                )}
              </div>
            </article>
          ))}
          {runs.length === 0 && (
            <div className="empty-state">
              <b>No {filter} runs.</b>
              <span>Every run of this agent is logged here.</span>
              <button className="btn" onClick={() => setFilter('all')}>Show all runs</button>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

/* ---------------- Outreach ---------------- */
const STATE_ORDER = { Sent: 0, Opened: 1, Replied: 2 }

export function OutreachPage({ say }) {
  const [rows, setRows] = useState(OUTREACH)
  const [filter, setFilter] = useState('all')
  const [sel, setSel] = useState(OUTREACH[1]?.id ?? null)

  const shown = rows.filter((o) => filter === 'all' || o.state.toLowerCase() === filter)
  const opened = rows.filter((o) => STATE_ORDER[o.state] >= 1).length
  const replied = rows.filter((o) => o.state === 'Replied').length
  const pct = (n) => Math.round((n / rows.length) * 100)
  const active = rows.find((o) => o.id === sel)

  return (
    <div className="page">
      {/* the funnel is the story: sent -> opened -> replied */}
      <section className="card funnel-card">
        <div className="fn">
          {[
            ['Sent', rows.length, 100, '#38BDF8'],
            ['Opened', opened, pct(opened), '#C084FC'],
            ['Replied', replied, pct(replied), '#34D399'],
          ].map(([label, n, p, c]) => (
            <div className="fn-step" key={label}>
              <div className="fn-h">
                <span className="kicker">{label}</span>
                <b className="tnum">{n}</b>
                <span className="fn-pct tnum" style={{ color: c }}>{p}%</span>
              </div>
              <div className="bar"><i style={{ width: `${p}%`, background: c }} /></div>
            </div>
          ))}
          <div className="fn-step fn-last">
            <div className="fn-h">
              <span className="kicker">Reply rate</span>
              <b className="tnum t">{pct(replied)}%</b>
            </div>
            <span className="ms-sub">industry average is 8–12%</span>
          </div>
        </div>
      </section>

      <div className="out-cols">
        {/* --- the thread list --- */}
        <section className="card">
          <div className="card-h">
            <h3 className="card-t">Outreach <span className="t">log</span></h3>
            <div className="seg" role="group" aria-label="Filter by state">
              {[['all', 'All'], ['replied', 'Replied'], ['opened', 'Opened'], ['sent', 'Sent']].map(([k, l]) => (
                <button key={k} className={filter === k ? 'on' : ''} onClick={() => setFilter(k)}>{l}</button>
              ))}
            </div>
          </div>
          <div className="card-rule" />

          <div className="thread-list">
            {shown.map((o, i) => {
              const hue = hueOf(o.client)
              return (
                <button className={`thread${sel === o.id ? ' on' : ''}`} key={o.id}
                  onClick={() => setSel(o.id)} style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}>
                  <div className="th-av" style={{ background: `linear-gradient(150deg, hsl(${hue} 68% 56%), hsl(${(hue + 40) % 360} 62% 40%))` }}>
                    {initials(o.client)}
                  </div>
                  <div className="th-mid">
                    <div className="th-top">
                      <b>{o.client}</b>
                      <span className="th-when">{o.sent}</span>
                    </div>
                    <div className="th-sub">{o.subject}</div>
                    <div className="th-foot">
                      <span className={`state s-${o.state.toLowerCase()}`}>{o.state}</span>
                      {/* one dot per open — read tracking at a glance */}
                      <span className="opens" title={`${o.opens} opens`}>
                        {Array.from({ length: Math.min(o.opens, 5) }).map((_, k) => <i key={k} />)}
                        {o.opens === 0 && <span className="no-open">not opened</span>}
                      </span>
                      {o.replies > 0 && <span className="rep">↩ {o.replies}</span>}
                    </div>
                  </div>
                </button>
              )
            })}
            {shown.length === 0 && (
              <div className="empty-state">
                <b>Nothing {filter} yet.</b>
                <span>Outreach lands here the moment the agent sends it.</span>
                <button className="btn" onClick={() => setFilter('all')}>Show all</button>
              </div>
            )}
          </div>
        </section>

        {/* --- the message itself --- */}
        <aside className="card msg">
          {active ? (
            <>
              <div className="card-h">
                <h3 className="card-t">{active.client}</h3>
                <span className={`state s-${active.state.toLowerCase()}`}>{active.state}</span>
              </div>
              <div className="card-rule" />
              <div className="msg-to">
                <div className="th-av sm" style={{ background: `linear-gradient(150deg, hsl(${hueOf(active.client)} 68% 56%), hsl(${(hueOf(active.client) + 40) % 360} 62% 40%))` }}>
                  {initials(active.client)}
                </div>
                <div>
                  <div className="pi-t">{active.contact}</div>
                  <div className="pi-s">Sent {active.sent} · {active.opens} opens</div>
                </div>
              </div>

              <div className="msg-body">
                <b className="msg-subj">{active.subject}</b>
                <p>Dear {active.contact.split(' ')[0]},</p>
                <p>
                  We saw the announcement on <b className="t">{active.subject.split('—')[0].trim()}</b> and
                  wanted to reach out early. We have <b>{SETTINGS.cvsPerEmail} vetted candidates</b> on the
                  bench who match the roles this project implies — all UAE-ready with valid visas.
                </p>
                <p>CVs are attached. Happy to arrange interviews this week if useful.</p>
                <p className="sig">Awaiz Ahmed<br /><span>Kanban Studios · Staffing</span></p>
              </div>

              {active.replies > 0 && (
                <div className="reply">
                  <span className="kicker">Reply received</span>
                  <p>“Thanks for the profiles — can we schedule interviews for the top 12 next week?”</p>
                </div>
              )}

              <div className="flow-bar">
                <button className="btn pri" onClick={() => say(`Follow-up queued for ${active.client}`)}>Follow up</button>
                <button className="btn" onClick={() => say('Thread archived')}>Archive</button>
              </div>
            </>
          ) : (
            <div className="empty-state"><b>Pick a thread</b><span>Select any message to read it.</span></div>
          )}
        </aside>
      </div>
    </div>
  )
}

/* ---------------- Metrics detail ---------------- */
export function MetricsPage({ metrics, onChange, revenue, onRevenue, say }) {
  const edit = (id, v) => onChange(metrics.map((m) => (m.id === id ? { ...m, value: +v || 0 } : m)))
  const editDelta = (id, v) => onChange(metrics.map((m) => (m.id === id ? { ...m, delta: +v || 0 } : m)))
  return (
    <div className="page">
      <div className="tri">
        {metrics.map((m) => (
          <section className="card stat-card" key={m.id}>
            <span className="kicker">{m.label}</span>
            <b className="tnum">{m.money ? money(m.value) : m.value.toLocaleString()}</b>
            <div className="edit-row">
              <div className="fld">
                <label className="kicker" htmlFor={`v-${m.id}`}>Value</label>
                <input id={`v-${m.id}`} type="number" value={m.value} onChange={(e) => edit(m.id, e.target.value)} />
              </div>
              <div className="fld">
                <label className="kicker" htmlFor={`d-${m.id}`}>Trend %</label>
                <input id={`d-${m.id}`} type="number" step="0.1" value={m.delta} onChange={(e) => editDelta(m.id, e.target.value)} />
              </div>
            </div>
            <span className={`trend${m.delta < 0 ? ' dn' : ''}`}>{m.delta < 0 ? '▼' : '▲'} {Math.abs(m.delta)}% this week</span>
          </section>
        ))}
      </div>

      <section className="card grow">
        <div className="card-h">
          <h3 className="card-t">Revenue <span className="t">by month</span></h3>
          <button className="chip" onClick={() => { onRevenue(revenue.map(() => 20 + Math.round(Math.random() * 70))); say('Revenue randomised') }}>Randomise</button>
        </div>
        <div className="card-rule" />
        <div className="chart-box"><RevenueChart data={revenue} /></div>
        <div className="card-rule" />
        <div className="slider-row">
          {revenue.map((v, i) => (
            <label className="slider" key={MONTHS[i]}>
              <span className="kicker">{MONTHS[i]}</span>
              <input type="range" min="0" max="100" value={v}
                onChange={(e) => onRevenue(revenue.map((x, j) => (j === i ? +e.target.value : x)))} />
              <b className="tnum">{Math.round(v)}K</b>
            </label>
          ))}
        </div>
      </section>
    </div>
  )
}

/* ---------------- Pipeline detail ---------------- */
export function PipelinePage({ stages, onChange, say }) {
  const [drag, setDrag] = useState(null)
  const set = (i, patch) => onChange(stages.map((s, j) => (j === i ? { ...s, ...patch } : s)))
  const remove = (i) => { onChange(stages.filter((_, j) => j !== i)); say('Stage removed') }
  const add = () => { onChange([...stages, { name: 'New Stage', color: '#0EA5E9', value: 0, label: 'Count' }]); say('Stage added') }

  const onDrop = (i) => {
    if (drag === null || drag === i) return
    const next = [...stages]
    const [m] = next.splice(drag, 1)
    next.splice(i, 0, m)
    onChange(next)
    setDrag(null)
    say('Stage reordered')
  }

  return (
    <div className="page">
      <section className="card">
        <div className="card-h">
          <h3 className="card-t">Pipeline <span className="t">preview</span></h3>
          <button className="chip" onClick={add}>+ Add stage</button>
        </div>
        <div className="card-rule" />
        <div className="pipe">
          {stages.map((s, i) => (
            <div key={i} className="stage" style={{ background: `linear-gradient(135deg, ${s.color}, ${s.color}bb)` }}>{s.name}</div>
          ))}
        </div>
        <div className="stats" style={{ gridTemplateColumns: `repeat(${stages.length}, 1fr)` }}>
          {stages.map((s, i) => (
            <div className="st" key={i}>
              <b className="tnum">{s.money ? money(s.value) : s.value.toLocaleString()}</b>
              <span className="kicker">{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="card grow snug">
        <div className="card-h"><h3 className="card-t">Edit <span className="t">stages</span></h3>
          <span className="kicker">Drag rows to reorder</span></div>
        <div className="card-rule" />
        <div className="tbl-wrap">
          <table>
            <thead><tr><th></th><th>Name</th><th>Caption</th><th>Value</th><th>Colour</th><th>Money</th><th></th></tr></thead>
            <tbody>
              {stages.map((s, i) => (
                <tr key={i} draggable className={drag === i ? 'dragging-row' : ''}
                  onDragStart={() => setDrag(i)} onDragOver={(e) => e.preventDefault()} onDrop={() => onDrop(i)}>
                  <td className="grip">⠿</td>
                  <td><input className="cell" value={s.name} onChange={(e) => set(i, { name: e.target.value })} /></td>
                  <td><input className="cell" value={s.label} onChange={(e) => set(i, { label: e.target.value })} /></td>
                  <td><input className="cell tnum" type="number" value={s.value} onChange={(e) => set(i, { value: +e.target.value || 0 })} /></td>
                  <td><input className="swatch" type="color" value={s.color} onChange={(e) => set(i, { color: e.target.value })} /></td>
                  <td><input type="checkbox" checked={!!s.money} onChange={(e) => set(i, { money: e.target.checked })} /></td>
                  <td><button className="mini dz" onClick={() => remove(i)}>Remove</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

/* ---------------- Email detail ---------------- */
export function EmailPage({ sources, onSources, openRate, onOpenRate, say }) {
  const [bars, setBars] = useState(EMAIL_BARS)
  const total = sources.reduce((a, b) => a + b.value, 0)
  return (
    <div className="page">
      <div className="duo">
        <section className="card">
          <div className="card-h">
            <h3 className="card-t">Email <span className="t">performance</span></h3>
            <span className="kicker">Open rate {openRate.toFixed(1)}%</span>
          </div>
          <div className="card-rule" />
          <div className="chart-box"><BarChart data={bars} /></div>
          <div className="card-rule" />
          <div className="fld">
            <label className="kicker" htmlFor="orate">Open rate — {openRate.toFixed(1)}%</label>
            <input id="orate" type="range" min="0" max="100" step="0.1" value={openRate}
              onChange={(e) => onOpenRate(+e.target.value)} />
          </div>
          <div className="slider-row">
            {bars.map((pair, i) => (
              <label className="slider" key={MONTHS[i]}>
                <span className="kicker">{MONTHS[i]}</span>
                <input type="range" min="0" max="80" value={pair[0]}
                  onChange={(e) => setBars(bars.map((p, j) => (j === i ? [+e.target.value, p[1]] : p)))} />
                <b className="tnum">{pair[0]}%</b>
              </label>
            ))}
          </div>
        </section>

        <section className="card">
          <div className="card-h">
            <h3 className="card-t">Lead <span className="t">sources</span></h3>
            <span className={`kicker${total !== 100 ? ' warn' : ''}`}>{total}% total</span>
          </div>
          <div className="card-rule" />
          <div className="donut-big"><Donut sources={sources} size={168} /></div>
          <div className="card-rule" />
          <div className="src-list">
          {sources.map((s, i) => (
            <div className="src-row" key={s.name}>
              <input className="swatch" type="color" value={s.color}
                onChange={(e) => onSources(sources.map((x, j) => (j === i ? { ...x, color: e.target.value } : x)))} />
              <input className="cell" value={s.name}
                onChange={(e) => onSources(sources.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} />
              <input type="range" min="0" max="100" value={s.value}
                onChange={(e) => onSources(sources.map((x, j) => (j === i ? { ...x, value: +e.target.value } : x)))} />
              <b className="tnum">{s.value}%</b>
              <button className="mini" onClick={() => { onSources(sources.map((x, j) => (j === i ? { ...x, on: !x.on } : x))); say(`${s.name} ${s.on ? 'hidden' : 'shown'}`) }}>
                {s.on ? 'Hide' : 'Show'}
              </button>
            </div>
          ))}
          </div>
        </section>
      </div>
    </div>
  )
}

/* ---------------- Settings ---------------- */
const MARKETS = [
  ['United Arab Emirates', 'AE'], ['Saudi Arabia', 'SA'], ['Qatar', 'QA'], ['Kuwait', 'KW'],
]

export function SettingsPage({ say, settings, onChange }) {
  const s = settings
  const setS = onChange
  const [sectors, setSectors] = useState(() => SECTORS.map((x) => x.id))
  const [dirty, setDirty] = useState(false)

  const set = (k, v) => { setS({ ...s, [k]: v }); setDirty(true) }
  const toggleSector = (id) => {
    setSectors((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]))
    setDirty(true)
  }

  // what the current settings would actually do to today's leads
  const passing = LEADS.filter((l) => l.score >= s.scoreThreshold && sectors.includes(l.sector))
  const perDay = Math.round((60 / Math.max(1, s.pollMinutes)) * 24)
  const heads = passing.reduce((a, b) => a + b.staff, 0)

  return (
    <div className="page">
      <div className="set-cols">
        {/* --- the controls --- */}
        <div className="set-main">
          <section className="card">
            <div className="card-h">
              <h3 className="card-t">Qualify <span className="t">rules</span></h3>
              {dirty && <span className="kicker warn">Unsaved changes</span>}
            </div>
            <div className="card-rule" />

            <div className="ctrl">
              <div className="ctrl-h">
                <label className="ctrl-t" htmlFor="thr">Qualify threshold</label>
                <b className="ctrl-v tnum">{s.scoreThreshold}</b>
              </div>
              <input id="thr" type="range" min="40" max="95" value={s.scoreThreshold}
                onChange={(e) => set('scoreThreshold', +e.target.value)} />
              <p className="ctrl-note">
                Leads scoring below this are watchlisted instead of contacted.
                <b className="t"> {passing.length} of {LEADS.length}</b> current leads pass.
              </p>
            </div>

            <div className="ctrl">
              <div className="ctrl-h">
                <label className="ctrl-t" htmlFor="poll">Poll interval</label>
                <b className="ctrl-v tnum">{s.pollMinutes} min</b>
              </div>
              <input id="poll" type="range" min="5" max="120" step="5" value={s.pollMinutes}
                onChange={(e) => set('pollMinutes', +e.target.value)} />
              <p className="ctrl-note">How often the agent sweeps news and tender portals — about <b>{perDay}</b> checks a day.</p>
            </div>

            <div className="ctrl">
              <div className="ctrl-h">
                <label className="ctrl-t" htmlFor="cvs">CVs per outreach email</label>
                <b className="ctrl-v tnum">{s.cvsPerEmail}</b>
              </div>
              <input id="cvs" type="range" min="1" max="12" value={s.cvsPerEmail}
                onChange={(e) => set('cvsPerEmail', +e.target.value)} />
              <p className="ctrl-note">Vetted profiles attached to each first-contact email.</p>
            </div>
          </section>

          <section className="card">
            <div className="card-h"><h3 className="card-t">Coverage <span className="t">&amp; delivery</span></h3></div>
            <div className="card-rule" />

            <div className="ctrl">
              <span className="ctrl-t">Market</span>
              <div className="mkt-row">
                {MARKETS.map(([name, code]) => (
                  <button key={code} className={`mkt${s.market === name ? ' on' : ''}`}
                    onClick={() => set('market', name)}>
                    <b>{code}</b>
                    <span>{name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="ctrl">
              <div className="ctrl-h">
                <span className="ctrl-t">Priority sectors</span>
                <span className="kicker">{sectors.length} of {SECTORS.length} on</span>
              </div>
              <div className="chips">
                {SECTORS.map((x) => (
                  <button key={x.id} className={`fchip${sectors.includes(x.id) ? ' on' : ''}`}
                    onClick={() => toggleSector(x.id)}>
                    {sectors.includes(x.id) ? '✓ ' : ''}{x.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="ctrl">
              <label className="ctrl-t" htmlFor="mail">Digest recipient</label>
              <input id="mail" className="cell big" value={s.digestEmail}
                onChange={(e) => set('digestEmail', e.target.value)} />
            </div>

            <button className={`sw-row${s.autoOutreach ? ' on' : ''}`} onClick={() => set('autoOutreach', !s.autoOutreach)}>
              <span className="sw"><i /></span>
              <span className="sw-txt">
                <b>Automatic outreach</b>
                <span>Email vetted CVs the moment a lead clears the threshold — no review step.</span>
              </span>
            </button>
          </section>
        </div>

        {/* --- what those rules would do --- */}
        <aside className="card set-side">
          <div className="card-h"><h3 className="card-t">Live <span className="t">preview</span></h3></div>
          <div className="card-rule" />
          <p className="side-lead">With these rules, today's detected awards would produce:</p>

          <div className="side-figs">
            <div className="sf">
              <b className="tnum">{passing.length}</b>
              <span className="kicker">Leads contacted</span>
            </div>
            <div className="sf">
              <b className="tnum t">{money(heads * FEE_PER_HEAD)}</b>
              <span className="kicker">Fee potential</span>
            </div>
          </div>

          <div className="card-rule" />
          <span className="kicker">Who gets contacted</span>
          <div className="side-list">
            {passing.map((l) => (
              <div className="sl-row" key={l.company}>
                <span className="sl-dot" style={{ background: `hsl(${hueOf(l.company)} 65% 58%)` }} />
                <span className="sl-co">{l.company}</span>
                <b className="tnum">{l.score}</b>
              </div>
            ))}
            {passing.length === 0 && <div className="empty">Nothing clears these rules — try a lower threshold.</div>}
          </div>

          <div className="card-rule" />
          <div className="flow-bar">
            <button className="btn pri" onClick={() => { setDirty(false); say('Settings saved') }}>Save</button>
            <button className="btn" onClick={() => { setS(SETTINGS); setSectors(SECTORS.map((x) => x.id)); setDirty(false); say('Settings reset') }}>Reset</button>
          </div>
        </aside>
      </div>
    </div>
  )
}

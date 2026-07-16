import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'

const MailIcon = () => (
  <svg viewBox="0 0 24 24"><rect x="2.5" y="5" width="19" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></svg>
)

/** Measured node sizes, so wires anchor correctly to whatever the CSS actually renders. */
function useNodeSizes(nodes, worldRef) {
  const [sizes, setSizes] = useState({})
  useLayoutEffect(() => {
    const next = {}
    nodes.forEach((n) => {
      const el = worldRef.current?.querySelector(`[data-id="${n.id}"]`)
      if (el) next[n.id] = { w: el.offsetWidth, h: el.offsetHeight }
    })
    setSizes((prev) => {
      const same = nodes.every((n) => prev[n.id]?.w === next[n.id]?.w && prev[n.id]?.h === next[n.id]?.h)
      return same && Object.keys(prev).length === nodes.length ? prev : next
    })
  }, [nodes, worldRef])
  return sizes
}

export default function FlowCanvas({ nodes, edges, selected, onSelect, onMove, onConnect, onDisconnect, onEdit, running }) {
  const canvasRef = useRef(null)
  const worldRef = useRef(null)
  const [view, setView] = useState({ x: 0, y: 0, k: 1 })
  const [drag, setDrag] = useState(null)
  const [link, setLink] = useState(null)
  const [tempTo, setTempTo] = useState(null)
  const panRef = useRef(null)
  const lastClick = useRef(null)
  const sizes = useNodeSizes(nodes, worldRef)

  /** True when b sits essentially beneath a — those route straight down. */
  const isStacked = useCallback((a, b) => {
    const na = nodes.find((n) => n.id === a)
    const nb = nodes.find((n) => n.id === b)
    const sa = sizes[a]
    const sb = sizes[b]
    if (!na || !nb || !sa || !sb) return false
    if (na.type === 'decision') return false // the diamond branches sideways
    // Compare visual centres — the diamond's box is wider than the shape reads.
    const ca = na.x + sa.w / 2
    const cb = nb.x + sb.w / 2
    return nb.y > na.y + sa.h - 1 && Math.abs(ca - cb) < Math.min(sa.w, sb.w) * 0.5
  }, [nodes, sizes])

  const anchor = useCallback((id, side, stacked) => {
    const n = nodes.find((x) => x.id === id)
    const s = sizes[id]
    if (!n || !s) return { x: 0, y: 0 }
    if (stacked) {
      const cx = n.x + s.w / 2
      if (n.type === 'decision') {
        // enter at the diamond's top point, which sits above the box centre
        const cy = n.y + s.h / 2
        const r = (s.w * Math.SQRT2) / 2
        return { x: cx, y: cy - r + 2 }
      }
      // vertical spine: leave the bottom edge, enter the top edge
      return side === 'out' ? { x: cx, y: n.y + s.h } : { x: cx, y: n.y }
    }
    if (n.type === 'decision') {
      // The diamond is a square rotated 45°, so its points sit at the edge midpoints.
      const cx = n.x + s.w / 2
      const cy = n.y + s.h / 2
      const r = (s.w * Math.SQRT2) / 2
      return side === 'out' ? { x: cx + r - 2, y: cy } : { x: cx, y: cy - r + 2 }
    }
    return side === 'out'
      ? { x: n.x + s.w, y: n.y + s.h / 2 }
      : { x: n.x, y: n.y + s.h / 2 }
  }, [nodes, sizes])

  /* Orthogonal routing with rounded corners — mirrors the reference diagram's
     right-angle connectors rather than loose diagonal curves. */
  /* Orthogonal router. Corner radius shrinks to fit the available run, so short
     hops stay clean instead of curling back on themselves. */
  const path = (a, b, vertical, stacked) => {
    const dx = b.x - a.x
    const dy = b.y - a.y

    // A stacked pair is one straight drop — share an x so no jog appears.
    if (stacked) {
      const x = Math.round((a.x + b.x) / 2)
      return `M${x},${a.y} L${x},${b.y}`
    }
    if (Math.abs(dy) < 5) return `M${a.x},${a.y} L${b.x},${b.y}`
    if (Math.abs(dx) < 5) return `M${a.x},${a.y} L${b.x},${b.y}`

    const sy = Math.sign(dy) || 1
    const sx = Math.sign(dx) || 1

    if (vertical) {
      // leave downward, then turn horizontally into the target
      const r = Math.min(9, Math.abs(dy) / 2, Math.abs(dx) / 2)
      return `M${a.x},${a.y} L${a.x},${b.y - r * sy} Q${a.x},${b.y} ${a.x + r * sx},${b.y} L${b.x},${b.y}`
    }

    // leave rightward, jog vertically at a midpoint, then into the target
    const mx = dx > 0 ? a.x + Math.max(20, dx / 2) : a.x + 20
    const r = Math.min(9, Math.abs(dy) / 2, Math.abs(mx - a.x), Math.abs(b.x - mx) || 9)
    return [
      `M${a.x},${a.y}`,
      `L${mx - r},${a.y}`,
      `Q${mx},${a.y} ${mx},${a.y + r * sy}`,
      `L${mx},${b.y - r * sy}`,
      `Q${mx},${b.y} ${mx + r},${b.y}`,
      `L${b.x},${b.y}`,
    ].join(' ')
  }

  const onPointerDown = (e) => {
    const portEl = e.target.closest('.port')
    const nodeEl = e.target.closest('.node')
    if (portEl && nodeEl) {
      e.preventDefault()
      e.stopPropagation()
      setLink({ from: nodeEl.dataset.id, side: portEl.dataset.p })
      canvasRef.current.setPointerCapture(e.pointerId)
      return
    }
    if (nodeEl) {
      const n = nodes.find((x) => x.id === nodeEl.dataset.id)
      // Pointer capture below swallows the browser's dblclick, so detect it here.
      const now = e.timeStamp
      const last = lastClick.current
      if (last && last.id === n.id && now - last.t < 400) {
        lastClick.current = null
        onEdit(n.id)
        return
      }
      lastClick.current = { id: n.id, t: now }
      onSelect(n.id)
      setDrag({ id: n.id, ox: e.clientX / view.k - n.x, oy: e.clientY / view.k - n.y })
      canvasRef.current.setPointerCapture(e.pointerId)
      return
    }
    onSelect(null)
    panRef.current = { x: e.clientX - view.x, y: e.clientY - view.y }
    canvasRef.current.classList.add('panning')
  }

  const onPointerMove = (e) => {
    if (drag) {
      onMove(drag.id, Math.max(4, e.clientX / view.k - drag.ox), Math.max(4, e.clientY / view.k - drag.oy))
    }
    if (link) {
      const r = canvasRef.current.getBoundingClientRect()
      setTempTo({ x: (e.clientX - r.left - view.x) / view.k, y: (e.clientY - r.top - view.y) / view.k })
    }
    if (panRef.current) {
      setView((v) => ({ ...v, x: e.clientX - panRef.current.x, y: e.clientY - panRef.current.y }))
    }
  }

  const endPointer = (e) => {
    if (drag) setDrag(null)
    if (link) {
      const el = document.elementFromPoint(e.clientX, e.clientY)?.closest('.node')
      if (el && el.dataset.id !== link.from) {
        const pair = link.side === 'out' ? [link.from, el.dataset.id] : [el.dataset.id, link.from]
        onConnect(pair)
      }
      setLink(null)
      setTempTo(null)
    }
    panRef.current = null
    canvasRef.current?.classList.remove('panning')
  }

  useEffect(() => {
    const stop = () => { panRef.current = null; canvasRef.current?.classList.remove('panning') }
    window.addEventListener('pointerup', stop)
    return () => window.removeEventListener('pointerup', stop)
  }, [])

  // Non-passive wheel listener — React's onWheel is passive and can't preventDefault.
  useEffect(() => {
    const el = canvasRef.current
    if (!el) return
    const onWheel = (e) => {
      e.preventDefault()
      setView((v) => ({ ...v, k: Math.min(2.6, Math.max(0.35, v.k * (e.deltaY < 0 ? 1.09 : 0.917))) }))
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [])

  /* Fit the whole graph into whatever space the canvas actually has. Node
     coordinates are authored at a fixed scale, so without this the diagram gets
     cut off on short viewports, high OS zoom, or small windows. */
  const fit = useCallback(() => {
    const el = canvasRef.current
    if (!el || !nodes.length) return
    const cw = el.clientWidth
    const ch = el.clientHeight
    if (cw < 20 || ch < 20) return
    if (nodes.some((n) => !sizes[n.id])) return

    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity
    nodes.forEach((n) => {
      const s = sizes[n.id]
      // the diamond's rotated bounds are wider/taller than its box
      const pad = n.type === 'decision' ? (s.w * Math.SQRT2 - s.w) / 2 : 0
      x0 = Math.min(x0, n.x - pad)
      y0 = Math.min(y0, n.y - pad)
      x1 = Math.max(x1, n.x + s.w + pad)
      y1 = Math.max(y1, n.y + s.h + pad)
    })

    const M = 16
    const k = Math.min((cw - M * 2) / (x1 - x0), (ch - M * 2) / (y1 - y0), 1.9)
    setView({
      k,
      x: (cw - (x1 - x0) * k) / 2 - x0 * k,
      y: (ch - (y1 - y0) * k) / 2 - y0 * k,
    })
  }, [nodes, sizes])

  // Fit on mount, when the workflow changes, and whenever the canvas resizes.
  const fitRef = useRef(fit)
  fitRef.current = fit
  useEffect(() => {
    const el = canvasRef.current
    if (!el) return
    const ro = new ResizeObserver(() => fitRef.current())
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const wfKey = nodes.map((n) => n.id).join(',')
  const ready = nodes.every((n) => sizes[n.id])
  useEffect(() => { fitRef.current() }, [wfKey, ready])

  useEffect(() => {
    const reset = () => fitRef.current()
    window.addEventListener('flow:reset', reset)
    return () => window.removeEventListener('flow:reset', reset)
  }, [])

  return (
    <div
      className={`canvas${link ? ' linking' : ''}${running.active ? ' running' : ''}`}
      ref={canvasRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endPointer}
    >
      <div className="world" ref={worldRef} style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.k})` }}>
        <svg className="wires">
          <defs>
            <marker id="ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M0 0 L10 5 L0 10 z" fill="rgba(200,190,235,.8)" />
            </marker>
          </defs>
          {edges.map(([a, b], i) => {
            const from = nodes.find((n) => n.id === a)
            const stacked = isStacked(a, b)
            const d = path(anchor(a, 'out', stacked), anchor(b, 'in', stacked), from?.type === 'decision', stacked)
            return (
              <g key={`${a}>${b}`}>
                <path className="wire-hit" d={d} onClick={() => onDisconnect(i)}>
                  <title>Click to remove this connection</title>
                </path>
                <path className={`wire${running.edges.has(`${a}>${b}`) ? ' live' : ''}`} d={d} markerEnd="url(#ah)" />
              </g>
            )
          })}
          {link && tempTo && <path className="wire live" d={path(anchor(link.from, link.side, false), tempTo, false, false)} />}
        </svg>

        {nodes.map((n) => (
          <div
            key={n.id}
            data-id={n.id}
            title={n.note || undefined}
            className={[
              'node', `n-${n.type}`,
              selected === n.id ? 'sel' : '',
              drag?.id === n.id ? 'dragging' : '',
              running.nodes.has(n.id) ? 'pulse' : '',
              running.done?.has(n.id) ? 'done' : '',
            ].filter(Boolean).join(' ')}
            style={{ left: n.x, top: n.y }}
          >
            {n.type === 'mail'
              ? <MailIcon />
              : <span className="lbl">{(n.label || '').split('\n').map((l, i, arr) => (
                  <span key={i}>{l}{i < arr.length - 1 && <br />}</span>
                ))}</span>}
            <div className="port in" data-p="in" />
            <div className="port out" data-p="out" />
          </div>
        ))}
      </div>
    </div>
  )
}

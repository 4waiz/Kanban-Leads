import { useEffect, useRef } from 'react'
import { MONTHS } from '../data/seed'

const FONT_MONO = "10px 'JetBrains Mono', monospace"

/* Sizes the canvas from its parent box and redraws on resize.
   The drawing surface is set from the parent's content box — never from the
   canvas itself, which would feed its own size back into the observer. */
function useCanvas(draw, deps) {
  const ref = useRef(null)
  const drawRef = useRef(draw)
  drawRef.current = draw

  useEffect(() => {
    const cv = ref.current
    const parent = cv?.parentElement
    if (!cv || !parent) return

    let raf = 0
    const render = () => {
      const fixed = cv.dataset.fixed ? Number(cv.dataset.fixed) : 0
      const w = fixed || parent.clientWidth
      const h = fixed ? Number(cv.dataset.h) : parent.clientHeight || Number(cv.dataset.h)
      if (w < 4 || h < 4) return
      const dpr = window.devicePixelRatio || 1
      cv.width = Math.round(w * dpr)
      cv.height = Math.round(h * dpr)
      cv.style.width = w + 'px'
      cv.style.height = h + 'px'
      const ctx = cv.getContext('2d')
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, w, h)
      drawRef.current(ctx, w, h)
    }

    const schedule = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(render)
    }
    schedule()
    const ro = new ResizeObserver(schedule)
    ro.observe(parent)
    return () => { cancelAnimationFrame(raf); ro.disconnect() }
  }, deps)
  return ref
}

export function RevenueChart({ data }) {
  const ref = useCanvas((x, w, h) => {
    const pl = 34, pr = 16, pt = 8, pb = 20 // pr leaves room for the last month label
    const iw = w - pl - pr, ih = h - pt - pb, max = 100
    if (iw < 10 || ih < 10) return
    x.font = FONT_MONO
    // fewer gridlines when the box is short, so labels never collide
    const ticks = ih < 90 ? [0, 50, 100] : [0, 25, 50, 75, 100]
    ticks.forEach((v) => {
      const y = pt + ih - (v / max) * ih
      x.strokeStyle = 'rgba(255,255,255,.09)'
      x.beginPath(); x.moveTo(pl, y); x.lineTo(w - pr, y); x.stroke()
      x.fillStyle = '#B7ACD6'; x.textAlign = 'right'
      x.fillText(v ? v + 'K' : '0', pl - 7, y + 3.5)
    })
    const pts = data.map((v, i) => [pl + (i / (data.length - 1)) * iw, pt + ih - (v / max) * ih])
    const curve = () => {
      x.beginPath(); x.moveTo(pts[0][0], pts[0][1])
      for (let i = 0; i < pts.length - 1; i++) {
        const [ax, ay] = pts[i], [bx, by] = pts[i + 1], mx = (ax + bx) / 2
        x.bezierCurveTo(mx, ay, mx, by, bx, by)
      }
    }
    const g = x.createLinearGradient(0, pt, 0, pt + ih)
    g.addColorStop(0, 'rgba(56,189,248,.55)')
    g.addColorStop(1, 'rgba(56,189,248,0)')
    curve(); x.lineTo(pts.at(-1)[0], pt + ih); x.lineTo(pts[0][0], pt + ih); x.closePath()
    x.fillStyle = g; x.fill()
    curve(); x.strokeStyle = '#38BDF8'; x.lineWidth = 2.4; x.stroke()
    const e = pts.at(-1)
    x.beginPath(); x.arc(e[0], e[1], 4, 0, Math.PI * 2)
    x.fillStyle = '#38BDF8'; x.fill()
    x.strokeStyle = 'rgba(255,255,255,.9)'; x.lineWidth = 1.6; x.stroke()
    x.fillStyle = '#B7ACD6'; x.textAlign = 'center'
    MONTHS.forEach((m, i) => x.fillText(m, pts[i][0], h - 6))
  }, [data])
  return <canvas ref={ref} data-h="150" />
}

export function BarChart({ data }) {
  const ref = useCanvas((x, w, h) => {
    const pl = 30, pb = 17, pt = 6
    const iw = w - pl - 4, ih = h - pt - pb
    if (iw < 10 || ih < 10) return
    x.font = "9.5px 'JetBrains Mono', monospace"
    const ticks = ih < 80 ? [0, 40, 80] : [0, 20, 40, 60, 80]
    ticks.forEach((v) => {
      const y = pt + ih - (v / 80) * ih
      x.strokeStyle = 'rgba(255,255,255,.08)'
      x.beginPath(); x.moveTo(pl, y); x.lineTo(w - 2, y); x.stroke()
      x.fillStyle = '#B7ACD6'; x.textAlign = 'right'
      x.fillText(v + '%', pl - 5, y + 3)
    })
    const gw = iw / data.length, bw = gw * 0.3
    data.forEach((pair, i) => {
      pair.forEach((v, j) => {
        const bx = pl + i * gw + gw * 0.16 + j * (bw + 3)
        const bh = (v / 80) * ih, by = pt + ih - bh
        const g = x.createLinearGradient(0, by, 0, pt + ih)
        if (j === 0) { g.addColorStop(0, '#38BDF8'); g.addColorStop(1, '#1E6FA8') }
        else { g.addColorStop(0, '#C084FC'); g.addColorStop(1, '#7A3FB0') }
        x.fillStyle = g
        x.beginPath(); x.roundRect(bx, by, bw, bh, 2); x.fill()
      })
      x.fillStyle = '#B7ACD6'; x.textAlign = 'center'
      x.fillText(MONTHS[i], pl + i * gw + gw / 2, h - 5)
    })
  }, [data])
  return <canvas ref={ref} data-h="132" />
}

export function Donut({ sources, size = 104 }) {
  const ref = useCanvas((x, w, h) => {
    const cx = w / 2, cy = h / 2
    const R = Math.min(w, h) / 2 - 2
    const r = R * 0.61
    const on = sources.filter((s) => s.on)
    const tot = on.reduce((a, b) => a + b.value, 0) || 1
    let a = -Math.PI / 2
    on.forEach((s) => {
      const e = a + (s.value / tot) * Math.PI * 2
      x.beginPath(); x.arc(cx, cy, R, a, e); x.arc(cx, cy, r, e, a, true); x.closePath()
      x.fillStyle = s.color; x.fill()
      x.strokeStyle = 'rgba(12,6,34,.85)'; x.lineWidth = 2; x.stroke()
      a = e
    })
  }, [sources, size])
  return <canvas ref={ref} data-fixed={size} data-h={size} style={{ flex: 'none' }} />
}

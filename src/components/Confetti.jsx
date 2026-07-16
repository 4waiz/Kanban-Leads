import { useEffect, useRef } from 'react'

const COLORS = ['#14B8A6', '#38BDF8', '#C084FC', '#FBBF24', '#34D399', '#F0407A', '#C27B5E']

/**
 * A one-shot confetti burst on a full-screen canvas.
 * `origin` is a viewport point ({x, y}); pieces fly outward and fall.
 * Renders nothing and costs nothing once the pieces settle.
 */
export default function Confetti({ fire, origin }) {
  const ref = useRef(null)
  const raf = useRef(0)
  const bits = useRef([])

  useEffect(() => {
    if (!fire) return
    const cv = ref.current
    if (!cv) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const dpr = window.devicePixelRatio || 1
    const W = window.innerWidth
    const H = window.innerHeight
    cv.width = W * dpr
    cv.height = H * dpr
    cv.style.width = W + 'px'
    cv.style.height = H + 'px'
    const x = cv.getContext('2d')
    x.setTransform(dpr, 0, 0, dpr, 0, 0)

    const ox = origin?.x ?? W / 2
    const oy = origin?.y ?? H / 2

    // Two rings: a fast narrow burst, then a wider slower one — reads as a pop
    // rather than a uniform explosion.
    bits.current = Array.from({ length: 130 }, (_, i) => {
      const ring = i < 70
      const a = (Math.PI * 2 * i) / (ring ? 70 : 60) + Math.random() * 0.4
      const sp = (ring ? 5 : 8) + Math.random() * (ring ? 5 : 6)
      return {
        x: ox, y: oy,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp - 3,
        w: 5 + Math.random() * 6,
        h: 3 + Math.random() * 5,
        rot: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 0.34,
        c: COLORS[(Math.random() * COLORS.length) | 0],
        life: 1,
        drag: 0.982 + Math.random() * 0.012,
      }
    })

    let last = performance.now()
    const tick = (now) => {
      const dt = Math.min(32, now - last) / 16.67
      last = now
      x.clearRect(0, 0, W, H)
      let alive = 0

      bits.current.forEach((b) => {
        if (b.life <= 0) return
        alive++
        b.vy += 0.28 * dt          // gravity
        b.vx *= b.drag
        b.vy *= b.drag
        b.x += b.vx * dt
        b.y += b.vy * dt
        b.rot += b.vr * dt
        b.life -= 0.0085 * dt
        if (b.y > H + 40) b.life = 0

        x.save()
        x.translate(b.x, b.y)
        x.rotate(b.rot)
        x.globalAlpha = Math.max(0, Math.min(1, b.life * 1.6))
        x.fillStyle = b.c
        // flip the piece as it spins so it reads as paper, not a dot
        const sq = Math.abs(Math.cos(b.rot * 1.6))
        x.fillRect(-b.w / 2, -b.h / 2, b.w, b.h * sq + 1)
        x.restore()
      })

      if (alive) raf.current = requestAnimationFrame(tick)
      else x.clearRect(0, 0, W, H)
    }
    raf.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf.current)
  }, [fire, origin])

  return <canvas className="confetti" ref={ref} aria-hidden="true" />
}

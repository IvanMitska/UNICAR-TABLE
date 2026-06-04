import { useEffect, useRef, useState } from 'react'

/** Animated count-up from 0 → target (easeOutCubic). Respects prefers-reduced-motion. */
export function useCountUp(target: number, duration = 900) {
  const [value, setValue] = useState(0)
  const rafRef = useRef<number>()
  useEffect(() => {
    const reduce = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce || target === 0) {
      setValue(target)
      return
    }
    const start = performance.now()
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - t, 3)
      setValue(target * eased)
      if (t < 1) rafRef.current = requestAnimationFrame(tick)
      else setValue(target)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [target, duration])
  return value
}

/** Renders an animated number; optional formatter (e.g. currency). */
export function CountUp({
  value,
  format,
  duration,
}: {
  value: number
  format?: (n: number) => string
  duration?: number
}) {
  const n = useCountUp(value, duration)
  return <span className="num-roll">{format ? format(n) : Math.round(n).toLocaleString('ru-RU')}</span>
}

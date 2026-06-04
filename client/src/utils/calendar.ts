/** Pure calendar helpers (timeline lane packing & overlap) — unit-tested. */

export interface LaneBar {
  startIdx: number
  endIdx: number
  rawStart: number
  rawEnd: number
  conflict: boolean
  lane: number
}

export const clampIdx = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v))

/** Two day-index ranges overlap (inclusive). */
export function rangeOverlap(aStart: number, aEnd: number, bStart: number, bEnd: number): boolean {
  return aStart <= bEnd && bStart <= aEnd
}

/**
 * Greedy lane assignment: overlapping bars are placed on separate lanes.
 * Mutates and returns the bars (with `lane` + `conflict` set) and the lane count.
 */
export function packLanes<T extends LaneBar>(bars: T[]): { bars: T[]; lanes: number } {
  bars.sort((a, b) => a.startIdx - b.startIdx || a.endIdx - b.endIdx)
  const laneEnd: number[] = []
  bars.forEach((b) => {
    let lane = laneEnd.findIndex((end) => end < b.startIdx)
    if (lane === -1) { lane = laneEnd.length; laneEnd.push(b.endIdx) } else laneEnd[lane] = b.endIdx
    b.lane = lane
  })
  for (let i = 0; i < bars.length; i++)
    for (let j = i + 1; j < bars.length; j++)
      if (rangeOverlap(bars[i].rawStart, bars[i].rawEnd, bars[j].rawStart, bars[j].rawEnd)) {
        bars[i].conflict = true
        bars[j].conflict = true
      }
  return { bars, lanes: laneEnd.length }
}

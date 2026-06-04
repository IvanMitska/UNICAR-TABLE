import { describe, it, expect } from 'vitest'
import { packLanes, rangeOverlap, clampIdx, type LaneBar } from './calendar'

const bar = (startIdx: number, endIdx: number): LaneBar => ({ startIdx, endIdx, rawStart: startIdx, rawEnd: endIdx, conflict: false, lane: 0 })

describe('calendar: rangeOverlap', () => {
  it('detects overlap (inclusive)', () => {
    expect(rangeOverlap(1, 5, 5, 8)).toBe(true)
    expect(rangeOverlap(1, 5, 3, 4)).toBe(true)
  })
  it('detects no overlap', () => {
    expect(rangeOverlap(1, 4, 5, 8)).toBe(false)
    expect(rangeOverlap(10, 12, 1, 4)).toBe(false)
  })
})

describe('calendar: clampIdx', () => {
  it('clamps into range', () => {
    expect(clampIdx(-3, 0, 30)).toBe(0)
    expect(clampIdx(45, 0, 30)).toBe(30)
    expect(clampIdx(12, 0, 30)).toBe(12)
  })
})

describe('calendar: packLanes', () => {
  it('keeps non-overlapping bookings on a single lane', () => {
    const { bars, lanes } = packLanes([bar(0, 3), bar(5, 8), bar(10, 12)])
    expect(lanes).toBe(1)
    expect(bars.every(b => b.lane === 0)).toBe(true)
    expect(bars.every(b => !b.conflict)).toBe(true)
  })

  it('puts overlapping bookings on separate lanes and flags conflict', () => {
    const { bars, lanes } = packLanes([bar(0, 5), bar(3, 8)])
    expect(lanes).toBe(2)
    expect(bars.map(b => b.lane).sort()).toEqual([0, 1])
    expect(bars.every(b => b.conflict)).toBe(true)
  })

  it('handles a mix: A/B overlap, C is free', () => {
    const { bars, lanes } = packLanes([bar(0, 2), bar(1, 3), bar(5, 6)])
    expect(lanes).toBe(2)
    const c = bars.find(b => b.startIdx === 5)!
    expect(c.lane).toBe(0)
    expect(c.conflict).toBe(false)
    expect(bars.filter(b => b.conflict).length).toBe(2)
  })

  it('reuses a freed lane after it ends (3 sequential overlaps stay at 2 lanes)', () => {
    // [0-2] & [1-3] overlap -> 2 lanes; [4-6] starts after both end -> lane 0 reused
    const { lanes } = packLanes([bar(0, 2), bar(1, 3), bar(4, 6)])
    expect(lanes).toBe(2)
  })

  it('adjacent (touching) bookings do not conflict', () => {
    const { lanes, bars } = packLanes([bar(0, 2), bar(3, 5)])
    expect(lanes).toBe(1)
    expect(bars.every(b => !b.conflict)).toBe(true)
  })
})

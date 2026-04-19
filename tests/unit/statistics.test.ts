import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useStatsStore } from '@/stores/statsStore'
import type { TrainingRecord } from '@/types'

function makeRecord(overrides: Partial<TrainingRecord> = {}): TrainingRecord {
  return {
    id: Math.random().toString(36).slice(2),
    timestamp: Date.now(),
    targetColor: {
      rgb: { r: 200, g: 100, b: 50 },
      hsv: { h: 20, s: 75, v: 78 },
      hsl: { h: 20, s: 60, l: 49 },
      lab: { l: 50, a: 20, b: 30 },
      hex: '#c86432',
    },
    userColor: {
      rgb: { r: 190, g: 110, b: 60 },
      hsv: { h: 25, s: 68, v: 75 },
      hsl: { h: 25, s: 55, l: 49 },
      lab: { l: 52, a: 18, b: 28 },
      hex: '#be6e3c',
    },
    deltaE: 3.5,
    hueError: 5,
    satError: 5,
    lightError: 0,
    difficulty: 'medium',
    score: 'excellent',
    isGrayscale: false,
    ...overrides,
  }
}

describe('statsStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  it('starts empty', () => {
    const store = useStatsStore()
    expect(store.records).toHaveLength(0)
  })

  it('addRecord persists', () => {
    const store = useStatsStore()
    store.addRecord(makeRecord())
    expect(store.records).toHaveLength(1)
  })

  it('clearRecords empties store', () => {
    const store = useStatsStore()
    store.addRecord(makeRecord())
    store.clearRecords()
    expect(store.records).toHaveLength(0)
  })

  it('analyze returns null when empty', () => {
    const store = useStatsStore()
    expect(store.analyze()).toBeNull()
  })

  it('analyze computes avgDeltaE', () => {
    const store = useStatsStore()
    store.addRecord(makeRecord({ deltaE: 2 }))
    store.addRecord(makeRecord({ deltaE: 4 }))
    const result = store.analyze()
    expect(result?.avgDeltaE).toBeCloseTo(3, 5)
  })

  it('analyze fills byDifficulty buckets', () => {
    const store = useStatsStore()
    store.addRecord(makeRecord({ difficulty: 'easy', deltaE: 5 }))
    store.addRecord(makeRecord({ difficulty: 'hard', deltaE: 10 }))
    const result = store.analyze()!
    expect(result.byDifficulty.easy.count).toBe(1)
    expect(result.byDifficulty.hard.count).toBe(1)
    expect(result.byDifficulty.medium.count).toBe(0)
  })

  it('exportJSON produces valid JSON array', () => {
    const store = useStatsStore()
    store.addRecord(makeRecord())
    const json = store.exportJSON()
    const parsed = JSON.parse(json)
    expect(Array.isArray(parsed)).toBe(true)
    expect(parsed).toHaveLength(1)
  })

  it('analyze identifies weak hue ranges', () => {
    const store = useStatsStore()
    // Add many records in hue 0-30 with high ΔE
    for (let i = 0; i < 5; i++) {
      store.addRecord(makeRecord({
        deltaE: 15,
        targetColor: { ...makeRecord().targetColor, hsl: { h: 10, s: 60, l: 49 } },
      }))
    }
    // Add records in hue 180-210 with low ΔE
    for (let i = 0; i < 5; i++) {
      store.addRecord(makeRecord({
        deltaE: 1,
        targetColor: { ...makeRecord().targetColor, hsl: { h: 190, s: 60, l: 49 } },
      }))
    }
    const result = store.analyze()!
    expect(result.weakHueRanges).toContain('0')
  })
})

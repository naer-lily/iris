import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { TrainingRecord, AnalysisResult } from '@/types'
import { hueError } from '@/utils/colorMath'

const STORAGE_KEY = 'iris_records'

function loadRecords(): TrainingRecord[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
  } catch { return [] }
}
function saveRecords(records: TrainingRecord[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records))
}

export const useStatsStore = defineStore('stats', () => {
  const records = ref<TrainingRecord[]>(loadRecords())

  function addRecord(record: TrainingRecord) {
    records.value.push(record)
    saveRecords(records.value)
  }

  function clearRecords() {
    records.value = []
    saveRecords([])
  }

  function exportJSON(): string {
    return JSON.stringify(records.value, null, 2)
  }

  function analyze(): AnalysisResult | null {
    if (records.value.length === 0) return null

    const total = records.value.length
    const avgDeltaE = records.value.reduce((s, r) => s + r.deltaE, 0) / total

    // Hue buckets: 12 × 30° segments
    const byHue: AnalysisResult['byHue'] = {}
    for (let i = 0; i < 12; i++) byHue[`${i * 30}`] = { count: 0, totalDeltaE: 0 }

    // Sat buckets: 5 × 20% segments
    const bySat: AnalysisResult['bySat'] = {}
    for (let i = 0; i < 5; i++) bySat[`${i * 20}`] = { count: 0, totalDeltaE: 0 }

    // Light buckets: 5 × 20% segments
    const byLight: AnalysisResult['byLight'] = {}
    for (let i = 0; i < 5; i++) byLight[`${i * 20}`] = { count: 0, totalDeltaE: 0 }

    const byDifficulty: AnalysisResult['byDifficulty'] = {
      easy:   { count: 0, totalDeltaE: 0 },
      medium: { count: 0, totalDeltaE: 0 },
      hard:   { count: 0, totalDeltaE: 0 },
      expert: { count: 0, totalDeltaE: 0 },
    }

    for (const r of records.value) {
      const hue = r.targetColor.hsl.h
      const sat = r.targetColor.hsl.s
      const light = r.targetColor.hsl.l

      const hueBucket = `${Math.floor(hue / 30) * 30}`
      const satBucket = `${Math.min(4, Math.floor(sat / 20)) * 20}`
      const lightBucket = `${Math.min(4, Math.floor(light / 20)) * 20}`

      byHue[hueBucket].count++
      byHue[hueBucket].totalDeltaE += r.deltaE
      bySat[satBucket].count++
      bySat[satBucket].totalDeltaE += r.deltaE
      byLight[lightBucket].count++
      byLight[lightBucket].totalDeltaE += r.deltaE
      byDifficulty[r.difficulty].count++
      byDifficulty[r.difficulty].totalDeltaE += r.deltaE
    }

    // Find weak hue ranges (avg ΔE > overall avg * 1.3)
    const weakHueRanges = Object.entries(byHue)
      .filter(([, v]) => v.count > 0 && v.totalDeltaE / v.count > avgDeltaE * 1.3)
      .map(([k]) => k)

    // Recommendation: focus on worst hue range
    const worstHue = Object.entries(byHue)
      .filter(([, v]) => v.count > 0)
      .sort(([, a], [, b]) => b.totalDeltaE / b.count - a.totalDeltaE / a.count)[0]

    const hueCenter = worstHue ? parseInt(worstHue[0]) : 0
    const recommendation = {
      hueMin: hueCenter, hueMax: hueCenter + 60,
      satMin: 30, satMax: 100, lightMin: 20, lightMax: 80,
    }

    return { avgDeltaE, byHue, bySat, byLight, byDifficulty, weakHueRanges, recommendation }
  }

  return { records, addRecord, clearRecords, exportJSON, analyze }
})

export { hueError }

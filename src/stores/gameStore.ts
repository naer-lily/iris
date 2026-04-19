import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { GamePhase, ColorData, ScoreGrade } from '@/types'
import {
  ciede2000, gradeFromDeltaE, hueError,
  randomColorInRange, randomGrayscale,
} from '@/utils/colorMath'
import { useSettingsStore } from './settingsStore'
import { useStatsStore } from './statsStore'

export const useGameStore = defineStore('game', () => {
  const phase = ref<GamePhase>('idle')
  const targetColor = ref<ColorData | null>(null)
  const userColor = ref<ColorData | null>(null)
  const deltaE = ref<number | null>(null)
  const score = ref<ScoreGrade | null>(null)

  function startRound() {
    const settings = useSettingsStore()
    const { trainingRange: r, isGrayscale } = settings

    targetColor.value = isGrayscale
      ? randomGrayscale(r.lightMin, r.lightMax)
      : randomColorInRange(r.hueMin, r.hueMax, r.satMin, r.satMax, r.lightMin, r.lightMax)

    userColor.value = null
    deltaE.value = null
    score.value = null
    phase.value = 'playing'
  }

  function setUserColor(color: ColorData) {
    userColor.value = color
  }

  function submitGuess() {
    if (!targetColor.value || !userColor.value) return
    const settings = useSettingsStore()
    const stats = useStatsStore()

    const dE = ciede2000(targetColor.value.lab, userColor.value.lab)
    deltaE.value = dE
    score.value = gradeFromDeltaE(dE)
    phase.value = 'result'

    const t = targetColor.value.hsl
    const u = userColor.value.hsl

    stats.addRecord({
      id: Math.random().toString(36).slice(2),
      timestamp: Date.now(),
      targetColor: targetColor.value,
      userColor: userColor.value,
      deltaE: dE,
      hueError: hueError(t.h, u.h),
      satError: Math.abs(t.s - u.s),
      lightError: Math.abs(t.l - u.l),
      difficulty: settings.difficulty.level,
      score: score.value,
      isGrayscale: settings.isGrayscale,
    })
  }

  return { phase, targetColor, userColor, deltaE, score, startRound, setUserColor, submitGuess }
})

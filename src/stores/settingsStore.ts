import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import type { DifficultyConfig, TrainingRange, DifficultyLevel } from '@/types'

export const DIFFICULTY_PRESETS: Record<DifficultyLevel, DifficultyConfig> = {
  easy:   { level: 'easy',   targetAreaPercent: 40, backgroundLevel: 1, colorContrast: 'random' },
  medium: { level: 'medium', targetAreaPercent: 20, backgroundLevel: 2, colorContrast: 'random' },
  hard:   { level: 'hard',   targetAreaPercent: 10, backgroundLevel: 3, colorContrast: 'similar' },
  expert: { level: 'expert', targetAreaPercent: 5,  backgroundLevel: 5, colorContrast: 'similar' },
}

export const TRAINING_PRESETS: Record<string, TrainingRange> = {
  full:            { hueMin: 0, hueMax: 360, satMin: 0,  satMax: 100, lightMin: 10, lightMax: 90 },
  lowSaturation:   { hueMin: 0, hueMax: 360, satMin: 0,  satMax: 30,  lightMin: 20, lightMax: 80 },
  dark:            { hueMin: 0, hueMax: 360, satMin: 20, satMax: 100, lightMin: 5,  lightMax: 35 },
  highSaturation:  { hueMin: 0, hueMax: 360, satMin: 70, satMax: 100, lightMin: 30, lightMax: 70 },
  complementary:   { hueMin: 0, hueMax: 360, satMin: 50, satMax: 100, lightMin: 30, lightMax: 70 },
}

const STORAGE_KEY = 'iris_settings'

interface Persisted {
  locale?: 'zh' | 'en'
  difficulty?: DifficultyConfig
  trainingRange?: TrainingRange
  isGrayscale?: boolean
  theme?: 'dark' | 'light'
  pickerMode?: 'linear' | 'wheel'
}

function load(): Persisted {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') } catch { return {} }
}
function save(data: Persisted) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export const useSettingsStore = defineStore('settings', () => {
  const p = load()

  const locale      = ref<'zh' | 'en'>(p.locale ?? 'zh')
  const difficulty  = ref<DifficultyConfig>(p.difficulty ?? { ...DIFFICULTY_PRESETS.medium })
  const trainingRange = ref<TrainingRange>(p.trainingRange ?? { ...TRAINING_PRESETS.full })
  const isGrayscale = ref(p.isGrayscale ?? false)
  const theme       = ref<'dark' | 'light'>(p.theme ?? 'dark')
  const pickerMode  = ref<'linear' | 'wheel'>(p.pickerMode ?? 'linear')

  const difficultyLevel = computed(() => difficulty.value.level)

  // Persist on every change
  watch(
    [locale, difficulty, trainingRange, isGrayscale, theme, pickerMode],
    () => save({
      locale: locale.value,
      difficulty: difficulty.value,
      trainingRange: trainingRange.value,
      isGrayscale: isGrayscale.value,
      theme: theme.value,
      pickerMode: pickerMode.value,
    }),
    { deep: true },
  )

  function setLocale(lang: 'zh' | 'en') { locale.value = lang }
  function setDifficulty(level: DifficultyLevel) { difficulty.value = { ...DIFFICULTY_PRESETS[level] } }
  function setTrainingPreset(preset: string) {
    if (TRAINING_PRESETS[preset]) trainingRange.value = { ...TRAINING_PRESETS[preset] }
  }
  function setTrainingRange(range: Partial<TrainingRange>) {
    trainingRange.value = { ...trainingRange.value, ...range }
  }
  function toggleGrayscale() { isGrayscale.value = !isGrayscale.value }
  function toggleTheme() { theme.value = theme.value === 'dark' ? 'light' : 'dark' }

  return { locale, difficulty, trainingRange, isGrayscale, theme, pickerMode, difficultyLevel,
           setLocale, setDifficulty, setTrainingPreset, setTrainingRange, toggleGrayscale, toggleTheme }
})

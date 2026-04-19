export interface RGB { r: number; g: number; b: number }
export interface HSL { h: number; s: number; l: number }
export interface HSV { h: number; s: number; v: number }
export interface LAB { l: number; a: number; b: number }

export interface ColorData {
  rgb: RGB
  hsv: HSV
  hsl: HSL
  lab: LAB
  hex: string
}

export type DifficultyLevel = 'easy' | 'medium' | 'hard' | 'expert'

export interface DifficultyConfig {
  level: DifficultyLevel
  targetAreaPercent: number
  backgroundLevel: number
  colorContrast: 'random' | 'similar'
}

export interface TrainingRange {
  hueMin: number
  hueMax: number
  satMin: number
  satMax: number
  lightMin: number
  lightMax: number
}

export type TrainingPreset = 'full' | 'lowSaturation' | 'dark' | 'highSaturation' | 'complementary'

export type ScoreGrade = 'perfect' | 'excellent' | 'good' | 'poor' | 'fail'

export interface TrainingRecord {
  id: string
  timestamp: number
  targetColor: ColorData
  userColor: ColorData
  deltaE: number
  hueError: number
  satError: number
  lightError: number
  difficulty: DifficultyLevel
  score: ScoreGrade
  isGrayscale: boolean
}

export type GamePhase = 'idle' | 'playing' | 'result'

export interface HueBucket { count: number; totalDeltaE: number }
export interface SatBucket { count: number; totalDeltaE: number }
export interface LightBucket { count: number; totalDeltaE: number }

export interface AnalysisResult {
  avgDeltaE: number
  byHue: Record<string, HueBucket>
  bySat: Record<string, SatBucket>
  byLight: Record<string, LightBucket>
  byDifficulty: Record<DifficultyLevel, { count: number; totalDeltaE: number }>
  weakHueRanges: string[]
  recommendation: TrainingRange
}

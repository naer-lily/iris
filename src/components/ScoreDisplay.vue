<template>
  <div class="score-wrap" :class="'grade-' + score">
    <!-- Header -->
    <div class="score-header">
      <span class="grade-badge">{{ t('score.' + score) }}</span>
      <span class="delta-e">ΔE {{ deltaE.toFixed(2) }}</span>
    </div>

    <!-- Visual picker comparison -->
    <div class="picker-compare">
      <canvas ref="svCanvas" class="sv-canvas" :width="SV_W" :height="SV_H" />
      <canvas ref="hueCanvas" class="hue-canvas" :width="HUE_W" :height="SV_H" />
      <div class="picker-legend">
        <span class="dot dot-target" />{{ t('game.target') }}
        <span class="dot dot-user" style="margin-left:12px" />{{ t('game.yourColor') }}
      </div>
    </div>

    <!-- Numeric values -->
    <div class="color-compare">
      <div class="color-block">
        <div class="swatch" :style="{ background: targetColor.hex }" />
        <div class="color-label">{{ t('game.target') }}</div>
        <div class="cv">
          <div>HSL {{ targetColor.hsl.h.toFixed(0) }}° {{ targetColor.hsl.s.toFixed(0) }}% {{ targetColor.hsl.l.toFixed(0) }}%</div>
          <div>{{ targetColor.hex.toUpperCase() }}</div>
        </div>
      </div>
      <div class="color-block">
        <div class="swatch" :style="{ background: userColor.hex }" />
        <div class="color-label">{{ t('game.yourColor') }}</div>
        <div class="cv">
          <div>HSL {{ userColor.hsl.h.toFixed(0) }}° {{ userColor.hsl.s.toFixed(0) }}% {{ userColor.hsl.l.toFixed(0) }}%</div>
          <div>{{ userColor.hex.toUpperCase() }}</div>
        </div>
      </div>
    </div>

    <!-- Error row -->
    <div class="error-row">
      <div class="error-item">
        <span>{{ t('score.hueError') }}</span>
        <span class="err-val">{{ hueErr.toFixed(1) }}°</span>
      </div>
      <div class="error-item">
        <span>{{ t('score.satError') }}</span>
        <span class="err-val">{{ satErr.toFixed(1) }}%</span>
      </div>
      <div class="error-item">
        <span>{{ t('score.lightError') }}</span>
        <span class="err-val">{{ lightErr.toFixed(1) }}%</span>
      </div>
    </div>

    <button class="btn-next" @click="$emit('next')">{{ t('game.next') }}</button>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import type { ColorData, ScoreGrade } from '@/types'
import { hueError, rgbToHSV, hsvToRGB } from '@/utils/colorMath'

const { t } = useI18n()
defineEmits<{ (e: 'next'): void }>()
const props = defineProps<{
  score: ScoreGrade
  deltaE: number
  targetColor: ColorData
  userColor: ColorData
}>()

const hueErr = computed(() => hueError(props.targetColor.hsl.h, props.userColor.hsl.h))
const satErr = computed(() => Math.abs(props.targetColor.hsl.s - props.userColor.hsl.s))
const lightErr = computed(() => Math.abs(props.targetColor.hsl.l - props.userColor.hsl.l))

// ── Canvas refs ───────────────────────────────────────────────────────────
const svCanvas = ref<HTMLCanvasElement>()
const hueCanvas = ref<HTMLCanvasElement>()

const SV_W = 260, SV_H = 160, HUE_W = 16

// Colors for the two markers
const TARGET_COLOR = '#ffffff'
const USER_COLOR = '#f472b6'

function drawSV() {
  const canvas = svCanvas.value; if (!canvas) return
  const ctx = canvas.getContext('2d')!

  // Use target hue as the base for the SV gradient (most informative)
  const tHSV = rgbToHSV(props.targetColor.rgb)
  const uHSV = rgbToHSV(props.userColor.rgb)
  const baseHue = tHSV.h

  const hueRGB = hsvToRGB({ h: baseHue, s: 100, v: 100 })
  const hueStr = `rgb(${hueRGB.r},${hueRGB.g},${hueRGB.b})`

  // Draw SV gradient
  const gradH = ctx.createLinearGradient(0, 0, SV_W, 0)
  gradH.addColorStop(0, '#fff')
  gradH.addColorStop(1, hueStr)
  ctx.fillStyle = gradH
  ctx.fillRect(0, 0, SV_W, SV_H)

  const gradV = ctx.createLinearGradient(0, 0, 0, SV_H)
  gradV.addColorStop(0, 'rgba(0,0,0,0)')
  gradV.addColorStop(1, '#000')
  ctx.fillStyle = gradV
  ctx.fillRect(0, 0, SV_W, SV_H)

  // Draw connecting line between the two points
  const tx = (tHSV.s / 100) * SV_W
  const ty = (1 - tHSV.v / 100) * SV_H
  const ux = (uHSV.s / 100) * SV_W
  const uy = (1 - uHSV.v / 100) * SV_H

  ctx.beginPath()
  ctx.moveTo(tx, ty)
  ctx.lineTo(ux, uy)
  ctx.strokeStyle = 'rgba(255,255,255,0.5)'
  ctx.lineWidth = 1.5
  ctx.setLineDash([4, 3])
  ctx.stroke()
  ctx.setLineDash([])

  // Draw target marker (circle with white fill)
  drawMarker(ctx, tx, ty, TARGET_COLOR, props.targetColor.hex)
  // Draw user marker (circle with pink outline)
  drawMarker(ctx, ux, uy, USER_COLOR, props.userColor.hex)
}

function drawHue() {
  const canvas = hueCanvas.value; if (!canvas) return
  const ctx = canvas.getContext('2d')!

  // Hue gradient
  const grad = ctx.createLinearGradient(0, 0, 0, SV_H)
  ;[0, 60, 120, 180, 240, 300, 360].forEach(h => {
    const c = hsvToRGB({ h, s: 100, v: 100 })
    grad.addColorStop(h / 360, `rgb(${c.r},${c.g},${c.b})`)
  })
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, HUE_W, SV_H)

  const tHSV = rgbToHSV(props.targetColor.rgb)
  const uHSV = rgbToHSV(props.userColor.rgb)

  // Draw hue markers
  drawHueMarker(ctx, (tHSV.h / 360) * SV_H, TARGET_COLOR)
  drawHueMarker(ctx, (uHSV.h / 360) * SV_H, USER_COLOR)
}

function drawMarker(ctx: CanvasRenderingContext2D, x: number, y: number, outlineColor: string, fillColor: string) {
  ctx.beginPath()
  ctx.arc(x, y, 7, 0, Math.PI * 2)
  ctx.fillStyle = fillColor
  ctx.fill()
  ctx.strokeStyle = outlineColor
  ctx.lineWidth = 2.5
  ctx.stroke()
  // Inner dot
  ctx.beginPath()
  ctx.arc(x, y, 2, 0, Math.PI * 2)
  ctx.fillStyle = outlineColor
  ctx.fill()
}

function drawHueMarker(ctx: CanvasRenderingContext2D, y: number, color: string) {
  ctx.fillStyle = color
  ctx.strokeStyle = 'rgba(0,0,0,0.6)'
  ctx.lineWidth = 1
  // Triangle pointer
  ctx.beginPath()
  ctx.moveTo(0, y)
  ctx.lineTo(HUE_W * 0.6, y - 5)
  ctx.lineTo(HUE_W * 0.6, y + 5)
  ctx.closePath()
  ctx.fill()
  ctx.stroke()
}

function redraw() {
  drawSV()
  drawHue()
}

onMounted(redraw)
watch(() => [props.targetColor, props.userColor], redraw, { deep: true })
</script>

<style scoped>
.score-wrap {
  background: var(--c-surface); border-radius: 12px; padding: 20px;
  display: flex; flex-direction: column; gap: 14px; width: 100%;
  border: 2px solid var(--c-border); animation: fadeIn 0.3s ease;
}
@keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }

.score-header { display: flex; align-items: center; justify-content: space-between; }
.grade-badge {
  font-size: 20px; font-weight: 700; padding: 4px 14px; border-radius: 20px;
  background: var(--grade-color, var(--c-accent)); color: #fff;
}
.delta-e { font-size: 26px; font-weight: 700; color: var(--c-text); }
.grade-perfect  { --grade-color: #22c55e; }
.grade-excellent{ --grade-color: #84cc16; }
.grade-good     { --grade-color: #eab308; }
.grade-poor     { --grade-color: #f97316; }
.grade-fail     { --grade-color: #ef4444; }

/* Picker comparison */
.picker-compare { display: flex; gap: 6px; align-items: flex-start; flex-direction: column; }
.sv-canvas { border-radius: 6px; display: block; }
.hue-canvas { border-radius: 4px; display: block; }
.picker-legend {
  display: flex; align-items: center; gap: 4px;
  font-size: 11px; color: var(--c-muted);
}
.dot { display: inline-block; width: 10px; height: 10px; border-radius: 50%; border: 2px solid; }
.dot-target { background: #fff; border-color: #fff; box-shadow: 0 0 0 1px #888; }
.dot-user   { background: #f472b6; border-color: #f472b6; box-shadow: 0 0 0 1px #888; }

/* Wrap sv + hue side by side */
.picker-compare { flex-direction: row; flex-wrap: wrap; align-items: flex-end; }
.picker-legend { width: 100%; margin-top: 2px; }

/* Color values */
.color-compare { display: flex; gap: 12px; }
.color-block { flex: 1; display: flex; flex-direction: column; gap: 5px; }
.swatch { height: 44px; border-radius: 6px; border: 1px solid var(--c-border); }
.color-label { font-size: 11px; color: var(--c-muted); text-transform: uppercase; letter-spacing: 0.5px; }
.cv { font-size: 11px; color: var(--c-muted); line-height: 1.7; font-family: monospace; }

/* Error row */
.error-row { display: flex; gap: 10px; }
.error-item { flex: 1; background: var(--c-surface2); border-radius: 6px; padding: 8px; text-align: center; }
.error-item span { display: block; font-size: 11px; color: var(--c-muted); }
.err-val { font-size: 15px !important; font-weight: 600; color: var(--c-text) !important; }

.btn-next {
  padding: 10px; border-radius: 6px; border: 1px solid var(--c-accent);
  background: transparent; color: var(--c-accent); cursor: pointer; font-size: 14px; font-weight: 600;
  transition: background 0.15s;
}
.btn-next:hover { background: var(--c-accent); color: #fff; }
</style>

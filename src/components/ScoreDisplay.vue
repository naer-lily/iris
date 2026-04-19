<template>
  <div class="score-wrap" :class="'grade-' + score">
    <!-- Header -->
    <div class="score-header">
      <span class="grade-badge">{{ t('score.' + score) }}</span>
      <span class="delta-e">ΔE {{ deltaE.toFixed(2) }}</span>
    </div>

    <!-- Visual picker comparison -->
    <div class="picker-compare">
      <!-- Linear mode: SV rect + hue bar -->
      <template v-if="pickerMode === 'linear'">
        <canvas ref="svCanvas" class="sv-canvas" :width="SV_W" :height="SV_H" />
        <canvas ref="hueCanvas" class="hue-canvas" :width="HUE_W" :height="SV_H" />
      </template>
      <!-- Wheel mode: single wheel canvas -->
      <template v-else>
        <canvas ref="wheelCanvas" class="wheel-canvas" :width="WHEEL_SIZE" :height="WHEEL_SIZE" />
      </template>
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
import { storeToRefs } from 'pinia'
import type { ColorData, ScoreGrade } from '@/types'
import { hueError, hsvToRGB } from '@/utils/colorMath'
import { useSettingsStore } from '@/stores/settingsStore'

const { t } = useI18n()
defineEmits<{ (e: 'next'): void }>()
const props = defineProps<{
  score: ScoreGrade
  deltaE: number
  targetColor: ColorData
  userColor: ColorData
}>()

const { pickerMode } = storeToRefs(useSettingsStore())

const hueErr = computed(() => hueError(props.targetColor.hsl.h, props.userColor.hsl.h))
const satErr = computed(() => Math.abs(props.targetColor.hsl.s - props.userColor.hsl.s))
const lightErr = computed(() => Math.abs(props.targetColor.hsl.l - props.userColor.hsl.l))

// ── Canvas refs ───────────────────────────────────────────────────────────
const svCanvas   = ref<HTMLCanvasElement>()
const hueCanvas  = ref<HTMLCanvasElement>()
const wheelCanvas = ref<HTMLCanvasElement>()

const SV_W = 260, SV_H = 160, HUE_W = 16
const WHEEL_SIZE = 200, RING_W = 20

const TARGET_COLOR = '#ffffff'
const USER_COLOR   = '#f472b6'

// ── Linear: SV rect ───────────────────────────────────────────────────────
function drawSV() {
  const canvas = svCanvas.value; if (!canvas) return
  const ctx = canvas.getContext('2d')!
  const tHSV = props.targetColor.hsv
  const uHSV = props.userColor.hsv

  const hueRGB = hsvToRGB({ h: tHSV.h, s: 100, v: 100 })
  const gradH = ctx.createLinearGradient(0, 0, SV_W, 0)
  gradH.addColorStop(0, '#fff')
  gradH.addColorStop(1, `rgb(${hueRGB.r},${hueRGB.g},${hueRGB.b})`)
  ctx.fillStyle = gradH; ctx.fillRect(0, 0, SV_W, SV_H)
  const gradV = ctx.createLinearGradient(0, 0, 0, SV_H)
  gradV.addColorStop(0, 'rgba(0,0,0,0)'); gradV.addColorStop(1, '#000')
  ctx.fillStyle = gradV; ctx.fillRect(0, 0, SV_W, SV_H)

  const tx = (tHSV.s / 100) * SV_W, ty = (1 - tHSV.v / 100) * SV_H
  const ux = (uHSV.s / 100) * SV_W, uy = (1 - uHSV.v / 100) * SV_H
  ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(ux, uy)
  ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 1.5
  ctx.setLineDash([4, 3]); ctx.stroke(); ctx.setLineDash([])
  drawMarker(ctx, tx, ty, TARGET_COLOR, props.targetColor.hex)
  drawMarker(ctx, ux, uy, USER_COLOR,   props.userColor.hex)
}

// ── Linear: hue bar ───────────────────────────────────────────────────────
function drawHue() {
  const canvas = hueCanvas.value; if (!canvas) return
  const ctx = canvas.getContext('2d')!
  const grad = ctx.createLinearGradient(0, 0, 0, SV_H)
  ;[0, 60, 120, 180, 240, 300, 360].forEach(h => {
    const c = hsvToRGB({ h, s: 100, v: 100 })
    grad.addColorStop(h / 360, `rgb(${c.r},${c.g},${c.b})`)
  })
  ctx.fillStyle = grad; ctx.fillRect(0, 0, HUE_W, SV_H)
  drawHueMarker(ctx, (props.targetColor.hsv.h / 360) * SV_H, TARGET_COLOR)
  drawHueMarker(ctx, (props.userColor.hsv.h   / 360) * SV_H, USER_COLOR)
}

// ── Wheel ─────────────────────────────────────────────────────────────────
function drawWheel() {
  const canvas = wheelCanvas.value; if (!canvas) return
  const ctx = canvas.getContext('2d')!
  const cx = WHEEL_SIZE / 2, cy = WHEEL_SIZE / 2
  const outerR = WHEEL_SIZE / 2, innerRing = outerR - RING_W

  // Hue ring
  const steps = 360
  for (let i = 0; i < steps; i++) {
    const a0 = (i / steps) * Math.PI * 2 - Math.PI / 2
    const a1 = ((i + 1) / steps) * Math.PI * 2 - Math.PI / 2
    const c = hsvToRGB({ h: i, s: 100, v: 100 })
    ctx.beginPath()
    ctx.moveTo(cx + innerRing * Math.cos(a0), cy + innerRing * Math.sin(a0))
    ctx.arc(cx, cy, outerR, a0, a1)
    ctx.arc(cx, cy, innerRing, a1, a0, true)
    ctx.closePath()
    ctx.fillStyle = `rgb(${c.r},${c.g},${c.b})`
    ctx.fill()
  }

  // SV rect inscribed in inner circle
  const half = innerRing / Math.SQRT2
  const rx = cx - half, ry = cy - half, rw = half * 2, rh = half * 2
  const tHSV = props.targetColor.hsv
  const hueRGB = hsvToRGB({ h: tHSV.h, s: 100, v: 100 })
  const gradH = ctx.createLinearGradient(rx, 0, rx + rw, 0)
  gradH.addColorStop(0, '#fff')
  gradH.addColorStop(1, `rgb(${hueRGB.r},${hueRGB.g},${hueRGB.b})`)
  ctx.fillStyle = gradH; ctx.fillRect(rx, ry, rw, rh)
  const gradV = ctx.createLinearGradient(0, ry, 0, ry + rh)
  gradV.addColorStop(0, 'rgba(0,0,0,0)'); gradV.addColorStop(1, '#000')
  ctx.fillStyle = gradV; ctx.fillRect(rx, ry, rw, rh)

  // SV markers
  const uHSV = props.userColor.hsv
  const tx = rx + (tHSV.s / 100) * rw, ty = ry + (1 - tHSV.v / 100) * rh
  const ux = rx + (uHSV.s / 100) * rw, uy = ry + (1 - uHSV.v / 100) * rh
  ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(ux, uy)
  ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 1.5
  ctx.setLineDash([4, 3]); ctx.stroke(); ctx.setLineDash([])
  drawMarker(ctx, tx, ty, TARGET_COLOR, props.targetColor.hex)
  drawMarker(ctx, ux, uy, USER_COLOR,   props.userColor.hex)

  // Hue ring markers
  const ringR = outerR - RING_W / 2
  const ta = (tHSV.h - 90) * Math.PI / 180
  const ua = (uHSV.h  - 90) * Math.PI / 180
  drawRingMarker(ctx, cx + ringR * Math.cos(ta), cy + ringR * Math.sin(ta), TARGET_COLOR)
  drawRingMarker(ctx, cx + ringR * Math.cos(ua), cy + ringR * Math.sin(ua), USER_COLOR)
}

// ── Shared marker helpers ─────────────────────────────────────────────────
function drawMarker(ctx: CanvasRenderingContext2D, x: number, y: number, outline: string, fill: string) {
  ctx.beginPath(); ctx.arc(x, y, 7, 0, Math.PI * 2)
  ctx.fillStyle = fill; ctx.fill()
  ctx.strokeStyle = outline; ctx.lineWidth = 2.5; ctx.stroke()
  ctx.beginPath(); ctx.arc(x, y, 2, 0, Math.PI * 2)
  ctx.fillStyle = outline; ctx.fill()
}
function drawHueMarker(ctx: CanvasRenderingContext2D, y: number, color: string) {
  ctx.fillStyle = color; ctx.strokeStyle = 'rgba(0,0,0,0.6)'; ctx.lineWidth = 1
  ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(HUE_W * 0.6, y - 5); ctx.lineTo(HUE_W * 0.6, y + 5)
  ctx.closePath(); ctx.fill(); ctx.stroke()
}
function drawRingMarker(ctx: CanvasRenderingContext2D, x: number, y: number, color: string) {
  ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2)
  ctx.fillStyle = color; ctx.fill()
  ctx.strokeStyle = 'rgba(0,0,0,0.6)'; ctx.lineWidth = 1.5; ctx.stroke()
}

function redraw() {
  if (pickerMode.value === 'wheel') drawWheel()
  else { drawSV(); drawHue() }
}

onMounted(redraw)
watch(() => [props.targetColor, props.userColor, pickerMode.value], redraw, { deep: true })

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
.picker-compare { display: flex; gap: 6px; align-items: flex-end; flex-wrap: wrap; }
.sv-canvas { border-radius: 6px; display: block; }
.hue-canvas { border-radius: 4px; display: block; }
.wheel-canvas { border-radius: 50%; display: block; }
.picker-legend {
  width: 100%; display: flex; align-items: center; gap: 4px;
  font-size: 11px; color: var(--c-muted); margin-top: 2px;
}

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

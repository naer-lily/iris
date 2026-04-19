<template>
  <div class="cp-wrap">
    <!-- ── Linear mode ── -->
    <template v-if="mode === 'linear'">
      <div class="cp-main">
        <div class="cp-sv" ref="svRef" @mousedown="svDown" @touchstart.prevent="svTouchDown">
          <canvas ref="svCanvas" class="cp-sv-canvas" />
          <div class="cp-sv-cursor" :style="{ left: svCursorX + 'px', top: svCursorY + 'px' }" />
        </div>
        <div class="cp-hue" ref="hueRef" @mousedown="hueDown" @touchstart.prevent="hueTouchDown">
          <canvas ref="hueCanvas" class="cp-hue-canvas" />
          <div class="cp-hue-cursor" :style="{ top: hueCursorY + 'px' }" />
        </div>
      </div>
    </template>

    <!-- ── Wheel mode ── -->
    <template v-else>
      <div class="cp-wheel-wrap" ref="wheelRef"
           @mousedown="wheelDown" @touchstart.prevent="wheelTouchDown">
        <canvas ref="wheelCanvas" class="cp-wheel-canvas" />
        <!-- SV cursor inside the inner rect -->
        <div class="cp-sv-cursor cp-sv-cursor-abs"
             :style="{ left: wheelSvCursorX + 'px', top: wheelSvCursorY + 'px' }" />
        <!-- Hue ring cursor -->
        <div class="cp-ring-cursor"
             :style="{ left: ringCursorX + 'px', top: ringCursorY + 'px' }" />
      </div>
    </template>

    <!-- Preview strip (both modes) -->
    <div class="cp-preview" :style="{ background: hex }" />

    <!-- Inputs (both modes) -->
    <div class="cp-inputs">
      <div class="cp-input-group">
        <span>H</span>
        <input type="number" :value="Math.round(hsv.h)" min="0" max="360"
               @change="e => setH(+(e.target as HTMLInputElement).value)" />
      </div>
      <div class="cp-input-group">
        <span>S</span>
        <input type="number" :value="Math.round(hsv.s)" min="0" max="100"
               @change="e => setS(+(e.target as HTMLInputElement).value)" />
      </div>
      <div class="cp-input-group">
        <span>V</span>
        <input type="number" :value="Math.round(hsv.v)" min="0" max="100"
               @change="e => setV(+(e.target as HTMLInputElement).value)" />
      </div>
    </div>
    <div class="cp-inputs">
      <div class="cp-input-group">
        <span>R</span>
        <input type="number" :value="rgb.r" min="0" max="255"
               @change="e => setRGB('r', +(e.target as HTMLInputElement).value)" />
      </div>
      <div class="cp-input-group">
        <span>G</span>
        <input type="number" :value="rgb.g" min="0" max="255"
               @change="e => setRGB('g', +(e.target as HTMLInputElement).value)" />
      </div>
      <div class="cp-input-group">
        <span>B</span>
        <input type="number" :value="rgb.b" min="0" max="255"
               @change="e => setRGB('b', +(e.target as HTMLInputElement).value)" />
      </div>
    </div>
    <div class="cp-inputs">
      <div class="cp-input-group cp-hex-group">
        <span>#</span>
        <input type="text" :value="hex.slice(1)" maxlength="6"
               @change="e => setHex((e.target as HTMLInputElement).value)" />
      </div>
      <div class="cp-input-group">
        <span>L</span>
        <input type="number" :value="Math.round(hsl.l)" min="0" max="100" readonly />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted, nextTick } from 'vue'
import { hsvToRGB, rgbToHSL, rgbToHex, hexToRGB, rgbToHSV, buildColorDataFromHSV } from '@/utils/colorMath'
import type { ColorData } from '@/types'

const emit = defineEmits<{ (e: 'update:color', v: ColorData): void }>()
const props = defineProps<{ color?: ColorData; mode?: 'linear' | 'wheel' }>()

// ── Shared state ──────────────────────────────────────────────────────────
const SV_W = 224, SV_H = 200, HUE_W = 16, HUE_H = 200

const hsv = reactive({ h: 0, s: 100, v: 100 })
const rgb = computed(() => hsvToRGB(hsv))
const hsl = computed(() => rgbToHSL(rgb.value))
const hex = computed(() => rgbToHex(rgb.value))
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v))

function emit_color() { emit('update:color', buildColorDataFromHSV({ ...hsv })) }

// ── Linear mode refs ──────────────────────────────────────────────────────
const svCanvas = ref<HTMLCanvasElement>()
const hueCanvas = ref<HTMLCanvasElement>()
const svRef = ref<HTMLElement>()
const hueRef = ref<HTMLElement>()

const svCursorX = computed(() => (hsv.s / 100) * SV_W)
const svCursorY = computed(() => (1 - hsv.v / 100) * SV_H)
const hueCursorY = computed(() => (hsv.h / 360) * HUE_H)

function drawSV() {
  const canvas = svCanvas.value; if (!canvas) return
  const ctx = canvas.getContext('2d')!
  canvas.width = SV_W; canvas.height = SV_H
  const hueRGB = hsvToRGB({ h: hsv.h, s: 100, v: 100 })
  const gradH = ctx.createLinearGradient(0, 0, SV_W, 0)
  gradH.addColorStop(0, '#fff')
  gradH.addColorStop(1, `rgb(${hueRGB.r},${hueRGB.g},${hueRGB.b})`)
  ctx.fillStyle = gradH; ctx.fillRect(0, 0, SV_W, SV_H)
  const gradV = ctx.createLinearGradient(0, 0, 0, SV_H)
  gradV.addColorStop(0, 'rgba(0,0,0,0)'); gradV.addColorStop(1, '#000')
  ctx.fillStyle = gradV; ctx.fillRect(0, 0, SV_W, SV_H)
}
function drawHue() {
  const canvas = hueCanvas.value; if (!canvas) return
  const ctx = canvas.getContext('2d')!
  canvas.width = HUE_W; canvas.height = HUE_H
  const grad = ctx.createLinearGradient(0, 0, 0, HUE_H)
  ;[0, 60, 120, 180, 240, 300, 360].forEach(h => {
    const c = hsvToRGB({ h, s: 100, v: 100 })
    grad.addColorStop(h / 360, `rgb(${c.r},${c.g},${c.b})`)
  })
  ctx.fillStyle = grad; ctx.fillRect(0, 0, HUE_W, HUE_H)
}

function svFromEvent(e: MouseEvent | Touch) {
  const rect = svRef.value!.getBoundingClientRect()
  hsv.s = clamp((e.clientX - rect.left) / SV_W * 100, 0, 100)
  hsv.v = clamp((1 - (e.clientY - rect.top) / SV_H) * 100, 0, 100)
  emit_color()
}
function hueFromEvent(e: MouseEvent | Touch) {
  const rect = hueRef.value!.getBoundingClientRect()
  hsv.h = clamp((e.clientY - rect.top) / HUE_H * 360, 0, 360)
  drawSV(); emit_color()
}
function svDown(e: MouseEvent) {
  svFromEvent(e)
  const move = (ev: MouseEvent) => svFromEvent(ev)
  const up = () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up) }
  window.addEventListener('mousemove', move); window.addEventListener('mouseup', up)
}
function svTouchDown(e: TouchEvent) {
  svFromEvent(e.touches[0])
  const move = (ev: TouchEvent) => svFromEvent(ev.touches[0])
  const up = () => { window.removeEventListener('touchmove', move); window.removeEventListener('touchend', up) }
  window.addEventListener('touchmove', move); window.addEventListener('touchend', up)
}
function hueDown(e: MouseEvent) {
  hueFromEvent(e)
  const move = (ev: MouseEvent) => hueFromEvent(ev)
  const up = () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up) }
  window.addEventListener('mousemove', move); window.addEventListener('mouseup', up)
}
function hueTouchDown(e: TouchEvent) {
  hueFromEvent(e.touches[0])
  const move = (ev: TouchEvent) => hueFromEvent(ev.touches[0])
  const up = () => { window.removeEventListener('touchmove', move); window.removeEventListener('touchend', up) }
  window.addEventListener('touchmove', move); window.addEventListener('touchend', up)
}

// ── Wheel mode ────────────────────────────────────────────────────────────
const WHEEL_SIZE = 250          // canvas px (square)
const RING_W = 24               // ring thickness px

const wheelCanvas = ref<HTMLCanvasElement>()
const wheelRef = ref<HTMLElement>()

// Inner SV rect geometry (centered square inscribed in inner circle)
const innerR = WHEEL_SIZE / 2 - RING_W - 4
const SV_RECT = computed(() => {
  const half = innerR / Math.SQRT2
  const cx = WHEEL_SIZE / 2, cy = WHEEL_SIZE / 2
  return { x: cx - half, y: cy - half, w: half * 2, h: half * 2 }
})

// Cursor positions in wheel canvas coords
const wheelSvCursorX = computed(() => SV_RECT.value.x + (hsv.s / 100) * SV_RECT.value.w)
const wheelSvCursorY = computed(() => SV_RECT.value.y + (1 - hsv.v / 100) * SV_RECT.value.h)
const ringCursorX = computed(() => {
  const cx = WHEEL_SIZE / 2, r = WHEEL_SIZE / 2 - RING_W / 2
  return cx + r * Math.cos((hsv.h - 90) * Math.PI / 180)
})
const ringCursorY = computed(() => {
  const cy = WHEEL_SIZE / 2, r = WHEEL_SIZE / 2 - RING_W / 2
  return cy + r * Math.sin((hsv.h - 90) * Math.PI / 180)
})

function drawWheel() {
  const canvas = wheelCanvas.value; if (!canvas) return
  const ctx = canvas.getContext('2d')!
  canvas.width = WHEEL_SIZE; canvas.height = WHEEL_SIZE
  const cx = WHEEL_SIZE / 2, cy = WHEEL_SIZE / 2
  const outerR = WHEEL_SIZE / 2
  const innerRing = outerR - RING_W

  // Draw hue ring using conic gradient via arc segments
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

  // Draw SV rect inside
  const { x, y, w, h } = SV_RECT.value
  const hueRGB = hsvToRGB({ h: hsv.h, s: 100, v: 100 })
  const gradH = ctx.createLinearGradient(x, 0, x + w, 0)
  gradH.addColorStop(0, '#fff')
  gradH.addColorStop(1, `rgb(${hueRGB.r},${hueRGB.g},${hueRGB.b})`)
  ctx.fillStyle = gradH; ctx.fillRect(x, y, w, h)
  const gradV = ctx.createLinearGradient(0, y, 0, y + h)
  gradV.addColorStop(0, 'rgba(0,0,0,0)'); gradV.addColorStop(1, '#000')
  ctx.fillStyle = gradV; ctx.fillRect(x, y, w, h)
}

type DragTarget = 'ring' | 'sv' | null
let wheelDragTarget: DragTarget = null

function hitTest(ex: number, ey: number): DragTarget {
  const cx = WHEEL_SIZE / 2, cy = WHEEL_SIZE / 2
  const dx = ex - cx, dy = ey - cy
  const dist = Math.sqrt(dx * dx + dy * dy)
  const outerR = WHEEL_SIZE / 2, innerRing = outerR - RING_W
  if (dist >= innerRing - 2 && dist <= outerR + 2) return 'ring'
  const { x, y, w, h } = SV_RECT.value
  if (ex >= x && ex <= x + w && ey >= y && ey <= y + h) return 'sv'
  // Allow dragging anywhere inside inner circle for SV
  if (dist < innerRing) return 'sv'
  return null
}

function applyWheelEvent(ex: number, ey: number, target: DragTarget) {
  const cx = WHEEL_SIZE / 2, cy = WHEEL_SIZE / 2
  if (target === 'ring') {
    const angle = Math.atan2(ey - cy, ex - cx) * 180 / Math.PI + 90
    hsv.h = (angle + 360) % 360
    drawWheel()
  } else if (target === 'sv') {
    const { x, y, w, h } = SV_RECT.value
    hsv.s = clamp((ex - x) / w * 100, 0, 100)
    hsv.v = clamp((1 - (ey - y) / h) * 100, 0, 100)
  }
  emit_color()
}

function canvasXY(e: MouseEvent | Touch): [number, number] {
  const rect = wheelRef.value!.getBoundingClientRect()
  const scaleX = WHEEL_SIZE / rect.width
  const scaleY = WHEEL_SIZE / rect.height
  return [(e.clientX - rect.left) * scaleX, (e.clientY - rect.top) * scaleY]
}

function wheelDown(e: MouseEvent) {
  const [ex, ey] = canvasXY(e)
  wheelDragTarget = hitTest(ex, ey)
  if (!wheelDragTarget) return
  applyWheelEvent(ex, ey, wheelDragTarget)
  const move = (ev: MouseEvent) => { const [x, y] = canvasXY(ev); applyWheelEvent(x, y, wheelDragTarget) }
  const up = () => { wheelDragTarget = null; window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up) }
  window.addEventListener('mousemove', move); window.addEventListener('mouseup', up)
}
function wheelTouchDown(e: TouchEvent) {
  const [ex, ey] = canvasXY(e.touches[0])
  wheelDragTarget = hitTest(ex, ey)
  if (!wheelDragTarget) return
  applyWheelEvent(ex, ey, wheelDragTarget)
  const move = (ev: TouchEvent) => { const [x, y] = canvasXY(ev.touches[0]); applyWheelEvent(x, y, wheelDragTarget) }
  const up = () => { wheelDragTarget = null; window.removeEventListener('touchmove', move); window.removeEventListener('touchend', up) }
  window.addEventListener('touchmove', move); window.addEventListener('touchend', up)
}

// ── Input setters (shared) ────────────────────────────────────────────────
function setH(v: number) { hsv.h = clamp(v, 0, 360); redraw(); emit_color() }
function setS(v: number) { hsv.s = clamp(v, 0, 100); emit_color() }
function setV(v: number) { hsv.v = clamp(v, 0, 100); emit_color() }
function setRGB(ch: 'r' | 'g' | 'b', v: number) {
  const c = { ...rgb.value, [ch]: clamp(v, 0, 255) }
  const h = rgbToHSV(c); hsv.h = h.h; hsv.s = h.s; hsv.v = h.v
  redraw(); emit_color()
}
function setHex(v: string) {
  if (v.length !== 6) return
  const c = hexToRGB('#' + v)
  const h = rgbToHSV(c); hsv.h = h.h; hsv.s = h.s; hsv.v = h.v
  redraw(); emit_color()
}

function redraw() {
  if (props.mode === 'wheel') drawWheel()
  else { drawSV(); drawHue() }
}

// ── Sync from prop — use stored HSV to avoid lossy RGB round-trip ─────────
watch(() => props.color, (c) => {
  if (!c) return
  // Prefer stored HSV; fall back to RGB conversion only if hsv absent
  const h = c.hsv ?? rgbToHSV(c.rgb)
  hsv.h = h.h; hsv.s = h.s; hsv.v = h.v
  nextTick(redraw)
})
watch(() => props.mode, () => nextTick(redraw))

onMounted(() => { drawSV(); drawHue(); drawWheel() })
</script>

<style scoped>
.cp-wrap { display: flex; flex-direction: column; gap: 6px; user-select: none; width: 250px; }

/* ── Linear mode ── */
.cp-main { display: flex; gap: 8px; }
.cp-sv { position: relative; width: 224px; height: 200px; cursor: crosshair; border-radius: 4px; overflow: hidden; flex-shrink: 0; }
.cp-sv-canvas { display: block; width: 100%; height: 100%; }
.cp-sv-cursor {
  position: absolute; width: 10px; height: 10px; border-radius: 50%;
  border: 2px solid #fff; box-shadow: 0 0 0 1px #000;
  transform: translate(-50%, -50%); pointer-events: none;
}
.cp-hue { position: relative; width: 16px; height: 200px; cursor: ns-resize; border-radius: 4px; overflow: hidden; flex-shrink: 0; }
.cp-hue-canvas { display: block; width: 100%; height: 100%; }
.cp-hue-cursor {
  position: absolute; left: 0; right: 0; height: 3px;
  background: rgba(255,255,255,0.9); box-shadow: 0 0 0 1px #000;
  transform: translateY(-50%); pointer-events: none;
}

/* ── Wheel mode ── */
.cp-wheel-wrap {
  position: relative; width: 250px; height: 250px;
  cursor: crosshair; flex-shrink: 0;
}
.cp-wheel-canvas { display: block; width: 100%; height: 100%; }
.cp-sv-cursor-abs {
  position: absolute; width: 10px; height: 10px; border-radius: 50%;
  border: 2px solid #fff; box-shadow: 0 0 0 1px #000;
  transform: translate(-50%, -50%); pointer-events: none;
}
.cp-ring-cursor {
  position: absolute; width: 12px; height: 12px; border-radius: 50%;
  border: 2.5px solid #fff; box-shadow: 0 0 0 1.5px #000;
  transform: translate(-50%, -50%); pointer-events: none;
}

/* ── Shared ── */
.cp-preview { height: 24px; border-radius: 4px; border: 1px solid var(--c-border); }
.cp-inputs { display: flex; gap: 4px; }
.cp-input-group { display: flex; align-items: center; gap: 3px; flex: 1; min-width: 0; }
.cp-input-group span { font-size: 11px; color: var(--c-muted); min-width: 10px; flex-shrink: 0; }
.cp-input-group input {
  width: 100%; min-width: 0; background: var(--c-surface2); border: 1px solid var(--c-border);
  color: var(--c-text); border-radius: 3px; padding: 2px 4px; font-size: 12px;
}
.cp-hex-group { flex: 2; }
</style>

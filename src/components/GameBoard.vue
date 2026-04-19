<template>
  <div class="game-board">
    <!-- Idle -->
    <div v-if="phase === 'idle'" class="idle-prompt">
      <button class="btn-primary btn-start" @click="startRound">{{ t('game.start') }}</button>
    </div>

    <!-- Playing: target+user left, picker right -->
    <div v-else-if="phase === 'playing'" class="playing-layout">
      <!-- Left: color swatches -->
      <div class="swatches-col">
        <div class="swatch-block">
          <div class="swatch-label">{{ t('game.target') }}</div>
          <div class="target-area" :style="targetAreaStyle">
            <canvas ref="bgCanvas" class="bg-canvas" />
            <div class="target-patch" :style="patchStyle" />
          </div>
        </div>
        <div class="swatch-block">
          <div class="swatch-label">{{ t('game.yourColor') }}</div>
          <div class="user-swatch" :style="{ background: userColor?.hex ?? 'var(--c-surface2)' }" />
        </div>
        <button class="btn-primary btn-submit" @click="submitGuess">{{ t('game.submit') }}</button>
      </div>

      <!-- Right: picker -->
      <div class="picker-col">
        <ColorPicker :color="userColor ?? undefined" :mode="settings.pickerMode" @update:color="setUserColor" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'
import { useGameStore } from '@/stores/gameStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { drawBackground } from '@/utils/background'
import ColorPicker from './ColorPicker.vue'

const { t } = useI18n()
const game = useGameStore()
const settings = useSettingsStore()
const { phase, targetColor, userColor } = storeToRefs(game)
const { startRound, setUserColor, submitGuess } = game

const bgCanvas = ref<HTMLCanvasElement>()

const BOARD_W = 250, BOARD_H = 180

const patchStyle = computed(() => {
  if (!targetColor.value) return {}
  const pct = settings.difficulty.targetAreaPercent
  const size = Math.sqrt(pct / 100) * 100
  return {
    background: targetColor.value.hex,
    width: size + '%',
    paddingBottom: size + '%',
    borderRadius: '4px',
  }
})

const targetAreaStyle = computed(() => ({
  width: BOARD_W + 'px',
  height: BOARD_H + 'px',
}))

function redrawBackground() {
  nextTick(() => {
    const canvas = bgCanvas.value; if (!canvas) return
    canvas.width = BOARD_W; canvas.height = BOARD_H
    if (!targetColor.value) return
    drawBackground(canvas, {
      level: settings.difficulty.backgroundLevel,
      targetHex: targetColor.value.hex,
      colorContrast: settings.difficulty.colorContrast,
      targetHue: targetColor.value.hsl.h,
    })
  })
}

watch(() => game.targetColor, redrawBackground)
watch(() => settings.difficulty, redrawBackground, { deep: true })
onMounted(redrawBackground)
</script>

<style scoped>
.game-board { width: 100%; }

.idle-prompt { display: flex; justify-content: center; padding: 40px 0; }

.playing-layout {
  display: flex; gap: 24px; align-items: flex-start;
  justify-content: center;
}

/* Left column: fixed 250px to match picker width */
.swatches-col { display: flex; flex-direction: column; gap: 10px; width: 250px; flex-shrink: 0; }

.swatch-label { font-size: 11px; color: var(--c-muted); text-transform: uppercase; letter-spacing: 0.5px; }

.target-area {
  position: relative; border-radius: 8px; overflow: hidden;
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 4px 20px rgba(0,0,0,0.25); flex-shrink: 0;
}
.bg-canvas { position: absolute; inset: 0; width: 100%; height: 100%; }
.target-patch { position: relative; z-index: 1; box-shadow: 0 2px 12px rgba(0,0,0,0.3); }

.user-swatch {
  height: 72px; border-radius: 8px;
  border: 1px solid var(--c-border);
  transition: background 0.1s;
}

/* Right column: picker (self-sizes to 250px via cp-wrap) */
.picker-col { flex-shrink: 0; }

.btn-primary {
  padding: 10px; border-radius: 6px; border: none; cursor: pointer;
  font-size: 15px; font-weight: 600; letter-spacing: 0.5px; width: 100%;
  background: var(--c-accent); color: #fff; transition: opacity 0.15s;
}
.btn-primary:hover { opacity: 0.85; }
.btn-start { padding: 14px 48px; font-size: 18px; width: auto; }
</style>

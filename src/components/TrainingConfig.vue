<template>
  <details class="tc-wrap">
    <summary class="tc-title">{{ t('training.rangeTitle') }}</summary>
    <div class="tc-body">
      <!-- Presets -->
      <div class="tc-row">
        <span class="tc-label">{{ t('training.presets') }}</span>
        <div class="tc-presets">
          <button
            v-for="p in presets" :key="p.key"
            class="preset-btn"
            @click="settings.setTrainingPreset(p.key)"
          >{{ t('training.' + p.i18n) }}</button>
        </div>
      </div>

      <!-- Hue -->
      <div class="tc-row">
        <span class="tc-label">{{ t('training.hue') }}</span>
        <div class="tc-range-inputs">
          <input type="range" min="0" max="360" :value="r.hueMin"
                 @input="e => set('hueMin', +(e.target as HTMLInputElement).value)" />
          <input type="range" min="0" max="360" :value="r.hueMax"
                 @input="e => set('hueMax', +(e.target as HTMLInputElement).value)" />
          <span class="tc-val">{{ r.hueMin.toFixed(0) }}° – {{ r.hueMax.toFixed(0) }}°</span>
        </div>
      </div>

      <!-- Saturation -->
      <div class="tc-row">
        <span class="tc-label">{{ t('training.saturation') }}</span>
        <div class="tc-range-inputs">
          <input type="range" min="0" max="100" :value="r.satMin"
                 @input="e => set('satMin', +(e.target as HTMLInputElement).value)" />
          <input type="range" min="0" max="100" :value="r.satMax"
                 @input="e => set('satMax', +(e.target as HTMLInputElement).value)" />
          <span class="tc-val">{{ r.satMin.toFixed(0) }}% – {{ r.satMax.toFixed(0) }}%</span>
        </div>
      </div>

      <!-- Lightness -->
      <div class="tc-row">
        <span class="tc-label">{{ t('training.lightness') }}</span>
        <div class="tc-range-inputs">
          <input type="range" min="0" max="100" :value="r.lightMin"
                 @input="e => set('lightMin', +(e.target as HTMLInputElement).value)" />
          <input type="range" min="0" max="100" :value="r.lightMax"
                 @input="e => set('lightMax', +(e.target as HTMLInputElement).value)" />
          <span class="tc-val">{{ r.lightMin.toFixed(0) }}% – {{ r.lightMax.toFixed(0) }}%</span>
        </div>
      </div>
    </div>
  </details>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useSettingsStore } from '@/stores/settingsStore'
import type { TrainingRange } from '@/types'

const { t } = useI18n()
const settings = useSettingsStore()
const r = computed(() => settings.trainingRange)

const presets = [
  { key: 'full', i18n: 'presetFull' },
  { key: 'lowSaturation', i18n: 'presetLowSat' },
  { key: 'dark', i18n: 'presetDark' },
  { key: 'highSaturation', i18n: 'presetHighSat' },
  { key: 'complementary', i18n: 'presetComplementary' },
]

function set(key: keyof TrainingRange, val: number) {
  settings.setTrainingRange({ [key]: val })
}
</script>

<style scoped>
.tc-wrap { border: 1px solid var(--c-border); border-radius: 8px; padding: 0; }
summary.tc-title {
  padding: 10px 14px; cursor: pointer; font-size: 13px; font-weight: 600;
  color: var(--c-muted); list-style: none; user-select: none;
}
summary.tc-title::before { content: '▶ '; font-size: 10px; }
details[open] summary.tc-title::before { content: '▼ '; }
.tc-body { padding: 12px 14px; display: flex; flex-direction: column; gap: 10px; }
.tc-row { display: flex; align-items: flex-start; gap: 10px; }
.tc-label { font-size: 12px; color: var(--c-muted); min-width: 60px; padding-top: 4px; }
.tc-range-inputs { display: flex; flex-direction: column; gap: 4px; flex: 1; }
.tc-range-inputs input[type=range] { width: 100%; accent-color: var(--c-accent); }
.tc-val { font-size: 11px; color: var(--c-muted); font-family: monospace; }
.tc-presets { display: flex; flex-wrap: wrap; gap: 4px; }
.preset-btn {
  padding: 3px 10px; border-radius: 12px; border: 1px solid var(--c-border);
  background: var(--c-surface2); color: var(--c-muted); cursor: pointer; font-size: 11px;
  transition: all 0.15s;
}
.preset-btn:hover { background: var(--c-accent); color: #fff; border-color: var(--c-accent); }
</style>

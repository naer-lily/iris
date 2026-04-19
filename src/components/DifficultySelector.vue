<template>
  <div class="diff-sel">
    <span class="diff-label">{{ t('difficulty.label') }}</span>
    <div class="diff-btns">
      <button
        v-for="lvl in levels" :key="lvl"
        :class="['diff-btn', { active: current === lvl }]"
        @click="settings.setDifficulty(lvl)"
      >{{ t('difficulty.' + lvl) }}</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useSettingsStore } from '@/stores/settingsStore'
import type { DifficultyLevel } from '@/types'

const { t } = useI18n()
const settings = useSettingsStore()
const levels: DifficultyLevel[] = ['easy', 'medium', 'hard', 'expert']
const current = computed(() => settings.difficulty.level)
</script>

<style scoped>
.diff-sel { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.diff-label { font-size: 13px; color: var(--c-muted); }
.diff-btns { display: flex; gap: 4px; }
.diff-btn {
  padding: 5px 14px; border-radius: 20px; border: 1px solid var(--c-border);
  background: var(--c-surface2); color: var(--c-muted); cursor: pointer; font-size: 13px;
  transition: all 0.15s;
}
.diff-btn.active, .diff-btn:hover { background: var(--c-accent); color: #fff; border-color: var(--c-accent); }
</style>

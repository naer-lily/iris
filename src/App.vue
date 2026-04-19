<template>
  <div class="app-shell" :data-theme="settings.theme">
    <!-- Header -->
    <header class="app-header">
      <div class="logo">iris <span class="logo-sub">色彩训练</span></div>
      <nav class="app-nav">
        <button v-for="tab in tabs" :key="tab.key"
          :class="['nav-btn', { active: activeTab === tab.key }]"
          @click="setTab(tab.key)">
          {{ t('nav.' + tab.key) }}
        </button>
        <button class="theme-btn" :title="t('settings.toggleTheme')" @click="settings.toggleTheme()">
          {{ settings.theme === 'dark' ? '☀️' : '🌙' }}
        </button>
      </nav>
    </header>

    <!-- Main -->
    <main class="app-main">
      <!-- Game tab -->
      <template v-if="activeTab === 'game'">
        <div class="game-controls">
          <DifficultySelector />
          <label class="gs-toggle">
            <input type="checkbox" :checked="settings.isGrayscale" @change="settings.toggleGrayscale" />
            {{ t('game.grayscaleMode') }}
          </label>
        </div>
        <TrainingConfig />
        <GameBoard />
        <ScoreDisplay
          v-if="game.phase === 'result' && game.score && game.deltaE !== null && game.targetColor && game.userColor"
          :score="game.score"
          :delta-e="game.deltaE"
          :target-color="game.targetColor"
          :user-color="game.userColor"
          @next="game.startRound()"
        />
      </template>

      <!-- Stats tab -->
      <Statistics v-else-if="activeTab === 'stats'" />

      <!-- Settings tab -->
      <SettingsPanel v-else-if="activeTab === 'settings'" />
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useGameStore } from '@/stores/gameStore'
import { useSettingsStore } from '@/stores/settingsStore'
import GameBoard from '@/components/GameBoard.vue'
import ScoreDisplay from '@/components/ScoreDisplay.vue'
import DifficultySelector from '@/components/DifficultySelector.vue'
import TrainingConfig from '@/components/TrainingConfig.vue'
import Statistics from '@/components/Statistics.vue'
import SettingsPanel from '@/components/SettingsPanel.vue'

const { t } = useI18n()
const game = useGameStore()
const settings = useSettingsStore()

const tabs = [{ key: 'game' }, { key: 'stats' }, { key: 'settings' }]
const activeTab = ref<'game' | 'stats' | 'settings'>('game')

function setTab(key: string) {
  if (key === 'game' || key === 'stats' || key === 'settings') activeTab.value = key
}
</script>

<style scoped>
.app-shell { display: flex; flex-direction: column; min-height: 100vh; background: var(--c-bg); color: var(--c-text); }
.app-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 0 24px; height: 52px; border-bottom: 1px solid var(--c-border);
  background: var(--c-surface); position: sticky; top: 0; z-index: 10;
}
.logo { font-size: 18px; font-weight: 700; color: var(--c-accent); letter-spacing: -0.5px; }
.logo-sub { font-size: 12px; color: var(--c-muted); font-weight: 400; margin-left: 6px; }
.app-nav { display: flex; gap: 4px; align-items: center; }
.nav-btn {
  padding: 6px 16px; border-radius: 6px; border: none; background: transparent;
  color: var(--c-muted); cursor: pointer; font-size: 14px; transition: all 0.15s;
}
.nav-btn.active, .nav-btn:hover { background: var(--c-surface2); color: var(--c-text); }
.nav-btn.active { color: var(--c-accent); }
.theme-btn {
  padding: 4px 8px; border-radius: 6px; border: 1px solid var(--c-border);
  background: var(--c-surface2); cursor: pointer; font-size: 15px; line-height: 1;
  transition: border-color 0.15s; margin-left: 4px;
}
.theme-btn:hover { border-color: var(--c-accent); }
.app-main { flex: 1; max-width: 900px; margin: 0 auto; width: 100%; padding: 20px 16px; display: flex; flex-direction: column; gap: 16px; }
.game-controls { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px; }
.gs-toggle { display: flex; align-items: center; gap: 6px; font-size: 13px; color: var(--c-muted); cursor: pointer; }
.gs-toggle input { accent-color: var(--c-accent); }
</style>

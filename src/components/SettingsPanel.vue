<template>
  <div class="settings-page">
    <div class="setting-row">
      <span class="setting-label">{{ t('settings.theme') }}</span>
      <div class="toggle-group">
        <button :class="{ active: settings.theme === 'dark' }" @click="settings.theme = 'dark'">{{ t('settings.themeDark') }}</button>
        <button :class="{ active: settings.theme === 'light' }" @click="settings.theme = 'light'">{{ t('settings.themeLight') }}</button>
      </div>
    </div>

    <div class="setting-row">
      <span class="setting-label">{{ t('settings.pickerMode') }}</span>
      <div class="toggle-group">
        <button :class="{ active: settings.pickerMode === 'linear' }" @click="settings.pickerMode = 'linear'">{{ t('settings.pickerLinear') }}</button>
        <button :class="{ active: settings.pickerMode === 'wheel' }" @click="settings.pickerMode = 'wheel'">{{ t('settings.pickerWheel') }}</button>
      </div>
    </div>

    <div class="setting-row">
      <span class="setting-label">{{ t('settings.language') }}</span>
      <div class="toggle-group">
        <button :class="{ active: locale === 'zh' }" @click="switchLang('zh')">中文</button>
        <button :class="{ active: locale === 'en' }" @click="switchLang('en')">English</button>
      </div>
    </div>

    <div class="setting-row">
      <span class="setting-label">{{ t('settings.grayscale') }}</span>
      <label class="toggle-switch">
        <input type="checkbox" :checked="settings.isGrayscale" @change="settings.toggleGrayscale" />
        <span class="slider" />
      </label>
    </div>

    <div class="setting-row">
      <span class="setting-label">{{ t('settings.backgroundLevel') }}</span>
      <div class="toggle-group">
        <button v-for="n in 5" :key="n"
          :class="{ active: settings.difficulty.backgroundLevel === n }"
          @click="settings.difficulty.backgroundLevel = n">{{ n }}</button>
      </div>
    </div>

    <div class="setting-row">
      <span class="setting-label">{{ t('settings.colorContrast') }}</span>
      <div class="toggle-group">
        <button :class="{ active: settings.difficulty.colorContrast === 'random' }"
          @click="settings.difficulty.colorContrast = 'random'">{{ t('settings.contrastRandom') }}</button>
        <button :class="{ active: settings.difficulty.colorContrast === 'similar' }"
          @click="settings.difficulty.colorContrast = 'similar'">{{ t('settings.contrastSimilar') }}</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useSettingsStore } from '@/stores/settingsStore'

const { t, locale } = useI18n()
const settings = useSettingsStore()

function switchLang(lang: 'zh' | 'en') {
  locale.value = lang
  settings.setLocale(lang)
}
</script>

<style scoped>
.settings-page { display: flex; flex-direction: column; gap: 16px; padding: 8px 0; }
.setting-row {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 16px; background: var(--c-surface); border: 1px solid var(--c-border); border-radius: 8px;
}
.setting-label { font-size: 14px; color: var(--c-text); }
.toggle-group { display: flex; gap: 4px; }
.toggle-group button {
  padding: 5px 14px; border-radius: 16px; border: 1px solid var(--c-border);
  background: var(--c-surface2); color: var(--c-muted); cursor: pointer; font-size: 13px;
  transition: all 0.15s;
}
.toggle-group button.active { background: var(--c-accent); color: #fff; border-color: var(--c-accent); }
.toggle-switch { position: relative; display: inline-block; width: 44px; height: 24px; }
.toggle-switch input { opacity: 0; width: 0; height: 0; }
.slider {
  position: absolute; inset: 0; background: var(--c-surface2); border-radius: 24px;
  cursor: pointer; transition: background 0.2s; border: 1px solid var(--c-border);
}
.slider::before {
  content: ''; position: absolute; width: 18px; height: 18px; left: 2px; top: 2px;
  background: var(--c-muted); border-radius: 50%; transition: transform 0.2s;
}
input:checked + .slider { background: var(--c-accent); border-color: var(--c-accent); }
input:checked + .slider::before { transform: translateX(20px); background: #fff; }
</style>

<template>
  <div class="stats-page">
    <div v-if="!analysis" class="no-data">{{ t('stats.noData') }}</div>
    <template v-else>
      <!-- Summary -->
      <div class="summary-row">
        <div class="stat-card">
          <div class="stat-val">{{ stats.records.length }}</div>
          <div class="stat-lbl">{{ t('stats.totalRounds') }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-val">{{ analysis.avgDeltaE.toFixed(2) }}</div>
          <div class="stat-lbl">{{ t('stats.avgDeltaE') }}</div>
        </div>
        <div v-if="analysis.weakHueRanges.length" class="stat-card">
          <div class="stat-val weak">{{ analysis.weakHueRanges.map(h => h + '°').join(', ') }}</div>
          <div class="stat-lbl">{{ t('stats.weakAreas') }}</div>
        </div>
      </div>

      <!-- Trend -->
      <div class="chart-section">
        <div class="chart-title">{{ t('stats.trendChart') }}</div>
        <TrendChart :records="stats.records" />
      </div>

      <!-- Wheel + LS -->
      <div class="chart-row">
        <div class="chart-section">
          <div class="chart-title">{{ t('stats.colorWheel') }}</div>
          <ColorWheelHeatmap :analysis="analysis" />
        </div>
        <div class="chart-section">
          <div class="chart-title">{{ t('stats.lightSatChart') }}</div>
          <LightnessSaturationChart :analysis="analysis" />
        </div>
        <div class="chart-section">
          <div class="chart-title">{{ t('stats.radarChart') }}</div>
          <RadarChart :analysis="analysis" />
        </div>
      </div>

      <!-- Actions -->
      <div class="actions-row">
        <button class="btn-action" @click="doExport">{{ t('stats.export') }}</button>
        <button class="btn-action btn-danger" @click="doClear">{{ t('stats.clear') }}</button>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useStatsStore } from '@/stores/statsStore'
import { exportToJSON } from '@/utils/export'
import ColorWheelHeatmap from './charts/ColorWheelHeatmap.vue'
import LightnessSaturationChart from './charts/LightnessSaturationChart.vue'
import RadarChart from './charts/RadarChart.vue'
import TrendChart from './charts/TrendChart.vue'

const { t } = useI18n()
const stats = useStatsStore()
const analysis = computed(() => stats.analyze())

function doExport() { exportToJSON(stats.records) }
function doClear() {
  if (confirm('Clear all records?')) stats.clearRecords()
}
</script>

<style scoped>
.stats-page { display: flex; flex-direction: column; gap: 24px; padding: 8px 0; }
.no-data { text-align: center; color: var(--c-muted); padding: 60px 0; font-size: 16px; }
.summary-row { display: flex; gap: 16px; flex-wrap: wrap; }
.stat-card {
  flex: 1; min-width: 120px; background: var(--c-surface); border: 1px solid var(--c-border);
  border-radius: 10px; padding: 16px; text-align: center;
}
.stat-val { font-size: 28px; font-weight: 700; color: var(--c-accent); }
.stat-val.weak { font-size: 16px; }
.stat-lbl { font-size: 12px; color: var(--c-muted); margin-top: 4px; }
.chart-row { display: flex; gap: 16px; flex-wrap: wrap; }
.chart-section { background: var(--c-surface); border: 1px solid var(--c-border); border-radius: 10px; padding: 16px; }
.chart-title { font-size: 12px; color: var(--c-muted); margin-bottom: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
.actions-row { display: flex; gap: 12px; }
.btn-action {
  padding: 8px 20px; border-radius: 6px; border: 1px solid var(--c-border);
  background: var(--c-surface2); color: var(--c-text); cursor: pointer; font-size: 13px;
  transition: all 0.15s;
}
.btn-action:hover { border-color: var(--c-accent); color: var(--c-accent); }
.btn-danger:hover { border-color: #ef4444; color: #ef4444; }
</style>

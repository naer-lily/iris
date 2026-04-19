<template>
  <svg ref="svgRef" class="chart-svg" />
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import * as d3 from 'd3'
import type { AnalysisResult } from '@/types'

const props = defineProps<{ analysis: AnalysisResult }>()
const svgRef = ref<SVGSVGElement>()

const W = 260, H = 260, CX = W / 2, CY = H / 2, R = 90

function draw() {
  const svg = d3.select(svgRef.value!).attr('width', W).attr('height', H)
  svg.selectAll('*').remove()
  const g = svg.append('g').attr('transform', `translate(${CX},${CY})`)

  const difficulties = ['easy', 'medium', 'hard', 'expert'] as const
  const labels = ['Easy', 'Medium', 'Hard', 'Expert']
  const n = difficulties.length
  const angles = difficulties.map((_, i) => (i / n) * Math.PI * 2 - Math.PI / 2)

  const maxDeltaE = 15
  const values = difficulties.map(d => {
    const b = props.analysis.byDifficulty[d]
    return b.count > 0 ? Math.min(b.totalDeltaE / b.count, maxDeltaE) : 0
  })

  // Grid circles
  for (let i = 1; i <= 3; i++) {
    g.append('circle').attr('r', R * i / 3).attr('fill', 'none')
      .attr('stroke', 'var(--c-border)').attr('stroke-dasharray', '3,3')
  }

  // Axes
  angles.forEach((angle, i) => {
    const x = Math.cos(angle) * R, y = Math.sin(angle) * R
    g.append('line').attr('x1', 0).attr('y1', 0).attr('x2', x).attr('y2', y)
      .attr('stroke', 'var(--c-border)')
    g.append('text').attr('x', Math.cos(angle) * (R + 14)).attr('y', Math.sin(angle) * (R + 14))
      .attr('text-anchor', 'middle').attr('dominant-baseline', 'middle')
      .attr('fill', 'var(--c-muted)').attr('font-size', 11).text(labels[i])
  })

  // Data polygon
  const points = values.map((v, i) => {
    const r = (v / maxDeltaE) * R
    return [Math.cos(angles[i]) * r, Math.sin(angles[i]) * r] as [number, number]
  })
  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0]},${p[1]}`).join(' ') + 'Z'
  g.append('path').attr('d', pathD).attr('fill', '#818cf8').attr('fill-opacity', 0.3)
    .attr('stroke', '#818cf8').attr('stroke-width', 2)

  points.forEach(([x, y]) => {
    g.append('circle').attr('cx', x).attr('cy', y).attr('r', 4)
      .attr('fill', '#818cf8')
  })
}

onMounted(draw)
watch(() => props.analysis, draw, { deep: true })
</script>

<style scoped>
.chart-svg { display: block; }
</style>

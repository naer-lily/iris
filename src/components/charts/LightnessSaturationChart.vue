<template>
  <svg ref="svgRef" class="chart-svg" />
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import * as d3 from 'd3'
import type { AnalysisResult } from '@/types'

const props = defineProps<{ analysis: AnalysisResult }>()
const svgRef = ref<SVGSVGElement>()

const W = 260, H = 200, M = { top: 20, right: 20, bottom: 30, left: 36 }
const IW = W - M.left - M.right, IH = H - M.top - M.bottom

function draw() {
  const svg = d3.select(svgRef.value!).attr('width', W).attr('height', H)
  svg.selectAll('*').remove()
  const g = svg.append('g').attr('transform', `translate(${M.left},${M.top})`)

  const satData = Object.entries(props.analysis.bySat)
    .filter(([, v]) => v.count > 0)
    .map(([k, v]) => ({ x: parseInt(k), y: v.totalDeltaE / v.count }))

  const lightData = Object.entries(props.analysis.byLight)
    .filter(([, v]) => v.count > 0)
    .map(([k, v]) => ({ x: parseInt(k), y: v.totalDeltaE / v.count }))

  const xScale = d3.scaleLinear().domain([0, 100]).range([0, IW])
  const yMax = Math.max(...satData.map(d => d.y), ...lightData.map(d => d.y), 1)
  const yScale = d3.scaleLinear().domain([0, yMax]).range([IH, 0])

  g.append('g').attr('transform', `translate(0,${IH})`).call(d3.axisBottom(xScale).ticks(5))
    .selectAll('text').attr('fill', 'var(--c-muted)').attr('font-size', 10)
  g.append('g').call(d3.axisLeft(yScale).ticks(4))
    .selectAll('text').attr('fill', 'var(--c-muted)').attr('font-size', 10)

  const line = d3.line<{ x: number; y: number }>()
    .x(d => xScale(d.x + 10)).y(d => yScale(d.y)).curve(d3.curveMonotoneX)

  if (satData.length > 1) {
    g.append('path').datum(satData).attr('fill', 'none')
      .attr('stroke', '#818cf8').attr('stroke-width', 2).attr('d', line)
  }
  if (lightData.length > 1) {
    g.append('path').datum(lightData).attr('fill', 'none')
      .attr('stroke', '#34d399').attr('stroke-width', 2).attr('d', line)
  }

  // Legend
  const leg = g.append('g').attr('transform', `translate(${IW - 80}, 0)`)
  leg.append('rect').attr('width', 10).attr('height', 3).attr('y', 5).attr('fill', '#818cf8')
  leg.append('text').attr('x', 14).attr('y', 9).attr('fill', 'var(--c-muted)').attr('font-size', 9).text('Sat')
  leg.append('rect').attr('width', 10).attr('height', 3).attr('y', 18).attr('fill', '#34d399')
  leg.append('text').attr('x', 14).attr('y', 22).attr('fill', 'var(--c-muted)').attr('font-size', 9).text('Light')
}

onMounted(draw)
watch(() => props.analysis, draw, { deep: true })
</script>

<style scoped>
.chart-svg { display: block; }
</style>

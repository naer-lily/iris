<template>
  <svg ref="svgRef" class="chart-svg" />
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import * as d3 from 'd3'
import type { TrainingRecord } from '@/types'

const props = defineProps<{ records: TrainingRecord[] }>()
const svgRef = ref<SVGSVGElement>()

const W = 520, H = 180, M = { top: 16, right: 20, bottom: 28, left: 40 }
const IW = W - M.left - M.right, IH = H - M.top - M.bottom

function draw() {
  const svg = d3.select(svgRef.value!).attr('width', W).attr('height', H)
  svg.selectAll('*').remove()
  if (props.records.length < 2) return

  const g = svg.append('g').attr('transform', `translate(${M.left},${M.top})`)
  const data = props.records.slice(-60) // last 60 rounds

  const xScale = d3.scaleLinear().domain([0, data.length - 1]).range([0, IW])
  const yMax = Math.max(...data.map(d => d.deltaE), 10)
  const yScale = d3.scaleLinear().domain([0, yMax]).range([IH, 0])

  g.append('g').attr('transform', `translate(0,${IH})`).call(d3.axisBottom(xScale).ticks(6))
    .selectAll('text').attr('fill', 'var(--c-muted)').attr('font-size', 10)
  g.append('g').call(d3.axisLeft(yScale).ticks(4))
    .selectAll('text').attr('fill', 'var(--c-muted)').attr('font-size', 10)

  // Area
  const area = d3.area<TrainingRecord>()
    .x((_, i) => xScale(i)).y0(IH).y1(d => yScale(d.deltaE)).curve(d3.curveMonotoneX)
  g.append('path').datum(data).attr('fill', '#818cf8').attr('fill-opacity', 0.15).attr('d', area)

  // Line
  const line = d3.line<TrainingRecord>()
    .x((_, i) => xScale(i)).y(d => yScale(d.deltaE)).curve(d3.curveMonotoneX)
  g.append('path').datum(data).attr('fill', 'none')
    .attr('stroke', '#818cf8').attr('stroke-width', 2).attr('d', line)

  // Moving average (window=5)
  const ma = data.map((_, i) => {
    const w = data.slice(Math.max(0, i - 4), i + 1)
    return w.reduce((s, r) => s + r.deltaE, 0) / w.length
  })
  const maLine = d3.line<number>().x((_, i) => xScale(i)).y(d => yScale(d)).curve(d3.curveMonotoneX)
  g.append('path').datum(ma).attr('fill', 'none')
    .attr('stroke', '#f472b6').attr('stroke-width', 1.5).attr('stroke-dasharray', '4,2').attr('d', maLine)
}

onMounted(draw)
watch(() => props.records, draw, { deep: true })
</script>

<style scoped>
.chart-svg { display: block; max-width: 100%; }
</style>

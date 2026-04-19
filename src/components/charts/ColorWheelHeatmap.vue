<template>
  <svg ref="svgRef" class="chart-svg" />
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import * as d3 from 'd3'
import type { AnalysisResult } from '@/types'
import { hsvToRGB, rgbToHex } from '@/utils/colorMath'

const props = defineProps<{ analysis: AnalysisResult }>()
const svgRef = ref<SVGSVGElement>()

const W = 260, H = 260, CX = W / 2, CY = H / 2, R = 110

function draw() {
  const svg = d3.select(svgRef.value!).attr('width', W).attr('height', H)
  svg.selectAll('*').remove()

  const buckets = props.analysis.byHue
  const maxAvg = Math.max(...Object.values(buckets).filter(v => v.count > 0).map(v => v.totalDeltaE / v.count), 1)

  // Draw 12 hue segments
  const arc = d3.arc<{ startAngle: number; endAngle: number; hue: number; avg: number }>()
    .innerRadius(30)
    .outerRadius(d => 30 + (d.avg / maxAvg) * (R - 30))
    .startAngle(d => d.startAngle)
    .endAngle(d => d.endAngle)

  const data = Object.entries(buckets).map(([k, v]) => {
    const hue = parseInt(k)
    const avg = v.count > 0 ? v.totalDeltaE / v.count : 0
    return {
      hue,
      avg,
      startAngle: (hue / 360) * Math.PI * 2 - Math.PI / 2,
      endAngle: ((hue + 30) / 360) * Math.PI * 2 - Math.PI / 2,
    }
  })

  const g = svg.append('g').attr('transform', `translate(${CX},${CY})`)

  g.selectAll('path')
    .data(data)
    .join('path')
    .attr('d', arc)
    .attr('fill', d => {
      const rgb = hsvToRGB({ h: d.hue + 15, s: 80, v: 90 })
      return rgbToHex(rgb)
    })
    .attr('opacity', d => 0.3 + (d.avg / maxAvg) * 0.7)
    .attr('stroke', 'var(--c-border)')
    .attr('stroke-width', 0.5)

  // Center label
  g.append('text').attr('text-anchor', 'middle').attr('dy', '0.35em')
    .attr('fill', 'var(--c-muted)').attr('font-size', 10).text('ΔE')
}

onMounted(draw)
watch(() => props.analysis, draw, { deep: true })
</script>

<style scoped>
.chart-svg { display: block; }
</style>

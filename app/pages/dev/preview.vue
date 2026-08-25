<script setup lang="ts">
import { CATEGORICAL, precipitationColor, temperatureColor, windSpeedColor, seismicIntensityColor } from '@/utils/colorScales'
import type { WeatherIconKey } from '@/utils/weatherCode'
import type { MapLibreMap} from 'maplibre-gl';
import { Marker } from 'maplibre-gl'
import type { EChartsOption } from 'echarts'

// 未上導覽列的內部驗收頁，用來一眼確認共用視覺元件（圖表/地圖/天氣圖示/色階）都正常運作
definePageMeta({ layout: 'default' })
useSeoMeta({ title: '共用元件預覽 — 氣象知多少', robots: 'noindex' })

// 每個圖示語意挑一個代表性的 CWA weatherCode（見 utils/weatherCode.ts 的完整對照表）
const ICON_DEMO_CODES: Array<[WeatherIconKey, string]> = [
  ['clear', '1'],
  ['mostly-clear', '2'],
  ['partly-cloudy', '4'],
  ['mostly-cloudy', '5'],
  ['cloudy', '7'],
  ['light-rain', '8'],
  ['rain', '12'],
  ['thunderstorm', '15'],
  ['sleet', '23'],
  ['fog', '24'],
  ['fog-rain', '31'],
  ['snow', '42']
]

const daytime = new Date(2026, 0, 1, 14)
const nighttime = new Date(2026, 0, 1, 22)

// 示範用溫度折線（單一量尺，符合 dataviz skill「一律單軸」的規定；
// 溫度＋降雨這種不同量尺的組合，正式 meteogram 會用多個共用 x 軸的 grid 堆疊，不會用雙 y 軸）
const hours = Array.from({ length: 24 }, (_, i) => `${i}:00`)
const temps = [24, 24, 23, 23, 23, 24, 25, 27, 29, 30, 31, 32, 32, 33, 33, 32, 31, 29, 28, 27, 26, 25, 25, 24]

const chartOption: EChartsOption = {
  grid: { left: 40, right: 20, top: 20, bottom: 30 },
  xAxis: { type: 'category', data: hours, boundaryGap: false },
  yAxis: { type: 'value', name: '°C' },
  series: [
    {
      type: 'line',
      data: temps,
      smooth: true,
      areaStyle: { opacity: 0.12 },
      itemStyle: { color: CATEGORICAL[0] },
      lineStyle: { color: CATEGORICAL[0] }
    }
  ]
}

const precipSteps = [0, 0.2, 0.4, 0.6, 0.8, 1]
const tempSteps = [-1, -0.6, -0.3, 0, 0.3, 0.6, 1]
const windSteps = [0, 0.2, 0.4, 0.6, 0.8, 1]
const intensityLabels = ['0級', '2級', '4級', '5弱', '5強', '6弱', '6強', '7級']

function onMapReady(map: MapLibreMap) {
  new Marker({ color: CATEGORICAL[0] }).setLngLat([121.5654, 25.033]).addTo(map)
}
</script>

<template>
  <div class="space-y-10">
    <h1 class="text-2xl font-semibold text-text-primary">共用元件預覽</h1>

    <section class="space-y-3">
      <h2 class="text-lg font-medium text-text-primary">天氣圖示（WeatherIcon）</h2>
      <div class="grid grid-cols-4 gap-4 sm:grid-cols-6 md:grid-cols-12">
        <div v-for="[key, code] in ICON_DEMO_CODES" :key="key" class="flex flex-col items-center gap-1 rounded-md bg-surface-1 p-3">
          <WeatherIcon :code="code" :at="daytime" class="h-8 w-8 text-accent" />
          <span class="text-[10px] text-text-muted">{{ key }}</span>
        </div>
      </div>
      <p class="text-xs text-text-muted">晴天系列的日／夜切換：</p>
      <div class="flex gap-4">
        <div class="flex flex-col items-center gap-1 rounded-md bg-surface-1 p-3">
          <WeatherIcon code="1" :at="daytime" class="h-8 w-8 text-accent" />
          <span class="text-[10px] text-text-muted">clear / day</span>
        </div>
        <div class="flex flex-col items-center gap-1 rounded-md bg-surface-1 p-3">
          <WeatherIcon code="1" :at="nighttime" class="h-8 w-8 text-accent" />
          <span class="text-[10px] text-text-muted">clear / night</span>
        </div>
      </div>
    </section>

    <section class="space-y-3">
      <h2 class="text-lg font-medium text-text-primary">色階（colorScales）</h2>
      <div class="space-y-2 text-sm text-text-secondary">
        <div class="flex items-center gap-2">
          <span class="w-24">分類（8色）</span>
          <span v-for="c in CATEGORICAL" :key="c" class="h-6 w-10 rounded" :style="{ background: c }" />
        </div>
        <div class="flex items-center gap-2">
          <span class="w-24">降水</span>
          <span v-for="t in precipSteps" :key="t" class="h-6 w-10 rounded" :style="{ background: precipitationColor(t) }" />
        </div>
        <div class="flex items-center gap-2">
          <span class="w-24">溫度（發散）</span>
          <span v-for="t in tempSteps" :key="t" class="h-6 w-10 rounded" :style="{ background: temperatureColor(t) }" />
        </div>
        <div class="flex items-center gap-2">
          <span class="w-24">風速</span>
          <span v-for="t in windSteps" :key="t" class="h-6 w-10 rounded" :style="{ background: windSpeedColor(t) }" />
        </div>
        <div class="flex items-center gap-2">
          <span class="w-24">地震震度</span>
          <span
            v-for="l in intensityLabels"
            :key="l"
            class="flex h-6 w-10 items-center justify-center rounded text-[10px] text-white"
            :style="{ background: seismicIntensityColor(l) }"
            >{{ l }}</span
          >
        </div>
      </div>
    </section>

    <section class="space-y-3">
      <h2 class="text-lg font-medium text-text-primary">圖表（BaseChart，ECharts 深色主題 + 十字準線）</h2>
      <div class="rounded-lg bg-surface-1 p-4">
        <ChartsBaseChart :option="chartOption" height="280px" />
      </div>
    </section>

    <section class="space-y-3">
      <h2 class="text-lg font-medium text-text-primary">地圖（BaseMap，MapLibre + OpenFreeMap 深色底圖）</h2>
      <div class="h-96 overflow-hidden rounded-lg bg-surface-1">
        <MapBaseMap @ready="onMapReady" />
      </div>
    </section>
  </div>
</template>

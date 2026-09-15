<script setup lang="ts">
import { computed, ref, shallowRef, watch } from 'vue'
import type { MapLibreMap, GeoJSONSource } from 'maplibre-gl'
import { loadMapLibre } from '@/utils/maplibre'
import type { AirQualityStation, GeoFeatureCollection, GeoPoint } from '#shared/types'
import { airQualityColorExpression } from '@/utils/mapColorExpression'
import { airQualityColor } from '@/utils/colorScales'
import { AIR_QUALITY_LEVEL_LABEL } from '@/utils/airQuality'
import { formatTaipei } from '@/utils/formatDate'

useSeoMeta({
  title: '空氣品質 — 氣象知多少',
  description: '全台空氣品質測站即時 AQI 地圖與可排序表格，資料來自環境部環境資料開放平臺。'
})

const LEGEND_LEVELS = [
  { key: 'good', label: '良好' },
  { key: 'moderate', label: '普通' },
  { key: 'unhealthy-sensitive', label: '對敏感族群不健康' },
  { key: 'unhealthy', label: '對所有族群不健康' },
  { key: 'very-unhealthy', label: '非常不健康' },
  { key: 'hazardous', label: '危害' }
] as const

// 跟 /observation 同樣的內容型頁面（可排序表格是真的 SEO 文字），維持 SSR，
// 不是 /health、/map 那種只餵地圖圖層的資料
const { data: stations } = await useFetch<GeoFeatureCollection<GeoPoint, AirQualityStation>>('/api/air-quality/stations')

const search = ref('')
// 空字串代表「全部縣市」；縣市數量固定且離散（22 個），比自由輸入更適合下拉選單，
// 跟測站名稱搜尋分開成兩個獨立條件，用 AND 合併，不會互相干擾
const selectedCounty = ref('')
const sortKey = ref<'siteName' | 'county' | 'aqi' | 'pm25' | 'pm10' | 'o3' | 'publishTime'>('aqi')
const sortDesc = ref(true)

const rows = computed(() => stations.value?.features.map((f) => f.properties) ?? [])

// 選項從實際載入的資料算出來，不是寫死全台 22 縣市——外島／未設站的縣市不該出現在
// 選單裡讓使用者選了卻一筆都篩不到
const counties = computed(() => [...new Set(rows.value.map((r) => r.county))].sort())

const filteredRows = computed(() => {
  const q = search.value.trim()
  return rows.value.filter((r) => {
    if (selectedCounty.value && r.county !== selectedCounty.value) return false
    if (q && !r.siteName.includes(q)) return false
    return true
  })
})

const sortedRows = computed(() => {
  const key = sortKey.value
  return [...filteredRows.value].sort((a, b) => {
    const av = a[key]
    const bv = b[key]
    if (typeof av === 'string' || typeof bv === 'string') {
      return sortDesc.value ? String(bv).localeCompare(String(av)) : String(av).localeCompare(String(bv))
    }
    const an = av ?? -Infinity
    const bn = bv ?? -Infinity
    return sortDesc.value ? bn - an : an - bn
  })
})

function toggleSort(key: typeof sortKey.value) {
  if (sortKey.value === key) {
    sortDesc.value = !sortDesc.value
  } else {
    sortKey.value = key
    sortDesc.value = true
  }
}

// --- 地圖 ---
const mapInstance = shallowRef<MapLibreMap | null>(null)
const SOURCE = 'air-quality'
const LAYER = 'air-quality-layer'

function renderStations(map: MapLibreMap) {
  if (!stations.value) return
  const existing = map.getSource<GeoJSONSource>(SOURCE)
  if (existing) {
    existing.setData(stations.value)
    return
  }
  map.addSource(SOURCE, { type: 'geojson', data: stations.value })
  map.addLayer({
    id: LAYER,
    type: 'circle',
    source: SOURCE,
    paint: {
      'circle-radius': 5,
      'circle-color': airQualityColorExpression('level', airQualityColor),
      'circle-stroke-width': 1,
      'circle-stroke-color': '#05070d'
    }
  })

  map.on('click', LAYER, async (e) => {
    const f = e.features?.[0]
    if (!f || f.geometry.type !== 'Point') return
    const props = f.properties as unknown as AirQualityStation
    const label = AIR_QUALITY_LEVEL_LABEL[props.level] ?? props.level
    // 地圖已經在畫面上，maplibre 模組必然載入過了，這個 await 是模組快取的同步命中
    const { Popup } = await loadMapLibre()
    new Popup()
      .setLngLat(f.geometry.coordinates as [number, number])
      .setHTML(
        `<div><strong>${props.siteName}</strong><br/>AQI ${props.aqi ?? '—'}・${label}` +
          `${props.majorPollutant ? `<br/>首要污染物：${props.majorPollutant}` : ''}</div>`
      )
      .addTo(map)
  })
  map.on('mouseenter', LAYER, () => (map.getCanvas().style.cursor = 'pointer'))
  map.on('mouseleave', LAYER, () => (map.getCanvas().style.cursor = ''))
}

function onMapReady(map: MapLibreMap) {
  mapInstance.value = map
  renderStations(map)
}

watch(stations, () => {
  if (mapInstance.value) renderStations(mapInstance.value)
})
</script>

<template>
  <div class="space-y-4">
    <div v-if="!stations" class="rounded-lg bg-surface-1 p-8 text-center text-text-secondary">
      無法載入空氣品質資料，請稍後再試。
    </div>

    <template v-else>
      <div class="flex flex-wrap items-center gap-3 rounded-lg bg-surface-1 p-3">
        <input
          v-model="search"
          type="search"
          placeholder="搜尋測站…"
          class="w-40 rounded-md border border-surface-2 bg-surface-0 px-2 py-1 text-sm text-text-primary placeholder:text-text-muted"
        >
        <select
          v-model="selectedCounty"
          class="rounded-md border border-surface-2 bg-surface-0 px-2 py-1 text-sm text-text-primary"
        >
          <option value="">全部縣市</option>
          <option v-for="c in counties" :key="c" :value="c">{{ c }}</option>
        </select>
        <span class="ml-auto text-xs text-text-muted">共 {{ filteredRows.length }} 站</span>
      </div>

      <div class="flex flex-wrap items-center gap-3 rounded-lg bg-surface-1 px-3 py-2 text-xs text-text-secondary">
        <span class="text-text-muted">AQI 等級</span>
        <span v-for="l in LEGEND_LEVELS" :key="l.key" class="flex items-center gap-1.5">
          <span class="h-3 w-3 rounded-sm" :style="{ backgroundColor: airQualityColor(l.key) }" />
          {{ l.label }}
        </span>
      </div>

      <section class="h-96 overflow-hidden rounded-lg bg-surface-1">
        <MapBaseMap @ready="onMapReady" />
      </section>

      <section class="overflow-x-auto rounded-lg bg-surface-1">
        <table class="w-full min-w-2xl text-left text-sm">
          <thead>
            <tr class="border-b border-surface-2 text-text-muted">
              <th class="cursor-pointer px-3 py-2 font-normal" @click="toggleSort('siteName')">測站</th>
              <th class="cursor-pointer px-3 py-2 font-normal" @click="toggleSort('county')">縣市</th>
              <th class="cursor-pointer px-3 py-2 text-right font-normal" @click="toggleSort('aqi')">AQI</th>
              <th class="px-3 py-2 font-normal">等級</th>
              <th class="px-3 py-2 font-normal">首要污染物</th>
              <th class="cursor-pointer px-3 py-2 text-right font-normal" @click="toggleSort('pm25')">PM2.5</th>
              <th class="cursor-pointer px-3 py-2 text-right font-normal" @click="toggleSort('pm10')">PM10</th>
              <th class="cursor-pointer px-3 py-2 text-right font-normal" @click="toggleSort('o3')">臭氧</th>
              <th class="cursor-pointer px-3 py-2 text-right font-normal" @click="toggleSort('publishTime')">發布時間</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="s in sortedRows" :key="s.siteName" class="border-b border-surface-2/60 hover:bg-surface-2/40">
              <td class="px-3 py-1.5 text-text-primary">{{ s.siteName }}</td>
              <td class="px-3 py-1.5 text-text-secondary">{{ s.county }}</td>
              <td class="px-3 py-1.5 text-right tabular-nums font-medium" :style="{ color: airQualityColor(s.level) }">
                {{ s.aqi ?? '—' }}
              </td>
              <td class="px-3 py-1.5">
                <span
                  class="rounded-md px-2 py-0.5 text-xs font-medium"
                  :style="{ backgroundColor: `${airQualityColor(s.level)}26`, color: airQualityColor(s.level) }"
                >
                  {{ AIR_QUALITY_LEVEL_LABEL[s.level] ?? s.level }}
                </span>
              </td>
              <td class="px-3 py-1.5 text-text-secondary">{{ s.majorPollutant ?? '—' }}</td>
              <td class="px-3 py-1.5 text-right tabular-nums text-text-secondary">{{ s.pm25 ?? '—' }}</td>
              <td class="px-3 py-1.5 text-right tabular-nums text-text-secondary">{{ s.pm10 ?? '—' }}</td>
              <td class="px-3 py-1.5 text-right tabular-nums text-text-secondary">{{ s.o3 ?? '—' }}</td>
              <td class="px-3 py-1.5 text-right tabular-nums text-text-muted">{{ formatTaipei(s.publishTime) }}</td>
            </tr>
          </tbody>
        </table>
        <p v-if="sortedRows.length === 0" class="p-6 text-center text-text-muted">找不到符合的測站。</p>
      </section>

      <p class="text-xs text-text-muted">
        資料來源：<a href="https://data.moenv.gov.tw" target="_blank" rel="noopener" class="hover:text-text-secondary">環境部環境資料開放平臺</a>
        （空氣品質指標 AQI、測站基本資料），每 10 分鐘更新一次。
      </p>
    </template>
  </div>
</template>

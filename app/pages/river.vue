<script setup lang="ts">
import { computed, ref, shallowRef, watch } from 'vue'
import type { MapLibreMap, GeoJSONSource } from 'maplibre-gl'
import { loadMapLibre } from '@/utils/maplibre'
import type { GeoFeatureCollection, GeoPoint, RiverStation } from '#shared/types'
import { riverAlertColorExpression } from '@/utils/mapColorExpression'
import { riverAlertColor } from '@/utils/colorScales'
import { RIVER_ALERT_LEVEL_LABEL } from '@/utils/river'
import { formatTaipei } from '@/utils/formatDate'

useSeoMeta({
  title: '河川水位 — 氣象知多少',
  description: '全台河川測站即時水位與三級警戒地圖與可排序表格，資料來自經濟部水利署。'
})

const LEGEND_LEVELS = [
  { key: 'normal', label: '正常' },
  { key: 'level3', label: '三級警戒' },
  { key: 'level2', label: '二級警戒' },
  { key: 'level1', label: '一級警戒' }
] as const

// 警戒等級排序用：數字越大越優先顯示（最嚴重排最前），跟 HEALTH_INDEX 系列
// 用指數高低排序是同一種「把最需要注意的排在最上面」的思路
const ALERT_RANK: Record<string, number> = { level1: 4, level2: 3, level3: 2, normal: 1, unavailable: 0 }

// 跟 /observation、/air-quality、/reservoir 同樣的內容型頁面，維持 SSR
const { data: stations } = await useFetch<GeoFeatureCollection<GeoPoint, RiverStation>>('/api/river/stations')

const search = ref('')
const sortKey = ref<'name' | 'river' | 'waterLevel' | 'alertLevel'>('alertLevel')
const sortDesc = ref(true)

const rows = computed(() => stations.value?.features.map((f) => f.properties) ?? [])

const filteredRows = computed(() => {
  const q = search.value.trim()
  if (!q) return rows.value
  return rows.value.filter((r) => r.name.includes(q) || r.river.includes(q))
})

const sortedRows = computed(() => {
  const key = sortKey.value
  return [...filteredRows.value].sort((a, b) => {
    if (key === 'alertLevel') {
      const diff = ALERT_RANK[a.alertLevel]! - ALERT_RANK[b.alertLevel]!
      return sortDesc.value ? -diff : diff
    }
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
const SOURCE = 'river'
const LAYER = 'river-layer'

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
      'circle-radius': 4,
      'circle-color': riverAlertColorExpression('alertLevel', riverAlertColor),
      'circle-stroke-width': 1,
      'circle-stroke-color': '#05070d'
    }
  })

  map.on('click', LAYER, async (e) => {
    const f = e.features?.[0]
    if (!f || f.geometry.type !== 'Point') return
    const props = f.properties as unknown as RiverStation
    const label = RIVER_ALERT_LEVEL_LABEL[props.alertLevel] ?? props.alertLevel
    // 地圖已經在畫面上，maplibre 模組必然載入過了，這個 await 是模組快取的同步命中
    const { Popup } = await loadMapLibre()
    new Popup()
      .setLngLat(f.geometry.coordinates as [number, number])
      .setHTML(
        `<div><strong>${props.name}</strong>（${props.river}）<br/>水位 ${props.waterLevel ?? '—'} m・${label}</div>`
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
      無法載入河川水位資料，請稍後再試。
    </div>

    <template v-else>
      <div class="flex flex-wrap items-center gap-3 rounded-lg bg-surface-1 p-3">
        <input
          v-model="search"
          type="search"
          placeholder="搜尋測站或河川…"
          class="w-48 rounded-md border border-surface-2 bg-surface-0 px-2 py-1 text-sm text-text-primary placeholder:text-text-muted"
        >
        <span class="ml-auto text-xs text-text-muted">共 {{ filteredRows.length }} 站</span>
      </div>

      <div class="flex flex-wrap items-center gap-3 rounded-lg bg-surface-1 px-3 py-2 text-xs text-text-secondary">
        <span class="text-text-muted">警戒等級</span>
        <span v-for="l in LEGEND_LEVELS" :key="l.key" class="flex items-center gap-1.5">
          <span class="h-3 w-3 rounded-sm" :style="{ backgroundColor: riverAlertColor(l.key) }" />
          {{ l.label }}
        </span>
        <span class="flex items-center gap-1.5">
          <span class="h-3 w-3 rounded-sm bg-[#334155]" />
          無警戒資料
        </span>
      </div>

      <section class="h-96 overflow-hidden rounded-lg bg-surface-1">
        <MapBaseMap @ready="onMapReady" />
      </section>

      <section class="overflow-x-auto rounded-lg bg-surface-1">
        <table class="w-full min-w-2xl text-left text-sm">
          <thead>
            <tr class="border-b border-surface-2 text-text-muted">
              <th class="cursor-pointer px-3 py-2 font-normal" @click="toggleSort('name')">測站</th>
              <th class="cursor-pointer px-3 py-2 font-normal" @click="toggleSort('river')">河川</th>
              <th class="cursor-pointer px-3 py-2 text-right font-normal" @click="toggleSort('waterLevel')">水位（m）</th>
              <th class="cursor-pointer px-3 py-2 font-normal" @click="toggleSort('alertLevel')">警戒等級</th>
              <th class="px-3 py-2 font-normal">觀測時間</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="s in sortedRows" :key="s.id" class="border-b border-surface-2/60 hover:bg-surface-2/40">
              <td class="px-3 py-1.5 text-text-primary">{{ s.name }}</td>
              <td class="px-3 py-1.5 text-text-secondary">{{ s.river }}</td>
              <td class="px-3 py-1.5 text-right tabular-nums text-text-secondary">{{ s.waterLevel ?? '—' }}</td>
              <td class="px-3 py-1.5">
                <span
                  class="rounded-md px-2 py-0.5 text-xs font-medium"
                  :style="{ backgroundColor: `${riverAlertColor(s.alertLevel)}26`, color: riverAlertColor(s.alertLevel) }"
                >
                  {{ RIVER_ALERT_LEVEL_LABEL[s.alertLevel] ?? s.alertLevel }}
                </span>
              </td>
              <td class="px-3 py-1.5 text-text-muted">{{ formatTaipei(s.observationTime) }}</td>
            </tr>
          </tbody>
        </table>
        <p v-if="sortedRows.length === 0" class="p-6 text-center text-text-muted">找不到符合的測站。</p>
      </section>

      <p class="text-xs text-text-muted">
        資料來源：<a href="https://opendata.wra.gov.tw" target="_blank" rel="noopener" class="hover:text-text-secondary">經濟部水利署水利資料開放平台</a>
        （即時水位、河川水位測站站況），每 10 分鐘更新一次。三級警戒門檻由官方逐站公告，
        並非所有測站都有公告齊全三級；「無警戒資料」代表沒有門檻可比對，不代表水位異常。
      </p>
    </template>
  </div>
</template>

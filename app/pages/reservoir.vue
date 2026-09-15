<script setup lang="ts">
import { computed, ref, shallowRef, watch } from 'vue'
import type { MapLibreMap, GeoJSONSource } from 'maplibre-gl'
import { loadMapLibre } from '@/utils/maplibre'
import type { GeoFeatureCollection, GeoPoint, ReservoirStatus } from '#shared/types'
import { reservoirStorageColorExpression } from '@/utils/mapColorExpression'
import { reservoirStorageColor } from '@/utils/colorScales'
import { formatTaipei } from '@/utils/formatDate'

useSeoMeta({
  title: '水庫水情 — 氣象知多少',
  description: '全台公告水庫即時水位、蓄水率、進出流量地圖與可排序表格，資料來自經濟部水利署。'
})

// 跟 /observation、/air-quality 同樣的內容型頁面，維持 SSR
const { data: stations } = await useFetch<GeoFeatureCollection<GeoPoint, ReservoirStatus>>('/api/reservoir/stations')

// 蓄水率的漸層圖例：跟散點色階同一套 reservoirStorageColor，取幾個代表點畫成 CSS 漸層，
// 不用另外維護一組圖例專屬色票
const LEGEND_GRADIENT = computed(() => {
  const stops = [0, 20, 40, 60, 80, 100].map((p) => `${reservoirStorageColor(p)} ${p}%`)
  return `linear-gradient(to right, ${stops.join(', ')})`
})

const search = ref('')
const sortKey = ref<'name' | 'waterLevel' | 'storagePercentage' | 'inflow' | 'outflow'>('storagePercentage')
const sortDesc = ref(true)

const rows = computed(() => stations.value?.features.map((f) => f.properties) ?? [])

const filteredRows = computed(() => {
  const q = search.value.trim()
  if (!q) return rows.value
  return rows.value.filter((r) => r.name.includes(q))
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
const SOURCE = 'reservoir'
const LAYER = 'reservoir-layer'

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
      'circle-radius': 6,
      'circle-color': reservoirStorageColorExpression('storagePercentage', reservoirStorageColor),
      'circle-stroke-width': 1,
      'circle-stroke-color': '#05070d'
    }
  })

  map.on('click', LAYER, async (e) => {
    const f = e.features?.[0]
    if (!f || f.geometry.type !== 'Point') return
    const props = f.properties as unknown as ReservoirStatus
    // 地圖已經在畫面上，maplibre 模組必然載入過了，這個 await 是模組快取的同步命中
    const { Popup } = await loadMapLibre()
    new Popup()
      .setLngLat(f.geometry.coordinates as [number, number])
      .setHTML(
        `<div style="color:#0f172a"><strong>${props.name}</strong><br/>蓄水率 ${props.storagePercentage ?? '—'}%` +
          `<br/>水位 ${props.waterLevel ?? '—'} m</div>`
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
      無法載入水庫水情資料，請稍後再試。
    </div>

    <template v-else>
      <div class="flex flex-wrap items-center gap-3 rounded-lg bg-surface-1 p-3">
        <input
          v-model="search"
          type="search"
          placeholder="搜尋水庫…"
          class="w-40 rounded-md border border-surface-2 bg-surface-0 px-2 py-1 text-sm text-text-primary placeholder:text-text-muted"
        >
        <span class="ml-auto text-xs text-text-muted">共 {{ filteredRows.length }} 座</span>
      </div>

      <div class="flex flex-wrap items-center gap-3 rounded-lg bg-surface-1 px-3 py-2 text-xs text-text-secondary">
        <span class="text-text-muted">蓄水率</span>
        <span>0%</span>
        <span class="h-2 w-40 rounded-full" :style="{ backgroundImage: LEGEND_GRADIENT }" />
        <span>100%</span>
        <span class="flex items-center gap-1.5">
          <span class="h-3 w-3 rounded-sm bg-[#334155]" />
          無資料
        </span>
      </div>

      <section class="h-96 overflow-hidden rounded-lg bg-surface-1">
        <MapBaseMap @ready="onMapReady" />
      </section>

      <section class="overflow-x-auto rounded-lg bg-surface-1">
        <table class="w-full min-w-2xl text-left text-sm">
          <thead>
            <tr class="border-b border-surface-2 text-text-muted">
              <th class="cursor-pointer px-3 py-2 font-normal" @click="toggleSort('name')">水庫</th>
              <th class="cursor-pointer px-3 py-2 font-normal" @click="toggleSort('storagePercentage')">蓄水率</th>
              <th class="cursor-pointer px-3 py-2 text-right font-normal" @click="toggleSort('waterLevel')">水位（m）</th>
              <th class="cursor-pointer px-3 py-2 text-right font-normal" @click="toggleSort('inflow')">進流量（CMS）</th>
              <th class="cursor-pointer px-3 py-2 text-right font-normal" @click="toggleSort('outflow')">出流量（CMS）</th>
              <th class="px-3 py-2 font-normal">觀測時間</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="s in sortedRows" :key="s.id" class="border-b border-surface-2/60 hover:bg-surface-2/40">
              <td class="px-3 py-1.5 text-text-primary">{{ s.name }}</td>
              <td class="px-3 py-1.5">
                <div class="flex items-center gap-2">
                  <div class="h-2 w-24 shrink-0 overflow-hidden rounded-full bg-surface-2">
                    <div
                      class="h-full rounded-full"
                      :style="{ width: `${s.storagePercentage ?? 0}%`, backgroundColor: reservoirStorageColor(s.storagePercentage) }"
                    />
                  </div>
                  <span class="tabular-nums text-text-secondary">{{ s.storagePercentage ?? '—' }}{{ s.storagePercentage !== null ? '%' : '' }}</span>
                </div>
              </td>
              <td class="px-3 py-1.5 text-right tabular-nums text-text-secondary">{{ s.waterLevel ?? '—' }}</td>
              <td class="px-3 py-1.5 text-right tabular-nums text-text-secondary">{{ s.inflow ?? '—' }}</td>
              <td class="px-3 py-1.5 text-right tabular-nums text-text-secondary">{{ s.outflow ?? '—' }}</td>
              <td class="px-3 py-1.5 text-text-muted">{{ formatTaipei(s.observationTime) }}</td>
            </tr>
          </tbody>
        </table>
        <p v-if="sortedRows.length === 0" class="p-6 text-center text-text-muted">找不到符合的水庫。</p>
      </section>

      <p class="text-xs text-text-muted">
        資料來源：<a href="https://opendata.wra.gov.tw" target="_blank" rel="noopener" class="hover:text-text-secondary">經濟部水利署水利資料開放平台</a>
        （水庫水情、水庫基本資料），每 30 分鐘更新一次。蓄水率＝即時有效蓄水量 ÷ 最近一次測量的有效容量；
        進出流量單位依業界慣例標示為 CMS（立方公尺/秒），原始資料未逐欄位附單位說明。
      </p>
    </template>
  </div>
</template>

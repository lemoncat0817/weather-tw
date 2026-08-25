<script setup lang="ts">
import { computed, ref, shallowRef, watch } from 'vue'
import type { MapLibreMap, GeoJSONSource } from 'maplibre-gl'
import type { GeoFeatureCollection, GeoPoint, Observation } from '#shared/types'
import { buildLinearColorExpression, temperatureColorExpression } from '@/utils/mapColorExpression'
import { temperatureColor, precipitationColor } from '@/utils/colorScales'
import { flattenStationsByMetric } from '@/utils/stationGeo'
import { formatTaipei } from '@/utils/formatDate'

useSeoMeta({ title: '觀測資料 — 氣象知多少', description: '全台測站即時觀測地圖與可排序表格，涵蓋氣象站與雨量站。' })

type StationType = 'weather' | 'rain'
const stationType = ref<StationType>('weather')

const { data: stations } = await useFetch<GeoFeatureCollection<GeoPoint, Observation>>('/api/observation/stations', {
  query: { type: stationType },
  key: 'observation-stations-full'
})

const search = ref('')
const sortKey = ref<'stationName' | 'county' | 'temperature' | 'relativeHumidity' | 'windSpeed' | 'precipitation' | 'obsTime'>(
  'temperature'
)
const sortDesc = ref(true)

const rows = computed(() => stations.value?.features.map((f) => f.properties) ?? [])

const filteredRows = computed(() => {
  const q = search.value.trim()
  if (!q) return rows.value
  return rows.value.filter((r) => r.stationName.includes(q) || r.county.includes(q) || r.town.includes(q))
})

// stationName/county/obsTime 是 Observation 頂層欄位；其餘（溫度、濕度、風速、雨量）是巢狀在 reading 底下
const TOP_LEVEL_KEYS = new Set(['stationName', 'county', 'obsTime'])

function sortValue(row: Observation, key: typeof sortKey.value): string | number {
  if (TOP_LEVEL_KEYS.has(key)) return row[key as 'stationName' | 'county' | 'obsTime']
  return row.reading[key as keyof Observation['reading']] ?? -Infinity
}

const sortedRows = computed(() => {
  const key = sortKey.value
  return [...filteredRows.value].sort((a, b) => {
    const av = sortValue(a, key)
    const bv = sortValue(b, key)
    if (typeof av === 'string' || typeof bv === 'string') {
      return sortDesc.value ? String(bv).localeCompare(String(av)) : String(av).localeCompare(String(bv))
    }
    return sortDesc.value ? bv - av : av - bv
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

watch(stationType, () => {
  sortKey.value = stationType.value === 'rain' ? 'precipitation' : 'temperature'
})

// --- 地圖 ---
const mapInstance = shallowRef<MapLibreMap | null>(null)
const STATIONS_SOURCE = 'obs-stations'
const STATIONS_LAYER = 'obs-stations-layer'

function currentMetric() {
  return stationType.value === 'rain' ? ('precipitation' as const) : ('temperature' as const)
}
function currentColorExpression() {
  return stationType.value === 'rain'
    ? buildLinearColorExpression('value', [0, 50], precipitationColor, 6)
    : temperatureColorExpression('value', temperatureColor)
}

function renderStations(map: MapLibreMap) {
  if (!stations.value) return
  const data = flattenStationsByMetric(stations.value, currentMetric())
  const existing = map.getSource<GeoJSONSource>(STATIONS_SOURCE)
  if (existing) {
    existing.setData(data)
    map.setPaintProperty(STATIONS_LAYER, 'circle-color', currentColorExpression())
    return
  }
  map.addSource(STATIONS_SOURCE, { type: 'geojson', data })
  map.addLayer({
    id: STATIONS_LAYER,
    type: 'circle',
    source: STATIONS_SOURCE,
    paint: {
      'circle-radius': 4,
      'circle-color': currentColorExpression(),
      'circle-stroke-width': 1,
      'circle-stroke-color': '#05070d'
    }
  })
}

function onMapReady(map: MapLibreMap) {
  mapInstance.value = map
  renderStations(map)
}

watch([stations, stationType], () => {
  if (mapInstance.value) renderStations(mapInstance.value)
})
</script>

<template>
  <div class="space-y-4">
    <div class="flex flex-wrap items-center gap-3 rounded-lg bg-surface-1 p-3">
      <div class="flex overflow-hidden rounded-md border border-surface-2">
        <button
          type="button"
          class="px-3 py-1.5 text-sm"
          :class="stationType === 'weather' ? 'bg-accent text-surface-0' : 'text-text-secondary hover:bg-surface-2'"
          @click="stationType = 'weather'"
        >
          氣象站
        </button>
        <button
          type="button"
          class="px-3 py-1.5 text-sm"
          :class="stationType === 'rain' ? 'bg-accent text-surface-0' : 'text-text-secondary hover:bg-surface-2'"
          @click="stationType = 'rain'"
        >
          雨量站
        </button>
      </div>
      <input
        v-model="search"
        type="search"
        placeholder="搜尋站名或縣市…"
        class="ml-auto w-48 rounded-md border border-surface-2 bg-surface-0 px-2 py-1 text-sm text-text-primary placeholder:text-text-muted"
      >
      <span class="text-xs text-text-muted">共 {{ filteredRows.length }} 站</span>
    </div>

    <section class="h-96 overflow-hidden rounded-lg bg-surface-1">
      <MapBaseMap @ready="onMapReady" />
    </section>

    <section class="overflow-x-auto rounded-lg bg-surface-1">
      <table class="w-full min-w-[42rem] text-left text-sm">
        <thead>
          <tr class="border-b border-surface-2 text-text-muted">
            <th class="cursor-pointer px-3 py-2 font-normal" @click="toggleSort('stationName')">測站</th>
            <th class="cursor-pointer px-3 py-2 font-normal" @click="toggleSort('county')">縣市/鄉鎮</th>
            <th class="cursor-pointer px-3 py-2 text-right font-normal" @click="toggleSort('temperature')">溫度</th>
            <th class="cursor-pointer px-3 py-2 text-right font-normal" @click="toggleSort('relativeHumidity')">濕度</th>
            <th class="cursor-pointer px-3 py-2 text-right font-normal" @click="toggleSort('windSpeed')">風速</th>
            <th class="cursor-pointer px-3 py-2 text-right font-normal" @click="toggleSort('precipitation')">雨量</th>
            <th class="cursor-pointer px-3 py-2 text-right font-normal" @click="toggleSort('obsTime')">觀測時間</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="s in sortedRows" :key="s.stationId" class="border-b border-surface-2/60 hover:bg-surface-2/40">
            <td class="px-3 py-1.5 text-text-primary">{{ s.stationName }}</td>
            <td class="px-3 py-1.5 text-text-secondary">{{ s.county }}{{ s.town }}</td>
            <td class="px-3 py-1.5 text-right tabular-nums text-text-secondary">{{ s.reading.temperature ?? '—' }}</td>
            <td class="px-3 py-1.5 text-right tabular-nums text-text-secondary">{{ s.reading.relativeHumidity ?? '—' }}</td>
            <td class="px-3 py-1.5 text-right tabular-nums text-text-secondary">{{ s.reading.windSpeed ?? '—' }}</td>
            <td class="px-3 py-1.5 text-right tabular-nums text-text-secondary">{{ s.reading.precipitation ?? '—' }}</td>
            <td class="px-3 py-1.5 text-right tabular-nums text-text-muted">{{ formatTaipei(s.obsTime) }}</td>
          </tr>
        </tbody>
      </table>
      <p v-if="sortedRows.length === 0" class="p-6 text-center text-text-muted">找不到符合的測站。</p>
    </section>
  </div>
</template>

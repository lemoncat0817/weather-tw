<script setup lang="ts">
import { computed, ref, shallowRef, watch } from 'vue'
import { Popup, type MapLibreMap } from 'maplibre-gl'
import type { Typhoon, TyphoonFixPoint, GeoFeatureCollection, GeoPoint } from '#shared/types'
import { buildTyphoonIntensityOption } from '@/utils/typhoonChart'
import { windSpeedColorExpression } from '@/utils/mapColorExpression'
import { windSpeedColor } from '@/utils/colorScales'
import { formatTaipei } from '@/utils/formatDate'

useSeoMeta({
  title: '颱風路徑 — 氣象知多少',
  description: '活躍颱風的歷史與預報路徑、70% 機率不確定性錐、象限風半徑與強度時序。'
})

const { data: typhoons } = await useFetch<Typhoon[]>('/api/typhoon/active')

const selectedId = ref<string | null>(null)
const selected = computed<Typhoon | null>(() => {
  const list = typhoons.value ?? []
  if (list.length === 0) return null
  return list.find((t) => t.id === selectedId.value) ?? list[0]!
})

const latest = computed<TyphoonFixPoint | null>(() => selected.value?.track.at(-1) ?? null)
const intensityOption = computed(() => (selected.value ? buildTyphoonIntensityOption(selected.value) : null))

const mapInstance = shallowRef<MapLibreMap | null>(null)

const CONE_SRC = 'typhoon-cone-src'
const CONE_LAYER = 'typhoon-cone-layer'
const TRACK_SRC = 'typhoon-track-src'
const TRACK_LAYER = 'typhoon-track-layer'
const FORECAST_SRC = 'typhoon-forecast-src'
const FORECAST_LAYER = 'typhoon-forecast-layer'
const POINTS_SRC = 'typhoon-points-src'
const POINTS_LAYER = 'typhoon-points-layer'

function pointsFeatureCollection(typhoon: Typhoon): GeoFeatureCollection<GeoPoint, { windSpeed: number; pressure: number | null; time: string; kind: string }> {
  const toFeature = (p: TyphoonFixPoint, kind: string) => ({
    type: 'Feature' as const,
    geometry: { type: 'Point' as const, coordinates: [p.position.lon, p.position.lat] as [number, number] },
    properties: { windSpeed: p.maxWindSpeed ?? 0, pressure: p.pressure, time: p.time, kind }
  })
  return {
    type: 'FeatureCollection',
    features: [...typhoon.track.map((p) => toFeature(p, 'track')), ...typhoon.forecast.map((p) => toFeature(p, 'forecast'))]
  }
}

function boundsOf(typhoon: Typhoon): [[number, number], [number, number]] {
  const points = [...typhoon.track, ...typhoon.forecast].map((p) => p.position)
  const lons = points.map((p) => p.lon)
  const lats = points.map((p) => p.lat)
  return [
    [Math.min(...lons) - 1, Math.min(...lats) - 1],
    [Math.max(...lons) + 1, Math.max(...lats) + 1]
  ]
}

function clearTyphoonLayers(map: MapLibreMap) {
  for (const id of [CONE_LAYER, TRACK_LAYER, FORECAST_LAYER, POINTS_LAYER]) {
    if (map.getLayer(id)) map.removeLayer(id)
  }
  for (const id of [CONE_SRC, TRACK_SRC, FORECAST_SRC, POINTS_SRC]) {
    if (map.getSource(id)) map.removeSource(id)
  }
}

function renderTyphoon(map: MapLibreMap, typhoon: Typhoon) {
  clearTyphoonLayers(map)

  if (typhoon.probabilityCone) {
    map.addSource(CONE_SRC, { type: 'geojson', data: typhoon.probabilityCone })
    map.addLayer({
      id: CONE_LAYER,
      type: 'fill',
      source: CONE_SRC,
      paint: { 'fill-color': '#e66767', 'fill-opacity': 0.12 }
    })
  }

  map.addSource(TRACK_SRC, { type: 'geojson', data: typhoon.trackLine })
  map.addLayer({
    id: TRACK_LAYER,
    type: 'line',
    source: TRACK_SRC,
    paint: { 'line-color': '#94a3b8', 'line-width': 2 }
  })

  map.addSource(FORECAST_SRC, { type: 'geojson', data: typhoon.forecastLine })
  map.addLayer({
    id: FORECAST_LAYER,
    type: 'line',
    source: FORECAST_SRC,
    paint: { 'line-color': '#e66767', 'line-width': 2, 'line-dasharray': [2, 2] }
  })

  map.addSource(POINTS_SRC, { type: 'geojson', data: pointsFeatureCollection(typhoon) })
  map.addLayer({
    id: POINTS_LAYER,
    type: 'circle',
    source: POINTS_SRC,
    paint: {
      'circle-radius': 5,
      'circle-color': windSpeedColorExpression('windSpeed', windSpeedColor),
      'circle-stroke-width': 1,
      'circle-stroke-color': '#05070d'
    }
  })

  map.on('click', POINTS_LAYER, (e) => {
    const f = e.features?.[0]
    if (!f || f.geometry.type !== 'Point') return
    const props = f.properties as { windSpeed: number; pressure: number | null; time: string; kind: string }
    new Popup()
      .setLngLat(f.geometry.coordinates as [number, number])
      .setHTML(
        `<div style="color:#0f172a">${formatTaipei(props.time)}<br/>最大風速 ${props.windSpeed} m/s${props.pressure ? `<br/>氣壓 ${props.pressure} hPa` : ''}</div>`
      )
      .addTo(map)
  })
  map.on('mouseenter', POINTS_LAYER, () => (map.getCanvas().style.cursor = 'pointer'))
  map.on('mouseleave', POINTS_LAYER, () => (map.getCanvas().style.cursor = ''))

  map.fitBounds(boundsOf(typhoon), { padding: 48, animate: false })
}

function onMapReady(map: MapLibreMap) {
  mapInstance.value = map
  if (selected.value) renderTyphoon(map, selected.value)
}

watch(selected, (typhoon) => {
  if (mapInstance.value && typhoon) renderTyphoon(mapInstance.value, typhoon)
})
</script>

<template>
  <div class="space-y-4">
    <div v-if="!typhoons || typhoons.length === 0" class="rounded-lg bg-surface-1 p-8 text-center">
      <p class="text-text-secondary">目前無活躍的熱帶氣旋。</p>
    </div>

    <template v-else>
      <!-- 颱風選擇器：多個活躍颱風時才顯示 -->
      <div v-if="typhoons.length > 1" class="flex flex-wrap gap-2 rounded-lg bg-surface-1 p-2">
        <button
          v-for="t in typhoons"
          :key="t.id"
          type="button"
          class="rounded-md px-3 py-1.5 text-sm"
          :class="selected?.id === t.id ? 'bg-accent text-surface-0' : 'text-text-secondary hover:bg-surface-2'"
          @click="selectedId = t.id"
        >
          {{ t.nameZh || t.name }}
        </button>
      </div>

      <!-- 現況卡片 -->
      <section v-if="selected && latest" class="flex flex-wrap items-center gap-4 rounded-lg bg-surface-1 p-6">
        <div>
          <p class="text-sm text-text-muted">{{ selected.year }} 年 · {{ selected.name }}</p>
          <p class="text-2xl font-semibold text-text-primary">{{ selected.nameZh || selected.name }}</p>
        </div>
        <div class="ml-auto grid grid-cols-2 gap-x-6 gap-y-1 text-sm sm:grid-cols-4">
          <div>
            <p class="text-text-muted">最大風速</p>
            <p class="tabular-nums text-text-primary">{{ latest.maxWindSpeed ?? '—' }} m/s</p>
          </div>
          <div>
            <p class="text-text-muted">中心氣壓</p>
            <p class="tabular-nums text-text-primary">{{ latest.pressure ?? '—' }} hPa</p>
          </div>
          <div>
            <p class="text-text-muted">移動方向</p>
            <p class="tabular-nums text-text-primary">{{ latest.movingDirection ?? '—' }}</p>
          </div>
          <div>
            <p class="text-text-muted">移動速度</p>
            <p class="tabular-nums text-text-primary">{{ latest.movingSpeed ?? '—' }} km/h</p>
          </div>
        </div>
      </section>

      <!-- 路徑地圖 -->
      <section class="h-[28rem] overflow-hidden rounded-lg bg-surface-1">
        <MapBaseMap :center="[125, 20]" :zoom="4.2" @ready="onMapReady" />
      </section>

      <!-- 強度時序 -->
      <section class="rounded-lg bg-surface-1 p-4">
        <h2 class="mb-2 text-sm font-medium text-text-secondary">中心氣壓與最大風速時序</h2>
        <ChartsBaseChart v-if="intensityOption" :option="intensityOption" height="320px" :crosshair="true" />
      </section>

      <!-- 預報路徑表 -->
      <section v-if="selected && selected.forecast.length > 0" class="overflow-x-auto rounded-lg bg-surface-1 p-4">
        <h2 class="mb-2 text-sm font-medium text-text-secondary">未來路徑預報</h2>
        <table class="w-full min-w-[36rem] text-left text-sm">
          <thead>
            <tr class="text-text-muted">
              <th class="pb-2 pr-4 font-normal">時間</th>
              <th class="pb-2 pr-4 font-normal">位置</th>
              <th class="pb-2 pr-4 font-normal">最大風速</th>
              <th class="pb-2 pr-4 font-normal">中心氣壓</th>
              <th class="pb-2 font-normal">移動</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in selected.forecast" :key="p.time" class="border-t border-surface-2">
              <td class="py-1.5 pr-4 tabular-nums text-text-primary">{{ formatTaipei(p.time) }}</td>
              <td class="py-1.5 pr-4 tabular-nums text-text-secondary">{{ p.position.lat.toFixed(1) }}, {{ p.position.lon.toFixed(1) }}</td>
              <td class="py-1.5 pr-4 tabular-nums text-text-secondary">{{ p.maxWindSpeed ?? '—' }} m/s</td>
              <td class="py-1.5 pr-4 tabular-nums text-text-secondary">{{ p.pressure ?? '—' }} hPa</td>
              <td class="py-1.5 tabular-nums text-text-secondary">{{ p.movingDirection ?? '—' }} {{ p.movingSpeed ?? '—' }} km/h</td>
            </tr>
          </tbody>
        </table>
      </section>
    </template>
  </div>
</template>

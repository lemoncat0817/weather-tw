<script setup lang="ts">
import { computed, ref, shallowRef, watch } from 'vue'
import { useLocalStorage } from '@vueuse/core'
import { Marker, Popup, type MapLibreMap, type GeoJSONSource, type ExpressionSpecification } from 'maplibre-gl'
import type { Earthquake, EarthquakeStation, GeoFeatureCollection, GeoPoint } from '#shared/types'
import { buildIntensityBarOption } from '@/utils/earthquakeChart'
import { seismicIntensityColor } from '@/utils/colorScales'
import { seismicIntensityColorExpression } from '@/utils/mapColorExpression'
import { formatTaipei } from '@/utils/formatDate'

useSeoMeta({
  title: '地震資訊 — 氣象知多少',
  description: '近期有感地震：震央地圖、測站級實測震度／PGA、規模、深度與各縣市震度分布。'
})

type EarthquakeScope = 'significant' | 'all'
// 記住使用者上次選的範圍；initOnMounted 的理由見 climate.vue 同樣的寫法
const scope = useLocalStorage<EarthquakeScope>('earthquake-scope', 'significant', { initOnMounted: true })

const { data: earthquakes } = await useFetch<Earthquake[]>('/api/earthquake/recent', {
  query: { limit: 15, type: scope },
  key: () => `earthquake-recent-${scope.value}`
})

const selectedId = ref<string | null>(null)
const selected = computed<Earthquake | null>(() => {
  const list = earthquakes.value ?? []
  if (list.length === 0) return null
  return list.find((e) => e.id === selectedId.value) ?? list[0]!
})

const intensityBarOption = computed(() => (selected.value ? buildIntensityBarOption(selected.value.shakingAreas) : null))

const mapInstance = shallowRef<MapLibreMap | null>(null)
const marker = shallowRef<Marker | null>(null)

const STATIONS_SOURCE = 'eq-stations'
const STATIONS_LAYER = 'eq-stations-layer'

function stationsFeatureCollection(stations: EarthquakeStation[]): GeoFeatureCollection<GeoPoint, EarthquakeStation> {
  return {
    type: 'FeatureCollection',
    features: stations.map((s) => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [s.position.lon, s.position.lat] },
      properties: s
    }))
  }
}

/** 標記大小編碼 PGA（gal），沒有 pga 的測站（見 normalizeEarthquakes 註解）退回最小點；
 *  8px 是資料視覺化最小可視標記尺寸的下限，50 gal 以上大致已是有感度很高的強震等級 */
const STATION_RADIUS_EXPRESSION = [
  'interpolate',
  ['linear'],
  ['coalesce', ['get', 'pga'], 0],
  0,
  8,
  50,
  20
] as unknown as ExpressionSpecification

function renderStations(map: MapLibreMap, eq: Earthquake) {
  const data = stationsFeatureCollection(eq.stations)
  const existing = map.getSource<GeoJSONSource>(STATIONS_SOURCE)
  if (existing) {
    existing.setData(data)
    return
  }
  if (eq.stations.length === 0) return

  map.addSource(STATIONS_SOURCE, { type: 'geojson', data })
  map.addLayer({
    id: STATIONS_LAYER,
    type: 'circle',
    source: STATIONS_SOURCE,
    paint: {
      'circle-radius': STATION_RADIUS_EXPRESSION,
      'circle-color': seismicIntensityColorExpression('seismicIntensity', seismicIntensityColor),
      'circle-opacity': 0.85,
      'circle-stroke-width': 1,
      'circle-stroke-color': '#05070d'
    }
  })

  map.on('click', STATIONS_LAYER, (e) => {
    const f = e.features?.[0]
    if (!f || f.geometry.type !== 'Point') return
    const props = f.properties as unknown as EarthquakeStation
    new Popup()
      .setLngLat(f.geometry.coordinates as [number, number])
      .setHTML(
        `<div style="color:#0f172a"><strong>${props.stationName}</strong><br/>震度 ${props.seismicIntensity || '—'}` +
          `${props.pga !== null ? `<br/>PGA ${props.pga} gal` : ''}<br/>距震央 ${props.epicenterDistance} km</div>`
      )
      .addTo(map)
  })
  map.on('mouseenter', STATIONS_LAYER, () => (map.getCanvas().style.cursor = 'pointer'))
  map.on('mouseleave', STATIONS_LAYER, () => (map.getCanvas().style.cursor = ''))
}

function placeMarker(map: MapLibreMap, eq: Earthquake) {
  marker.value?.remove()
  const radius = 12 + eq.magnitude * 3
  const el = document.createElement('div')
  el.style.width = `${radius}px`
  el.style.height = `${radius}px`
  el.style.borderRadius = '50%'
  el.style.backgroundColor = seismicIntensityColor(eq.maxIntensity)
  el.style.opacity = '0.75'
  el.style.border = '2px solid #05070d'
  marker.value = new Marker({ element: el }).setLngLat([eq.epicenter.lon, eq.epicenter.lat]).addTo(map)
  renderStations(map, eq)
  map.flyTo({ center: [eq.epicenter.lon, eq.epicenter.lat], zoom: 7, animate: false })
}

function onMapReady(map: MapLibreMap) {
  mapInstance.value = map
  if (selected.value) placeMarker(map, selected.value)
}

watch(selected, (eq) => {
  if (mapInstance.value && eq) placeMarker(mapInstance.value, eq)
})
</script>

<template>
  <div class="space-y-4">
    <div class="flex w-fit overflow-hidden rounded-lg border border-surface-2 bg-surface-1">
      <button
        type="button"
        class="px-3 py-1.5 text-sm"
        :class="scope === 'significant' ? 'bg-accent text-surface-0' : 'text-text-secondary hover:bg-surface-2'"
        @click="scope = 'significant'"
      >
        顯著有感
      </button>
      <button
        type="button"
        class="px-3 py-1.5 text-sm"
        :class="scope === 'all' ? 'bg-accent text-surface-0' : 'text-text-secondary hover:bg-surface-2'"
        @click="scope = 'all'"
      >
        全部有感
      </button>
    </div>

    <div v-if="!earthquakes || earthquakes.length === 0" class="rounded-lg bg-surface-1 p-8 text-center">
      <p class="text-text-secondary">近期無{{ scope === 'significant' ? '顯著' : '' }}有感地震回報。</p>
    </div>

    <div v-else class="grid gap-4 lg:grid-cols-[20rem_1fr]">
      <!-- 地震列表 -->
      <div class="max-h-[36rem] space-y-1.5 overflow-y-auto rounded-lg bg-surface-1 p-2 lg:max-h-[calc(100vh-10rem)]">
        <button
          v-for="eq in earthquakes"
          :key="eq.id"
          type="button"
          class="flex w-full items-start gap-2 rounded-md p-2 text-left"
          :class="selected?.id === eq.id ? 'bg-surface-2' : 'hover:bg-surface-2/60'"
          @click="selectedId = eq.id"
        >
          <span
            class="mt-1 h-2.5 w-2.5 shrink-0 rounded-full"
            :style="{ backgroundColor: seismicIntensityColor(eq.maxIntensity) }"
          />
          <span class="min-w-0">
            <span class="block truncate text-sm text-text-primary">{{ eq.epicenterDescription }}</span>
            <span class="block text-xs text-text-muted">{{ formatTaipei(eq.originTime) }} · 規模 {{ eq.magnitude }} · 最大震度 {{ eq.maxIntensity }}</span>
          </span>
        </button>
      </div>

      <!-- 詳情 -->
      <div v-if="selected" class="space-y-4">
        <section class="flex flex-wrap items-start gap-4 rounded-lg bg-surface-1 p-6">
          <div>
            <p class="text-sm text-text-muted">{{ formatTaipei(selected.originTime) }}</p>
            <p class="text-lg text-text-primary">{{ selected.epicenterDescription }}</p>
          </div>
          <div class="ml-auto grid grid-cols-3 gap-x-6 gap-y-1 text-sm">
            <div>
              <p class="text-text-muted">規模</p>
              <p class="tabular-nums text-text-primary">{{ selected.magnitude }} ({{ selected.magnitudeType }})</p>
            </div>
            <div>
              <p class="text-text-muted">深度</p>
              <p class="tabular-nums text-text-primary">{{ selected.depthKm }} km</p>
            </div>
            <div>
              <p class="text-text-muted">最大震度</p>
              <p class="tabular-nums text-text-primary" :style="{ color: seismicIntensityColor(selected.maxIntensity) }">
                {{ selected.maxIntensity }}
              </p>
            </div>
          </div>
          <p class="w-full text-sm text-text-secondary">{{ selected.reportContent }}</p>
        </section>

        <div class="grid gap-4 lg:grid-cols-2">
          <section class="overflow-hidden rounded-lg bg-surface-1">
            <div class="h-80">
              <MapBaseMap :center="[selected.epicenter.lon, selected.epicenter.lat]" :zoom="7" @ready="onMapReady" />
            </div>
            <p v-if="selected.stations.length > 0" class="border-t border-surface-2 px-3 py-2 text-xs text-text-muted">
              測站點：顏色 = 實測震度，大小 = PGA（地表加速度，點擊查看數值）
            </p>
          </section>

          <section class="rounded-lg bg-surface-1 p-4">
            <h2 class="mb-2 text-sm font-medium text-text-secondary">各縣市震度</h2>
            <ChartsBaseChart
              v-if="intensityBarOption"
              :option="intensityBarOption"
              :height="`${Math.max(160, selected.shakingAreas.length * 28)}px`"
              :crosshair="false"
            />
          </section>
        </div>
      </div>
    </div>
  </div>
</template>

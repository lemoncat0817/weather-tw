<script setup lang="ts">
import { ref, shallowRef, watch } from 'vue'
import { Popup, type MapLibreMap } from 'maplibre-gl'
import type { RadarFrame, GeoFeatureCollection, GeoPoint, GeoPolygon, Observation, TownSummary } from '#shared/types'
import { temperatureColorExpression } from '@/utils/mapColorExpression'
import { temperatureColor } from '@/utils/colorScales'
import { formatTaipei } from '@/utils/formatDate'

useSeoMeta({ title: '互動地圖 — 氣象知多少', description: '雷達回波、測站觀測與全台鄉鎮溫度分布互動地圖。' })

const { data: radarFrames } = await useFetch<RadarFrame[]>('/api/radar/frames')
const { data: stations } = await useFetch<GeoFeatureCollection<GeoPoint, Observation>>('/api/observation/stations')
const { data: townSummaries } = await useFetch<TownSummary[]>('/api/forecast/choropleth')

const showRadar = ref(true)
const showStations = ref(true)
const showChoropleth = ref(false)
const radarOpacity = ref(0.7)
const mapInstance = shallowRef<MapLibreMap | null>(null)

const RADAR_SOURCE = 'radar'
const RADAR_LAYER = 'radar-layer'
const STATIONS_SOURCE = 'stations'
const STATIONS_LAYER = 'stations-layer'
const CHOROPLETH_SOURCE = 'choropleth'
const CHOROPLETH_LAYER = 'choropleth-layer'
const CHOROPLETH_LINE = 'choropleth-line'

/** MapLibre 的 interpolate expression 拿到 null 會整個評估失敗，缺溫度的測站（例如雨量站）直接濾掉不畫點 */
function flattenStations(fc: GeoFeatureCollection<GeoPoint, Observation>) {
  return {
    type: 'FeatureCollection' as const,
    features: fc.features
      .filter((f) => f.properties.reading.temperature !== null)
      .map((f) => ({
        type: 'Feature' as const,
        geometry: f.geometry,
        properties: {
          stationName: f.properties.stationName,
          county: f.properties.county,
          town: f.properties.town,
          temperature: f.properties.reading.temperature
        }
      }))
  }
}

function boundsToCoordinates(
  bounds: [number, number, number, number]
): [[number, number], [number, number], [number, number], [number, number]] {
  const [west, south, east, north] = bounds
  return [
    [west, north],
    [east, north],
    [east, south],
    [west, south]
  ]
}

async function setupLayers(map: MapLibreMap) {
  // 雷達（用累積到的最新一張影格；O-A0058-005 的 bounds 已在伺服器端算好，直接用）
  const frame = radarFrames.value?.at(-1)
  if (frame) {
    map.addSource(RADAR_SOURCE, { type: 'image', url: frame.imageUrl, coordinates: boundsToCoordinates(frame.bounds) })
    map.addLayer({
      id: RADAR_LAYER,
      type: 'raster',
      source: RADAR_SOURCE,
      paint: { 'raster-opacity': radarOpacity.value },
      layout: { visibility: showRadar.value ? 'visible' : 'none' }
    })
  }

  // 測站觀測點
  if (stations.value) {
    map.addSource(STATIONS_SOURCE, { type: 'geojson', data: flattenStations(stations.value) })
    map.addLayer({
      id: STATIONS_LAYER,
      type: 'circle',
      source: STATIONS_SOURCE,
      paint: {
        'circle-radius': 5,
        'circle-color': temperatureColorExpression('temperature', temperatureColor),
        'circle-stroke-width': 1,
        'circle-stroke-color': '#05070d'
      },
      layout: { visibility: showStations.value ? 'visible' : 'none' }
    })

    map.on('click', STATIONS_LAYER, (e) => {
      const f = e.features?.[0]
      if (!f || f.geometry.type !== 'Point') return
      const props = f.properties as { stationName: string; county: string; town: string; temperature: number }
      new Popup()
        .setLngLat(f.geometry.coordinates as [number, number])
        .setHTML(
          `<div style="color:#0f172a"><strong>${props.stationName}</strong><br/>${props.county}${props.town}<br/>${props.temperature}°C</div>`
        )
        .addTo(map)
    })
    map.on('mouseenter', STATIONS_LAYER, () => (map.getCanvas().style.cursor = 'pointer'))
    map.on('mouseleave', STATIONS_LAYER, () => (map.getCanvas().style.cursor = ''))
  }

  // 鄉鎮 choropleth：taiwan-towns.geojson 的界線 + choropleth API 的溫度資料，用 county+town join
  if (townSummaries.value) {
    const boundaries = await $fetch<GeoFeatureCollection<GeoPolygon, { county: string; town: string }>>(
      '/data/taiwan-towns.geojson'
    )
    const byKey = new Map(townSummaries.value.map((t) => [`${t.county}-${t.town}`, t]))
    const joined = {
      type: 'FeatureCollection' as const,
      features: boundaries.features
        .map((f) => {
          const props = f.properties as { county: string; town: string }
          const summary = byKey.get(`${props.county}-${props.town}`)
          if (!summary) return null
          return { ...f, properties: { ...props, temperature: summary.temperature, weather: summary.weather } }
        })
        .filter((f): f is NonNullable<typeof f> => f !== null)
    }

    map.addSource(CHOROPLETH_SOURCE, { type: 'geojson', data: joined })
    map.addLayer(
      {
        id: CHOROPLETH_LAYER,
        type: 'fill',
        source: CHOROPLETH_SOURCE,
        paint: { 'fill-color': temperatureColorExpression('temperature', temperatureColor), 'fill-opacity': 0.55 },
        layout: { visibility: showChoropleth.value ? 'visible' : 'none' }
      },
      STATIONS_LAYER
    )
    map.addLayer(
      {
        id: CHOROPLETH_LINE,
        type: 'line',
        source: CHOROPLETH_SOURCE,
        paint: { 'line-color': 'rgba(148, 163, 184, 0.25)', 'line-width': 0.5 },
        layout: { visibility: showChoropleth.value ? 'visible' : 'none' }
      },
      STATIONS_LAYER
    )
  }
}

function onMapReady(map: MapLibreMap) {
  mapInstance.value = map
  setupLayers(map)
}

function toggleLayer(layerId: string, visible: boolean) {
  mapInstance.value?.setLayoutProperty(layerId, 'visibility', visible ? 'visible' : 'none')
}

watch(showRadar, (v) => toggleLayer(RADAR_LAYER, v))
watch(showStations, (v) => toggleLayer(STATIONS_LAYER, v))
watch(showChoropleth, (v) => {
  toggleLayer(CHOROPLETH_LAYER, v)
  toggleLayer(CHOROPLETH_LINE, v)
})
watch(radarOpacity, (v) => mapInstance.value?.setPaintProperty(RADAR_LAYER, 'raster-opacity', v))
</script>

<template>
  <div class="flex h-[calc(100vh-8rem)] flex-col gap-3">
    <div class="flex flex-wrap items-center gap-4 rounded-lg bg-surface-1 px-4 py-2 text-sm">
      <label class="flex items-center gap-1.5 text-text-secondary">
        <input v-model="showRadar" type="checkbox" class="accent-accent" >
        雷達回波
      </label>
      <input
        v-if="showRadar"
        v-model.number="radarOpacity"
        type="range"
        min="0"
        max="1"
        step="0.1"
        class="w-24 accent-accent"
      >
      <label class="flex items-center gap-1.5 text-text-secondary">
        <input v-model="showStations" type="checkbox" class="accent-accent" >
        測站觀測
      </label>
      <label class="flex items-center gap-1.5 text-text-secondary">
        <input v-model="showChoropleth" type="checkbox" class="accent-accent" >
        鄉鎮溫度分布
      </label>
      <span v-if="radarFrames && radarFrames.length > 0" class="ml-auto text-xs text-text-muted">
        雷達影像時間：{{ formatTaipei(radarFrames[radarFrames.length - 1]!.time) }}
      </span>
    </div>

    <div class="flex-1 overflow-hidden rounded-lg bg-surface-1">
      <MapBaseMap @ready="onMapReady" />
    </div>
  </div>
</template>

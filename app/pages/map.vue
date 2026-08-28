<script setup lang="ts">
import { ref, shallowRef, watch, computed } from 'vue'
import { Popup, type MapLibreMap } from 'maplibre-gl'
import type { RadarFrame, ImageOverlayFrame, GeoFeatureCollection, GeoPoint, GeoPolygon, Observation, TownSummary } from '#shared/types'
import { temperatureColorExpression } from '@/utils/mapColorExpression'
import { temperatureColor } from '@/utils/colorScales'
import { formatTaipei } from '@/utils/formatDate'
import { flattenStationsForMap } from '@/utils/stationGeo'

useSeoMeta({ title: '互動地圖 — 氣象知多少', description: '雷達回波、衛星雲圖、測站觀測與全台鄉鎮溫度分布互動地圖。' })

const [{ data: radarFrames }, { data: stations }] = await Promise.all([
  useFetch<RadarFrame[]>('/api/radar/frames'),
  useFetch<GeoFeatureCollection<GeoPoint, Observation>>('/api/observation/stations')
])

// 只提供可見光——原本也接了紅外線（O-B0032-002），但實測拿 Taipei/Manila/Shanghai/Hainan
// 等已知地標對照像素位置，發現 CWA 該資料集自報的 GeoInfo 經緯度範圍（"102.0-155.0" /
// "0.0-50.0"，同系列 001/003/004 皆同）跟影像實際內容明顯對不上（Manila 落在海面、上海落在
// 內陸），偏移幅度達數度、不是四捨五入的誤差，是上游中繼資料本身有問題，不是這裡座標運算寫錯
// ——同一套程式碼、同一套 boundsToCoordinates 邏輯用在 O-B0031-003（可見光，GeoInfo 是精確到
// 小數點後好幾位的實測值）就完全對齊。沒有可靠的校正方式前，不要疊一張座標對不齊的圖上去。
const { data: satelliteFrame, execute: loadSatellite } = useFetch<ImageOverlayFrame>('/api/satellite/frame', {
  query: { type: 'visible' },
  immediate: false,
  server: false
})

// 鄉鎮分布預設關閉，不在進頁時阻塞雷達圖層；勾選後再抓
const { data: townSummaries, execute: loadChoropleth } = useFetch<TownSummary[]>('/api/forecast/choropleth', {
  immediate: false,
  server: false
})

const latestRadar = computed(() => radarFrames.value?.at(-1) ?? null)

// 在 HTML 解析階段就開始抓 PNG，不要等 MapLibre 底圖 load 完才發請求
useHead(() => {
  const url = latestRadar.value?.imageUrl
  if (!url) return {}
  return { link: [{ rel: 'preload', as: 'image', href: url, fetchpriority: 'high' }] }
})

const showRadar = ref(true)
const showStations = ref(true)
const showChoropleth = ref(false)
const showSatellite = ref(false)
const radarOpacity = ref(0.7)
const mapInstance = shallowRef<MapLibreMap | null>(null)

const RADAR_SOURCE = 'radar'
const RADAR_LAYER = 'radar-layer'
const STATIONS_SOURCE = 'stations'
const STATIONS_LAYER = 'stations-layer'
const CHOROPLETH_SOURCE = 'choropleth'
const CHOROPLETH_LAYER = 'choropleth-layer'
const CHOROPLETH_LINE = 'choropleth-line'
const SATELLITE_SOURCE = 'satellite'
const SATELLITE_LAYER = 'satellite-layer'

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

function setupRadar(map: MapLibreMap) {
  const frame = latestRadar.value
  if (!frame || map.getSource(RADAR_SOURCE)) return
  map.addSource(RADAR_SOURCE, { type: 'image', url: frame.imageUrl, coordinates: boundsToCoordinates(frame.bounds) })
  map.addLayer({
    id: RADAR_LAYER,
    type: 'raster',
    source: RADAR_SOURCE,
    paint: { 'raster-opacity': radarOpacity.value },
    layout: { visibility: showRadar.value ? 'visible' : 'none' }
  })
}

function setupStations(map: MapLibreMap) {
  if (!stations.value || map.getSource(STATIONS_SOURCE)) return
  map.addSource(STATIONS_SOURCE, { type: 'geojson', data: flattenStationsForMap(stations.value) })
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

async function setupChoropleth(map: MapLibreMap) {
  if (!townSummaries.value || map.getSource(CHOROPLETH_SOURCE)) return

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
    map.getLayer(STATIONS_LAYER) ? STATIONS_LAYER : undefined
  )
  map.addLayer(
    {
      id: CHOROPLETH_LINE,
      type: 'line',
      source: CHOROPLETH_SOURCE,
      paint: { 'line-color': 'rgba(148, 163, 184, 0.25)', 'line-width': 0.5 },
      layout: { visibility: showChoropleth.value ? 'visible' : 'none' }
    },
    map.getLayer(STATIONS_LAYER) ? STATIONS_LAYER : undefined
  )
}

// 衛星影像換 URL 沒辦法像 geojson 那樣用 setData 原地更新（image source 換圖要整個
// remove/re-add），乾脆整層拆掉重建——跟 typhoon.vue 選颱風時 clear+重畫是同一招，
// 反正切換頻率不高（使用者主動勾選/換可見光⇄紅外線才會觸發），不值得為了少一次
// remove/add 換成更複雜的 updateImage API
function renderSatellite(map: MapLibreMap) {
  if (map.getLayer(SATELLITE_LAYER)) map.removeLayer(SATELLITE_LAYER)
  if (map.getSource(SATELLITE_SOURCE)) map.removeSource(SATELLITE_SOURCE)

  const frame = satelliteFrame.value
  if (!frame) return
  map.addSource(SATELLITE_SOURCE, { type: 'image', url: frame.imageUrl, coordinates: boundsToCoordinates(frame.bounds) })
  map.addLayer(
    {
      id: SATELLITE_LAYER,
      type: 'raster',
      source: SATELLITE_SOURCE,
      paint: { 'raster-opacity': 0.85 },
      layout: { visibility: showSatellite.value ? 'visible' : 'none' }
    },
    map.getLayer(RADAR_LAYER) ? RADAR_LAYER : undefined
  )
}

function onMapReady(map: MapLibreMap) {
  mapInstance.value = map
  setupRadar(map)
  setupStations(map)
}

function toggleLayer(layerId: string, visible: boolean) {
  const map = mapInstance.value
  if (!map?.getLayer(layerId)) return
  map.setLayoutProperty(layerId, 'visibility', visible ? 'visible' : 'none')
}

watch(showRadar, (v) => {
  toggleLayer(RADAR_LAYER, v)
  // 雷達跟衛星都是不透明疊圖，同時開兩層只會互相蓋住，開一個就關掉另一個
  if (v) showSatellite.value = false
})
watch(showStations, (v) => toggleLayer(STATIONS_LAYER, v))
watch(showChoropleth, async (v) => {
  if (v) {
    if (!townSummaries.value) await loadChoropleth()
    if (mapInstance.value) await setupChoropleth(mapInstance.value)
  }
  toggleLayer(CHOROPLETH_LAYER, v)
  toggleLayer(CHOROPLETH_LINE, v)
})
watch(radarOpacity, (v) => {
  const map = mapInstance.value
  if (!map?.getLayer(RADAR_LAYER)) return
  map.setPaintProperty(RADAR_LAYER, 'raster-opacity', v)
})
watch(showSatellite, async (v) => {
  if (v) {
    showRadar.value = false
    if (!satelliteFrame.value) await loadSatellite()
    if (mapInstance.value) renderSatellite(mapInstance.value)
  }
  toggleLayer(SATELLITE_LAYER, v)
})
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
      <label class="flex items-center gap-1.5 text-text-secondary">
        <input v-model="showSatellite" type="checkbox" class="accent-accent" >
        衛星雲圖（可見光）
      </label>
      <span v-if="showSatellite" class="text-xs text-text-muted">夜間因缺乏日照會呈現全黑，是正常現象</span>
      <span v-if="showSatellite && satelliteFrame" class="ml-auto text-xs text-text-muted">
        衛星影像時間：{{ formatTaipei(satelliteFrame.time) }}
      </span>
      <span v-else-if="latestRadar" class="ml-auto text-xs text-text-muted">
        雷達影像時間：{{ formatTaipei(latestRadar.time) }}
      </span>
    </div>

    <div class="flex-1 overflow-hidden rounded-lg bg-surface-1">
      <MapBaseMap @ready="onMapReady" />
    </div>
  </div>
</template>

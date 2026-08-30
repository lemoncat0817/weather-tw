<script setup lang="ts">
import { computed, onBeforeUnmount, ref, shallowRef, watch } from 'vue'
import type { MapLibreMap, GeoJSONSource } from 'maplibre-gl'
import { loadMapLibre } from '@/utils/maplibre'
import type { GeoFeatureCollection, GeoPolygon, HeatInjuryTownForecast } from '#shared/types'
import { heatInjuryColorExpression } from '@/utils/mapColorExpression'
import { heatInjuryColor } from '@/utils/colorScales'
import { HEAT_INJURY_LEVEL_LABEL } from '@/utils/healthChart'
import { joinHeatInjuryBoundaries } from '@/utils/healthGeo'
import { formatTaipei } from '@/utils/formatDate'

useSeoMeta({
  title: '健康氣象 — 氣象知多少',
  description: '全台 368 鄉鎮未來 5 天熱傷害指數與官方四級警示地圖，可拖曳時間軸查看逐 3 小時變化。'
})

const LEGEND_LEVELS = [
  { key: 'none', label: '無' },
  { key: 'caution', label: '注意' },
  { key: 'watch', label: '警戒' },
  { key: 'danger', label: '危險' },
  { key: 'high-danger', label: '高危險' }
] as const

// 刻意不 SSR：368 鄉鎮 × 39 個時間點的完整序列，伺服器端渲染出來的內容其實只有一個
// 空的地圖容器（表格預設收合），卻要把整份資料塞進 SSR payload——實測 /health 的 HTML
// 690 KB、payload 600 KB，全部都是 hydration 時要重新 parse 一遍、但畫面上一個字都沒用到
// 的東西。改成瀏覽器端抓，HTML 縮到 15 KB 左右，頁面骨架立刻出現，資料到了再補上。
// 頁面本來就有載入中的狀態顯示，使用者體驗不變。
const { data: towns, status } = useFetch<HeatInjuryTownForecast[]>('/api/health/heat/summary', { server: false })

// 載入中／載入失敗的判斷刻意看 `towns` 而不是 `status`：`server: false` 的請求在伺服器端
// 根本不會發動，status 停在 'idle'，但瀏覽器 hydration 那一輪它已經變成 'pending'——
// 兩邊若用 status 分流就會走到不同分支，Vue 會報 hydration mismatch。`towns` 在伺服器端
// 和 hydration 當下都還是 null，兩邊一致，等資料真的回來才切換到內容。
const isLoading = computed(() => !towns.value && status.value !== 'error')

// 39 個時間點對所有鄉鎮都一致（同一批 issue time），取第一個鄉鎮的時間軸代表全部即可
const times = computed(() => towns.value?.[0]?.readings.map((r) => r.time) ?? [])
const timeIndex = ref(0)
const currentTime = computed(() => times.value[timeIndex.value] ?? null)

const isPlaying = ref(false)
let playTimer: ReturnType<typeof setInterval> | null = null
function togglePlay() {
  isPlaying.value = !isPlaying.value
  if (isPlaying.value) {
    playTimer = setInterval(() => {
      timeIndex.value = (timeIndex.value + 1) % Math.max(1, times.value.length)
    }, 900)
  } else if (playTimer) {
    clearInterval(playTimer)
    playTimer = null
  }
}
onBeforeUnmount(() => {
  if (playTimer) clearInterval(playTimer)
})

const showTable = ref(false)
const search = ref('')

const tableRows = computed(() => {
  const list = (towns.value ?? [])
    .map((t) => ({ county: t.county, town: t.town, reading: t.readings[timeIndex.value] }))
    .filter((r): r is { county: string; town: string; reading: NonNullable<typeof r.reading> } => !!r.reading)
  const q = search.value.trim()
  const filtered = q ? list.filter((r) => `${r.county}${r.town}`.includes(q)) : list
  return [...filtered].sort((a, b) => b.reading.index - a.reading.index)
})

// --- 地圖 ---
const mapInstance = shallowRef<MapLibreMap | null>(null)
const boundaries = shallowRef<GeoFeatureCollection<GeoPolygon, { county: string; town: string }> | null>(null)
const SOURCE = 'heat-injury'
const FILL_LAYER = 'heat-injury-fill'
const LINE_LAYER = 'heat-injury-line'

function renderMap(map: MapLibreMap) {
  if (!boundaries.value || !towns.value) return
  const data = joinHeatInjuryBoundaries(boundaries.value, towns.value, timeIndex.value)
  const existing = map.getSource<GeoJSONSource>(SOURCE)
  if (existing) {
    existing.setData(data)
    return
  }

  map.addSource(SOURCE, { type: 'geojson', data })
  map.addLayer({
    id: FILL_LAYER,
    type: 'fill',
    source: SOURCE,
    paint: { 'fill-color': heatInjuryColorExpression('level', heatInjuryColor), 'fill-opacity': 0.75 }
  })
  map.addLayer({
    id: LINE_LAYER,
    type: 'line',
    source: SOURCE,
    paint: { 'line-color': 'rgba(148, 163, 184, 0.25)', 'line-width': 0.5 }
  })

  map.on('click', FILL_LAYER, async (e) => {
    const f = e.features?.[0]
    if (!f) return
    const props = f.properties as { county: string; town: string; index: number; level: string }
    const label = HEAT_INJURY_LEVEL_LABEL[props.level] ?? props.level
    const href = `/health/${encodeURIComponent(props.county)}/${encodeURIComponent(props.town)}`
    // 地圖已經在畫面上，maplibre 模組必然載入過了，這個 await 是模組快取的同步命中
    const { Popup } = await loadMapLibre()
    new Popup()
      .setLngLat(e.lngLat)
      .setHTML(
        `<div style="color:#0f172a"><strong>${props.county}${props.town}</strong><br/>指數 ${props.index}・${label}<br/><a href="${href}" style="color:#0284c7">查看逐時變化 →</a></div>`
      )
      .addTo(map)
  })
  map.on('mouseenter', FILL_LAYER, () => (map.getCanvas().style.cursor = 'pointer'))
  map.on('mouseleave', FILL_LAYER, () => (map.getCanvas().style.cursor = ''))
}

async function onMapReady(map: MapLibreMap) {
  mapInstance.value = map
  if (!boundaries.value) {
    boundaries.value = await $fetch<GeoFeatureCollection<GeoPolygon, { county: string; town: string }>>(
      '/data/taiwan-towns.geojson'
    )
  }
  renderMap(map)
}

// timeIndex 只是換一個已載入資料的巢狀欄位、不會重新抓取，跟 towns 的變化各自獨立，兩個
// watcher 各自呼叫 renderMap 都只是重算/setData，不會撞上 /observation 頁那種「重複重畫」的
// 效能陷阱（這裡沒有「舊資料＋新篩選」的中間態，timeIndex 永遠對應同一份已載入的 towns）
watch(timeIndex, () => {
  if (mapInstance.value) renderMap(mapInstance.value)
})
watch(towns, () => {
  if (mapInstance.value) renderMap(mapInstance.value)
})
</script>

<template>
  <div class="space-y-4">
    <div v-if="isLoading" class="rounded-lg bg-surface-1 p-8 text-center text-text-secondary">
      載入熱傷害指數中…
    </div>

    <div v-else-if="!towns" class="rounded-lg bg-surface-1 p-8 text-center text-text-secondary">
      無法載入熱傷害指數，請稍後再試。
    </div>

    <template v-else>
      <div class="flex flex-wrap items-center gap-3 rounded-lg bg-surface-1 p-3">
        <button
          type="button"
          class="flex shrink-0 items-center gap-1.5 rounded-md bg-surface-2 px-3 py-1.5 text-sm text-text-primary hover:bg-surface-3"
          @click="togglePlay"
        >
          <svg v-if="!isPlaying" viewBox="0 0 24 24" class="h-4 w-4" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
          <svg v-else viewBox="0 0 24 24" class="h-4 w-4" fill="currentColor"><path d="M6 5h4v14H6zM14 5h4v14h-4z" /></svg>
          {{ isPlaying ? '暫停' : '播放' }}
        </button>
        <input
          v-model.number="timeIndex"
          type="range"
          min="0"
          :max="Math.max(0, times.length - 1)"
          step="1"
          class="min-w-40 flex-1 accent-accent"
        >
        <span class="whitespace-nowrap text-sm tabular-nums text-text-secondary">
          {{ currentTime ? formatTaipei(currentTime) : '—' }}
        </span>
        <label class="ml-auto flex shrink-0 items-center gap-1.5 text-sm text-text-secondary">
          <input v-model="showTable" type="checkbox" class="accent-accent" >
          顯示表格
        </label>
      </div>

      <div class="flex flex-wrap items-center gap-3 rounded-lg bg-surface-1 px-3 py-2 text-xs text-text-secondary">
        <span class="text-text-muted">等級</span>
        <span v-for="l in LEGEND_LEVELS" :key="l.key" class="flex items-center gap-1.5">
          <span class="h-3 w-3 rounded-sm" :style="{ backgroundColor: heatInjuryColor(l.key) }" />
          {{ l.label }}
        </span>
      </div>

      <section class="h-112 overflow-hidden rounded-lg bg-surface-1">
        <MapBaseMap @ready="onMapReady" />
      </section>

      <section v-if="showTable" class="overflow-x-auto rounded-lg bg-surface-1">
        <div class="flex items-center gap-2 border-b border-surface-2 p-3">
          <input
            v-model="search"
            type="search"
            placeholder="搜尋縣市或鄉鎮…"
            class="w-48 rounded-md border border-surface-2 bg-surface-0 px-2 py-1 text-sm text-text-primary placeholder:text-text-muted"
          >
          <span class="ml-auto text-xs text-text-muted">共 {{ tableRows.length }} 個鄉鎮，依指數由高到低排序</span>
        </div>
        <table class="w-full min-w-2xl text-left text-sm">
          <thead>
            <tr class="border-b border-surface-2 text-text-muted">
              <th class="px-3 py-2 font-normal">鄉鎮</th>
              <th class="px-3 py-2 text-right font-normal">指數</th>
              <th class="px-3 py-2 font-normal">等級</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="r in tableRows"
              :key="`${r.county}-${r.town}`"
              class="cursor-pointer border-b border-surface-2/60 hover:bg-surface-2/40"
              @click="navigateTo(`/health/${encodeURIComponent(r.county)}/${encodeURIComponent(r.town)}`)"
            >
              <td class="px-3 py-1.5 text-text-primary">{{ r.county }}{{ r.town }}</td>
              <td class="px-3 py-1.5 text-right tabular-nums text-text-secondary">{{ r.reading.index }}</td>
              <td class="px-3 py-1.5">
                <span
                  class="rounded-md px-2 py-0.5 text-xs font-medium"
                  :style="{ backgroundColor: `${heatInjuryColor(r.reading.level)}26`, color: heatInjuryColor(r.reading.level) }"
                >
                  {{ HEAT_INJURY_LEVEL_LABEL[r.reading.level] ?? r.reading.level }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
        <p v-if="tableRows.length === 0" class="p-6 text-center text-text-muted">找不到符合的鄉鎮。</p>
      </section>

      <p class="text-xs text-text-muted">
        資料來源：中央氣象署健康氣象（M-A0085-001），每 3 小時一格、涵蓋未來 5 天。指數與四級警示由 CWA
        逐鄉鎮計算，戶外活動請以官方發布為準。
      </p>
    </template>
  </div>
</template>

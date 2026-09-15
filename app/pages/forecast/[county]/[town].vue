<script setup lang="ts">
import { computed, ref, useTemplateRef } from 'vue'
import { onClickOutside } from '@vueuse/core'
import { buildMeteogramOption } from '@/utils/meteogram'
import { formatTaipeiMonthDay, formatTaipeiTime } from '@/utils/formatDate'
import { airQualityColor } from '@/utils/colorScales'
import { AIR_QUALITY_LEVEL_LABEL, nearestAirQualityStation } from '@/utils/airQuality'
import type { TownForecast, AirQualityStation, GeoFeatureCollection, GeoPoint } from '#shared/types'

const route = useRoute()
const county = computed(() => String(route.params.county))
const town = computed(() => String(route.params.town))

// 這頁的地區是 route 決定的（不像首頁用 localStorage 記住選擇），換地區用導頁到新的
// /forecast/[county]/[town] 網址，讓既有的、已經跟著 route.params 反應的 fetch 自然重新抓資料
const pickerOpen = ref(false)
const pickerRoot = useTemplateRef<HTMLElement>('pickerRoot')
onClickOutside(pickerRoot, () => (pickerOpen.value = false))

function onLocationSelect(nextCounty: string, nextTown: string) {
  pickerOpen.value = false
  navigateTo(`/forecast/${encodeURIComponent(nextCounty)}/${encodeURIComponent(nextTown)}`)
}

const { data: forecast, status, error } = await useFetch<TownForecast>(
  () => `/api/forecast/${encodeURIComponent(county.value)}/${encodeURIComponent(town.value)}`,
  { key: () => `forecast-${county.value}-${town.value}` }
)

// 跟首頁同一套做法：server:false，這份資料只餵一個小徽章，不是 SEO 內容，不值得拖累 SSR payload
const { data: airQualityStations, status: airQualityStatus } = useFetch<
  GeoFeatureCollection<GeoPoint, AirQualityStation>
>('/api/air-quality/stations', { server: false })

const nearestAirQuality = computed(() => {
  const coordinates = forecast.value?.coordinates
  const stations = airQualityStations.value?.features.map((f) => f.properties)
  if (!coordinates || !stations || stations.length === 0) return null
  return nearestAirQualityStation(coordinates, stations)
})

// 必須同時涵蓋 idle 與 pending，理由見 index.vue 同樣的寫法
const airQualityLoading = computed(() => airQualityStatus.value === 'idle' || airQualityStatus.value === 'pending')
// 確定「附近沒有測站」（跟還在讀取中、跟抓取失敗都不一樣），理由見 index.vue 同樣的寫法
const airQualityNoCoverage = computed(() => airQualityStatus.value === 'success' && !nearestAirQuality.value)

useSeoMeta({
  title: () => `${town.value}天氣預報 — 氣象知多少`,
  description: () => `${county.value}${town.value}未來 7 天天氣預報，含逐時溫度、降雨機率、風速、濕度與空氣品質。`
})

const meteogramOption = computed(() =>
  forecast.value
    ? buildMeteogramOption(forecast.value.hourly, { sunrise: forecast.value.sunrise, sunset: forecast.value.sunset })
    : null
)

// 日出日沒必定存在，缺席只代表 sunTimesFor 失敗；月出月沒則可能是「該日確實無此現象」
// （每月約一次），三者都用 null 統一表示「沒有可顯示的值」，模板一律用同一個 fallback 文字
const hasAstronomy = computed(
  () => !!(forecast.value?.sunrise || forecast.value?.sunset || forecast.value?.moonrise || forecast.value?.moonset)
)

// 目前這個時間點最接近的一筆逐時資料，當作「現況」摘要卡
const current = computed(() => {
  if (!forecast.value || forecast.value.hourly.length === 0) return null
  const now = Date.now()
  return forecast.value.hourly.reduce((closest, h) =>
    Math.abs(new Date(h.time).getTime() - now) < Math.abs(new Date(closest.time).getTime() - now) ? h : closest
  )
})
</script>

<template>
  <div class="space-y-6">
    <div v-if="status === 'pending'" class="text-text-secondary">載入中…</div>

    <div v-else-if="error || !forecast" class="rounded-lg bg-surface-1 p-6 text-text-secondary">
      找不到「{{ county }}{{ town }}」的預報資料。
    </div>

    <template v-else>
      <header class="flex items-start justify-between gap-3">
        <div class="space-y-1">
          <p class="text-sm text-text-muted">{{ county }}</p>
          <h1 class="text-2xl font-semibold text-text-primary">{{ town }}</h1>
        </div>
        <div ref="pickerRoot" class="relative">
          <button
            type="button"
            class="flex items-center gap-1 rounded-md bg-surface-1 px-3 py-1.5 text-sm text-text-secondary hover:bg-surface-2 hover:text-text-primary"
            aria-label="選擇地區"
            :aria-expanded="pickerOpen"
            @click="pickerOpen = !pickerOpen"
          >
            更改地區
            <svg viewBox="0 0 24 24" class="h-3.5 w-3.5" fill="none" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="m6 9 6 6 6-6" />
            </svg>
          </button>
          <div v-if="pickerOpen" class="absolute right-0 top-full z-30 mt-1">
            <LocationPicker @select="onLocationSelect" @close="pickerOpen = false" />
          </div>
        </div>
      </header>

      <section v-if="current" class="flex items-center gap-4 rounded-lg bg-surface-1 p-5">
        <WeatherIcon :code="current.weatherCode" class="h-14 w-14 text-accent" />
        <div>
          <p class="tabular-nums text-3xl font-semibold text-text-primary">{{ current.temperature }}°</p>
          <p class="text-sm text-text-secondary">體感 {{ current.apparentTemperature }}° · {{ current.weather }}</p>
        </div>
        <div class="ml-auto flex flex-wrap gap-x-6 gap-y-1 text-sm text-text-secondary">
          <div><span class="text-text-muted">降雨機率</span> <span class="tabular-nums">{{ current.pop ?? '—' }}%</span></div>
          <div><span class="text-text-muted">濕度</span> <span class="tabular-nums">{{ current.relativeHumidity }}%</span></div>
          <div><span class="text-text-muted">風速</span> <span class="tabular-nums">{{ current.windSpeed }} m/s</span></div>
          <div><span class="text-text-muted">風向</span> {{ current.windDirection }}</div>
          <span v-if="airQualityLoading" class="flex items-center gap-1 text-text-muted">
            <span>空氣品質</span>
            <span>…</span>
          </span>
          <NuxtLink
            v-else-if="nearestAirQuality"
            :to="{ path: '/air-quality', query: { site: nearestAirQuality.siteName } }"
            class="flex items-center gap-1 hover:text-text-primary"
            :title="`最近測站：${nearestAirQuality.siteName}`"
          >
            <span class="text-text-muted">空氣品質</span>
            <span class="tabular-nums font-medium" :style="{ color: airQualityColor(nearestAirQuality.level) }">
              {{ nearestAirQuality.aqi ?? '—' }}
            </span>
            <span>{{ AIR_QUALITY_LEVEL_LABEL[nearestAirQuality.level] ?? nearestAirQuality.level }}</span>
          </NuxtLink>
          <span v-else-if="airQualityNoCoverage" class="text-text-muted">空氣品質 鄰近無測站</span>
        </div>
      </section>

      <section v-if="hasAstronomy" class="flex flex-wrap items-center gap-x-5 gap-y-1 rounded-lg bg-surface-1 px-4 py-3 text-sm text-text-secondary">
        <span><span class="text-text-muted">日出</span> {{ forecast.sunrise ? formatTaipeiTime(forecast.sunrise) : '—' }}</span>
        <span><span class="text-text-muted">日沒</span> {{ forecast.sunset ? formatTaipeiTime(forecast.sunset) : '—' }}</span>
        <span><span class="text-text-muted">月出</span> {{ forecast.moonrise ? formatTaipeiTime(forecast.moonrise) : '（今日無月出）' }}</span>
        <span><span class="text-text-muted">月沒</span> {{ forecast.moonset ? formatTaipeiTime(forecast.moonset) : '（今日無月沒）' }}</span>
      </section>

      <section class="rounded-lg bg-surface-1 p-4">
        <h2 class="mb-2 text-sm font-medium text-text-secondary">未來 3 天逐時預報</h2>
        <ChartsBaseChart v-if="meteogramOption" :option="meteogramOption" height="420px" />
      </section>

      <section class="space-y-2">
        <h2 class="text-sm font-medium text-text-secondary">未來 7 天</h2>
        <div class="grid grid-cols-2 gap-2 sm:grid-cols-4 md:grid-cols-7">
          <div
            v-for="period in forecast.extended.filter((_, i) => i % 2 === 0)"
            :key="period.startTime"
            class="flex flex-col items-center gap-1 rounded-lg bg-surface-1 p-3 text-center"
          >
            <p class="text-xs text-text-muted">
              {{ formatTaipeiMonthDay(period.startTime) }}
            </p>
            <WeatherIcon :code="period.weatherCode" class="h-7 w-7 text-accent" />
            <p class="tabular-nums text-sm text-text-primary">{{ period.maxTemperature }}° / {{ period.minTemperature }}°</p>
            <p class="tabular-nums text-xs text-text-secondary">{{ period.pop ?? '—' }}%</p>
          </div>
        </div>
      </section>
    </template>
  </div>
</template>

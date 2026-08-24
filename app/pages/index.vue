<script setup lang="ts">
import { computed } from 'vue'
import { buildMeteogramOption } from '@/utils/meteogram'
import type { TownForecast, CountyWarning, Typhoon, Earthquake, RadarFrame } from '#shared/types'

useSeoMeta({
  title: '氣象知多少 — 台灣即時天氣、雷達與颱風資訊',
  description: '台灣即時天氣預報、雷達回波、颱風路徑與地震資訊的專業氣象資訊平台。'
})

// 首頁目前預設看臺北市中正區；地區選擇／定位留待後續迭代
const DEFAULT_COUNTY = '臺北市'
const DEFAULT_TOWN = '中正區'

const [{ data: forecast }, { data: warnings }, { data: typhoons }, { data: earthquakes }, { data: radar }] =
  await Promise.all([
    useFetch<TownForecast>(`/api/forecast/${encodeURIComponent(DEFAULT_COUNTY)}/${encodeURIComponent(DEFAULT_TOWN)}`),
    useFetch<CountyWarning[]>('/api/warnings'),
    useFetch<Typhoon[]>('/api/typhoon/active'),
    useFetch<Earthquake[]>('/api/earthquake/recent', { query: { limit: 3 } }),
    useFetch<RadarFrame[]>('/api/radar/frames')
  ])

const activeWarnings = computed(() => (warnings.value ?? []).filter((w) => w.hazards.length > 0))
const latestRadar = computed(() => radar.value?.at(-1) ?? null)

const current = computed(() => {
  const hours = forecast.value?.hourly
  if (!hours || hours.length === 0) return null
  const now = Date.now()
  return hours.reduce((closest, h) =>
    Math.abs(new Date(h.time).getTime() - now) < Math.abs(new Date(closest.time).getTime() - now) ? h : closest
  )
})

const compactMeteogram = computed(() =>
  forecast.value ? buildMeteogramOption(forecast.value.hourly.slice(0, 24), { compact: true }) : null
)

const weekAhead = computed(() => forecast.value?.extended.filter((_, i) => i % 2 === 0).slice(0, 7) ?? [])

function severityClass(hazard: string): string {
  if (hazard.includes('豪雨') || hazard.includes('颱風')) return 'bg-severity-warning/15 text-severity-warning'
  if (hazard.includes('大雨') || hazard.includes('低溫')) return 'bg-severity-watch/15 text-severity-watch'
  return 'bg-severity-advisory/15 text-severity-advisory'
}
</script>

<template>
  <div class="space-y-6">
    <!-- 警特報條：只有真的有作用中特報才顯示 -->
    <div v-if="activeWarnings.length > 0" class="space-y-1.5 rounded-lg bg-surface-1 p-3">
      <NuxtLink
        v-for="w in activeWarnings"
        :key="w.county"
        to="/warnings"
        class="flex flex-wrap items-center gap-2 rounded-md px-2 py-1 text-sm hover:bg-surface-2"
      >
        <span class="font-medium text-text-primary">{{ w.county }}</span>
        <span v-for="h in w.hazards" :key="h.phenomena" class="rounded px-1.5 py-0.5 text-xs" :class="severityClass(h.phenomena)">
          {{ h.phenomena }}{{ h.significance }}
        </span>
      </NuxtLink>
    </div>

    <!-- 颱風 / 地震快訊：只有真的有事件才顯示 -->
    <div v-if="(typhoons?.length ?? 0) > 0 || (earthquakes?.length ?? 0) > 0" class="grid gap-3 sm:grid-cols-2">
      <NuxtLink
        v-if="(typhoons?.length ?? 0) > 0"
        to="/typhoon"
        class="rounded-lg bg-severity-watch/10 p-4 hover:bg-severity-watch/15"
      >
        <p class="text-sm font-medium text-severity-watch">颱風動態</p>
        <p class="mt-1 text-text-primary">{{ typhoons!.map((t) => t.nameZh).join('、') }}</p>
      </NuxtLink>
      <NuxtLink v-if="(earthquakes?.length ?? 0) > 0" to="/earthquake" class="rounded-lg bg-surface-1 p-4 hover:bg-surface-2">
        <p class="text-sm font-medium text-text-secondary">最新地震</p>
        <p class="mt-1 text-text-primary">
          {{ earthquakes![0]!.epicenterDescription }} · 規模 {{ earthquakes![0]!.magnitude }} · 最大震度
          {{ earthquakes![0]!.maxIntensity }}
        </p>
      </NuxtLink>
    </div>

    <!-- Hero：現況 -->
    <section v-if="current" class="flex flex-wrap items-center gap-4 rounded-lg bg-surface-1 p-6">
      <WeatherIcon :code="current.weatherCode" class="h-16 w-16 text-accent" />
      <div>
        <p class="text-sm text-text-muted">{{ DEFAULT_COUNTY }}{{ DEFAULT_TOWN }}</p>
        <p class="tabular-nums text-4xl font-semibold text-text-primary">{{ current.temperature }}°</p>
        <p class="text-sm text-text-secondary">體感 {{ current.apparentTemperature }}° · {{ current.weather }}</p>
      </div>
      <NuxtLink
        :to="`/forecast/${DEFAULT_COUNTY}/${DEFAULT_TOWN}`"
        class="ml-auto rounded-md bg-surface-2 px-3 py-1.5 text-sm text-text-secondary hover:text-text-primary"
      >
        完整預報 →
      </NuxtLink>
    </section>

    <div class="grid gap-4 lg:grid-cols-3">
      <!-- 今日 meteogram -->
      <section class="rounded-lg bg-surface-1 p-4 lg:col-span-2">
        <h2 class="mb-2 text-sm font-medium text-text-secondary">今明 24 小時</h2>
        <ChartsBaseChart v-if="compactMeteogram" :option="compactMeteogram" height="260px" />
      </section>

      <!-- 雷達縮圖 -->
      <NuxtLink to="/map" class="group relative overflow-hidden rounded-lg bg-surface-1">
        <div class="absolute inset-0 flex items-center justify-center text-sm text-text-muted">
          <img v-if="latestRadar" :src="latestRadar.imageUrl" alt="雷達回波縮圖" class="h-full w-full object-cover opacity-70" >
          <span v-else>雷達影像載入中…</span>
        </div>
        <div class="relative flex h-full min-h-40 items-end bg-gradient-to-t from-surface-0/90 to-transparent p-4">
          <p class="text-sm font-medium text-text-primary group-hover:text-accent">前往互動地圖 →</p>
        </div>
      </NuxtLink>
    </div>

    <!-- 7 日預報條 -->
    <section v-if="weekAhead.length > 0" class="space-y-2">
      <h2 class="text-sm font-medium text-text-secondary">未來 7 天</h2>
      <div class="grid grid-cols-2 gap-2 sm:grid-cols-4 md:grid-cols-7">
        <div
          v-for="period in weekAhead"
          :key="period.startTime"
          class="flex flex-col items-center gap-1 rounded-lg bg-surface-1 p-3 text-center"
        >
          <p class="text-xs text-text-muted">
            {{ new Date(period.startTime).toLocaleDateString('zh-TW', { month: 'numeric', day: 'numeric' }) }}
          </p>
          <WeatherIcon :code="period.weatherCode" class="h-7 w-7 text-accent" />
          <p class="tabular-nums text-sm text-text-primary">{{ period.maxTemperature }}° / {{ period.minTemperature }}°</p>
        </div>
      </div>
    </section>
  </div>
</template>

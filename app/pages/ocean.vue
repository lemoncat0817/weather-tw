<script setup lang="ts">
import { computed } from 'vue'
import { useLocalStorage } from '@vueuse/core'
import type { OceanBuoyObservation, TideForecast, TideLocation } from '#shared/types'
import { buildSeaTemperatureOption, buildTideOption, buildWaveHeightOption } from '@/utils/oceanChart'
import { OCEAN_BUOY_STATIONS, DEFAULT_OCEAN_BUOY_STATION, isOceanBuoyStation } from '@/utils/oceanBuoys'
import { formatTaipei, formatTaipeiMonthDay } from '@/utils/formatDate'

useSeoMeta({
  title: '海象 — 氣象知多少',
  description: '浮標站浪高／海溫觀測與未來一個月潮汐預報，海邊活動規劃參考。'
})

// --- 浮標觀測 ---
const storedBuoyId = useLocalStorage('ocean-buoy-id', DEFAULT_OCEAN_BUOY_STATION, { initOnMounted: true })
const buoyId = computed({
  get: () => (isOceanBuoyStation(storedBuoyId.value) ? storedBuoyId.value : DEFAULT_OCEAN_BUOY_STATION),
  set: (id) => {
    storedBuoyId.value = id
  }
})
const { data: buoy, status: buoyStatus } = await useFetch<OceanBuoyObservation>(() => `/api/ocean/buoy/${buoyId.value}`, {
  key: () => `ocean-buoy-${buoyId.value}`
})

const latestBuoyReading = computed(() => buoy.value?.readings.at(-1) ?? null)
const waveOption = computed(() => (buoy.value ? buildWaveHeightOption(buoy.value.readings) : null))
const seaTempOption = computed(() => (buoy.value ? buildSeaTemperatureOption(buoy.value.readings) : null))

// --- 潮汐預報 ---
// 地點清單不小（266 筆），單獨一支請求、快取 24 小時，不跟著每次換地點重抓
const { data: tideLocations } = await useFetch<TideLocation[]>('/api/ocean/tide/locations')

const storedTideLocationId = useLocalStorage('ocean-tide-location-id', '', { initOnMounted: true })
const tideLocationId = computed({
  get: () => storedTideLocationId.value || tideLocations.value?.[0]?.id || '',
  set: (id) => {
    storedTideLocationId.value = id
  }
})

// tideLocationId 的預設值來自 tideLocations（上面那支請求已經 await 過），所以這裡跟 buoy
// 一樣直接用 getter URL 反應式抓取即可，不需要 immediate:false + 手動 execute 那一套
const { data: tide, status: tideStatus } = await useFetch<TideForecast>(() => `/api/ocean/tide/${tideLocationId.value}`, {
  key: () => `ocean-tide-${tideLocationId.value}`
})

const upcomingDays = computed(() => tide.value?.days.slice(0, 7) ?? [])
const upcomingEvents = computed(() => upcomingDays.value.flatMap((d) => d.events))
const tideOption = computed(() => (upcomingEvents.value.length > 0 ? buildTideOption(upcomingEvents.value) : null))
</script>

<template>
  <div class="space-y-6">
    <!-- 浮標觀測 -->
    <section class="space-y-3">
      <div class="flex flex-wrap items-center gap-3 rounded-lg bg-surface-1 p-3">
        <label class="text-sm text-text-secondary" for="ocean-buoy">浮標／潮位站</label>
        <select
          id="ocean-buoy"
          v-model="buoyId"
          class="rounded-md border border-surface-2 bg-surface-0 px-2 py-1 text-sm text-text-primary"
        >
          <option v-for="id in OCEAN_BUOY_STATIONS" :key="id" :value="id">{{ id }}</option>
        </select>
        <span class="text-xs text-text-muted">
          中央氣象署未提供這些浮標的中文站名，僅標示原始站號
        </span>
      </div>

      <div v-if="buoyStatus === 'pending'" class="rounded-lg bg-surface-1 p-8 text-center text-text-secondary">
        載入浮標觀測中…
      </div>

      <template v-else-if="buoy">
        <div v-if="latestBuoyReading" class="grid grid-cols-2 gap-3 rounded-lg bg-surface-1 p-6 sm:grid-cols-4">
          <div>
            <p class="text-sm text-text-muted">浪高</p>
            <p class="tabular-nums text-2xl text-text-primary">{{ latestBuoyReading.waveHeight ?? '—' }} <span class="text-sm text-text-muted">m</span></p>
          </div>
          <div>
            <p class="text-sm text-text-muted">週期</p>
            <p class="tabular-nums text-2xl text-text-primary">{{ latestBuoyReading.wavePeriod ?? '—' }} <span class="text-sm text-text-muted">s</span></p>
          </div>
          <div>
            <p class="text-sm text-text-muted">海溫</p>
            <p class="tabular-nums text-2xl text-text-primary">{{ latestBuoyReading.seaTemperature ?? '—' }}°</p>
          </div>
          <div>
            <p class="text-sm text-text-muted">風速</p>
            <p class="tabular-nums text-2xl text-text-primary">{{ latestBuoyReading.windSpeed ?? '—' }} <span class="text-sm text-text-muted">m/s</span></p>
          </div>
          <p class="col-span-2 text-xs text-text-muted sm:col-span-4">觀測時間 {{ formatTaipei(latestBuoyReading.time) }}</p>
        </div>
        <p v-else class="rounded-lg bg-surface-1 p-8 text-center text-text-secondary">這個測站近 48 小時沒有可用觀測值。</p>

        <div v-if="waveOption" class="rounded-lg bg-surface-1 p-4">
          <h2 class="mb-2 text-sm font-medium text-text-secondary">浪高（48 小時）</h2>
          <ChartsBaseChart :option="waveOption" height="240px" />
        </div>
        <div v-if="seaTempOption" class="rounded-lg bg-surface-1 p-4">
          <h2 class="mb-2 text-sm font-medium text-text-secondary">海溫（48 小時）</h2>
          <ChartsBaseChart :option="seaTempOption" height="240px" />
        </div>
      </template>
    </section>

    <!-- 潮汐預報 -->
    <section class="space-y-3">
      <div class="flex flex-wrap items-center gap-3 rounded-lg bg-surface-1 p-3">
        <label class="text-sm text-text-secondary" for="tide-location">潮汐地點</label>
        <select
          id="tide-location"
          v-model="tideLocationId"
          class="max-w-64 rounded-md border border-surface-2 bg-surface-0 px-2 py-1 text-sm text-text-primary"
        >
          <option v-for="l in tideLocations ?? []" :key="l.id" :value="l.id">{{ l.name }}</option>
        </select>
      </div>

      <div v-if="tideStatus === 'pending'" class="rounded-lg bg-surface-1 p-8 text-center text-text-secondary">
        載入潮汐預報中…
      </div>

      <template v-else-if="tide">
        <div v-if="tideOption" class="rounded-lg bg-surface-1 p-4">
          <h2 class="mb-2 text-sm font-medium text-text-secondary">未來 7 天滿潮／乾潮</h2>
          <ChartsBaseChart :option="tideOption" height="280px" />
        </div>

        <div class="overflow-x-auto rounded-lg bg-surface-1 p-4">
          <h2 class="mb-2 text-sm font-medium text-text-secondary">未來 1 個月</h2>
          <table class="w-full min-w-2xl text-left text-sm">
            <thead>
              <tr class="border-b border-surface-2 text-text-muted">
                <th class="px-3 py-2 font-normal">日期</th>
                <th class="px-3 py-2 font-normal">農曆</th>
                <th class="px-3 py-2 font-normal">潮汛</th>
                <th class="px-3 py-2 font-normal">滿潮／乾潮時刻（潮高 cm）</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="d in tide.days" :key="d.date" class="border-b border-surface-2/60">
                <td class="px-3 py-1.5 text-text-primary">{{ formatTaipeiMonthDay(d.date) }}</td>
                <td class="px-3 py-1.5 text-text-muted">{{ d.lunarDate.slice(5) }}</td>
                <td class="px-3 py-1.5 text-text-secondary">{{ d.tideRange }}</td>
                <td class="px-3 py-1.5 tabular-nums text-text-secondary">
                  <span v-for="e in d.events" :key="e.time" class="mr-3 inline-block whitespace-nowrap">
                    {{ e.type }} {{ formatTaipei(e.time).slice(-5) }}（{{ e.heightCm }}）
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>
    </section>
  </div>
</template>

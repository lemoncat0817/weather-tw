<script setup lang="ts">
import { computed } from 'vue'
import { useLocalStorage } from '@vueuse/core'
import type { ClimateComparison } from '#shared/types'
import { buildAnnualNormalOption, buildCumulativeRainfallOption, buildRecentVsNormalOption } from '@/utils/climateChart'
import { CLIMATE_STATIONS, DEFAULT_CLIMATE_STATION_ID, isClimateStationId } from '@/utils/climateStations'
import { currentTaipeiMonth } from '@/utils/formatDate'
import { temperatureColor } from '@/utils/colorScales'

useSeoMeta({
  title: '歷史趨勢 — 氣象知多少',
  description: '近期觀測與 1991-2020 氣候平均值比較，看看最近的天氣跟「正常」差多少。'
})

// 記住使用者上次選的測站。useLocalStorage 預設在 client 端 setup 當下就同步讀 localStorage，
// 這剛好等於 hydration 那一輪的 render，若跟 SSR 用的預設值不同就會觸發 hydration mismatch——
// 跟這個 session 修過好幾次的問題是同一類，這次用 initOnMounted 把讀取延到 onMounted 之後，
// hydration 那一輪一律用預設值，之後才在一次額外的 reactive 更新裡切換成存好的值
const storedStationId = useLocalStorage('climate-station-id', DEFAULT_CLIMATE_STATION_ID, { initOnMounted: true })
// localStorage 可能還留著已從選單拿掉的站號（古坑、田中…）；getter 直接退回預設，避免再打一發 404
const stationId = computed({
  get: () => (isClimateStationId(storedStationId.value) ? storedStationId.value : DEFAULT_CLIMATE_STATION_ID),
  set: (id) => {
    storedStationId.value = id
  }
})
const { data: climate, status, error } = await useFetch<ClimateComparison>(() => `/api/climate/${stationId.value}`, {
  key: () => `climate-${stationId.value}`
})

// C-B0024-001／C-B0027-001 都是以「月」為單位的氣候常態，用台灣時間的月份去對照
// （不能用 new Date().getMonth()，理由見 formatDate.ts 的說明）
const currentMonth = currentTaipeiMonth()
const currentNormal = computed(() => climate.value?.monthlyNormals.find((m) => m.month === currentMonth) ?? null)

const annualOption = computed(() =>
  climate.value ? buildAnnualNormalOption(climate.value.monthlyNormals, currentMonth) : null
)
const recentOption = computed(() =>
  climate.value && currentNormal.value ? buildRecentVsNormalOption(climate.value.recentHourly, currentNormal.value) : null
)
const rainfallOption = computed(() =>
  climate.value && climate.value.dailyRainfall.length > 0
    ? buildCumulativeRainfallOption(climate.value.dailyRainfall, climate.value.monthlyPrecipitationNormals)
    : null
)

const delta = computed(() => {
  if (!climate.value?.yesterday || !currentNormal.value) return null
  return Math.round((climate.value.yesterday.meanTemperature - currentNormal.value.meanTemperature) * 10) / 10
})
const deltaColor = computed(() => (delta.value === null ? undefined : temperatureColor(Math.max(-1, Math.min(1, delta.value / 5)))))
const deltaLabel = computed(() => {
  if (delta.value === null) return ''
  if (Math.abs(delta.value) < 0.5) return '與常態相近'
  return delta.value > 0 ? `較常態偏高 ${delta.value.toFixed(1)}°C` : `較常態偏低 ${Math.abs(delta.value).toFixed(1)}°C`
})
</script>

<template>
  <div class="space-y-4">
    <div class="flex flex-wrap items-center gap-3 rounded-lg bg-surface-1 p-3">
      <label class="text-sm text-text-secondary" for="climate-station">測站</label>
      <select
        id="climate-station"
        v-model="stationId"
        class="rounded-md border border-surface-2 bg-surface-0 px-2 py-1 text-sm text-text-primary"
      >
        <option v-for="s in CLIMATE_STATIONS" :key="s.id" :value="s.id">{{ s.name }}</option>
      </select>
      <span v-if="climate" class="text-xs text-text-muted">
        氣候常態基準：{{ climate.normalYears[0] }}–{{ climate.normalYears[1] }} 年平均
      </span>
    </div>

    <div v-if="status === 'pending'" class="rounded-lg bg-surface-1 p-8 text-center text-text-secondary">載入氣候資料中…</div>

    <div v-else-if="error || !climate" class="rounded-lg bg-surface-1 p-8 text-center text-text-secondary">
      找不到這個測站的氣候資料。
    </div>

    <template v-else>
      <!-- 昨日 vs 常態摘要 -->
      <section v-if="climate.yesterday && currentNormal" class="flex flex-wrap items-center gap-6 rounded-lg bg-surface-1 p-6">
        <div>
          <p class="text-sm text-text-muted">{{ climate.yesterday.date }} 平均溫</p>
          <p class="tabular-nums text-4xl font-semibold text-text-primary">{{ climate.yesterday.meanTemperature }}°</p>
        </div>
        <div class="text-sm text-text-secondary">
          <p>{{ currentMonth }} 月常態平均 {{ currentNormal.meanTemperature }}°（{{ currentNormal.minTemperature }}°–{{ currentNormal.maxTemperature }}°）</p>
          <p class="mt-1 font-medium" :style="{ color: deltaColor }">{{ deltaLabel }}</p>
        </div>
        <div v-if="climate.todayMaxUvIndex !== null" class="ml-auto text-right">
          <p class="text-sm text-text-muted">今日紫外線峰值</p>
          <p class="tabular-nums text-2xl text-text-primary">{{ climate.todayMaxUvIndex }}</p>
        </div>
      </section>

      <!-- 近期逐時 vs 當月常態 -->
      <section v-if="recentOption" class="rounded-lg bg-surface-1 p-4">
        <h2 class="mb-2 text-sm font-medium text-text-secondary">近期逐時溫度 vs {{ currentMonth }} 月常態範圍</h2>
        <ChartsBaseChart :option="recentOption" height="280px" />
      </section>

      <!-- 全年氣候常態 -->
      <section v-if="annualOption" class="rounded-lg bg-surface-1 p-4">
        <h2 class="mb-2 text-sm font-medium text-text-secondary">全年氣候常態（實心點為當月）</h2>
        <ChartsBaseChart :option="annualOption" height="320px" />
      </section>

      <!-- 今年累積雨量 vs 氣候平均累積 -->
      <section v-if="rainfallOption" class="rounded-lg bg-surface-1 p-4">
        <h2 class="mb-2 text-sm font-medium text-text-secondary">今年累積雨量 vs 氣候平均累積</h2>
        <ChartsBaseChart :option="rainfallOption" height="280px" />
      </section>
    </template>
  </div>
</template>

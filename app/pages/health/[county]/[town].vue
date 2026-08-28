<script setup lang="ts">
import { computed } from 'vue'
import type { HeatInjuryTownForecast } from '#shared/types'
import { buildHeatInjuryOption, HEAT_INJURY_LEVEL_LABEL } from '@/utils/healthChart'
import { heatInjuryColor } from '@/utils/colorScales'
import { formatTaipei } from '@/utils/formatDate'

const route = useRoute()
const county = computed(() => String(route.params.county))
const town = computed(() => String(route.params.town))

const { data: forecast, status, error } = await useFetch<HeatInjuryTownForecast>(
  () => `/api/health/heat/${encodeURIComponent(county.value)}/${encodeURIComponent(town.value)}`,
  { key: () => `health-heat-${county.value}-${town.value}` }
)

useSeoMeta({
  title: () => `${town.value}熱傷害指數 — 氣象知多少`,
  description: () => `${county.value}${town.value}未來 5 天逐 3 小時熱傷害指數與官方四級警示。`
})

const chartOption = computed(() => (forecast.value ? buildHeatInjuryOption(forecast.value.readings) : null))

// 目前這個時間點最接近的一筆，當作「現況」摘要卡
const current = computed(() => {
  if (!forecast.value || forecast.value.readings.length === 0) return null
  const now = Date.now()
  return forecast.value.readings.reduce((closest, r) =>
    Math.abs(new Date(r.time).getTime() - now) < Math.abs(new Date(closest.time).getTime() - now) ? r : closest
  )
})
</script>

<template>
  <div class="space-y-6">
    <div v-if="status === 'pending'" class="text-text-secondary">載入中…</div>

    <div v-else-if="error || !forecast" class="rounded-lg bg-surface-1 p-6 text-text-secondary">
      找不到「{{ county }}{{ town }}」的熱傷害指數資料。
    </div>

    <template v-else>
      <header class="flex items-start justify-between gap-3">
        <div class="space-y-1">
          <p class="text-sm text-text-muted">{{ county }}</p>
          <h1 class="text-2xl font-semibold text-text-primary">{{ town }}・熱傷害指數</h1>
        </div>
        <NuxtLink to="/health" class="rounded-md bg-surface-1 px-3 py-1.5 text-sm text-text-secondary hover:bg-surface-2 hover:text-text-primary">
          回全台地圖
        </NuxtLink>
      </header>

      <section v-if="current" class="flex items-center gap-4 rounded-lg bg-surface-1 p-5">
        <span
          class="flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-lg font-semibold text-surface-0"
          :style="{ backgroundColor: heatInjuryColor(current.level) }"
        >
          {{ current.index }}
        </span>
        <div>
          <p class="text-lg font-medium text-text-primary">{{ HEAT_INJURY_LEVEL_LABEL[current.level] ?? current.level }}</p>
          <p class="text-sm text-text-secondary">{{ formatTaipei(current.time) }} 發布</p>
        </div>
      </section>

      <section class="rounded-lg bg-surface-1 p-4">
        <h2 class="mb-2 text-sm font-medium text-text-secondary">未來 5 天逐 3 小時熱傷害指數</h2>
        <ChartsBaseChart v-if="chartOption" :option="chartOption" height="320px" />
        <p class="mt-3 text-xs text-text-muted">
          資料來源：中央氣象署健康氣象（M-A0085-001）。指數與四級警示（注意／警戒／危險／高危險）由 CWA 依體感溫度等因子逐鄉鎮計算，戶外活動請以官方發布為準。
        </p>
      </section>
    </template>
  </div>
</template>

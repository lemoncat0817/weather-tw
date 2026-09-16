<script setup lang="ts">
import { ref } from 'vue'
import type { InundationSummary } from '#shared/types'
import { formatTaipei } from '@/utils/formatDate'

const { data: inundationData } = await useFetch<InundationSummary>('/api/inundation/sensors')

const showAllCounties = ref(false)
</script>

<template>
  <div v-if="inundationData" class="rounded-lg bg-surface-1 p-4">
    <div class="flex items-center justify-between gap-3">
      <h2 class="text-sm font-medium text-text-secondary">
        路面淹水感測器
      </h2>

      <span class="text-xs text-text-muted">
        {{ formatTaipei(inundationData.updatedAt) }}
      </span>
    </div>

    <!-- 總覽數據標籤 -->
    <div class="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
      <div class="rounded-md bg-surface-2/60 p-3">
        <p class="text-xs text-text-muted">全臺監控測站</p>
        <p class="mt-1 text-lg font-bold tabular-nums text-text-primary">
          {{ inundationData.totalSensors }} <span class="text-xs font-normal text-text-muted">處</span>
        </p>
      </div>

      <div class="rounded-md bg-surface-2/60 p-3">
        <p class="text-xs text-text-muted">當前積淹水告警</p>
        <p
          class="mt-1 text-lg font-bold tabular-nums"
          :class="inundationData.activeInundationCount > 0 ? 'text-severity-warning' : 'text-text-primary'"
        >
          {{ inundationData.activeInundationCount }} <span class="text-xs font-normal text-text-muted">處</span>
        </p>
      </div>

      <div class="col-span-2 sm:col-span-1 rounded-md bg-surface-2/60 p-3">
        <p class="text-xs text-text-muted">路況積水狀態</p>
        <p class="mt-1 text-sm font-semibold" :class="inundationData.activeInundationCount > 0 ? 'text-severity-warning' : 'text-text-secondary'">
          {{ inundationData.activeInundationCount > 0 ? '部分地區有路面積水' : '全線正常無淹水' }}
        </p>
      </div>
    </div>

    <!-- 各縣市感測站分佈統計 -->
    <div class="mt-3 border-t border-border-subtle pt-3">
      <div class="flex items-center justify-between text-xs">
        <span class="text-text-muted">各縣市布建概況</span>
        <button
          type="button"
          class="text-text-secondary hover:text-text-primary transition-colors"
          @click="showAllCounties = !showAllCounties"
        >
          {{ showAllCounties ? '收合概況' : '查看分布' }}
        </button>
      </div>

      <div v-if="showAllCounties" class="mt-2 grid grid-cols-2 gap-1.5 sm:grid-cols-3 md:grid-cols-4 text-xs">
        <div
          v-for="c in inundationData.byCounty"
          :key="c.county"
          class="flex items-center justify-between rounded bg-surface-2 px-2 py-1"
        >
          <span class="text-text-secondary">{{ c.county }}</span>
          <span class="tabular-nums font-medium" :class="c.flooding > 0 ? 'text-severity-warning' : 'text-text-muted'">
            {{ c.flooding > 0 ? `${c.flooding} 處積水 / ` : '' }}{{ c.total }} 站
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

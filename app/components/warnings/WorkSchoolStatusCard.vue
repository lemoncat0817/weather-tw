<script setup lang="ts">
import { ref, computed } from 'vue'
import type { WorkSchoolStatusResponse } from '#shared/types'
import { formatTaipei } from '@/utils/formatDate'

const { data: statusData } = await useFetch<WorkSchoolStatusResponse>('/api/work-school-status')

const isExpanded = ref(false)

const suspendedCounties = computed(() =>
  (statusData.value?.counties ?? []).filter((c) => c.status === 'suspended' || c.status === 'partial')
)

const normalCounties = computed(() =>
  (statusData.value?.counties ?? []).filter((c) => c.status === 'normal')
)
</script>

<template>
  <div v-if="statusData" class="rounded-lg bg-surface-1 p-4">
    <div class="flex items-center justify-between gap-3">
      <h2 class="text-sm font-medium text-text-secondary">
        天然災害停班停課資訊
      </h2>

      <span class="text-xs text-text-muted">
        {{ formatTaipei(statusData.updatedAt) }}
      </span>
    </div>

    <!-- 平時正常上班上課狀態 -->
    <div v-if="statusData.isDefaultStatus" class="mt-3 flex items-center justify-between rounded-md bg-surface-2/60 px-3 py-2.5">
      <div class="flex items-center gap-2 text-sm text-text-secondary">
        <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
        </svg>
        <span class="font-medium text-text-primary">全臺各縣市照常上班、照常上課</span>
      </div>
      <button
        type="button"
        class="text-xs text-text-secondary hover:text-text-primary transition-colors"
        @click="isExpanded = !isExpanded"
      >
        {{ isExpanded ? '收合縣市' : '檢視全部 22 縣市' }}
      </button>
    </div>

    <!-- 天災停班停課警示狀態 -->
    <div v-else class="mt-3 space-y-2">
      <div class="rounded-md bg-severity-warning/15 p-3 text-sm text-severity-warning">
        <p class="font-medium">今日有縣市發布停止上班、停止上課通報</p>
      </div>

      <div class="grid gap-2 sm:grid-cols-2">
        <div
          v-for="c in suspendedCounties"
          :key="c.county"
          class="rounded-md p-2.5 text-sm"
          :class="c.status === 'suspended' ? 'bg-severity-warning/15 text-severity-warning' : 'bg-severity-watch/15 text-severity-watch'"
        >
          <div class="flex items-center justify-between">
            <span class="font-bold">{{ c.county }}</span>
            <span class="rounded bg-surface-0/40 px-1.5 py-0.5 text-xs font-medium">
              {{ c.status === 'suspended' ? '停止上班上課' : '部分停班停課' }}
            </span>
          </div>
          <p class="mt-1 text-xs opacity-90">{{ c.statusText }}</p>
        </div>
      </div>
    </div>

    <!-- 展開 22 縣市清單 -->
    <div v-if="isExpanded && statusData.isDefaultStatus" class="mt-3 border-t border-border-subtle pt-3">
      <div class="grid grid-cols-2 gap-1.5 sm:grid-cols-4 lg:grid-cols-6 text-xs">
        <div
          v-for="c in normalCounties"
          :key="c.county"
          class="flex items-center justify-between rounded bg-surface-2 px-2 py-1 text-text-secondary"
        >
          <span>{{ c.county }}</span>
          <span class="text-text-muted">正常</span>
        </div>
      </div>
    </div>
  </div>
</template>

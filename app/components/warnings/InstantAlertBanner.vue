<script setup lang="ts">
import type { InstantAlertsResponse } from '#shared/types'
import { formatTaipei } from '@/utils/formatDate'
import { instantAlertSeverityClass } from '@/utils/warningSeverity'

const { data: instantData } = await useFetch<InstantAlertsResponse>('/api/warnings/instant')

const activeAlerts = computed(() => instantData.value?.alerts ?? [])
</script>

<template>
  <div v-if="activeAlerts.length > 0" class="space-y-3">
    <div
      v-for="alert in activeAlerts"
      :key="alert.id"
      class="space-y-1.5 rounded-lg p-4 text-sm"
      :class="instantAlertSeverityClass(alert.severity)"
    >
      <div class="flex items-start justify-between gap-3">
        <div class="flex items-center gap-2">
          <span class="rounded-md bg-surface-0/40 px-2 py-0.5 text-xs font-medium">
            {{ alert.type === 'thunderstorm' ? '大雷雨即時訊息' : '即時天氣提醒' }}
          </span>
          <h3 class="font-medium">{{ alert.title }}</h3>
        </div>
        <span class="text-xs tabular-nums opacity-80">
          {{ formatTaipei(alert.issuedTime) }}
        </span>
      </div>

      <p class="whitespace-pre-line leading-relaxed opacity-90">
        {{ alert.content }}
      </p>

      <div v-if="alert.affectedAreas.length > 0" class="flex flex-wrap items-center gap-1.5 text-xs opacity-90">
        <span>示警區域：</span>
        <span
          v-for="area in alert.affectedAreas"
          :key="area"
          class="rounded bg-surface-0/40 px-1.5 py-0.5 font-medium"
        >
          {{ area }}
        </span>
      </div>
    </div>
  </div>
</template>

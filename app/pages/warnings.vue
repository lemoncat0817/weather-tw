<script setup lang="ts">
import { computed } from 'vue'
import type { CountyWarning } from '#shared/types'
import { severityClass } from '@/utils/warningSeverity'
import { formatTaipei } from '@/utils/formatDate'

useSeoMeta({ title: '警特報 — 氣象知多少', description: '全台 22 縣市目前作用中的天氣警特報彙整。' })

const { data: warnings } = await useFetch<CountyWarning[]>('/api/warnings')

const active = computed(() => (warnings.value ?? []).filter((w) => w.hazards.length > 0))
const clear = computed(() => (warnings.value ?? []).filter((w) => w.hazards.length === 0))
</script>

<template>
  <div class="space-y-4">
    <section class="rounded-lg bg-surface-1 p-4">
      <p class="text-sm text-text-secondary">
        <span class="tabular-nums font-medium text-text-primary">{{ active.length }}</span> / 22 縣市目前有作用中特報
      </p>
    </section>

    <section v-if="active.length > 0" class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <div v-for="w in active" :key="w.county" class="space-y-2 rounded-lg bg-surface-1 p-4">
        <p class="font-medium text-text-primary">{{ w.county }}</p>
        <div v-for="h in w.hazards" :key="h.phenomena" class="rounded-md p-2 text-sm" :class="severityClass(h.phenomena)">
          <p class="font-medium">{{ h.phenomena }}{{ h.significance }}</p>
          <p v-if="h.startTime || h.endTime" class="mt-0.5 text-xs opacity-80">
            <span v-if="h.startTime">{{ formatTaipei(h.startTime) }}</span>
            <span v-if="h.startTime && h.endTime"> – </span>
            <span v-if="h.endTime">{{ formatTaipei(h.endTime) }}</span>
          </p>
        </div>
      </div>
    </section>

    <section v-else class="rounded-lg bg-surface-1 p-8 text-center">
      <p class="text-text-secondary">目前全台無作用中天氣特報。</p>
    </section>

    <section v-if="clear.length > 0" class="rounded-lg bg-surface-1 p-4">
      <h2 class="mb-2 text-sm font-medium text-text-secondary">無特報縣市</h2>
      <div class="flex flex-wrap gap-1.5">
        <span
          v-for="w in clear"
          :key="w.county"
          class="rounded-md bg-surface-2 px-2 py-1 text-xs text-text-muted"
        >
          {{ w.county }}
        </span>
      </div>
    </section>
  </div>
</template>

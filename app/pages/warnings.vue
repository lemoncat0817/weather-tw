<script setup lang="ts">
import { computed } from 'vue'
import type { CountyWarning, WarningDetail } from '#shared/types'
import { severityClass, capSeverityClass, CAP_SEVERITY_LABEL } from '@/utils/warningSeverity'
import { formatTaipei } from '@/utils/formatDate'

useSeoMeta({ title: '警特報 — 氣象知多少', description: '全台 22 縣市目前作用中的天氣警特報彙整，含官方特報全文與嚴重度。' })

const [{ data: warnings }, { data: detail }] = await Promise.all([
  useFetch<CountyWarning[]>('/api/warnings'),
  useFetch<WarningDetail>('/api/warnings/detail')
])

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

    <!-- 豪雨／低溫／高溫三種現象才有官方 CAP 嚴重度可用，其餘現象只能靠上面卡片的關鍵字判斷 -->
    <section v-if="detail && detail.advisories.length > 0" class="space-y-2">
      <h2 class="text-sm font-medium text-text-secondary">官方特報嚴重度</h2>
      <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div
          v-for="a in detail.advisories"
          :key="a.event"
          class="space-y-1.5 rounded-lg p-4 text-sm"
          :class="capSeverityClass(a.severity)"
        >
          <p class="font-medium">{{ a.headline }}（{{ CAP_SEVERITY_LABEL[a.severity] ?? a.severity }}）</p>
          <p class="text-xs opacity-80">{{ formatTaipei(a.effective) }} – {{ formatTaipei(a.expires) }}</p>
          <p class="opacity-90">{{ a.description }}</p>
          <p v-if="a.instruction" class="text-xs opacity-75">{{ a.instruction }}</p>
        </div>
      </div>
    </section>

    <!-- 縣市矩陣答「哪個縣市有什麼」，這裡補「這則特報完整在說什麼、影響哪些地方」 -->
    <section v-if="detail && detail.bulletins.length > 0" class="space-y-2">
      <h2 class="text-sm font-medium text-text-secondary">特報全文</h2>
      <details
        v-for="b in detail.bulletins"
        :key="b.title + b.issueTime"
        class="rounded-lg bg-surface-1 p-4"
      >
        <summary class="cursor-pointer font-medium text-text-primary">
          {{ b.title }}
          <span v-if="b.startTime || b.endTime" class="ml-2 text-xs font-normal text-text-muted">
            <span v-if="b.startTime">{{ formatTaipei(b.startTime) }}</span>
            <span v-if="b.startTime && b.endTime"> – </span>
            <span v-if="b.endTime">{{ formatTaipei(b.endTime) }}</span>
          </span>
        </summary>
        <p class="mt-3 whitespace-pre-line text-sm text-text-secondary">{{ b.contentText }}</p>
        <div v-if="b.hazards.length > 0" class="mt-3 space-y-1 text-xs text-text-muted">
          <p v-for="h in b.hazards" :key="h.phenomena">
            <span class="font-medium text-text-secondary">{{ h.phenomena }}{{ h.significance }}</span>：{{ h.affectedAreas.join('、') }}
          </p>
        </div>
      </details>
    </section>
  </div>
</template>

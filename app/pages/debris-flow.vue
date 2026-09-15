<script setup lang="ts">
import type { DebrisFlowSummary } from '#shared/types'
import { formatTaipei } from '@/utils/formatDate'
import { debrisFlowColorClass, DEBRIS_FLOW_LEVEL_LABEL, DEBRIS_FLOW_TYPE_LABEL } from '@/utils/warningSeverity'

useSeoMeta({
  title: '土石流警戒 — 氣象知多少',
  description: '全台土石流／大規模崩塌現行警戒與近期發布紀錄，資料來自農業部農村發展及水土保持署。'
})

const { data: summary } = await useFetch<DebrisFlowSummary>('/api/debris-flow/alerts')
</script>

<template>
  <div class="space-y-4">
    <div v-if="!summary" class="rounded-lg bg-surface-1 p-8 text-center text-text-secondary">
      無法載入土石流警戒資料，請稍後再試。
    </div>

    <template v-else>
      <section v-if="summary.active.length > 0" class="space-y-2">
        <h2 class="text-sm font-medium text-text-secondary">現行警戒（{{ summary.active.length }} 筆）</h2>
        <div
          v-for="a in summary.active"
          :key="`${a.id}-${a.reportId}`"
          class="flex flex-wrap items-center gap-3 rounded-lg p-4"
          :class="debrisFlowColorClass(a.level)"
        >
          <span class="rounded-md bg-surface-0/40 px-2 py-0.5 text-xs font-medium">{{ DEBRIS_FLOW_TYPE_LABEL[a.type] }}</span>
          <span class="font-medium">{{ a.county }}{{ a.town }}{{ a.village ?? '' }}・{{ a.name }}</span>
          <span class="text-sm">{{ DEBRIS_FLOW_LEVEL_LABEL[a.level] }}</span>
          <span class="ml-auto text-xs">{{ formatTaipei(a.updateTime) }} 發布</span>
        </div>
      </section>

      <div v-else class="rounded-lg bg-surface-1 p-6 text-center text-text-secondary">目前全台無土石流／大規模崩塌現行警戒。</div>

      <section class="overflow-x-auto rounded-lg bg-surface-1">
        <h2 class="px-4 pt-4 text-sm font-medium text-text-secondary">近期警戒發布紀錄</h2>
        <table class="w-full min-w-2xl text-left text-sm">
          <thead>
            <tr class="border-b border-surface-2 text-text-muted">
              <th class="px-3 py-2 font-normal">類型</th>
              <th class="px-3 py-2 font-normal">地點</th>
              <th class="px-3 py-2 font-normal">警戒等級</th>
              <th class="px-3 py-2 font-normal">發布時間</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="a in summary.recent" :key="`${a.id}-${a.reportId}`" class="border-b border-surface-2/60 hover:bg-surface-2/40">
              <td class="px-3 py-1.5 text-text-secondary">{{ DEBRIS_FLOW_TYPE_LABEL[a.type] }}</td>
              <td class="px-3 py-1.5 text-text-primary">{{ a.county }}{{ a.town }}{{ a.village ?? '' }}・{{ a.name }}</td>
              <td class="px-3 py-1.5">
                <span class="rounded-md px-2 py-0.5 text-xs font-medium" :class="debrisFlowColorClass(a.level)">
                  {{ DEBRIS_FLOW_LEVEL_LABEL[a.level] }}
                </span>
              </td>
              <td class="px-3 py-1.5 text-text-muted">{{ formatTaipei(a.updateTime) }}</td>
            </tr>
          </tbody>
        </table>
        <p v-if="summary.recent.length === 0" class="p-6 text-center text-text-muted">近期沒有警戒發布紀錄。</p>
      </section>

      <p class="text-xs text-text-muted">
        資料來源：<a href="https://246.ardswc.gov.tw" target="_blank" rel="noopener" class="hover:text-text-secondary">農業部農村發展及水土保持署土石流及大規模崩塌防災資訊網</a>，
        現行警戒每 5 分鐘更新一次。這份資料只在有警戒發布時才有內容，且僅提供行政區與代碼描述位置、沒有精確座標，
        暫不提供地圖呈現；近期紀錄僅供參考，不代表該筆警戒現在仍然有效，請以現行警戒區塊或官方公告為準。
      </p>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import VChart from 'vue-echarts'
import type { EChartsOption } from 'echarts'

const props = withDefaults(
  defineProps<{
    option: EChartsOption
    height?: string
    /** 折線/長條圖預設十字準線 tooltip；純 bar/scatter 圖表可傳 false 改回單點高亮 */
    crosshair?: boolean
    loading?: boolean
  }>(),
  { height: '320px', crosshair: true, loading: false }
)

// 共用的十字準線 tooltip 設定（meteogram 等多圖層堆疊圖表的標準互動方式），
// 呼叫端傳進來的 option.tooltip 仍可覆寫個別欄位
const mergedOption = computed<EChartsOption>(() => ({
  ...props.option,
  tooltip: {
    trigger: 'axis',
    axisPointer: props.crosshair ? { type: 'cross', label: { backgroundColor: '#121b2e' } } : { type: 'line' },
    ...props.option.tooltip
  }
}))
</script>

<template>
  <ClientOnly>
    <VChart
      class="w-full"
      :style="{ height }"
      :option="mergedOption"
      theme="app-dark"
      :loading="loading"
      autoresize
    />
    <template #fallback>
      <div class="flex items-center justify-center text-sm text-text-muted" :style="{ height }">載入圖表中…</div>
    </template>
  </ClientOnly>
</template>

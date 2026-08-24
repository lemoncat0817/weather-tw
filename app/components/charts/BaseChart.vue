<script setup lang="ts">
import { computed, onBeforeUnmount, shallowRef, useTemplateRef, watch } from 'vue'
import * as echarts from 'echarts/core'
import type { EChartsOption, ECharts } from 'echarts'

// 不用 vue-echarts：實測它的 autoresize + option 套用時序在巢狀 CSS Grid 版面下會卡住
// （ResizeObserver 判斷「初次尺寸沒變化就跳過」，加上 option 套用被排進另一個 nextTick，
// 兩者交互下圖表會初始化成一個空殼、拿不到資料，也未必會被後續 resize 修正）。
// 自己直接管理 echarts 生命週期，行為完全確定、好除錯。
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

const container = useTemplateRef<HTMLDivElement>('container')
const chart = shallowRef<ECharts | null>(null)
let resizeObserver: ResizeObserver | null = null

// 不能用 onMounted：<div ref="container"> 包在 <ClientOnly> 裡面，ClientOnly 先渲染
// #fallback，要等它自己掛載完、下一輪更新才會換成真正的內容——BaseChart 自己的
// onMounted 觸發時，container.value 還是 null，導致整段初始化被靜默跳過（這正是
// 「容器尺寸/option 都正確、畫面卻完全空白」的真正原因，不是 resize 時機問題）。
// 改成 watch container ref 本身，不管它何時才變成非 null 都能正確初始化。
watch(
  container,
  (el) => {
    if (!el || chart.value) return

    const instance = echarts.init(el, 'app-dark')
    chart.value = instance
    instance.setOption(mergedOption.value)

    resizeObserver = new ResizeObserver(() => {
      if (el.offsetWidth > 0 && el.offsetHeight > 0) instance.resize()
    })
    resizeObserver.observe(el)
  },
  { immediate: true }
)

watch(mergedOption, (option) => {
  chart.value?.setOption(option, { notMerge: true })
})

watch(
  () => props.loading,
  (loading) => {
    if (loading) chart.value?.showLoading()
    else chart.value?.hideLoading()
  }
)

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  chart.value?.dispose()
  chart.value = null
})
</script>

<template>
  <ClientOnly>
    <div ref="container" class="w-full" :style="{ height }" />
    <template #fallback>
      <div class="flex items-center justify-center text-sm text-text-muted" :style="{ height }">載入圖表中…</div>
    </template>
  </ClientOnly>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, useTemplateRef } from 'vue'
import type { LightningFramesResponse } from '#shared/types'
import { createLightningBitmapCache } from '@/utils/lightningBitmap'

const { data: lightningData } = await useFetch<LightningFramesResponse>('/api/lightning/frames')

const frames = computed(() => lightningData.value?.frames ?? [])
const currentIndex = ref(Math.max(0, (frames.value.length ?? 0) - 1))
const isPlaying = ref(false)
let timer: ReturnType<typeof setInterval> | null = null

const currentFrame = computed(() => frames.value[currentIndex.value] ?? null)

const canvasRef = useTemplateRef<HTMLCanvasElement>('canvasRef')
const hasCanvasDrawn = ref(false)
const bitmapCache = createLightningBitmapCache()

// 記錄當前正在繪製的影格識別碼，避免快速拖曳時非同步回調亂序覆蓋
let renderingUrl: string | null = null

async function renderFrame(frame = currentFrame.value) {
  if (!frame || !canvasRef.value) return
  const targetUrl = frame.url
  renderingUrl = targetUrl

  const canvas = canvasRef.value
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  // 1. 同步快取命中：0ms 零延遲繪製
  const immediate = bitmapCache.getImmediate(frame)
  if (immediate) {
    if (renderingUrl === targetUrl) {
      ctx.drawImage(immediate, 0, 0, canvas.width, canvas.height)
      hasCanvasDrawn.value = true
    }
    return
  }

  // 2. 非同步解碼：在解碼完成前，Canvas 保持上一幀畫面，絕不清空、絕不閃黑
  const decoded = await bitmapCache.get(frame)
  if (decoded && renderingUrl === targetUrl) {
    ctx.drawImage(decoded, 0, 0, canvas.width, canvas.height)
    hasCanvasDrawn.value = true
  }
}

watch(currentIndex, (newIdx) => {
  const frame = frames.value[newIdx]
  if (!frame) return
  void renderFrame(frame)
  // 拖曳或播放時維持前方與後方的預載滑動視窗
  bitmapCache.prefetchWindow(frames.value, newIdx, isPlaying.value ? 10 : 5, 3)
})

function nextFrame() {
  if (frames.value.length === 0) return
  currentIndex.value = (currentIndex.value + 1) % frames.value.length
}

function prevFrame() {
  if (frames.value.length === 0) return
  currentIndex.value = (currentIndex.value - 1 + frames.value.length) % frames.value.length
}

function togglePlay() {
  if (isPlaying.value) {
    stopPlayback()
  } else {
    startPlayback()
  }
}

function startPlayback() {
  if (frames.value.length <= 1) return
  isPlaying.value = true
  // 啟動播放時立即預載後續 10 幀，確保第一輪播放極致順暢
  bitmapCache.prefetchWindow(frames.value, currentIndex.value, 10, 2)
  timer = setInterval(() => {
    nextFrame()
  }, 700)
}

function stopPlayback() {
  isPlaying.value = false
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}

onMounted(() => {
  if (frames.value.length > 0) {
    currentIndex.value = frames.value.length - 1
    void renderFrame()
    bitmapCache.prefetchWindow(frames.value, currentIndex.value, 8, 3)
  }
})

onUnmounted(() => {
  stopPlayback()
  bitmapCache.dispose()
})
</script>

<template>
  <div v-if="frames.length === 0" class="rounded-lg bg-surface-1 p-8 text-center text-text-secondary">
    無法載入閃電觀測影像，請稍後再試。
  </div>

  <div v-else class="space-y-3 rounded-lg bg-surface-1 p-4">
    <div class="flex items-center justify-between gap-3">
      <h2 class="text-sm font-medium text-text-secondary">
        即時閃電觀測
      </h2>

      <span v-if="currentFrame" class="text-xs font-medium tabular-nums text-text-muted">
        {{ currentFrame.displayTime }}
      </span>
    </div>

    <!-- 影像容器：使用單一 Canvas 雙緩衝繪製，避免換圖抽換 DOM 產生黑底閃爍 -->
    <div class="relative flex aspect-square max-h-[480px] w-full items-center justify-center overflow-hidden rounded-lg border border-border-subtle bg-black/40">
      <!-- 初始 SSR 圖片（在客戶端 Canvas 首次畫出前顯示，避免 hydration 空白；一旦 Canvas 就緒即隱藏） -->
      <img
        v-if="!hasCanvasDrawn && currentFrame"
        :src="currentFrame.url"
        :alt="`閃電觀測 ${currentFrame.displayTime}`"
        class="h-full w-full object-contain"
        loading="eager"
      >
      <canvas
        ref="canvasRef"
        width="1000"
        height="1000"
        class="h-full w-full object-contain"
        :class="{ 'opacity-0 pointer-events-none absolute': !hasCanvasDrawn, 'opacity-100': hasCanvasDrawn }"
      />
    </div>

    <!-- 時間軸與播放控制列 -->
    <div class="space-y-2 pt-1">
      <div class="flex items-center gap-3">
        <button
          type="button"
          class="flex h-8 w-8 items-center justify-center rounded-full bg-surface-2 text-sm text-text-primary transition-colors hover:bg-surface-3"
          :title="isPlaying ? '暫停' : '播放'"
          @click="togglePlay"
        >
          <span v-if="isPlaying">⏸</span>
          <span v-else>▶</span>
        </button>

        <button
          type="button"
          class="flex h-7 w-7 items-center justify-center rounded bg-surface-2 text-xs text-text-secondary transition-colors hover:text-text-primary"
          title="上一幀"
          @click="prevFrame"
        >
          ⏮
        </button>

        <input
          v-model.number="currentIndex"
          type="range"
          min="0"
          :max="frames.length - 1"
          class="h-1.5 flex-1 cursor-pointer appearance-none rounded-lg bg-surface-2 accent-accent"
          @input="stopPlayback"
        >

        <button
          type="button"
          class="flex h-7 w-7 items-center justify-center rounded bg-surface-2 text-xs text-text-secondary transition-colors hover:text-text-primary"
          title="下一幀"
          @click="nextFrame"
        >
          ⏭
        </button>

        <span class="min-w-[3rem] text-right text-xs tabular-nums text-text-muted">
          {{ currentIndex + 1 }} / {{ frames.length }}
        </span>
      </div>

      <p class="text-center text-xs text-text-muted">
        包含近 12 小時每 5 分鐘閃電對流觀測，可拖曳時間軸檢視對流與雷擊發展。
      </p>
    </div>
  </div>
</template>

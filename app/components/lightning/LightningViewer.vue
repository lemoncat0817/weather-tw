<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import type { LightningFramesResponse } from '#shared/types'

const { data: lightningData } = await useFetch<LightningFramesResponse>('/api/lightning/frames')

const frames = computed(() => lightningData.value?.frames ?? [])
const currentIndex = ref(Math.max(0, (frames.value.length ?? 0) - 1))
const isPlaying = ref(false)
let timer: ReturnType<typeof setInterval> | null = null

const currentFrame = computed(() => frames.value[currentIndex.value] ?? null)

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
  }
})

onUnmounted(() => {
  stopPlayback()
})
</script>

<template>
  <div v-if="frames.length === 0" class="rounded-lg bg-surface-1 p-8 text-center text-text-secondary">
    無法載入閃電觀測影像，請稍後再試。
  </div>

  <div v-else class="rounded-lg bg-surface-1 p-4 space-y-3">
    <div class="flex items-center justify-between gap-3">
      <h2 class="text-sm font-medium text-text-secondary">
        即時閃電觀測
      </h2>

      <span v-if="currentFrame" class="text-xs tabular-nums font-medium text-text-muted">
        {{ currentFrame.displayTime }}
      </span>
    </div>

    <!-- 影像容器 -->
    <div class="relative aspect-square max-h-[480px] w-full overflow-hidden rounded-lg bg-black/40 flex items-center justify-center border border-border-subtle">
      <img
        v-if="currentFrame"
        :key="currentFrame.url"
        :src="currentFrame.url"
        :alt="`閃電觀測 ${currentFrame.displayTime}`"
        class="h-full w-full object-contain"
        loading="eager"
      >
      <div v-else class="text-xs text-text-muted">
        無閃電影像資料
      </div>
    </div>

    <!-- 時間軸與播放控制列 -->
    <div class="space-y-2 pt-1">
      <div class="flex items-center gap-3">
        <button
          type="button"
          class="flex h-8 w-8 items-center justify-center rounded-full bg-surface-2 text-text-primary hover:bg-surface-3 transition-colors text-sm"
          :title="isPlaying ? '暫停' : '播放'"
          @click="togglePlay"
        >
          <span v-if="isPlaying">⏸</span>
          <span v-else>▶</span>
        </button>

        <button
          type="button"
          class="flex h-7 w-7 items-center justify-center rounded bg-surface-2 text-text-secondary hover:text-text-primary transition-colors text-xs"
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
          class="flex h-7 w-7 items-center justify-center rounded bg-surface-2 text-text-secondary hover:text-text-primary transition-colors text-xs"
          title="下一幀"
          @click="nextFrame"
        >
          ⏭
        </button>

        <span class="text-xs tabular-nums text-text-muted min-w-[3rem] text-right">
          {{ currentIndex + 1 }} / {{ frames.length }}
        </span>
      </div>

      <p class="text-center text-xs text-text-muted">
        包含近 12 小時每 5 分鐘閃電對流觀測，可拖曳時間軸檢視對流與雷擊發展。
      </p>
    </div>
  </div>
</template>

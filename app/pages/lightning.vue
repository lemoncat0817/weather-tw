<script setup lang="ts">
import LightningViewer from '@/components/lightning/LightningViewer.vue'

useSeoMeta({
  title: '即時閃電觀測 — 氣象知多少',
  description: '中央氣象署全臺即時閃電觀測影像與時間軸動態播放，隨時掌握短時強對流與落雷位置。'
})
</script>

<template>
  <div class="space-y-4">
    <LightningViewer />
  </div>
</template>

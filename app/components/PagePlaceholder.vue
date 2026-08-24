<script setup lang="ts">
defineProps<{
  title: string
  description: string
  phase: string
}>()
</script>

<template>
  <div class="space-y-4">
    <h1 class="text-2xl font-semibold text-text-primary">{{ title }}</h1>
    <p class="text-text-secondary">{{ description }}</p>
    <p class="text-sm text-text-muted">將於 {{ phase }} 建置。</p>
  </div>
</template>

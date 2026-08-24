<script setup lang="ts">
const route = useRoute()
const county = computed(() => String(route.params.county))
const town = computed(() => String(route.params.town))

useSeoMeta({ title: () => `${town.value}天氣預報 — 氣象知多少` })
</script>

<template>
  <PagePlaceholder
    :title="`${county} ${town} 天氣預報`"
    description="完整 meteogram（溫度、體感溫度、降雨機率、風標、濕度、晝夜底紋）與逐時資料。"
    phase="Phase 3"
  />
</template>

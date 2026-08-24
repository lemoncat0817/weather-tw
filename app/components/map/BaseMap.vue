<script setup lang="ts">
import { onBeforeUnmount, onMounted, shallowRef, useTemplateRef } from 'vue'
// maplibre-gl 沒有 default export，且它的 Map 類別跟全域 JS 內建的 Map 撞名，
// 用它自己提供的別名 MapLibreMap 避開
import { MapLibreMap, NavigationControl, type StyleSpecification } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'

const props = withDefaults(
  defineProps<{
    /** 預設檢視範圍，預設置中台灣本島 */
    center?: [lon: number, lat: number]
    zoom?: number
    /** 覆寫底圖樣式（不填則用 runtimeConfig.public.mapStyleUrl） */
    styleUrl?: string
  }>(),
  { center: () => [121, 23.6], zoom: 6.5, styleUrl: undefined }
)

const emit = defineEmits<{
  /** 地圖初始化完成，呼叫端可以在這裡加自己的 layer/source */
  ready: [map: MapLibreMap]
}>()

const config = useRuntimeConfig()
const container = useTemplateRef<HTMLDivElement>('container')
const map = shallowRef<MapLibreMap | null>(null)

onMounted(() => {
  if (!container.value) return

  const instance = new MapLibreMap({
    container: container.value,
    style: (props.styleUrl ?? config.public.mapStyleUrl) as string | StyleSpecification,
    center: props.center,
    zoom: props.zoom,
    attributionControl: { compact: true }
  })
  map.value = instance

  instance.addControl(new NavigationControl({ showCompass: false }), 'top-right')
  instance.on('load', () => emit('ready', instance))
})

onBeforeUnmount(() => {
  map.value?.remove()
  map.value = null
})

defineExpose({ map })
</script>

<template>
  <div ref="container" class="h-full w-full" />
</template>

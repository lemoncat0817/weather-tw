<script setup lang="ts">
import { onBeforeUnmount, onMounted, shallowRef, useTemplateRef } from 'vue'
// 只 import 型別（編譯後會被抹除）；實作走 @/utils/maplibre 的動態 import，理由與
// 實測數字見該檔案的說明。maplibre-gl 沒有 default export，且它的 Map 類別跟全域 JS
// 內建的 Map 撞名，用它自己提供的別名 MapLibreMap 避開
import type { MapLibreMap, StyleSpecification } from 'maplibre-gl'
import { loadMapLibre } from '@/utils/maplibre'
// 樣式表留靜態 import：CSS 會被抽成這個元件所屬路由的 chunk，只有有地圖的頁面才載入，
// 而且要在地圖畫出來的同一輪就生效，不適合延後
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
// 動態載入期間元件可能就被卸載了（使用者快速切頁），此時不能再建地圖，否則會留下
// 一個沒人 remove()、持續佔著 WebGL context 與圖磚請求的孤兒實例
let unmounted = false

onMounted(async () => {
  if (!container.value) return

  const { MapLibreMap: MapLibreMapCtor, NavigationControl } = await loadMapLibre()
  if (unmounted || !container.value) return

  const instance = new MapLibreMapCtor({
    container: container.value,
    style: (props.styleUrl ?? config.public.mapStyleUrl) as string | StyleSpecification,
    center: props.center,
    zoom: props.zoom,
    attributionControl: { compact: true }
  })
  map.value = instance

  instance.addControl(new NavigationControl({ showCompass: false }), 'top-right')

  // style.load 在底圖圖磚下載完之前就會觸發；等 `load` 才加雷達圖層會讓 PNG 晚兩秒才開始抓
  let readyEmitted = false
  const notifyReady = () => {
    if (readyEmitted) return
    readyEmitted = true
    emit('ready', instance)
  }
  instance.once('style.load', notifyReady)
  instance.once('load', notifyReady)

  // attributionControl: { compact: true } 只決定「用小圖示還是全文字」，不影響初始展開狀態——
  // MapLibre 的 AttributionControl 實作成原生 <details open>，且它自己在 onAdd／每次
  // styledata／sourcedata 更新時都可能把 open 屬性重新設回去（原始碼的 _updateCompact 在
  // 「第一次」轉成 compact 樣式時一定會 setAttribute('open','')），跟 load／style.load 屬於
  // 同一輪初始化、時序上很容易被它蓋回來（實測 style.load/load 之後立刻關一樣沒用）。
  // 用 idle（保證整個地圖含所有內部控制項都已初始化完畢、沒有更晚的動作）才動手，且只做這一次，
  // 之後使用者自己點圖示展開/收合都不會再被這裡干預。不能整個隱藏：OpenFreeMap／OpenStreetMap
  // 的授權條款要求顯示出處，僅允許「使用者主動收合」，這裡只是把預設狀態從「展開」改成「收合」。
  instance.once('idle', () => {
    instance.getContainer().querySelector<HTMLDetailsElement>('.maplibregl-ctrl-attrib')?.removeAttribute('open')
  })
})

onBeforeUnmount(() => {
  unmounted = true
  map.value?.remove()
  map.value = null
})

defineExpose({ map })
</script>

<template>
  <div ref="container" class="h-full w-full" />
</template>

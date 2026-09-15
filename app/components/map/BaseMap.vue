<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, shallowRef, useTemplateRef } from 'vue'
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
    /** 外部自訂載入狀態（未提供時由地圖初始化自動管理） */
    loading?: boolean
    /** 載入提示文字 */
    loadingText?: string
  }>(),
  {
    center: () => [121, 23.6],
    zoom: 6.5,
    styleUrl: undefined,
    loading: undefined,
    loadingText: '載入地圖中…'
  }
)

const emit = defineEmits<{
  /** 地圖初始化完成，呼叫端可以在這裡加自己的 layer/source */
  ready: [map: MapLibreMap]
  /** 地圖載入發生錯誤 */
  error: [error: unknown]
}>()

const config = useRuntimeConfig()
const container = useTemplateRef<HTMLDivElement>('container')
const map = shallowRef<MapLibreMap | null>(null)
const internalLoading = ref(true)
const errorMessage = ref<string | null>(null)

const isLoading = computed(() => props.loading ?? internalLoading.value)

// 動態載入期間元件可能就被卸載了（使用者快速切頁），此時不能再建地圖，否則會留下
// 一個沒人 remove()、持續佔著 WebGL context 與圖磚請求的孤兒實例
let unmounted = false
let safetyTimer: ReturnType<typeof setTimeout> | null = null

function hideLoading() {
  if (safetyTimer) {
    clearTimeout(safetyTimer)
    safetyTimer = null
  }
  internalLoading.value = false
}

async function initMap() {
  if (!container.value) return
  internalLoading.value = true
  errorMessage.value = null

  try {
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
    instance.once('load', () => {
      notifyReady()
      hideLoading()
    })

    // attributionControl: { compact: true } 只決定「用小圖示還是全文字」，不影響初始展開狀態——
    // MapLibre 的 AttributionControl 實作成原生 <details open>，且它自己在 onAdd／每次
    // styledata／sourcedata 更新時都可能把 open 屬性重新設回去（原始碼的 _updateCompact 在
    // 「第一次」轉成 compact 樣式時一定會 setAttribute('open','')），跟 load／style.load 屬於
    // 同一輪初始化、時序上很容易被它蓋回來（實測 style.load/load 之後立刻關一樣沒用）。
    // 用 idle（保證整個地圖含所有內部控制項都已初始化完畢、沒有更晚的動作）才動手，且只做這一次，
    // 之後使用者自己點圖示展開/收合都不會再被這裡干預。不能整個隱藏：OpenFreeMap／OpenStreetMap
    // 的授權條款要求顯示出處，僅允許「使用者主動收合」，這裡只是把預設狀態從「展開」改成「收合」。
    instance.once('idle', () => {
      hideLoading()
      instance.getContainer().querySelector<HTMLDetailsElement>('.maplibregl-ctrl-attrib')?.removeAttribute('open')
    })

    // 安全防護：若底圖或圖磚因網路極慢延遲，8 秒後淡出遮罩避免永久卡住
    safetyTimer = setTimeout(hideLoading, 8000)

    // 監聽致命錯誤（如底圖樣式解析失敗）
    instance.on('error', (e) => {
      if (e.error?.message?.includes('style') || e.error?.message?.includes('WebGL')) {
        errorMessage.value = '底圖載入失敗，請檢查網路連線或稍後再試。'
        hideLoading()
        emit('error', e.error)
      }
    })
  } catch (err) {
    if (unmounted) return
    hideLoading()
    errorMessage.value = '無法初始化地圖（請確認瀏覽器支援 WebGL）'
    emit('error', err)
  }
}

function retry() {
  if (map.value) {
    map.value.remove()
    map.value = null
  }
  initMap()
}

onMounted(() => {
  initMap()
})

onBeforeUnmount(() => {
  unmounted = true
  if (safetyTimer) {
    clearTimeout(safetyTimer)
    safetyTimer = null
  }
  map.value?.remove()
  map.value = null
})

defineExpose({ map })
</script>

<template>
  <div class="relative h-full w-full">
    <div ref="container" class="h-full w-full" />

    <!-- 載入中遮罩：在 maplibre 模組下載、底圖樣式抓取及首次完成渲染前顯示，
         避免空白區域讓使用者誤以為當機；淡出過渡確保地圖平滑顯現 -->
    <Transition
      enter-active-class="transition-opacity duration-200 ease-out"
      leave-active-class="transition-opacity duration-300 ease-in"
      enter-from-class="opacity-0"
      leave-to-class="opacity-0"
    >
      <div
        v-if="isLoading && !errorMessage"
        class="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center gap-2.5 bg-surface-1/70 backdrop-blur-xs text-sm text-text-muted"
        aria-live="polite"
      >
        <div class="flex items-center gap-2">
          <svg class="h-4 w-4 animate-spin text-accent" viewBox="0 0 24 24" fill="none">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" />
            <path
              class="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span class="font-medium tracking-wide">{{ loadingText }}</span>
        </div>
      </div>
    </Transition>

    <!-- 錯誤狀態（如 WebGL 不支援或底圖樣式載入失敗） -->
    <div
      v-if="errorMessage"
      class="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-surface-1 p-4 text-center text-sm text-text-secondary"
    >
      <p class="text-severity-warning font-medium">{{ errorMessage }}</p>
      <button
        type="button"
        class="mt-1 rounded bg-surface-2 px-3 py-1.5 text-xs text-text-primary hover:bg-surface-3 transition-colors"
        @click="retry"
      >
        重新載入
      </button>
    </div>
  </div>
</template>

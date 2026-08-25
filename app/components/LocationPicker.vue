<script setup lang="ts">
import { computed, ref } from 'vue'
import type { TownSummary } from '#shared/types'
import { findNearest } from '@/utils/geoDistance'

const emit = defineEmits<{
  select: [county: string, town: string]
  close: []
}>()

// 只在面板真正打開時才會掛載這個元件（見 index.vue 的 v-if），所以這次 fetch 不會拖累首頁的
// 首屏渲染——大多數訪客根本不會點開地區選擇器。故意不 await：這是一個透過 v-if 動態掛載的
// 一般元件，不是 page，沒有外層 <Suspense> 邊界，await 會讓 setup() 變成 async 卻沒有
// Suspense 承接，用 status 驅動 loading 畫面即可
const { data: towns, status } = useFetch<TownSummary[]>('/api/forecast/choropleth')

const query = ref('')
const activeIndex = ref(0)
const geoStatus = ref<'idle' | 'locating' | 'denied' | 'unsupported' | 'error'>('idle')

// 故意不截斷結果數量：以前限制只顯示前 8 筆，會讓「捲動看更多」變成沒東西可捲
// （例如宜蘭縣有 12 個鄉鎮，只搜得到前 8 個）。全台 368 個鄉鎮的清單本身不大，
// 讓 max-h-64 overflow-y-auto 的容器自己處理捲動就好，不用先幫使用者過濾掉一部分結果。
const results = computed(() => {
  const q = query.value.trim()
  const list = towns.value ?? []
  if (!q) return list
  return list.filter((t) => `${t.county}${t.town}`.includes(q))
})

function pick(t: TownSummary | undefined) {
  if (!t) return
  emit('select', t.county, t.town)
}

function useMyLocation() {
  if (!('geolocation' in navigator)) {
    geoStatus.value = 'unsupported'
    return
  }
  geoStatus.value = 'locating'
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      geoStatus.value = 'idle'
      const nearest = findNearest({ lat: pos.coords.latitude, lon: pos.coords.longitude }, towns.value ?? [])
      pick(nearest ?? undefined)
    },
    () => {
      geoStatus.value = 'denied'
    },
    { timeout: 10_000 }
  )
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    activeIndex.value = Math.min(activeIndex.value + 1, results.value.length - 1)
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    activeIndex.value = Math.max(activeIndex.value - 1, 0)
  } else if (e.key === 'Enter') {
    e.preventDefault()
    pick(results.value[activeIndex.value])
  } else if (e.key === 'Escape') {
    emit('close')
  }
}
</script>

<template>
  <div role="dialog" aria-label="選擇地區" class="w-80 rounded-lg border border-border bg-surface-1 p-3 shadow-xl">
    <button
      type="button"
      class="mb-2 flex w-full items-center gap-2 rounded-md bg-surface-2 px-3 py-2 text-left text-sm text-text-primary hover:bg-surface-3"
      @click="useMyLocation"
    >
      <svg viewBox="0 0 24 24" class="h-4 w-4 shrink-0 text-accent" fill="none" stroke="currentColor" stroke-width="1.8">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M12 21s7-6.5 7-11.5a7 7 0 1 0-14 0C5 14.5 12 21 12 21Z"
        />
        <circle cx="12" cy="9.5" r="2.3" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
      <span v-if="geoStatus === 'locating'">定位中…</span>
      <span v-else-if="geoStatus === 'denied'" class="text-text-secondary">無法取得定位權限，請改用下方搜尋</span>
      <span v-else-if="geoStatus === 'unsupported'" class="text-text-secondary">此瀏覽器不支援定位</span>
      <span v-else>使用目前位置</span>
    </button>

    <input
      v-model="query"
      role="combobox"
      aria-expanded="true"
      aria-controls="location-results"
      type="search"
      autofocus
      placeholder="搜尋縣市或鄉鎮…"
      class="w-full rounded-md border border-surface-2 bg-surface-0 px-3 py-2 text-sm text-text-primary placeholder:text-text-muted"
      @keydown="onKeydown"
    >

    <p v-if="status === 'pending'" class="mt-2 px-1 text-sm text-text-muted">載入地區清單中…</p>
    <ul v-else id="location-results" role="listbox" class="mt-2 max-h-64 overflow-y-auto">
      <li
        v-for="(t, i) in results"
        :key="`${t.county}-${t.town}`"
        role="option"
        :aria-selected="i === activeIndex"
        class="cursor-pointer rounded-md px-3 py-1.5 text-sm"
        :class="i === activeIndex ? 'bg-surface-2 text-text-primary' : 'text-text-secondary hover:bg-surface-2/60'"
        @click="pick(t)"
        @mouseenter="activeIndex = i"
      >
        {{ t.county }}{{ t.town }}
      </li>
      <li v-if="results.length === 0" class="px-3 py-2 text-sm text-text-muted">找不到符合的地區</li>
    </ul>
  </div>
</template>

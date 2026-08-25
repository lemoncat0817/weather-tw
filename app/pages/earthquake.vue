<script setup lang="ts">
import { computed, ref, shallowRef, watch } from 'vue'
import { Marker, type MapLibreMap } from 'maplibre-gl'
import type { Earthquake } from '#shared/types'
import { buildIntensityBarOption } from '@/utils/earthquakeChart'
import { seismicIntensityColor } from '@/utils/colorScales'
import { formatTaipei } from '@/utils/formatDate'

useSeoMeta({
  title: '地震資訊 — 氣象知多少',
  description: '近期顯著有感地震：震央地圖、規模、深度與各縣市震度分布。'
})

const { data: earthquakes } = await useFetch<Earthquake[]>('/api/earthquake/recent', { query: { limit: 15 } })

const selectedId = ref<string | null>(null)
const selected = computed<Earthquake | null>(() => {
  const list = earthquakes.value ?? []
  if (list.length === 0) return null
  return list.find((e) => e.id === selectedId.value) ?? list[0]!
})

const intensityBarOption = computed(() => (selected.value ? buildIntensityBarOption(selected.value.shakingAreas) : null))

const mapInstance = shallowRef<MapLibreMap | null>(null)
const marker = shallowRef<Marker | null>(null)

function placeMarker(map: MapLibreMap, eq: Earthquake) {
  marker.value?.remove()
  const radius = 12 + eq.magnitude * 3
  const el = document.createElement('div')
  el.style.width = `${radius}px`
  el.style.height = `${radius}px`
  el.style.borderRadius = '50%'
  el.style.backgroundColor = seismicIntensityColor(eq.maxIntensity)
  el.style.opacity = '0.75'
  el.style.border = '2px solid #05070d'
  marker.value = new Marker({ element: el }).setLngLat([eq.epicenter.lon, eq.epicenter.lat]).addTo(map)
  map.flyTo({ center: [eq.epicenter.lon, eq.epicenter.lat], zoom: 7, animate: false })
}

function onMapReady(map: MapLibreMap) {
  mapInstance.value = map
  if (selected.value) placeMarker(map, selected.value)
}

watch(selected, (eq) => {
  if (mapInstance.value && eq) placeMarker(mapInstance.value, eq)
})
</script>

<template>
  <div class="space-y-4">
    <div v-if="!earthquakes || earthquakes.length === 0" class="rounded-lg bg-surface-1 p-8 text-center">
      <p class="text-text-secondary">近期無顯著有感地震回報。</p>
    </div>

    <div v-else class="grid gap-4 lg:grid-cols-[20rem_1fr]">
      <!-- 地震列表 -->
      <div class="max-h-[36rem] space-y-1.5 overflow-y-auto rounded-lg bg-surface-1 p-2 lg:max-h-[calc(100vh-10rem)]">
        <button
          v-for="eq in earthquakes"
          :key="eq.id"
          type="button"
          class="flex w-full items-start gap-2 rounded-md p-2 text-left"
          :class="selected?.id === eq.id ? 'bg-surface-2' : 'hover:bg-surface-2/60'"
          @click="selectedId = eq.id"
        >
          <span
            class="mt-1 h-2.5 w-2.5 shrink-0 rounded-full"
            :style="{ backgroundColor: seismicIntensityColor(eq.maxIntensity) }"
          />
          <span class="min-w-0">
            <span class="block truncate text-sm text-text-primary">{{ eq.epicenterDescription }}</span>
            <span class="block text-xs text-text-muted">{{ formatTaipei(eq.originTime) }} · 規模 {{ eq.magnitude }} · 最大震度 {{ eq.maxIntensity }}</span>
          </span>
        </button>
      </div>

      <!-- 詳情 -->
      <div v-if="selected" class="space-y-4">
        <section class="flex flex-wrap items-start gap-4 rounded-lg bg-surface-1 p-6">
          <div>
            <p class="text-sm text-text-muted">{{ formatTaipei(selected.originTime) }}</p>
            <p class="text-lg text-text-primary">{{ selected.epicenterDescription }}</p>
          </div>
          <div class="ml-auto grid grid-cols-3 gap-x-6 gap-y-1 text-sm">
            <div>
              <p class="text-text-muted">規模</p>
              <p class="tabular-nums text-text-primary">{{ selected.magnitude }} ({{ selected.magnitudeType }})</p>
            </div>
            <div>
              <p class="text-text-muted">深度</p>
              <p class="tabular-nums text-text-primary">{{ selected.depthKm }} km</p>
            </div>
            <div>
              <p class="text-text-muted">最大震度</p>
              <p class="tabular-nums text-text-primary" :style="{ color: seismicIntensityColor(selected.maxIntensity) }">
                {{ selected.maxIntensity }}
              </p>
            </div>
          </div>
          <p class="w-full text-sm text-text-secondary">{{ selected.reportContent }}</p>
        </section>

        <div class="grid gap-4 lg:grid-cols-2">
          <section class="h-80 overflow-hidden rounded-lg bg-surface-1">
            <MapBaseMap :center="[selected.epicenter.lon, selected.epicenter.lat]" :zoom="7" @ready="onMapReady" />
          </section>

          <section class="rounded-lg bg-surface-1 p-4">
            <h2 class="mb-2 text-sm font-medium text-text-secondary">各縣市震度</h2>
            <ChartsBaseChart
              v-if="intensityBarOption"
              :option="intensityBarOption"
              :height="`${Math.max(160, selected.shakingAreas.length * 28)}px`"
              :crosshair="false"
            />
          </section>
        </div>
      </div>
    </div>
  </div>
</template>

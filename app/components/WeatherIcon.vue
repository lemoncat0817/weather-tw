<script setup lang="ts">
import { computed } from 'vue'
import { weatherIconKey, isDaytimeSensitive, isDaytimeHour, type WeatherIconKey } from '@/utils/weatherCode'

const props = withDefaults(
  defineProps<{
    /** CWA 天氣代碼（WeatherCode 欄位），如 "08" */
    code: string
    /** 判斷晴天系列圖示要用太陽還是月亮；預設用目前時間 */
    at?: Date
    class?: string
  }>(),
  { at: () => new Date(), class: '' }
)

const key = computed<WeatherIconKey>(() => weatherIconKey(props.code))
const daytime = computed(() => isDaytimeHour(props.at))
const showSun = computed(() => isDaytimeSensitive(key.value) && daytime.value)
const showMoon = computed(() => isDaytimeSensitive(key.value) && !daytime.value)
</script>

<template>
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.5"
    stroke-linecap="round"
    stroke-linejoin="round"
    :class="props.class"
    role="img"
    :aria-label="key"
  >
    <!-- 太陽（晴天系列，白天） -->
    <template v-if="showSun">
      <circle cx="12" cy="12" r="4.2" />
      <path d="M12 2.5v2.2M12 19.3v2.2M4.2 12H2M22 12h-2.2M5.6 5.6l1.5 1.5M16.9 16.9l1.5 1.5M18.4 5.6l-1.5 1.5M7.1 16.9l-1.5 1.5" />
    </template>

    <!-- 月亮（晴天系列，晚上） -->
    <path v-if="showMoon" d="M15.5 3.6a8 8 0 1 0 5 8.7 6.3 6.3 0 0 1-5-8.7Z" />

    <!-- 少量雲（晴時多雲 / 多雲時晴），疊在太陽/月亮右下方 -->
    <path v-if="key === 'mostly-clear' || key === 'partly-cloudy'" d="M10.5 20.2a3.3 3.3 0 0 1 .4-6.6 4.2 4.2 0 0 1 8 1.1 3 3 0 0 1-.6 5.5Z" />

    <!-- 一般雲層（多雲 / 多雲時陰 / 陰時多雲 / 陰天，程度由深淺表達） -->
    <path
      v-if="['mostly-cloudy', 'cloudy'].includes(key)"
      :opacity="key === 'cloudy' ? 1 : 0.85"
      d="M7 19a4 4 0 0 1-.6-7.9 5.2 5.2 0 0 1 9.9-2 4.3 4.3 0 0 1 3.2 4.2 4 4 0 0 1-.8 7.7Z"
    />

    <!-- 雨系列的雲（比一般雲更飽滿，底下才能容得下雨滴） -->
    <path
      v-if="['light-rain', 'rain', 'fog-rain', 'thunderstorm'].includes(key)"
      d="M6.8 15.8a3.8 3.8 0 0 1-.5-7.5A5 5 0 0 1 15.8 6a4.1 4.1 0 0 1 3 4 3.8 3.8 0 0 1-.8 5.8Z"
    />

    <!-- 雨夾雪的雲 -->
    <path v-if="key === 'sleet'" d="M6.8 14.8a3.6 3.6 0 0 1-.5-7.1A4.8 4.8 0 0 1 15.2 5.4a3.9 3.9 0 0 1 2.9 3.8 3.6 3.6 0 0 1-.8 5.6Z" />

    <!-- 雨滴：疏（light-rain）/ 密（rain, fog-rain） -->
    <g v-if="key === 'light-rain'">
      <path d="M8.5 18v2M15.5 18v2" />
    </g>
    <g v-if="key === 'rain' || key === 'fog-rain'">
      <path d="M7.5 18v2.4M12 18v2.4M16.5 18v2.4" />
    </g>

    <!-- 閃電（雷雨系列） -->
    <path v-if="key === 'thunderstorm'" d="M12.6 15.2 10 19.4h2.6l-1.2 3.6 4-5.4h-2.6l1.2-2.4Z" fill="currentColor" stroke="none" />

    <!-- 雨夾雪的降水符號 -->
    <g v-if="key === 'sleet'">
      <path d="M8 18.2v1.6M9 20.6h-2" />
      <path d="M15.5 17.6v2.8M14.3 18.3l2.4 1.4M16.7 18.3l-2.4 1.4" />
    </g>

    <!-- 霧：純霧用三條橫線置中；霧+雨在雲下方加橫線 -->
    <g v-if="key === 'fog'">
      <path d="M4 10h16M6 13.5h12M4 17h16" />
    </g>
    <path v-if="key === 'fog-rain'" d="M5 20.6h14" />

    <!-- 雪花 -->
    <g v-if="key === 'snow'">
      <path d="M12 4v16M6.5 7l11 10M17.5 7l-11 10" />
      <path d="M9.5 5.6 12 8l2.5-2.4M9.5 18.4 12 16l2.5 2.4M4.8 9.2 8.4 10l-.2 3.5M19.2 9.2 15.6 10l.2 3.5" />
    </g>
  </svg>
</template>

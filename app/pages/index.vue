<script setup lang="ts">
import { computed, ref, useTemplateRef } from 'vue'
import { onClickOutside } from '@vueuse/core'
import { buildMeteogramOption } from '@/utils/meteogram'
import { formatTaipeiMonthDay, formatTaipeiTime } from '@/utils/formatDate'
import { severityClass } from '@/utils/warningSeverity'
import { temperatureColor, airQualityColor } from '@/utils/colorScales'
import { AIR_QUALITY_LEVEL_LABEL, nearestAirQualityStation } from '@/utils/airQuality'
import type {
  TownForecast,
  TownForecastPeriod,
  CountyWarning,
  Typhoon,
  Earthquake,
  RadarFrame,
  AirQualityStation,
  GeoFeatureCollection,
  GeoPoint,
  WorkSchoolStatusResponse
} from '#shared/types'

useSeoMeta({
  title: '氣象知多少 — 台灣即時天氣、雷達與颱風資訊',
  description: '台灣即時天氣預報、雷達回波、空氣品質、颱風路徑與地震資訊的專業氣象資訊平台。'
})

const DEFAULT_COUNTY = '臺北市'
const DEFAULT_TOWN = '中正區'

// 記住使用者上次選的地區。故意用 cookie（useCookie）不用 localStorage：localStorage 只有
// 瀏覽器端讀得到，SSR 當下完全不知道使用者存過什麼，只能先用預設值畫出來，等 client 端
// mounted 之後才讀到真正的值、切換過去——使用者會先看到一閃而過的預設地區（臺北市中正區），
// 才跳到自己選的地區，而且這次還會經過中間的「載入天氣資料中…」畫面，體驗更差。
// cookie 會隨請求送到伺服器，SSR 階段就能直接讀到，第一次回應就是正確地區，完全不會閃
const selectedCounty = useCookie('home-county', { default: () => DEFAULT_COUNTY, maxAge: 60 * 60 * 24 * 365 })
const selectedTown = useCookie('home-town', { default: () => DEFAULT_TOWN, maxAge: 60 * 60 * 24 * 365 })

// useFetch 內部監看 key 的 watcher 是 flush:'sync'（Nuxt 4.5 asyncData.js），依賴一變就立刻
// 同步重新求值，不會把同一輪的多個變更批次處理。若 key 直接讀 selectedCounty/selectedTown
// 這兩個各自獨立的 cookie，onLocationSelect 依序寫入兩個值時會各自觸發一次重新求值，中間那次
// 用「新縣市＋舊鄉鎮」這種不存在的組合送出一發注定失敗、隨即被蓋掉的請求（實測 devtools 網路
// 面板真的看得到 net::ERR_ABORTED）。改成 key 只依賴這一個物件 ref，onLocationSelect 一次寫入，
// 兩個 cookie 只負責跨重新整理記住使用者選擇，不直接餵給 fetch
const selectedLocation = ref({ county: selectedCounty.value, town: selectedTown.value })

const [
  { data: forecast, status: forecastStatus },
  { data: warnings },
  { data: typhoons },
  { data: earthquakes },
  { data: radar },
  { data: workSchoolStatus }
] = await Promise.all([
  useFetch<TownForecast>(
    () => `/api/forecast/${encodeURIComponent(selectedLocation.value.county)}/${encodeURIComponent(selectedLocation.value.town)}`,
    { key: () => `home-forecast-${selectedLocation.value.county}-${selectedLocation.value.town}` }
  ),
  useFetch<CountyWarning[]>('/api/warnings'),
  useFetch<Typhoon[]>('/api/typhoon/active'),
  useFetch<Earthquake[]>('/api/earthquake/recent', { query: { limit: 3 } }),
  useFetch<RadarFrame[]>('/api/radar/frames'),
  useFetch<WorkSchoolStatusResponse>('/api/work-school-status')
])

// 全台空氣品質測站只有約 80 個，鄉鎮卻有 368 個，不是每個鄉鎮旁邊都有站——這份資料只餵給
// 首頁 Hero 卡片的一個小徽章，不是 SEO 內容，故意不放進上面那批 SSR 的 Promise.all，
// 跟 /map、/health 的作法一致：server:false，等 hydration 後再抓，不拖累首屏
const { data: airQualityStations, status: airQualityStatus } = useFetch<
  GeoFeatureCollection<GeoPoint, AirQualityStation>
>('/api/air-quality/stations', { server: false })

const nearestAirQuality = computed(() => {
  const coordinates = forecast.value?.coordinates
  const stations = airQualityStations.value?.features.map((f) => f.properties)
  if (!coordinates || !stations || stations.length === 0) return null
  return nearestAirQualityStation(coordinates, stations)
})

// 「還沒有結果」的兩種狀態，模板用它決定要不要顯示讀取中的佔位。一定要同時涵蓋 idle 與
// pending，這是 server:false 在 SSR 下的狀態時序決定的（Nuxt 4.5 asyncData.js）：SSR 端整段
// fetch 跳過、status 停在 idle；client 端這支 fetch 被排進 onBeforeMount 而不是 setup()，而
// Vue 的順序是 setup → beforeMount（fetch 發動，status 轉 pending）→ 第一次 render（hydration
// 比對）。所以 SSR 是 idle、client 第一輪 render 是 pending，只認其中一種就會兩邊對不上，
// 觸發 hydration mismatch；兩種都認才會一致，而且佔位文字能直接寫進 SSR 的 HTML，
// 使用者不用等整包 JS 下載完就看得到（開發模式未打包時那段等待特別久）
const airQualityLoading = computed(() => airQualityStatus.value === 'idle' || airQualityStatus.value === 'pending')

// 抓完之後確定「附近沒有測站」（跟還在讀取中不一樣，也跟抓取失敗不一樣——失敗時維持原本
// 的靜默不顯示，沒必要讓使用者對著一個暫時性的網路問題感到疑惑）。這一排的其他項目
// （降雨機率/風速/風向/日出/日沒）永遠都會顯示，只有這項會整個消失不見，容易讓人誤以為
// 壞掉（烏坵鄉這類離島離最近測站 130 公里，是實測踩到的真實案例）——有明確答案時就講清楚，
// 比什麼都不顯示更誠實
const airQualityNoCoverage = computed(() => airQualityStatus.value === 'success' && !nearestAirQuality.value)

const ACTIVE_WARNINGS_COLLAPSE_AT = 5
const activeWarnings = computed(() => (warnings.value ?? []).filter((w) => w.hazards.length > 0))
const visibleWarnings = computed(() => activeWarnings.value.slice(0, ACTIVE_WARNINGS_COLLAPSE_AT))
const hiddenWarningsCount = computed(() => Math.max(0, activeWarnings.value.length - ACTIVE_WARNINGS_COLLAPSE_AT))
const latestRadar = computed(() => radar.value?.at(-1) ?? null)

// 比照颱風／地震快訊卡片：平時完全不佔版面，真的停班停課才出現並連到 /warnings。大雷雨
// 即時訊息不做同樣處理——內容常跟上面特報條重複（同一場雨兩處都連到 /warnings），故拿掉
const suspendedCounties = computed(() =>
  workSchoolStatus.value?.isDefaultStatus
    ? []
    : (workSchoolStatus.value?.counties ?? []).filter((c) => c.status === 'suspended' || c.status === 'partial')
)
const hasFullSuspension = computed(() => suspendedCounties.value.some((c) => c.status === 'suspended'))

const pickerOpen = ref(false)
const pickerRoot = useTemplateRef<HTMLElement>('pickerRoot')
onClickOutside(pickerRoot, () => (pickerOpen.value = false))

function onLocationSelect(county: string, town: string) {
  selectedCounty.value = county
  selectedTown.value = town
  selectedLocation.value = { county, town }
  pickerOpen.value = false
}

const current = computed(() => {
  const hours = forecast.value?.hourly
  if (!hours || hours.length === 0) return null
  const now = Date.now()
  return hours.reduce((closest, h) =>
    Math.abs(new Date(h.time).getTime() - now) < Math.abs(new Date(closest.time).getTime() - now) ? h : closest
  )
})

const compactMeteogram = computed(() =>
  forecast.value
    ? buildMeteogramOption(forecast.value.hourly.slice(0, 24), {
        compact: true,
        sunrise: forecast.value.sunrise,
        sunset: forecast.value.sunset
      })
    : null
)

const weekAhead = computed(() => forecast.value?.extended.filter((_, i) => i % 2 === 0).slice(0, 7) ?? [])

// 7 天溫度區間棒的定義域：用「這一週」自己的最低/最高溫當 0%/100%，跟地圖圖例固定 15~35°C
// 的絕對定義域不同語意——這裡要凸顯的是同一週內幾天之間的相對冷熱，不是跟其他地區比對的
// 絕對讀數，固定域在寒流或熱浪週會讓所有長條擠成一團，看不出差異
const weekTemperatureRange = computed(() => {
  if (weekAhead.value.length === 0) return null
  const min = Math.min(...weekAhead.value.map((p) => p.minTemperature))
  const max = Math.max(...weekAhead.value.map((p) => p.maxTemperature))
  return { min, max: Math.max(max, min + 1) } // +1 下限：全週同溫時避免除以零
})

// 整週共用同一條「冷→熱」漸層（沿用地圖圖例那支 colorScales.temperatureColor），每天的色塊
// 只是這條漸層裡對應自己高低溫範圍的那一段，用 background-size/position 的精靈圖技巧截取，
// 這樣跨天比色時仍是同一套色階，不會因為各自重算色相而讓相近溫度看起來不一致
const WEEK_GRADIENT_STOPS = 9
const weekGradient = computed(() => {
  const stops = Array.from({ length: WEEK_GRADIENT_STOPS }, (_, i) => {
    const t = (i / (WEEK_GRADIENT_STOPS - 1)) * 2 - 1
    return `${temperatureColor(t)} ${(i / (WEEK_GRADIENT_STOPS - 1)) * 100}%`
  })
  return `linear-gradient(to right, ${stops.join(', ')})`
})

function dayRangeBarStyle(period: TownForecastPeriod) {
  const range = weekTemperatureRange.value
  if (!range) return {}
  const span = range.max - range.min
  const leftPct = ((period.minTemperature - range.min) / span) * 100
  const widthPct = Math.max(((period.maxTemperature - period.minTemperature) / span) * 100, 4)
  return {
    left: `${leftPct}%`,
    width: `${widthPct}%`,
    backgroundImage: weekGradient.value,
    backgroundSize: `${(100 / widthPct) * 100}% 100%`,
    backgroundPositionX: `${-(leftPct / widthPct) * 100}%`
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- 警特報條：只有真的有作用中特報才顯示。特報是安全性資訊，故意不用跑馬燈——
         使用者不該被迫等內容轉過來才看得到，數量一多就摺疊、連到完整的 /warnings 頁 -->
    <div v-if="activeWarnings.length > 0" class="space-y-1.5 rounded-lg bg-surface-1 p-3">
      <NuxtLink
        v-for="w in visibleWarnings"
        :key="w.county"
        to="/warnings"
        class="flex flex-wrap items-center gap-2 rounded-md px-2 py-1 text-sm hover:bg-surface-2"
      >
        <span class="font-medium text-text-primary">{{ w.county }}</span>
        <span v-for="h in w.hazards" :key="h.phenomena" class="rounded px-1.5 py-0.5 text-xs" :class="severityClass(h.phenomena)">
          {{ h.phenomena }}{{ h.significance }}
        </span>
      </NuxtLink>
      <NuxtLink
        v-if="hiddenWarningsCount > 0"
        to="/warnings"
        class="block rounded-md px-2 py-1 text-sm text-text-secondary hover:bg-surface-2 hover:text-text-primary"
      >
        還有 {{ hiddenWarningsCount }} 個縣市有特報 →
      </NuxtLink>
    </div>

    <!-- 停班停課 / 颱風 / 地震快訊：只有真的有事件才顯示 -->
    <div
      v-if="suspendedCounties.length > 0 || (typhoons?.length ?? 0) > 0 || (earthquakes?.length ?? 0) > 0"
      class="grid gap-3 sm:grid-cols-2"
    >
      <NuxtLink
        v-if="suspendedCounties.length > 0"
        to="/warnings"
        class="rounded-lg p-4"
        :class="hasFullSuspension ? 'bg-severity-warning/10 hover:bg-severity-warning/15' : 'bg-severity-watch/10 hover:bg-severity-watch/15'"
      >
        <p class="text-sm font-medium" :class="hasFullSuspension ? 'text-severity-warning' : 'text-severity-watch'">
          停班停課
        </p>
        <p class="mt-1 text-text-primary">{{ suspendedCounties.map((c) => c.county).join('、') }}</p>
      </NuxtLink>
      <NuxtLink
        v-if="(typhoons?.length ?? 0) > 0"
        to="/typhoon"
        class="rounded-lg bg-severity-watch/10 p-4 hover:bg-severity-watch/15"
      >
        <p class="text-sm font-medium text-severity-watch">
          {{ typhoons!.every((t) => t.classification === 'tropical-depression') ? '熱帶性低氣壓動態' : '颱風動態' }}
        </p>
        <p class="mt-1 text-text-primary">{{ typhoons!.map((t) => t.nameZh || t.name).join('、') }}</p>
      </NuxtLink>
      <NuxtLink v-if="(earthquakes?.length ?? 0) > 0" to="/earthquake" class="rounded-lg bg-surface-1 p-4 hover:bg-surface-2">
        <p class="text-sm font-medium text-text-secondary">最新地震</p>
        <p class="mt-1 text-text-primary">
          {{ earthquakes![0]!.epicenterDescription }} · 規模 {{ earthquakes![0]!.magnitude }} · 最大震度
          {{ earthquakes![0]!.maxIntensity }}
        </p>
      </NuxtLink>
    </div>

    <!-- selectedCounty/selectedTown 是 localStorage 驅動的 ref，使用者透過 LocationPicker
         換地區時這裡會原地重新 fetch（元件沒有重新掛載，直接吃這個 status 的變化），
         跟首次進站時被 Suspense 整個遮住的情況不同，這個 pending 分支使用者看得到 -->
    <div v-if="forecastStatus === 'pending'" class="rounded-lg bg-surface-1 p-8 text-center text-text-secondary">
      載入天氣資料中…
    </div>
    <div v-else-if="!forecast" class="rounded-lg bg-surface-1 p-8 text-center text-text-secondary">
      無法載入天氣預報，請稍後再試。
    </div>

    <template v-else>
      <!-- Hero：現況 -->
      <section v-if="current" class="flex flex-wrap items-center gap-4 rounded-lg bg-surface-1 p-6">
        <WeatherIcon :code="current.weatherCode" class="h-16 w-16 text-accent" />
        <div>
          <div ref="pickerRoot" class="relative inline-block">
            <button
              type="button"
              class="flex items-center gap-1 rounded-md px-1 -mx-1 text-sm text-text-muted hover:bg-surface-2 hover:text-text-primary"
              aria-label="選擇地區"
              :aria-expanded="pickerOpen"
              @click="pickerOpen = !pickerOpen"
            >
              {{ selectedCounty }}{{ selectedTown }}
              <svg viewBox="0 0 24 24" class="h-3.5 w-3.5" fill="none" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="m6 9 6 6 6-6" />
              </svg>
            </button>
            <div v-if="pickerOpen" class="absolute left-0 top-full z-30 mt-1">
              <LocationPicker @select="onLocationSelect" @close="pickerOpen = false" />
            </div>
          </div>
          <p class="tabular-nums text-4xl font-semibold text-text-primary">{{ current.temperature }}°</p>
          <p class="text-sm text-text-secondary">體感 {{ current.apparentTemperature }}° · {{ current.weather }}</p>
        </div>

        <div class="flex flex-wrap gap-x-5 gap-y-1 text-xs text-text-secondary">
          <span><span class="text-text-muted">降雨機率</span> <span class="tabular-nums">{{ current.pop ?? '—' }}%</span></span>
          <span><span class="text-text-muted">風速</span> <span class="tabular-nums">{{ current.windSpeed }} m/s</span></span>
          <span><span class="text-text-muted">風向</span> {{ current.windDirection }}</span>
          <span v-if="forecast?.sunrise"><span class="text-text-muted">日出</span> {{ formatTaipeiTime(forecast.sunrise) }}</span>
          <span v-if="forecast?.sunset"><span class="text-text-muted">日沒</span> {{ formatTaipeiTime(forecast.sunset) }}</span>
          <!-- 抓到之前完全不存在的項目「憑空出現」比不顯示更容易讓人以為壞掉；
               airQualityLoading 同時涵蓋 idle/pending 的理由見上面宣告處 -->
          <span v-if="airQualityLoading" class="flex items-center gap-1 text-text-muted">
            <span>空氣品質</span>
            <span>…</span>
          </span>
          <NuxtLink
            v-else-if="nearestAirQuality"
            :to="{ path: '/air-quality', query: { site: nearestAirQuality.siteName } }"
            class="flex items-center gap-1 hover:text-text-primary"
            :title="`最近測站：${nearestAirQuality.siteName}`"
          >
            <span class="text-text-muted">空氣品質</span>
            <span class="tabular-nums font-medium" :style="{ color: airQualityColor(nearestAirQuality.level) }">
              {{ nearestAirQuality.aqi ?? '—' }}
            </span>
            <span>{{ AIR_QUALITY_LEVEL_LABEL[nearestAirQuality.level] ?? nearestAirQuality.level }}</span>
          </NuxtLink>
          <!-- 抓取失敗（error）維持靜默不顯示，不確定是不是真的沒有鄰近測站，不該亂講 -->
          <span v-else-if="airQualityNoCoverage" class="text-text-muted">空氣品質 鄰近無測站</span>
        </div>

        <NuxtLink
          :to="`/forecast/${selectedCounty}/${selectedTown}`"
          class="ml-auto rounded-md bg-surface-2 px-3 py-1.5 text-sm text-text-secondary hover:text-text-primary"
        >
          完整預報 →
        </NuxtLink>
      </section>

      <div class="grid gap-4 lg:grid-cols-3">
        <!-- 今日 meteogram -->
        <section class="rounded-lg bg-surface-1 p-4 lg:col-span-2">
          <h2 class="mb-2 text-sm font-medium text-text-secondary">今明 24 小時</h2>
          <ChartsBaseChart v-if="compactMeteogram" :option="compactMeteogram" height="260px" />
        </section>

        <!-- 雷達縮圖 -->
        <NuxtLink to="/map" class="group relative overflow-hidden rounded-lg bg-surface-1">
          <div class="absolute inset-0 flex items-center justify-center text-sm text-text-muted">
            <!-- 這張是 CWA 的整合回波原圖：3600×3600、傳輸 384 KB、解碼後 49.4 MB RGBA，
                 但在這裡只是一張約 380px 寬的裝飾縮圖。首頁是全站流量最大的頁面，不能讓它
                 跟主要內容搶頻寬與主執行緒——CWA 沒有提供低解析度版本，Workers 也沒有影像
                 處理能力可以在伺服器端縮圖，所以用瀏覽器原生的三個屬性把它徹底移出關鍵路徑：
                 lazy（捲到附近才抓，行動裝置多半根本不會抓）、async（解碼不卡主執行緒）、
                 low（優先度低於 LCP 內容）。width/height 宣告原始長寬比，讓版面不會位移。 -->
            <img
              v-if="latestRadar"
              :src="latestRadar.imageUrl"
              alt="雷達回波縮圖"
              width="3600"
              height="3600"
              loading="lazy"
              decoding="async"
              fetchpriority="low"
              class="h-full w-full object-cover opacity-70"
            >
            <span v-else>雷達影像載入中…</span>
          </div>
          <div class="relative flex h-full min-h-40 items-end bg-gradient-to-t from-surface-0/90 to-transparent p-4">
            <p class="text-sm font-medium text-text-primary group-hover:text-accent">前往互動地圖 →</p>
          </div>
        </NuxtLink>
      </div>

      <!-- 7 日預報條 -->
      <section v-if="weekAhead.length > 0" class="space-y-2">
        <h2 class="text-sm font-medium text-text-secondary">未來 7 天</h2>
        <div class="grid grid-cols-2 gap-2 sm:grid-cols-4 md:grid-cols-7">
          <div
            v-for="period in weekAhead"
            :key="period.startTime"
            class="flex flex-col items-center gap-1 rounded-lg bg-surface-1 p-3 text-center"
          >
            <p class="text-xs text-text-muted">
              {{ formatTaipeiMonthDay(period.startTime) }}
            </p>
            <WeatherIcon :code="period.weatherCode" class="h-7 w-7 text-accent" />
            <p class="tabular-nums text-sm text-text-primary">{{ period.maxTemperature }}° / {{ period.minTemperature }}°</p>
            <div class="relative h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
              <div class="absolute inset-y-0 rounded-full" :style="dayRangeBarStyle(period)" />
            </div>
          </div>
        </div>
      </section>
    </template>
  </div>
</template>

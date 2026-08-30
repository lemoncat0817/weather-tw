/**
 * ECharts 的唯一載入點，跟 `app/utils/maplibre.ts` 同一個理由與同一套手法：
 * 這包 gzip 後約 207 KB，而且只在瀏覽器有意義（需要 Canvas）。
 *
 * 原本放在 `app/plugins/echarts.client.ts`，但 Nuxt 的 plugin 一律會被打進所有路由共用的
 * entry chunk，導致 `/warnings`、`/map` 這種完全沒有圖表的頁面也得下載整包（實測 entry
 * chunk 1.65 MB / 480 KB gzip，maplibre 與 echarts 兩包都在裡面）。而且那個 plugin 只是
 * `provide: { $echarts }`，全專案沒有任何地方用到 `$echarts`，等於是純粹的死重量。
 *
 * 改成由 `BaseChart.vue` 透過 `@/utils/echarts` 的 loadECharts() 動態載入：
 * - 沒有圖表的頁面 0 KB；有圖表的頁面也是 hydration 之後才載入，不擋首次繪製。
 * - 完全不進 SSR／Cloudflare Worker 的模組圖（載入器有編譯期守衛，見 echarts.ts）。
 * - 模組快取保證整個 app 只註冊一次，多張圖表不會重複執行 `echarts.use()`。
 *
 * 這個檔案本身只負責「註冊」，不要直接 import 它——一律走 `@/utils/echarts`，
 * 否則守衛就被繞過了。
 */
import * as echarts from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart, BarChart, ScatterChart, CustomChart } from 'echarts/charts'
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  DataZoomComponent,
  MarkLineComponent,
  MarkAreaComponent,
  MarkPointComponent
} from 'echarts/components'

// 只註冊實際會用到的模組，讓 tree-shaking 有效
echarts.use([
  CanvasRenderer,
  LineChart,
  BarChart,
  ScatterChart,
  CustomChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  DataZoomComponent,
  MarkLineComponent,
  MarkAreaComponent,
  MarkPointComponent
])

// 深色主題，數值直接對齊 app/assets/css/main.css 的 design token（兩邊手動保持一致，
// ECharts 主題系統不支援讀取 CSS 變數）
echarts.registerTheme('app-dark', {
  backgroundColor: 'transparent',
  textStyle: { color: '#94a3b8', fontFamily: 'Inter, "Noto Sans TC", sans-serif' },
  title: { textStyle: { color: '#e2e8f0' } },
  line: { lineStyle: { width: 2 }, symbol: 'none' },
  categoryAxis: {
    axisLine: { lineStyle: { color: '#253352' } },
    axisTick: { lineStyle: { color: '#253352' } },
    axisLabel: { color: '#94a3b8' },
    splitLine: { lineStyle: { color: '#1b2740' } }
  },
  valueAxis: {
    axisLine: { lineStyle: { color: '#253352' } },
    axisTick: { lineStyle: { color: '#253352' } },
    axisLabel: { color: '#94a3b8' },
    splitLine: { lineStyle: { color: '#1b2740' } }
  },
  legend: { textStyle: { color: '#94a3b8' } },
  tooltip: {
    backgroundColor: '#121b2e',
    borderColor: '#253352',
    textStyle: { color: '#e2e8f0' }
  }
})

export { echarts }

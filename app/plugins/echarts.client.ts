// ECharts 是重量級套件，只註冊實際會用到的模組（tree-shaking），且只在 client 端載入
// （檔名 .client.ts 是 Nuxt 慣例，SSR 階段不會執行——ECharts 需要 Canvas，伺服器端本來就跑不動）
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

export default defineNuxtPlugin(() => {
  return {
    provide: { echarts }
  }
})

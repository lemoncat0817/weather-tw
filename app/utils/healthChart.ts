import type { EChartsOption } from 'echarts'
import type { HeatInjuryReading } from '#shared/types'
import { CATEGORICAL, heatInjuryColor } from './colorScales'
import { formatTaipei } from './formatDate'

/** 對應 shared/types 的 HeatInjuryLevel，供 tooltip 顯示中文 */
export const HEAT_INJURY_LEVEL_LABEL: Record<string, string> = {
  none: '無',
  caution: '注意',
  watch: '警戒',
  danger: '危險',
  'high-danger': '高危險'
}

/**
 * 單一鄉鎮 5 天逐 3 小時熱傷害指數折線。單一序列不需要圖例（標題已指名這是熱傷害指數），
 * 但每個資料點仍依官方等級（level）上色——這是「狀態」而非「分類」，數值本身的高低趨勢
 * 由線條表達，點的顏色額外標出「這個時間點是第幾級警示」，跟頁面下方的圖例、tooltip 文字
 * 三者合起來，等級判讀不會只靠顏色（heatInjuryColor 對應的四級官方門檻由 CWA 自行判定，
 * 這裡不重算，只是把已分類好的等級上色）。
 */
export function buildHeatInjuryOption(readings: HeatInjuryReading[]): EChartsOption {
  const labels = readings.map((r) => formatTaipei(r.time).slice(5)) // 去掉年份，留「M/D HH:mm」
  const lineColor = CATEGORICAL[0]!

  return {
    animation: false,
    grid: { left: 40, right: 16, top: 16, bottom: 40 },
    xAxis: {
      type: 'category',
      data: labels,
      boundaryGap: false,
      axisLabel: { interval: Math.max(0, Math.ceil(labels.length / 10) - 1) }
    },
    yAxis: { type: 'value', name: '指數' },
    series: [
      {
        name: '熱傷害指數',
        type: 'line',
        data: readings.map((r) => ({ value: r.index, itemStyle: { color: heatInjuryColor(r.level) } })),
        symbol: 'circle',
        symbolSize: 8,
        lineStyle: { color: lineColor, width: 2 }
      }
    ],
    legend: { show: false },
    tooltip: {
      formatter: (params) => {
        const arr = Array.isArray(params) ? params : [params]
        const idx = arr[0]?.dataIndex ?? 0
        const r = readings[idx]
        if (!r) return ''
        return `${formatTaipei(r.time)}<br/>指數 ${r.index} · ${HEAT_INJURY_LEVEL_LABEL[r.level] ?? r.level}`
      }
    }
  }
}

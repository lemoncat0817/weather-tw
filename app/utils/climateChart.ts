import type { EChartsOption, SeriesOption } from 'echarts'
import type { ClimateDailyRainfall, ClimateHourlyReading, ClimateMonthNormal, ClimateMonthPrecipitationNormal } from '#shared/types'
import { CATEGORICAL } from './colorScales'
import { formatTaipei } from './formatDate'

// CATEGORICAL 是固定 8 色的常數陣列，這兩個索引必定存在；bandSeries() 的 color 參數
// 特意標成 string（不是 string | undefined），這裡用 ! 對應那個嚴格簽章
const NORMAL_COLOR = CATEGORICAL[0]!
const ACTUAL_COLOR = CATEGORICAL[7]!

/**
 * 「範圍帶」畫法：用兩個 stack 在一起的 line series 疊出 min~max 的填色帶——
 * 第一個 series（下界）本身透明、只負責把堆疊基準墊到 min；第二個 series 的值是 max-min（差值），
 * 才是實際畫出填色的那一層，視覺上看起來就是一條由 min 到 max 的帶狀區域。這是 ECharts 沒有
 * 原生「範圍帶」系列類型時的標準組合寫法。
 */
function bandSeries(mins: number[], maxs: number[], color: string, xAxisIndex = 0, yAxisIndex = 0): SeriesOption[] {
  return [
    {
      name: '常態下界',
      type: 'line',
      data: mins,
      stack: 'normal-band',
      symbol: 'none',
      lineStyle: { opacity: 0 },
      xAxisIndex,
      yAxisIndex,
      silent: true
    },
    {
      name: '常態範圍',
      type: 'line',
      data: maxs.map((max, i) => Math.max(0, max - mins[i]!)),
      stack: 'normal-band',
      symbol: 'none',
      lineStyle: { opacity: 0 },
      areaStyle: { color, opacity: 0.14 },
      xAxisIndex,
      yAxisIndex,
      tooltip: { show: false }
    }
  ]
}

/** 全年氣候常態：12 個月的平均溫＋常態範圍帶，當月用實心點標出來 */
export function buildAnnualNormalOption(normals: ClimateMonthNormal[], currentMonth: number): EChartsOption {
  const sorted = [...normals].sort((a, b) => a.month - b.month)
  const labels = sorted.map((m) => `${m.month}月`)
  const means = sorted.map((m) => m.meanTemperature)
  const mins = sorted.map((m) => m.minTemperature)
  const maxs = sorted.map((m) => m.maxTemperature)
  const currentIndex = sorted.findIndex((m) => m.month === currentMonth)

  const series: SeriesOption[] = [
    ...bandSeries(mins, maxs, NORMAL_COLOR),
    {
      name: '常態平均溫',
      type: 'line',
      data: means,
      symbol: (_v, params) => (params.dataIndex === currentIndex ? 'circle' : 'none'),
      symbolSize: 9,
      lineStyle: { color: NORMAL_COLOR, width: 2 },
      itemStyle: { color: ACTUAL_COLOR }
    }
  ]

  return {
    animation: false,
    grid: { left: 48, right: 16, top: 16, bottom: 28 },
    xAxis: { type: 'category', data: labels, boundaryGap: false },
    yAxis: { type: 'value', name: '°C', axisLabel: { formatter: '{value}°' } },
    series,
    legend: { show: false },
    tooltip: {
      formatter: (params) => {
        const arr = Array.isArray(params) ? params : [params]
        const idx = arr[0]?.dataIndex ?? 0
        const m = sorted[idx]!
        return `${m.month} 月常態：平均 ${m.meanTemperature}° · 範圍 ${m.minTemperature}°–${m.maxTemperature}°`
      }
    }
  }
}

/** 近期逐時觀測 vs 當月氣候常態範圍帶 */
export function buildRecentVsNormalOption(hourly: ClimateHourlyReading[], normal: ClimateMonthNormal): EChartsOption {
  const labels = hourly.map((h) => formatTaipei(h.time).slice(-5))
  const mins = hourly.map(() => normal.minTemperature)
  const maxs = hourly.map(() => normal.maxTemperature)

  const series: SeriesOption[] = [
    ...bandSeries(mins, maxs, NORMAL_COLOR),
    {
      name: '常態平均溫',
      type: 'line',
      data: hourly.map(() => normal.meanTemperature),
      symbol: 'none',
      lineStyle: { color: NORMAL_COLOR, width: 1.5, type: 'dashed' }
    },
    {
      name: '實測溫度',
      type: 'line',
      data: hourly.map((h) => h.temperature),
      symbol: 'none',
      smooth: true,
      lineStyle: { color: ACTUAL_COLOR, width: 2 }
    }
  ]

  return {
    animation: false,
    grid: { left: 48, right: 16, top: 16, bottom: 28 },
    xAxis: { type: 'category', data: labels, boundaryGap: false, axisLabel: { interval: Math.ceil(labels.length / 8) } },
    yAxis: { type: 'value', name: '°C', axisLabel: { formatter: '{value}°' } },
    series,
    legend: { show: false }
  }
}

/**
 * 今年至今累積雨量 vs 氣候平均累積。氣候常態只有「月」解析度，這裡用「該月已過天數 ÷
 * 該月總天數」按比例分攤到每一天再累加——是標準的月轉日分攤估算，不是幫 CWA 生出一條假的
 * 逐日常態曲線（CWA 從未發布逐日雨量常態，這裡也沒有假裝它有）。
 */
export function buildCumulativeRainfallOption(daily: ClimateDailyRainfall[], normals: ClimateMonthPrecipitationNormal[]): EChartsOption {
  const byMonth = new Map(normals.map((n) => [n.month, n.accumulationMm]))

  const labels: string[] = []
  const actual: number[] = []
  const normalCumulative: number[] = []
  let actualSum = 0
  let normalSum = 0

  for (const d of daily) {
    // "YYYY-MM-DD" 純日期字串（無時間、無時區），用 UTC getter 讀年月日部分才不會被
    // 執行環境時區拉到前一天或後一天
    const date = new Date(d.date)
    const year = date.getUTCFullYear()
    const month = date.getUTCMonth() + 1
    const day = date.getUTCDate()
    const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate()

    actualSum += d.precipitationMm
    normalSum += (byMonth.get(month) ?? 0) / daysInMonth

    labels.push(`${month}/${day}`)
    actual.push(Math.round(actualSum * 10) / 10)
    normalCumulative.push(Math.round(normalSum * 10) / 10)
  }

  const series: SeriesOption[] = [
    {
      name: '氣候平均累積',
      type: 'line',
      data: normalCumulative,
      symbol: 'none',
      lineStyle: { color: NORMAL_COLOR, width: 1.5, type: 'dashed' }
    },
    {
      name: '今年累積雨量',
      type: 'line',
      data: actual,
      symbol: 'none',
      lineStyle: { color: ACTUAL_COLOR, width: 2 },
      areaStyle: { color: ACTUAL_COLOR, opacity: 0.12 }
    }
  ]

  return {
    animation: false,
    grid: { left: 48, right: 16, top: 16, bottom: 28 },
    xAxis: { type: 'category', data: labels, boundaryGap: false, axisLabel: { interval: Math.ceil(labels.length / 10) } },
    yAxis: { type: 'value', name: 'mm' },
    series,
    legend: { show: false },
    tooltip: {
      formatter: (params) => {
        const arr = Array.isArray(params) ? params : [params]
        const idx = arr[0]?.dataIndex ?? 0
        return `${labels[idx]}<br/>今年累積 ${actual[idx]} mm<br/>氣候平均累積 ${normalCumulative[idx]} mm`
      }
    }
  }
}

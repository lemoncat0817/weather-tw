import type { EChartsOption, SeriesOption, CustomSeriesRenderItemParams, CustomSeriesRenderItemAPI } from 'echarts'
import type { TownForecastHour } from '#shared/types'
import { CATEGORICAL, precipitationColor } from './colorScales'
import { windBarbGlyph } from './windBarb'
import { formatTaipeiTime } from './formatDate'

const WIND_COLOR = CATEGORICAL[2] // aqua，跟溫度（blue）、降水（blue 序列）區隔開，給風一個獨立識別色
const TEMP_COLOR = CATEGORICAL[0]

function windBarbRenderItem(_params: CustomSeriesRenderItemParams, api: CustomSeriesRenderItemAPI) {
  const speed = api.value(1) as number
  const direction = (api.value(2) as string) || null
  const [x, y] = api.coord([api.value(0) as number, 0])
  const glyph = windBarbGlyph(speed, direction)

  return {
    type: 'group' as const,
    x,
    y,
    rotation: (glyph.rotationDeg * Math.PI) / 180,
    children: [
      {
        type: 'path' as const,
        shape: { pathData: glyph.path },
        style: { stroke: WIND_COLOR, fill: WIND_COLOR, lineWidth: 1.5 }
      }
    ]
  }
}

/**
 * 依小時陣列算出連續的晚上區段（用陣列索引表示，直接對應 category 軸的 label），供 markArea
 * 畫晝夜底紋。用實際日出日沒時刻（HH:MM 字串比較，逐時預報最多橫跨 3 天，時刻本身一天只飄移
 * 一兩分鐘，同一組時刻套用到全部日期已經足夠準——不像固定 6:00-18:00 這種一年到頭都套用同一組，
 * 冬夏天實際日出日沒時刻在台灣可以差到一個多小時。sunrise/sunset 缺席時退回這組概略預設值。
 *
 * 用 formatTaipeiTime 而不是 new Date().getHours()：後者是「執行環境的本地時區」，這個函式
 * 在 SSR 也會被呼叫（.vue 頁面的 computed 在伺服器端就會求值一次，不是只在瀏覽器端執行），
 * Nitro 若跑在 UTC 容器裡，getHours() 算出的畫夜分界會整批位移 8 小時。
 */
function nightSegmentsByIndex(times: string[], sunriseHHMM: string, sunsetHHMM: string): Array<[number, number]> {
  const isNight = (iso: string) => {
    const hm = formatTaipeiTime(iso)
    return hm < sunriseHHMM || hm >= sunsetHHMM
  }

  const segments: Array<[number, number]> = []
  let segStart = 0
  let segIsNight = times[0] ? isNight(times[0]) : false

  for (let i = 1; i < times.length; i++) {
    const night = isNight(times[i]!)
    if (night !== segIsNight) {
      if (segIsNight) segments.push([segStart, i - 1])
      segStart = i
      segIsNight = night
    }
  }
  if (segIsNight) segments.push([segStart, times.length - 1])
  return segments
}

export interface MeteogramOptions {
  /** 精簡模式（首頁用）：只留溫度＋降水兩個 grid，不畫風標／濕度，圖也矮一些 */
  compact?: boolean
  /** 當天日出／日沒時刻（ISO，含時區），用來畫夜間陰影帶；缺席時退回 06:00-18:00 概略預設值 */
  sunrise?: string
  sunset?: string
}

/**
 * 由鄉鎮逐時預報組出完整 meteogram 的 ECharts option。
 * 三～四個各自獨立座標系的 grid 疊在同一個共用時間軸上（風標／溫度／降水／濕度），
 * 不是單一圖表掛雙 y 軸——dataviz skill 明確禁止 dual-axis，這裡改用小型多重圖的堆疊寫法。
 */
export function buildMeteogramOption(hours: TownForecastHour[], options: MeteogramOptions = {}): EChartsOption {
  const times = hours.map((h) => h.time)
  // formatTaipeiTime，不是 new Date(t).getHours()：後者是執行環境本地時區，這個 option 建構式
  // 在 SSR 也會求值一次，Nitro 若跑在 UTC 容器裡，軸上的時刻標籤會整批位移 8 小時
  const labels = times.map((t) => formatTaipeiTime(t))
  const compact = options.compact ?? false

  const grids: EChartsOption['grid'] = compact
    ? [
        { left: 48, right: 16, top: 10, height: '58%' },
        { left: 48, right: 16, top: '72%', height: '20%' }
      ]
    : [
        { left: 48, right: 16, top: 8, height: '10%' },
        { left: 48, right: 16, top: '24%', height: '38%' },
        { left: 48, right: 16, top: '68%', height: '16%' },
        { left: 48, right: 16, top: '90%', height: '10%' }
      ]

  const tempGridIndex = compact ? 0 : 1
  const popGridIndex = compact ? 1 : 2
  const humidityGridIndex = 3
  const gridCount = grids.length

  const xAxis: EChartsOption['xAxis'] = grids.map((_, i) => ({
    type: 'category',
    data: labels,
    gridIndex: i,
    axisLine: { show: i === gridCount - 1 },
    axisTick: { show: i === gridCount - 1 },
    axisLabel: { show: i === gridCount - 1, interval: Math.ceil(labels.length / 12) },
    splitLine: { show: false },
    boundaryGap: false
  }))

  const yAxis: EChartsOption['yAxis'] = grids.map((_, i) => {
    if (!compact && i === 0) {
      // 風標列：不需要真正的數值刻度，固定範圍讓風標有地方畫
      return { type: 'value', gridIndex: i, show: false, min: -1, max: 1 }
    }
    if (i === tempGridIndex) {
      return { type: 'value', gridIndex: i, name: '°C', axisLabel: { formatter: '{value}°' } }
    }
    // 降雨機率 / 濕度都是 0-100%
    return { type: 'value', gridIndex: i, name: '%', min: 0, max: 100, splitNumber: 2 }
  })

  // 晚上時段的底紋，畫在溫度那個 grid 上
  const sunriseHHMM = options.sunrise ? formatTaipeiTime(options.sunrise) : '06:00'
  const sunsetHHMM = options.sunset ? formatTaipeiTime(options.sunset) : '18:00'
  const nightMarkArea: NonNullable<SeriesOption['markArea']> = {
    silent: true,
    itemStyle: { color: 'rgba(148, 163, 184, 0.06)' },
    data: nightSegmentsByIndex(times, sunriseHHMM, sunsetHHMM).map(
      ([startIdx, endIdx]) => [{ xAxis: labels[startIdx] }, { xAxis: labels[endIdx] }] as const
    )
  }

  const series: SeriesOption[] = [
    {
      type: 'line',
      name: '溫度',
      xAxisIndex: tempGridIndex,
      yAxisIndex: tempGridIndex,
      data: hours.map((h) => h.temperature),
      smooth: true,
      symbol: 'none',
      lineStyle: { color: TEMP_COLOR, width: 2 },
      areaStyle: { color: TEMP_COLOR, opacity: 0.1 },
      markArea: nightMarkArea
    },
    {
      type: 'line',
      name: '體感溫度',
      xAxisIndex: tempGridIndex,
      yAxisIndex: tempGridIndex,
      data: hours.map((h) => h.apparentTemperature),
      smooth: true,
      symbol: 'none',
      lineStyle: { color: TEMP_COLOR, width: 1.5, type: 'dashed', opacity: 0.6 }
    },
    {
      type: 'bar',
      name: '降雨機率',
      xAxisIndex: popGridIndex,
      yAxisIndex: popGridIndex,
      data: hours.map((h) => ({
        value: h.pop ?? 0,
        itemStyle: { color: precipitationColor((h.pop ?? 0) / 100) }
      })),
      barWidth: '60%'
    }
  ]

  if (!compact) {
    series.push({
      type: 'custom',
      name: '風',
      xAxisIndex: 0,
      yAxisIndex: 0,
      renderItem: windBarbRenderItem,
      data: hours.map((h, i) => [i, h.windSpeed, h.windDirection]),
      encode: { x: 0, y: 1 }
    })

    series.push({
      type: 'line',
      name: '相對濕度',
      xAxisIndex: humidityGridIndex,
      yAxisIndex: humidityGridIndex,
      data: hours.map((h) => h.relativeHumidity),
      smooth: true,
      symbol: 'none',
      lineStyle: { color: CATEGORICAL[6], width: 1.5 }
    })
  }

  return {
    animation: false,
    grid: grids,
    xAxis,
    yAxis,
    series,
    legend: { show: false }
  }
}

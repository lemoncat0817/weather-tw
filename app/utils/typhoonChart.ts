import type { EChartsOption, SeriesOption } from 'echarts'
import type { Typhoon, TyphoonFixPoint } from '#shared/types'
import { CATEGORICAL } from './colorScales'

const PRESSURE_COLOR = CATEGORICAL[0]
const WIND_COLOR = CATEGORICAL[7]

/**
 * 颱風強度時序：氣壓／風速是不同量尺的兩個量，遵照 dataviz skill 的「一律單軸」規定，
 * 用兩個各自獨立座標系的 grid 上下堆疊、共用同一條時間軸，不用雙 y 軸。
 * 歷史觀測（track）與未來預報（forecast）合併成一條連續時間軸，中間畫一條 markLine 標示「現在」。
 */
export function buildTyphoonIntensityOption(typhoon: Typhoon): EChartsOption {
  const track = typhoon.track
  const forecast = typhoon.forecast
  const points: TyphoonFixPoint[] = [...track, ...forecast]
  const labels = points.map((p) =>
    new Date(p.time).toLocaleString('zh-TW', {
      timeZone: 'Asia/Taipei',
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      hour12: false
    })
  )
  const nowIndex = track.length > 0 ? track.length - 1 : 0

  const grids: EChartsOption['grid'] = [
    { left: 56, right: 16, top: 16, height: '38%' },
    { left: 56, right: 16, top: '58%', height: '34%' }
  ]

  const xAxis: EChartsOption['xAxis'] = grids.map((_, i) => ({
    type: 'category',
    data: labels,
    gridIndex: i,
    axisLine: { show: i === 1 },
    axisTick: { show: i === 1 },
    axisLabel: { show: i === 1, interval: Math.ceil(labels.length / 10) },
    splitLine: { show: false },
    boundaryGap: false
  }))

  const yAxis: EChartsOption['yAxis'] = [
    { type: 'value', gridIndex: 0, name: 'hPa', inverse: true },
    { type: 'value', gridIndex: 1, name: 'm/s', min: 0 }
  ]

  const nowMarkLine: NonNullable<SeriesOption['markLine']> = {
    silent: true,
    symbol: 'none',
    lineStyle: { color: '#94a3b8', type: 'dashed' },
    label: { formatter: '現在', color: '#94a3b8' },
    data: [{ xAxis: labels[nowIndex] }]
  }

  const series: SeriesOption[] = [
    {
      type: 'line',
      name: '中心氣壓',
      xAxisIndex: 0,
      yAxisIndex: 0,
      data: points.map((p) => p.pressure),
      symbol: 'none',
      smooth: true,
      lineStyle: { color: PRESSURE_COLOR, width: 2 },
      markLine: nowMarkLine
    },
    {
      type: 'line',
      name: '最大風速',
      xAxisIndex: 1,
      yAxisIndex: 1,
      data: points.map((p) => p.maxWindSpeed),
      symbol: 'none',
      smooth: true,
      areaStyle: { color: WIND_COLOR, opacity: 0.12 },
      lineStyle: { color: WIND_COLOR, width: 2 }
    }
  ]

  return { animation: false, grid: grids, xAxis, yAxis, series, legend: { show: false } }
}

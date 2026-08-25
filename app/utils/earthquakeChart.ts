import type { EChartsOption } from 'echarts'
import type { EarthquakeShakingArea } from '#shared/types'
import { seismicIntensityColor } from './colorScales'

const INTENSITY_ORDER = ['7級', '6強', '6弱', '5強', '5弱', '4級', '3級', '2級', '1級', '0級'] as const

/** 各縣市震度：橫向長條，依震度嚴重程度排序、用地震震度色階上色（顏色跟著實體走，不是分類色相） */
export function buildIntensityBarOption(areas: EarthquakeShakingArea[]): EChartsOption {
  const sorted = [...areas].sort(
    (a, b) => INTENSITY_ORDER.indexOf(a.intensity as (typeof INTENSITY_ORDER)[number]) - INTENSITY_ORDER.indexOf(b.intensity as (typeof INTENSITY_ORDER)[number])
  )
  const counties = sorted.map((a) => a.county)
  const values = sorted.map((a) => INTENSITY_ORDER.length - INTENSITY_ORDER.indexOf(a.intensity as (typeof INTENSITY_ORDER)[number]))

  return {
    animation: false,
    grid: { left: 72, right: 24, top: 8, bottom: 8 },
    xAxis: { type: 'value', show: false },
    yAxis: { type: 'category', data: counties, inverse: true, axisLine: { show: false }, axisTick: { show: false } },
    series: [
      {
        type: 'bar',
        barWidth: '65%',
        data: sorted.map((a, i) => ({ value: values[i], itemStyle: { color: seismicIntensityColor(a.intensity) } })),
        label: { show: true, position: 'right', formatter: (p) => sorted[p.dataIndex]!.intensity, color: '#e2e8f0' }
      }
    ],
    tooltip: {
      trigger: 'item',
      formatter: (p) => {
        const idx = (p as { dataIndex: number }).dataIndex
        const a = sorted[idx]!
        return `${a.county}：${a.intensity}`
      }
    }
  }
}

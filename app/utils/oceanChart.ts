import type { EChartsOption } from 'echarts'
import type { OceanReading, TideEvent } from '#shared/types'
import { CATEGORICAL } from './colorScales'
import { formatTaipei } from './formatDate'

/** 浪高時序（48 小時浮標觀測）。只取有實際浪高值的點——浮標故障或非浪高浮標時整段是 null，
 *  硬畫出來只會是一條貼底的假曲線 */
export function buildWaveHeightOption(readings: OceanReading[]): EChartsOption {
  const withWave = readings.filter((r) => r.waveHeight !== null)
  const labels = withWave.map((r) => formatTaipei(r.time).slice(5))
  return {
    animation: false,
    grid: { left: 40, right: 16, top: 16, bottom: 40 },
    xAxis: {
      type: 'category',
      data: labels,
      boundaryGap: false,
      axisLabel: { interval: Math.max(0, Math.ceil(labels.length / 8) - 1) }
    },
    yAxis: { type: 'value', name: 'm' },
    series: [
      {
        name: '浪高',
        type: 'line',
        data: withWave.map((r) => r.waveHeight),
        symbol: 'none',
        smooth: true,
        lineStyle: { color: CATEGORICAL[0], width: 2 },
        areaStyle: { color: CATEGORICAL[0], opacity: 0.12 }
      }
    ],
    legend: { show: false }
  }
}

/** 海溫時序，跟浪高分開畫——量綱不同，不用雙 y 軸擠在同一張圖 */
export function buildSeaTemperatureOption(readings: OceanReading[]): EChartsOption {
  const withTemp = readings.filter((r) => r.seaTemperature !== null)
  const labels = withTemp.map((r) => formatTaipei(r.time).slice(5))
  return {
    animation: false,
    grid: { left: 40, right: 16, top: 16, bottom: 40 },
    xAxis: {
      type: 'category',
      data: labels,
      boundaryGap: false,
      axisLabel: { interval: Math.max(0, Math.ceil(labels.length / 8) - 1) }
    },
    yAxis: { type: 'value', name: '°C' },
    series: [
      {
        name: '海溫',
        type: 'line',
        data: withTemp.map((r) => r.seaTemperature),
        symbol: 'none',
        smooth: true,
        lineStyle: { color: CATEGORICAL[7], width: 2 }
      }
    ],
    legend: { show: false }
  }
}

/**
 * 潮汐預報：CWA 只給滿潮/乾潮這些離散極值時刻，不是連續實測曲線。用直線連接相鄰極值點——
 * 這仍然是「連接真實資料點」，跟外插出一條虛構的連續正弦波是兩回事，故意不做那種平滑曲線，
 * 誠實反映資料本身的顆粒度。
 */
export function buildTideOption(events: TideEvent[]): EChartsOption {
  const color = CATEGORICAL[0]!
  return {
    animation: false,
    grid: { left: 40, right: 16, top: 32, bottom: 60 },
    xAxis: {
      type: 'category',
      data: events.map((e) => e.time),
      axisLabel: { formatter: (v: string) => formatTaipei(v).slice(5), rotate: 45 }
    },
    yAxis: { type: 'value', name: 'cm' },
    series: [
      {
        name: '潮高',
        type: 'line',
        data: events.map((e) => e.heightCm),
        symbol: 'circle',
        symbolSize: 8,
        lineStyle: { color, width: 2 },
        label: {
          show: true,
          formatter: (p) => events[p.dataIndex]?.type ?? '',
          position: 'top',
          color: '#94a3b8',
          fontSize: 11
        }
      }
    ],
    legend: { show: false },
    tooltip: {
      formatter: (params) => {
        const arr = Array.isArray(params) ? params : [params]
        const idx = arr[0]?.dataIndex ?? 0
        const e = events[idx]
        if (!e) return ''
        return `${formatTaipei(e.time)}<br/>${e.type} ${e.heightCm} cm`
      }
    }
  }
}

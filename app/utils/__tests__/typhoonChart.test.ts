import { describe, expect, it } from 'vitest'
import { buildTyphoonIntensityOption } from '../typhoonChart'
import type { Typhoon } from '#shared/types'

describe('buildTyphoonIntensityOption', () => {
  const dummyTyphoon: Typhoon = {
    id: '2026-TD28',
    year: 2026,
    name: 'TD28',
    nameZh: '熱帶性低氣壓 TD28',
    classification: 'tropical-depression',
    track: [
      {
        time: '2026-09-15T08:00:00+08:00',
        position: { lat: 13.8, lon: 150 },
        maxWindSpeed: 15,
        maxGustSpeed: 23,
        pressure: 1002,
        movingSpeed: 11,
        movingDirection: 'WNW',
        radius15ms: null,
        radius25ms: null,
        quadrantRadii15ms: null
      }
    ],
    forecast: [
      {
        time: '2026-09-15T14:00:00+08:00',
        position: { lat: 14.3, lon: 149.8 },
        maxWindSpeed: 18,
        maxGustSpeed: 25,
        pressure: 998,
        movingSpeed: 10,
        movingDirection: 'NNW',
        radius15ms: null,
        radius25ms: null,
        quadrantRadii15ms: null,
        forecastHour: 6,
        probabilityRadius70: 50
      }
    ],
    trackLine: { type: 'Feature', geometry: { type: 'LineString', coordinates: [] }, properties: { kind: 'track' } },
    forecastLine: { type: 'Feature', geometry: { type: 'LineString', coordinates: [] }, properties: { kind: 'forecast' } },
    probabilityCone: null
  }

  it('氣壓 yAxis 設定 nameLocation: start、inverse: true、scale: true 避免單位重疊並適應氣壓範圍', () => {
    const option = buildTyphoonIntensityOption(dummyTyphoon)
    const yAxes = option.yAxis as Array<{
      type: string
      gridIndex: number
      name: string
      nameLocation?: string
      inverse?: boolean
      scale?: boolean
      min?: number
    }>
    expect(yAxes).toHaveLength(2)

    // 氣壓軸：反轉座標軸的起點 start 在頂部，避免與下方風速軸頂部的 m/s 撞在一起
    expect(yAxes[0]).toMatchObject({
      type: 'value',
      gridIndex: 0,
      name: 'hPa',
      nameLocation: 'start',
      inverse: true,
      scale: true
    })

    // 風速軸
    expect(yAxes[1]).toMatchObject({
      type: 'value',
      gridIndex: 1,
      name: 'm/s',
      min: 0
    })
  })
})

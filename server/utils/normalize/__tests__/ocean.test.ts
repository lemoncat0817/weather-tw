import { describe, expect, it } from 'vitest'
import { normalizeOceanBuoy, normalizeTideForecast, normalizeTideLocations } from '../ocean'

// 節錄自 O-B0075-001 實際回應（浮標 C6AH2）：注意頂層是大寫 Records，且時間陣列刻意打散
// （13:00 → 隔天 03:00 → 回跳 20:00），這是實測到的真實順序，不是筆誤
const BUOY_RAW = {
  Records: {
    SeaSurfaceObs: {
      Location: [
        {
          Station: { StationID: 'C6AH2' },
          StationObsTimes: {
            StationObsTime: [
              {
                DateTime: '2026-08-26T13:00:00+08:00',
                WeatherElements: {
                  TideHeight: 'None',
                  TideLevel: '-',
                  WaveHeight: 'None',
                  SeaTemperature: 'None',
                  PrimaryAnemometer: { WindSpeed: 'None', WindDirection: 'None' }
                }
              },
              {
                DateTime: '2026-08-27T03:00:00+08:00',
                WeatherElements: {
                  TideHeight: 'None',
                  TideLevel: '-',
                  WaveHeight: '1.8',
                  WaveDirection: '11.0',
                  WavePeriod: '7.1',
                  SeaTemperature: '27.8',
                  PrimaryAnemometer: { WindSpeed: '13.1', WindDirection: '254.0' }
                }
              },
              {
                DateTime: '2026-08-26T20:00:00+08:00',
                WeatherElements: {
                  TideHeight: '0.72',
                  TideLevel: '漲潮',
                  WaveHeight: 'None',
                  SeaTemperature: 'None',
                  PrimaryAnemometer: { WindSpeed: 'None', WindDirection: 'None' }
                }
              }
            ]
          }
        }
      ]
    }
  }
}

describe('normalizeOceanBuoy', () => {
  it('把打散順序的觀測時間重新排序，不照 CWA 原始（非時序）順序回傳', () => {
    const obs = normalizeOceanBuoy(BUOY_RAW as never)
    expect(obs!.readings.map((r) => r.time)).toEqual([
      '2026-08-26T13:00:00+08:00',
      '2026-08-26T20:00:00+08:00',
      '2026-08-27T03:00:00+08:00'
    ])
  })

  it('"None" 字串轉成 null，不是 NaN 或 0', () => {
    const obs = normalizeOceanBuoy(BUOY_RAW as never)
    const noData = obs!.readings.find((r) => r.time === '2026-08-26T13:00:00+08:00')!
    expect(noData.waveHeight).toBeNull()
    expect(noData.seaTemperature).toBeNull()
    expect(noData.windSpeed).toBeNull()
  })

  it('"-" 的 TideLevel 視為無資料（null），有實際潮況文字時原樣保留', () => {
    const obs = normalizeOceanBuoy(BUOY_RAW as never)
    expect(obs!.readings.find((r) => r.time === '2026-08-26T13:00:00+08:00')!.tideLevel).toBeNull()
    expect(obs!.readings.find((r) => r.time === '2026-08-26T20:00:00+08:00')!.tideLevel).toBe('漲潮')
  })

  it('有實際數值的時間點正確讀出浪高/週期/海溫/風速', () => {
    const obs = normalizeOceanBuoy(BUOY_RAW as never)
    const full = obs!.readings.find((r) => r.time === '2026-08-27T03:00:00+08:00')!
    expect(full).toMatchObject({ waveHeight: 1.8, wavePeriod: 7.1, seaTemperature: 27.8, windSpeed: 13.1 })
  })

  it('找不到測站（Location 為空）回傳 null', () => {
    expect(normalizeOceanBuoy({ Records: { SeaSurfaceObs: { Location: [] } } } as never)).toBeNull()
  })
})

// 節錄自 F-A0021-001 實際回應（花蓮縣吉安鄉）
const TIDE_RAW = {
  records: {
    TideForecasts: [
      {
        Location: {
          LocationId: '10015050',
          LocationName: '花蓮縣吉安鄉',
          Latitude: 23.9424,
          Longitude: 121.6125,
          TimePeriods: {
            Daily: [
              {
                Date: '2026-09-02',
                LunarDate: '2026-07-21',
                TideRange: '中',
                Time: [
                  { DateTime: '2026-09-02T02:57:00+08:00', Tide: '乾潮', TideHeights: { AboveTWVD: '-37', AboveLocalMSL: -26, AboveChartDatum: 86 } },
                  { DateTime: '2026-09-02T09:15:00+08:00', Tide: '滿潮', TideHeights: { AboveTWVD: '70', AboveLocalMSL: 80, AboveChartDatum: 192 } }
                ]
              }
            ]
          }
        }
      }
    ]
  }
}

// 節錄自實測發現的真實情況：F-A0021-001 的 Daily 陣列順序打散（32 天的陣列會跳來跳去，
// 不是依日期遞增），跟 M-A0085-001／O-B0075-001 是同一套底層系統、同一個陷阱
const SHUFFLED_DAYS_RAW = {
  records: {
    TideForecasts: [
      {
        Location: {
          LocationId: '10015050',
          LocationName: '花蓮縣吉安鄉',
          Latitude: 23.9424,
          Longitude: 121.6125,
          TimePeriods: {
            Daily: [
              { Date: '2026-09-02', LunarDate: '2026-07-21', TideRange: '中', Time: [] },
              { Date: '2026-08-29', LunarDate: '2026-07-18', TideRange: '大', Time: [] },
              { Date: '2026-08-30', LunarDate: '2026-07-19', TideRange: '大', Time: [] }
            ]
          }
        }
      }
    ]
  }
}

describe('normalizeTideForecast — Daily 陣列排序', () => {
  it('把打散順序的 Daily 陣列依日期重新排序，不照 CWA 原始（非時序）順序回傳', () => {
    const forecast = normalizeTideForecast(SHUFFLED_DAYS_RAW as never)
    expect(forecast!.days.map((d) => d.date)).toEqual(['2026-08-29', '2026-08-30', '2026-09-02'])
  })
})

describe('normalizeTideForecast', () => {
  it('取海圖基準面（AboveChartDatum）當潮高，這個基準面下數值恆為正、較符合一般直覺', () => {
    const forecast = normalizeTideForecast(TIDE_RAW as never)
    expect(forecast!.days[0]!.events.map((e) => e.heightCm)).toEqual([86, 192])
  })

  it('location／days 欄位正確對應', () => {
    const forecast = normalizeTideForecast(TIDE_RAW as never)
    expect(forecast!.location).toEqual({ id: '10015050', name: '花蓮縣吉安鄉', coordinates: { lat: 23.9424, lon: 121.6125 } })
    expect(forecast!.days[0]).toMatchObject({ date: '2026-09-02', lunarDate: '2026-07-21', tideRange: '中' })
    expect(forecast!.days[0]!.events[0]).toEqual({ time: '2026-09-02T02:57:00+08:00', type: '乾潮', heightCm: 86 })
  })

  it('找不到地點（TideForecasts 為空）回傳 null', () => {
    expect(normalizeTideForecast({ records: { TideForecasts: [] } } as never)).toBeNull()
  })
})

describe('normalizeTideLocations', () => {
  it('把每個地點攤平成 { id, name, coordinates }', () => {
    const locations = normalizeTideLocations(TIDE_RAW as never)
    expect(locations).toEqual([{ id: '10015050', name: '花蓮縣吉安鄉', coordinates: { lat: 23.9424, lon: 121.6125 } }])
  })
})

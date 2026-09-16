import { describe, expect, it } from 'vitest'
import { climateNormalStationId, normalizeClimateComparison, normalizeClimateExtras, normalizeMaxUvIndex } from '../climate'

// 節錄自 C-B0027-001 實際回應（臺北站）：Precipitation 是跟 AirTemperature 同一個
// stationObsStatistics 底下的另一個類別，欄位換成 Accumulation（月平均累積雨量 mm）
const NORMAL_WITH_PRECIPITATION = {
  records: {
    data: {
      surfaceObs: {
        location: [
          {
            station: { StationID: '466920', StationName: '臺北' },
            stationObsStatistics: {
              AirTemperature: { StationStartYear: 1991, StationEndYear: 2020, monthly: [{ Month: '1', Mean: '16.4', Maximum: '19.5', Minimum: '13.9' }] },
              Precipitation: { monthly: [{ Month: '1', Accumulation: '90.5' }, { Month: '6', Accumulation: '345.0' }] }
            }
          }
        ]
      }
    }
  }
}
const DAILY_RAIN = {
  records: {
    location: [
      {
        station: { StationID: '466920' },
        stationObsTimes: {
          stationObsTime: [
            { Date: '2026-01-01', weatherElements: { Precipitation: '3.5' } },
            { Date: '2026-01-02', weatherElements: { Precipitation: 'T' } }
          ]
        }
      }
    ]
  }
}

describe('climateNormalStationId', () => {
  it('高雄現站 467441 的氣候常態改打舊前鎮站 467440', () => {
    expect(climateNormalStationId('467441')).toBe('467440')
  })

  it('其餘測站常態站號與現站相同', () => {
    expect(climateNormalStationId('466920')).toBe('466920')
  })
})

describe('normalizeClimateComparison', () => {
  it('C-B0024 或 C-B0027 缺測站（空 location）時回 null，而不是丟例外', () => {
    const recent = { records: { location: [] } }
    const normal = { records: { data: { surfaceObs: { location: [] } } } }
    expect(normalizeClimateComparison(recent as never, normal as never)).toBeNull()
  })

  it('C-B0027 缺 surfaceObs 這種不完整結構時回 null，而不是丟例外', () => {
    const recent = {
      records: {
        location: [
          {
            station: { StationID: '467290', StationName: '古坑' },
            stationObsTimes: { stationObsTime: [] }
          }
        ]
      }
    }
    const normal = { records: {} }
    expect(normalizeClimateComparison(recent as never, normal as never)).toBeNull()
  })

  it('完整 C-B0024 與 C-B0027 資料時，正確轉換測站、月常態、逐時觀測與昨日摘要', () => {
    const recent = {
      records: {
        location: [
          {
            station: { StationID: '466920', StationName: '臺北' },
            stationObsTimes: {
              stationObsTime: [
                {
                  DateTime: '2026-08-28T11:00:00+08:00',
                  weatherElements: { AirTemperature: '32.5', RelativeHumidity: '65', Precipitation: '0.0' }
                },
                {
                  DateTime: '2026-08-28T12:00:00+08:00',
                  weatherElements: { AirTemperature: '33.1', RelativeHumidity: '60', Precipitation: 'T' }
                }
              ]
            },
            stationObsStatistics: {
              AirTemperature: {
                daily: [{ Date: '2026-08-27', Mean: 30.2, Maximum: 35.1, Minimum: 26.4 }]
              }
            }
          }
        ]
      }
    }

    const comparison = normalizeClimateComparison(recent as never, NORMAL_WITH_PRECIPITATION as never)
    expect(comparison).not.toBeNull()
    expect(comparison).toMatchObject({
      stationId: '466920',
      stationName: '臺北',
      normalYears: [1991, 2020],
      monthlyNormals: [{ month: 1, meanTemperature: 16.4, maxTemperature: 19.5, minTemperature: 13.9 }],
      recentHourly: [
        { time: '2026-08-28T11:00:00+08:00', temperature: 32.5, relativeHumidity: 65, precipitation: 0 },
        { time: '2026-08-28T12:00:00+08:00', temperature: 33.1, relativeHumidity: 60, precipitation: null }
      ],
      yesterday: { date: '2026-08-27', meanTemperature: 30.2, maxTemperature: 35.1, minTemperature: 26.4 }
    })
  })
})

describe('normalizeClimateExtras', () => {
  it('讀出月雨量常態（Precipitation.monthly 的 Accumulation）', () => {
    const result = normalizeClimateExtras(NORMAL_WITH_PRECIPITATION as never)
    expect(result.monthlyPrecipitationNormals).toEqual([
      { month: 1, accumulationMm: 90.5 },
      { month: 6, accumulationMm: 345 }
    ])
  })

  it('沒有 Precipitation 類別時回空陣列，不是丟例外（例如某些測站只有溫度常態）', () => {
    const normalNoPrecip = {
      records: {
        data: {
          surfaceObs: {
            location: [
              {
                station: { StationID: '466920', StationName: '臺北' },
                stationObsStatistics: { AirTemperature: { StationStartYear: 1991, StationEndYear: 2020, monthly: [] } }
              }
            ]
          }
        }
      }
    }
    const result = normalizeClimateExtras(normalNoPrecip as never)
    expect(result.monthlyPrecipitationNormals).toEqual([])
  })

  it('每日雨量：trace（"T"）算成 0，不是 null（這裡只用來畫累積雨量，理由見型別註解）', () => {
    const result = normalizeClimateExtras(NORMAL_WITH_PRECIPITATION as never, DAILY_RAIN as never)
    expect(result.dailyRainfall).toEqual([
      { date: '2026-01-01', precipitationMm: 3.5 },
      { date: '2026-01-02', precipitationMm: 0 }
    ])
  })

  it('沒帶第二個參數（dailyRainRaw）時 dailyRainfall 回空陣列', () => {
    const result = normalizeClimateExtras(NORMAL_WITH_PRECIPITATION as never)
    expect(result.dailyRainfall).toEqual([])
  })

  it('帶第三個參數（maxUvRaw）時讀出 todayMaxUvIndex；沒帶時為 null', () => {
    const maxUv = { records: { weatherElement: { location: [{ StationID: '466920', UVIndex: 7 }] } } }
    const withUv = normalizeClimateExtras(NORMAL_WITH_PRECIPITATION as never, undefined, maxUv as never)
    expect(withUv.todayMaxUvIndex).toBe(7)

    const withoutUv = normalizeClimateExtras(NORMAL_WITH_PRECIPITATION as never)
    expect(withoutUv.todayMaxUvIndex).toBeNull()
  })
})

// 節錄自 O-A0005-001 實際回應（臺北站）
describe('normalizeMaxUvIndex', () => {
  it('讀出 UVIndex', () => {
    const raw = { records: { weatherElement: { location: [{ StationID: '466920', UVIndex: 7.0 }] } } }
    expect(normalizeMaxUvIndex(raw as never)).toBe(7)
  })

  it('找不到測站（location 為空）回傳 null', () => {
    expect(normalizeMaxUvIndex({ records: { weatherElement: { location: [] } } } as never)).toBeNull()
  })
})

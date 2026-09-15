import { describe, expect, it } from 'vitest'
import {
  normalizeColdInjurySummary,
  normalizeColdInjuryTown,
  normalizeHeatInjurySummary,
  normalizeHeatInjuryTown,
  normalizeTemperatureDifferenceSummary
} from '../health'

// 節錄自 M-A0085-001 實際回應，涵蓋五種警示字串（含空字串）
const RAW = {
  records: {
    Locations: [
      {
        CountyName: '嘉義市',
        Location: [
          {
            TownName: '東區',
            Geocode: '10020010',
            Latitude: '23.48040009',
            Longitude: '120.44499970',
            Time: [
              { IssueTime: '2026-08-30 18:00:00', WeatherElements: { HeatInjuryIndex: 25, HeatInjuryWarning: '' } },
              { IssueTime: '2026-08-30 21:00:00', WeatherElements: { HeatInjuryIndex: 31, HeatInjuryWarning: '注意' } },
              { IssueTime: '2026-08-31 00:00:00', WeatherElements: { HeatInjuryIndex: 33, HeatInjuryWarning: '警戒' } },
              { IssueTime: '2026-08-31 03:00:00', WeatherElements: { HeatInjuryIndex: 37, HeatInjuryWarning: '危險' } },
              { IssueTime: '2026-08-31 06:00:00', WeatherElements: { HeatInjuryIndex: 39, HeatInjuryWarning: '高危險' } }
            ]
          }
        ]
      },
      { CountyName: '澎湖縣', Location: [] }
    ]
  }
}

// 節錄自實測發現的真實情況：CWA 回傳的 Time 陣列在鄉鎮之間順序不一致（同一組時間點，
// 但打散排列），若不重新排序，choropleth 時間軸用陣列 index 在多鄉鎮間對齊時會對錯時間點
const SHUFFLED_ORDER_RAW = {
  records: {
    Locations: [
      {
        CountyName: '高雄市',
        Location: [
          {
            TownName: '大寮區',
            Geocode: '10014180',
            Latitude: '22.6',
            Longitude: '120.4',
            Time: [
              { IssueTime: '2026-08-30 00:00:00', WeatherElements: { HeatInjuryIndex: 28, HeatInjuryWarning: '' } },
              { IssueTime: '2026-08-29 12:00:00', WeatherElements: { HeatInjuryIndex: 33, HeatInjuryWarning: '注意' } },
              { IssueTime: '2026-08-30 18:00:00', WeatherElements: { HeatInjuryIndex: 31, HeatInjuryWarning: '' } }
            ]
          }
        ]
      }
    ]
  }
}

describe('normalizeHeatInjurySummary', () => {
  it('把打散順序的 Time 陣列依時間重新排序，不照 CWA 原始（非時序）順序回傳', () => {
    const [town] = normalizeHeatInjurySummary(SHUFFLED_ORDER_RAW as never)
    expect(town!.readings.map((r) => r.time)).toEqual([
      '2026-08-29T12:00:00+08:00',
      '2026-08-30T00:00:00+08:00',
      '2026-08-30T18:00:00+08:00'
    ])
  })

  it('把 CWA 沒帶時區的 IssueTime 轉成明確帶 +08:00 的 ISO 字串', () => {
    const [town] = normalizeHeatInjurySummary(RAW as never)
    expect(town!.readings[0]!.time).toBe('2026-08-30T18:00:00+08:00')
    expect(new Date(town!.readings[0]!.time).toISOString()).toBe('2026-08-30T10:00:00.000Z')
  })

  it('把五種官方警示字串（含空字串）對應到四級 + none', () => {
    const [town] = normalizeHeatInjurySummary(RAW as never)
    expect(town!.readings.map((r) => r.level)).toEqual(['none', 'caution', 'watch', 'danger', 'high-danger'])
  })

  it('沒有鄉鎮資料的縣市回傳空陣列貢獻，不是丟例外', () => {
    const towns = normalizeHeatInjurySummary(RAW as never)
    expect(towns).toHaveLength(1)
    expect(towns[0]!.county).toBe('嘉義市')
  })
})

describe('normalizeHeatInjuryTown', () => {
  it('取第一個縣市/鄉鎮，用於帶 CountyName+TownName 篩選後只會有一筆的情境', () => {
    const town = normalizeHeatInjuryTown(RAW as never)
    expect(town).toMatchObject({ county: '嘉義市', town: '東區' })
    expect(town!.readings).toHaveLength(5)
  })

  it('找不到資料（Locations 為空）回傳 null', () => {
    const town = normalizeHeatInjuryTown({ records: { Locations: [] } } as never)
    expect(town).toBeNull()
  })
})

// 冷傷害（F-A0085-003）與熱傷害同一套系統、同一個殼架構，只有 WeatherElements 底下的
// 欄位名稱不同（ColdInjuryIndex/ColdInjuryWarning）；四級門檻對照表見官方輔助說明文件
// （F-A0085-002_003.pdf），字串與熱傷害共用同一套 注意/警戒/危險/高危險。
const COLD_RAW = {
  records: {
    Locations: [
      {
        CountyName: '臺北市',
        Location: [
          {
            TownName: '信義區',
            Geocode: '63000090',
            Latitude: '25.03',
            Longitude: '121.57',
            Time: [
              { IssueTime: '2026-01-10 00:00:00', WeatherElements: { ColdInjuryIndex: 12, ColdInjuryWarning: '注意' } },
              { IssueTime: '2026-01-10 03:00:00', WeatherElements: { ColdInjuryIndex: 6, ColdInjuryWarning: '危險' } }
            ]
          }
        ]
      }
    ]
  }
}

describe('normalizeColdInjurySummary / normalizeColdInjuryTown', () => {
  it('讀取 ColdInjuryIndex/ColdInjuryWarning（跟熱傷害的欄位名稱不同）', () => {
    const [town] = normalizeColdInjurySummary(COLD_RAW as never)
    expect(town!.readings.map((r) => ({ index: r.index, level: r.level }))).toEqual([
      { index: 12, level: 'caution' },
      { index: 6, level: 'danger' }
    ])
  })

  it('單一鄉鎮明細取第一筆', () => {
    const town = normalizeColdInjuryTown(COLD_RAW as never)
    expect(town).toMatchObject({ county: '臺北市', town: '信義區' })
  })
})

// 溫差提醒（F-A0085-005）節錄自實際回應（2026-09-15 打的真實 API）：欄位名稱
// TemperatureDifferenceIndex/TemperatureDifferenceWarning 與四級警示字串跟熱/冷傷害共用同一套，
// 但 IssueTime 已經自帶 "+08:00"——跟熱/冷傷害的 naive "YYYY-MM-DD HH:MM:SS" 不一樣，
// 這是實測才發現的既有陷阱（見 toTaipeiIso 的處理）。
const TEMPERATURE_DIFFERENCE_RAW = {
  records: {
    Locations: [
      {
        CountyName: '嘉義市',
        Location: [
          {
            TownName: '東區',
            Geocode: '10020010',
            Latitude: '23.48040009',
            Longitude: '120.44499970',
            Time: [
              { IssueTime: '2026-09-16T00:00:00+08:00', WeatherElements: { TemperatureDifferenceIndex: 7, TemperatureDifferenceWarning: '注意' } },
              { IssueTime: '2026-09-17T21:00:00+08:00', WeatherElements: { TemperatureDifferenceIndex: 6, TemperatureDifferenceWarning: '' } }
            ]
          }
        ]
      }
    ]
  }
}

describe('normalizeTemperatureDifferenceSummary', () => {
  it('讀取 TemperatureDifferenceIndex/TemperatureDifferenceWarning，警示字串跟熱/冷傷害共用同一套對照表', () => {
    const [town] = normalizeTemperatureDifferenceSummary(TEMPERATURE_DIFFERENCE_RAW as never)
    expect(town!.readings.map((r) => ({ index: r.index, level: r.level }))).toEqual([
      { index: 7, level: 'caution' },
      { index: 6, level: 'none' }
    ])
  })

  it('IssueTime 本身已經帶 +08:00（跟熱/冷傷害的 naive 格式不同），不會被疊加成 +08:00+08:00', () => {
    const [town] = normalizeTemperatureDifferenceSummary(TEMPERATURE_DIFFERENCE_RAW as never)
    expect(town!.readings[0]!.time).toBe('2026-09-16T00:00:00+08:00')
  })
})

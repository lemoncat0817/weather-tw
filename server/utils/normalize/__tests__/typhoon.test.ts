import { describe, expect, it } from 'vitest'
import { normalizeTyphoonAdvisories, normalizeTyphoons } from '../typhoon'

// 節錄自 W-C0034-001 實際回應（第 18 號颱風沙德爾，海上颱風警報第 10 報）
const RAW = {
  records: {
    info: [
      {
        headline: '海上颱風警報',
        severity: 'Moderate',
        effective: '2026-08-28T11:30:00+08:00',
        expires: '2026-08-28T15:30:00+08:00',
        description: {
          section: [
            { title: '命名與位置', value: '輕度颱風 沙德爾（國際命名 SAUDEL）28日11時的中心位置…' },
            { title: '強度與半徑', value: '中心氣壓 985 百帕…七級風暴風半徑 120 公里，十級風暴風半徑 – 公里。' }
          ],
          'typhoon-info': [
            {
              section: [
                { title: '警報報數', value: '10' },
                { title: '警報類別', value: 'SEA' },
                { title: '颱風編號', value: '18' },
                { title: '颱風資訊', typhoon_name: 'SAUDEL', cwa_typhoon_name: '沙德爾' }
              ]
            }
          ]
        }
      }
    ]
  }
}

describe('normalizeTyphoonAdvisories', () => {
  it('從 typhoon-info.section 取出報數/類別/編號/颱風名稱（颱風資訊條目沒有 value，改用專屬欄位）', () => {
    const now = new Date('2026-08-28T12:00:00+08:00')
    const [advisory] = normalizeTyphoonAdvisories(RAW as never, now)
    expect(advisory).toMatchObject({
      headline: '海上颱風警報',
      category: 'SEA',
      bulletinNumber: '10',
      typhoonNo: '18',
      typhoonName: 'SAUDEL',
      typhoonNameZh: '沙德爾'
    })
  })

  it('保留原始的自由文字章節（description.section），供頁面直接顯示 CWA 原文段落', () => {
    const now = new Date('2026-08-28T12:00:00+08:00')
    const [advisory] = normalizeTyphoonAdvisories(RAW as never, now)
    expect(advisory!.sections).toHaveLength(2)
    expect(advisory!.sections[0]).toEqual({
      title: '命名與位置',
      value: '輕度颱風 沙德爾（國際命名 SAUDEL）28日11時的中心位置…'
    })
  })

  it('expires 已過去的舊資料被濾掉（跟 W-C0033-003/004/005 同一套「CWA 不會自動清空」的陷阱）', () => {
    const now = new Date('2026-08-29T00:00:00+08:00') // 晚於 15:30 的 expires
    const advisories = normalizeTyphoonAdvisories(RAW as never, now)
    expect(advisories).toHaveLength(0)
  })
})

const RAW_TYPHOON = {
  records: {
    TropicalCyclones: {
      TropicalCyclone: [
        {
          Year: '2024',
          CwaTyNo: '03',
          TyphoonName: 'GAEMI',
          CwaTyphoonName: '凱米',
          AnalysisData: {
            Fix: [
              {
                DateTime: '2024-07-24T08:00:00+08:00',
                CoordinateLongitude: '123.5',
                CoordinateLatitude: '23.8',
                MaxWindSpeed: '53',
                MaxGustSpeed: '65',
                Pressure: '935',
                MovingSpeed: '15',
                MovingDirection: 'NW'
              }
            ]
          },
          ForecastData: {
            Fix: [
              {
                InitialTime: '2024-07-24T08:00:00+08:00',
                ForecastHour: '24',
                CoordinateLongitude: '120.5',
                CoordinateLatitude: '25.2',
                MaxWindSpeed: '45',
                Pressure: '950',
                Radius70PercentProbability: '100'
              }
            ]
          }
        }
      ]
    }
  }
}

// 節錄自 W-C0034-005 實際 TD28 回應（尚未命名的熱帶性低氣壓，只有 CwaTdNo 與年份）
const RAW_TD = {
  records: {
    TropicalCyclones: {
      TropicalCyclone: [
        {
          Year: '2026',
          CwaTdNo: '28',
          AnalysisData: {
            Fix: [
              {
                DateTime: '2026-09-15T08:00:00+08:00',
                CoordinateLongitude: '150.0',
                CoordinateLatitude: '13.8',
                MaxWindSpeed: '15',
                MaxGustSpeed: '23',
                Pressure: '1002',
                MovingSpeed: '11',
                MovingDirection: 'WNW'
              }
            ]
          },
          ForecastData: {
            Fix: [
              {
                InitialTime: '2026-09-15T08:00:00+08:00',
                ForecastHour: '6',
                CoordinateLongitude: '149.8',
                CoordinateLatitude: '14.3',
                MaxWindSpeed: '15',
                MaxGustSpeed: '23',
                Pressure: '1002',
                MovingSpeed: '10',
                MovingDirection: 'NNW',
                Radius70PercentProbability: '50'
              }
            ]
          }
        }
      ]
    }
  }
}

describe('normalizeTyphoons', () => {
  it('正確解析已命名颱風的編號、英文名、中文名與分類', () => {
    const [typhoon] = normalizeTyphoons(RAW_TYPHOON as never)
    expect(typhoon).toMatchObject({
      id: '2024-03',
      year: 2024,
      name: 'GAEMI',
      nameZh: '凱米',
      classification: 'typhoon'
    })
    expect(typhoon!.track).toHaveLength(1)
    expect(typhoon!.forecast).toHaveLength(1)
    expect(typhoon!.trackLine.geometry.type).toBe('LineString')
    expect(typhoon!.forecastLine.geometry.type).toBe('LineString')
  })

  it('正確解析未命名熱帶性低氣壓（TD），生成 TDXX 編號與中文名稱', () => {
    const [td] = normalizeTyphoons(RAW_TD as never)
    expect(td).toMatchObject({
      id: '2026-TD28',
      year: 2026,
      name: 'TD28',
      nameZh: '熱帶性低氣壓 TD28',
      classification: 'tropical-depression'
    })
    expect(td!.track).toHaveLength(1)
    expect(td!.track[0]!.maxWindSpeed).toBe(15)
    expect(td!.track[0]!.pressure).toBe(1002)
    expect(td!.forecast).toHaveLength(1)
  })

  it('當無氣旋資料時安全回傳空陣列', () => {
    const result = normalizeTyphoons({ records: {} } as never)
    expect(result).toEqual([])
  })

  it('多個氣旋時優先將颱風排在熱帶性低氣壓前面', () => {
    const rawBoth = {
      records: {
        TropicalCyclones: {
          TropicalCyclone: [
            RAW_TD.records.TropicalCyclones.TropicalCyclone[0]!,
            RAW_TYPHOON.records.TropicalCyclones.TropicalCyclone[0]!
          ]
        }
      }
    }
    const result = normalizeTyphoons(rawBoth as never)
    expect(result).toHaveLength(2)
    expect(result[0]!.classification).toBe('typhoon')
    expect(result[0]!.name).toBe('GAEMI')
    expect(result[1]!.classification).toBe('tropical-depression')
    expect(result[1]!.name).toBe('TD28')
  })
})

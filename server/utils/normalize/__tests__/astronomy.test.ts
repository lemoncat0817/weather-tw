import { describe, expect, it } from 'vitest'
import { normalizeMoonTimes, normalizeSunTimes } from '../astronomy'

// 節錄自 A-B0062-001 實際回應（臺北市，2026-08-28）
const RAW = {
  records: {
    locations: {
      location: [
        {
          time: [
            {
              Date: '2026-08-28',
              BeginCivilTwilightTime: '05:10',
              SunRiseTime: '05:33',
              SunRiseAZ: '79',
              SunTransitTime: '11:55',
              SunTransitAlt: '75S',
              SunSetTime: '18:17',
              SunSetAZ: '281',
              EndCivilTwilightTime: '18:40'
            }
          ],
          CountyName: '臺北市'
        }
      ]
    }
  }
}

describe('normalizeSunTimes', () => {
  it('把沒帶日期/時區的 "HH:MM" 組合成明確帶 +08:00 的 ISO 字串', () => {
    const result = normalizeSunTimes(RAW as never)
    expect(result).toEqual({ sunrise: '2026-08-28T05:33:00+08:00', sunset: '2026-08-28T18:17:00+08:00' })
  })

  it('找不到資料（location 為空）回傳 null', () => {
    expect(normalizeSunTimes({ records: { locations: { location: [] } } } as never)).toBeNull()
  })
})

// 節錄自 A-B0063-001 官方欄位說明文件（opendatadoc/Astronomy/B0063-001.pdf）：
// 月出/月沒每個月各有一天會缺席（空字串），跟日出日沒（一定每天都有）不同
describe('normalizeMoonTimes', () => {
  it('把沒帶日期/時區的 "HH:MM" 組合成明確帶 +08:00 的 ISO 字串', () => {
    const raw = {
      records: {
        locations: {
          location: [
            {
              CountyName: '臺北市',
              time: [{ Date: '2026-08-28', MoonRiseTime: '20:14', MoonSetTime: '08:02' }]
            }
          ]
        }
      }
    }
    expect(normalizeMoonTimes(raw as never)).toEqual({
      moonrise: '2026-08-28T20:14:00+08:00',
      moonset: '2026-08-28T08:02:00+08:00'
    })
  })

  it('空字串（該日無月出或無月沒現象）回傳 null，不是拋例外或空字串', () => {
    const raw = {
      records: {
        locations: {
          location: [{ CountyName: '臺北市', time: [{ Date: '2026-08-15', MoonRiseTime: '', MoonSetTime: '13:47' }] }]
        }
      }
    }
    expect(normalizeMoonTimes(raw as never)).toEqual({ moonrise: null, moonset: '2026-08-15T13:47:00+08:00' })
  })

  it('找不到資料（location 為空）回傳 null', () => {
    expect(normalizeMoonTimes({ records: { locations: { location: [] } } } as never)).toBeNull()
  })
})

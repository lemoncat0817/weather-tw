import { describe, expect, it } from 'vitest'
import { normalizeSunTimes } from '../astronomy'

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

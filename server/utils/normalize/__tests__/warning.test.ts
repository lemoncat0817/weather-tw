import { describe, expect, it } from 'vitest'
import { normalizeCountyWarnings } from '../warning'

const RAW = {
  records: {
    location: [
      {
        locationName: '屏東縣',
        hazardConditions: {
          hazards: [
            {
              info: { phenomena: '大雨', significance: '特報' },
              validTime: { startTime: '2026-08-25 19:06:00', endTime: '2026-08-26 06:00:00' }
            }
          ]
        }
      },
      { locationName: '澎湖縣' }
    ]
  }
}

describe('normalizeCountyWarnings', () => {
  it('把 CWA 沒帶時區的 "YYYY-MM-DD HH:MM:SS" 轉成明確帶 +08:00 的 ISO 字串', () => {
    const [pingtung] = normalizeCountyWarnings(RAW as never)
    expect(pingtung!.hazards[0]!.startTime).toBe('2026-08-25T19:06:00+08:00')
    expect(pingtung!.hazards[0]!.endTime).toBe('2026-08-26T06:00:00+08:00')

    // 轉換後不管解析時的執行環境時區為何，都要解析成同一個瞬間（用 UTC 時間戳驗證，
    // 不依賴跑測試這台機器剛好在哪個時區）
    expect(new Date(pingtung!.hazards[0]!.startTime!).toISOString()).toBe('2026-08-25T11:06:00.000Z')
  })

  it('沒有特報的縣市回傳空陣列，不是 undefined', () => {
    const [, penghu] = normalizeCountyWarnings(RAW as never)
    expect(penghu).toEqual({ county: '澎湖縣', hazards: [] })
  })
})

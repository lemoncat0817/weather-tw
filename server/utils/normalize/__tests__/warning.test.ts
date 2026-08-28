import { describe, expect, it } from 'vitest'
import { normalizeCapAdvisories, normalizeCountyWarnings, normalizeWarningBulletins } from '../warning'

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

// 節錄自 W-C0033-002 實際回應：一則公告（datasetDescription）底下可能包含多個現象
// （這裡的「豪雨特報」同時涵蓋「豪雨」跟「大雨」兩種現象，各自有自己的影響區域清單）
const BULLETIN_RAW = {
  records: {
    record: [
      {
        datasetInfo: {
          datasetDescription: '豪雨特報',
          validTime: { startTime: '2026-08-28 11:00:00', endTime: '2026-08-28 23:00:00' },
          issueTime: '2026-08-28 11:00:00'
        },
        contents: { content: { contentText: '\n                西南風影響，易有短延時強降雨…\n                ' } },
        hazardConditions: {
          hazards: {
            hazard: [
              {
                info: {
                  phenomena: '豪雨',
                  significance: '特報',
                  affectedAreas: { location: [{ locationName: '高雄市山區' }, { locationName: '屏東縣' }] }
                }
              },
              {
                info: {
                  phenomena: '大雨',
                  significance: '特報',
                  affectedAreas: { location: [{ locationName: '臺中市' }] }
                }
              }
            ]
          }
        }
      }
    ]
  }
}

describe('normalizeWarningBulletins', () => {
  it('把沒帶時區的 validTime 轉成 +08:00，內文去掉前後空白/縮排', () => {
    const [bulletin] = normalizeWarningBulletins(BULLETIN_RAW as never)
    expect(bulletin!.startTime).toBe('2026-08-28T11:00:00+08:00')
    expect(bulletin!.endTime).toBe('2026-08-28T23:00:00+08:00')
    expect(bulletin!.contentText).toBe('西南風影響，易有短延時強降雨…')
  })

  it('一則公告底下的多個現象各自保留自己的影響區域清單，不會混在一起', () => {
    const [bulletin] = normalizeWarningBulletins(BULLETIN_RAW as never)
    expect(bulletin!.hazards).toEqual([
      { phenomena: '豪雨', significance: '特報', affectedAreas: ['高雄市山區', '屏東縣'] },
      { phenomena: '大雨', significance: '特報', affectedAreas: ['臺中市'] }
    ])
  })
})

// 節錄自實測發現的真實情況：W-C0033-004（低溫特報）在盛夏 8 月呼叫時，仍回傳當年 3 月
// 已過期的舊資料——CWA 沒有現行特報時不會清空這個端點，而是留著最後一次發布的內容
const STALE_AND_FRESH_CAP_RAW = {
  records: {
    info: [
      {
        event: '低溫',
        headline: '低溫特報',
        severity: 'Moderate',
        urgency: 'Future',
        certainty: 'Likely',
        effective: '2026-03-16T06:27:00+08:00',
        expires: '2026-03-16T08:00:00+08:00', // 已過期，呼叫時間點是 8 月
        description: '輻射冷卻影響…',
        instruction: '注意保暖…'
      },
      {
        event: '高溫',
        headline: '高溫資訊',
        severity: 'Moderate',
        urgency: 'Future',
        certainty: 'Likely',
        effective: '2026-08-28T11:45:00+08:00',
        expires: '2026-08-28T17:00:00+08:00', // 仍在有效期內
        description: '天氣高溫炎熱…'
      }
    ]
  }
}

describe('normalizeCapAdvisories', () => {
  it('expires 已過去的舊資料被濾掉，不會當成現行特報顯示（實測 CWA 不會自動清空這個端點）', () => {
    const now = new Date('2026-08-28T12:00:00+08:00')
    const advisories = normalizeCapAdvisories(STALE_AND_FRESH_CAP_RAW as never, now)
    expect(advisories).toHaveLength(1)
    expect(advisories[0]!.event).toBe('高溫')
  })

  it('尚未過期的仍會回傳，欄位完整轉換', () => {
    const now = new Date('2026-08-28T12:00:00+08:00')
    const [advisory] = normalizeCapAdvisories(STALE_AND_FRESH_CAP_RAW as never, now)
    expect(advisory).toMatchObject({
      event: '高溫',
      headline: '高溫資訊',
      severity: 'Moderate',
      effective: '2026-08-28T11:45:00+08:00',
      expires: '2026-08-28T17:00:00+08:00'
    })
    expect(advisory!.instruction).toBeNull()
  })
})

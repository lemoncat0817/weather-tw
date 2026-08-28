import { describe, expect, it } from 'vitest'
import { normalizeTyphoonAdvisories } from '../typhoon'

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

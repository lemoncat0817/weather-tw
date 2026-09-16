import { describe, expect, it } from 'vitest'
import { normalizeLightningJs, parseCwaTimeToIso } from '../lightning'

// CWA 實際格式：size0（大圖 lgtl）與 size1（小圖 lgts）是同一批時間點的大小圖雙胞胎
const SAMPLE_LIGHTNING_JS = `
var LightningImg = {
  'size0':{
    0:{"img":'20260916113500_lgtl.jpg', 'text':'2026/09/16 11:35'},
    1:{"img":'20260916113000_lgtl.jpg', 'text':'2026/09/16 11:30'},
    2:{"img":'20260916112500_lgtl.jpg', 'text':'2026/09/16 11:25'}
  },
  'size1':{
    0:{"img":'20260916113500_lgts.jpg', 'text':'2026/09/16 11:35'},
    1:{"img":'20260916113000_lgts.jpg', 'text':'2026/09/16 11:30'},
    2:{"img":'20260916112500_lgts.jpg', 'text':'2026/09/16 11:25'}
  }
};
`

describe('normalizeLightningJs', () => {
  it('將 YYYY/MM/DD HH:mm 格式轉成台北時間 +08:00 ISO 字串', () => {
    const iso = parseCwaTimeToIso('2026/09/16 11:35')
    expect(iso).toBe('2026-09-16T11:35:00+08:00')
    expect(new Date(iso).toISOString()).toBe('2026-09-16T03:35:00.000Z')
  })

  it('正確解析 JS 物件並按時間正序排序（供時間軸播放）', () => {
    const res = normalizeLightningJs(SAMPLE_LIGHTNING_JS)
    expect(res.frames).toHaveLength(3)

    // 最早的時間排在第一位
    expect(res.frames[0]!.displayTime).toBe('2026/09/16 11:25')
    expect(res.frames[0]!.url).toBe('/api/lightning/image?t=20260916112500_lgts.jpg')

    // 最新的時間排在最後一位
    expect(res.frames[2]!.displayTime).toBe('2026/09/16 11:35')
    expect(res.updatedAt).toBe('2026-09-16T11:35:00+08:00')
  })

  it('size0（大圖 lgtl）與 size1（小圖 lgts）是同一批時間點，只取小圖不重複計入', () => {
    const res = normalizeLightningJs(SAMPLE_LIGHTNING_JS)
    expect(res.frames.every((f) => f.url.endsWith('_lgts.jpg'))).toBe(true)
    expect(res.frames.map((f) => f.displayTime)).toEqual([
      '2026/09/16 11:25',
      '2026/09/16 11:30',
      '2026/09/16 11:35'
    ])
  })

  it('無效內容時回傳空陣列', () => {
    const res = normalizeLightningJs('')
    expect(res.frames).toEqual([])
  })
})

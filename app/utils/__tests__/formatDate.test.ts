import { describe, expect, it } from 'vitest'
import {
  currentTaipeiMonth,
  formatTaipei,
  formatTaipeiMonthDay,
  formatTaipeiTime
} from '../formatDate'

describe('formatDate (Asia/Taipei)', () => {
  it('formatTaipei 正確轉換帶時區字串為 YYYY/M/D HH:mm', () => {
    expect(formatTaipei('2026-08-28T11:50:00+08:00')).toBe('2026/8/28 11:50')
  })

  it('formatTaipei 在 UTC 時間跨日情境下正確換算為台北時間（不受執行環境時區影響）', () => {
    // 2026-08-28 16:30 UTC 等同台北時間 2026-08-29 00:30
    expect(formatTaipei('2026-08-28T16:30:00Z')).toBe('2026/8/29 00:30')
  })

  it('formatTaipeiMonthDay 取得 M/D', () => {
    expect(formatTaipeiMonthDay('2026-08-28T11:50:00+08:00')).toBe('8/28')
    expect(formatTaipeiMonthDay('2026-08-28T16:30:00Z')).toBe('8/29')
  })

  it('formatTaipeiTime 取得 HH:mm', () => {
    expect(formatTaipeiTime('2026-08-28T11:50:00+08:00')).toBe('11:50')
    expect(formatTaipeiTime('2026-08-28T16:30:00Z')).toBe('00:30')
  })

  it('currentTaipeiMonth 回傳 1 到 12 之間的整數', () => {
    const month = currentTaipeiMonth()
    expect(Number.isInteger(month)).toBe(true)
    expect(month).toBeGreaterThanOrEqual(1)
    expect(month).toBeLessThanOrEqual(12)
  })
})

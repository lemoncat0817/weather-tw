import { describe, it, expect, vi, afterEach } from 'vitest'
import { getTimeLabel } from '../time'

// 固定「現在時間」，避免測試結果隨實際執行時間漂移
function mockHour(hour: number) {
  vi.useFakeTimers()
  vi.setSystemTime(new Date(2026, 0, 1, hour))
}

afterEach(() => {
  vi.useRealTimers()
})

describe('getTimeLabel', () => {
  it('白天（6-17時）時，依 offset 回傳今天白天/今晚明晨/明天白天', () => {
    mockHour(10)
    expect(getTimeLabel(0)).toBe('今天白天')
    expect(getTimeLabel(1)).toBe('今晚明晨')
    expect(getTimeLabel(2)).toBe('明天白天')
  })

  it('晚上（18-23時）時，依 offset 回傳今晚明晨/明天白天/明天晚上', () => {
    mockHour(20)
    expect(getTimeLabel(0)).toBe('今晚明晨')
    expect(getTimeLabel(1)).toBe('明天白天')
    expect(getTimeLabel(2)).toBe('明天晚上')
  })

  it('凌晨（0-5時）時，視為晚上時段', () => {
    mockHour(3)
    expect(getTimeLabel(0)).toBe('今晚明晨')
  })

  it('6 點整算白天，18 點整算晚上（邊界值）', () => {
    mockHour(6)
    expect(getTimeLabel(0)).toBe('今天白天')
    mockHour(18)
    expect(getTimeLabel(0)).toBe('今晚明晨')
  })
})

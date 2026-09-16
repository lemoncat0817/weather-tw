import { describe, expect, it, vi } from 'vitest'
import { createLightningBitmapCache } from '../lightningBitmap'
import type { LightningFrame } from '#shared/types'

describe('lightningBitmap', () => {
  const dummyFrames: LightningFrame[] = Array.from({ length: 20 }, (_, i) => ({
    time: `2026-09-16T12:${String(i * 5).padStart(2, '0')}:00+08:00`,
    displayTime: `2026/09/16 12:${String(i * 5).padStart(2, '0')}`,
    url: `/api/lightning/image?t=frame_${i}.jpg`
  }))

  it('初始狀態下 getImmediate 回傳 null', () => {
    const cache = createLightningBitmapCache()
    expect(cache.getImmediate(dummyFrames[0]!)).toBeNull()
    cache.dispose()
  })

  it('prefetchWindow 正確計算滑動視窗並支援環狀循環預載', () => {
    const cache = createLightningBitmapCache()
    // Mock get 內部載入
    const spy = vi.spyOn(cache, 'get').mockResolvedValue(null)

    // 在索引 0 預載 (ahead: 3, behind: 2)
    cache.prefetchWindow(dummyFrames, 0, 3, 2)

    // 預載應包含：當前 (0)、往後 (1, 2, 3)、往前環狀 (19, 18)
    const requestedUrls = spy.mock.calls.map(([f]) => f.url)
    expect(requestedUrls).toContain(dummyFrames[0]!.url)
    expect(requestedUrls).toContain(dummyFrames[1]!.url)
    expect(requestedUrls).toContain(dummyFrames[2]!.url)
    expect(requestedUrls).toContain(dummyFrames[3]!.url)
    expect(requestedUrls).toContain(dummyFrames[19]!.url)
    expect(requestedUrls).toContain(dummyFrames[18]!.url)

    cache.dispose()
  })

  it('dispose 會清空快取並中止請求', () => {
    const cache = createLightningBitmapCache()
    cache.dispose()
    expect(cache.getImmediate(dummyFrames[0]!)).toBeNull()
  })
})

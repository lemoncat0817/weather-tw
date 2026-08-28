import { describe, expect, it } from 'vitest'
import { normalizeRadarFrame, toProxiedRadarFrame } from '../radar'

const RAW = {
  cwaopendata: {
    sent: '2026-08-28T11:46:32+08:00',
    dataset: {
      datasetInfo: {
        parameterSet: {
          LongitudeRange: '115.00-126.50',
          LatitudeRange: '17.75-29.25'
        }
      },
      resource: {
        ProductURL: 'https://cwaopendata.s3.ap-northeast-1.amazonaws.com/Observation/O-A0058-005.png'
      }
    }
  }
}

describe('normalizeRadarFrame', () => {
  it('把 Longitude/LatitudeRange 字串拆成 [west, south, east, north]', () => {
    const frame = normalizeRadarFrame(RAW as never)
    expect(frame.bounds).toEqual([115, 17.75, 126.5, 29.25])
    expect(frame.time).toBe('2026-08-28T11:46:32+08:00')
    expect(frame.imageUrl).toBe(
      'https://cwaopendata.s3.ap-northeast-1.amazonaws.com/Observation/O-A0058-005.png'
    )
  })
})

describe('toProxiedRadarFrame', () => {
  it('把 S3 ProductURL 換成同源代理，t 用 encodeURIComponent 以免 +08:00 被當成空白', () => {
    const frame = normalizeRadarFrame(RAW as never)
    const proxied = toProxiedRadarFrame(frame)
    expect(proxied.imageUrl).toBe(`/api/radar/image?t=${encodeURIComponent(frame.time)}`)
    expect(proxied.imageUrl).toContain('%2B08%3A00')
    expect(proxied.imageUrl).not.toContain('amazonaws.com')
    expect(proxied.bounds).toEqual(frame.bounds)
    expect(proxied.time).toBe(frame.time)
  })
})

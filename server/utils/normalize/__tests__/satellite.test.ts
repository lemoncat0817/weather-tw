import { describe, expect, it } from 'vitest'
import { normalizeSatelliteFrame } from '../satellite'

// 節錄自 O-B0032-002（高解析東亞紅外線彩色衛星雲圖）實際回應
const RAW = {
  cwaopendata: {
    dataset: {
      GeoInfo: { LongitudeRange: '102.0-155.0', LatitudeRange: '0.0-50.0' },
      ObsTime: { Datetime: '2026-08-28T11:40:00+08:00' },
      Resource: {
        ResourceDesc: '高解析東亞紅外線彩色衛星雲圖',
        ProductURL: 'https://cwaopendata.s3.ap-northeast-1.amazonaws.com/Observation/O-B0032-002.jpg'
      }
    }
  }
}

describe('normalizeSatelliteFrame', () => {
  it('把 GeoInfo 的經緯度範圍字串拆成 [west, south, east, north]', () => {
    const frame = normalizeSatelliteFrame(RAW as never)
    expect(frame.bounds).toEqual([102, 0, 155, 50])
  })

  it('ObsTime.Datetime 本身已帶 +08:00，原樣帶出不需另外轉換', () => {
    const frame = normalizeSatelliteFrame(RAW as never)
    expect(frame.time).toBe('2026-08-28T11:40:00+08:00')
  })

  it('imageUrl 是 CWA 原始 S3 網址（由呼叫端換成同源代理，這裡不做代理轉換）', () => {
    const frame = normalizeSatelliteFrame(RAW as never)
    expect(frame.imageUrl).toBe('https://cwaopendata.s3.ap-northeast-1.amazonaws.com/Observation/O-B0032-002.jpg')
  })
})

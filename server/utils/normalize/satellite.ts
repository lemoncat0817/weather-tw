import type { ImageOverlayFrame } from '#shared/types'

// O-B0031-003（台灣可見光）/ O-B0032-002（高解析東亞紅外線彩色）共用的回應形狀，
// 跟雷達（O-A0058-*）的 datasetInfo.parameterSet + resource 巢狀方式不同：
// 這裡的經緯度範圍在 GeoInfo，時間在 ObsTime.Datetime（已帶 +08:00，不需另外轉換），
// 圖片網址在 Resource.ProductURL
interface CwaSatelliteResponse {
  cwaopendata: {
    dataset: {
      GeoInfo: { LongitudeRange: string; LatitudeRange: string }
      ObsTime: { Datetime: string }
      Resource: { ProductURL: string }
    }
  }
}

function parseRange(range: string): [number, number] {
  const [a, b] = range.split('-').map(Number)
  return [a ?? 0, b ?? 0]
}

export function normalizeSatelliteFrame(raw: CwaSatelliteResponse): ImageOverlayFrame {
  const { GeoInfo, ObsTime, Resource } = raw.cwaopendata.dataset
  const [west, east] = parseRange(GeoInfo.LongitudeRange)
  const [south, north] = parseRange(GeoInfo.LatitudeRange)
  return {
    time: ObsTime.Datetime,
    // 這裡仍是 CWA 的 S3 ProductURL；回給前端前由呼叫端換成同源代理（跟雷達同一個理由：
    // 直連 S3 有 CORS／延遲問題，見 server/utils/normalize/radar.ts 的 toProxiedRadarFrame）
    imageUrl: Resource.ProductURL,
    bounds: [west, south, east, north]
  }
}

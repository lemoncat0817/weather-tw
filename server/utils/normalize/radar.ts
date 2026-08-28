import type { RadarFrame } from '#shared/types'

interface CwaRadarResponse {
  cwaopendata: {
    sent: string
    dataset: {
      datasetInfo: {
        parameterSet: {
          LongitudeRange: string // "115.00-126.50"
          LatitudeRange: string // "17.75-29.25"
        }
      }
      resource: {
        ProductURL: string
      }
    }
  }
}

function parseRange(range: string): [number, number] {
  const [a, b] = range.split('-').map(Number)
  return [a ?? 0, b ?? 0]
}

export function normalizeRadarFrame(raw: CwaRadarResponse): RadarFrame {
  const { parameterSet } = raw.cwaopendata.dataset.datasetInfo
  const [west, east] = parseRange(parameterSet.LongitudeRange)
  const [south, north] = parseRange(parameterSet.LatitudeRange)
  return {
    time: raw.cwaopendata.sent,
    // 這裡仍是 CWA 的 S3 ProductURL；回給前端前由 toProxiedRadarFrame 換成同源代理
    imageUrl: raw.cwaopendata.dataset.resource.ProductURL,
    bounds: [west, south, east, north]
  }
}

/**
 * 把 CWA 的 S3 ProductURL 換成同來源代理路徑。瀏覽器從此只打我們的 API，
 * 避開直連 ap-northeast-1 的 CORS／逾時，也能跟首頁縮圖共用快取。
 * `t` 只做 cache-buster（時間一變就換 URL），handler 本身不讀這個參數。
 */
export function toProxiedRadarFrame(frame: RadarFrame): RadarFrame {
  return {
    ...frame,
    imageUrl: `/api/radar/image?t=${encodeURIComponent(frame.time)}`
  }
}

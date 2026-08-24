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
    imageUrl: raw.cwaopendata.dataset.resource.ProductURL,
    bounds: [west, south, east, north]
  }
}

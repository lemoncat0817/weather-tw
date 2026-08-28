import type { GeoFeatureCollection, GeoPoint, Observation } from '#shared/types'
import type { FlatStationMetricProperties } from '@/utils/stationGeo'

/** 「現在」用瞬時值（reading.precipitation），其餘對應 PrecipitationAccumulation 的各時距欄位 */
export const PRECIP_RANGES = [
  { key: 'now', label: '現在' },
  { key: 'past10min', label: '10分鐘' },
  { key: 'past1hr', label: '1小時' },
  { key: 'past3hr', label: '3小時' },
  { key: 'past6hr', label: '6小時' },
  { key: 'past12hr', label: '12小時' },
  { key: 'past24hr', label: '24小時' },
  { key: 'past2days', label: '2日' },
  { key: 'past3days', label: '3日' }
] as const

export type PrecipRangeKey = (typeof PRECIP_RANGES)[number]['key']

/** 各時距的地圖色階上限（mm）。時距越長，台灣常見的合理累積雨量越大——
 *  固定用同一個上限（例如都用 50mm）會讓短時距全部擠在色階最淡端看不出差異。 */
export const PRECIP_RANGE_MAX: Record<PrecipRangeKey, number> = {
  now: 10,
  past10min: 10,
  past1hr: 40,
  past3hr: 60,
  past6hr: 90,
  past12hr: 130,
  past24hr: 200,
  past2days: 350,
  past3days: 500
}

/** 依選定時距取出該測站的累積雨量；雨量站以外（氣象站）或欄位缺席時回傳 null */
export function precipitationValue(reading: Observation['reading'], range: PrecipRangeKey): number | null {
  if (range === 'now') return reading.precipitation
  return reading.precipitationAccumulation?.[range] ?? null
}

/**
 * 依選定時距攤平雨量站點供地圖使用，形狀跟 stationGeo.ts 的 flattenStationsByMetric 一致
 * （{ stationName, county, town, value }），只是量測值來自巢狀的 precipitationAccumulation
 * 而非頂層 reading 欄位，所以另外寫一個函式而不是硬塞進 StationMetric 的聯集型別。
 */
export function flattenStationsByPrecipRange(
  fc: GeoFeatureCollection<GeoPoint, Observation>,
  range: PrecipRangeKey
): GeoFeatureCollection<GeoPoint, FlatStationMetricProperties> {
  return {
    type: 'FeatureCollection',
    features: fc.features
      .map((f) => ({ f, value: precipitationValue(f.properties.reading, range) }))
      .filter((x): x is { f: (typeof fc.features)[number]; value: number } => x.value !== null)
      .map(({ f, value }) => ({
        type: 'Feature' as const,
        geometry: f.geometry,
        properties: {
          stationName: f.properties.stationName,
          county: f.properties.county,
          town: f.properties.town,
          value
        }
      }))
  }
}

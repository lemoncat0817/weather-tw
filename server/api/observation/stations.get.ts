import { normalizeRainStations, normalizeWeatherStations } from '../../utils/normalize/observation'
import type { GeoFeatureCollection, GeoPoint, Observation } from '#shared/types'

const DATASET_BY_TYPE = {
  weather: 'O-A0003-001', // 10 分鐘綜觀氣象資料（全測站，含氣溫/濕度/風/氣壓/紫外線）
  auto: 'O-A0001-001', // 自動氣象站
  rain: 'O-A0002-001' // 雨量站
} as const
type StationType = keyof typeof DATASET_BY_TYPE

function isStationType(v: unknown): v is StationType {
  return typeof v === 'string' && v in DATASET_BY_TYPE
}

/** 全台測站觀測，直接回傳 GeoJSON FeatureCollection 供地圖使用。快取 10 分鐘。 */
export default defineCachedEventHandler(
  async (event): Promise<GeoFeatureCollection<GeoPoint, Observation>> => {
    const query = getQuery(event)
    const type: StationType = isStationType(query.type) ? query.type : 'weather'
    const datasetId = DATASET_BY_TYPE[type]

    const raw = await fetchDataset(datasetId)
    const stations = type === 'rain' ? normalizeRainStations(raw as never) : normalizeWeatherStations(raw as never)

    return {
      type: 'FeatureCollection',
      features: stations.map((s) => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [s.coordinates.lon, s.coordinates.lat] },
        properties: s
      }))
    }
  },
  // 用雜湊值當 key，理由見 forecast/[county]/[town].get.ts 的註解
  { maxAge: 60 * 10, name: 'observation-stations', getKey: cacheKeyFor }
)

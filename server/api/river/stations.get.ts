import { normalizeRiverStations } from '../../utils/normalize/river'
import type { GeoFeatureCollection, GeoPoint, RiverStation } from '#shared/types'

// 即時水位資料（data.gov.tw 資料集 25768，resource 73c4c3de-4045-4765-abeb-89f9f9cd5ff0）
const LIVE_RESOURCE_ID = '73c4c3de-4045-4765-abeb-89f9f9cd5ff0'

/**
 * 全台河川水位測站的即時水位，直接回傳 GeoJSON FeatureCollection 供地圖使用。
 * 這個平台完全不需要金鑰。即時水位每 10 分鐘更新一次、且實測這支 API 本身就只回傳
 * 每站最新一筆（不像水庫水情混雜多個時間點），不需要另外取最新；站況（座標、警戒門檻）
 * 走 riverStationMeta() 的每日快取，兩者更新頻率差很多，分開快取。
 * limit=1000 一次涵蓋全台約 370 個測站，不需要分頁。
 */
export default defineCachedEventHandler(
  async (): Promise<GeoFeatureCollection<GeoPoint, RiverStation>> => {
    const [raw, meta] = await Promise.all([
      fetchWraDataset(LIVE_RESOURCE_ID, { limit: 1000 }),
      riverStationMeta()
    ])
    const stations = normalizeRiverStations(raw as never, meta)

    return {
      type: 'FeatureCollection',
      features: stations.map((s) => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [s.coordinates.lon, s.coordinates.lat] },
        properties: s
      }))
    }
  },
  { maxAge: 60 * 10, name: 'river-stations' }
)

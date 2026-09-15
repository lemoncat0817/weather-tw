import { normalizeReservoirStatuses } from '../../utils/normalize/reservoir'
import type { GeoFeatureCollection, GeoPoint, ReservoirStatus } from '#shared/types'

// 水庫水情（data.gov.tw 資料集 45501，resource 2be9044c-6e44-4856-aad5-dd108c2e6679）
const STATUS_RESOURCE_ID = '2be9044c-6e44-4856-aad5-dd108c2e6679'

/**
 * 全台公告水庫的即時水情，直接回傳 GeoJSON FeatureCollection 供地圖使用。
 * 這個平台完全不需要金鑰。水情本身每小時更新，容量規格（算蓄水率的分母）走
 * reservoirCapacities() 的每日快取，兩者更新頻率差很多，分開快取。
 * limit=1000 抓最近一批全部水庫的觀測（含多個時間點混雜），normalizer 自己取每站最新一筆。
 */
export default defineCachedEventHandler(
  async (): Promise<GeoFeatureCollection<GeoPoint, ReservoirStatus>> => {
    const [raw, capacities] = await Promise.all([
      fetchWraDataset(STATUS_RESOURCE_ID, { limit: 1000, sort: 'observationtime desc' }),
      reservoirCapacities()
    ])
    const stations = normalizeReservoirStatuses(raw as never, capacities)

    return {
      type: 'FeatureCollection',
      features: stations.map((s) => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [s.coordinates.lon, s.coordinates.lat] },
        properties: s
      }))
    }
  },
  { maxAge: 60 * 30, name: 'reservoir-stations' }
)

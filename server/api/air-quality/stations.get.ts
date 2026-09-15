import { normalizeAirQualityStations } from '../../utils/normalize/airQuality'
import type { AirQualityStation, GeoFeatureCollection, GeoPoint } from '#shared/types'

/**
 * 全台空氣品質測站即時 AQI，直接回傳 GeoJSON FeatureCollection 供地圖使用。
 * AQX_P_432 本身就帶座標（longitude/latitude）跟測站代碼，不需要另外 join 測站基本資料集。
 * 全台約 80 站，遠低於 1000 筆上限，一次 limit=1000 就能拿到全部，不需要分頁。
 * 快取 10 分鐘，跟 CWA 觀測站同等級（環境部 AQI 本身也是逐時更新）。
 */
export default defineCachedEventHandler(
  async (): Promise<GeoFeatureCollection<GeoPoint, AirQualityStation>> => {
    const raw = await fetchMoenvDataset('aqx_p_432', { limit: 1000 })
    const stations = normalizeAirQualityStations(raw as never)

    return {
      type: 'FeatureCollection',
      features: stations.map((s) => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [s.coordinates.lon, s.coordinates.lat] },
        properties: s
      }))
    }
  },
  { maxAge: 60 * 10, name: 'air-quality-stations' }
)

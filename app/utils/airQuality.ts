import type { AirQualityStation, Coordinates } from '#shared/types'
import { findNearest, haversineKm } from './geoDistance'

/** 對應 shared/types 的 AirQualityLevel，供表格／地圖彈出視窗顯示中文 */
export const AIR_QUALITY_LEVEL_LABEL: Record<string, string> = {
  good: '良好',
  moderate: '普通',
  'unhealthy-sensitive': '對敏感族群不健康',
  unhealthy: '對所有族群不健康',
  'very-unhealthy': '非常不健康',
  hazardous: '危害',
  unavailable: '無資料'
}

// 全台空氣品質測站只有約 80 個，鄉鎮卻有 368 個，不是每個鄉鎮旁邊都有站。超過這個距離
// 代表附近根本沒站（外島或山區常見），與其顯示一個誤導的遠地讀數，不如直接不顯示——
// 首頁 Hero 卡片、鄉鎮預報頁共用同一份判斷，不要各自訂一個門檻
const NEAREST_STATION_MAX_KM = 50

/** 在測站清單裡找離某座標最近的一個，超過 50 公里視為附近沒有測站。
 *  重心點比對，跟 LocationPicker 用 findNearest 猜「你在哪個鄉鎮」同一套邏輯。 */
export function nearestAirQualityStation(point: Coordinates, stations: AirQualityStation[]): AirQualityStation | null {
  const nearest = findNearest(point, stations)
  if (!nearest) return null
  return haversineKm(point, nearest.coordinates) <= NEAREST_STATION_MAX_KM ? nearest : null
}

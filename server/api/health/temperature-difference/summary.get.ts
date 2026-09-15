import { normalizeTemperatureDifferenceSummary } from '../../../utils/normalize/health'
import type { TemperatureDifferenceTownForecast } from '#shared/types'

/**
 * 全台鄉鎮溫差提醒指數（choropleth + 時間軸播放器用）。上游 F-A0085-005 是 72 小時
 * 逐 3 小時（24 筆），跟冷傷害同一套系統、同一個時間涵蓋範圍。快取 3 小時。
 */
export default defineCachedEventHandler(
  async (): Promise<TemperatureDifferenceTownForecast[]> => {
    const raw = await fetchDataset('F-A0085-005')
    return normalizeTemperatureDifferenceSummary(raw as never)
  },
  { maxAge: 60 * 60 * 3, name: 'health-temperature-difference-summary' }
)

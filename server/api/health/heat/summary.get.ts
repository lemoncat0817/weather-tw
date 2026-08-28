import { normalizeHeatInjurySummary } from '../../../utils/normalize/health'
import type { HeatInjuryTownForecast } from '#shared/types'

/**
 * 全台 368 鄉鎮 × 39 個時間點的熱傷害指數（choropleth + 時間軸播放器用）。
 * 不帶 CountyName 時單次請求即可涵蓋全台（實測回應約 1.5MB），不需要 22 縣市各打一次。
 * 快取 3 小時，跟 M-A0085-001 一天發布數次的更新頻率一致。
 */
export default defineCachedEventHandler(
  async (): Promise<HeatInjuryTownForecast[]> => {
    const raw = await fetchDataset('M-A0085-001')
    return normalizeHeatInjurySummary(raw as never)
  },
  { maxAge: 60 * 60 * 3, name: 'health-heat-summary' }
)

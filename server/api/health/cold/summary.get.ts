import { normalizeColdInjurySummary } from '../../../utils/normalize/health'
import type { ColdInjuryTownForecast } from '#shared/types'

/**
 * 全台鄉鎮冷傷害指數（choropleth + 時間軸播放器用）。跟熱傷害不同的是上游本身只有
 * 72 小時逐 3 小時（F-A0085-003，24 筆），不是 5 天，時間軸自然比熱傷害短。
 * 快取 3 小時，跟同一套系統的熱傷害發布頻率一致。
 */
export default defineCachedEventHandler(
  async (): Promise<ColdInjuryTownForecast[]> => {
    const raw = await fetchDataset('F-A0085-003')
    return normalizeColdInjurySummary(raw as never)
  },
  { maxAge: 60 * 60 * 3, name: 'health-cold-summary' }
)

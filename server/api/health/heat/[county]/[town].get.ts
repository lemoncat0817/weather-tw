import { normalizeHeatInjuryTown } from '../../../../utils/normalize/health'
import type { HeatInjuryTownForecast } from '#shared/types'

/**
 * 單一鄉鎮完整 5 天逐 3 小時熱傷害指數序列。用 CountyName + TownName 篩選（已驗證有效，
 * 回應僅數 KB），比全量摘要小得多，適合鄉鎮頁的詳細折線圖。快取 3 小時。
 */
export default defineCachedEventHandler(
  async (event): Promise<HeatInjuryTownForecast> => {
    const county = decodeURIComponent(getRouterParam(event, 'county') ?? '')
    const town = decodeURIComponent(getRouterParam(event, 'town') ?? '')

    const raw = await fetchDataset('M-A0085-001', { CountyName: county, TownName: town })
    const forecast = normalizeHeatInjuryTown(raw as never)
    if (!forecast) {
      throw createError({ statusCode: 404, message: `找不到「${county}${town}」的熱傷害指數資料` })
    }
    return forecast
  },
  {
    maxAge: 60 * 60 * 3,
    name: 'health-heat-town',
    // 中文路徑快取鍵坍縮的既有陷阱，見 forecast/[county]/[town].get.ts 的註解
    getKey: cacheKeyFor
  }
)

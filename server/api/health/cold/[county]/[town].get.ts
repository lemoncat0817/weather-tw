import { normalizeColdInjuryTown } from '../../../../utils/normalize/health'
import type { ColdInjuryTownForecast } from '#shared/types'

/** 單一鄉鎮完整 72 小時逐 3 小時冷傷害指數序列。快取 3 小時。 */
export default defineCachedEventHandler(
  async (event): Promise<ColdInjuryTownForecast> => {
    const county = decodeURIComponent(getRouterParam(event, 'county') ?? '')
    const town = decodeURIComponent(getRouterParam(event, 'town') ?? '')

    const raw = await fetchDataset('F-A0085-003', { CountyName: county, TownName: town })
    const forecast = normalizeColdInjuryTown(raw as never)
    if (!forecast) {
      throw createError({ statusCode: 404, message: `找不到「${county}${town}」的冷傷害指數資料` })
    }
    return forecast
  },
  {
    maxAge: 60 * 60 * 3,
    name: 'health-cold-town',
    // 中文路徑快取鍵坍縮的既有陷阱，見 forecast/[county]/[town].get.ts 的註解
    getKey: cacheKeyFor
  }
)

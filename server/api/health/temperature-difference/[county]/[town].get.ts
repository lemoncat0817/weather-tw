import { normalizeTemperatureDifferenceTown } from '../../../../utils/normalize/health'
import type { TemperatureDifferenceTownForecast } from '#shared/types'

/** 單一鄉鎮完整 72 小時逐 3 小時溫差提醒指數序列。快取 3 小時。 */
export default defineCachedEventHandler(
  async (event): Promise<TemperatureDifferenceTownForecast> => {
    const county = decodeURIComponent(getRouterParam(event, 'county') ?? '')
    const town = decodeURIComponent(getRouterParam(event, 'town') ?? '')

    const raw = await fetchDataset('F-A0085-005', { CountyName: county, TownName: town })
    const forecast = normalizeTemperatureDifferenceTown(raw as never)
    if (!forecast) {
      throw createError({ statusCode: 404, message: `找不到「${county}${town}」的溫差提醒指數資料` })
    }
    return forecast
  },
  {
    maxAge: 60 * 60 * 3,
    name: 'health-temperature-difference-town',
    // 中文路徑快取鍵坍縮的既有陷阱，見 forecast/[county]/[town].get.ts 的註解
    getKey: cacheKeyFor
  }
)

import { COUNTY_DATASETS } from '../../../utils/countyDatasets'
import { normalizeTownExtended, normalizeTownHourly } from '../../../utils/normalize/forecast'
import type { TownForecast } from '#shared/types'

/** 鄉鎮完整預報：3 天逐時 + 1 週延伸，合併成一份。快取 30 分鐘。 */
export default defineCachedEventHandler(
  async (event): Promise<TownForecast> => {
    const county = decodeURIComponent(getRouterParam(event, 'county') ?? '')
    const town = decodeURIComponent(getRouterParam(event, 'town') ?? '')

    const ids = COUNTY_DATASETS[county]
    if (!ids) {
      throw createError({ statusCode: 404, statusMessage: `找不到縣市「${county}」` })
    }

    const [hourlyRaw, extendedRaw] = await Promise.all([
      fetchDataset(ids.threeDay, { locationId: ids.threeDay, LocationName: town }),
      fetchDataset(ids.week, { locationId: ids.week, LocationName: town })
    ])

    const hourly = normalizeTownHourly(hourlyRaw as never, county)
    if (!hourly) {
      throw createError({ statusCode: 404, statusMessage: `找不到「${county}${town}」的預報資料` })
    }

    hourly.extended = normalizeTownExtended(extendedRaw as never)
    return hourly
  },
  {
    maxAge: 60 * 30,
    name: 'forecast-town',
    // 不能用 getRouterParam：getKey 在路由參數注入 event.context.params 之前就會被呼叫，
    // 屆時一律回傳 undefined。也不能直接用 event.path 本身：Nitro 對 getKey 回傳值的
    // 檔名安全化處理會把中文（含 %XX 編碼）整段清空，導致不同縣市/鄉鎮撞成同一把 key
    // （縣市三 vs 縣市四路由撞名讓使用者拿到別人查過的快取結果，是實測抓到的真實 bug）。
    // 用雜湊值當 key 徹底避開這個問題。
    getKey: cacheKeyFor
  }
)

import { normalizeTideForecast } from '../../../utils/normalize/ocean'
import type { TideForecast } from '#shared/types'

/**
 * 單一地點未來 1 個月潮汐預報。用 LocationId 篩選（已驗證有效）。快取 24 小時——
 * 潮汐預報是天文計算，不會因新觀測而改變，一天更新一次已足夠。
 */
export default defineCachedEventHandler(
  async (event): Promise<TideForecast> => {
    const locationId = getRouterParam(event, 'locationId')
    if (!locationId) {
      throw createError({ statusCode: 400, message: '缺少地點代碼' })
    }

    const raw = await fetchDataset('F-A0021-001', { LocationId: locationId })
    const forecast = normalizeTideForecast(raw as never)
    if (!forecast) {
      throw createError({ statusCode: 404, message: `找不到地點 ${locationId} 的潮汐預報` })
    }
    return forecast
  },
  { maxAge: 60 * 60 * 24, name: 'ocean-tide', getKey: cacheKeyFor }
)

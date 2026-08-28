import { normalizeOceanBuoy } from '../../../utils/normalize/ocean'
import type { OceanBuoyObservation } from '#shared/types'

/** 單一浮標／潮位站 48 小時海況觀測。用 StationID 篩選（已驗證有效，回應遠小於全量的 1.7MB）。
 *  快取 30 分鐘，跟浮標回報頻率一致。 */
export default defineCachedEventHandler(
  async (event): Promise<OceanBuoyObservation> => {
    const stationId = getRouterParam(event, 'stationId')
    if (!stationId) {
      throw createError({ statusCode: 400, message: '缺少測站代碼' })
    }

    const raw = await fetchDataset('O-B0075-001', { StationID: stationId })
    const obs = normalizeOceanBuoy(raw as never)
    if (!obs) {
      throw createError({ statusCode: 404, message: `找不到測站 ${stationId} 的海象觀測資料` })
    }
    return obs
  },
  { maxAge: 60 * 30, name: 'ocean-buoy', getKey: cacheKeyFor }
)

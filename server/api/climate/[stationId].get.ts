import { climateNormalStationId, normalizeClimateComparison } from '../../utils/normalize/climate'
import type { ClimateComparison } from '#shared/types'

/**
 * 近期觀測（C-B0024-001）疊在 1991-2020 月平均氣候常態（C-B0027-001）上比較，
 * 再加上今年至今每日雨量（C-B0025-001）。快取 6 小時（氣候常態幾乎不變，近期觀測本身
 * 變動也慢，不需要跟預報/觀測一樣頻繁更新）。
 *
 * 注意：CWA 這幾個資料集用的站號參數大小寫不同——C-B0024-001／C-B0025-001 是 `StationID`
 * （大寫 ID），實測用 `StationId` 這個大小寫會被 CWA 忽略、直接退回成回傳全部測站的第一筆，
 * 是另一個「政府 API 編寫得不好」的實例。這裡統一用大寫 `StationID`，並各自單獨快取＋驗證過。
 */
export default defineCachedEventHandler(
  async (event): Promise<ClimateComparison> => {
    const stationId = getRouterParam(event, 'stationId')
    if (!stationId) {
      throw createError({ statusCode: 400, message: '缺少測站代碼' })
    }

    const [recent, normal, dailyRain, maxUv] = await Promise.all([
      fetchDataset('C-B0024-001', { StationID: stationId }),
      fetchDataset('C-B0027-001', { StationID: climateNormalStationId(stationId) }),
      // 每日雨量、當日紫外線峰值都是錦上添花的補充資訊，不是比較本身的核心——
      // 這兩支請求失敗不該讓整個比較 API 跟著炸掉，退回 undefined 讓對應欄位變成空/null
      fetchDataset('C-B0025-001', { StationID: stationId }).catch(() => undefined),
      fetchDataset('O-A0005-001', { StationID: stationId }).catch(() => undefined)
    ])

    const comparison = normalizeClimateComparison(recent as never, normal as never, dailyRain as never, maxUv as never)
    if (!comparison) {
      throw createError({ statusCode: 404, message: `找不到測站 ${stationId} 的氣候資料` })
    }
    return comparison
  },
  { maxAge: 60 * 60 * 6, name: 'climate-comparison', getKey: cacheKeyFor }
)

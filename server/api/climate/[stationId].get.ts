import { normalizeClimateComparison } from '../../utils/normalize/climate'
import type { ClimateComparison } from '#shared/types'

/**
 * 近期觀測（C-B0024-001）疊在 1991-2020 月平均氣候常態（C-B0027-001）上比較。快取 6 小時
 * （氣候常態幾乎不變，近期觀測本身變動也慢，不需要跟預報/觀測一樣頻繁更新）。
 *
 * 注意：CWA 這兩個資料集用的站號參數大小寫不同——C-B0024-001 是 `StationID`（大寫 ID），
 * 實測用 `StationId` 這個大小寫會被 CWA 忽略、直接退回成回傳全部測站的第一筆，是另一個
 * 「政府 API 編寫得不好」的實例。這裡兩支都統一用大寫 `StationID`，並各自單獨快取＋驗證過。
 */
export default defineCachedEventHandler(
  async (event): Promise<ClimateComparison> => {
    const stationId = getRouterParam(event, 'stationId')
    if (!stationId) {
      throw createError({ statusCode: 400, statusMessage: '缺少測站代碼' })
    }

    const [recent, normal] = await Promise.all([
      fetchDataset('C-B0024-001', { StationID: stationId }),
      fetchDataset('C-B0027-001', { StationID: stationId })
    ])

    const comparison = normalizeClimateComparison(recent as never, normal as never)
    if (!comparison) {
      throw createError({ statusCode: 404, statusMessage: `找不到測站 ${stationId} 的氣候資料` })
    }
    return comparison
  },
  { maxAge: 60 * 60 * 6, name: 'climate-comparison', getKey: cacheKeyFor }
)

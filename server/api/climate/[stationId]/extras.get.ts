import { climateNormalStationId, normalizeClimateExtras } from '../../../utils/normalize/climate'
import type { ClimateExtras } from '#shared/types'

/**
 * 雨量常態＋今年每日雨量＋今日紫外線峰值，獨立於 /api/climate/[stationId] 之外——實測
 * C-B0025-001（每日雨量）跟 O-A0005-001（紫外線峰值）比溫度比較用的 C-B0024/C-B0027 明顯
 * 更常慢或逾時，混在同一個 Promise.all 時，只要其中一支卡住（fetchDataset 逾時上限 15 秒），
 * 整支 API 就會被拖著一起等，讓 /climate 頁面主要內容（溫度比較）也跟著卡在「載入中」
 * 出不來——這是實測到、使用者回報過的真實症狀，不是預防性拆分。
 *
 * 前端（app/pages/climate.vue）用 `server: false` 背景抓這支，不 await、不阻塞頁面其餘部分；
 * 兩支上游各自也用 .catch 吞掉單一失敗，缺資料時對應欄位回空陣列／null，不整支垮掉。
 * 快取 6 小時，跟主要內容一致。
 */
export default defineCachedEventHandler(
  async (event): Promise<ClimateExtras> => {
    const stationId = getRouterParam(event, 'stationId')
    if (!stationId) {
      throw createError({ statusCode: 400, message: '缺少測站代碼' })
    }

    const [normal, dailyRain, maxUv] = await Promise.all([
      fetchDataset('C-B0027-001', { StationID: climateNormalStationId(stationId) }),
      fetchDataset('C-B0025-001', { StationID: stationId }).catch(() => undefined),
      fetchDataset('O-A0005-001', { StationID: stationId }).catch(() => undefined)
    ])

    return normalizeClimateExtras(normal as never, dailyRain as never, maxUv as never)
  },
  { maxAge: 60 * 60 * 6, name: 'climate-extras', getKey: cacheKeyFor }
)

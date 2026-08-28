import { normalizeSatelliteFrame } from '../../utils/normalize/satellite'
import { persistOverlayImage } from '../../utils/imageOverlay'
import type { ImageOverlayFrame } from '#shared/types'

const DATASET_BY_TYPE = {
  visible: 'O-B0031-003', // 台灣可見光衛星雲圖：日間細節較清楚，但夜間全黑（靠反射太陽光成像）
  infrared: 'O-B0032-002' // 高解析東亞紅外線彩色衛星雲圖：全天候可用、涵蓋範圍較大，颱風環流用這張
} as const
type SatelliteType = keyof typeof DATASET_BY_TYPE

function isSatelliteType(v: unknown): v is SatelliteType {
  return typeof v === 'string' && v in DATASET_BY_TYPE
}

/**
 * 最新一張衛星雲圖的中繼資料（時間／範圍／同源代理網址）。跟雷達同一個理由：回給前端的
 * imageUrl 是同源代理路徑，不是 CWA S3——瀏覽器直連 S3 有 CORS／延遲問題。
 * 快取 10 分鐘，跟上游更新頻率一致；`?type=` 是 query，用雜湊鍵才能讓兩種類型分開快取
 * （getKey 的理由見 forecast/[county]/[town].get.ts 的註解，這裡是同一招用在 query 而非路徑參數）。
 */
export default defineCachedEventHandler(
  async (event): Promise<ImageOverlayFrame> => {
    const query = getQuery(event)
    const type: SatelliteType = isSatelliteType(query.type) ? query.type : 'visible'

    const raw = await fetchFileApiDataset(DATASET_BY_TYPE[type])
    const frame = normalizeSatelliteFrame(raw as never)

    await persistOverlayImage(type, frame)

    return { ...frame, imageUrl: `/api/satellite/image?type=${type}&t=${encodeURIComponent(frame.time)}` }
  },
  { maxAge: 60 * 10, name: 'satellite-frame', getKey: cacheKeyFor }
)

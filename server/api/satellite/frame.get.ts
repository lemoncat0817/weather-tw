import { normalizeSatelliteFrame } from '../../utils/normalize/satellite'
import { persistOverlayImage } from '../../utils/imageOverlay'
import type { ImageOverlayFrame } from '#shared/types'

const DATASET_BY_TYPE = {
  visible: 'O-B0031-003' // 台灣可見光衛星雲圖：日間細節較清楚，但夜間全黑（靠反射太陽光成像）
  // 原本這裡還有 infrared: 'O-B0032-002'（高解析東亞紅外線彩色衛星雲圖），已移除——實測拿
  // Taipei/Manila/Shanghai/Hainan 等已知地標對照像素位置，發現這個資料集自報的 GeoInfo
  // 經緯度範圍（"102.0-155.0" / "0.0-50.0"，同系列 O-B0032-001/003/004 皆同）跟影像實際內容
  // 明顯對不上（Manila 落在海面、上海落在內陸），偏移幅度達數度，是上游中繼資料本身的問題，
  // 不是 normalizeSatelliteFrame 或呼叫端的座標運算寫錯——同一套邏輯用在 O-B0031-003（GeoInfo
  // 精確到小數點後好幾位的實測值）就完全對齊。沒有可靠的校正方式前不要重新加回來。
} as const
type SatelliteType = keyof typeof DATASET_BY_TYPE

function isSatelliteType(v: unknown): v is SatelliteType {
  return typeof v === 'string' && v in DATASET_BY_TYPE
}

/**
 * 最新一張衛星雲圖的中繼資料（時間／範圍／同源代理網址）。跟雷達同一個理由：回給前端的
 * imageUrl 是同源代理路徑，不是 CWA S3——瀏覽器直連 S3 有 CORS／延遲問題。
 * 快取 10 分鐘，跟上游更新頻率一致；`?type=` 是 query，用雜湊鍵才能正確依 query 分開快取
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

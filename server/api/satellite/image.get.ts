import { normalizeSatelliteFrame } from '../../utils/normalize/satellite'
import { persistOverlayImage, readStoredOverlayImage } from '../../utils/imageOverlay'
import type { H3Event } from 'h3'

// 只有 visible——infrared（O-B0032-002）已移除，理由見 frame.get.ts 開頭的說明
const DATASET_BY_TYPE = {
  visible: 'O-B0031-003'
} as const
type SatelliteType = keyof typeof DATASET_BY_TYPE

function isSatelliteType(v: unknown): v is SatelliteType {
  return typeof v === 'string' && v in DATASET_BY_TYPE
}

const CACHE_CONTROL = 'public, max-age=3600, s-maxage=86400, immutable'
const HEADERS = { 'content-type': 'image/jpeg', 'cache-control': CACHE_CONTROL }

/**
 * 衛星雲圖 JPEG 同源代理，跟 /api/radar/image 是同一個理由：不要讓瀏覽器直連 CWA S3。
 * 圖檔本體由 frame handler 刷新時寫進 storage；這裡優先讀快取，miss 再回源。
 *
 * `?t=` 對這支來說只是 cache-buster：storage 裡每個 type 永遠只留最新一張（不像雷達要
 * 逐格保存做動畫），所以這裡回的一律是「目前存著的那張」。也正因如此，只有在存著的時間
 * 真的等於請求的 t 時才進邊緣快取——否則會把新影像釘在舊網址上。
 */
export default defineEventHandler(async (event) => {
  const hit = await readEdgeCache(event)
  if (hit) return hit

  const query = getQuery(event)
  const type: SatelliteType = isSatelliteType(query.type) ? query.type : 'visible'
  const requestedTime = typeof query.t === 'string' ? query.t : undefined

  const cached = await readStoredOverlayImage(type)
  if (cached) {
    return sendJpeg(event, cached.bytes, !requestedTime || cached.time === requestedTime)
  }

  const raw = await fetchFileApiDataset(DATASET_BY_TYPE[type])
  const frame = normalizeSatelliteFrame(raw as never)
  await persistOverlayImage(type, frame)

  const stored = await readStoredOverlayImage(type)
  if (!stored) {
    throw createError({ statusCode: 502, message: '無法取得衛星雲圖影像' })
  }
  return sendJpeg(event, stored.bytes, !requestedTime || stored.time === requestedTime)
})

function sendJpeg(event: H3Event, bytes: Uint8Array, cacheable: boolean) {
  setHeader(event, 'Content-Type', 'image/jpeg')
  if (cacheable) {
    setHeader(event, 'Cache-Control', CACHE_CONTROL)
    writeEdgeCache(event, bytes, HEADERS)
  } else {
    setHeader(event, 'Cache-Control', 'public, max-age=60')
  }
  return send(event, Buffer.from(bytes))
}

import { normalizeSatelliteFrame } from '../../utils/normalize/satellite'
import { persistOverlayImage, readStoredOverlayImage } from '../../utils/imageOverlay'
import type { H3Event } from 'h3'

const DATASET_BY_TYPE = {
  visible: 'O-B0031-003',
  infrared: 'O-B0032-002'
} as const
type SatelliteType = keyof typeof DATASET_BY_TYPE

function isSatelliteType(v: unknown): v is SatelliteType {
  return typeof v === 'string' && v in DATASET_BY_TYPE
}

/**
 * 衛星雲圖 JPEG 同源代理，跟 /api/radar/image 是同一個理由：不要讓瀏覽器直連 CWA S3。
 * 圖檔本體由 frame handler 刷新時寫進 storage；這裡優先讀快取，miss 再回源。
 * `?t=` 只給瀏覽器當 cache-buster，不參與快取鍵。
 */
export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const type: SatelliteType = isSatelliteType(query.type) ? query.type : 'visible'

  const cached = await readStoredOverlayImage(type)
  if (cached) {
    return sendJpeg(event, cached.bytes)
  }

  const raw = await fetchFileApiDataset(DATASET_BY_TYPE[type])
  const frame = normalizeSatelliteFrame(raw as never)
  await persistOverlayImage(type, frame)

  const stored = await readStoredOverlayImage(type)
  if (!stored) {
    throw createError({ statusCode: 502, message: '無法取得衛星雲圖影像' })
  }
  return sendJpeg(event, stored.bytes)
})

function sendJpeg(event: H3Event, bytes: Uint8Array) {
  setHeader(event, 'Content-Type', 'image/jpeg')
  setHeader(event, 'Cache-Control', 'public, max-age=3600, immutable')
  return send(event, Buffer.from(bytes))
}

import type { RadarFrame } from '#shared/types'

export const RADAR_FRAMES_STORAGE_KEY = 'radar:frames.json'
export const RADAR_IMAGE_STORAGE_KEY = 'radar:image.bin'
export const RADAR_IMAGE_META_KEY = 'radar:image-meta.json'

interface RadarImageMeta {
  time: string
}

function toUint8Array(raw: unknown): Uint8Array | null {
  if (raw == null) return null
  if (raw instanceof Uint8Array) return raw
  if (raw instanceof ArrayBuffer) return new Uint8Array(raw)
  return null
}

export async function readStoredRadarImage(): Promise<{ bytes: Uint8Array; time: string } | null> {
  const storage = useStorage('cache')
  const [meta, raw] = await Promise.all([
    storage.getItem<RadarImageMeta>(RADAR_IMAGE_META_KEY),
    storage.getItemRaw(RADAR_IMAGE_STORAGE_KEY)
  ])
  const bytes = toUint8Array(raw)
  if (!meta?.time || !bytes || bytes.byteLength === 0) return null
  return { bytes, time: meta.time }
}

/**
 * 把最新一張雷達 PNG 抓進 storage。frames handler 每次刷新 metadata 時呼叫，
 * 讓後續的 `/api/radar/image` 只讀快取、不必再打 S3。
 * 時間沒變就跳過；下載失敗不往外丟，frames JSON 還是要能回。
 */
export async function persistRadarImage(frame: RadarFrame): Promise<void> {
  // 只抓上游 https URL；若 storage 裡誤放了同源代理路徑，避免伺服器自己打自己
  if (!frame.imageUrl.startsWith('https://')) return
  const storage = useStorage('cache')
  const meta = await storage.getItem<RadarImageMeta>(RADAR_IMAGE_META_KEY)
  if (meta?.time === frame.time) {
    const existing = toUint8Array(await storage.getItemRaw(RADAR_IMAGE_STORAGE_KEY))
    if (existing && existing.byteLength > 0) return
  }

  try {
    const buf = await $fetch<ArrayBuffer>(frame.imageUrl, {
      responseType: 'arrayBuffer',
      timeout: 15_000
    })
    await Promise.all([
      storage.setItemRaw(RADAR_IMAGE_STORAGE_KEY, new Uint8Array(buf)),
      storage.setItem(RADAR_IMAGE_META_KEY, { time: frame.time } satisfies RadarImageMeta)
    ])
  } catch {
    // 影像抓取失敗時留下舊檔（若有）；image handler 會再試一次
  }
}

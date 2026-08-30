import type { ImageOverlayFrame } from '#shared/types'

// 跟 server/utils/radarImage.ts 是同一套「S3 圖檔同源代理」手法，這裡做成可依 key 區分多個
// 疊圖圖層（衛星可見光／紅外線）的通用版，不直接改雷達那份——雷達的 storage 結構剛穩定沒多久
// （見 f660ff6），不需要為了共用邏輯去動已經在運作的東西。

interface ImageOverlayMeta {
  time: string
  /**
   * 影像的位元組數。存這個純粹是為了「不用把圖讀出來也能判斷它存在且不是空的」——
   * unstorage 的 cloudflare-kv-binding 驅動連 hasItem 底層都是 `KV.get(key)`，
   * 為了一個布林值就要把整張圖從 KV 讀出來，這在每 10 分鐘跑一次的刷新流程上是純浪費。
   * 舊版寫入的 meta 沒有這個欄位，會被視為需要重抓，自己修正一次就好。
   */
  bytes?: number
}

function toUint8Array(raw: unknown): Uint8Array | null {
  if (raw == null) return null
  if (raw instanceof Uint8Array) return raw
  if (raw instanceof ArrayBuffer) return new Uint8Array(raw)
  return null
}

export async function readStoredOverlayImage(key: string): Promise<{ bytes: Uint8Array; time: string } | null> {
  const storage = useStorage('cache')
  const [meta, raw] = await Promise.all([
    storage.getItem<ImageOverlayMeta>(`overlay:${key}:meta.json`),
    storage.getItemRaw(`overlay:${key}:image.bin`)
  ])
  const bytes = toUint8Array(raw)
  if (!meta?.time || !bytes || bytes.byteLength === 0) return null
  return { bytes, time: meta.time }
}

/**
 * 把最新一張疊圖影像抓進 storage，讓後續的圖片代理端點只讀快取、不必再打上游 S3。
 * 時間沒變就跳過；下載失敗不往外丟，metadata 端點還是要能回。
 */
export async function persistOverlayImage(key: string, frame: ImageOverlayFrame): Promise<void> {
  // 只抓上游 https URL；若 storage 裡誤放了同源代理路徑，避免伺服器自己打自己
  if (!frame.imageUrl.startsWith('https://')) return
  const storage = useStorage('cache')
  const metaKey = `overlay:${key}:meta.json`
  const imageKey = `overlay:${key}:image.bin`

  const meta = await storage.getItem<ImageOverlayMeta>(metaKey)
  if (meta?.time === frame.time && (meta.bytes ?? 0) > 0) return

  try {
    const buf = await $fetch<ArrayBuffer>(frame.imageUrl, { responseType: 'arrayBuffer', timeout: 15_000 })
    const bytes = new Uint8Array(buf)
    await Promise.all([
      storage.setItemRaw(imageKey, bytes),
      storage.setItem(metaKey, { time: frame.time, bytes: bytes.byteLength } satisfies ImageOverlayMeta)
    ])
  } catch {
    // 影像抓取失敗時留下舊檔（若有）；圖片代理端點會再試一次
  }
}

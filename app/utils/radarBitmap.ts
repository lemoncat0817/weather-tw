import type { RadarFrame } from '#shared/types'

/**
 * 雷達回波影格的「已解碼影像」快取，給 /map 的動畫播放用。
 *
 * CWA 的整合回波圖是 3600×3600 的 PNG（實測傳輸 384 KB，解碼後 3600×3600×4 = 49.4 MB
 * RGBA）。動畫原本用 `ImageSource.updateImage({ url })` 換圖，maplibre 收到 url 就會
 * 重新抓、**重新完整解碼整張 PNG**、再把 49.4 MB 的貼圖重新上傳到 GPU——瀏覽器 HTTP
 * 快取存的是「壓縮後」的 PNG，所以第二圈之後雖然不再走網路，解碼與上傳的成本每一格
 * 都還是要重付一次。播放間隔只有 700 ms（光是 IDAT 的 inflate，桌機原生 zlib 實測就要
 * 約 54 ms，瀏覽器還得再 un-filter 3600 列、做色彩轉換，中階手機更久），等於解碼器跟
 * 主執行緒幾乎沒有喘息時間。
 *
 * maplibre-gl 6 的 updateImage 明確支援餵「已解碼」的影像（見其 d.ts）：
 *   > Provide exactly one of `url` (to load an image over the network) or `image`
 *   > (an already-decoded image to display directly, without a network request).
 * 所以這裡把每一格預先解碼成 ImageBitmap 留著，播放時只做貼圖交換，沒有網路、沒有解碼。
 *
 * 解碼的同時直接縮到 DECODE_SIZE：這張圖是疊在地圖上的圖層，再怎麼放大也就是佔滿螢幕，
 * 1400² 已經遠超實際需要的取樣密度，而每格記憶體從 49.4 MB 降到 7.8 MB——6 格合計約
 * 47 MB，可以整組常駐，行動裝置也吃得下。
 */
const DECODE_SIZE = 1400

async function decodeFrame(url: string, signal: AbortSignal): Promise<ImageBitmap> {
  const res = await fetch(url, { signal })
  if (!res.ok) throw new Error(`雷達影像載入失敗（HTTP ${res.status}）`)
  const blob = await res.blob()
  try {
    return await createImageBitmap(blob, {
      resizeWidth: DECODE_SIZE,
      resizeHeight: DECODE_SIZE,
      resizeQuality: 'high'
    })
  } catch {
    // createImageBitmap 的 resize 選項在 Safari 17 以前不支援，退回原尺寸——
    // 功能完全正確，只是那些瀏覽器吃比較多記憶體
    return await createImageBitmap(blob)
  }
}

export interface RadarBitmapCache {
  /** 取得某一格的已解碼影像；同一格併發呼叫只會真的解碼一次。失敗回 null（呼叫端沿用現有畫面） */
  get: (frame: RadarFrame) => Promise<ImageBitmap | null>
  /** 背景把整組影格解碼起來，讓第一圈播放就順暢。不 await，失敗靜默忽略 */
  prefetch: (frames: RadarFrame[]) => void
  /** 只保留這些影格的解碼結果，其餘 close() 釋放（滾動視窗把舊影格擠掉時用） */
  retain: (frames: RadarFrame[]) => void
  /** 元件卸載時呼叫：中止進行中的請求並釋放所有 ImageBitmap */
  dispose: () => void
}

export function createRadarBitmapCache(): RadarBitmapCache {
  const bitmaps = new Map<string, ImageBitmap>()
  const inflight = new Map<string, Promise<ImageBitmap | null>>()
  const controller = new AbortController()
  let disposed = false

  async function get(frame: RadarFrame): Promise<ImageBitmap | null> {
    if (disposed) return null
    const cached = bitmaps.get(frame.time)
    if (cached) return cached

    const existing = inflight.get(frame.time)
    if (existing) return existing

    const task = decodeFrame(frame.imageUrl, controller.signal)
      .then((bitmap) => {
        // dispose() 可能在解碼途中就發生了，這時要立刻釋放，不能留進快取
        if (disposed) {
          bitmap.close()
          return null
        }
        bitmaps.set(frame.time, bitmap)
        return bitmap
      })
      .catch(() => null)
      .finally(() => {
        inflight.delete(frame.time)
      })

    inflight.set(frame.time, task)
    return task
  }

  return {
    get,
    prefetch(frames) {
      for (const frame of frames) void get(frame)
    },
    retain(frames) {
      const keep = new Set(frames.map((f) => f.time))
      for (const [time, bitmap] of bitmaps) {
        if (keep.has(time)) continue
        bitmap.close()
        bitmaps.delete(time)
      }
    },
    dispose() {
      disposed = true
      controller.abort()
      for (const bitmap of bitmaps.values()) bitmap.close()
      bitmaps.clear()
      inflight.clear()
    }
  }
}

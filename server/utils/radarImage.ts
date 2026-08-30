import { createHash } from 'node:crypto'
import type { RadarFrame } from '#shared/types'

export const RADAR_FRAMES_STORAGE_KEY = 'radar:frames.json'

/**
 * 每個影格各自存一張 PNG，用時間戳雜湊當 key（時間字串含 `:` `+`，不適合直接當檔名）。
 * 早期版本所有影格共用同一個 key，新影格進來就把舊的覆蓋掉——結果 frames.json 裡
 * 6 個不同時間的影格，imageUrl 全部指向同一張圖，動畫播放起來完全靜止不動。
 */
function radarImageKey(time: string): string {
  return `radar:image:${createHash('sha1').update(time).digest('hex')}.bin`
}

function toUint8Array(raw: unknown): Uint8Array | null {
  if (raw == null) return null
  if (raw instanceof Uint8Array) return raw
  if (raw instanceof ArrayBuffer) return new Uint8Array(raw)
  return null
}

export async function readStoredRadarImage(time: string): Promise<Uint8Array | null> {
  const storage = useStorage('cache')
  const bytes = toUint8Array(await storage.getItemRaw(radarImageKey(time)))
  return bytes && bytes.byteLength > 0 ? bytes : null
}

/**
 * 把指定影格的 PNG 抓進 storage，讓後續 `/api/radar/image?t=...` 只讀快取、不必再打 S3。
 * 下載失敗不往外丟，frames JSON 還是要能回。
 *
 * 這裡刻意**不**自己檢查「是不是已經存過」——unstorage 的 cloudflare-kv-binding 驅動
 * 不管是 getItemRaw 還是 hasItem，底層都是 `KV.get(key)`，也就是為了回答一個布林值而
 * 把整整 384 KB 的 PNG 從 KV 讀出來一次。兩個呼叫端本來就都已經知道答案了：
 * frames handler 只對「這一輪新加入」的影格呼叫，image handler 只在讀不到快取時呼叫。
 * 由呼叫端判斷，可以完全省掉這筆讀取。
 */
export async function persistRadarImage(frame: RadarFrame): Promise<void> {
  // 只抓上游 https URL；若 storage 裡誤放了同源代理路徑，避免伺服器自己打自己
  if (!frame.imageUrl.startsWith('https://')) return
  const storage = useStorage('cache')
  const key = radarImageKey(frame.time)

  try {
    const buf = await $fetch<ArrayBuffer>(frame.imageUrl, {
      responseType: 'arrayBuffer',
      timeout: 15_000
    })
    await storage.setItemRaw(key, new Uint8Array(buf))
  } catch {
    // 影像抓取失敗時留下舊檔（若有）；image handler 會再試一次
  }
}

/**
 * 把被滾動視窗（MAX_FRAMES）擠出去的舊影格 PNG 一併刪掉，避免 KV 裡越積越多、
 * 徒增 storage 用量——動畫最多同時只需要視窗內那幾張。
 */
export async function pruneRadarImages(evicted: RadarFrame[]): Promise<void> {
  if (evicted.length === 0) return
  const storage = useStorage('cache')
  await Promise.all(evicted.map((frame) => storage.removeItem(radarImageKey(frame.time))))
}

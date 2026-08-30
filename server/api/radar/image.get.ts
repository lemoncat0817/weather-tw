import { normalizeRadarFrame } from '../../utils/normalize/radar'
import type { RadarFrame } from '#shared/types'
import type { H3Event } from 'h3'

/**
 * 雷達回波 PNG 同源代理。瀏覽器（MapLibre image source、首頁 <img>）都打這裡，
 * 不要直連 CWA S3——除了跨域與延遲之外，更關鍵的是 CWA 的網址永遠是同一個
 * `O-A0058-005.png`、每 10 分鐘原地覆蓋，沒有伺服器端逐格快照就做不出動畫回放。
 *
 * `?t=` 是影格時間戳，用來從滾動視窗裡挑出對應那一張——不是單純的 cache-buster。
 * 每個影格各自存一張 PNG（見 radarImage.ts），這裡優先讀快取，miss 再回源抓那一張。
 * 沒帶 `t`、或帶的時間點不在目前視窗內，就退回視窗裡最新的一張。
 *
 * 快取分三層，由外而內：
 * 1. 邊緣快取（Cloudflare Cache API）——同一個 colo 的後續請求根本不會進到這個 handler。
 * 2. KV 裡逐格存好的 PNG——正常情況下這裡就命中。
 * 3. 真的都沒有才回源打 CWA／S3。
 */

// 內容由網址上的時間戳決定，不會再變，所以瀏覽器端 immutable；s-maxage 給邊緣快取用，
// 開得比瀏覽器長（影格離開滾動視窗後就沒人會再要，過期與否無所謂）
const CACHE_CONTROL = 'public, max-age=3600, s-maxage=86400, immutable'
const HEADERS = { 'content-type': 'image/png', 'cache-control': CACHE_CONTROL }

export default defineEventHandler(async (event) => {
  const hit = await readEdgeCache(event)
  if (hit) return hit

  const query = getQuery(event)
  const requestedTime = typeof query.t === 'string' ? query.t : undefined

  // 帶 t 的請求（動畫每一格、首頁縮圖、/map 的 preload）是絕大多數流量，走這條捷徑：
  // 每格 PNG 的 storage key 就是時間戳的雜湊，由 t 直接算得出來，不需要先讀 frames.json
  // 才知道要拿哪一張——熱路徑的 KV 讀取因此從 2 次降到 1 次。
  if (requestedTime) {
    const bytes = await readStoredRadarImage(requestedTime)
    if (bytes) return sendRadarPng(event, bytes, true)
  }

  // 沒帶 t，或那一格還沒／已不在 storage 裡，才走完整流程
  const storage = useStorage('cache')
  const frames = (await storage.getItem<RadarFrame[]>(RADAR_FRAMES_STORAGE_KEY)) ?? []
  let frame = (requestedTime ? frames.find((f) => f.time === requestedTime) : undefined) ?? frames.at(-1)
  if (!frame?.imageUrl.startsWith('https://')) {
    const raw = await fetchFileApiDataset('O-A0058-005')
    frame = normalizeRadarFrame(raw as never)
  }

  let bytes = await readStoredRadarImage(frame.time)
  if (!bytes) {
    await persistRadarImage(frame)
    bytes = await readStoredRadarImage(frame.time)
  }
  if (!bytes) {
    throw createError({ statusCode: 502, message: '無法取得雷達回波影像' })
  }
  // 只有真的回傳了「使用者要的那一格」才放進邊緣快取。若 t 已被滾動視窗淘汰、這裡退回的是
  // 最新一張，那就不能用 immutable 的條件把它釘在那個過期網址上（會一整天都回錯的影格）。
  return sendRadarPng(event, bytes, !requestedTime || frame.time === requestedTime)
})

function sendRadarPng(event: H3Event, bytes: Uint8Array, cacheable: boolean) {
  setHeader(event, 'Content-Type', 'image/png')
  if (cacheable) {
    setHeader(event, 'Cache-Control', CACHE_CONTROL)
    writeEdgeCache(event, bytes, HEADERS)
  } else {
    // 內容跟網址對不上，只讓瀏覽器短暫重用，不進邊緣快取
    setHeader(event, 'Cache-Control', 'public, max-age=60')
  }
  return send(event, Buffer.from(bytes))
}

import type { H3Event } from 'h3'

/**
 * Cloudflare 邊緣快取（Cache API）的薄封裝，給圖片代理端點用。
 *
 * Worker「自己產生」的回應預設**不會**進 Cloudflare 的 CDN 快取——只有 Worker 對外發出的
 * fetch 子請求才會。所以 /api/radar/image 即使回了 `Cache-Control: immutable`，那也只對
 * 瀏覽器有效：每一位新訪客、每一個新分頁都還是會實打實打進 Worker，並讀一次 KV。雷達 PNG
 * 是 384 KB，而首頁縮圖每位訪客都會抓一張，等於 KV 的讀取次數與 egress 直接跟著流量線性
 * 成長（DEPLOY.md 寫明部署在免費方案上，這是會先撞到的額度之一）。
 *
 * 用 Cache API 明確把回應放進同一個 colo 的邊緣快取之後，同一個網址就由 CDN 直接回，
 * 連 Worker 的 KV 讀取都省掉。這些網址都帶影格時間戳，內容不會變，很適合長時間快取。
 *
 * 兩個設計原則：
 * - **只加速，不改變行為。** 每個操作都包在 try/catch，任何失敗都安靜地退回原本讀 KV 的
 *   路徑。邊緣快取壞掉最糟就是「沒有加速」，絕不能變成「圖片開不出來」。
 * - **非 Cloudflare 環境自動退化成 no-op。** 本機 node-server preset 沒有 `caches`
 *   全域物件，`edgeCache()` 回 null，整條路徑跟修改前完全一致。
 *
 * ⚠️ 部署注意：Cloudflare 的 Cache API 在 `*.workers.dev` 子網域上不生效（官方限制，
 * 快取只在綁定自訂網域的 zone 上運作）。本站目前正是部署在 workers.dev，所以這一層
 * 現階段等同 no-op——它不會造成任何問題（put/match 都被 try/catch 包住，失敗就走 KV），
 * 但也還拿不到好處。真正在省 KV 讀取的是 image handler 的熱路徑捷徑；等哪天綁上自訂
 * 網域，這一層就會自動開始生效，不需要改任何程式碼。
 */

/** Cloudflare Workers 的 `caches.default`；其他執行環境沒有這個東西，回 null */
function edgeCache(): Cache | null {
  const store = (globalThis as { caches?: { default?: Cache } }).caches?.default
  return store ?? null
}

/** Nitro 的 cloudflare preset 會把 Worker 的 ExecutionContext.waitUntil 掛在 event.context 上 */
function waitUntil(event: H3Event, promise: Promise<unknown>): void {
  const ctx = event.context as { waitUntil?: (p: Promise<unknown>) => void }
  if (typeof ctx.waitUntil === 'function') {
    ctx.waitUntil(promise)
    return
  }
  // 沒有 waitUntil 就自己吞掉錯誤，不要讓背景寫入變成 unhandled rejection
  void promise.catch(() => {})
}

/** 快取鍵就是完整請求網址（含 query），Cache API 要求它是一個 GET Request */
function cacheKey(event: H3Event): Request {
  return new Request(getRequestURL(event).toString(), { method: 'GET' })
}

/**
 * 命中就回傳可以直接當 handler 回傳值的 Response；沒命中（或不在 Cloudflare 上）回 null。
 * 呼叫端只要 `const hit = await readEdgeCache(event); if (hit) return hit`。
 */
export async function readEdgeCache(event: H3Event): Promise<Response | null> {
  const cache = edgeCache()
  if (!cache) return null
  try {
    return (await cache.match(cacheKey(event))) ?? null
  } catch {
    return null
  }
}

/**
 * 把這次算出來的位元組寫進邊緣快取。刻意不回傳 Response、也不影響呼叫端怎麼送出回應——
 * 呼叫端照舊用 h3 的 send() 回應，這裡只是額外複製一份給 CDN 留著。
 */
export function writeEdgeCache(event: H3Event, bytes: Uint8Array, headers: Record<string, string>): void {
  const cache = edgeCache()
  if (!cache) return
  try {
    // Uint8Array 在所有執行環境都是合法的 Response body，但這個專案的 TS lib 組合
    // 解析到的是 undici 的 BodyInit 定義，裡面沒有涵蓋它，所以要明講一次
    const response = new Response(bytes as unknown as BodyInit, { headers })
    waitUntil(event, cache.put(cacheKey(event), response))
  } catch {
    // 寫入失敗就當作沒有邊緣快取，下次請求照樣能從 KV 取得
  }
}

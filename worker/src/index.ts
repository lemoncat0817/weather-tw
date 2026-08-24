// Cloudflare Worker：代理前端對中央氣象署（CWA）開放資料平台的請求
//
// 目的：
//   1. 把 CWA_API_KEY 留在伺服器端（Worker Secret），前端 bundle 不再持有金鑰
//   2. 統一加上 CORS，讓 GitHub Pages 上的靜態前端可以呼叫
//   3. 用 Cache API 快取上游回應，減少對 CWA 平台的請求次數、加快回應速度
//
// 轉發規則：前端呼叫 `<worker網址>/v1/rest/datastore/xxx?locationId=yyy`，
// Worker 會原樣轉發路徑與查詢參數到 `https://opendata.cwa.gov.tw/api/...`，
// 並自行附加/覆寫 Authorization 查詢參數。前端完全不需要、也不應該再帶 Authorization。

export interface Env {
  CWA_API_KEY: string
}

const UPSTREAM_ORIGIN = 'https://opendata.cwa.gov.tw/api'

// 允許呼叫這個 Worker 的前端來源。
// 部署到自己的 Cloudflare 帳號後，請把 GitHub Pages 網域換成實際使用的網域。
const ALLOWED_ORIGINS = [
  'https://lemoncat0817.github.io',
  'http://localhost:5173',
  'http://127.0.0.1:5173'
]

// 上游資料更新頻率不一（預報約數小時一次、觀測資料較快），先用一個保守的統一值，
// 之後可依各資料集特性個別調整。
const CACHE_TTL_SECONDS = 300

function buildCorsHeaders(origin: string | null): Record<string, string> {
  const allowOrigin = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    Vary: 'Origin'
  }
}

function jsonError(message: string, status: number, origin: string | null): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json', ...buildCorsHeaders(origin) }
  })
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const origin = request.headers.get('Origin')

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: buildCorsHeaders(origin) })
    }

    if (request.method !== 'GET') {
      return jsonError('Method Not Allowed', 405, origin)
    }

    if (!env.CWA_API_KEY) {
      // 尚未設定 secret，避免整支路徑無提示地失敗
      return jsonError('伺服器尚未設定 CWA_API_KEY，請先執行 wrangler secret put CWA_API_KEY', 500, origin)
    }

    const incomingUrl = new URL(request.url)
    const upstreamUrl = new URL(UPSTREAM_ORIGIN + incomingUrl.pathname + incomingUrl.search)
    // 由 Worker 統一附加金鑰；就算前端誤帶了 Authorization 也會在這裡被覆寫掉
    upstreamUrl.searchParams.set('Authorization', env.CWA_API_KEY)

    const cache = caches.default
    // cache key 不能包含金鑰，用只帶原始（未附加金鑰）查詢參數的 URL 當 key
    const cacheKeyUrl = new URL(UPSTREAM_ORIGIN + incomingUrl.pathname + incomingUrl.search)
    const cacheKey = new Request(cacheKeyUrl.toString(), { method: 'GET' })

    let response = await cache.match(cacheKey)

    if (!response) {
      let upstreamResponse: Response
      try {
        upstreamResponse = await fetch(upstreamUrl.toString(), {
          headers: { Accept: 'application/json' }
        })
      } catch {
        return jsonError('無法連線至中央氣象署開放資料平台', 502, origin)
      }

      if (!upstreamResponse.ok) {
        return jsonError(`上游氣象資料平台回應錯誤 (${upstreamResponse.status})`, upstreamResponse.status, origin)
      }

      response = new Response(upstreamResponse.body, upstreamResponse)
      response.headers.set('Cache-Control', `public, max-age=${CACHE_TTL_SECONDS}`)
      ctx.waitUntil(cache.put(cacheKey, response.clone()))
    }

    const finalResponse = new Response(response.body, response)
    const cors = buildCorsHeaders(origin)
    for (const key in cors) {
      finalResponse.headers.set(key, cors[key])
    }
    return finalResponse
  }
}

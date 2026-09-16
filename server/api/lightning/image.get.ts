import type { H3Event } from 'h3'

const CACHE_CONTROL = 'public, max-age=3600, s-maxage=86400, immutable'
const HEADERS = { 'content-type': 'image/jpeg', 'cache-control': CACHE_CONTROL }

function sendJpeg(event: H3Event, bytes: Uint8Array, cacheable: boolean) {
  if (cacheable) writeEdgeCache(event, bytes, HEADERS)
  setResponseHeaders(event, HEADERS)
  return bytes
}

export default defineEventHandler(async (event) => {
  const hit = await readEdgeCache(event)
  if (hit) return hit

  const query = getQuery(event)
  const requestedFile = typeof query.t === 'string' ? query.t : undefined

  // 安全防護：只允許格式如 20260916113500_lgtl.jpg 的檔名
  if (!requestedFile || !/^[\w.-]+\.jpg$/i.test(requestedFile)) {
    throw createError({ statusCode: 400, message: 'Invalid lightning image parameter' })
  }

  const cwaImageUrl = `https://www.cwa.gov.tw/Data/lightning/${requestedFile}`
  try {
    const buffer = await $fetch<ArrayBuffer>(cwaImageUrl, {
      responseType: 'arrayBuffer',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      timeout: 10_000
    })
    return sendJpeg(event, new Uint8Array(buffer), true)
  } catch (err) {
    throw createError({
      statusCode: 502,
      message: '無法取得 CWA 閃電圖資影像',
      cause: err
    })
  }
})

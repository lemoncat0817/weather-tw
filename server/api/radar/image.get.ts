import { normalizeRadarFrame } from '../../utils/normalize/radar'
import type { RadarFrame } from '#shared/types'
import type { H3Event } from 'h3'

/**
 * 雷達回波 PNG 同源代理。瀏覽器（MapLibre image source、首頁 <img>）都打這裡，
 * 不要直連 CWA S3：那是 3600×3600 的跨域圖，MapLibre 還得等底圖 load 完才開始抓，
 * 實測進 /map 後影像請求要到 ~2s 才發出，偶發 Failed to fetch。
 *
 * `?t=` 是影格時間戳，用來從滾動視窗裡挑出對應那一張——不是單純的 cache-buster。
 * 每個影格各自存一張 PNG（見 radarImage.ts），這裡優先讀快取，miss 再回源抓那一張。
 * 沒帶 `t`、或帶的時間點不在目前視窗內，就退回視窗裡最新的一張。
 */
export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const requestedTime = typeof query.t === 'string' ? query.t : undefined

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
  return sendRadarPng(event, bytes)
})

function sendRadarPng(event: H3Event, bytes: Uint8Array) {
  setHeader(event, 'Content-Type', 'image/png')
  // t= 時間戳一變 URL 就變，瀏覽器可以長時間重用同一張
  setHeader(event, 'Cache-Control', 'public, max-age=3600, immutable')
  return send(event, Buffer.from(bytes))
}

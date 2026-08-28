import { normalizeRadarFrame, toProxiedRadarFrame } from '../../utils/normalize/radar'
import type { RadarFrame } from '#shared/types'

const MAX_FRAMES = 6 // CWA 只給「最新一張」，沒有歷史圖層 API；靠伺服器端每次請求時累積，約每 10 分鐘一張，6 張約可回放 1 小時

/**
 * 雷達整合回波動畫影格。因為 CWA 的雷達 API 只回傳最新一張圖，
 * 這裡在伺服器端維護一個小型滾動視窗（storage-backed），每次被呼叫時把新影格併入、去重、裁到 MAX_FRAMES。
 * 快取 5 分鐘——雷達本身約 10 分鐘更新一次，5 分鐘的快取視窗已足夠貼近時效又不會過度打上游。
 *
 * 回給前端的 imageUrl 是同源代理 `/api/radar/image`，不是 CWA S3。
 * 刷新 metadata 時一併把 PNG 抓進 storage，讓影像端點命中快取。
 */
export default defineCachedEventHandler(
  async (): Promise<RadarFrame[]> => {
    const raw = await fetchFileApiDataset('O-A0058-005')
    const latest = normalizeRadarFrame(raw as never)

    const storage = useStorage('cache')
    const existing = (await storage.getItem<RadarFrame[]>(RADAR_FRAMES_STORAGE_KEY)) ?? []

    const frames = existing.some((f) => f.time === latest.time) ? existing : [...existing, latest].slice(-MAX_FRAMES)
    const evicted = existing.filter((f) => !frames.some((kept) => kept.time === f.time))

    await Promise.all([
      storage.setItem(RADAR_FRAMES_STORAGE_KEY, frames),
      persistRadarImage(latest),
      pruneRadarImages(evicted)
    ])
    return frames.map(toProxiedRadarFrame)
  },
  { maxAge: 60 * 5, name: 'radar-frames' }
)

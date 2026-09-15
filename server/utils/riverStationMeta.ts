import { normalizeRiverStationMeta } from './normalize/river'

// 河川水位測站站況（data.gov.tw 資料集 22227，resource c4acc691-7416-40ca-9464-292c0c00da92）
// 是測站基本資料（名稱、座標、警戒門檻），變動很慢——不是即時資料。即時水位 handler 若每次
// 都跟著水位一起重抓，等於用 10 分鐘 TTL 重複問一份幾乎不變的答案，沒有必要，
// 跟 reservoirCapacity.ts 是同一個理由。
const RESOURCE_ID = 'c4acc691-7416-40ca-9464-292c0c00da92'

const cachedStationMeta = defineCachedFunction(
  async () => {
    const raw = await fetchWraDataset(RESOURCE_ID, { limit: 1000 })
    return normalizeRiverStationMeta(raw as never)
  },
  { maxAge: 60 * 60 * 24, name: 'river-station-meta' }
)

/** 測站編號 → 站況中繼資料的查表。任何失敗都退回空物件，讓呼叫端的即時水位一筆都對不上
 *  時整支回傳空陣列，而不是讓整個 handler 掛掉。 */
export function riverStationMeta(): Promise<ReturnType<typeof normalizeRiverStationMeta>> {
  return cachedStationMeta().catch(() => ({}))
}

import { normalizeReservoirCapacities } from './normalize/reservoir'

// 水庫基本資料（data.gov.tw 資料集 32726，resource 708a43b0-24dc-40b7-9ed2-fca6a291e7ae）
// 是容量規格，一年才更新一次（民國年一年一筆），不是即時資料——即時水情 handler 若每次
// 都跟著水情一起重抓，等於用 30 分鐘 TTL 重複問一份一年才變一次的答案，沒有必要，
// 跟 sunTimes.ts／moonTimes.ts 是同一個「依上游資料實際變動頻率快取」的理由。
const RESOURCE_ID = '708a43b0-24dc-40b7-9ed2-fca6a291e7ae'

const cachedCapacities = defineCachedFunction(
  async () => {
    const raw = await fetchWraDataset(RESOURCE_ID, { limit: 1000 })
    return normalizeReservoirCapacities(raw as never)
  },
  { maxAge: 60 * 60 * 24, name: 'reservoir-capacity' }
)

/** 水庫代碼 → 目前有效容量的查表。任何失敗都退回空物件，讓呼叫端的蓄水率算不出來時
 *  自然變成 null，不擋掉水位等其餘欄位正常顯示。 */
export function reservoirCapacities(): Promise<Record<string, number>> {
  return cachedCapacities().catch(() => ({}))
}

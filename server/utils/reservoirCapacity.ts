import { normalizeReservoirCapacities } from './normalize/reservoir'

// 水庫每日營運狀況（data.gov.tw 資料集 41568，resource 51023e88-4c76-4dbc-bbb9-470da690d539）
// 的 capacity 欄位——經濟部水利署防災資訊網（fhy.wra.gov.tw/fhyv2/monitor/reservoir）
// 目前顯示的「有效庫容量」逐一核對後確認就是這支資料集，見 normalize/reservoir.ts 的
// 完整說明。一天才更新一次，不是即時資料——即時水情 handler 若每次都跟著水情一起重抓，
// 等於用 30 分鐘 TTL 重複問一份一天才變一次的答案，沒有必要，跟 sunTimes.ts／
// moonTimes.ts 是同一個「依上游資料實際變動頻率快取」的理由。
const RESOURCE_ID = '51023e88-4c76-4dbc-bbb9-470da690d539'

const cachedCapacities = defineCachedFunction(
  async () => {
    const raw = await fetchWraDataset(RESOURCE_ID, { limit: 1000 })
    return normalizeReservoirCapacities(raw as never)
  },
  { maxAge: 60 * 60 * 24, name: 'reservoir-capacity' }
)

/** 水庫代碼 → 有效庫容量的查表。任何失敗都退回空物件，讓呼叫端的蓄水率算不出來時
 *  自然變成 null，不擋掉水位等其餘欄位正常顯示。 */
export function reservoirCapacities(): Promise<Record<string, number>> {
  return cachedCapacities().catch(() => ({}))
}

import { normalizeMoonTimes } from './normalize/astronomy'

/**
 * 月出月沒（A-B0063-001）的快取層，跟 sunTimes.ts 是同一份「縣市+日期」函式級快取邏輯——
 * 同樣是一個縣市一天一筆，同樣不能讓 368 個鄉鎮各自重抓一次（理由見 sunTimes.ts 的完整說明）。
 */
const cachedMoonTimes = defineCachedFunction(
  async (county: string, date: string) => {
    const raw = await fetchDataset('A-B0063-001', { CountyName: county, Date: date })
    return normalizeMoonTimes(raw as never)
  },
  { maxAge: 60 * 60 * 6, name: 'astronomy-moon' }
)

/**
 * 指定縣市今天的月出月沒。跟日出日沒一樣是逐時預報頁的錦上添花，不是預報本身，
 * 任何失敗都退回 null，讓呼叫端照常回傳預報、只是不顯示月出月沒資訊。
 */
export function moonTimesFor(county: string, date: string): Promise<{ moonrise: string | null; moonset: string | null } | null> {
  return cachedMoonTimes(county, date).catch(() => null)
}

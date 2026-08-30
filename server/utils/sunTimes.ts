import { normalizeSunTimes } from './normalize/astronomy'

/**
 * 日出日沒（A-B0062-001）的快取層，刻意做成「函式級快取」而不是跟著預報 handler 一起快取。
 *
 * 這份資料的顆粒度是「一個縣市一天一筆」，但它原本是在 /api/forecast/[county]/[town] 的
 * handler 裡跟著鄉鎮預報一起抓的——那支 handler 的快取鍵是完整路徑，也就是每個鄉鎮各一把。
 * 結果同一個縣市、同一天、內容一模一樣的日出日沒，會被 368 個鄉鎮各自重抓一次，而且預報
 * 的 TTL 只有 30 分鐘，等於這個資料集最壞情況下一天要打 368 × 48 ≈ 17,664 次 CWA API。
 * CWA 的開放資料平台對每把金鑰有請求次數上限，這種「同樣的答案重複問幾千次」是最沒有必要
 * 的消耗——尤其 sitemap.xml 把 368 個鄉鎮頁全部掛出去，搜尋引擎爬一輪就會全部踩過。
 *
 * 改成用 defineCachedFunction 依「縣市 + 日期」快取之後，同一天最多就是 22 個縣市各一次。
 * TTL 給 6 小時（日出日沒是天文計算，當天內不會變；跨日時 date 參數本身就變了，自然換鍵）。
 *
 * 快取鍵用 Nitro 預設的 `hash(args)`，不自訂 getKey——自訂的 getKey 回傳值會被
 * `escapeKey`（`String(key).replace(/\W/g, '')`）處理，而 JS 的 `\w` 只認 ASCII，
 * 中文縣市名會被整段清空、22 個縣市全部撞成同一把鍵。這正是 server/utils/cacheKey.ts
 * 記錄的那個既有陷阱，只是換到函式快取上；預設的 hash 本來就不會有這個問題。
 */
const cachedSunTimes = defineCachedFunction(
  async (county: string, date: string) => {
    const raw = await fetchDataset('A-B0062-001', { CountyName: county, Date: date })
    return normalizeSunTimes(raw as never)
  },
  { maxAge: 60 * 60 * 6, name: 'astronomy-sun' }
)

/**
 * 指定縣市今天的日出日沒。這是逐時預報圖表的錦上添花（畫夜間陰影帶），不是預報本身，
 * 所以任何失敗都退回 null，讓呼叫端照常回傳預報、只是不畫陰影帶。
 */
export function sunTimesFor(county: string, date: string): Promise<{ sunrise: string; sunset: string } | null> {
  return cachedSunTimes(county, date).catch(() => null)
}

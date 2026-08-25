// CWA 的時間字串本身帶時區位移（例如 +08:00），所以 Date 物件對應的「瞬間」在 SSR/CSR 都一樣；
// 會讓 SSR 跟 CSR 顯示不同文字、觸發 hydration mismatch 的原因有兩層，兩層都跟 Intl API 有關：
//   1. toLocaleString 系列函式在沒有指定 timeZone 時，會用「執行環境的預設時區」換算成日曆時間——
//      Node SSR 行程跟瀏覽器的預設時區不保證相同（例如伺服器跑在 UTC 的容器裡）。
//   2. 就算兩邊時區、格式選項完全一樣，toLocaleString 組出「日期＋時間」這種複合字串時，中間的
//      分隔字元是由 ICU 的 locale pattern 決定，不是我們自己寫的字面 —— 實測 Node 的 ICU 在
//      zh-TW 會用 U+2009（THIN SPACE）當日期跟時間之間的分隔，Chromium 的 ICU 用的是另一個字元。
//      兩邊看起來「像」同一個字串，實際上是不同的 Unicode 字元，一樣會觸發 hydration mismatch。
//      這是 Intl API 在 SSR 場景下一個廣為人知、但很少人踩到細節的陷阱。
// 解法：用 formatToParts 只取數字欄位，日期/時間之間的分隔字元完全由我們自己寫死，
// 不假手 ICU 的 locale pattern；不用 ClientOnly 犧牲 SSR 內容來迴避。
const TAIPEI: NonNullable<Intl.DateTimeFormatOptions['timeZone']> = 'Asia/Taipei'

function partsOf(date: Date, options: Intl.DateTimeFormatOptions): Record<string, string> {
  const parts = new Intl.DateTimeFormat('zh-TW', { ...options, timeZone: TAIPEI }).formatToParts(date)
  const map: Record<string, string> = {}
  for (const part of parts) map[part.type] = part.value
  return map
}

/** 完整日期＋時間，24 小時制，例如「2026/8/25 20:16」（分隔字元自己寫死，不吃 ICU 的 locale pattern） */
export function formatTaipei(iso: string): string {
  const p = partsOf(new Date(iso), { year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false })
  return `${p.year}/${p.month}/${p.day} ${p.hour}:${p.minute}`
}

/** 只取月/日，例如「8/25」，用於 7 日預報條這類只需要日期的地方 */
export function formatTaipeiMonthDay(iso: string): string {
  const p = partsOf(new Date(iso), { month: 'numeric', day: 'numeric' })
  return `${p.month}/${p.day}`
}

/** 現在是台灣時間幾月（1-12）。同樣不能用 new Date().getMonth()——那是執行環境的本地時區，
 *  SSR/CSR 若剛好跨月份交界、兩邊時區又不同，會算出不同答案。氣候比較頁用來挑「本月」常態值。 */
export function currentTaipeiMonth(): number {
  return Number(partsOf(new Date(), { month: 'numeric' }).month)
}

// 農業部農村發展及水土保持署（土石流及大規模崩塌防災資訊網）client。這個平台完全不需要
// 金鑰（實測驗證過），但用的是兩個不同網域、不同慣例的端點，不是同一套 REST API：
// - 246.ardswc.gov.tw/webService/GetAlertData.ashx：即時警戒清單，平時回傳空陣列
// - data.moa.gov.tw/Service/OpenData/TransService.aspx：農業部資料開放平台的通用查詢端點，
//   這裡用來查「土石流及大規模崩塌警戒發布紀錄」（歷史紀錄，UnitId 是查資料集專屬代碼）
// 兩支都回傳裸陣列（不是 CWA 那種巢狀 records，也不是 CAP 格式）。

const LIVE_ALERT_URL = 'https://246.ardswc.gov.tw/webService/GetAlertData.ashx'
const HISTORY_URL = 'https://data.moa.gov.tw/Service/OpenData/TransService.aspx'
// 「土石流及大規模崩塌警戒發布紀錄」資料集的 UnitId（data.gov.tw 資料集 156617）
const HISTORY_UNIT_ID = 'kRam3LShuWSv'

async function request<T>(url: string, query: Record<string, string | number | undefined>): Promise<T> {
  const q: Record<string, string> = {}
  for (const [k, v] of Object.entries(query)) {
    if (v !== undefined) q[k] = String(v)
  }
  try {
    return (await $fetch(url, { query: q, timeout: 15_000 })) as T
  } catch (err) {
    throw createError({
      statusCode: 502,
      message: '無法連線至農業部農村發展及水土保持署防災資訊網',
      cause: err
    })
  }
}

/** 目前的土石流／大規模崩塌警戒清單；平時（無警戒）回傳空陣列，不是缺資料。 */
export function fetchDebrisFlowLiveAlerts<T>(): Promise<T> {
  return request<T>(LIVE_ALERT_URL, {})
}

/** 土石流／大規模崩塌警戒發布歷史紀錄。伺服器端本身有 9999 筆上限，沒有分頁或
 *  排序參數可用（實測 Top/limit 之類的參數不受支援，加了反而回傳空陣列），
 *  只能整批抓回來後自己在 normalizer 端排序、篩最新幾筆。 */
export function fetchDebrisFlowHistory<T>(): Promise<T> {
  return request<T>(HISTORY_URL, { UnitId: HISTORY_UNIT_ID, IsTransData: 1 })
}

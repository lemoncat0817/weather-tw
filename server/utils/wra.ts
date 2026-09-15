// 經濟部水利署水利資料開放平台 client。跟 cwa.ts／moenv.ts 不同的是這個平台的資料集
// 大多數完全不需要金鑰（實測驗證過），resource id 是不透明的 UUID（在 data.gov.tw 的
// 資料集頁面才查得到，平台自己的官網有反爬蟲機制擋掉直接的網頁爬取，UUID 只能從
// data.gov.tw 的中繼資料 API 取得，見各呼叫端註解的資料集連結）。

const WRA_BASE = 'https://opendata.wra.gov.tw/api/v2'

async function request<T>(resourceId: string, params: Record<string, string | number | undefined>): Promise<T> {
  const query: Record<string, string> = { format: 'JSON' }
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined) query[k] = String(v)
  }
  try {
    return (await $fetch(`${WRA_BASE}/${resourceId}`, { query, timeout: 15_000 })) as T
  } catch (err) {
    throw createError({
      statusCode: 502,
      message: '無法連線至經濟部水利署水利資料開放平台',
      cause: err
    })
  }
}

/** 呼叫水利署開放資料 API v2（`/{resourceId}?format=JSON&...`）。resourceId 是 UUID，不是
 *  像 CWA／環境部那樣有意義的資料集代碼。 */
export function fetchWraDataset<T>(resourceId: string, params: Record<string, string | number | undefined> = {}): Promise<T> {
  return request<T>(resourceId, params)
}

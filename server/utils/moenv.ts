// 環境部環境資料開放平臺 client。金鑰只存在這裡（runtimeConfig，伺服器端），絕不外流到
// 任何回應內容或前端 bundle——跟 server/utils/cwa.ts 是同一個理由，但這是不同機關、不同慣例
// 的另一個開放資料平台（?api_key= 而非 ?Authorization=、回應是 {records:[...]} 一層陣列而不是
// CWA 那種深層巢狀、資料集代碼慣例也不同），分開一支 client 比硬塞進 cwa.ts 更清楚。

const MOENV_BASE = 'https://data.moenv.gov.tw/api/v2'

function apiKey(): string {
  const key = useRuntimeConfig().moenvApiKey
  if (!key) {
    throw createError({
      statusCode: 500,
      // 同樣的 statusMessage ASCII 限制見 cwa.ts 的註解，說明文字放 message
      message: '伺服器尚未設定環境部空氣品質金鑰（NUXT_MOENV_API_KEY 環境變數）'
    })
  }
  return key
}

async function request<T>(dataset: string, params: Record<string, string | number | undefined>): Promise<T> {
  const query: Record<string, string> = { api_key: apiKey(), format: 'json' }
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined) query[k] = String(v)
  }
  try {
    return (await $fetch(`${MOENV_BASE}/${dataset}`, { query, timeout: 15_000 })) as T
  } catch (err) {
    throw createError({
      statusCode: 502,
      message: '無法連線至環境部環境資料開放平臺',
      cause: err
    })
  }
}

/**
 * 呼叫環境部開放資料 API v2（`/{dataset}?api_key=...&format=json&...`）。資料集代碼一律小寫
 * 加底線（如 `aqx_p_432`），跟 CWA 全大寫加連字號的慣例（`O-A0001-001`）不同。
 */
export function fetchMoenvDataset<T>(
  dataset: string,
  params: Record<string, string | number | undefined> = {}
): Promise<T> {
  return request<T>(dataset, params)
}

// 中央氣象署開放資料平台 client。金鑰只存在這裡（runtimeConfig，伺服器端），
// 絕不外流到任何回應內容或前端 bundle。

const DATASTORE_BASE = 'https://opendata.cwa.gov.tw/api/v1/rest/datastore'
const FILEAPI_BASE = 'https://opendata.cwa.gov.tw/fileapi/v1/opendataapi'

function apiKey(): string {
  const key = useRuntimeConfig().cwaApiKey
  if (!key) {
    throw createError({
      statusCode: 500,
      statusMessage: '伺服器尚未設定 CWA_API_KEY（NUXT_CWA_API_KEY 環境變數）'
    })
  }
  return key
}

async function request<T>(url: string, params: Record<string, string | number | undefined>): Promise<T> {
  const query: Record<string, string> = { Authorization: apiKey() }
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined) query[k] = String(v)
  }
  try {
    // fileapi 系列端點回傳 Content-Type: binary/octet-stream（即使內容其實是 JSON），
    // 強制指定 responseType 才不會被 ofetch 誤判成二進位內容
    return (await $fetch(url, { query, timeout: 15_000, responseType: 'json' })) as T
  } catch (err) {
    throw createError({
      statusCode: 502,
      statusMessage: '無法連線至中央氣象署開放資料平台',
      cause: err
    })
  }
}

/**
 * 呼叫 `/v1/rest/datastore/{datasetId}` 系列 API（絕大多數資料集，含預報、觀測、地震、颱風、警特報）。
 * `locationId`/`LocationName` 這類同名但意義不同的參數，呼叫端自行在 params 裡指定正確的 key。
 */
export function fetchDataset<T>(
  datasetId: string,
  params: Record<string, string | number | undefined> = {}
): Promise<T> {
  return request<T>(`${DATASTORE_BASE}/${datasetId}`, params)
}

/**
 * 呼叫 `/fileapi/v1/opendataapi/{datasetId}` 系列 API（雷達、衛星等圖資類資料集），
 * 回傳的 JSON 內含實際圖片的 S3 URL（cwaopendata.dataset.resource.ProductURL）。
 */
export function fetchFileApiDataset<T>(datasetId: string): Promise<T> {
  return request<T>(`${FILEAPI_BASE}/${datasetId}`, { downloadType: 'WEB', format: 'JSON' })
}

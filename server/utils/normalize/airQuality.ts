import type { AirQualityLevel, AirQualityStation } from '#shared/types'

// ---------------------------------------------------------------------------
// AQX_P_432：空氣品質指標（AQI），環境部環境資料開放平臺
// ---------------------------------------------------------------------------
//
// 節錄自實際回應（2026-09-15 實測）：這支資料集本身就帶 longitude/latitude/siteid，
// 不需要像原本設計那樣另外打 AQX_P_07（測站基本資料）join 座標——一開始只看過官方 API
// 使用手冊的範例截圖，只截到欄位前半段，誤以為沒有座標欄位，多繞了一層路。
// 另外，回應本身是最外層直接一個陣列（不是 CWA 或手冊截圖裡 AQX_P_488 那種
// `{records:[...]}` 包一層），這點也是實測才發現跟手冊範例不一致。
// publishtime 是 naive 的 "YYYY/MM/DD HH:MM:SS"（用斜線分隔，不是 CWA 常見的橫線），
// 實際是台北時間，一樣要自己補上 +08:00。

interface MoenvAqiRecord {
  sitename: string
  county: string
  aqi: string
  pollutant: string
  status: string
  so2: string
  co: string
  o3: string
  pm10: string
  'pm2.5': string
  no2: string
  longitude: string
  latitude: string
  publishtime: string
}
type MoenvAqiResponse = MoenvAqiRecord[]

// 環境部官方六級 AQI 分類的中文字串（跟 CWA 完全無關的另一套慣例）；實測目前只出現
// 良好/普通/對敏感族群不健康三種（當天空氣狀況使然），非常不健康/危害兩級沿用官方公告的
// 標準命名，未來實際出現時應對照真實資料再次確認字串是否吻合。''（測站維護或缺值）
// 對應 'unavailable'，不會出現在這個對照表裡、走 ?? 的 fallback。
const STATUS_LEVEL: Record<string, AirQualityLevel> = {
  良好: 'good',
  普通: 'moderate',
  對敏感族群不健康: 'unhealthy-sensitive',
  對所有族群不健康: 'unhealthy',
  非常不健康: 'very-unhealthy',
  危害: 'hazardous'
}

// 環境部這支資料集所有數值都是字串（即使是 "16" 這種整數），缺值用空字串表示（實測：
// 部分測站單一污染物讀值可以是空字串，即使 AQI 本身有值）——一律轉成 null，不是 NaN 或 0
function toNumberOrNull(v: string | undefined): number | null {
  if (v === undefined || v === '') return null
  const n = Number(v)
  return Number.isNaN(n) ? null : n
}

/** publishtime 是 naive 的 "YYYY/MM/DD HH:MM:SS"，實際是台北時間，補上 +08:00 才不會在
 *  UTC 容器部署後全部位移 8 小時（跟 CWA 系列已知的同一類陷阱，只是這裡用斜線分隔日期）。 */
function toTaipeiIso(naive: string): string {
  const [datePart, timePart] = naive.split(' ')
  return `${datePart!.replaceAll('/', '-')}T${timePart}+08:00`
}

export function normalizeAirQualityStations(raw: MoenvAqiResponse): AirQualityStation[] {
  return raw.map((r) => ({
    siteName: r.sitename,
    county: r.county,
    coordinates: { lat: Number(r.latitude), lon: Number(r.longitude) },
    aqi: toNumberOrNull(r.aqi),
    level: STATUS_LEVEL[r.status] ?? 'unavailable',
    majorPollutant: r.pollutant || null,
    pm25: toNumberOrNull(r['pm2.5']),
    pm10: toNumberOrNull(r.pm10),
    o3: toNumberOrNull(r.o3),
    so2: toNumberOrNull(r.so2),
    co: toNumberOrNull(r.co),
    no2: toNumberOrNull(r.no2),
    publishTime: toTaipeiIso(r.publishtime)
  }))
}

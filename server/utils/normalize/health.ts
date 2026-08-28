import type { HeatInjuryLevel, HeatInjuryReading, HeatInjuryTownForecast } from '#shared/types'

// ---------------------------------------------------------------------------
// M-A0085-001：健康氣象-熱傷害指數及警示，全台各鄉鎮五日逐三小時預報
// ---------------------------------------------------------------------------

interface CwaHeatWeatherElements {
  HeatInjuryIndex: number
  HeatInjuryWarning: string
}
interface CwaHeatTime {
  IssueTime: string
  WeatherElements: CwaHeatWeatherElements
}
interface CwaHeatLocation {
  TownName: string
  Geocode: string
  Latitude: string
  Longitude: string
  Time: CwaHeatTime[]
}
interface CwaHeatCounty {
  CountyName: string
  Location: CwaHeatLocation[]
}
interface CwaHeatResponse {
  records: { Locations: CwaHeatCounty[] }
}

// CWA 只用這五種字串（含空字串代表「無」），實測全台回應涵蓋過這五種，見 __tests__/health.test.ts
const WARNING_LEVEL: Record<string, HeatInjuryLevel> = {
  '': 'none',
  注意: 'caution',
  警戒: 'watch',
  危險: 'danger',
  高危險: 'high-danger'
}

/** IssueTime 是 naive 的 "YYYY-MM-DD HH:MM:SS"，實際是台北時間，補上 +08:00 才不會在
 *  UTC 容器部署後全部位移 8 小時（跟 warning.ts 處理 validTime 是同一個既有陷阱）。 */
function toTaipeiIso(naive: string): string {
  return `${naive.replace(' ', 'T')}+08:00`
}

/** 實測 CWA 回傳的 Time 陣列在鄉鎮之間順序不一致（同一組 39 個時間點，但排列順序每個鄉鎮
 *  各自打散，不是單純的日期字串排序問題）——若直接照原始順序用陣列 index 在多個鄉鎮之間對齊
 *  （choropleth 時間軸就是這樣做的），會把不同鄉鎮的不同時間點誤判成「同一格」。明確依時間
 *  重新排序，讓每個鄉鎮回傳的 readings 陣列本身照時間遞增，呼叫端不需要、也不應該自己再排。 */
function toReadings(times: CwaHeatTime[]): HeatInjuryReading[] {
  return times
    .map((t) => ({
      time: toTaipeiIso(t.IssueTime),
      index: t.WeatherElements.HeatInjuryIndex,
      level: WARNING_LEVEL[t.WeatherElements.HeatInjuryWarning] ?? 'none'
    }))
    .sort((a, b) => a.time.localeCompare(b.time))
}

function toTown(county: string, loc: CwaHeatLocation): HeatInjuryTownForecast {
  return {
    county,
    town: loc.TownName,
    coordinates: { lat: Number(loc.Latitude), lon: Number(loc.Longitude) },
    readings: toReadings(loc.Time)
  }
}

/** 全台鄉鎮摘要（choropleth + 時間軸用）：不帶 CountyName 時 CWA 回傳全部 22 縣市、368 鄉鎮 */
export function normalizeHeatInjurySummary(raw: CwaHeatResponse): HeatInjuryTownForecast[] {
  return raw.records.Locations.flatMap((c) => c.Location.map((loc) => toTown(c.CountyName, loc)))
}

/** 單一鄉鎮明細：呼叫端帶 CountyName + TownName 篩選，只會有一個縣市、一個鄉鎮 */
export function normalizeHeatInjuryTown(raw: CwaHeatResponse): HeatInjuryTownForecast | null {
  const county = raw.records.Locations[0]
  const loc = county?.Location[0]
  if (!county || !loc) return null
  return toTown(county.CountyName, loc)
}

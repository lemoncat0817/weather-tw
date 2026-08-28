import type {
  ClimateComparison,
  ClimateDailyRainfall,
  ClimateDailySummary,
  ClimateExtras,
  ClimateHourlyReading,
  ClimateMonthNormal,
  ClimateMonthPrecipitationNormal
} from '#shared/types'

// C-B0024-001：近期逐時觀測 + 最新一天的日彙總。雖然資料集名稱是「30 天」，實測目前每次呼叫
// 只會回傳最新一天的逐時資料（24 筆）跟一筆日統計，不是完整 30 天序列——這裡如實反映實際拿得到的資料，
// 不假裝有更長的序列。
interface CwaDailyWeatherElements {
  AirPressure?: string
  AirTemperature?: string
  RelativeHumidity?: string
  Precipitation?: string
}
interface CwaDailyObsTime {
  weatherElements: CwaDailyWeatherElements
  DateTime: string
}
interface CwaDailyStat {
  Date: string
  Maximum: number
  Minimum: number
  Mean: number
}
interface CwaRecentResponse {
  records: {
    location: Array<{
      station: { StationID: string; StationName: string }
      stationObsTimes: { stationObsTime: CwaDailyObsTime[] }
      stationObsStatistics?: { AirTemperature?: { daily: CwaDailyStat[] } }
    }>
  }
}

// C-B0027-001：1991-2020 月平均氣候值。跟上面的 C-B0024-001 結構完全不同層級（records.data.surfaceObs
// 而不是 records.location），是同一個「氣象站觀測」主題下兩個資料集在 CWA 那邊各自演化出不同結構的
// 又一個例子——這正是這一層反腐層存在的理由。
interface CwaMonthlyTempStat {
  Month: string
  Mean: string
  Maximum: string
  Minimum: string
}
interface CwaMonthlyPrecipitationStat {
  Month: string
  Accumulation: string
}
interface CwaNormalResponse {
  records: {
    data: {
      surfaceObs: {
        location: Array<{
          station: { StationID: string; StationName: string }
          stationObsStatistics: {
            AirTemperature: {
              StationStartYear: number
              StationEndYear: number
              monthly: CwaMonthlyTempStat[]
            }
            // 跟 AirTemperature 是同一個 stationObsStatistics 底下的另一個類別，結構同構
            // （StationStartYear/EndYear + monthly[]），只是欄位換成 Accumulation
            Precipitation?: {
              monthly: CwaMonthlyPrecipitationStat[]
            }
          }
        }>
      }
    }
  }
}

// O-A0005-001：每日紫外線指數最大值。跟即時 UV（O-A0003-001 已經在用）是不同角度——
// 這是「今天峰值」，不是「現在這一刻」，兩者刻意分開存在 ObservationReading.uvIndex 跟這裡
interface CwaMaxUvResponse {
  records: {
    weatherElement: {
      location: Array<{ StationID: string; UVIndex: number }>
    }
  }
}

/** 呼叫端需帶 StationID 篩選只剩一筆；找不到（例如非有人測站沒有這組資料）回傳 null */
export function normalizeMaxUvIndex(raw: CwaMaxUvResponse): number | null {
  return raw.records?.weatherElement?.location?.[0]?.UVIndex ?? null
}

// C-B0025-001：地面測站每日雨量。跟 C-B0024-001（近期逐時）結構相似但不完全相同
// （這裡的 Date 是純日期沒有時間，weatherElements 只有 Precipitation 一個欄位）
interface CwaDailyRainStat {
  Date: string
  weatherElements: { Precipitation: string }
}
interface CwaDailyRainResponse {
  records: {
    location: Array<{
      station: { StationID: string }
      stationObsTimes: { stationObsTime: CwaDailyRainStat[] }
    }>
  }
}

function num(v: string | undefined): number {
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

function toHourly(times: CwaDailyObsTime[]): ClimateHourlyReading[] {
  return times.map((t) => ({
    time: t.DateTime,
    temperature: num(t.weatherElements.AirTemperature),
    relativeHumidity: t.weatherElements.RelativeHumidity ? num(t.weatherElements.RelativeHumidity) : null,
    precipitation: t.weatherElements.Precipitation && t.weatherElements.Precipitation !== 'T' ? num(t.weatherElements.Precipitation) : null
  }))
}

function toYesterday(stat: CwaDailyStat | undefined): ClimateDailySummary | null {
  if (!stat) return null
  return { date: stat.Date, meanTemperature: stat.Mean, maxTemperature: stat.Maximum, minTemperature: stat.Minimum }
}

function toMonthlyNormals(monthly: CwaMonthlyTempStat[]): ClimateMonthNormal[] {
  return monthly
    .map((m) => ({
      month: Number(m.Month),
      meanTemperature: num(m.Mean),
      maxTemperature: num(m.Maximum),
      minTemperature: num(m.Minimum)
    }))
    .sort((a, b) => a.month - b.month)
}

function toMonthlyPrecipitationNormals(monthly: CwaMonthlyPrecipitationStat[]): ClimateMonthPrecipitationNormal[] {
  return monthly
    .map((m) => ({ month: Number(m.Month), accumulationMm: num(m.Accumulation) }))
    .sort((a, b) => a.month - b.month)
}

/** trace（"T"）算成 0，理由見 shared/types 的 ClimateDailyRainfall 註解 */
function toDailyRainfall(times: CwaDailyRainStat[]): ClimateDailyRainfall[] {
  return times.map((t) => ({
    date: t.Date,
    precipitationMm: t.weatherElements.Precipitation === 'T' ? 0 : num(t.weatherElements.Precipitation)
  }))
}

// 高雄現站 467441 是 2022 從舊前鎮站 467440 遷到楠梓的；C-B0027-001 的 1991-2020 月平均
// 仍掛在舊站號上（CWA 氣候月平均頁自己也註明「高雄為舊高雄站(467440)之氣候平均值」）。
// 近期觀測 C-B0024-001 則只有現站。同一站號打兩支會兩邊都空、整頁 404。
const NORMAL_STATION_ID_BY_CURRENT: Readonly<Record<string, string>> = {
  '467441': '467440'
}

export function climateNormalStationId(stationId: string): string {
  return NORMAL_STATION_ID_BY_CURRENT[stationId] ?? stationId
}

export function normalizeClimateComparison(recentRaw: CwaRecentResponse, normalRaw: CwaNormalResponse): ClimateComparison | null {
  const recentLoc = recentRaw.records?.location?.[0]
  const normalLoc = normalRaw.records?.data?.surfaceObs?.location?.[0]
  if (!recentLoc || !normalLoc) return null

  const airTemp = normalLoc.stationObsStatistics?.AirTemperature
  if (!airTemp) return null

  return {
    stationId: recentLoc.station.StationID,
    stationName: recentLoc.station.StationName,
    normalYears: [airTemp.StationStartYear, airTemp.StationEndYear],
    monthlyNormals: toMonthlyNormals(airTemp.monthly),
    recentHourly: toHourly(recentLoc.stationObsTimes?.stationObsTime ?? []),
    yesterday: toYesterday(recentLoc.stationObsStatistics?.AirTemperature?.daily?.[0])
  }
}

/**
 * 雨量常態＋今年每日雨量＋今日紫外線峰值，刻意獨立於 normalizeClimateComparison 之外——
 * 拆分的理由（連同 C-B0025-001／O-A0005-001 比另外兩支上游更常慢/不穩定的說明）見
 * shared/types 的 ClimateExtras 註解。monthlyPrecipitationNormals 雖然來自跟溫度常態
 * 同一支 normalRaw，但因為是「補充資訊」語意上歸在這裡，不歸在 ClimateComparison。
 */
export function normalizeClimateExtras(
  normalRaw: CwaNormalResponse,
  dailyRainRaw?: CwaDailyRainResponse,
  maxUvRaw?: CwaMaxUvResponse
): ClimateExtras {
  const precipitationNormal = normalRaw.records?.data?.surfaceObs?.location?.[0]?.stationObsStatistics?.Precipitation
  const dailyRainTimes = dailyRainRaw?.records?.location?.[0]?.stationObsTimes?.stationObsTime

  return {
    monthlyPrecipitationNormals: precipitationNormal ? toMonthlyPrecipitationNormals(precipitationNormal.monthly) : [],
    dailyRainfall: dailyRainTimes ? toDailyRainfall(dailyRainTimes) : [],
    todayMaxUvIndex: maxUvRaw ? normalizeMaxUvIndex(maxUvRaw) : null
  }
}

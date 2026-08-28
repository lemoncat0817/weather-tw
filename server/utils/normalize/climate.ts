import type { ClimateComparison, ClimateDailySummary, ClimateHourlyReading, ClimateMonthNormal } from '#shared/types'

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
          }
        }>
      }
    }
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

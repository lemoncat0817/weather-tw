import type { Observation } from '#shared/types'

interface CwaCoordinate {
  CoordinateName: string
  StationLatitude: string
  StationLongitude: string
}
interface CwaGeoInfo {
  CountyName: string
  TownName: string
  CountyCode: string
  TownCode: string
  StationAltitude: string
  Coordinates: CwaCoordinate[]
}
interface CwaStationBase {
  StationName: string
  StationId: string
  ObsTime: { DateTime: string }
  GeoInfo: CwaGeoInfo
}

interface CwaOccurredAt {
  WindDirection?: string
  DateTime?: string
}

/** O-A0001-001（自動氣象站）與 O-A0003-001（10 分鐘綜觀氣象）共用的欄位形狀 */
interface CwaWeatherStation extends CwaStationBase {
  WeatherElement: {
    Weather?: string
    VisibilityDescription?: string
    SunshineDuration?: string
    AirTemperature?: string
    RelativeHumidity?: string
    WindSpeed?: string
    AirPressure?: string
    UVIndex?: string
    Now?: { Precipitation?: string }
    GustInfo?: { PeakGustSpeed?: string; Occurred_at?: CwaOccurredAt }
    DailyExtreme?: {
      DailyHigh?: { TemperatureInfo?: { AirTemperature?: string; Occurred_at?: CwaOccurredAt } }
      DailyLow?: { TemperatureInfo?: { AirTemperature?: string; Occurred_at?: CwaOccurredAt } }
    }
  }
}

/** O-A0002-001（雨量站）。時距欄位大小寫不一致是 CWA 原始資料的樣子，不是筆誤——
 *  Past1hr/Past12hr/Past24hr 是小寫 hr，唯獨 Past6Hr 是大寫 H，見 __tests__/observation.test.ts。 */
interface CwaRainStation extends CwaStationBase {
  RainfallElement: {
    Now?: { Precipitation?: string }
    Past10Min?: { Precipitation?: string }
    Past1hr?: { Precipitation?: string }
    Past3hr?: { Precipitation?: string }
    Past6Hr?: { Precipitation?: string }
    Past12hr?: { Precipitation?: string }
    Past24hr?: { Precipitation?: string }
    Past2days?: { Precipitation?: string }
    Past3days?: { Precipitation?: string }
  }
}

function coordinatesOf(geo: CwaGeoInfo): { lat: number; lon: number } {
  const wgs84 = geo.Coordinates.find((c) => c.CoordinateName === 'WGS84') ?? geo.Coordinates[0]
  return { lat: Number(wgs84?.StationLatitude ?? 0), lon: Number(wgs84?.StationLongitude ?? 0) }
}

/** -99 / -990 / 'X' / 'T' 都是 CWA 對「缺值、儀器故障、雨跡」的慣用標記，一律視為無資料 */
function toReading(value: string | undefined): number | null {
  if (value === undefined) return null
  const n = Number(value)
  if (!Number.isFinite(n)) return null
  if (n <= -90) return null
  return n
}

export function normalizeWeatherStation(s: CwaWeatherStation): Observation {
  const we = s.WeatherElement
  const high = we.DailyExtreme?.DailyHigh?.TemperatureInfo
  const low = we.DailyExtreme?.DailyLow?.TemperatureInfo

  return {
    stationId: s.StationId,
    stationName: s.StationName,
    county: s.GeoInfo.CountyName,
    town: s.GeoInfo.TownName,
    countyCode: s.GeoInfo.CountyCode,
    townCode: s.GeoInfo.TownCode,
    altitude: toReading(s.GeoInfo.StationAltitude),
    coordinates: coordinatesOf(s.GeoInfo),
    obsTime: s.ObsTime.DateTime,
    reading: {
      temperature: toReading(we.AirTemperature),
      relativeHumidity: toReading(we.RelativeHumidity),
      precipitation: toReading(we.Now?.Precipitation),
      precipitationAccumulation: null, // 只有雨量站有這組時距欄位
      windSpeed: toReading(we.WindSpeed),
      windDirection: null,
      airPressure: toReading(we.AirPressure),
      uvIndex: toReading(we.UVIndex),
      peakGust: we.GustInfo
        ? {
            speed: toReading(we.GustInfo.PeakGustSpeed),
            direction: toReading(we.GustInfo.Occurred_at?.WindDirection),
            time: we.GustInfo.Occurred_at?.DateTime ?? null
          }
        : null,
      dailyExtreme:
        high || low
          ? {
              highTemperature: toReading(high?.AirTemperature),
              highTime: high?.Occurred_at?.DateTime ?? null,
              lowTemperature: toReading(low?.AirTemperature),
              lowTime: low?.Occurred_at?.DateTime ?? null
            }
          : null,
      weatherDescription: we.Weather ?? null,
      visibility: we.VisibilityDescription ?? null,
      sunshineDuration: toReading(we.SunshineDuration)
    }
  }
}

export function normalizeRainStation(s: CwaRainStation): Observation {
  const r = s.RainfallElement
  return {
    stationId: s.StationId,
    stationName: s.StationName,
    county: s.GeoInfo.CountyName,
    town: s.GeoInfo.TownName,
    countyCode: s.GeoInfo.CountyCode,
    townCode: s.GeoInfo.TownCode,
    altitude: toReading(s.GeoInfo.StationAltitude),
    coordinates: coordinatesOf(s.GeoInfo),
    obsTime: s.ObsTime.DateTime,
    reading: {
      temperature: null,
      relativeHumidity: null,
      precipitation: toReading(r.Now?.Precipitation),
      precipitationAccumulation: {
        past10min: toReading(r.Past10Min?.Precipitation),
        past1hr: toReading(r.Past1hr?.Precipitation),
        past3hr: toReading(r.Past3hr?.Precipitation),
        past6hr: toReading(r.Past6Hr?.Precipitation),
        past12hr: toReading(r.Past12hr?.Precipitation),
        past24hr: toReading(r.Past24hr?.Precipitation),
        past2days: toReading(r.Past2days?.Precipitation),
        past3days: toReading(r.Past3days?.Precipitation)
      },
      windSpeed: null,
      windDirection: null,
      airPressure: null,
      uvIndex: null,
      peakGust: null,
      dailyExtreme: null,
      weatherDescription: null,
      visibility: null,
      sunshineDuration: null
    }
  }
}

export function normalizeWeatherStations(raw: { records: { Station: CwaWeatherStation[] } }): Observation[] {
  return raw.records.Station.map(normalizeWeatherStation)
}

export function normalizeRainStations(raw: { records: { Station: CwaRainStation[] } }): Observation[] {
  return raw.records.Station.map(normalizeRainStation)
}

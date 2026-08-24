import type { Observation } from '#shared/types'

interface CwaCoordinate {
  CoordinateName: string
  StationLatitude: string
  StationLongitude: string
}
interface CwaGeoInfo {
  CountyName: string
  TownName: string
  Coordinates: CwaCoordinate[]
}
interface CwaStationBase {
  StationName: string
  StationId: string
  ObsTime: { DateTime: string }
  GeoInfo: CwaGeoInfo
}

/** O-A0001-001（自動氣象站）與 O-A0003-001（10 分鐘綜觀氣象）共用的欄位形狀 */
interface CwaWeatherStation extends CwaStationBase {
  WeatherElement: {
    AirTemperature?: string
    RelativeHumidity?: string
    WindSpeed?: string
    AirPressure?: string
    UVIndex?: string
    Now?: { Precipitation?: string }
  }
}

/** O-A0002-001（雨量站） */
interface CwaRainStation extends CwaStationBase {
  RainfallElement: {
    Now?: { Precipitation?: string }
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
  return {
    stationId: s.StationId,
    stationName: s.StationName,
    county: s.GeoInfo.CountyName,
    town: s.GeoInfo.TownName,
    coordinates: coordinatesOf(s.GeoInfo),
    obsTime: s.ObsTime.DateTime,
    reading: {
      temperature: toReading(s.WeatherElement.AirTemperature),
      relativeHumidity: toReading(s.WeatherElement.RelativeHumidity),
      precipitation: toReading(s.WeatherElement.Now?.Precipitation),
      windSpeed: toReading(s.WeatherElement.WindSpeed),
      windDirection: null,
      airPressure: toReading(s.WeatherElement.AirPressure),
      uvIndex: toReading(s.WeatherElement.UVIndex)
    }
  }
}

export function normalizeRainStation(s: CwaRainStation): Observation {
  return {
    stationId: s.StationId,
    stationName: s.StationName,
    county: s.GeoInfo.CountyName,
    town: s.GeoInfo.TownName,
    coordinates: coordinatesOf(s.GeoInfo),
    obsTime: s.ObsTime.DateTime,
    reading: {
      temperature: null,
      relativeHumidity: null,
      precipitation: toReading(s.RainfallElement.Now?.Precipitation),
      windSpeed: null,
      windDirection: null,
      airPressure: null,
      uvIndex: null
    }
  }
}

export function normalizeWeatherStations(raw: { records: { Station: CwaWeatherStation[] } }): Observation[] {
  return raw.records.Station.map(normalizeWeatherStation)
}

export function normalizeRainStations(raw: { records: { Station: CwaRainStation[] } }): Observation[] {
  return raw.records.Station.map(normalizeRainStation)
}

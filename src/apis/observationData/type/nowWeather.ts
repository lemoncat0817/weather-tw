// 現在天氣觀測報告的type
export interface Coordinates {
  CoordinateName: string
  CoordinateFormat: string
  StationLatitude: number
  StationLongitude: number
}
export interface ObsTime {
  DateTime: string
}
export interface GeoInfo {
  Coordinates: Coordinates[]
  StationAltitude: string
  CountyName: string
  TownName: string
  CountyCode: string
  TownCode: string
}
export interface Now {
  Precipitation: number
}
export interface Max10MinAverage {
  WindSpeed: number
  Occurred_at: {
    WindDirection: number
    DateTime: string
  }
}
export interface GustInfo {
  PeakGustSpeed: number
  Occurred_at: {
    WindDirection: number
    DateTime: string
  }
}
export interface TemperatureInfo {
  AirTemperature: number
  Occurred_at: {
    DateTime: string
  }
}
export interface DailyHigh {
  TemperatureInfo: TemperatureInfo
}
export interface DailyLow {
  TemperatureInfo: TemperatureInfo
}
export interface DailyExtreme {
  DailyHigh: DailyHigh
  DailyLow: DailyLow
}
export interface WeatherElement {
  Weather: string
  VisibilityDescription: string
  SunshineDuration: number
  Now: Now
  WindDirection: number
  WindSpeed: number
  AirTemperature: number
  RelativeHumidity: number
  AirPressure: number
  UVIndex: number
  Max10MinAverage: Max10MinAverage
  GustInfo: GustInfo
  DailyExtreme: DailyExtreme
}
export interface Station {
  StationName: string
  StationId: string
  ObsTime: ObsTime
  GeoInfo: GeoInfo
  WeatherElement: WeatherElement
}
export interface Result {
  resource_id: string
  fields: {
    id: string
    type: string
  }[]
}
export interface Records {
  Station: Station[]
}
export interface nowWeatherData {
  data: {
    success: string
    result: Result
    records: Records
  }
}

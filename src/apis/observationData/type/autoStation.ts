// 自動氣象站-氣象觀察資料type
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

export interface GustOccurred {
  WindDirection: number
  DateTime: string
}

export interface GustInfo {
  PeakGustSpeed: number
  Occurred_at: GustOccurred
}

export interface TemperatureOccurred {
  DateTime: string
}

export interface TemperatureInfo {
  AirTemperature: number
  Occurred_at: TemperatureOccurred
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
  Now: Now
  WindDirection: number
  WindSpeed: number
  AirTemperature: number
  RelativeHumidity: number
  AirPressure: number
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

export interface autoStationWeatherData {
  data: {
    success: string
    result: object
    records: {
      Station: Station[]
    }
  }
}

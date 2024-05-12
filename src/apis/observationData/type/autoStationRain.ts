// 自動雨量站-雨量觀察資料type
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

export interface RainfallInfo {
  Precipitation: number
}

export interface RainfallElement {
  Now: RainfallInfo
  Past10Min: RainfallInfo
  Past1hr: RainfallInfo
  Past3hr: RainfallInfo
  Past6Hr: RainfallInfo
  Past12hr: RainfallInfo
  Past24hr: RainfallInfo
  Past2days: RainfallInfo
  Past3days: RainfallInfo
}

export interface Station {
  StationName: string
  StationId: string
  Maintainer: string
  ObsTime: ObsTime
  GeoInfo: GeoInfo
  RainfallElement: RainfallElement
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

export interface autoStationRainWeatherData {
  data: {
    success: string
    result: Result
    records: Records
  }
}

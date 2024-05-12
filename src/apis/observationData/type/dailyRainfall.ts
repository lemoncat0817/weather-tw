// 每日雨量-地面測站每日雨量資料的type
export interface WeatherElement {
  Precipitation: string
}

export interface StationObsTime {
  weatherElements: WeatherElement
  Date: string
}

export interface Station {
  StationID: string
  StationName: string
  StationNameEN: string
  StationAttribute: string
}

export interface StationData {
  station: Station
  stationObsTimes: {
    stationObsTime: StationObsTime[]
  }
}

export interface Field {
  id: string
  type: string
}

export interface Result {
  resource_id: string
  fields: Field[]
}

export interface Records {
  location: StationData[]
}

export interface dailyRainfallData {
  data: {
    success: string
    result: Result
    records: Records
  }
}

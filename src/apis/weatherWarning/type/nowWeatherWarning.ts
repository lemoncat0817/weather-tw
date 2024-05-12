// 各別縣市地區目前之天氣警特報情形的type
export interface HazardInfo {
  language: string
  phenomena: string
  significance: string
}

export interface ValidTime {
  startTime: string
  endTime: string
}

export interface Hazard {
  info: HazardInfo
  validTime: ValidTime
}

export interface HazardConditions {
  hazards: Hazard[]
}

export interface LocationRecord {
  locationName: string
  geocode: number
  hazardConditions: HazardConditions
}

export interface Records {
  location: LocationRecord[]
}

export interface Field {
  id: string
  type: string
}

export interface Result {
  resource_id: string
  fields: Field[]
}

export interface nowWeatherWarningData {
  data: {
    success: string
    result: Result
    records: Records
  }
}

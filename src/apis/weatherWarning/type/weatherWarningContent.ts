// 各別天氣警特報之內容及所影響之區域的type
export interface DatasetInfo {
  datasetDescription: string
  datasetLanguage: string
  validTime: {
    startTime: string
    endTime: string
  }
  issueTime: string
  update: string
}

export interface Content {
  contentLanguage: string
  contentText: string
}

export interface location {
  locationName?: any
  length?: any
}

export interface affectedAreas {
  location: location
}

export interface Info {
  language: string
  phenomena: string
  significance: string
  affectedAreas?: affectedAreas
}

export interface Hazard {
  info?: Info
}

export interface hazards {
  hazard?: Hazard[]
}

export interface HazardConditions {
  hazards?: hazards
}

export interface Record {
  datasetInfo: DatasetInfo
  contents: { content: Content }
  hazardConditions?: HazardConditions
}

export interface Records {
  record: Record[]
}

export interface Field {
  id: string
  type: string
}

export interface Result {
  resource_id: string
  fields: Field[]
}

export interface weatherWarningContentData {
  data: {
    success: string
    result: Result
    records: Records
  }
}

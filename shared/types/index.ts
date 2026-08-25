// 前後端共用的領域型別：CWA 原始回應的巢狀結構永遠不外流到這裡以外。
// server/utils/normalize/** 負責把 CWA 結構轉成這些乾淨型別；
// app/ 底下只看得到、只該用到這些型別。

export interface Coordinates {
  lat: number
  lon: number
}

/** 最小必要的 GeoJSON 型別（避免為了型別多裝一個執行期沒用到的套件） */
export interface GeoPoint {
  type: 'Point'
  coordinates: [lon: number, lat: number]
}
export interface GeoLineString {
  type: 'LineString'
  coordinates: Array<[lon: number, lat: number]>
}
export interface GeoPolygon {
  type: 'Polygon'
  coordinates: Array<Array<[lon: number, lat: number]>>
}
export interface GeoFeature<G, P> {
  type: 'Feature'
  geometry: G
  properties: P
}
export interface GeoFeatureCollection<G, P> {
  type: 'FeatureCollection'
  features: Array<GeoFeature<G, P>>
}

// ---------------------------------------------------------------------------
// 天氣預報
// ---------------------------------------------------------------------------

/** 今明 36 小時預報的一個時段（F-C0032-001，縣市層級） */
export interface ThirtySixHourPeriod {
  startTime: string
  endTime: string
  weather: string
  weatherCode: string
  pop: number | null // 降雨機率 %
  minTemperature: number
  maxTemperature: number
  comfortIndex: string
}

export interface ThirtySixHourForecast {
  locationName: string
  periods: ThirtySixHourPeriod[]
}

/** 鄉鎮逐時預報的一筆（F-D0047-093，3 天版，locationId 為奇數 dataset） */
export interface TownForecastHour {
  time: string
  temperature: number
  dewPoint: number
  relativeHumidity: number
  apparentTemperature: number
  comfortIndex: number
  comfortDescription: string
  windSpeed: number
  windDirection: string
  pop: number | null // 3 小時降雨機率 %
  weatherCode: string
  weather: string
  description: string
}

/** 鄉鎮延伸預報的一筆，6 小時一格、涵蓋 7 天（F-D0047-093，週版，locationId 為偶數 dataset） */
export interface TownForecastPeriod {
  startTime: string
  endTime: string
  avgTemperature: number
  maxTemperature: number
  minTemperature: number
  maxApparentTemperature: number
  minApparentTemperature: number
  pop: number | null // 12 小時降雨機率 %
  weatherCode: string
  weather: string
  uvIndex: number | null
  description: string
}

export interface TownForecast {
  county: string
  town: string
  geocode: string
  coordinates: Coordinates
  hourly: TownForecastHour[]
  extended: TownForecastPeriod[]
  sunrise?: string
  sunset?: string
}

/** 全台鄉鎮預報摘要（choropleth 用），只取「目前」這一個時間點的代表值，不含完整逐時序列 */
export interface TownSummary {
  county: string
  town: string
  coordinates: Coordinates
  temperature: number
  weatherCode: string
  weather: string
  pop: number | null
}

// ---------------------------------------------------------------------------
// 觀測資料
// ---------------------------------------------------------------------------

export interface ObservationReading {
  temperature: number | null
  relativeHumidity: number | null
  precipitation: number | null
  windSpeed: number | null
  windDirection: number | null
  airPressure: number | null
  uvIndex: number | null
}

export interface Observation {
  stationId: string
  stationName: string
  county: string
  town: string
  coordinates: Coordinates
  obsTime: string
  reading: ObservationReading
}

// ---------------------------------------------------------------------------
// 雷達
// ---------------------------------------------------------------------------

export interface RadarFrame {
  /** 影像對應的觀測時間（若上游未提供，退回抓取時間） */
  time: string
  imageUrl: string
  /** [west, south, east, north]，經緯度十進位度 */
  bounds: [number, number, number, number]
}

// ---------------------------------------------------------------------------
// 颱風
// ---------------------------------------------------------------------------

export interface TyphoonQuadrantRadii {
  ne: number | null
  se: number | null
  sw: number | null
  nw: number | null
}

export interface TyphoonFixPoint {
  time: string
  position: Coordinates
  maxWindSpeed: number | null
  maxGustSpeed: number | null
  pressure: number | null
  movingSpeed: number | null
  movingDirection: string | null
  radius15ms: number | null
  radius25ms: number | null
  quadrantRadii15ms: TyphoonQuadrantRadii | null
}

export interface TyphoonForecastPoint extends TyphoonFixPoint {
  forecastHour: number
  /** 未來位置落在此半徑內的機率為 70%（公里），null 代表上游未提供 */
  probabilityRadius70: number | null
}

export interface Typhoon {
  id: string
  year: number
  name: string
  nameZh: string
  /** 歷史觀測路徑，由舊到新 */
  track: TyphoonFixPoint[]
  /** 未來預報路徑，由近到遠 */
  forecast: TyphoonForecastPoint[]
  /** track 轉成的 GeoJSON LineString，方便地圖直接畫線 */
  trackLine: GeoFeature<GeoLineString, { kind: 'track' }>
  forecastLine: GeoFeature<GeoLineString, { kind: 'forecast' }>
  /** 由每個預報點的 probabilityRadius70 外包絡生成的不確定性錐，可能因資料不足而缺席 */
  probabilityCone: GeoFeature<GeoPolygon, { kind: 'probabilityCone' }> | null
}

// ---------------------------------------------------------------------------
// 地震
// ---------------------------------------------------------------------------

export interface EarthquakeShakingArea {
  county: string
  areaDescription: string
  intensity: string
}

export interface Earthquake {
  id: string
  originTime: string
  reportContent: string
  reportColor: string
  magnitude: number
  magnitudeType: string
  depthKm: number
  epicenter: Coordinates
  epicenterDescription: string
  maxIntensity: string
  shakingAreas: EarthquakeShakingArea[]
  shakemapImageUrl: string | null
}

// ---------------------------------------------------------------------------
// 警特報
// ---------------------------------------------------------------------------

export interface WeatherHazard {
  phenomena: string
  significance: string
  startTime: string | null
  endTime: string | null
}

export interface CountyWarning {
  county: string
  hazards: WeatherHazard[]
}

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

/**
 * 雨量站（O-A0002-001）專屬的累積雨量各時距快照；氣象站（O-A0001/O-A0003）只回報「現在」
 * 這一個瞬時值，沒有這組時距欄位，所以在氣象站永遠是 null。
 */
export interface PrecipitationAccumulation {
  past10min: number | null
  past1hr: number | null
  past3hr: number | null
  past6hr: number | null
  past12hr: number | null
  past24hr: number | null
  past2days: number | null
  past3days: number | null
}

/** 陣風：觀測時窗內出現的瞬間最大值，跟「現在」風速是兩回事 */
export interface PeakGust {
  speed: number | null
  direction: number | null
  time: string | null
}

/** 當日（自 00:00 起算）觀測到的最高/最低溫及發生時刻 */
export interface DailyExtreme {
  highTemperature: number | null
  highTime: string | null
  lowTemperature: number | null
  lowTime: string | null
}

export interface ObservationReading {
  temperature: number | null
  relativeHumidity: number | null
  precipitation: number | null
  precipitationAccumulation: PrecipitationAccumulation | null
  windSpeed: number | null
  windDirection: number | null
  airPressure: number | null
  uvIndex: number | null
  peakGust: PeakGust | null
  dailyExtreme: DailyExtreme | null
  weatherDescription: string | null
  visibility: string | null
  sunshineDuration: number | null
}

export interface Observation {
  stationId: string
  stationName: string
  county: string
  town: string
  countyCode: string
  townCode: string
  /** 測站海拔（公尺），山區測站的溫度差異多半能由此解釋 */
  altitude: number | null
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
// 衛星雲圖
// ---------------------------------------------------------------------------

/** 跟 RadarFrame 形狀完全相同（時間 + 影像網址 + 經緯度範圍），衛星圖層另外命名只是語意上
 *  跟雷達分開，不代表結構有差異——兩者都是「單張定期更新的疊圖影像」這同一種東西。 */
export type ImageOverlayFrame = RadarFrame

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

export interface TyphoonAdvisorySection {
  title: string
  value: string
}

/**
 * 颱風警報公告本身（W-C0034-001），跟上面的 Typhoon（W-C0034-005，路徑幾何）是互補的兩個角度：
 * Typhoon 答「颱風現在/未來在哪裡」，這個答「現在是第幾報、海上還是陸上警報、CWA 原文怎麼說」。
 * 海上、陸上警報可能同時作用中，故上游本來就是陣列。
 */
export interface TyphoonAdvisory {
  headline: string
  /** 'SEA' | 'LAND'，CWA 原始值直接保留，其餘未知值也原樣帶出 */
  category: string
  bulletinNumber: string
  typhoonNo: string
  typhoonName: string
  typhoonNameZh: string
  severity: CapSeverity
  effective: string
  expires: string
  sections: TyphoonAdvisorySection[]
}

// ---------------------------------------------------------------------------
// 地震
// ---------------------------------------------------------------------------

export interface EarthquakeShakingArea {
  county: string
  areaDescription: string
  intensity: string
}

/** 測站級實測值（E-A0015-001／E-A0016-001 的 EqStation），比縣市彙總的 EarthquakeShakingArea
 *  精細——位置是實際測站座標，不是行政區代表點。 */
export interface EarthquakeStation {
  stationId: string
  stationName: string
  position: Coordinates
  seismicIntensity: string
  epicenterDistance: number
  /** 尖峰地表加速度（gal）；部分測站（多半是較舊、非強震儀站）沒有這組數值 */
  pga: number | null
  /** 尖峰地表速度（kine）；同上，可能缺 */
  pgv: number | null
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
  stations: EarthquakeStation[]
  shakemapImageUrl: string | null
}

// ---------------------------------------------------------------------------
// 歷史趨勢／氣候比較
// ---------------------------------------------------------------------------

/** 某月的氣候平均值常態（C-B0027-001，目前僅取溫度，常態基準年份見 ClimateComparison.normalYears） */
export interface ClimateMonthNormal {
  month: number // 1-12
  meanTemperature: number
  maxTemperature: number
  minTemperature: number
}

/** 近期單筆逐時觀測（C-B0024-001） */
export interface ClimateHourlyReading {
  time: string
  temperature: number
  relativeHumidity: number | null
  precipitation: number | null
}

/** 前一整天的日彙總（C-B0024-001 的 stationObsStatistics，目前只有最新一天可取得） */
export interface ClimateDailySummary {
  date: string
  meanTemperature: number
  maxTemperature: number
  minTemperature: number
}

export interface ClimateComparison {
  stationId: string
  stationName: string
  /** 氣候平均值的基準區間，例如 [1991, 2020] */
  normalYears: [number, number]
  monthlyNormals: ClimateMonthNormal[]
  recentHourly: ClimateHourlyReading[]
  yesterday: ClimateDailySummary | null
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

export type CapSeverity = 'Minor' | 'Moderate' | 'Severe' | 'Extreme'
export type CapUrgency = 'Immediate' | 'Expected' | 'Future' | 'Past' | 'Unknown'
export type CapCertainty = 'Observed' | 'Likely' | 'Possible' | 'Unlikely' | 'Unknown'

/**
 * CAP 格式的官方特報詳情（W-C0033-003/004/005：豪雨／低溫／高溫，各自單一現象），只包含目前仍
 * 在有效期內的筆數——CWA 在沒有現行特報時仍會回傳最後一次發布的舊資料，不會自動清空，
 * 過期的一律由 normalizer 濾掉，不會出現在這裡。
 */
export interface CapAdvisory {
  event: string
  headline: string
  severity: CapSeverity
  urgency: CapUrgency
  certainty: CapCertainty
  effective: string
  expires: string
  description: string
  instruction: string | null
}

/**
 * 目前所有作用中特報公告的全文（W-C0033-002），跟 CountyWarning 的縣市矩陣是互補的兩個角度：
 * 矩陣答「哪個縣市有什麼」，這個答「這則特報完整在說什麼、影響哪些地方」。
 */
export interface WarningBulletin {
  title: string
  issueTime: string
  startTime: string | null
  endTime: string | null
  contentText: string
  hazards: Array<{ phenomena: string; significance: string; affectedAreas: string[] }>
}

export interface WarningDetail {
  bulletins: WarningBulletin[]
  advisories: CapAdvisory[]
}

// ---------------------------------------------------------------------------
// 健康氣象（M-A0085-001 熱傷害指數）
// ---------------------------------------------------------------------------

/** CWA 官方四級警示；'none' 對應原始資料的空字串（未達注意等級） */
export type HeatInjuryLevel = 'none' | 'caution' | 'watch' | 'danger' | 'high-danger'

export interface HeatInjuryReading {
  time: string
  index: number
  level: HeatInjuryLevel
}

/**
 * 單一鄉鎮的熱傷害指數序列（5 天、3 小時一格，共 39 筆）。
 * 全台摘要（/api/health/heat/summary）與單一鄉鎮明細（/api/health/heat/[county]/[town]）
 * 共用同一個形狀，差別只在前者是 368 筆鄉鎮陣列、後者是單一鄉鎮。
 */
export interface HeatInjuryTownForecast {
  county: string
  town: string
  coordinates: Coordinates
  readings: HeatInjuryReading[]
}

// ---------------------------------------------------------------------------
// 海象（浮標／潮位站觀測 + 潮汐預報）
// ---------------------------------------------------------------------------

export interface OceanReading {
  time: string
  tideHeight: number | null
  tideLevel: string | null
  waveHeight: number | null
  waveDirection: number | null
  wavePeriod: number | null
  seaTemperature: number | null
  windSpeed: number | null
  windDirection: number | null
}

/** 單一浮標／潮位站 48 小時觀測（O-B0075-001）。CWA 沒有提供這些站的中文站名或座標對照表，
 *  只有站號——見 app/utils/oceanBuoys.ts 開頭的說明，不在這裡假裝有更多資訊。 */
export interface OceanBuoyObservation {
  stationId: string
  readings: OceanReading[]
}

export interface TideLocation {
  id: string
  name: string
  coordinates: Coordinates
}

export interface TideEvent {
  time: string
  /** '滿潮' | '乾潮' */
  type: string
  /** 相對於海圖基準面的潮高（公分）——這個基準面下潮高恆為正值，比其他基準面更符合一般直覺 */
  heightCm: number
}

export interface TideDay {
  date: string
  lunarDate: string
  /** '大潮' | '中潮' | '小潮' */
  tideRange: string
  events: TideEvent[]
}

/** 單一地點未來 1 個月潮汐預報（F-A0021-001）。地點不限鄉鎮，也包含漁港、海水浴場、潛點等
 *  CWA 自訂的興趣點，見 TideLocation.id 對應的 LocationId 格式（純數字＝行政區，其餘為代碼字首）。 */
export interface TideForecast {
  location: TideLocation
  days: TideDay[]
}

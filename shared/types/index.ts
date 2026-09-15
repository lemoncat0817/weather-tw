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
  /** 當日月出／月沒（A-B0063-001）；null 表示該日確實無此現象（約每月一次），不是抓取失敗 */
  moonrise?: string | null
  moonset?: string | null
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
  /** 系統類別：已命名颱風或尚未命名的熱帶性低氣壓 */
  classification: 'typhoon' | 'tropical-depression'
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
// 海嘯資訊（E-A0014-001）
// ---------------------------------------------------------------------------

/** 警戒分區的預估波（實測 InfoStatus 目前只出現 'predict'）；分區固定 6 個
 *  （北部/東北/東部/東南/西南/海峽沿海地區，見 CWA 警戒分區劃分表） */
export interface TsunamiWarningArea {
  areaName: string
  areaDescription: string
  areaColor: string
  arrivalTime: string
  waveHeight: string
  infoStatus: string
}

/** 潮位站的實測波（實測 InfoStatus 目前只出現 'observe'），跟警戒分區是兩個不同精細度的角度——
 *  分區是官方預估轄區代表值，測站是實際觀測到的瞬間 */
export interface TsunamiStationReading {
  stationId: string
  stationName: string
  position: Coordinates
  arrivalTime: string
  waveHeight: string
  infoStatus: string
}

/**
 * 一筆海嘯資訊發布（E-A0014-001）。同一場海嘯事件（tsunamiNo 相同）會隨事態發展多次發布
 * （海嘯消息→海嘯警訊/警報→海嘯警報解除），各自一筆記錄，不像地震一次事件只有一筆——
 * 呼叫端若只想看目前是否仍有效，自行比對 validUntil。warningAreas/stations 只有實際評估
 * 出威脅時才有內容，「海嘯消息」這類已解除／無威脅的通報兩者皆為空陣列。
 */
export interface TsunamiReport {
  id: string
  tsunamiNo: number
  reportNo: string
  reportType: string
  reportColor: string
  reportContent: string
  issueTime: string
  validUntil: string | null
  web: string | null
  earthquake: {
    originTime: string
    source: string
    depthKm: number
    magnitude: number
    epicenter: Coordinates
    epicenterDescription: string
  }
  warningAreas: TsunamiWarningArea[]
  stations: TsunamiStationReading[]
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

/** 某月的雨量氣候常態（C-B0027-001 的 Precipitation 類別，跟溫度是同一份常態資料集裡的不同欄位） */
export interface ClimateMonthPrecipitationNormal {
  month: number // 1-12
  accumulationMm: number
}

/** 單日雨量（C-B0025-001）。trace（CWA 原始值 "T"，代表有下但不足 0.05mm）在這裡算成 0，
 *  不是 null——這份資料只用來畫累積雨量，trace 對總量的影響本來就微乎其微，比起讓呼叫端
 *  另外處理 null 造成累積和斷掉，算成 0 更單純；如果未來要做「降雨日數」這種在意「有沒有下」
 *  的統計，trace 就不能這樣算，需要另外處理。 */
export interface ClimateDailyRainfall {
  date: string
  precipitationMm: number
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

/**
 * 雨量／紫外線的補充資訊，刻意跟 ClimateComparison 分開成獨立端點與型別——這兩支上游
 * （C-B0025-001、O-A0005-001）比溫度比較用的兩支明顯不穩，合在同一個 Promise.all 時，
 * 只要其中一支慢（最長可能等到 fetchDataset 的 15 秒逾時），整頁溫度資料也會被拖著一起卡住、
 * 畫面卡在「載入氣候資料中…」出不來。拆開後主要內容（溫度）不受這兩支拖累，前端也用
 * server:false 背景抓取、抓到才補上對應區塊，不阻塞頁面其餘部分。
 */
export interface ClimateExtras {
  monthlyPrecipitationNormals: ClimateMonthPrecipitationNormal[]
  /** 今年至今每日雨量（跟著 C-B0025-001 上游一起變動，通常涵蓋 1/1 到最近有資料的一天） */
  dailyRainfall: ClimateDailyRainfall[]
  /** 當日紫外線指數最大值（O-A0005-001）；跟 /observation 的即時 UV 是不同角度——這是「今天
   *  峰值」，即時 UV 是「現在這一刻」。上游沒有資料或請求失敗時為 null。 */
  todayMaxUvIndex: number | null
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
// 健康氣象（CWA「健康氣象」系列共用形狀：熱傷害 M-A0085-001、冷傷害 F-A0085-003、
// 溫差提醒 F-A0085-005，同一套系統依相同殼架構產生，只有指數/警示的因子名稱不同）
// ---------------------------------------------------------------------------

/** CWA 官方四級警示；'none' 對應原始資料的空字串（未達注意等級） */
export type HealthIndexLevel = 'none' | 'caution' | 'watch' | 'danger' | 'high-danger'

export interface HealthIndexReading {
  time: string
  index: number
  level: HealthIndexLevel
}

/**
 * 單一鄉鎮的健康氣象指數序列。全台摘要（.../summary）與單一鄉鎮明細（.../[county]/[town]）
 * 共用同一個形狀，差別只在前者是全台鄉鎮陣列、後者是單一鄉鎮；序列長度依上游資料集的
 * 涵蓋範圍而不同（熱傷害 5 天/39 筆，冷傷害與溫差提醒是 72 小時/24 筆）。
 */
export interface HealthIndexTownForecast {
  county: string
  town: string
  coordinates: Coordinates
  readings: HealthIndexReading[]
}

// 以下三組別名對應各自的上游資料集，型別上完全相同（同一套系統的三個因子），
// 只是讓呼叫端用領域名稱而不是泛用名稱，讀起來更清楚是哪個指數
export type HeatInjuryLevel = HealthIndexLevel
export type HeatInjuryReading = HealthIndexReading
export type HeatInjuryTownForecast = HealthIndexTownForecast

export type ColdInjuryLevel = HealthIndexLevel
export type ColdInjuryReading = HealthIndexReading
export type ColdInjuryTownForecast = HealthIndexTownForecast

export type TemperatureDifferenceLevel = HealthIndexLevel
export type TemperatureDifferenceReading = HealthIndexReading
export type TemperatureDifferenceTownForecast = HealthIndexTownForecast

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

// ---------------------------------------------------------------------------
// 空氣品質（環境部環境資料開放平臺，非 CWA；AQX_P_432 即時 AQI ＋ AQX_P_07 測站資料）
// ---------------------------------------------------------------------------

/** 環境部官方六級 AQI 分類（依 status 欄位的中文字串對應）；'unavailable' 對應測站
 *  維護或缺值時的空字串，不是硬塞成某個等級。 */
export type AirQualityLevel =
  | 'good'
  | 'moderate'
  | 'unhealthy-sensitive'
  | 'unhealthy'
  | 'very-unhealthy'
  | 'hazardous'
  | 'unavailable'

/** 單一測站的即時空氣品質（AQX_P_432），本身就帶座標，不需要跟其他資料集 join。 */
export interface AirQualityStation {
  siteName: string
  county: string
  coordinates: Coordinates
  aqi: number | null
  level: AirQualityLevel
  /** 首要污染物（原始 pollutant 欄位），無資料或狀態良好時為 null */
  majorPollutant: string | null
  pm25: number | null
  pm10: number | null
  o3: number | null
  so2: number | null
  co: number | null
  no2: number | null
  publishTime: string
}

// ---------------------------------------------------------------------------
// 水庫水情（經濟部水利署水利資料開放平台，非 CWA；水庫水情 + 水庫每日營運狀況，全程免金鑰）
// ---------------------------------------------------------------------------

/**
 * 單一水庫最新一筆水情（水庫水情即時資料，跟水庫每日營運狀況的容量規格 join 後的結果）。
 * 只收錄能找到容量規格與座標對照（見 server/utils/reservoirCoords.ts）的水庫；水情資料集裡
 * 另外還有約 30 個沒有規格資料的小型埤塘，一律濾掉。
 */
export interface ReservoirStatus {
  id: string
  name: string
  coordinates: Coordinates
  observationTime: string
  /** 水位（公尺） */
  waterLevel: number | null
  /**
   * 蓄水率（%）＝即時有效蓄水量 ÷ 水庫每日營運狀況的有效庫容量。兩者其中一個缺值時為
   * null，不強行湊出一個看似合理但其實沒意義的數字。已對照經濟部水利署防災資訊網
   * （fhy.wra.gov.tw/fhyv2/monitor/reservoir）目前顯示值逐一核對過分母來源，見
   * server/utils/normalize/reservoir.ts 的完整說明——水利署另外還公告一份「水庫基本資料」，
   * 裡面同樣有一個「目前有效容量」欄位，聽起來像同一件事，實際上是不同的數字，
   * 千萬別搞混。
   */
  storagePercentage: number | null
  /** 進流量、出流量（CMS，立方公尺/秒）——依業界慣例標示單位，官方文件沒有逐欄位附單位說明 */
  inflow: number | null
  outflow: number | null
}

// ---------------------------------------------------------------------------
// 河川即時水位（經濟部水利署水利資料開放平台，非 CWA；即時水位 + 河川水位測站站況）
// ---------------------------------------------------------------------------

/**
 * 三級警戒門檻由低到高：level3 最先觸發（水位剛開始偏高），level1 最嚴重。跟 CWA
 * 其餘四級警示（'none'|'caution'|'watch'|...）不同名，是因為官方本來就用「一二三級」
 * 稱呼，硬套 CWA 那套用詞反而失真。'unavailable' 對應沒有門檻資料或讀值本身不可信
 * （測站回報「近期水位變化超過 3.5m」「高於堤頂高」這類 QC 異常時，一律當作沒有讀值）。
 */
export type RiverAlertLevel = 'normal' | 'level3' | 'level2' | 'level1' | 'unavailable'

/**
 * 單一測站的即時水位（即時水位資料跟河川水位測站站況 join 後的結果）。只收錄站況資料
 * 有座標、且能跟即時資料對上站號的測站——即時水位的 stationid（8 碼）是站況
 * observatoryidentifier（帶流域前綴的長碼）的後 8 碼，兩邊格式不一致，見
 * server/utils/normalize/river.ts 的 join 邏輯。
 */
export interface RiverStation {
  id: string
  name: string
  river: string
  coordinates: Coordinates
  observationTime: string
  waterLevel: number | null
  alertLevel: RiverAlertLevel
  /** 三級警戒門檻原始值（公尺），供 UI 顯示「目前水位 vs. 門檻」——不是每站都有齊三個，
   *  常見只公告一到兩級 */
  alertThresholds: { level1: number | null; level2: number | null; level3: number | null }
}

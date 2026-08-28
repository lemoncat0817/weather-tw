import type { OceanBuoyObservation, OceanReading, TideDay, TideEvent, TideForecast, TideLocation } from '#shared/types'

// ---------------------------------------------------------------------------
// O-B0075-001：浮標站與潮位站海況監測（48 小時）
// ---------------------------------------------------------------------------

interface CwaAnemometer {
  WindSpeed?: string
  WindDirection?: string
}
interface CwaOceanWeatherElements {
  TideHeight?: string
  TideLevel?: string
  WaveHeight?: string
  WaveDirection?: string
  WavePeriod?: string
  SeaTemperature?: string
  PrimaryAnemometer?: CwaAnemometer
}
interface CwaOceanObsTime {
  DateTime: string
  WeatherElements: CwaOceanWeatherElements
}
interface CwaOceanLocation {
  Station: { StationID: string }
  StationObsTimes: { StationObsTime: CwaOceanObsTime[] }
}
// 注意：頂層是大寫 Records，跟其他 datastore 資料集慣用的小寫 records 不同
interface CwaOceanResponse {
  Records?: { SeaSurfaceObs?: { Location?: CwaOceanLocation[] } }
}

/** 缺值哨兵是字串 "None"，不是其他觀測資料集慣用的 -99 這類數字標記 */
function toOceanReading(v: string | undefined): number | null {
  if (v === undefined || v === 'None') return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

/**
 * 跟熱傷害指數（M-A0085-001）同一套底層系統、同一個陷阱：CWA 回傳的觀測時間陣列順序不保證
 * 遞增（實測同一測站前幾筆是 13:00 → 隔天 03:00 → 回跳 20:00），一定要重新排序，
 * 否則折線圖會被畫成鋸齒。
 */
export function normalizeOceanBuoy(raw: CwaOceanResponse): OceanBuoyObservation | null {
  const loc = raw.Records?.SeaSurfaceObs?.Location?.[0]
  if (!loc) return null

  const readings: OceanReading[] = (loc.StationObsTimes.StationObsTime ?? [])
    .map((t) => {
      const we = t.WeatherElements
      return {
        time: t.DateTime,
        tideHeight: toOceanReading(we.TideHeight),
        tideLevel: we.TideLevel && we.TideLevel !== '-' ? we.TideLevel : null,
        waveHeight: toOceanReading(we.WaveHeight),
        waveDirection: toOceanReading(we.WaveDirection),
        wavePeriod: toOceanReading(we.WavePeriod),
        seaTemperature: toOceanReading(we.SeaTemperature),
        windSpeed: toOceanReading(we.PrimaryAnemometer?.WindSpeed),
        windDirection: toOceanReading(we.PrimaryAnemometer?.WindDirection)
      }
    })
    .sort((a, b) => a.time.localeCompare(b.time))

  return { stationId: loc.Station.StationID, readings }
}

// ---------------------------------------------------------------------------
// F-A0021-001：未來 1 個月潮汐預報
// ---------------------------------------------------------------------------

interface CwaTideTime {
  DateTime: string
  Tide: string
  TideHeights: { AboveChartDatum: number }
}
interface CwaTideDaily {
  Date: string
  LunarDate: string
  TideRange: string
  Time: CwaTideTime[]
}
interface CwaTideLocationEntry {
  LocationId: string
  LocationName: string
  Latitude: number
  Longitude: number
  TimePeriods: { Daily: CwaTideDaily[] }
}
interface CwaTideResponse {
  records: { TideForecasts?: Array<{ Location: CwaTideLocationEntry }> }
}

function toTideLocation(entry: CwaTideLocationEntry): TideLocation {
  return { id: entry.LocationId, name: entry.LocationName, coordinates: { lat: entry.Latitude, lon: entry.Longitude } }
}

/** 地點清單（不只是鄉鎮，也含漁港、海水浴場、潛點等 CWA 自訂興趣點），供選單使用 */
export function normalizeTideLocations(raw: CwaTideResponse): TideLocation[] {
  return (raw.records.TideForecasts ?? []).map((tf) => toTideLocation(tf.Location))
}

/**
 * 單一地點的完整預報，呼叫端需帶 LocationId 或 LocationName 篩選只剩一筆。
 *
 * 實測 Daily 陣列本身順序打散（跟 M-A0085-001／O-B0075-001 是同一套底層系統、同一個陷阱），
 * 例如 32 天的陣列會是 9/2、9/28、9/20、8/29… 這種跳來跳去的順序，一定要依日期重新排序，
 * 否則表格/圖表會整段錯亂。日內的 Time（滿潮/乾潮事件）本身是照時間排的，不受影響。
 */
export function normalizeTideForecast(raw: CwaTideResponse): TideForecast | null {
  const entry = raw.records.TideForecasts?.[0]?.Location
  if (!entry) return null

  const days: TideDay[] = entry.TimePeriods.Daily.map((d) => {
    const events: TideEvent[] = d.Time.map((t) => ({
      time: t.DateTime,
      type: t.Tide,
      heightCm: t.TideHeights.AboveChartDatum
    }))
    return { date: d.Date, lunarDate: d.LunarDate, tideRange: d.TideRange, events }
  }).sort((a, b) => a.date.localeCompare(b.date))

  return { location: toTideLocation(entry), days }
}
